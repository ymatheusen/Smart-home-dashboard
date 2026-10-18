import type { ReactNode } from "react";
export function Switch({
  on,
  label,
  onClick,
}: {
  on: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`switch ${on ? "on" : ""}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
    >
      <span />
    </button>
  );
}
export function CardHeader({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className="card-header">
      <div className="device-icon">{icon}</div>
      <div className="device-title">
        <h3>{title}</h3>
        <span>{subtitle}</span>
      </div>
      {children}
    </div>
  );
}
export function CameraArt() {
  return (
    <div
      className="camera-art"
      aria-label="Geïllustreerd voorbeeld van de voordeur, geen camerabeeld"
      role="img"
    >
      <div className="wall-lines" />
      <div className="porch-light" />
      <div className="house-number">24</div>
      <div className="front-door">
        <span className="door-glass" />
        <span className="door-handle" />
      </div>
      <div className="plant">
        <i />
        <i />
        <i />
        <b />
      </div>
      <span className="camera-caption">VOORBEELDBEELD</span>
    </div>
  );
}
