import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const deg = (d) => d * Math.PI / 180;
const px = (cx, cy, r, angle) => [
  cx + r * Math.cos(deg(angle)),
  cy + r * Math.sin(deg(angle))
];

function makeSVG(size) {
  const s = size;
  const bg_r = Math.round(s * 0.218);

  // ── Upper S circle (gap at lower-right, 30°–120°) ──
  // Arc: 120° → 30° clockwise (270° arc) = upper-curl of S
  const u_cx = s * 0.356, u_cy = s * 0.360, u_r = s * 0.210, u_sw = s * 0.053;
  const [u_sx, u_sy] = px(u_cx, u_cy, u_r, 120);
  const [u_ex, u_ey] = px(u_cx, u_cy, u_r, 30);

  // ── Lower S circle (gap at upper-left, 210°–300°) ──
  // Arc: 300° → 210° clockwise (270° arc) = lower-curl of S
  const l_cx = s * 0.497, l_cy = s * 0.630, l_r = s * 0.178, l_sw = s * 0.044;
  const [l_sx, l_sy] = px(l_cx, l_cy, l_r, 300);
  const [l_ex, l_ey] = px(l_cx, l_cy, l_r, 210);

  // ── B letter ──
  const b_x = s * 0.660, b_y = s * 0.568, b_fs = s * 0.308;

  // ── Book (inside lower S loop, NOT overlapping B) ──
  const bk_x = s * 0.428, bk_y = s * 0.646;
  const bw = s * 0.092, bh = s * 0.062;

  // ── Orange dot ──
  const d_x = s * 0.576, d_y = s * 0.187, d_r = s * 0.037;
  const ray = d_r * 0.48, g1 = d_r * 1.70, g2 = d_r * 2.26;

  const t = (n) => n.toFixed(2);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#1a3c95"/>
      <stop offset="55%"  stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#4a8fd8"/>
    </linearGradient>
    <linearGradient id="teal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#40d0c8"/>
      <stop offset="100%" stop-color="#2ecfbc"/>
    </linearGradient>
    <filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="${(s * 0.013).toFixed(1)}" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${s}" height="${s}" rx="${bg_r}" fill="url(#bg)"/>

  <!--
    Upper S arc: 270° arc from 120° to 30° CW.
    Gap (hidden) is from 30° to 120° = lower-right quarter → opens down-right.
    This creates the TOP curl of the S letter.
  -->
  <path
    d="M ${t(u_sx)},${t(u_sy)} A ${t(u_r)},${t(u_r)} 0 1,1 ${t(u_ex)},${t(u_ey)}"
    fill="none" stroke="url(#teal)"
    stroke-width="${t(u_sw)}" stroke-linecap="round"
    filter="url(#glow)"
  />

  <!--
    Lower S arc: 270° arc from 300° to 210° CW.
    Gap (hidden) is from 210° to 300° = upper-left quarter → opens up-left.
    This creates the BOTTOM curl of the S letter.
  -->
  <path
    d="M ${t(l_sx)},${t(l_sy)} A ${t(l_r)},${t(l_r)} 0 1,1 ${t(l_ex)},${t(l_ey)}"
    fill="none" stroke="url(#teal)"
    stroke-width="${t(l_sw)}" stroke-linecap="round"
    filter="url(#glow)" opacity="0.93"
  />

  <!-- B letter (white, bold) -->
  <text
    x="${t(b_x)}" y="${t(b_y)}"
    text-anchor="middle" dominant-baseline="middle"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900" font-size="${t(b_fs)}"
    fill="white" opacity="0.92"
  >B</text>

  <!-- Open book inside lower S loop -->
  <path d="M ${t(bk_x - bw * 0.06)},${t(bk_y - bh)}
           Q ${t(bk_x - bw * 1.16)},${t(bk_y - bh * 0.6)} ${t(bk_x - bw * 1.18)},${t(bk_y + bh)}
           L ${t(bk_x - bw * 0.06)},${t(bk_y + bh)} Z"
        fill="white" opacity="0.93"/>
  <path d="M ${t(bk_x + bw * 0.06)},${t(bk_y - bh)}
           Q ${t(bk_x + bw * 1.16)},${t(bk_y - bh * 0.6)} ${t(bk_x + bw * 1.18)},${t(bk_y + bh)}
           L ${t(bk_x + bw * 0.06)},${t(bk_y + bh)} Z"
        fill="rgba(255,255,255,0.80)"/>
  <rect x="${t(bk_x - bw * 0.09)}" y="${t(bk_y - bh * 1.06)}"
        width="${t(bw * 0.18)}" height="${t(bh * 2.12)}"
        rx="${t(bw * 0.09)}" fill="white"/>
  <line x1="${t(bk_x - bw * 1.05)}" y1="${t(bk_y - bh * 0.22)}" x2="${t(bk_x - bw * 0.18)}" y2="${t(bk_y - bh * 0.25)}"
        stroke="rgba(37,99,235,0.42)" stroke-width="${t(s * 0.0055)}" stroke-linecap="round"/>
  <line x1="${t(bk_x - bw * 1.05)}" y1="${t(bk_y + bh * 0.14)}" x2="${t(bk_x - bw * 0.18)}" y2="${t(bk_y + bh * 0.11)}"
        stroke="rgba(37,99,235,0.42)" stroke-width="${t(s * 0.0055)}" stroke-linecap="round"/>
  <line x1="${t(bk_x - bw * 1.05)}" y1="${t(bk_y + bh * 0.50)}" x2="${t(bk_x - bw * 0.18)}" y2="${t(bk_y + bh * 0.47)}"
        stroke="rgba(37,99,235,0.42)" stroke-width="${t(s * 0.0055)}" stroke-linecap="round"/>

  <!-- Orange spark dot -->
  <circle cx="${t(d_x)}" cy="${t(d_y)}" r="${t(d_r)}"       fill="#f97316" opacity="0.95"/>
  <circle cx="${t(d_x)}" cy="${t(d_y)}" r="${t(d_r * 0.5)}"  fill="#fbbf24"/>
  <line x1="${t(d_x)}"                 y1="${t(d_y - g1)}"          x2="${t(d_x)}"                 y2="${t(d_y - g2)}"          stroke="#f97316" stroke-width="${t(ray)}" stroke-linecap="round"/>
  <line x1="${t(d_x + g1 * 0.866)}"   y1="${t(d_y - g1 * 0.5)}"   x2="${t(d_x + g2 * 0.866)}"   y2="${t(d_y - g2 * 0.5)}"   stroke="#f97316" stroke-width="${t(ray)}" stroke-linecap="round"/>
  <line x1="${t(d_x + g1 * 0.866)}"   y1="${t(d_y + g1 * 0.5)}"   x2="${t(d_x + g2 * 0.866)}"   y2="${t(d_y + g2 * 0.5)}"   stroke="#f97316" stroke-width="${t(ray)}" stroke-linecap="round"/>
  <line x1="${t(d_x)}"                 y1="${t(d_y + g1)}"          x2="${t(d_x)}"                 y2="${t(d_y + g2)}"          stroke="#f97316" stroke-width="${t(ray)}" stroke-linecap="round"/>
  <line x1="${t(d_x - g1 * 0.866)}"   y1="${t(d_y + g1 * 0.5)}"   x2="${t(d_x - g2 * 0.866)}"   y2="${t(d_y + g2 * 0.5)}"   stroke="#f97316" stroke-width="${t(ray)}" stroke-linecap="round"/>
  <line x1="${t(d_x - g1 * 0.866)}"   y1="${t(d_y - g1 * 0.5)}"   x2="${t(d_x - g2 * 0.866)}"   y2="${t(d_y - g2 * 0.5)}"   stroke="#f97316" stroke-width="${t(ray)}" stroke-linecap="round"/>
</svg>`;
}

async function generate() {
  for (const size of [192, 512]) {
    const svg = Buffer.from(makeSVG(size));
    await sharp(svg).png().toFile(join(publicDir, `icon-${size}.png`));
    console.log(`✓ icon-${size}.png`);
  }
  const svg180 = Buffer.from(makeSVG(180));
  await sharp(svg180).png().toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png');
}

generate().catch(console.error);
