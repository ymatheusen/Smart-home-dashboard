package nl.mijnwoning.dashboard.shelly;

import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/** Only supported Gen 2 devices and their configured components can be controlled. */
public final class ShellyPolicy {
    public static String ip(String value) {
        try { return nl.mijnwoning.dashboard.hue.HuePolicy.localIp(value); }
        catch (IllegalArgumentException e) { throw new IllegalArgumentException("Vul het lokale IPv4-adres van je Shelly in, zonder http of poort."); }
    }
    public static String id(String value) {
        if (value == null || !value.toLowerCase(Locale.ROOT).matches("shellyplus2pm-[a-f0-9]{12}")) throw new IllegalArgumentException("Dit apparaat is geen herkenbare Shelly Plus 2PM.");
        return value.toLowerCase(Locale.ROOT);
    }
    public static int integer(Object value, int min, int max) {
        if (!(value instanceof Number)) throw new IllegalArgumentException("Kies een geldige gehele bedieningswaarde.");
        double n = ((Number) value).doubleValue();
        if (!Double.isFinite(n) || n != Math.rint(n) || n < min || n > max) throw new IllegalArgumentException("Kies een geldige gehele bedieningswaarde.");
        return (int) n;
    }
    public static void identity(JSONObject info, String expected) throws Exception {
        if (info.optInt("gen") != 2 || !"Plus2PM".equals(info.optString("app")) || !id(info.optString("id")).equals(id(expected))) throw new IllegalArgumentException("De apparaatidentiteit komt niet overeen. Controleer het IP-adres en voeg de module opnieuw toe.");
    }
    public static JSONObject snapshot(JSONObject info, JSONObject status, JSONObject config, String ip, String label) throws Exception {
        String deviceId = id(info.getString("id")); identity(info, deviceId);
        String profile = info.optString("profile");
        if (!"cover".equals(profile) && !"switch".equals(profile)) throw new IllegalArgumentException("Stel de module eerst in de Shelly-app in als rolluik of schakelaar.");
        JSONArray channels = new JSONArray();
        for (int index = 0; index < ("cover".equals(profile) ? 1 : 2); index++) {
            String key = profile + ":" + index;
            JSONObject source = status.optJSONObject(key);
            if (source == null || source.optInt("id", -1) != index) throw new IllegalStateException("SHELLY_RESPONSE");
            JSONObject settings = config.optJSONObject(key);
            Object rawName = settings == null ? null : settings.opt("name");
            String name = rawName instanceof String ? ((String) rawName).trim() : "";
            if ("null".equalsIgnoreCase(name) || "undefined".equalsIgnoreCase(name)) name = "";
            if (name.isEmpty()) name = "cover".equals(profile) ? label : label + " · lamp " + (index + 1);
            JSONObject channel = new JSONObject().put("id", index).put("kind", profile).put("name", name);
            JSONArray errors = source.optJSONArray("errors");
            channel.put("fault", errors != null && errors.length() > 0);
            if ("cover".equals(profile)) {
                String state = source.optString("state");
                if (!state.matches("open|closed|opening|closing|stopped|calibrating")) throw new IllegalStateException("SHELLY_RESPONSE");
                channel.put("state", state);
                boolean calibrated = source.optBoolean("pos_control", false);
                channel.put("calibrated", calibrated);
                Object pos = source.opt("current_pos");
                channel.put("position", calibrated && pos instanceof Number && Double.isFinite(((Number) pos).doubleValue()) && ((Number) pos).doubleValue() >= 0 && ((Number) pos).doubleValue() <= 100 ? pos : JSONObject.NULL);
            } else {
                if (!(source.opt("output") instanceof Boolean)) throw new IllegalStateException("SHELLY_RESPONSE");
                channel.put("on", source.getBoolean("output"));
            }
            Object power = source.opt("apower");
            if (power instanceof Number && Double.isFinite(((Number) power).doubleValue())) channel.put("power", power);
            channels.put(channel);
        }
        return new JSONObject().put("id", deviceId).put("ip", ip).put("name", label).put("profile", profile).put("channels", channels).put("available", true);
    }
    public static String command(JSONObject device, int channelId, String action, Integer position) throws Exception {
        JSONObject selected = null;
        JSONArray channels = device.getJSONArray("channels");
        for (int i = 0; i < channels.length(); i++) if (channels.getJSONObject(i).getInt("id") == channelId) selected = channels.getJSONObject(i);
        if (selected == null) throw new IllegalArgumentException("Dit kanaal bestaat niet op deze module.");
        if ("switch".equals(device.getString("profile"))) {
            if (!"on".equals(action) && !"off".equals(action)) throw new IllegalArgumentException("Dit kanaal is een lichtschakelaar.");
            if (selected.getBoolean("fault")) throw new IllegalArgumentException("De module meldt een storing. Controleer de Shelly-app.");
            return "Switch.Set";
        }
        // Stop is always available, including a fault or external calibration in progress.
        if ("stop".equals(action)) return "Cover.Stop";
        if (selected.getBoolean("fault") || "calibrating".equals(selected.getString("state"))) throw new IllegalArgumentException("De module meldt een storing of kalibratie. Alleen stoppen is beschikbaar.");
        if ("open".equals(action)) return "Cover.Open";
        if ("close".equals(action)) return "Cover.Close";
        if ("position".equals(action)) {
            if (!selected.getBoolean("calibrated") || position == null || position < 0 || position > 100) throw new IllegalArgumentException("Procentbediening vereist een gekalibreerd rolluik en een waarde van 0 tot 100.");
            return "Cover.GoToPosition";
        }
        throw new IllegalArgumentException("Ongeldige rolluikopdracht.");
    }
    private ShellyPolicy() {}
}
