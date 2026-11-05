// Chunky pixel sprites (SVG rects, crispEdges). Displayed >= 30px with pixelated rendering.
import type { CSSProperties } from "react";

function Px({ w = 36, cls = "", children, label }: { w?: number; cls?: string; children: React.ReactNode; label: string }) {
  const style: CSSProperties = { width: w, height: "auto", imageRendering: "pixelated" };
  return (
    <svg viewBox="0 0 12 14" className={`px ${cls}`} style={style} role="img" aria-label={label} shapeRendering="crispEdges">
      {children}
    </svg>
  );
}

const SKIN = "#ffd9b3";
const HAIR = "#6b4a2b";
const HAT = "#2f9e5f";
const RIBBON = "#ffc93c";
const SHIRT_H = "#2f9e5f";
const SHIRT_S = "#e88ca0";
const PANTS = "#1e6b3e";

export function HinataSprite({ w = 36 }: { w?: number }) {
  return (
    <Px w={w} cls="px-bob" label="Hinata">
      <rect x="3" y="0" width="6" height="2" fill={HAT} />
      <rect x="2" y="2" width="8" height="1" fill={HAT} />
      <rect x="4" y="3" width="4" height="3" fill={SKIN} />
      <rect x="3" y="3" width="1" height="3" fill={HAIR} />
      <rect x="8" y="3" width="1" height="3" fill={HAIR} />
      <rect x="4" y="6" width="4" height="4" fill={SHIRT_H} />
      <rect x="3" y="6" width="1" height="3" fill={SKIN} />
      <rect x="8" y="6" width="1" height="3" fill={SKIN} />
      <rect x="4" y="10" width="1" height="3" fill={PANTS} />
      <rect x="7" y="10" width="1" height="3" fill={PANTS} />
      <rect x="4" y="13" width="1" height="1" fill={HAIR} />
      <rect x="7" y="13" width="1" height="1" fill={HAIR} />
    </Px>
  );
}

export function SimoneSprite({ w = 36 }: { w?: number }) {
  return (
    <Px w={w} cls="px-bob px-delay" label="Simone">
      <rect x="1" y="0" width="3" height="2" fill={RIBBON} />
      <rect x="8" y="0" width="3" height="2" fill={RIBBON} />
      <rect x="4" y="1" width="4" height="2" fill={RIBBON} />
      <rect x="4" y="3" width="4" height="3" fill={SKIN} />
      <rect x="3" y="2" width="1" height="5" fill={HAIR} />
      <rect x="8" y="2" width="1" height="5" fill={HAIR} />
      <rect x="4" y="6" width="4" height="4" fill={SHIRT_S} />
      <rect x="3" y="6" width="1" height="3" fill={SKIN} />
      <rect x="8" y="6" width="1" height="3" fill={SKIN} />
      <rect x="4" y="10" width="1" height="3" fill={PANTS} />
      <rect x="7" y="10" width="1" height="3" fill={PANTS} />
      <rect x="4" y="13" width="1" height="1" fill={HAIR} />
      <rect x="7" y="13" width="1" height="1" fill={HAIR} />
    </Px>
  );
}

export function FlowerSprite({ w = 30 }: { w?: number }) {
  return (
    <Px w={w} cls="px-sway" label="Done">
      <rect x="5" y="6" width="2" height="7" fill="#1e6b3e" />
      <rect x="3" y="9" width="2" height="1" fill="#2f9e5f" />
      <rect x="7" y="10" width="2" height="1" fill="#2f9e5f" />
      <rect x="4" y="1" width="4" height="1" fill="#ff8fb2" />
      <rect x="3" y="2" width="6" height="3" fill="#ff8fb2" />
      <rect x="4" y="5" width="4" height="1" fill="#ff8fb2" />
      <rect x="5" y="2" width="2" height="3" fill="#ffc93c" />
      <rect x="9" y="0" width="2" height="2" fill="#ffc93c" />
      <rect x="9" y="2" width="1" height="1" fill="#fff3c4" />
    </Px>
  );
}

export function ZzzSprite() {
  return (
    <span className="px-zzz" role="img" aria-label="Rest">
      Zzz
    </span>
  );
}

export function SproutSprite({ w = 26 }: { w?: number }) {
  return (
    <Px w={w} cls="px-sway" label="Planned">
      <rect x="5" y="7" width="2" height="6" fill="#1e6b3e" />
      <rect x="2" y="4" width="3" height="3" fill="#1e6b3e" />
      <rect x="2" y="4" width="2" height="2" fill="#7ccf8a" />
      <rect x="7" y="2" width="3" height="4" fill="#1e6b3e" />
      <rect x="8" y="2" width="2" height="2" fill="#b8e05a" />
      <rect x="5" y="0" width="2" height="3" fill="#1e6b3e" />
      <rect x="5" y="0" width="1" height="2" fill="#b8e05a" />
    </Px>
  );
}

export function RunnerSprite({ w = 34 }: { w?: number }) {
  return (
    <Px w={w} cls="px-run" label="Jogging">
      <rect x="7" y="1" width="3" height="3" fill={SKIN} />
      <rect x="5" y="4" width="5" height="3" fill="#2f9e5f" />
      <rect x="1" y="5" width="4" height="2" fill={SKIN} />
      <rect x="9" y="5" width="3" height="2" fill={SKIN} />
      <rect x="3" y="8" width="3" height="2" fill={PANTS} />
      <rect x="7" y="9" width="3" height="2" fill={PANTS} />
      <rect x="0" y="11" width="3" height="1" fill={HAIR} />
      <rect x="9" y="12" width="3" height="1" fill={HAIR} />
    </Px>
  );
}

export function SunflowerSprite({ w = 64 }: { w?: number }) {
  return (
    <Px w={w} cls="px-bloom" label="Level up">
      <rect x="5" y="7" width="2" height="7" fill="#1e6b3e" />
      <rect x="3" y="10" width="2" height="1" fill="#2f9e5f" />
      <rect x="7" y="11" width="2" height="1" fill="#2f9e5f" />
      <rect x="3" y="1" width="6" height="6" fill="#ffc93c" />
      <rect x="4" y="0" width="4" height="8" fill="#ffc93c" />
      <rect x="2" y="3" width="8" height="2" fill="#e0a800" />
      <rect x="4" y="2" width="4" height="4" fill="#6b4a2b" />
      <rect x="5" y="3" width="2" height="2" fill="#8a5f36" />
    </Px>
  );
}

export function ChestSprite({ open, w = 34 }: { open: boolean; w?: number }) {
  return (
    <Px w={w} label={open ? "Quest complete" : "Quest"}>
      <rect x="1" y="5" width="10" height="8" fill="#8a5f36" />
      <rect x="1" y="5" width="10" height="2" fill="#a9743f" />
      <rect x="1" y={open ? 2 : 5} width="10" height="3" fill="#a9743f" />
      <rect x="5" y="6" width="2" height="3" fill="#ffc93c" />
      {open && (
        <>
          <rect x="3" y="0" width="2" height="2" fill="#fff3c4" />
          <rect x="7" y="1" width="2" height="2" fill="#ffc93c" />
        </>
      )}
      <rect x="1" y="12" width="10" height="1" fill="#6b4a2b" />
    </Px>
  );
}

export function CakeSprite({ w = 30 }: { w?: number }) {
  return (
    <Px w={w} label="Birthday">
      <rect x="5" y="1" width="2" height="2" fill="#ff8fb2" />
      <rect x="5" y="0" width="2" height="1" fill="#ffc93c" />
      <rect x="3" y="3" width="6" height="2" fill="#fff3c4" />
      <rect x="2" y="5" width="8" height="4" fill="#ff8fb2" />
      <rect x="2" y="5" width="8" height="1" fill="#fff3c4" />
      <rect x="3" y="7" width="1" height="2" fill="#e88ca0" />
      <rect x="6" y="7" width="1" height="2" fill="#e88ca0" />
      <rect x="1" y="9" width="10" height="3" fill="#a9743f" />
      <rect x="1" y="9" width="10" height="1" fill="#c98f4e" />
    </Px>
  );
}
