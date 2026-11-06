// =============================================================
// 상황 컷씬 — 카드가 시작될 때 / 출퇴근할 때 재생되는 애니메이션 일러스트 (SVG + CSS)
// 규칙: 요소의 기본 상태 = 마지막 장면. CSS 애니메이션은 '처음 상태 → 기본 상태'로 움직인다.
//       그래서 정지 화면(.still)에서는 애니메이션만 끄면 최종 장면이 그대로 보인다.
//       .tmp 요소는 연출 중에만 잠깐 보이는 것(전화 벨 파동, 날아가는 종이비행기 등).
// =============================================================
const Scenes = (() => {
  const W = 640, H = 360;
  const FONT = "Pretendard, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
  const e = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const L = (id) => ({ ...DEFAULT_LOOK, ...(LOOKS[id] || id || {}) });

  // ---------- 애니메이션 래퍼 ----------
  // cls: 애니메이션 클래스, d: 지연(초), extra: 추가 style
  const A = (cls, d, inner, extra) => `<g class="${cls}" style="animation-delay:${d || 0}s;${extra || ""}">${inner}</g>`;
  const at = (x, y, inner, s) => `<g transform="translate(${x},${y})${s && s !== 1 ? ` scale(${s})` : ""}">${inner}</g>`;
  const T = (x, y, txt, o) => {
    o = o || {};
    return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${o.fs || 14}" font-weight="${o.fw || 600}" fill="${o.c || "#1f2733"}" text-anchor="${o.a || "start"}"${o.ls ? ` letter-spacing="${o.ls}"` : ""}>${e(txt)}</text>`;
  };

  // 한글 폭 대략 계산 후 줄바꿈
  const tw = (s, fs) => [...s].reduce((w, ch) => w + (/[ㄱ-힝]/.test(ch) ? 0.98 : /[A-Z0-9%]/.test(ch) ? 0.62 : /\s/.test(ch) ? 0.3 : 0.52) * fs, 0);
  function wrap(s, maxW, fs) {
    const out = []; let line = "";
    for (const word of s.split(" ")) {
      const t = line ? line + " " + word : word;
      if (tw(t, fs) > maxW && line) { out.push(line); line = word; } else line = t;
    }
    if (line) out.push(line);
    return out;
  }

  // ---------- 말풍선 ----------
  // tail: 꼬리 방향 "bl"(아래 왼쪽) "br" "b" | think: 생각 풍선
  function bubble(x, y, text, o) {
    o = o || {};
    const fs = o.fs || 15, maxW = o.maxW || 210, lines = wrap(text, maxW, fs);
    const w = Math.max(...lines.map((l) => tw(l, fs))) + 28, h = lines.length * (fs * 1.4) + 18;
    const bx = o.anchor === "r" ? x - w : o.anchor === "c" ? x - w / 2 : x, by = y - h;
    const fill = o.fill || "#fff", stroke = o.stroke || "#1f2733";
    const tail = o.think
      ? `<circle cx="${o.tx || bx + 26}" cy="${by + h + 9}" r="6" fill="${fill}" stroke="${stroke}" stroke-width="2"/><circle cx="${(o.tx || bx + 26) - 8}" cy="${by + h + 21}" r="3.5" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
      : (() => { const tx = o.tx != null ? o.tx : o.anchor === "r" ? bx + w - 30 : bx + 30, dir = o.tdir || (o.anchor === "r" ? 1 : -1);
        return `<path d="M${tx - 9},${by + h - 1} L${tx + dir * 12},${by + h + 16} L${tx + 9},${by + h - 1}Z" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/><rect x="${tx - 10}" y="${by + h - 4}" width="20" height="4" fill="${fill}"/>`; })();
    const body = `<rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="${o.think ? h / 2.2 : 14}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>${tail}
      ${lines.map((l, i) => T(bx + w / 2, by + 9 + fs * 1.05 + i * fs * 1.4, l, { fs, a: "middle", c: o.color || "#1f2733" })).join("")}`;
    return A("c-pop c-orig-b", o.d, body);
  }
  const chip = (x, y, text, o) => {
    o = o || {}; const fs = o.fs || 13, w = tw(text, fs) + 22;
    return A(o.cls || "c-in", o.d, `<rect x="${x}" y="${y}" width="${w}" height="${fs + 13}" rx="${(fs + 13) / 2}" fill="${o.bg || "#1f2733"}" opacity="${o.op || 0.88}"/>${T(x + 11, y + fs + 3, text, { fs, c: o.c || "#fff" })}`);
  };

  // ---------- 사람 ----------
  // 원점 = 두 발 가운데. 키 약 200. pose: stand | phone | think | point | wave | hold | cheer | arms
  // expr: smile | worry | surprise | angry | tired | neutral | happy
  function person(look, o) {
    o = o || {};
    const lk = { ...DEFAULT_LOOK, ...look }, sk = lk.skin, hr = lk.hair, sh = lk.shirt, pt = lk.pants;
    const gx = o.gaze || 0, ex = o.expr || "neutral";
    const darker = shade(sh, -0.18);
    const arm = (side, ang, cls) => {
      const sx = side < 0 ? -25 : 25;
      return `<g transform="translate(${sx},-122)"><g class="${cls || ""}"><g transform="rotate(${ang})"><rect x="-6" y="-4" width="12" height="54" rx="6" fill="${darker}"/><circle cx="0" cy="54" r="7.5" fill="${sk}"/></g></g></g>`;
    };
    const poses = {
      stand: [8, -8], phone: [8, -166], think: [8, -173], point: [8, -96], wave: [8, -150], hold: [-30, 30],
      cheer: [150, -150], arms: [40, -40], tea: [8, -40],
    };
    const [al, ar] = poses[o.pose || "stand"];
    const hairBack = lk.style === "long" ? `<path d="M-33,-165 Q-36,-118 -26,-104 L26,-104 Q36,-118 33,-165Z" fill="${hr}"/>` : "";
    const hairTop = `<path d="M-32,-158 Q-34,-198 0,-197 Q34,-198 32,-158 Q27,-176 10,-178 Q-6,-171 -20,-176 Q-28,-172 -32,-158Z" fill="${hr}"/>` +
      (lk.style === "bun" ? `<circle cx="0" cy="-200" r="13" fill="${hr}"/>` : "") +
      (lk.style === "long" ? `<path d="M-32,-162 Q-35,-140 -31,-122 L-26,-124 Q-29,-148 -27,-166Z M32,-162 Q35,-140 31,-122 L26,-124 Q29,-148 27,-166Z" fill="${hr}"/>` : "");
    const brows = { worry: `<path d="M${-15 + gx},-172 L${-5 + gx},-169 M${15 + gx},-172 L${5 + gx},-169" stroke="${shade(hr, -0.1)}" stroke-width="2.6" stroke-linecap="round" transform="rotate(0)"/>`,
      angry: `<path d="M${-16 + gx},-174 L${-4 + gx},-168 M${16 + gx},-174 L${4 + gx},-168" stroke="#2a1d18" stroke-width="3.2" stroke-linecap="round"/>`,
      surprise: `<path d="M${-15 + gx},-176 Q${-10 + gx},-180 ${-5 + gx},-176 M${15 + gx},-176 Q${10 + gx},-180 ${5 + gx},-176" stroke="#2a1d18" stroke-width="2.4" fill="none" stroke-linecap="round"/>` }[ex] || "";
    const eyes = ex === "tired"
      ? `<path d="M${-14 + gx},-158 L${-6 + gx},-158 M${6 + gx},-158 L${14 + gx},-158" stroke="#1f2733" stroke-width="3" stroke-linecap="round"/>`
      : ex === "happy"
        ? `<path d="M${-14 + gx},-157 Q${-10 + gx},-163 ${-6 + gx},-157 M${6 + gx},-157 Q${10 + gx},-163 ${14 + gx},-157" stroke="#1f2733" stroke-width="2.8" fill="none" stroke-linecap="round"/>`
        : `<g class="c-blink"><ellipse cx="${-10 + gx}" cy="-158" rx="3.3" ry="${ex === "surprise" ? 4.6 : 3.8}" fill="#1f2733"/><ellipse cx="${10 + gx}" cy="-158" rx="3.3" ry="${ex === "surprise" ? 4.6 : 3.8}" fill="#1f2733"/></g>`;
    const mouth = {
      smile: `<path d="M${-8 + gx},-144 Q${gx},-136 ${8 + gx},-144" stroke="#7a3b2e" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
      happy: `<path d="M${-9 + gx},-145 Q${gx},-133 ${9 + gx},-145Z" fill="#7a3b2e"/>`,
      worry: `<path d="M${-7 + gx},-139 Q${gx},-145 ${7 + gx},-139" stroke="#7a3b2e" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
      surprise: `<ellipse cx="${gx}" cy="-140" rx="5" ry="6.5" fill="#7a3b2e"/>`,
      angry: `<path d="M${-9 + gx},-137 Q${gx},-145 ${9 + gx},-137" stroke="#7a3b2e" stroke-width="3" fill="none" stroke-linecap="round"/>`,
      tired: `<path d="M${-6 + gx},-141 L${6 + gx},-141" stroke="#7a3b2e" stroke-width="2.6" stroke-linecap="round"/>`,
    }[ex] || `<path d="M${-6 + gx},-142 Q${gx},-139 ${6 + gx},-142" stroke="#7a3b2e" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    const glasses = lk.glasses ? `<g stroke="#2b2b33" stroke-width="2" fill="rgba(255,255,255,.18)"><circle cx="${-10 + gx}" cy="-158" r="8.5"/><circle cx="${10 + gx}" cy="-158" r="8.5"/><path d="M${-1.5 + gx},-158 L${1.5 + gx},-158"/></g>` : "";
    const tie = lk.tie ? `<path d="M-4,-126 L4,-126 L6,-86 L0,-78 L-6,-86Z" fill="${lk.tie}"/>` : `<path d="M-9,-128 L0,-118 L9,-128" stroke="${shade(sh, -0.3)}" stroke-width="2" fill="none"/>`;
    const sweat = o.sweat ? A("c-drip", o.sweatD || 0, `<path d="M30,-186 Q36,-176 30,-171 Q24,-176 30,-186Z" fill="#7cc4f2" stroke="#3d8fd1" stroke-width="1.2"/>`) : "";
    const held = o.pose === "phone" ? `<rect x="22" y="-190" width="12" height="24" rx="3" fill="#2b2f3a" transform="rotate(14 28 -178)"/>`
      : o.pose === "hold" ? `<rect x="-22" y="-112" width="44" height="54" rx="3" fill="#fff" stroke="#c9d2de" stroke-width="2"/><path d="M-14,-100 H14 M-14,-91 H10 M-14,-82 H12 M-14,-73 H6" stroke="#9aa6b6" stroke-width="2.4" stroke-linecap="round"/>`
      : o.pose === "tea" ? `<g transform="translate(24,-74)"><rect x="-8" y="-10" width="16" height="18" rx="3" fill="#fff" stroke="#c9d2de" stroke-width="1.5"/><path d="M8,-6 Q14,-3 8,2" stroke="#c9d2de" stroke-width="2" fill="none"/></g>` : "";
    const legs = o.seated ? "" : `<rect x="-17" y="-68" width="14" height="66" rx="6" fill="${pt}"/><rect x="3" y="-68" width="14" height="66" rx="6" fill="${pt}"/>
      <ellipse cx="-11" cy="-1" rx="11" ry="5" fill="#2b2b33"/><ellipse cx="11" cy="-1" rx="11" ry="5" fill="#2b2b33"/>`;
    const body = `${legs}
      ${arm(-1, al)}
      <rect x="-27" y="-130" width="54" height="${o.seated ? 130 : 70}" rx="16" fill="${sh}"/>
      ${o.seated ? "" : `<rect x="-27" y="-74" width="54" height="10" rx="3" fill="${pt}"/>`}
      ${tie}
      ${o.pose === "wave" ? `<g transform="translate(25,-122)"><g class="c-wave"><g transform="rotate(-150)"><rect x="-6" y="-4" width="12" height="54" rx="6" fill="${darker}"/><circle cx="0" cy="54" r="7.5" fill="${sk}"/></g></g></g>` : arm(1, ar)}
      ${held}
      <rect x="-7" y="-136" width="14" height="10" fill="${shade(sk, -0.08)}"/>
      ${hairBack}
      <circle cx="0" cy="-158" r="30" fill="${sk}"/>
      <ellipse cx="-29" cy="-156" rx="5" ry="7" fill="${shade(sk, -0.06)}"/><ellipse cx="29" cy="-156" rx="5" ry="7" fill="${shade(sk, -0.06)}"/>
      ${hairTop}
      <ellipse cx="${-17 + gx}" cy="-146" rx="5.5" ry="3.2" fill="#ff8f8f" opacity=".35"/><ellipse cx="${17 + gx}" cy="-146" rx="5.5" ry="3.2" fill="#ff8f8f" opacity=".35"/>
      ${brows}${eyes}${glasses}${mouth}${sweat}`;
    const shadowEl = o.seated ? "" : `<ellipse cx="0" cy="0" rx="34" ry="7" fill="rgba(0,0,0,.14)"/>`;
    return `${shadowEl}<g class="${o.idle === false ? "" : "c-breathe"}">${body}</g>`;
  }
  // 몸 전체 배치 + 애니메이션 묶음
  const P = (x, y, s, look, o, anim) => at(x, y, anim ? A(anim.cls, anim.d, person(look, o), anim.style) : person(look, o), s);
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
    return "#" + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
  }

  // ---------- 배경 · 소품 ----------
  function bgOffice(o) {
    o = o || {};
    const sky = o.night ? ["#1b2440", "#2c3a63"] : o.sunset ? ["#f6b26b", "#f9d9a6"] : ["#8cc8f0", "#d8eefb"];
    const wall = o.night ? "#3a4258" : "#eef1f5", floor = o.night ? "#4b4652" : "#d8c6a8";
    return `<defs><linearGradient id="sk${o.id || ""}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="${wall}"/>
      <rect y="262" width="${W}" height="${H - 262}" fill="${floor}"/>
      <rect y="258" width="${W}" height="6" fill="${o.night ? "#2e3445" : "#c9cfd8"}"/>
      ${(o.win || [[40, 40, 150, 120], [450, 40, 150, 120]]).map(([x, y, w, h]) => `<rect x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${h + 12}" rx="6" fill="${o.night ? "#232a3b" : "#fff"}"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#sk${o.id || ""})"/>
        ${o.night ? `<circle cx="${x + w - 30}" cy="${y + 30}" r="13" fill="#f6efc4"/><circle cx="${x + w - 24}" cy="${y + 26}" r="12" fill="#2a3557"/>
          ${[[0.2, 0.3], [0.45, 0.2], [0.3, 0.65], [0.6, 0.55], [0.15, 0.8]].map(([a, b]) => `<circle class="c-twinkle" style="animation-delay:${a * 3}s" cx="${x + w * a}" cy="${y + h * b}" r="1.6" fill="#fff"/>`).join("")}`
          : `<g opacity=".85"><rect x="${x + 14}" y="${y + h - 46}" width="22" height="46" fill="${o.sunset ? "#c98a63" : "#a7c4dc"}"/><rect x="${x + 40}" y="${y + h - 70}" width="28" height="70" fill="${o.sunset ? "#b97b58" : "#93b4d0"}"/><rect x="${x + 72}" y="${y + h - 38}" width="24" height="38" fill="${o.sunset ? "#d29a72" : "#b6cfe3"}"/><rect x="${x + 100}" y="${y + h - 58}" width="30" height="58" fill="${o.sunset ? "#c08562" : "#9fbdd6"}"/></g>
             <g class="c-cloud"><ellipse cx="${x + 40}" cy="${y + 28}" rx="20" ry="8" fill="#fff" opacity=".9"/><ellipse cx="${x + 54}" cy="${y + 24}" rx="14" ry="8" fill="#fff" opacity=".9"/></g>`}
        <path d="M${x + w / 2},${y} V${y + h}" stroke="${o.night ? "#232a3b" : "#fff"}" stroke-width="5"/>`).join("")}
      ${o.sign !== false ? `<g><rect x="262" y="34" width="116" height="34" rx="8" fill="${o.night ? "#2c3346" : "#1f2733"}"/>${T(320, 57, o.sign || "인사팀 · HR", { fs: 14, a: "middle", c: "#ffd27a", fw: 700 })}</g>` : ""}`;
  }
  const plant = (x, y, s) => at(x, y, `<g class="c-sway"><ellipse cx="-14" cy="-58" rx="12" ry="24" fill="#3f8a68" transform="rotate(-24 -14 -58)"/><ellipse cx="14" cy="-60" rx="12" ry="26" fill="#4fa37c" transform="rotate(22 14 -60)"/><ellipse cx="0" cy="-70" rx="11" ry="28" fill="#5cb88b"/></g><path d="M-18,-36 L18,-36 L13,0 L-13,0Z" fill="#c8794a"/>`, s);
  const desk = (x, y, w, o) => {
    o = o || {};
    return `<g><rect x="${x}" y="${y}" width="${w}" height="14" rx="4" fill="${o.top || "#b98a5e"}"/><rect x="${x + 8}" y="${y + 14}" width="${w - 16}" height="${H - y - 14}" fill="${o.front || "#a37650"}"/>
      <rect x="${x + 8}" y="${y + 14}" width="${w - 16}" height="6" fill="rgba(0,0,0,.12)"/></g>`;
  };
  // 모니터 (screen: 내부 SVG, 좌표 0..sw, 0..sh)
  const monitor = (x, y, sw, sh, screen) => `<g transform="translate(${x},${y})">
    <rect x="${sw / 2 - 8}" y="${sh}" width="16" height="22" fill="#5b6270"/><rect x="${sw / 2 - 30}" y="${sh + 20}" width="60" height="6" rx="3" fill="#5b6270"/>
    <rect x="-8" y="-8" width="${sw + 16}" height="${sh + 16}" rx="8" fill="#2b2f3a"/>
    <rect width="${sw}" height="${sh}" rx="3" fill="#f7f9fc"/>
    <svg width="${sw}" height="${sh}" viewBox="0 0 ${sw} ${sh}" overflow="hidden">${screen || ""}</svg></g>`;
  const mug = (x, y, steam) => at(x, y, `${steam ? `<g opacity=".6">${[0, 1].map((k) => `<path class="c-rise" style="animation-delay:${k * 0.7}s" d="M${-4 + k * 8},-20 q-5,-8 0,-16 q5,-8 0,-16" stroke="#cfd6df" stroke-width="2.5" fill="none" stroke-linecap="round"/>`).join("")}</g>` : ""}
    <rect x="-11" y="-18" width="22" height="20" rx="4" fill="#fff" stroke="#c9d2de" stroke-width="1.5"/><path d="M11,-13 Q19,-9 11,-3" stroke="#c9d2de" stroke-width="2.4" fill="none"/>`);
  const clock = (x, y, r, hh, mm, spin) => {
    const ha = (hh % 12) * 30 + mm * 0.5, ma = mm * 6;
    return at(x, y, `<circle r="${r + 4}" fill="#2b2f3a"/><circle r="${r}" fill="#fff"/>
      ${Array.from({ length: 12 }, (_, i) => `<rect x="-1.2" y="${-r + 3}" width="2.4" height="${i % 3 ? 4 : 7}" fill="#2b2f3a" transform="rotate(${i * 30})"/>`).join("")}
      <g transform="rotate(${ha})"><g class="${spin ? "c-spin-h" : ""}"><rect x="-2.5" y="${-r * 0.5}" width="5" height="${r * 0.5}" rx="2" fill="#2b2f3a"/></g></g>
      <g transform="rotate(${ma})"><g class="${spin ? "c-spin" : ""}"><rect x="-1.6" y="${-r * 0.8}" width="3.2" height="${r * 0.8}" rx="1.5" fill="#c2453d"/></g></g>
      <circle r="3.5" fill="#2b2f3a"/>`);
  };
  const qmarks = (x, y, d, txt) => A("c-pop", d, at(x, y, `${A("c-float", 0, `${T(0, 0, txt || "?", { fs: 30, fw: 800, c: "#e8a33d" })}${T(22, -16, txt === "!" ? "!" : "?", { fs: 22, fw: 800, c: "#e8a33d" })}`)}`));
  const doc = (x, y, label, color) => at(x, y, `<rect x="-26" y="-34" width="52" height="66" rx="4" fill="#fff" stroke="#c9d2de" stroke-width="2"/><rect x="-26" y="-34" width="52" height="14" rx="4" fill="${color || "#5b8def"}"/>
    ${T(0, -23, label, { fs: 9, a: "middle", c: "#fff", fw: 700 })}<path d="M-16,-8 H16 M-16,2 H12 M-16,12 H14 M-16,22 H6" stroke="#b5bfcc" stroke-width="2.4" stroke-linecap="round"/>`);

  // ---------- 개별 장면 ----------
  // 반환: { svg, dur(ms), place, sfx: [[초, 효과음]] }
  const SC = {};

  // 출근 · 퇴근 엘리베이터
  SC.elevator = (ctx, dir) => {
    const up = dir !== "down", day = ctx.day || 1, me = ctx.me;
    const night = !up;
    const wall = night ? "#3a4258" : "#e9ecf1";
    const floors = up ? [1, 2, 3, 4, 5, 6] : [7, 6, 5, 4, 3, 2], last = up ? 7 : 1;
    const step = 0.2, t0 = up ? 0.15 : 1.9;
    const expr = up ? ["worry", "neutral", "neutral", "neutral", "smile"][day - 1] : ["tired", "smile", "neutral", "tired", "happy"][day - 1];
    const pose = up ? ["stand", "tea", "hold", "stand", "wave"][day - 1] : "stand";
    const others = up ? [null, "jungmin", null, "mina", "visitor"][day - 1] : null;
    const interior = `<rect x="206" y="92" width="228" height="240" fill="${night ? "#8a8e98" : "#c7ccd5"}"/>
      <rect x="206" y="92" width="228" height="12" fill="${night ? "#f3e6b8" : "#fffbe8"}" opacity=".9"/>
      <rect x="216" y="170" width="208" height="6" rx="3" fill="#9aa1ad"/>
      <path d="M206,332 L434,332 L434,300 L206,300Z" fill="${night ? "#6c6f78" : "#a9aeb8"}"/>`;
    // 탑승자
    const meIn = up
      ? A("c-stepout", 2.25, P(320, 336, 0.82, me, { expr, pose, sweat: day === 1 }))
      : A("c-enter", 0.1, P(320, 336, 0.82, me, { expr, pose, sweat: false, gaze: 0 }));
    const other = others ? P(400, 330, 0.7, L(others), { expr: "smile", pose: "stand" }) : "";
    const doorsCls = up ? "c-door-open" : "c-door-close";
    const doors = `<defs><clipPath id="evclip"><rect x="206" y="92" width="228" height="240"/></clipPath></defs>
      <g clip-path="url(#evclip)">
        <g class="${doorsCls}" style="--dx:${up ? "114px" : "-114px"};animation-delay:${up ? 1.75 : 0.95}s"><rect x="${up ? 92 : 206}" y="92" width="114" height="240" fill="#b8bec8"/><rect x="${up ? 92 : 206}" y="92" width="114" height="240" fill="url(#steel)"/></g>
        <g class="${doorsCls}" style="--dx:${up ? "-114px" : "114px"};animation-delay:${up ? 1.75 : 0.95}s"><rect x="${up ? 434 : 320}" y="92" width="114" height="240" fill="#b8bec8"/><rect x="${up ? 434 : 320}" y="92" width="114" height="240" fill="url(#steel)"/></g>
      </g>`;
    const display = `<rect x="270" y="40" width="100" height="38" rx="6" fill="#1b1f27"/>
      ${floors.map((f, i) => A("c-flash", t0 + i * step, T(334, 67, `${f}F`, { fs: 22, fw: 800, a: "middle", c: "#ff8a3d" }), `animation-duration:${step}s`)).join("")}
      ${A("c-in", t0 + floors.length * step, T(334, 67, `${last}F`, { fs: 22, fw: 800, a: "middle", c: "#ffb36b" }))}
      ${T(292, 66, up ? "▲" : "▼", { fs: 16, a: "middle", c: "#ff8a3d" })}`;
    return {
      place: up ? `🏢 하이브릿지 본사 7층 · 오전 8:5${day}` : `🌙 퇴근길 · 오후 ${["6:05", "6:30", "7:10", "8:40", "6:00"][day - 1]}`,
      dur: up ? 4200 : 4000,
      sfx: up ? [[1.55, "ding"]] : [[0.95, "door"], [3.3, "ding"]],
      svg: `<defs><linearGradient id="steel" x1="0" x2="1"><stop offset="0" stop-color="#d9dde3"/><stop offset=".5" stop-color="#b3b9c3"/><stop offset="1" stop-color="#cdd2d9"/></linearGradient></defs>
        <rect width="${W}" height="${H}" fill="${wall}"/>
        <rect y="332" width="${W}" height="28" fill="${night ? "#3d3a44" : "#cfc4b2"}"/>
        ${night ? `<rect width="${W}" height="${H}" fill="rgba(20,26,48,.25)"/>` : ""}
        ${interior}${other}${meIn}${doors}
        <rect x="196" y="84" width="248" height="252" rx="4" fill="none" stroke="${night ? "#596178" : "#9ba3af"}" stroke-width="12"/>
        ${display}
        <g transform="translate(468,190)"><rect width="34" height="66" rx="6" fill="#9ba3af"/><circle cx="17" cy="20" r="9" fill="${up ? "#ffd27a" : "#e7eaef"}" stroke="#6b7380" stroke-width="2"/>${T(17, 25, "▲", { fs: 10, a: "middle", c: "#3b4250" })}<circle cx="17" cy="46" r="9" fill="${up ? "#e7eaef" : "#ffd27a"}" stroke="#6b7380" stroke-width="2"/>${T(17, 51, "▼", { fs: 10, a: "middle", c: "#3b4250" })}</g>
        <g><rect x="30" y="110" width="140" height="120" rx="10" fill="${night ? "#2c3346" : "#fff"}" stroke="${night ? "#4a5268" : "#d6dbe3"}" stroke-width="2"/>
          ${T(100, 142, "㈱하이브릿지", { fs: 15, fw: 800, a: "middle", c: night ? "#ffd27a" : "#1f2733" })}
          ${T(100, 168, "7F  인사팀 · 경영지원", { fs: 12, a: "middle", c: night ? "#c9d0de" : "#5a6475" })}
          ${T(100, 190, "6F  영업 · 마케팅", { fs: 12, a: "middle", c: night ? "#9aa3b5" : "#8a93a3" })}
          ${T(100, 212, "5F  개발", { fs: 12, a: "middle", c: night ? "#9aa3b5" : "#8a93a3" })}</g>
        ${plant(580, 332, 1.1)}
        ${up && day === 1 ? qmarks(372, 160, 2.9, "?") : ""}
        ${up && day === 5 ? bubble(350, 150, "벌써 100일!", { d: 3.0, fs: 14 }) : ""}
        ${!up && day === 4 ? bubble(350, 160, "하아… 오늘 길었다", { d: 2.4, fs: 13, think: true }) : ""}`,
    };
  };

  SC.c01 = (ctx) => ({
    place: "💻 내 자리 · 오전 9:40", dur: 3600, sfx: [[0.9, "pop"], [1.9, "pop"]],
    svg: `${bgOffice({ id: "a", win: [[460, 40, 140, 110]] })}
      <g><rect x="40" y="70" width="170" height="150" rx="6" fill="#dfeaf5" stroke="#b9c7d6" stroke-width="4"/>${T(125, 92, "회의실 A · 회의 중", { fs: 12, a: "middle", c: "#5a6475" })}
        ${P(95, 210, 0.5, L("jungmin"), { expr: "neutral" })}${P(160, 210, 0.5, L("jihoon"), { expr: "neutral" })}
        <rect x="40" y="70" width="170" height="150" rx="6" fill="rgba(200,225,245,.35)"/></g>
      ${A("c-pop", 1.9, `<g><rect x="72" y="226" width="110" height="26" rx="13" fill="#c2453d"/>${A("c-pulse", 0, `<circle cx="88" cy="239" r="5" fill="#fff"/>`)}${T(98, 244, "방해 금지", { fs: 13, c: "#fff" })}</g>`)}
      ${P(230, 340, 0.92, ctx.me, { expr: "worry", pose: "think", sweat: true, sweatD: 1.3 })}
      ${desk(270, 262, 340)}
      ${monitor(330, 120, 230, 128, `<rect width="230" height="18" fill="#e3e8ef"/><circle cx="10" cy="9" r="3" fill="#f08a7e"/><circle cx="20" cy="9" r="3" fill="#f5c26b"/><circle cx="30" cy="9" r="3" fill="#7ccf8a"/>
        ${T(14, 40, "📘 인사팀 업무 매뉴얼", { fs: 13, fw: 700 })}<rect x="14" y="52" width="160" height="6" rx="3" fill="#dfe5ec"/><rect x="14" y="64" width="190" height="6" rx="3" fill="#dfe5ec"/><rect x="14" y="76" width="120" height="6" rx="3" fill="#dfe5ec"/>
        ${A("c-pop", 0.9, `<g><rect x="38" y="34" width="154" height="74" rx="8" fill="#fff" stroke="#c2453d" stroke-width="2.5"/>${T(115, 64, "🔒 접근 권한 없음", { fs: 14, fw: 800, a: "middle", c: "#c2453d" })}${T(115, 86, "관리자에게 문의하세요", { fs: 10, a: "middle", c: "#7a8494" })}</g>`)}`)}
      ${mug(580, 262)}
      ${qmarks(262, 128, 1.4)}`,
  });

  SC.c02 = (ctx) => ({
    place: "💻 내 자리 · 오후 5:30", dur: 3600, sfx: [[2.1, "pop"]],
    svg: `${bgOffice({ id: "b", sunset: true, win: [[470, 40, 130, 110]] })}
      ${clock(110, 110, 52, 5, 30, true)}
      ${A("c-in", 1.4, chip(62, 176, "퇴근 30분 전", { bg: "#c2453d", d: 0 }))}
      ${desk(150, 262, 460)}
      ${monitor(300, 124, 220, 120, `${T(14, 26, "📊 이번 주 지원자 서류 현황", { fs: 12, fw: 700 })}
        ${[0, 1, 2, 3].map((k) => `<rect x="14" y="${40 + k * 12}" width="${[180, 150, 170, 100][k]}" height="6" rx="3" fill="#dfe5ec"/>`).join("")}
        <rect x="14" y="94" width="192" height="14" rx="7" fill="#e3e8ef"/>${A("c-growx", 0.4, `<rect x="14" y="94" width="134" height="14" rx="7" fill="#e8a33d"/>`, "animation-duration:1.6s")}
        ${A("c-pop", 2.1, T(158, 106, "70%", { fs: 13, fw: 800, c: "#c2453d" }))}`)}
      ${P(250, 330, 0.9, ctx.me, { expr: "worry", pose: "stand", sweat: true, sweatD: 2.2 }, { cls: "c-in", d: 0 })}
      ${doc(560, 250, "할 일", "#c2453d")}
      ${bubble(380, 92, "오늘 중으로 정리해서 줘요~", { d: 0.2, fs: 13, fill: "#fff8e6" })}`,
  });

  SC.c03 = (ctx) => ({
    place: "🏢 사무실 · 오전 11:50", dur: 3800, sfx: [[0.4, "pop"], [1.5, "pop"]],
    svg: `${bgOffice({ id: "c" })}
      ${clock(320, 110, 26, 11, 50)}
      ${P(90, 336, 0.82, L("peer"), { expr: "happy", pose: "wave" }, { cls: "c-slide-l", d: 0 })}
      ${P(160, 340, 0.78, { ...DEFAULT_LOOK, shirt: "#9b7bd4", hair: "#3b2a20", style: "short" }, { expr: "smile" }, { cls: "c-slide-l", d: 0.1 })}
      ${P(320, 344, 0.92, ctx.me, { expr: "surprise" })}
      ${P(480, 340, 0.8, L("seoyeon"), { expr: "smile", pose: "wave" }, { cls: "c-slide-r", d: 1.0 })}
      ${P(552, 336, 0.82, L("jihoon"), { expr: "smile" }, { cls: "c-slide-r", d: 1.1 })}
      ${bubble(40, 150, "첫날인데 같이 점심 먹자! 🍚", { d: 0.4, fs: 13, maxW: 150 })}
      ${bubble(600, 150, "오늘 환영 점심 할까요?", { d: 1.5, fs: 13, maxW: 150, anchor: "r" })}
      ${A("c-in", 2.4, `${A("c-look", 0, `${T(306, 150, "◀", { fs: 16, c: "#e8a33d" })}${T(334, 150, "▶", { fs: 16, c: "#e8a33d" })}`)}`)}
      ${qmarks(345, 125, 2.6, "!")}`,
  });

  SC.c04 = (ctx) => ({
    place: "💻 내 자리 · 오후 2:10", dur: 4000, sfx: [[0.1, "ring"], [0.9, "ring"], [1.9, "pop"]],
    svg: `${bgOffice({ id: "d", win: [[40, 40, 140, 110]] })}
      <g><rect x="440" y="40" width="160" height="150" rx="6" fill="#fff" stroke="#d6dbe3" stroke-width="2"/><rect x="440" y="40" width="160" height="28" rx="6" fill="#5b8def"/>${T(520, 60, "11월 면접 일정", { fs: 13, a: "middle", c: "#fff" })}
        ${Array.from({ length: 15 }, (_, i) => `<rect x="${450 + (i % 5) * 29}" y="${78 + Math.floor(i / 5) * 34}" width="25" height="28" rx="3" fill="#f1f4f8"/>${T(454 + (i % 5) * 29, 92 + Math.floor(i / 5) * 34, String(10 + i), { fs: 9, c: "#8a93a3" })}`).join("")}
        ${A("c-pop", 2.4, `<circle cx="508" cy="126" r="17" fill="none" stroke="#c2453d" stroke-width="3"/>${T(492, 160, "면접 ×2 겹침!", { fs: 11, c: "#c2453d", fw: 800 })}`)}</g>
      <g class="c-out tmp" style="animation-delay:1.3s">${P(250, 340, 0.92, ctx.me, { expr: "surprise" })}</g>
      ${A("c-in", 1.3, P(250, 340, 0.92, ctx.me, { expr: "worry", pose: "phone" }))}
      ${desk(150, 262, 470)}
      <g transform="translate(360,262)"><g class="c-ring" style="animation-iteration-count:6"><rect x="-34" y="-26" width="68" height="26" rx="8" fill="#2b2f3a"/><rect x="-38" y="-36" width="76" height="14" rx="7" fill="#3b4250"/></g>
        <g class="tmp c-waves">${[0, 1, 2].map((k) => `<path d="M${46 + k * 10},-40 q8,14 0,28 M${-46 - k * 10},-40 q-8,14 0,28" stroke="#e8a33d" stroke-width="3" fill="none" stroke-linecap="round"/>`).join("")}</g></g>
      ${bubble(560, 245, "다른 회사 최종면접과 일정이 겹쳐서요… 혹시 날짜를 바꿀 수 있을까요?", { d: 1.9, fs: 13, maxW: 200, anchor: "r", fill: "#eef4ff", tx: 520 })}`,
  });

  SC.c05 = (ctx) => ({
    place: "🏢 팀장님 자리 → 내 자리", dur: 4200, sfx: [[0.3, "pop"], [2.0, "pop"]],
    svg: `${bgOffice({ id: "e" })}
      ${P(110, 336, 0.86, L("doyoon"), { expr: "neutral", pose: "point" }, { cls: "c-in", d: 0 })}
      ${bubble(40, 128, "내일 임원 보고용 채용 숫자 좀 뽑아줘요", { d: 0.3, fs: 13, maxW: 160 })}
      ${P(320, 340, 0.9, ctx.me, { expr: "worry", sweat: true, sweatD: 2.4 })}
      ${A("c-pop", 1.4, chip(282, 112, "⏱ 30분 뒤", { bg: "#5b8def", d: 0 }))}
      ${P(530, 336, 0.86, L("jungmin"), { expr: "surprise", pose: "wave" }, { cls: "c-slide-r", d: 1.6 })}
      ${bubble(600, 128, "오늘 공고 올려야 해요! 검수 급해요!", { d: 2.0, fs: 13, maxW: 150, anchor: "r", fill: "#fff1f1" })}
      ${desk(200, 300, 240, { top: "#c49a6c" })}
      ${A("c-drop", 0.7, doc(280, 292, "임원 보고", "#2f4b6e"))}${A("c-drop", 2.2, doc(352, 296, "공고 검수", "#c2453d"))}`,
  });

  SC.c06 = (ctx) => ({
    place: "💬 사내 메신저", dur: 3800, sfx: [[0.5, "pop"], [1.4, "type"], [1.8, "type"]],
    svg: `<rect width="${W}" height="${H}" fill="#e8edf3"/>
      <g transform="translate(150,26)"><rect width="420" height="300" rx="14" fill="#fff" stroke="#cdd5df" stroke-width="2"/>
        <rect width="420" height="46" rx="14" fill="#2f4b6e"/><rect y="30" width="420" height="16" fill="#2f4b6e"/>
        <circle cx="28" cy="23" r="13" fill="#8d99ae"/>${T(50, 21, "개발팀 팀장님", { fs: 14, c: "#fff", fw: 700 })}${T(50, 37, "● 온라인 · 개발팀", { fs: 10, c: "#9fe0b8" })}
        ${A("c-in", 0.3, `<g><rect x="18" y="62" width="300" height="56" rx="10" fill="#fff4f2" stroke="#f0b8ae"/>${T(30, 84, "📋 필수 교육 미이수자 (마감 D-2)", { fs: 12, fw: 700, c: "#c2453d" })}${T(30, 104, "… 개발팀 / 팀장 / 미이수", { fs: 12, c: "#5a6475" })}</g>`)}
        ${A("c-pop", 0.6, `<rect x="160" y="91" width="90" height="20" rx="4" fill="none" stroke="#c2453d" stroke-width="2.5"/>`)}
        ${A("c-in", 1.2, `<g><rect x="18" y="230" width="384" height="52" rx="10" fill="#f4f6fa" stroke="#cdd5df"/>
          ${A("c-type", 1.3, T(32, 262, "팀장님, 필수 교육이…", { fs: 14, c: "#1f2733" }), "animation-duration:1.4s")}
          <rect class="c-caret" x="182" y="246" width="2" height="22" fill="#5b8def"/>
          <rect x="342" y="240" width="50" height="32" rx="8" fill="#cdd5df"/>${T(367, 261, "전송", { fs: 12, a: "middle", c: "#fff" })}</g>`)}
        ${A("c-in", 2.4, `<g>${T(30, 210, "보낼까… 말까… 말투는 괜찮나?", { fs: 12, c: "#8a93a3" })}</g>`)}
      </g>
      ${P(80, 380, 1.1, ctx.me, { expr: "worry", sweat: true, sweatD: 2.0, idle: true })}
      ${A("c-pop", 2.6, T(560, 70, "😰", { fs: 34 }))}`,
  });

  SC.c07 = (ctx) => ({
    place: "📊 교육 결과 보고 · 오후 3:00", dur: 3600, sfx: [[1.5, "bad"]],
    svg: `${bgOffice({ id: "g", win: [[470, 40, 130, 110]] })}
      <g transform="translate(40,80)"><rect width="300" height="190" rx="12" fill="#fff" stroke="#d6dbe3" stroke-width="2"/>
        ${T(20, 32, "신규 리더 교육 만족도", { fs: 15, fw: 800 })}
        ${[["강의 내용", 3.9], ["강사", 3.6], ["운영", 2.8], ["실무 적용", 2.5]].map(([k, v], i) => `${T(20, 66 + i * 28, k, { fs: 11, c: "#5a6475" })}<rect x="90" y="${56 + i * 28}" width="160" height="12" rx="6" fill="#eef1f5"/>${A("c-growx", 0.3 + i * 0.15, `<rect x="90" y="${56 + i * 28}" width="${v * 32}" height="12" rx="6" fill="${v < 3 ? "#e8a33d" : "#5b8def"}"/>`)}${T(258, 66 + i * 28, v.toFixed(1), { fs: 11, fw: 700 })}`).join("")}
        ${A("c-pop", 1.5, `<g>${T(150, 178, "평균 3.2 / 5.0", { fs: 20, fw: 900, a: "middle", c: "#c2453d" })}</g>`)}</g>
      ${P(450, 340, 0.9, ctx.me, { expr: "worry", pose: "hold", sweat: true, sweatD: 1.8 })}
      ${bubble(470, 150, "팀장님께 어떻게 말씀드리지…", { d: 2.0, fs: 13, think: true, maxW: 140 })}
      ${plant(600, 336, 0.9)}`,
  });

  SC.c08 = (ctx) => ({
    place: "📧 메일함 · 오전 10:20", dur: 4000, sfx: [[0.2, "send"], [1.4, "bad"], [1.9, "pop"], [2.3, "pop"], [2.7, "pop"]],
    svg: `<rect width="${W}" height="${H}" fill="#e8edf3"/>
      <g transform="translate(150,30)"><rect width="310" height="250" rx="12" fill="#fff" stroke="#cdd5df" stroke-width="2"/>
        <rect width="310" height="40" rx="12" fill="#5b8def"/><rect y="28" width="310" height="12" fill="#5b8def"/>${T(16, 26, "✉️ 보낸 메일", { fs: 14, c: "#fff", fw: 700 })}
        ${T(16, 66, "받는 사람: 전 직원 (200명)", { fs: 12, c: "#5a6475" })}
        ${T(16, 92, "[교육 안내] 하반기 법정 의무교육", { fs: 14, fw: 800 })}
        ${T(16, 124, "교육 일시: 11월 15일(금) 14:00", { fs: 13 })}
        ${[0, 1, 2].map((k) => `<rect x="16" y="${142 + k * 14}" width="${[290, 250, 200][k]}" height="6" rx="3" fill="#e3e8ef"/>`).join("")}
        ${A("c-pop", 1.4, `<ellipse cx="166" cy="119" rx="42" ry="16" fill="none" stroke="#c2453d" stroke-width="3"/>${T(150, 156, "목요일인데…?!", { fs: 12, fw: 800, c: "#c2453d" })}`)}
      </g>
      ${A("c-fly tmp", 0.15, at(400, 250, `<path d="M0,0 L34,-12 L10,6Z M10,6 L14,16 L18,2" fill="#fff" stroke="#5b8def" stroke-width="2" stroke-linejoin="round"/>`))}
      ${[["영업팀", "목요일? 금요일?"], ["개발팀", "날짜 확인 부탁해요!"], ["재무팀", "15일 금요일 맞나요?"]].map(([t, m], i) =>
        A("c-slide-r", 1.9 + i * 0.4, `<g transform="translate(472,${60 + i * 66})"><rect width="158" height="54" rx="10" fill="#fff" stroke="#cdd5df" stroke-width="1.5"/><circle cx="22" cy="27" r="12" fill="${["#8d99ae", "#7bc8a4", "#f7c548"][i]}"/>${T(42, 22, t, { fs: 11, fw: 800 })}${T(42, 40, m, { fs: 11, c: "#5a6475" })}<circle cx="150" cy="8" r="7" fill="#c2453d"/></g>`)).join("")}
      ${A("c-pop", 3.0, chip(520, 262, "+ 문의 12건", { bg: "#c2453d" }))}
      ${P(76, 380, 0.95, ctx.me, { expr: "surprise", sweat: true, sweatD: 1.6 })}`,
  });

  SC.c09 = (ctx) => ({
    place: "🪑 회의실 A · 주간회의", dur: 3800, sfx: [[0.5, "pop"], [1.8, "spot"]],
    svg: `<rect width="${W}" height="${H}" fill="#e3e9f0"/>
      <rect x="60" y="30" width="230" height="110" rx="6" fill="#fff" stroke="#c9d2de" stroke-width="3"/>${T(175, 62, "주간회의", { fs: 18, fw: 800, a: "middle" })}${T(175, 88, "• 채용 현황  • 교육 일정", { fs: 12, a: "middle", c: "#5a6475" })}${T(175, 110, "• 온보딩 개선 ?", { fs: 12, a: "middle", c: "#c2453d", fw: 700 })}
      ${P(110, 300, 0.75, L("seoyeon"), { expr: "neutral", gaze: 4, seated: true })}
      ${P(210, 300, 0.75, L("jihoon"), { expr: "neutral", gaze: 4, seated: true })}
      ${P(320, 300, 0.8, L("doyoon"), { expr: "smile", gaze: 5, seated: true, pose: "arms" })}
      ${P(430, 300, 0.75, L("jungmin"), { expr: "neutral", gaze: 5, seated: true })}
      ${A("c-pop", 1.8, `<g><ellipse cx="540" cy="250" rx="70" ry="110" fill="#fff6c9" opacity=".55"/></g>`)}
      ${P(540, 300, 0.78, ctx.me, { expr: "surprise", sweat: true, sweatD: 2.0, seated: true })}
      <rect x="40" y="268" width="560" height="22" rx="8" fill="#8a6a4e"/><rect x="40" y="290" width="560" height="70" fill="#7a5c43"/>
      ${mug(130, 268)}${mug(450, 268, true)}${doc(250, 262, "안건", "#3f8a68")}
      ${bubble(330, 116, "신입 시각에서 우리 온보딩 프로그램 어때요?", { d: 0.5, fs: 13, maxW: 190, tx: 350, tdir: -1 })}
      ${A("c-pop", 2.2, T(470, 160, "👀", { fs: 26 }))}${A("c-pop", 2.4, T(150, 170, "👀", { fs: 22 }))}`,
  });

  SC.c10 = (ctx) => ({
    place: "🍜 회사 앞 식당 · 점심", dur: 3800, sfx: [[1.0, "pop"]],
    svg: `<rect width="${W}" height="${H}" fill="#f4e3c8"/><rect y="0" width="${W}" height="24" fill="#c2453d"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<path d="M${k * 80},24 q40,24 80,0" fill="#c2453d"/>`).join("")}
      <g transform="translate(30,40)"><rect width="140" height="96" rx="8" fill="#3b3330"/>${T(70, 26, "오늘의 메뉴", { fs: 14, fw: 800, a: "middle", c: "#ffd27a" })}${T(14, 50, "김치찌개  9,000", { fs: 11, c: "#fff" })}${T(14, 68, "제육볶음  9,500", { fs: 11, c: "#fff" })}${T(14, 86, "칼국수     8,500", { fs: 11, c: "#fff" })}</g>
      ${A("c-in", 0, P(190, 300, 0.85, ctx.me, { expr: "surprise", seated: true, gaze: 4 }))}
      ${A("c-lean", 0.6, P(370, 300, 0.85, L("peer"), { expr: "smile", seated: true, gaze: -4 }))}
      <rect x="60" y="268" width="520" height="22" rx="8" fill="#9b6b43"/><rect x="60" y="290" width="520" height="70" fill="#86593a"/>
      ${at(190, 268, `<ellipse cx="0" cy="-6" rx="34" ry="10" fill="#c2453d"/><ellipse cx="0" cy="-10" rx="30" ry="7" fill="#e36a4a"/>`)}${at(370, 268, `<ellipse cx="0" cy="-6" rx="34" ry="10" fill="#f0e2c4"/><ellipse cx="0" cy="-10" rx="30" ry="7" fill="#f7d9a0"/>`)}
      ${[190, 370].map((x) => `<g opacity=".7">${[0, 1].map((k) => `<path class="c-rise" style="animation-delay:${k * 0.6}s" d="M${x - 6 + k * 12},248 q-6,-10 0,-20 q6,-10 0,-20" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`).join("")}</g>`).join("")}
      ${bubble(610, 118, "🤫 너 인사팀이잖아. 우리 팀 ○○ 선배 연봉 대충 얼마야?", { d: 1.0, fs: 13, maxW: 190, anchor: "r", tx: 420 })}
      ${A("c-pop", 2.2, A("c-float", 0, T(258, 112, "💰?", { fs: 30 })))}`,
  });

  SC.c11 = (ctx) => ({
    place: "🏢 인사팀 자리 · 오후 4:20", dur: 3800, sfx: [[1.3, "bad"]],
    svg: `${bgOffice({ id: "k", win: [[470, 40, 130, 110]] })}
      <g><rect x="490" y="200" width="110" height="62" rx="6" fill="#6b6f7a"/>${desk(470, 262, 150, { top: "#8a6a4e", front: "#7a5c43" })}
        ${A("c-pop", 0.4, `<g><rect x="508" y="210" width="74" height="30" rx="5" fill="#fff" stroke="#c2453d" stroke-width="2"/>${T(545, 230, "🚗 외근 중", { fs: 12, a: "middle", c: "#c2453d", fw: 700 })}</g>`)}
        ${T(545, 196, "팀장님 자리", { fs: 11, a: "middle", c: "#8a93a3" })}</g>
      ${P(330, 340, 0.9, ctx.me, { expr: "surprise", sweat: true, sweatD: 1.8 })}
      ${A("c-slide-l c-fast", 0, P(150, 340, 0.92, L("visitor"), { expr: "angry", pose: "point" }))}
      ${A("c-pop", 1.0, `<g>${[0, 1, 2].map((k) => `<path class="c-rise" style="animation-delay:${k * 0.3}s" d="M${120 + k * 22},150 q-6,-10 0,-20" stroke="#c9ced6" stroke-width="5" fill="none" stroke-linecap="round"/>`).join("")}</g>`)}
      ${bubble(60, 118, "우리 팀 ○○씨 때문에 미치겠어요. 인사팀에서 좀 어떻게 해줘요!", { d: 1.3, fs: 13, maxW: 200, fill: "#fff1f1" })}`,
  });

  SC.c12 = (ctx) => ({
    place: "🌙 내 자리 · 오후 8:50", dur: 4000, sfx: [[1.9, "pop"]],
    svg: `${bgOffice({ id: "l", night: true, sign: "인사팀 · HR", win: [[40, 40, 150, 120]] })}
      <ellipse cx="420" cy="250" rx="200" ry="90" fill="#ffe7a8" opacity=".14"/>
      ${A("c-in", 0, `<g transform="translate(250,40)"><rect width="120" height="100" rx="6" fill="#f7f9fc"/><rect width="120" height="26" rx="6" fill="#c2453d"/>${T(60, 18, "평가 시즌", { fs: 12, a: "middle", c: "#fff" })}
        ${[1, 2].map((n, i) => A("c-flash", 0.2 + i * 0.5, T(60, 76, `야근 ${n}일차`, { fs: 16, fw: 800, a: "middle", c: "#3b4250" }), "animation-duration:.5s")).join("")}
        ${A("c-in", 1.2, T(60, 76, "야근 3일차", { fs: 16, fw: 800, a: "middle", c: "#c2453d" }))}</g>`)}
      ${P(250, 340, 0.92, ctx.me, { expr: "tired", sweat: true, sweatD: 1.0 })}
      ${desk(150, 262, 420, { top: "#8a6a4e", front: "#6e5340" })}
      ${monitor(330, 140, 170, 100, `<rect width="170" height="100" fill="#e9edf3"/>${[0, 1, 2, 3, 4].map((k) => `<rect x="12" y="${14 + k * 16}" width="${[140, 120, 146, 90, 130][k]}" height="7" rx="3" fill="#c5cedb"/>`).join("")}`)}
      <g transform="translate(530,262)"><rect x="-4" y="-60" width="6" height="58" fill="#3b4250"/><path d="M-30,-60 L22,-60 L8,-82 L-16,-82Z" fill="#e8a33d"/></g>
      ${[0, 1, 2].map((k) => A("c-drop", 0.3 + k * 0.35, mug(200 + k * 26, 262))).join("")}
      ${P(560, 340, 0.88, L("jihoon"), { expr: "smile", pose: "hold" }, { cls: "c-slide-r", d: 1.5 })}
      ${bubble(600, 140, "혹시 이것도 오늘 가능할까요?", { d: 1.9, fs: 13, maxW: 150, anchor: "r" })}
      ${A("c-pop", 2.6, T(290, 150, "😵", { fs: 26 }))}`,
  });

  SC.c13 = (ctx) => ({
    place: "💻 내 자리 · 오후 4:00", dur: 3800, sfx: [[0.3, "pop"], [1.2, "pop"]],
    svg: `${bgOffice({ id: "m" })}
      ${P(110, 340, 0.88, L("jungmin"), { expr: "neutral", pose: "point", gaze: 4 }, { cls: "c-slide-l", d: 0 })}
      ${P(530, 340, 0.88, L("jihoon"), { expr: "neutral", pose: "point", gaze: -4 }, { cls: "c-slide-r", d: 0.9 })}
      ${bubble(40, 128, "평가 안내 메일은 짧게 핵심만!", { d: 0.3, fs: 13, maxW: 150 })}
      ${bubble(600, 128, "자세히 써야 문의가 안 와요", { d: 1.2, fs: 13, maxW: 150, anchor: "r" })}
      ${P(320, 344, 0.92, ctx.me, { expr: "worry", sweat: true, sweatD: 2.0 })}
      ${A("c-tug", 2.0, doc(320, 300, "메일 초안", "#e8a33d"))}
      ${A("c-pop", 2.4, chip(255, 70, "📅 내일 오전 발송", { bg: "#2f4b6e" }))}`,
  });

  SC.c14 = (ctx) => ({
    place: "🏢 인사팀 · 다음 주 월요일", dur: 3800, sfx: [[0.8, "pop"], [2.4, "good"]],
    svg: `${bgOffice({ id: "n", win: [[460, 40, 140, 110]] })}
      <g><rect x="34" y="96" width="110" height="166" fill="#8a6a4e"/><rect x="40" y="102" width="98" height="160" fill="#a37b58"/><circle cx="126" cy="186" r="5" fill="#ffd27a"/></g>
      ${A("c-in", 0.2, P(92, 340, 0.72, { ...DEFAULT_LOOK, shirt: "#bcd3f0", hair: "#4a3328", style: "long" }, { expr: "smile", pose: "wave" }))}
      ${A("c-pop", 0.5, chip(52, 70, "NEW 신규 입사자", { bg: "#3f8a68", fs: 11 }))}
      ${P(320, 344, 0.92, ctx.me, { expr: "surprise" })}
      ${P(520, 340, 0.9, L("doyoon"), { expr: "smile", pose: "point", gaze: -4 }, { cls: "c-in", d: 0.4 })}
      ${bubble(600, 130, "○○님이 첫 주 온보딩 일부를 맡아줄래요?", { d: 0.8, fs: 13, maxW: 170, anchor: "r" })}
      ${bubble(260, 120, "아직 100일밖에 안 됐는데…", { d: 1.9, fs: 12, think: true, maxW: 140 })}
      ${A("c-pop", 2.4, `<g><circle cx="388" cy="196" r="22" fill="#e8a33d"/>${T(388, 201, "D+100", { fs: 11, fw: 900, a: "middle", c: "#fff" })}</g>`)}`,
  });

  SC.c15 = (ctx) => ({
    place: "☕ 1:1 미팅룸 · 100일 면담", dur: 3800, sfx: [[0.6, "good"], [1.2, "pop"]],
    svg: `<rect width="${W}" height="${H}" fill="#f2ece2"/><rect y="250" width="${W}" height="110" fill="#d9c6a8"/>
      ${A("c-pop", 0.6, `<g><path d="M150,30 L490,30 L470,74 L170,74Z" fill="#e8a33d"/>${T(320, 60, "🎉 입사 100일 축하해요", { fs: 18, fw: 800, a: "middle", c: "#fff" })}</g>`)}
      ${[0, 1, 2, 3, 4, 5].map((k) => A("c-fall", 0.7 + k * 0.12, `<rect x="${160 + k * 60}" y="90" width="8" height="12" fill="${["#5b8def", "#f29bb5", "#7bc8a4", "#f7c548"][k % 4]}" transform="rotate(${k * 30} ${164 + k * 60} 96)"/>`)).join("")}
      ${plant(580, 270, 1)}
      ${P(220, 296, 0.86, ctx.me, { expr: "smile", seated: true, gaze: 4 })}
      ${P(420, 296, 0.86, L("doyoon"), { expr: "smile", seated: true, gaze: -4 })}
      <ellipse cx="320" cy="280" rx="190" ry="26" fill="#8a6a4e"/><rect x="306" y="290" width="28" height="70" fill="#6e5340"/>
      ${mug(260, 276, true)}${mug(380, 276, true)}
      ${bubble(470, 150, "100일 어땠어요? 바라는 점 있으면 편하게 말해줘요.", { d: 1.2, fs: 13, maxW: 170, tx: 440, tdir: -1 })}`,
  });

  // 선배 등록 카드 · 그 외: 범용 장면
  SC.custom = (ctx, card) => ({
    place: "📌 선배 경험 게시판에서", dur: 3200, sfx: [[0.6, "pop"]],
    svg: `${bgOffice({ id: "u" })}
      <g transform="translate(150,80)"><rect width="340" height="170" rx="10" fill="#c49a6c"/><rect x="10" y="10" width="320" height="150" rx="6" fill="#e9d3b2"/>
        ${A("c-drop", 0.3, `<g transform="rotate(-3 170 80)"><rect x="60" y="28" width="220" height="110" fill="#fff8b5"/><circle cx="170" cy="36" r="6" fill="#c2453d"/>
          ${wrap(card ? card.title : "선배의 경험", 190, 15).slice(0, 2).map((l, i) => T(170, 74 + i * 22, l, { fs: 15, fw: 800, a: "middle" })).join("")}
          ${T(170, 124, "— " + (card && card.author ? card.author : "선배"), { fs: 11, a: "middle", c: "#7a6a40" })}</g>`)}</g>
      ${P(110, 344, 0.9, ctx.me, { expr: "worry", pose: "think" })}
      ${qmarks(140, 128, 1.2)}`,
  });

  const build = (key, ctx, card) => (SC[key] ? SC[key](ctx, card) : null);
  // 카드 → 장면
  function forCard(card, ctx) {
    if (!card) return null;
    if (SC[card.id]) return build(card.id, ctx, card);
    return build("custom", ctx, card);
  }
  const svgOf = (sc, cls) => `<svg class="scene ${cls || ""}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">${A("c-zoom", 0, sc.svg)}</svg>`;

  return { forCard, elevator: (ctx, dir) => SC.elevator(ctx, dir), svgOf };
})();
