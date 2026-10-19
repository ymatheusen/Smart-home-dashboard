import { useEffect, useRef, useState } from "react";

/** A drag previews locally. Only a completed pointer or keyboard gesture sends a command. */
export function PositionSlider({
  name,
  value,
  disabled,
  onCommit,
}: {
  name: string;
  value: number | null | undefined;
  disabled: boolean;
  onCommit(position: number): Promise<void>;
}) {
  const [draft, setDraft] = useState<number | null>(null);
  const changed = useRef<number | null>(null);
  const cancel = () => {
    changed.current = null;
    setDraft(null);
  };
  useEffect(() => {
    if (disabled) cancel();
  }, [disabled]);
  const commit = () => {
    const next = changed.current;
    changed.current = null;
    if (next === null || disabled) return;
    void onCommit(next).finally(() => setDraft(null));
  };
  return (
    <label className="hue-slider shelly-position">
      Gewenste opening · {name}
      <span>{draft ?? value ?? 50}%</span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={draft ?? value ?? 50}
        disabled={disabled}
        onChange={(e) => {
          const next = Number(e.target.value);
          changed.current = next;
          setDraft(next);
        }}
        onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
        onPointerUp={commit}
        onPointerCancel={cancel}
        onKeyUp={(e) => {
          if (
            [
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "Home",
              "End",
              "PageUp",
              "PageDown",
            ].includes(e.key)
          )
            commit();
        }}
        onBlur={commit}
      />
    </label>
  );
}
