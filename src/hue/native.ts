import { Capacitor, registerPlugin } from "@capacitor/core";
import type { HueTransport } from "./model";
export const isNativeAndroid =
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
export const HueBridge = registerPlugin<HueTransport>("HueBridge");
export const androidDownloadUrl =
  "https://github.com/ymatheusen/Smart-home-dashboard/raw/refs/heads/gh-pages/android/Mijn-Woning.apk";
