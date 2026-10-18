package nl.mijnwoning.dashboard;

import android.content.Context;
import android.net.Uri;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.net.wifi.WifiManager;
import android.os.Handler;
import android.os.Looper;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import javax.net.ssl.SSLException;
import org.json.JSONArray;
import org.json.JSONObject;
import nl.mijnwoning.dashboard.hue.HueCredentials;
import nl.mijnwoning.dashboard.hue.HuePolicy;
import nl.mijnwoning.dashboard.hue.HueTransport;
import nl.mijnwoning.dashboard.hue.HueResources;

@CapacitorPlugin(name = "HueBridge")
public class HueBridgePlugin extends Plugin {
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private HueCredentials credentials;
    private interface Operation { JSObject run() throws Exception; }
    @Override public void load() { credentials = new HueCredentials(getContext()); }
    private void trusted(PluginCall call, Runnable operation) {
        getActivity().runOnUiThread(() -> {
            Uri origin = Uri.parse(getBridge().getWebView().getUrl());
            if (!"https".equals(origin.getScheme()) || !"localhost".equals(origin.getHost())) { call.reject("Deze koppeling is alleen beschikbaar vanuit de ingebouwde app.", "HUE_ORIGIN"); return; }
            operation.run();
        });
    }
    private void run(PluginCall call, Operation operation) {
        trusted(call, () -> executor.execute(() -> {
            try { call.resolve(operation.run()); }
            catch (IllegalArgumentException e) { call.reject(e.getMessage(), "HUE_INPUT"); }
            catch (SSLException e) { call.reject("Het Hue-certificaat kon niet worden gecontroleerd. Controleer datum/tijd en werk de Bridge bij via de Hue-app.", "HUE_TLS"); }
            catch (SecurityException e) { call.reject("De Hue-toegang is niet meer geldig. Koppel de Bridge opnieuw.", "HUE_AUTH"); }
            catch (java.net.SocketTimeoutException e) { call.reject("De Bridge reageert niet op tijd. Controleer je wifi en het Bridge-adres.", "HUE_TIMEOUT"); }
            catch (Exception e) { call.reject("De Hue-opdracht is niet bevestigd. Controleer je thuisnetwerk en probeer opnieuw.", "HUE_UNREACHABLE"); }
        }));
    }
    private JSObject safeBridge(JSONObject config) throws Exception {
        JSObject bridge = new JSObject(); bridge.put("ip", config.getString("ip")); bridge.put("id", config.getString("id")); bridge.put("name", config.optString("name", "Hue Bridge")); return bridge;
    }
    private JSONObject requireCredentials() throws Exception {
        JSONObject data = credentials.load(); if (data == null) throw new SecurityException("HUE_AUTH"); return data;
    }
    private JSONObject resources(JSONObject config) throws Exception {
        HueTransport transport = new HueTransport(getContext());
        String text = transport.request(config.getString("ip"), config.getString("id"), config.getString("key"), "GET", "/clip/v2/resource", null).text;
        JSONObject response = new JSONObject(text);
        if (response.optJSONArray("errors") == null || response.getJSONArray("errors").length() > 0 || response.optJSONArray("data") == null) throw new IllegalStateException("HUE_RESPONSE");
        return HueResources.sanitize(response);
    }
    @PluginMethod public void status(PluginCall call) {
        run(call, () -> { JSONObject data = credentials.load(); JSObject result = new JSObject(); result.put("paired", data != null); if (data != null) result.put("bridge", safeBridge(data)); return result; });
    }
    @PluginMethod public void inspect(PluginCall call) {
        run(call, () -> {
            String ip = HuePolicy.localIp(call.getString("ip"));
            HueTransport.Result result = new HueTransport(getContext()).request(ip, null, null, "GET", "/api/config", null);
            JSONObject config = new JSONObject(result.text);
            String id = HuePolicy.bridgeId(config.optString("bridgeid"));
            if (!id.equals(result.certificateId)) throw new SecurityException("HUE_AUTH");
            JSObject bridge = new JSObject(); bridge.put("ip", ip); bridge.put("id", id); bridge.put("name", config.optString("name", "Hue Bridge")); bridge.put("model", config.optString("modelid", "")); return bridge;
        });
    }
    @PluginMethod public void pair(PluginCall call) {
        run(call, () -> {
            String ip = HuePolicy.localIp(call.getString("ip")), id = HuePolicy.bridgeId(call.getString("bridgeId"));
            JSONObject payload = new JSONObject().put("devicetype", "mijnwoning#android");
            HueTransport transport = new HueTransport(getContext());
            JSONArray response = new JSONArray(transport.request(ip, id, null, "POST", "/api", payload).text);
            if (response.length() == 0) throw new IllegalStateException("HUE_RESPONSE");
            JSONObject first = response.getJSONObject(0);
            if (first.has("error")) {
                int type = first.getJSONObject("error").optInt("type");
                if (type == 101) throw new IllegalArgumentException("Druk eerst op de ronde knop van je Hue Bridge en probeer binnen 30 seconden opnieuw.");
                throw new IllegalStateException("HUE_RESPONSE");
            }
            String key = first.getJSONObject("success").getString("username");
            if (key.isEmpty()) throw new IllegalStateException("HUE_RESPONSE");
            JSONObject config = new JSONObject().put("ip", ip).put("id", id).put("key", key).put("name", call.getString("name", "Hue Bridge"));
            JSONObject snapshot = resources(config); // Read-only validation before saving or enabling LIVE.
            credentials.save(config);
            JSObject result = new JSObject(snapshot.toString()); result.put("bridge", safeBridge(config)); return result;
        });
    }
    @PluginMethod public void getResources(PluginCall call) {
        run(call, () -> { JSONObject config = requireCredentials(); JSObject result = new JSObject(resources(config).toString()); result.put("bridge", safeBridge(config)); return result; });
    }
    private JSObject command(JSONObject config, String path, JSONObject payload) throws Exception {
        String text = new HueTransport(getContext()).request(config.getString("ip"), config.getString("id"), config.getString("key"), "PUT", path, payload).text;
        JSONObject response = new JSONObject(text);
        if (response.optJSONArray("errors") == null || response.getJSONArray("errors").length() > 0) throw new IllegalStateException("HUE_RESPONSE");
        JSObject result = new JSObject(); result.put("confirmed", true); return result;
    }
    @PluginMethod public void activateScene(PluginCall call) {
        run(call, () -> command(requireCredentials(), "/clip/v2/resource/scene/" + HuePolicy.resourceId(call.getString("id")), new JSONObject().put("recall", new JSONObject().put("action", "active"))));
    }
    @PluginMethod public void setLight(PluginCall call) {
        run(call, () -> {
            String id = HuePolicy.resourceId(call.getString("id")); JSONObject payload = new JSONObject();
            Boolean on = call.getBoolean("on"); Double brightness = call.getDouble("brightness"), mirek = call.getDouble("mirek"), x = call.getDouble("x"), y = call.getDouble("y");
            if (on != null) payload.put("on", new JSONObject().put("on", on));
            if (brightness != null) payload.put("dimming", new JSONObject().put("brightness", HuePolicy.range(brightness, 0, 100)));
            if (mirek != null) payload.put("color_temperature", new JSONObject().put("mirek", (int) HuePolicy.range(mirek, 153, 500)));
            if (x != null || y != null) {
                if (x == null || y == null) throw new IllegalArgumentException("Kies een volledige lichtkleur.");
                HuePolicy.range(x, 0, 1); HuePolicy.range(y, 0, 1); if (x + y > 1) throw new IllegalArgumentException("Ongeldige lichtkleur.");
                payload.put("color", new JSONObject().put("xy", new JSONObject().put("x", x).put("y", y)));
            }
            if (payload.length() == 0) throw new IllegalArgumentException("Kies een lichtinstelling.");
            return command(requireCredentials(), "/clip/v2/resource/light/" + id, payload);
        });
    }
    @PluginMethod public void disconnect(PluginCall call) { run(call, () -> { credentials.clear(); return new JSObject(); }); }
    private JSObject discoveryResult(ConcurrentHashMap<String, JSObject> found) {
        JSArray list = new JSArray(); for (JSObject item : found.values()) list.put(item);
        JSObject result = new JSObject(); result.put("bridges", list); return result;
    }
    @PluginMethod public void discover(PluginCall call) {
        trusted(call, () -> {
            NsdManager manager = (NsdManager) getContext().getSystemService(Context.NSD_SERVICE);
            WifiManager wifi = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            WifiManager.MulticastLock lock = wifi.createMulticastLock("mijnwoning-hue-discovery"); lock.setReferenceCounted(false); lock.acquire();
            ConcurrentHashMap<String, JSObject> found = new ConcurrentHashMap<>(); AtomicBoolean finished = new AtomicBoolean(false);
            NsdManager.DiscoveryListener listener = new NsdManager.DiscoveryListener() {
                @Override public void onDiscoveryStarted(String type) {}
                @Override public void onDiscoveryStopped(String type) {}
                @Override public void onServiceLost(NsdServiceInfo info) {}
                @Override public void onStartDiscoveryFailed(String type, int code) { finish(); }
                @Override public void onStopDiscoveryFailed(String type, int code) { finish(); }
                private void finish() { if (finished.compareAndSet(false, true)) { if (lock.isHeld()) lock.release(); call.resolve(discoveryResult(found)); } }
                @Override public void onServiceFound(NsdServiceInfo info) {
                    manager.resolveService(info, new NsdManager.ResolveListener() {
                        @Override public void onResolveFailed(NsdServiceInfo service, int code) {}
                        @Override public void onServiceResolved(NsdServiceInfo service) {
                            if (finished.get() || service.getHost() == null) return;
                            try { String ip = HuePolicy.localIp(service.getHost().getHostAddress()); JSObject item = new JSObject(); item.put("ip", ip); item.put("name", service.getServiceName()); found.put(ip, item); } catch (IllegalArgumentException ignored) {}
                        }
                    });
                }
            };
            try {
                manager.discoverServices("_hue._tcp.", NsdManager.PROTOCOL_DNS_SD, listener);
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    if (finished.compareAndSet(false, true)) {
                        try { manager.stopServiceDiscovery(listener); } catch (IllegalArgumentException ignored) {}
                        if (lock.isHeld()) lock.release(); call.resolve(discoveryResult(found));
                    }
                }, 5500);
            } catch (Exception failure) { if (lock.isHeld()) lock.release(); call.reject("Zoeken is niet beschikbaar. Vul het lokale IP-adres handmatig in.", "HUE_DISCOVERY"); }
        });
    }
    @Override protected void handleOnDestroy() { executor.shutdownNow(); super.handleOnDestroy(); }
}
