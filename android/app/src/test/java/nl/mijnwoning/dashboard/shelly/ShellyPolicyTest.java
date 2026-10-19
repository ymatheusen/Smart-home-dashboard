package nl.mijnwoning.dashboard.shelly;

import org.junit.Test;
import static org.junit.Assert.*;
import org.json.JSONObject;

public class ShellyPolicyTest {
    @Test public void missingAndNullNamesUseReadableFallbacks() throws Exception {
        JSONObject status = new JSONObject("{\"switch:0\":{\"id\":0,\"output\":true},\"switch:1\":{\"id\":1,\"output\":false}}");
        for (Object name : new Object[]{JSONObject.NULL, "null", " undefined ", "  ", 123}) {
            JSONObject config = new JSONObject().put("switch:0", new JSONObject().put("name", name));
            JSONObject device = ShellyPolicy.snapshot(info("switch"), status, config, "192.168.1.51", "Verlichting");
            assertEquals("Verlichting · lamp 1", device.getJSONArray("channels").getJSONObject(0).getString("name"));
            assertEquals("Verlichting · lamp 2", device.getJSONArray("channels").getJSONObject(1).getString("name"));
        }
        JSONObject coverStatus = new JSONObject("{\"cover:0\":{\"id\":0,\"state\":\"stopped\",\"pos_control\":false}}");
        JSONObject coverConfig = new JSONObject("{\"cover:0\":{\"name\":null}}");
        assertEquals("Rolluik salon", ShellyPolicy.snapshot(info("cover"), coverStatus, coverConfig, "192.168.1.50", "Rolluik salon").getJSONArray("channels").getJSONObject(0).getString("name"));
    }
    private JSONObject info(String profile) throws Exception { return new JSONObject().put("id", "shellyplus2pm-aabbccddeeff").put("gen", 2).put("app", "Plus2PM").put("profile", profile); }
    private JSONObject cover(boolean calibrated, boolean fault) throws Exception {
        JSONObject status = new JSONObject("{\"cover:0\":{\"id\":0,\"state\":\"stopped\",\"pos_control\":" + calibrated + ",\"current_pos\":42" + (fault ? ",\"errors\":[\"overpower\"]" : "") + "}}");
        return ShellyPolicy.snapshot(info("cover"), status, new JSONObject(), "192.168.1.50", "Woonkamer");
    }
    @Test public void onlyPrivateAddressesAndExactSupportedIdentity() throws Exception {
        assertEquals("192.168.1.50", ShellyPolicy.ip("192.168.1.50"));
        for (String ip : new String[]{"127.0.0.1", "1.1.1.1", "192.168.1.2:80", "shelly.local", "192.168.1.2/evil"}) assertThrows(IllegalArgumentException.class, () -> ShellyPolicy.ip(ip));
        assertThrows(IllegalArgumentException.class, () -> ShellyPolicy.identity(info("cover"), "shellyplus2pm-112233445566"));
        assertThrows(IllegalArgumentException.class, () -> ShellyPolicy.identity(info("cover").put("gen", 3), "shellyplus2pm-aabbccddeeff"));
    }
    @Test public void relayModeCannotBeDrivenAsARolluikAndBothLampsRemainDistinct() throws Exception {
        JSONObject status = new JSONObject("{\"switch:0\":{\"id\":0,\"output\":true},\"switch:1\":{\"id\":1,\"output\":false}}");
        JSONObject config = new JSONObject("{\"switch:0\":{\"name\":\"Tafellamp\"},\"wifi\":{\"password\":\"test-private\"},\"auth\":{\"password\":\"test-private\"}}");
        JSONObject device = ShellyPolicy.snapshot(info("switch"), status, config, "192.168.1.51", "Verlichting");
        assertEquals(2, device.getJSONArray("channels").length());
        assertEquals("Tafellamp", device.getJSONArray("channels").getJSONObject(0).getString("name"));
        assertFalse(device.toString().contains("test-private"));
        assertEquals("Switch.Set", ShellyPolicy.command(device, 1, "on", null));
        for (String action : new String[]{"open", "close", "stop", "position"}) assertThrows(IllegalArgumentException.class, () -> ShellyPolicy.command(device, 0, action, 50));
        assertThrows(IllegalArgumentException.class, () -> ShellyPolicy.command(device, 2, "off", null));
        assertThrows(IllegalArgumentException.class, () -> ShellyPolicy.command(cover(true, false), 0, "on", null));
    }
    @Test public void positionRequiresCalibrationAndValidRangeButStopSurvivesFaults() throws Exception {
        assertEquals(0, ShellyPolicy.integer(0, 0, 100));
        for (Object value : new Object[]{Double.NaN, Double.POSITIVE_INFINITY, 10.5, -1, 101, "50"}) assertThrows(IllegalArgumentException.class, () -> ShellyPolicy.integer(value, 0, 100));
        JSONObject uncalibrated = cover(false, false);
        assertTrue(uncalibrated.getJSONArray("channels").getJSONObject(0).isNull("position"));
        assertEquals("Cover.Open", ShellyPolicy.command(uncalibrated, 0, "open", null));
        assertThrows(IllegalArgumentException.class, () -> ShellyPolicy.command(uncalibrated, 0, "position", 50));
        assertEquals("Cover.GoToPosition", ShellyPolicy.command(cover(true, false), 0, "position", 100));
        assertThrows(IllegalArgumentException.class, () -> ShellyPolicy.command(cover(true, false), 0, "position", 101));
        assertThrows(IllegalArgumentException.class, () -> ShellyPolicy.command(cover(true, true), 0, "open", null));
        assertEquals("Cover.Stop", ShellyPolicy.command(cover(true, true), 0, "stop", null));
    }
    @Test public void digestMatchesAnIndependentlyCalculatedSha256Vector() throws Exception {
        String header = ShellyTransport.httpAuth("Digest realm=\"shellyplus2pm-aabbccddeeff\", nonce=\"123456\", algorithm=SHA-256, qop=\"auth\"", "test-password", "abcdef");
        assertTrue(header.contains("c243e400fe20dbf96c0a4217b984f73132255d9e303624aa9114017dee381853"));
        assertFalse(header.contains("test-password"));
        assertThrows(SecurityException.class, () -> ShellyTransport.httpAuth("Basic realm=\"device\"", "test-password", "abcdef"));
    }
    @Test public void apiErrorsMismatchedRequestIdsAndMissingChannelsCannotSucceed() throws Exception {
        assertThrows(IllegalStateException.class, () -> ShellyTransport.result(new JSONObject("{\"id\":1,\"error\":{\"code\":-103}}"), 1));
        assertThrows(IllegalStateException.class, () -> ShellyTransport.result(new JSONObject("{\"id\":2,\"result\":null}"), 1));
        assertThrows(IllegalStateException.class, () -> ShellyPolicy.snapshot(info("switch"), new JSONObject(), new JSONObject(), "192.168.1.51", "Lampen"));
        assertEquals(0, ShellyTransport.result(new JSONObject("{\"id\":1,\"result\":null}"), 1).length());
    }
}
