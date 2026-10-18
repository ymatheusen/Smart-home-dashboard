package nl.mijnwoning.dashboard;

import android.net.Uri;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Iterator;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;
import nl.mijnwoning.dashboard.shelly.ShellyCredentials;
import nl.mijnwoning.dashboard.shelly.ShellyPolicy;
import nl.mijnwoning.dashboard.shelly.ShellyTransport;

@CapacitorPlugin(name = "Shelly")
public class ShellyPlugin extends Plugin {
    private final ExecutorService workers = Executors.newFixedThreadPool(4);
    private final ConcurrentHashMap<String, ExecutorService> commands = new ConcurrentHashMap<>();
    private ShellyCredentials credentials;
    private interface Operation { JSObject run() throws Exception; }
    @Override public void load() { credentials = new ShellyCredentials(getContext()); }
    private void run(PluginCall call, Operation operation) {
        getActivity().runOnUiThread(() -> {
            Uri origin = Uri.parse(getBridge().getWebView().getUrl());
            if (!"https".equals(origin.getScheme()) || !"localhost".equals(origin.getHost())) { call.reject("Open hiervoor de Android-app.", "SHELLY_ORIGIN"); return; }
            ExecutorService target = workers;
            if ("command".equals(call.getMethodName())) {
                try { target = commands.computeIfAbsent(ShellyPolicy.id(call.getString("id")), id -> Executors.newSingleThreadExecutor()); }
                catch (IllegalArgumentException e) { call.reject(e.getMessage(), "SHELLY_INPUT"); return; }
            }
            target.execute(() -> {
                try { call.resolve(operation.run()); }
                catch (SecurityException e) { call.reject("De Shelly vraagt een wachtwoord of het wachtwoord is onjuist. Voeg de module opnieuw toe met het lokale wachtwoord.", "SHELLY_AUTH"); }
                catch (IllegalArgumentException e) { call.reject(e.getMessage(), "SHELLY_INPUT"); }
                catch (Exception e) { call.reject("Geen bevestiging van de Shelly. Controleer je thuisnetwerk, IP-adres en de Shelly-app. Een opdracht wordt niet automatisch opnieuw verstuurd.", "SHELLY_UNREACHABLE"); }
            });
        });
    }
    private JSONObject require(String id) throws Exception {
        JSONObject config = credentials.load().optJSONObject(ShellyPolicy.id(id));
        if (config == null) throw new IllegalArgumentException("Voeg deze Shelly eerst toe.");
        return config;
    }
    private JSONObject read(JSONObject config) throws Exception {
        String ip = config.getString("ip"), password = config.getString("password");
        ShellyTransport transport = new ShellyTransport();
        JSONObject info = transport.info(ip); ShellyPolicy.identity(info, config.getString("id"));
        JSONObject status = transport.rpc(ip, password, "Shelly.GetStatus", new JSONObject());
        JSONObject settings = transport.rpc(ip, password, "Shelly.GetConfig", new JSONObject());
        return ShellyPolicy.snapshot(info, status, settings, ip, config.getString("name"));
    }
    @PluginMethod public void list(PluginCall call) {
        run(call, () -> {
            JSONObject all = credentials.load(); JSArray devices = new JSArray();
            for (Iterator<String> keys = all.keys(); keys.hasNext();) {
                JSONObject config = all.getJSONObject(keys.next());
                // Offline metadata contains no credentials or cached state presented as live.
                devices.put(new JSONObject().put("id", config.getString("id")).put("ip", config.getString("ip")).put("name", config.getString("name")).put("profile", config.optString("profile", "switch")));
            }
            JSObject result = new JSObject(); result.put("devices", devices); return result;
        });
    }
    @PluginMethod public void add(PluginCall call) {
        run(call, () -> {
            String ip = ShellyPolicy.ip(call.getString("ip")), name = call.getString("name", "Shelly Plus 2PM").trim();
            if (name.isEmpty() || name.length() > 60) throw new IllegalArgumentException("Kies een apparaatnaam van maximaal 60 tekens.");
            String password = call.getString("password", "");
            if (password.length() > 256) throw new IllegalArgumentException("Het wachtwoord is te lang.");
            JSONObject info = new ShellyTransport().info(ip);
            String id = ShellyPolicy.id(info.optString("id")); ShellyPolicy.identity(info, id);
            JSONObject config = new JSONObject().put("id", id).put("ip", ip).put("name", name).put("password", password);
            JSONObject snapshot = read(config); // Only reads: never moves a cover or toggles a relay on pairing.
            config.put("profile", snapshot.getString("profile"));
            credentials.put(id, config);
            return new JSObject(snapshot.toString());
        });
    }
    @PluginMethod public void getDevice(PluginCall call) { run(call, () -> new JSObject(read(require(call.getString("id"))).toString())); }
    @PluginMethod public void remove(PluginCall call) { run(call, () -> { credentials.remove(ShellyPolicy.id(call.getString("id"))); return new JSObject(); }); }
    @PluginMethod public void command(PluginCall call) {
        run(call, () -> {
            JSONObject config = require(call.getString("id"));
            int channel = ShellyPolicy.integer(call.getData().opt("channel"), 0, 1);
            Integer position = call.getData().has("position") ? ShellyPolicy.integer(call.getData().opt("position"), 0, 100) : null;
            String action = call.getString("action", "");
            ShellyTransport transport = new ShellyTransport();
            JSONObject info = transport.info(config.getString("ip")); ShellyPolicy.identity(info, config.getString("id"));
            if ("stop".equals(action)) {
                if (channel != 0 || !"cover".equals(info.optString("profile"))) throw new IllegalArgumentException("Dit kanaal is geen rolluik.");
                transport.rpc(config.getString("ip"), config.getString("password"), "Cover.Stop", new JSONObject().put("id", channel));
                JSObject stopped = new JSObject(); stopped.put("confirmed", true); return stopped;
            }
            // Re-read the profile and status before each movement: never drive switch relays as a cover.
            JSONObject status = transport.rpc(config.getString("ip"), config.getString("password"), "Shelly.GetStatus", new JSONObject());
            JSONObject snapshot = ShellyPolicy.snapshot(info, status, new JSONObject(), config.getString("ip"), config.getString("name"));
            String method = ShellyPolicy.command(snapshot, channel, action, position);
            JSONObject params = new JSONObject().put("id", channel);
            if ("Switch.Set".equals(method)) params.put("on", "on".equals(action));
            if ("Cover.GoToPosition".equals(method)) params.put("pos", position);
            transport.rpc(config.getString("ip"), config.getString("password"), method, params);
            JSObject result = new JSObject(); result.put("confirmed", true); return result;
        });
    }
    @Override protected void handleOnDestroy() { workers.shutdownNow(); for (ExecutorService executor : commands.values()) executor.shutdownNow(); super.handleOnDestroy(); }
}
