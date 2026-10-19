import { Capacitor, registerPlugin } from "@capacitor/core";
import type { HueTransport } from "./model";
export const isNativeAndroid =
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
export const HueBridge = registerPlugin<HueTransport>("HueBridge");
export const androidDownloadUrl =
  "https://ymatheusen.github.io/Smart-home-dashboard/android/Mijn-Woning-0.5.3.apk";
