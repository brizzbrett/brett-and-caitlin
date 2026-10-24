// The hero bouquet's layout: the seven flowers in a hand-tied dome (back, middle and front rows),
// leaves around the edge, and stems that gather at the ribbon tie. Drawn by _includes/bouquet.njk.
const C = { x: 200, y: 215 }; // center of the dome
const TIE = { x: 200, y: 415 };
const rad = (d) => (d * Math.PI) / 180;
const at = (r, deg) => ({ x: C.x + r * Math.cos(rad(deg)), y: C.y + r * Math.sin(rad(deg)) });
const round = (n) => Math.round(n * 10) / 10;

const rows = [
  { r: 128, size: 68, angles: [-170, -147, -124, -101, -79, -56, -33, -10], kinds: ["cranesbill", "daisy", "cornflower", "buttercup", "poppy", "daisy", "clover", "cornflower"] },
  { r: 82, size: 72, angles: [-165, -135, -105, -75, -45, -15], kinds: ["poppy", "clover", "daisy", "cranesbill", "buttercup", "daisy"] },
  { r: 38, size: 72, angles: [-150, -90, -30], kinds: ["cornflower", "buttercup", "clover"] },
];
const flowers = [];
for (const row of rows) {
  row.angles.forEach((a, i) => flowers.push({ ...at(row.r, a), size: row.size, kind: row.kinds[i] }));
}
flowers.push(
  { x: 148, y: 258, size: 66, kind: "cranesbill" },
  { x: 252, y: 258, size: 66, kind: "cornflower" },
  { x: 200, y: 246, size: 80, kind: "poppy" },
);
// Harebells hang off the two sides, and a daisy bud sits under the front.
const fillers = [
  // Each bell hangs outward, so its stem rises from the tie and arches over into the bell.
  { x: 66, y: 252, size: 50, kind: "harebell", rot: 10, flip: true }, // mirrored
  { x: 334, y: 252, size: 50, kind: "harebell", rot: 10 },
  { x: 200, y: 298, size: 34, kind: "daisy", rot: 0 },
];

// Leaves around the outside of the dome, pointing outward.
const leaves = [];
for (let a = -178, i = 0; a <= -2; a += 16, i++) {
  const p = at(142 + (i % 2) * 10, a);
  leaves.push({ x: round(p.x), y: round(p.y), rot: a + 90, fill: i % 2 ? "#5E8C3A" : "#2F5D3A" });
}

let i = 0;
const placed = flowers.map((f) => ({
  ...f, x: round(f.x), y: round(f.y), rot: ((i * 47) % 60) - 30, i: i++,
  stem: `M${round(f.x)} ${round(f.y)} Q${round(f.x * 0.35 + TIE.x * 0.65)} ${round((f.y + TIE.y) / 2 + 20)} ${TIE.x} ${TIE.y}`,
}));

// The cut stem ends below the tie, and the bow's two ribbon tails, in lilac (the flower of May) like the bow itself.
const LILAC = "#A77BD4";
const ends = [-3, -2, -1, 0, 1, 2, 3].map((k) => `M${TIE.x + k * 3} ${TIE.y} L${TIE.x + k * 8} 556`); // drawn tie-to-end; CSS grows them from the end
const tails = [[LILAC, 150, 562], [LILAC, 252, 572]]
  .map(([color, x, y], k) => ({
    color,
    d: `M${TIE.x} ${TIE.y + 6} C${round(TIE.x + (x - TIE.x) * 0.3)} 455 ${x + (k % 2 ? 16 : -16)} 495 ${x} ${y}`,
  }));

// Filler stems join each filler to the tie: a harebell's at the free end of its own arched stem (the icon's
// point 8,8 of 64, carried through the icon's rotation and mirroring), a bud's at its center.
const stemTo = (x, y) => `M${round(x)} ${round(y)} Q${round(x * 0.35 + TIE.x * 0.65)} ${round((y + TIE.y) / 2 + 20)} ${TIE.x} ${TIE.y}`;
const fillerStem = (f) => {
  if (f.kind !== "harebell") return stemTo(f.x, f.y);
  const k = f.size / 64, px = f.x - f.size / 2 + 8 * k, py = f.y - f.size / 2 + 8 * k;
  const a = rad(f.rot), dx = px - f.x, dy = py - f.y;
  let x = f.x + dx * Math.cos(a) - dy * Math.sin(a);
  const y = f.y + dx * Math.sin(a) + dy * Math.cos(a);
  if (f.flip) x = 2 * f.x - x;
  return stemTo(x, y);
};

export default { lilac: LILAC, lilacDeep: "#7E55AE", tie: TIE, flowers: placed, fillers: fillers.map((f) => ({ ...f, i: i++, stem: fillerStem(f) })), leaves, ends, tails };
