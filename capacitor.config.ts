import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "nl.mijnwoning.dashboard",
  appName: "Mijn Woning",
  webDir: "dist-android",
  server: { androidScheme: "https", hostname: "localhost" },
  android: { allowMixedContent: false, adjustMarginsForEdgeToEdge: "auto" },
};
export default config;
