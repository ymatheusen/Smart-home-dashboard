import { Capacitor, registerPlugin } from "@capacitor/core";
import type { HueTransport } from "./model";
export const isNativeAndroid =
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
export const HueBridge = registerPlugin<HueTransport>("HueBridge");
export const androidDownloadUrl =
  "https://raw.githubusercontent.com/ymatheusen/Smart-home-dashboard/refs/heads/gh-pages/android/Mijn-Woning.apk";
