package nl.mijnwoning.dashboard.shelly;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.Proxy;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONObject;

/** Gen 2 local HTTP API. No arbitrary URLs, redirects, cloud, cookies or Basic auth. */
public final class ShellyTransport {
    private static final AtomicLong sequence = new AtomicLong();
    private static final int LIMIT = 256 * 1024;
    public interface ConnectionFactory { HttpURLConnection open(URL url) throws Exception; }
    private final ConnectionFactory connections;
    public ShellyTransport() { this(url -> (HttpURLConnection) url.openConnection(Proxy.NO_PROXY)); }
    public ShellyTransport(ConnectionFactory connections) { this.connections = connections; }
    private static final class Response {
        int code; String text; String challenge;
    }
    private Response exchange(String ip, String path, JSONObject body, String authorization) throws Exception {
        HttpURLConnection connection = connections.open(new URL("http://" + ShellyPolicy.ip(ip) + path));
        connection.setInstanceFollowRedirects(false); connection.setConnectTimeout(3500); connection.setReadTimeout(4500);
        connection.setUseCaches(false); connection.setRequestProperty("Accept", "application/json");
        connection.setRequestProperty("Connection", "close");
        if (authorization != null) connection.setRequestProperty("Authorization", authorization);
        try {
            if (body != null) {
                byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
                connection.setRequestMethod("POST"); connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json"); connection.setFixedLengthStreamingMode(bytes.length);
                try (java.io.OutputStream output = connection.getOutputStream()) { output.write(bytes); }
            }
            Response response = new Response(); response.code = connection.getResponseCode(); response.challenge = connection.getHeaderField("WWW-Authenticate");
            if (response.code >= 300 && response.code < 400) throw new IllegalStateException("SHELLY_REDIRECT");
            InputStream stream = response.code >= 400 ? connection.getErrorStream() : connection.getInputStream();
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            if (stream != null) try (InputStream input = stream) {
                byte[] buffer = new byte[4096]; int n;
                while ((n = input.read(buffer)) != -1) { if (bytes.size() + n > LIMIT) throw new IllegalStateException("SHELLY_RESPONSE"); bytes.write(buffer, 0, n); }
            }
            response.text = bytes.toString("UTF-8"); return response;
        } finally { connection.disconnect(); }
    }
    public JSONObject info(String ip) throws Exception {
        Response response = exchange(ip, "/shelly", null, null);
        if (response.code != 200) throw new IllegalStateException("SHELLY_RESPONSE");
        return new JSONObject(response.text);
    }
    public static String hash(String input) throws Exception {
        byte[] bytes = MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.UTF_8));
        StringBuilder out = new StringBuilder(); for (byte b : bytes) out.append(String.format(java.util.Locale.ROOT, "%02x", b & 255)); return out.toString();
    }
    private static String random() { byte[] bytes = new byte[16]; new SecureRandom().nextBytes(bytes); StringBuilder s = new StringBuilder(); for (byte b : bytes) s.append(String.format(java.util.Locale.ROOT, "%02x", b & 255)); return s.toString(); }
    public static String httpAuth(String challenge, String password, String cnonce) throws Exception {
        if (challenge == null || !challenge.startsWith("Digest ")) throw new SecurityException("SHELLY_AUTH");
        Map<String, String> values = new HashMap<>();
        Matcher matcher = Pattern.compile("([a-zA-Z_]+)=(?:\"([^\"]*)\"|([^,\\s]+))").matcher(challenge.substring(7));
        while (matcher.find()) values.put(matcher.group(1), matcher.group(2) != null ? matcher.group(2) : matcher.group(3));
        String realm = values.get("realm"), nonce = values.get("nonce");
        if (realm == null || nonce == null || !"SHA-256".equalsIgnoreCase(values.get("algorithm")) || !java.util.Arrays.asList(values.getOrDefault("qop", "").split(",\\s*")).contains("auth")) throw new SecurityException("SHELLY_AUTH");
        if (!realm.matches("[a-zA-Z0-9._:-]{1,100}") || !nonce.matches("[a-zA-Z0-9+/=_:-]{1,200}")) throw new SecurityException("SHELLY_AUTH");
        String nc = "00000001";
        String response = hash(hash("admin:" + realm + ":" + password) + ":" + nonce + ":" + nc + ":" + cnonce + ":auth:" + hash("POST:/rpc"));
        String header = "Digest username=\"admin\", realm=\"" + realm + "\", nonce=\"" + nonce + "\", uri=\"/rpc\", algorithm=SHA-256, response=\"" + response + "\", qop=auth, nc=" + nc + ", cnonce=\"" + cnonce + "\"";
        String opaque = values.get("opaque");
        if (opaque != null && opaque.matches("[a-zA-Z0-9+/=_:-]{1,200}")) header += ", opaque=\"" + opaque + "\"";
        return header;
    }
    public static JSONObject result(JSONObject frame, long id) throws Exception {
        if (frame.optLong("id", -1) != id || frame.has("error") || !frame.has("result")) throw new IllegalStateException("SHELLY_RESPONSE");
        if (frame.isNull("result")) return new JSONObject();
        return frame.getJSONObject("result");
    }
    public JSONObject rpc(String ip, String password, String method, JSONObject params) throws Exception {
        if (!method.matches("Shelly.GetStatus|Shelly.GetConfig|Switch.Set|Cover.Open|Cover.Close|Cover.Stop|Cover.GoToPosition")) throw new IllegalArgumentException("Ongeldige Shelly-opdracht.");
        long id = sequence.incrementAndGet();
        JSONObject request = new JSONObject().put("id", id).put("method", method).put("params", params);
        Response response = exchange(ip, "/rpc", request, null);
        JSONObject frame;
        try { frame = response.text.isEmpty() ? new JSONObject() : new JSONObject(response.text); }
        catch (org.json.JSONException e) { if (response.code != 401) throw e; frame = new JSONObject(); }
        JSONObject error = frame.optJSONObject("error");
        if (response.code == 401 || (error != null && error.optInt("code") == 401)) {
            if (password.isEmpty()) throw new SecurityException("SHELLY_AUTH");
            if (response.challenge != null) {
                response = exchange(ip, "/rpc", request, httpAuth(response.challenge, password, random()));
            } else {
                // Shelly's transport-independent RPC digest uses dummy_method:dummy_uri.
                if (error == null) throw new SecurityException("SHELLY_AUTH");
                JSONObject challenge = new JSONObject(error.getString("message"));
                if (!"SHA-256".equals(challenge.optString("algorithm"))) throw new SecurityException("SHELLY_AUTH");
                String realm = challenge.getString("realm"), nonce = String.valueOf(challenge.get("nonce")), cnonce = random();
                int nc = challenge.optInt("nc", 1);
                JSONObject auth = new JSONObject().put("realm", realm).put("username", "admin").put("nonce", challenge.get("nonce")).put("cnonce", cnonce).put("nc", nc).put("algorithm", "SHA-256");
                auth.put("response", hash(hash("admin:" + realm + ":" + password) + ":" + nonce + ":" + nc + ":" + cnonce + ":auth:" + hash("dummy_method:dummy_uri")));
                response = exchange(ip, "/rpc", request.put("auth", auth), null);
            }
            if (response.code == 401 || response.code == 403) throw new SecurityException("SHELLY_AUTH");
            frame = response.text.isEmpty() ? new JSONObject() : new JSONObject(response.text);
            error = frame.optJSONObject("error");
        }
        if (response.code == 401 || response.code == 403 || (error != null && error.optInt("code") == 401)) throw new SecurityException("SHELLY_AUTH");
        if (response.code != 200) throw new IllegalStateException("SHELLY_RESPONSE");
        return result(frame, id);
    }
}
