package nl.mijnwoning.dashboard.hue;

import android.content.Context;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.Collection;
import java.util.concurrent.atomic.AtomicReference;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.security.cert.CertificateException;
import org.json.JSONObject;

public final class HueTransport {
    private final X509TrustManager vendorTrust;
    public HueTransport(Context context) throws Exception {
        CertificateFactory factory = CertificateFactory.getInstance("X.509");
        Collection<? extends java.security.cert.Certificate> roots;
        try (InputStream input = context.getAssets().open("hue-bridge-roots.pem")) { roots = factory.generateCertificates(input); }
        if (roots.size() < 2) throw new IllegalStateException("Hue-certificaten ontbreken.");
        KeyStore trust = KeyStore.getInstance(KeyStore.getDefaultType()); trust.load(null);
        int index = 0; for (java.security.cert.Certificate cert : roots) trust.setCertificateEntry("hue-" + index++, cert);
        TrustManagerFactory managers = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm()); managers.init(trust);
        vendorTrust = (X509TrustManager) managers.getTrustManagers()[0];
    }
    public static final class Result {
        public final String text, certificateId;
        Result(String text, String certificateId) { this.text = text; this.certificateId = certificateId; }
    }
    public Result request(String ip, String bridgeId, String key, String method, String path, JSONObject body) throws Exception {
        HuePolicy.localIp(ip);
        AtomicReference<String> peerId = new AtomicReference<>();
        HttpsURLConnection connection = (HttpsURLConnection) new URL("https://" + ip + path).openConnection();
        SSLContext tls = SSLContext.getInstance("TLS");
        X509TrustManager boundTrust = new X509TrustManager() {
            public X509Certificate[] getAcceptedIssuers() { return vendorTrust.getAcceptedIssuers(); }
            public void checkClientTrusted(X509Certificate[] chain, String auth) throws CertificateException { vendorTrust.checkClientTrusted(chain, auth); }
            public void checkServerTrusted(X509Certificate[] chain, String auth) throws CertificateException {
                vendorTrust.checkServerTrusted(chain, auth);
                try {
                    chain[0].checkValidity();
                    String identity = HuePolicy.certificateId(chain[0].getSubjectX500Principal().getName("RFC2253"));
                    if (bridgeId != null && !identity.equals(HuePolicy.bridgeId(bridgeId))) throw new CertificateException("Wrong bridge identity");
                    peerId.set(identity);
                } catch (IllegalArgumentException e) { throw new CertificateException("Invalid bridge identity"); }
            }
        };
        tls.init(null, new TrustManager[] { boundTrust }, null);
        connection.setSSLSocketFactory(tls.getSocketFactory());
        // Chain validation is performed by the standard TLS trust manager above.
        // Hue certificates identify the bridge, not its DHCP address. Match that
        // vendor-certified identity instead of accepting an arbitrary host.
        connection.setHostnameVerifier((host, session) -> {
            try {
                X509Certificate leaf = (X509Certificate) session.getPeerCertificates()[0];
                leaf.checkValidity();
                String identity = HuePolicy.certificateId(leaf.getSubjectX500Principal().getName("RFC2253"));
                if (bridgeId != null && !identity.equals(HuePolicy.bridgeId(bridgeId))) return false;
                peerId.set(identity); return true;
            } catch (Exception invalid) { return false; }
        });
        connection.setConnectTimeout(4500); connection.setReadTimeout(8000); connection.setInstanceFollowRedirects(false); connection.setRequestMethod(method);
        connection.setRequestProperty("Accept", "application/json");
        if (key != null) connection.setRequestProperty("hue-application-key", key);
        try {
            if (body != null) {
                byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
                connection.setDoOutput(true); connection.setRequestProperty("Content-Type", "application/json"); connection.setFixedLengthStreamingMode(bytes.length);
                try (java.io.OutputStream out = connection.getOutputStream()) { out.write(bytes); }
            }
            int status = connection.getResponseCode();
            if (status == 401 || status == 403) throw new SecurityException("HUE_AUTH");
            if (status < 200 || status >= 300) throw new IllegalStateException("HUE_HTTP");
            if (peerId.get() == null) throw new javax.net.ssl.SSLHandshakeException("Hue-identiteit niet geverifieerd.");
            try (InputStream in = connection.getInputStream(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[8192]; int count, total = 0;
                while ((count = in.read(buffer)) != -1) { total += count; if (total > 2 * 1024 * 1024) throw new IllegalStateException("HUE_RESPONSE"); out.write(buffer, 0, count); }
                return new Result(out.toString("UTF-8"), peerId.get());
            }
        } finally { connection.disconnect(); }
    }
}
