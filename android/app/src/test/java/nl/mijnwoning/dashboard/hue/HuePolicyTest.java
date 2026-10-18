package nl.mijnwoning.dashboard.hue;
import org.junit.Test;
import static org.junit.Assert.*;
import org.json.JSONObject;

public class HuePolicyTest {
    @Test public void onlyPrivateIpLiteralsCanReceiveRequests() {
        for (String ip : new String[]{"192.168.1.2", "10.0.0.10", "172.16.1.2", "172.31.255.254"}) assertEquals(ip, HuePolicy.localIp(ip));
        for (String ip : new String[]{"127.0.0.1", "169.254.1.2", "172.32.1.2", "8.8.8.8", "192.168.001.2", "192.168.1.300", "https://192.168.1.2", "192.168.1.2:443", "bridge.local", "192.168.1.2/evil"}) assertThrows(IllegalArgumentException.class, () -> HuePolicy.localIp(ip));
    }
    @Test public void certificateIdentityMustBeAnExactHueBridgeId() {
        assertEquals("001788fffe123456", HuePolicy.certificateId("CN=001788FFFE123456,O=Philips Hue,C=NL"));
        assertThrows(IllegalArgumentException.class, () -> HuePolicy.certificateId("CN=root-bridge,O=Philips Hue,C=NL"));
        assertThrows(IllegalArgumentException.class, () -> HuePolicy.certificateId("CN=001788fffe123456.evil.example"));
    }
    @Test public void resourceIdsCannotInjectUrlsAndNumbersMustBeFinite() {
        assertEquals("12345678-1234-1234-1234-123456789abc", HuePolicy.resourceId("12345678-1234-1234-1234-123456789abc"));
        for (String id : new String[]{"../auth_v1", "lights/1", "https://example.com"}) assertThrows(IllegalArgumentException.class, () -> HuePolicy.resourceId(id));
        for (double value : new double[]{Double.NaN, Double.POSITIVE_INFINITY, -1, 101}) assertThrows(IllegalArgumentException.class, () -> HuePolicy.range(value,0,100));
    }
    @Test public void authResourcesAndLegacyKeyPathsNeverLeaveNativeCode() throws Exception {
        JSONObject input = new JSONObject("{\"errors\":[],\"data\":[{\"type\":\"auth_v1\",\"username\":\"private-test-fixture\"},{\"id\":\"123\",\"type\":\"light\",\"id_v1\":\"/config/whitelist/private-test-fixture\",\"username\":\"private-test-fixture\",\"metadata\":{\"name\":\"Lamp\"}}]}");
        JSONObject result=HueResources.sanitize(input);
        assertEquals(1,result.getJSONArray("data").length());
        assertFalse(result.toString().contains("private-test-fixture"));
        assertTrue(result.toString().contains("Lamp"));
    }
    @Test public void bridgeErrorsCannotBeShownAsSuccessfulSnapshots() {
        assertThrows(IllegalStateException.class, () -> HueResources.sanitize(new JSONObject("{\"errors\":[{\"description\":\"failed\"}],\"data\":[]}")));
    }
}
