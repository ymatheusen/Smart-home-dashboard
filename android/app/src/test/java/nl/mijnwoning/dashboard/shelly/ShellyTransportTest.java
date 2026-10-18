package nl.mijnwoning.dashboard.shelly;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONObject;
import org.junit.Test;
import static org.junit.Assert.*;

public class ShellyTransportTest {
    private static class Reply extends HttpURLConnection {
        final String body, challenge; final int code;
        ByteArrayOutputStream sent = new ByteArrayOutputStream();
        Reply(int code, String body, String challenge) throws Exception { super(new URL("http://192.168.1.50/rpc")); this.code = code; this.body = body; this.challenge = challenge; }
        @Override public void disconnect() {}
        @Override public boolean usingProxy() { return false; }
        @Override public void connect() {}
        @Override public int getResponseCode() { return code; }
        @Override public String getHeaderField(String name) { return "WWW-Authenticate".equals(name) ? challenge : null; }
        @Override public InputStream getInputStream() { return new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8)); }
        @Override public InputStream getErrorStream() { return getInputStream(); }
        @Override public OutputStream getOutputStream() { return sent; }
        JSONObject payload() throws Exception { return new JSONObject(sent.toString("UTF-8")); }
    }
    @Test public void digest401RetriesOnlyTheRejectedRequestAndNeverSendsThePassword() throws Exception {
        Reply challenge = new Reply(401, "Unauthorized", "Digest realm=\"shellyplus2pm-aabbccddeeff\", nonce=\"123456\", algorithm=SHA-256, qop=\"auth\"");
        Reply success = new Reply(200, "{}", null) { @Override public InputStream getInputStream() { try { return new ByteArrayInputStream(new JSONObject().put("id", payload().getLong("id")).put("result", JSONObject.NULL).toString().getBytes(StandardCharsets.UTF_8)); } catch (Exception e) { throw new RuntimeException(e); } } };
        ArrayDeque<Reply> replies = new ArrayDeque<>(); replies.add(challenge); replies.add(success);
        List<String> urls = new ArrayList<>();
        ShellyTransport transport = new ShellyTransport(url -> { urls.add(url.toString()); return replies.remove(); });
        transport.rpc("192.168.1.50", "private-test-password", "Cover.Stop", new JSONObject().put("id", 0));
        assertEquals(2, urls.size()); assertEquals("http://192.168.1.50/rpc", urls.get(0));
        assertEquals(challenge.payload().toString(), success.payload().toString());
        assertEquals("Cover.Stop", success.payload().getString("method"));
        assertFalse(success.sent.toString("UTF-8").contains("private-test-password"));
        assertTrue(success.getRequestProperty("Authorization").startsWith("Digest "));
        assertFalse(success.getRequestProperty("Authorization").contains("private-test-password"));
        assertFalse(success.getInstanceFollowRedirects());
    }
    @Test public void noCredentialFallbackAndNoRetryForAmbiguousNetworkFailure() throws Exception {
        int[] calls = {0};
        ShellyTransport offline = new ShellyTransport(url -> { calls[0]++; throw new java.net.SocketTimeoutException(); });
        assertThrows(java.net.SocketTimeoutException.class, () -> offline.rpc("192.168.1.50", "", "Cover.Open", new JSONObject().put("id", 0)));
        assertEquals(1, calls[0]);
        ShellyTransport protectedDevice = new ShellyTransport(url -> new Reply(401, "Unauthorized", "Digest realm=\"device\", nonce=\"1\", algorithm=SHA-256, qop=\"auth\""));
        assertThrows(SecurityException.class, () -> protectedDevice.rpc("192.168.1.50", "", "Shelly.GetStatus", new JSONObject()));
        ShellyTransport redirect = new ShellyTransport(url -> new Reply(302, "", null));
        assertThrows(IllegalStateException.class, () -> redirect.rpc("192.168.1.50", "", "Switch.Set", new JSONObject().put("id", 0).put("on", true)));
    }
}
