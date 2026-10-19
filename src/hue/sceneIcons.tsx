import {
  Lightbulb,
  Clapperboard,
  Sun,
  Moon,
  Coffee,
  PartyPopper,
  Heart,
  BookOpen,
  Music2,
  Utensils,
  BedDouble,
  Laptop,
} from "lucide-react";

export const sceneIcons = {
  light: { label: "Lamp", icon: Lightbulb },
  movie: { label: "Filmavond", icon: Clapperboard },
  sun: { label: "Overdag", icon: Sun },
  moon: { label: "Avond", icon: Moon },
  coffee: { label: "Goedemorgen", icon: Coffee },
  party: { label: "Feest", icon: PartyPopper },
  heart: { label: "Romantisch", icon: Heart },
  book: { label: "Lezen", icon: BookOpen },
  music: { label: "Muziek", icon: Music2 },
  dinner: { label: "Eten", icon: Utensils },
  sleep: { label: "Slapen", icon: BedDouble },
  work: { label: "Werken", icon: Laptop },
} as const;
export type SceneIconId = keyof typeof sceneIcons;
export const sceneIconsKey = "mijn-woning.hue.scene-icons.v1";
export function isSceneIcon(value: unknown): value is SceneIconId {
  return typeof value === "string" && Object.hasOwn(sceneIcons, value);
}
export function loadSceneIcons(): Record<string, SceneIconId> {
  try {
    const raw = JSON.parse(localStorage.getItem(sceneIconsKey) || "{}");
    return Object.fromEntries(
      Object.entries(raw || {}).filter(([, value]) => isSceneIcon(value)),
    ) as Record<string, SceneIconId>;
  } catch {
    return {};
  }
}
export function defaultSceneIcon(name: string): SceneIconId {
  if (/film|movie|cinema|tv/i.test(name)) return "movie";
  if (/slaap|nacht|welterusten|sleep/i.test(name)) return "sleep";
  if (/morgen|ontbijt|coffee/i.test(name)) return "coffee";
  if (/lees|lezen|read/i.test(name)) return "book";
  if (/feest|party/i.test(name)) return "party";
  if (/eten|diner|dinner/i.test(name)) return "dinner";
  if (/avond|relax/i.test(name)) return "moon";
  return "light";
}
export function SceneIcon({
  id,
  size = 19,
}: {
  id: SceneIconId;
  size?: number;
}) {
  const Icon = sceneIcons[id].icon;
  return <Icon size={size} aria-hidden="true" data-scene-icon={id} />;
}
