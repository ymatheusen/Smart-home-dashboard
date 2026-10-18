package nl.mijnwoning.dashboard.hue;

import java.util.Locale;
import java.util.regex.Pattern;

/** Restricts native requests to local Hue bridges and known resource operations. */
public final class HuePolicy {
    private static final Pattern IPV4 = Pattern.compile("(?:[0-9]{1,3}\\.){3}[0-9]{1,3}");
    private static final Pattern UUID = Pattern.compile("[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}");
    public static String localIp(String input) {
        if (input == null || !IPV4.matcher(input).matches()) throw new IllegalArgumentException("Vul alleen het lokale IPv4-adres in, zonder https of poort.");
        String[] p = input.split("\\.");
        int[] a = new int[4];
        for (int i = 0; i < 4; i++) {
            if (p[i].length() > 1 && p[i].startsWith("0")) throw new IllegalArgumentException("Ongeldig IP-adres.");
            a[i] = Integer.parseInt(p[i]);
            if (a[i] > 255) throw new IllegalArgumentException("Ongeldig IP-adres.");
        }
        if (!(a[0] == 10 || (a[0] == 172 && a[1] >= 16 && a[1] <= 31) || (a[0] == 192 && a[1] == 168))) throw new IllegalArgumentException("Gebruik het privé-IP-adres van je eigen Hue Bridge.");
        return input;
    }
    public static String bridgeId(String id) {
        if (id == null || !id.matches("[a-fA-F0-9]{16}")) throw new IllegalArgumentException("Ongeldige Hue Bridge-identiteit.");
        return id.toLowerCase(Locale.ROOT);
    }
    public static String resourceId(String id) {
        if (id == null || !UUID.matcher(id).matches()) throw new IllegalArgumentException("Ongeldig apparaat- of scène-id.");
        return id;
    }
    public static double range(double value, double min, double max) {
        if (Double.isNaN(value) || Double.isInfinite(value) || value < min || value > max) throw new IllegalArgumentException("Ongeldige bedieningswaarde.");
        return value;
    }
    public static String certificateId(String dn) {
        java.util.regex.Matcher m = Pattern.compile("(?:^|,)CN=([a-fA-F0-9]{16})(?:,|$)").matcher(dn);
        if (!m.find()) throw new IllegalArgumentException("Dit is geen herkenbaar Hue Bridge-certificaat.");
        return bridgeId(m.group(1));
    }
    private HuePolicy() {}
}
