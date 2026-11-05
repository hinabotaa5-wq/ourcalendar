// Pixel sprites ported 1:1 from ourcalendar-pixel-mock.html (PAL + pixel maps).
// CakeSprite is original: the mock has no cake data.
import type { CSSProperties } from "react";

const PAL: Record<string, string> = {
  K: "#173d24", S: "#ffd9b3", H: "#5b3a24", G: "#2F9E5F", D: "#1E6B3E",
  Y: "#FFC93C", W: "#ffffff", B: "#3B6EA5", P: "#ff8fb5", R: "#e4572e",
  O: "#f2a03d", N: "#8a5a2b", L: "#7ec850", E: "#c94f6d", T: "#4a3220",
  C: "#7a4a21", F: "#0e5e33", V: "#a4c639",
};

const MAPS: Record<string, string[]> = {
  heroH: ["............","..KKKKKKK...",".KGGGGGGGK..",".KGWWGGGGK..","..SSSSSSS...","..SKSSKSK...","...SSSSS....","..KDDDDDK...",".KDKDDDKDK..",".K.KDDDK.K..","...BBBBB....","...BB.BB....","...BB.BB....","..TTT.TTT..."],
  heroS: ["............",".....YY.....","....YYYY....","...HHHHHH...","..HHHHHHHH..","..SSSSSSSS..","..SKSSKSSS..","..SSSSSSSS..","...GGGGGG...","..KGGGGGGK..","..KGGGGGGK..","....GGGG....","....S..S....","...TT..TT..."],
  flower: [".....P.P....","....PPPPP...",".P..PYYP..P.","....PPPPP...",".....P.P....","......G.....","..L..G......","...L.G......","....GG......",".....G......"],
  sunflower: ["....Y.Y.Y...","...YYYYYY...","..YYNNNNYY..","..YNNNNNNY..","..YYNNNNYY..","...YYYYYY...","....Y.Y.Y...","......G.....","..L..G..L...","....GG......",".....G......"],
  zzz: ["..........BBB.","...........B..","..........BBB.",".....BBBBB....","........B.....",".......B......",".....BBBBB....","BBBBBBB.......","....BB........","...B..........",".BB...........","BBBBBBB......."],
  sprout: ["............","....V..V....","...VV..VV...","....FFFF....",".....D......",".....D......",".....D......","....DDD....."],
  run: [".....HHH......","....HSSSS.....","....HSSS......","..W.YYYYY.....",".W..YYYY.Y....","..W..YY.......",".....BBB......","....B...BB....","...BB....BB...","...B......B...","..TT......TT..",".............."],
  chest: ["............",".NNNNNNNNN..","NYYYYYYYYYN.","NYNKNNNNKNY.","NNNNNKNNNNN.","KNNNNNNNNNK.","KNYNKNNKNYK.","KNNNNNNNNNK.",".KKKKKKKKK.."],
  chestOpen: [".NNNNNNNNN..","NYYYYYYYYYN.",".NNNNNNNNN..","...Y.YY.Y...","..YYYYYYYY..",".KNNNNNNNNK.","KNYYYYYYYNK.","KNNNNNNNNNK.",".KKKKKKKKK.."],
  star: [".....Y......","....YYY.....","YYYYYYYYYY..",".YYYYYYYY...","..YYYYYY....","..YY..YY....",".YY....YY..."],
};

export function PixMap({
  name, scale = 3, className = "", label, style,
}: {
  name: keyof typeof MAPS;
  scale?: number;
  className?: string;
  label: string;
  style?: CSSProperties;
}) {
  const rows = MAPS[name];
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  const css: CSSProperties = { width: w * scale, height: "auto", imageRendering: "pixelated", ...style };
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`px ${className}`} style={css} role="img" aria-label={label} shapeRendering="crispEdges">
      {rows.flatMap((row, j) =>
        [...row].map((ch, i) =>
          PAL[ch] ? <rect key={`${i}-${j}`} x={i} y={j} width={1.001} height={1.001} fill={PAL[ch]} /> : null,
        ),
      )}
    </svg>
  );
}

export function HinataSprite({ scale = 3 }: { scale?: number }) {
  return <PixMap name="heroH" scale={scale} className="px-bob" label="Hinata" />;
}

export function SimoneSprite({ scale = 3 }: { scale?: number }) {
  return <PixMap name="heroS" scale={scale} className="px-bob px-delay" label="Simone" />;
}

export function FlowerSprite({ scale = 3 }: { scale?: number }) {
  return <PixMap name="flower" scale={scale} className="px-sway" label="Done" />;
}

export function StarSprite({ scale = 2 }: { scale?: number }) {
  return <PixMap name="star" scale={scale} label="Star" />;
}

export function ZzzSprite({ scale = 2 }: { scale?: number }) {
  return <PixMap name="zzz" scale={scale} className="px-float" label="Rest" />;
}

export function SproutSprite({ scale = 3 }: { scale?: number }) {
  return <PixMap name="sprout" scale={scale} className="px-sway" label="Planned" />;
}

export function RunnerSprite({ scale = 3 }: { scale?: number }) {
  return <PixMap name="run" scale={scale} className="px-run" label="Jogging" />;
}

export function SunflowerSprite({ scale = 5 }: { scale?: number }) {
  return <PixMap name="sunflower" scale={scale} className="px-bloom" label="Level up" />;
}

export function ChestSprite({ open, scale = 3 }: { open: boolean; scale?: number }) {
  return <PixMap name={open ? "chestOpen" : "chest"} scale={scale} label={open ? "Quest complete" : "Quest"} />;
}

export function CakeSprite({ w = 30 }: { w?: number }) {
  return (
    <svg viewBox="0 0 12 14" className="px" style={{ width: w, height: "auto", imageRendering: "pixelated" }} role="img" aria-label="Birthday" shapeRendering="crispEdges">
      <rect x="5" y="1" width="2" height="2" fill="#ff8fb5" />
      <rect x="5" y="0" width="2" height="1" fill="#FFC93C" />
      <rect x="3" y="3" width="6" height="2" fill="#fff3c4" />
      <rect x="2" y="5" width="8" height="4" fill="#ff8fb5" />
      <rect x="2" y="5" width="8" height="1" fill="#fff3c4" />
      <rect x="3" y="7" width="1" height="2" fill="#e88ca0" />
      <rect x="6" y="7" width="1" height="2" fill="#e88ca0" />
      <rect x="1" y="9" width="10" height="3" fill="#a9743f" />
      <rect x="1" y="9" width="10" height="1" fill="#c98f4e" />
    </svg>
  );
}
