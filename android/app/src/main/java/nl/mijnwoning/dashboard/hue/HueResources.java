package nl.mijnwoning.dashboard.hue;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/** Never forward auth/application resources, legacy URLs or API keys to JavaScript. */
public final class HueResources {
    private static final Set<String> TYPES = new HashSet<>(Arrays.asList("light", "scene", "room", "zone", "device", "zigbee_connectivity", "grouped_light"));
    public static JSONObject sanitize(JSONObject response) throws Exception {
        if (response.optJSONArray("errors") == null || response.getJSONArray("errors").length() != 0 || response.optJSONArray("data") == null) throw new IllegalStateException("HUE_RESPONSE");
        JSONArray filtered = new JSONArray(); JSONArray data = response.getJSONArray("data");
        for (int i=0;i<data.length();i++) {
            JSONObject raw = data.optJSONObject(i);
            if (raw == null || !TYPES.contains(raw.optString("type"))) continue;
            JSONObject out = new JSONObject();
            for (String key : Arrays.asList("id", "type", "metadata", "owner", "on", "dimming", "color_temperature", "color", "services", "children", "group", "status")) {
                if (raw.has(key)) out.put(key, raw.get(key));
            }
            filtered.put(out);
        }
        return new JSONObject().put("errors", new JSONArray()).put("data", filtered);
    }
    private HueResources() {}
}
