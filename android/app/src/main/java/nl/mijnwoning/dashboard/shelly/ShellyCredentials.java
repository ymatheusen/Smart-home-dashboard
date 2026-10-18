package nl.mijnwoning.dashboard.shelly;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONObject;

/** Independent from Hue: updates and removal never touch the working Hue pairing. */
public final class ShellyCredentials {
    private static final String ALIAS = "mijnwoning.shelly.credentials.v1";
    private final SharedPreferences preferences;
    public ShellyCredentials(Context context) { preferences = context.getSharedPreferences("shelly_credentials", Context.MODE_PRIVATE); }
    private SecretKey key() throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore"); store.load(null);
        if (store.containsAlias(ALIAS)) return (SecretKey) store.getKey(ALIAS, null);
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).setKeySize(256).build());
        return generator.generateKey();
    }
    public synchronized JSONObject load() throws Exception {
        String data = preferences.getString("data", null), iv = preferences.getString("iv", null);
        if (data == null || iv == null) return new JSONObject();
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, Base64.decode(iv, Base64.NO_WRAP)));
        return new JSONObject(new String(cipher.doFinal(Base64.decode(data, Base64.NO_WRAP)), StandardCharsets.UTF_8));
    }
    private void save(JSONObject values) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE, key());
        String iv = Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP);
        String data = Base64.encodeToString(cipher.doFinal(values.toString().getBytes(StandardCharsets.UTF_8)), Base64.NO_WRAP);
        if (!preferences.edit().putString("iv", iv).putString("data", data).commit()) throw new IllegalStateException("SHELLY_STORAGE");
    }
    public synchronized void put(String id, JSONObject value) throws Exception { JSONObject all = load(); all.put(id, value); save(all); }
    public synchronized void remove(String id) throws Exception { JSONObject all = load(); all.remove(id); save(all); }
}
