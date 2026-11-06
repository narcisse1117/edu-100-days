// =============================================================
// 상황 컷씬 — 카드가 시작될 때 / 출퇴근할 때 재생되는 1인칭 애니메이션 일러스트 (SVG + CSS)
// 내 캐릭터는 화면에 나오지 않고, 내 손(아바타 피부 · 옷 색)과 나를 바라보는 사람들만 보인다.
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

  // ---------- 1인칭 소품: 내 손 · 상반신 클로즈업 ----------
  // 손등이 보이는 손 (손가락이 화면 위쪽). 소매는 화면 밖으로 이어진다. flip: 왼손
  function hand(me, x, y, ang, o) {
    o = o || {};
    const sk = me.skin, d = shade(sk, -0.2), sl = me.shirt, s = o.s || 1;
    const finger = (fx, fh) => `<rect x="${fx - 5.5}" y="${-22 - fh}" width="11" height="${fh + 12}" rx="5.5" fill="${sk}" stroke="${d}" stroke-width="1.6"/>`;
    return `<g transform="translate(${x},${y}) rotate(${ang}) scale(${o.flip ? -s : s},${s})">
      <rect x="-27" y="12" width="54" height="240" rx="12" fill="${sl}"/><rect x="-27" y="12" width="54" height="14" rx="6" fill="${shade(sl, -0.2)}"/>
      ${o.fist ? "" : finger(-15, 18) + finger(-5, 24) + finger(5, 23) + finger(15, 17)}
      <rect x="-22" y="-26" width="44" height="44" rx="16" fill="${sk}" stroke="${d}" stroke-width="1.6"/>
      <ellipse cx="-24" cy="-4" rx="8" ry="15" fill="${sk}" stroke="${d}" stroke-width="1.6" transform="rotate(-32 -24 -4)"/>
      ${o.fist ? `<path d="M-14,-24 v8 M-4,-26 v8 M6,-26 v8 M15,-23 v7" stroke="${d}" stroke-width="1.6"/>` : ""}</g>`;
  }
  const keyboard = (me, slow) => `<path d="M150,296 L490,296 L560,360 L80,360Z" fill="#3b4250"/>
    ${[0, 1, 2].map((r) => `<path d="M${165 - r * 22},${308 + r * 17} L${475 + r * 22},${308 + r * 17}" stroke="#5b6270" stroke-width="9" stroke-dasharray="16 4"/>`).join("")}
    ${A("c-tap", 0, hand(me, 230, 330, 14, { flip: true }), slow ? "animation-duration:.5s" : "")}
    ${A("c-tap", 0.12, hand(me, 410, 330, -14), slow ? "animation-duration:.5s;animation-delay:.3s" : "animation-delay:.12s")}`;
  const deskTop = (y, c) => `<rect y="${y}" width="${W}" height="${H - y}" fill="${c || "#c49a6c"}"/><rect y="${y}" width="${W}" height="7" fill="${shade(c || "#c49a6c", -0.12)}"/>`;
  // 서류를 두 손으로 들고 보는 모습 (inner: 0..280 × 0..200 좌표)
  const paperInHands = (me, inner, cls, d) => A(cls || "c-up", d || 0, `<g transform="translate(180,150) rotate(-2)"><rect x="-4" y="4" width="288" height="230" rx="6" fill="rgba(0,0,0,.15)"/><rect width="280" height="230" rx="6" fill="#fff" stroke="#d6dbe3" stroke-width="2"/>
    <svg width="280" height="200" viewBox="0 0 280 200">${inner}</svg></g>${hand(me, 182, 330, 18, { flip: true, fist: true })}${hand(me, 452, 330, -18, { fist: true })}`);
  // 다른 사람 상반신 (나를 바라봄)
  const Bu = (x, look, o, s, y, anim) => P(x, y || 430, s || 1.5, look, { seated: true, ...(o || {}) }, anim);
  // 내 생각 (아래쪽 = 나에게서 나오는 생각 풍선)
  const mine = (x, y, text, d, o) => bubble(x, y, text, { think: true, anchor: "c", tx: x + 6, fill: "#fffdf3", d, fs: 13, maxW: 190, ...(o || {}) });
  const vignette = `<defs><radialGradient id="vig" cx="50%" cy="48%" r="75%"><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#vig)" pointer-events="none"/>`;

  // ---------- 개별 장면 (모두 1인칭: 내 눈에 보이는 화면) ----------
  // 반환: { svg, dur(ms), place, sfx: [[초, 효과음]] }
  const SC = {};

  // 출근 · 퇴근 — 엘리베이터 안에서 문을 바라보는 시점
  SC.elevator = (ctx, dir) => {
    const up = dir !== "down", day = ctx.day || 1, me = ctx.me, night = !up;
    const floors = up ? [1, 2, 3, 4, 5, 6] : [7, 6, 5, 4, 3, 2], last = up ? 7 : 1;
    const step = 0.2, t0 = up ? 0.15 : 1.9;
    const greet = [["jungmin", "어서 와요! 첫 출근 환영해요 🎉"], ["seoyeon", "좋은 아침이에요~ ☀️"], ["jihoon", "오늘 보고 있죠? 화이팅!"], ["mina", "좋은 아침! 오늘도 잘 부탁해요"], ["doyoon", "벌써 100일이네요. 축하해요!"]][day - 1];
    // 문 너머로 보이는 7층 사무실
    const office = up
      ? `${bgOffice({ id: "ev", win: [[120, 96, 110, 90], [410, 96, 110, 90]] })}
         ${P(330, 330, 0.85, L(greet[0]), { expr: "happy", pose: "wave" })}
         <rect x="150" y="262" width="340" height="12" rx="4" fill="#b98a5e"/>`
      : `${bgOffice({ id: "evn", night: true, win: [[120, 96, 110, 90], [410, 96, 110, 90]] })}
         <rect x="150" y="226" width="340" height="12" rx="4" fill="#5e4a3a"/>
         ${[200, 300, 400].map((x) => `<rect x="${x}" y="186" width="56" height="38" rx="3" fill="#232a3b"/>`).join("")}
         <rect x="300" y="186" width="56" height="38" rx="3" fill="#ffe9a8" opacity=".55"/>`;
    const doorDelay = up ? 1.75 : 0.95;
    const door = (x0, dx) => `<g class="c-door" style="--dx:${dx}px;animation-delay:${doorDelay}s"><rect x="${x0}" y="78" width="160" height="262" fill="url(#steel)"/><rect x="${x0 < 320 ? x0 + 156 : x0}" y="78" width="4" height="262" fill="#9aa1ad"/></g>`;
    const hold = up ? (day === 1
      ? A("c-up", 0.1, `<g transform="translate(520,250) rotate(-8)"><path d="M-30,-90 L0,-40 L30,-90" stroke="#5b8def" stroke-width="5" fill="none"/><rect x="-40" y="-44" width="80" height="108" rx="8" fill="#fff" stroke="#c9d2de" stroke-width="2"/><rect x="-40" y="-44" width="80" height="22" rx="8" fill="#2f4b6e"/>${T(0, -28, "HIBRIDGE", { fs: 10, a: "middle", c: "#fff", fw: 800 })}
          <g transform="translate(0,22) scale(.32)">${person(me, { seated: true, idle: false, expr: "smile" }).replace(/c-blink/g, "")}</g>${T(0, 40, ctx.name || "신입사원", { fs: 11, a: "middle", fw: 800 })}${T(0, 55, "인사팀 · 신입", { fs: 8, a: "middle", c: "#7a8494" })}</g>${hand(me, 536, 330, -6, { fist: true })}`)
      : A("c-up", 0.1, `<g transform="translate(530,268)"><rect x="-26" y="-50" width="52" height="64" rx="8" fill="#fff" stroke="#c9d2de" stroke-width="2"/><rect x="-26" y="-36" width="52" height="20" fill="#3f8a68"/><rect x="-28" y="-56" width="56" height="10" rx="4" fill="#2b2f3a"/>
          <g opacity=".6">${[0, 1].map((k) => `<path class="c-rise" style="animation-delay:${k * 0.7}s" d="M${-6 + k * 12},-62 q-6,-9 0,-18 q6,-9 0,-18" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`).join("")}</g></g>${hand(me, 540, 300, -90, { fist: true, s: 0.9 })}`)) : "";
    return {
      place: up ? `🏢 하이브릿지 본사 엘리베이터 · 오전 8:5${day}` : `🌙 퇴근길 엘리베이터 · 오후 ${["6:05", "6:30", "7:10", "8:40", "6:00"][day - 1]}`,
      dur: up ? 4400 : 4000,
      sfx: up ? [[1.55, "ding"], [2.7, "pop"]] : [[0.95, "door"], [3.3, "ding"]],
      svg: `<defs><linearGradient id="steel" x1="0" x2="1"><stop offset="0" stop-color="#d9dde3"/><stop offset=".5" stop-color="#b3b9c3"/><stop offset="1" stop-color="#cdd2d9"/></linearGradient>
          <clipPath id="evclip"><rect x="160" y="78" width="320" height="262"/></clipPath></defs>
        ${A(up ? "c-walkout" : "", up ? 2.6 : 0, `
          <g clip-path="url(#evclip)">${office}${up ? door(0, 160) + door(480, -160) : door(160, -160) + door(320, 160)}</g>
          <!-- 엘리베이터 안쪽 벽 · 천장 · 바닥 (원근) -->
          <path d="M0,0 L160,78 L160,340 L0,360Z" fill="${night ? "#7d828d" : "#b9bec8"}"/><path d="M640,0 L480,78 L480,340 L640,360Z" fill="${night ? "#747984" : "#b0b6c0"}"/>
          <path d="M0,0 L640,0 L480,78 L160,78Z" fill="${night ? "#5d626c" : "#9aa0aa"}"/><rect x="250" y="18" width="140" height="18" rx="6" fill="${night ? "#f3e6b8" : "#fffbe8"}" opacity=".85"/>
          <path d="M0,360 L160,340 L480,340 L640,360Z" fill="${night ? "#55565e" : "#8d8f96"}"/>
          <path d="M0,200 L160,188" stroke="#d6dae0" stroke-width="7" stroke-linecap="round"/><path d="M640,200 L480,188" stroke="#d6dae0" stroke-width="7" stroke-linecap="round"/>
          <rect x="156" y="74" width="328" height="270" fill="none" stroke="${night ? "#596178" : "#8f97a3"}" stroke-width="8"/>
          <rect x="270" y="46" width="100" height="26" rx="5" fill="#1b1f27"/>${T(292, 65, up ? "▲" : "▼", { fs: 13, a: "middle", c: "#ff8a3d" })}
          ${floors.map((f, i) => A("c-flash", t0 + i * step, T(336, 66, `${f}F`, { fs: 17, fw: 800, a: "middle", c: "#ff8a3d" }), `animation-duration:${step}s`)).join("")}
          ${A("c-in", t0 + floors.length * step, T(336, 66, `${last}F`, { fs: 17, fw: 800, a: "middle", c: "#ffb36b" }))}
          <g transform="translate(560,170) skewY(8)"><rect width="40" height="96" rx="6" fill="#9ba3af"/>${[1, 2, 3, 4, 5, 6, 7].map((f, i) => `<circle cx="${i % 2 ? 28 : 12}" cy="${14 + Math.floor(i / 2) * 20}" r="7" fill="${f === 7 ? "#ffd27a" : "#e7eaef"}" stroke="#6b7380" stroke-width="1.5"/>`).join("")}</g>`)}
        ${up ? bubble(330, 116, greet[1], { d: 2.7, fs: 13, maxW: 200, anchor: "c", tx: 330 }) : ""}
        ${hold}
        ${up && day === 1 ? mine(150, 300, "두근두근… 첫 출근이다", 0.6) : ""}
        ${!up ? mine(320, 300, ["첫날 끝! 생각보다 할 만했다", "조금씩 익숙해지는 중", "보고는 결론부터… 기억하자", "하아… 오늘 길었다", "100일, 잘 버텼다 🌱"][day - 1], 2.4) : ""}`,
    };
  };

  SC.c01 = (ctx) => ({
    place: "💻 내 자리 · 오전 9:40", dur: 3800, sfx: [[0.9, "pop"], [1.9, "pop"]],
    svg: `<rect width="${W}" height="${H}" fill="#e6eaf0"/>
      <g><rect x="16" y="40" width="150" height="150" rx="6" fill="#dfeaf5" stroke="#b9c7d6" stroke-width="4"/>${T(91, 60, "회의실 A · 회의 중", { fs: 11, a: "middle", c: "#5a6475" })}
        ${P(62, 180, 0.48, L("jungmin"), { expr: "neutral" })}${P(122, 180, 0.48, L("jihoon"), { expr: "neutral" })}<rect x="16" y="40" width="150" height="150" rx="6" fill="rgba(200,225,245,.35)"/></g>
      ${A("c-pop", 1.9, `<g><rect x="38" y="198" width="106" height="26" rx="13" fill="#c2453d"/>${A("c-pulse", 0, `<circle cx="54" cy="211" r="5" fill="#fff"/>`)}${T(64, 216, "방해 금지", { fs: 13, c: "#fff" })}</g>`)}
      ${deskTop(262)}
      ${monitor(190, 28, 330, 200, `<rect width="330" height="22" fill="#e3e8ef"/><circle cx="12" cy="11" r="4" fill="#f08a7e"/><circle cx="25" cy="11" r="4" fill="#f5c26b"/><circle cx="38" cy="11" r="4" fill="#7ccf8a"/>
        ${T(18, 50, "📘 인사팀 업무 매뉴얼", { fs: 16, fw: 800 })}${[0, 1, 2, 3].map((k) => `<rect x="18" y="${66 + k * 14}" width="${[220, 270, 180, 240][k]}" height="7" rx="3" fill="#dfe5ec"/>`).join("")}
        ${A("c-pop", 0.9, `<g><rect x="55" y="48" width="220" height="104" rx="10" fill="#fff" stroke="#c2453d" stroke-width="3"/>${T(165, 90, "🔒 접근 권한 없음", { fs: 19, fw: 800, a: "middle", c: "#c2453d" })}${T(165, 116, "관리자에게 문의하세요", { fs: 12, a: "middle", c: "#7a8494" })}<rect x="125" y="126" width="80" height="18" rx="5" fill="#e3e8ef"/>${T(165, 139, "확인", { fs: 11, a: "middle" })}</g>`)}`)}
      <g transform="translate(486,30) rotate(6)"><rect width="50" height="44" fill="#fff59d"/>${T(25, 20, "모르면", { fs: 10, a: "middle", fw: 700 })}${T(25, 34, "물어보기!", { fs: 10, a: "middle", fw: 700 })}</g>
      ${mug(580, 290, true)}
      ${keyboard(ctx.me)}
      ${mine(560, 150, "어? 권한이 없네…", 1.5)}${vignette}`,
  });

  SC.c02 = (ctx) => ({
    place: "💻 내 자리 · 오후 5:30", dur: 3800, sfx: [[2.1, "pop"]],
    svg: `${bgOffice({ id: "b", sunset: true, sign: false, win: [[470, 30, 150, 110]] })}
      ${clock(80, 84, 46, 5, 30, true)}
      ${A("c-in", 1.4, chip(28, 140, "퇴근 30분 전", { bg: "#c2453d", d: 0 }))}
      ${deskTop(262)}
      ${monitor(170, 34, 300, 190, `${T(16, 32, "📊 이번 주 지원자 서류 현황", { fs: 15, fw: 800 })}
        ${[0, 1, 2, 3, 4].map((k) => `<rect x="16" y="${48 + k * 15}" width="${[230, 190, 250, 140, 210][k]}" height="7" rx="3" fill="#dfe5ec"/>`).join("")}
        <rect x="16" y="140" width="268" height="20" rx="10" fill="#e3e8ef"/>${A("c-growx", 0.4, `<rect x="16" y="140" width="188" height="20" rx="10" fill="#e8a33d"/>`, "animation-duration:1.6s")}
        ${A("c-pop", 2.1, T(214, 156, "70%", { fs: 16, fw: 900, c: "#c2453d" }))}`)}
      <g transform="translate(440,40) rotate(5)"><rect width="56" height="48" fill="#ffd6e0"/>${T(28, 20, "정민 선임", { fs: 9, a: "middle", c: "#7a3b4e" })}${T(28, 36, "오늘 중!", { fs: 12, a: "middle", fw: 800, c: "#c2453d" })}</g>
      ${A("c-drop", 0.2, doc(560, 300, "할 일", "#c2453d"))}
      ${keyboard(ctx.me)}
      ${mine(470, 250, "아직 70%인데… 퇴근까지 30분", 2.4)}${vignette}`,
  });

  SC.c03 = (ctx) => ({
    place: "🏢 사무실 · 오전 11:50", dur: 3800, sfx: [[0.4, "pop"], [1.5, "pop"]],
    svg: `${bgOffice({ id: "c", win: [[240, 40, 160, 100]], sign: false })}
      ${clock(320, 180, 24, 11, 50)}
      ${Bu(40, { ...DEFAULT_LOOK, shirt: "#9b7bd4", hair: "#3b2a20", style: "short" }, { expr: "smile" }, 1.35, 440, { cls: "c-slide-l", d: 0.1 })}
      ${Bu(160, L("peer"), { expr: "happy", pose: "wave" }, 1.55, 440, { cls: "c-slide-l", d: 0 })}
      ${Bu(600, L("jihoon"), { expr: "smile" }, 1.35, 440, { cls: "c-slide-r", d: 1.1 })}
      ${Bu(480, L("seoyeon"), { expr: "smile", pose: "wave" }, 1.55, 440, { cls: "c-slide-r", d: 1.0 })}
      ${bubble(20, 120, "첫날인데 같이 점심 먹자! 🍚", { d: 0.4, fs: 13, maxW: 150, tx: 140 })}
      ${bubble(620, 120, "오늘 환영 점심 할까요?", { d: 1.5, fs: 13, maxW: 150, anchor: "r", tx: 490 })}
      ${A("c-in", 2.4, `${A("c-look", 0, `${T(286, 300, "◀", { fs: 22, c: "#e8a33d" })}${T(338, 300, "▶", { fs: 22, c: "#e8a33d" })}`)}`)}
      ${mine(320, 262, "어느 쪽이랑 먹지…?", 2.4)}${vignette}`,
  });

  SC.c04 = (ctx) => ({
    place: "💻 내 자리 · 오후 2:10", dur: 4000, sfx: [[0.1, "ring"], [0.9, "ring"], [1.9, "pop"]],
    svg: `<rect width="${W}" height="${H}" fill="#e6eaf0"/>
      <g><rect x="380" y="20" width="200" height="170" rx="6" fill="#fff" stroke="#d6dbe3" stroke-width="2"/><rect x="380" y="20" width="200" height="30" rx="6" fill="#5b8def"/>${T(480, 41, "11월 면접 일정", { fs: 14, a: "middle", c: "#fff" })}
        ${Array.from({ length: 15 }, (_, i) => `<rect x="${390 + (i % 5) * 37}" y="${60 + Math.floor(i / 5) * 40}" width="33" height="34" rx="3" fill="#f1f4f8"/>${T(395 + (i % 5) * 37, 76 + Math.floor(i / 5) * 40, String(10 + i), { fs: 10, c: "#8a93a3" })}`).join("")}
        ${A("c-pop", 2.4, `<circle cx="465" cy="117" r="21" fill="none" stroke="#c2453d" stroke-width="3.5"/>${T(392, 182, "면접 ×2 겹침!", { fs: 12, c: "#c2453d", fw: 800 })}`)}</g>
      ${monitor(40, 40, 260, 160, `${T(14, 28, "📋 면접 대상자", { fs: 14, fw: 800 })}${[0, 1, 2, 3].map((k) => `<rect x="14" y="${44 + k * 26}" width="230" height="20" rx="4" fill="${k === 1 ? "#fff1e0" : "#f1f4f8"}"/>${T(22, 58 + k * 26, ["김OO · 1차 합격", "이OO · 최종면접 대기", "박OO · 서류 검토", "최OO · 1차 합격"][k], { fs: 11, c: "#3b4250" })}`).join("")}`)}
      ${deskTop(250)}
      <g transform="translate(300,300)"><path d="M-70,30 L-56,-24 L56,-24 L70,30Z" fill="#2b2f3a"/>${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${-30 + c * 22}" y="${-14 + r * 13}" width="16" height="9" rx="2" fill="#4a5262"/>`).join("")).join("")}</g>
      <g class="c-out tmp" style="animation-delay:1.3s"><g transform="translate(300,276)"><g class="c-ring"><rect x="-70" y="-16" width="140" height="26" rx="13" fill="#3b4250"/><ellipse cx="-58" cy="-3" rx="18" ry="15" fill="#3b4250"/><ellipse cx="58" cy="-3" rx="18" ry="15" fill="#3b4250"/></g>
        <g class="c-waves">${[0, 1, 2].map((k) => `<path d="M${86 + k * 14},-34 q12,22 0,44 M${-86 - k * 14},-34 q-12,22 0,44" stroke="#e8a33d" stroke-width="4" fill="none" stroke-linecap="round"/>`).join("")}</g></g></g>
      ${A("c-in", 1.3, `<path d="M320,300 C400,330 470,250 560,236" stroke="#2b2f3a" stroke-width="4" fill="none" stroke-dasharray="6 3"/>
        <g transform="translate(588,150) rotate(16)"><rect x="-17" y="-92" width="34" height="184" rx="17" fill="#3b4250"/><ellipse cx="0" cy="-84" rx="26" ry="18" fill="#3b4250"/><ellipse cx="0" cy="84" rx="26" ry="18" fill="#3b4250"/></g>
        ${hand(ctx.me, 584, 200, -16, { fist: true, s: 1.05 })}`)}
      ${bubble(520, 250, "다른 회사 최종면접과 일정이 겹쳐서요… 혹시 날짜를 바꿀 수 있을까요?", { d: 1.9, fs: 13, maxW: 210, anchor: "r", fill: "#eef4ff", tx: 500, tdir: 1 })}
      ${vignette}`,
  });

  SC.c05 = (ctx) => ({
    place: "💻 내 자리 · 오전 10:00", dur: 4200, sfx: [[0.3, "pop"], [2.0, "pop"]],
    svg: `${bgOffice({ id: "e", win: [[240, 40, 160, 100]] })}
      ${Bu(150, L("doyoon"), { expr: "neutral", pose: "arms" }, 1.5, 430, { cls: "c-in", d: 0 })}
      ${bubble(20, 112, "내일 임원 보고용 채용 숫자 좀 뽑아줘요", { d: 0.3, fs: 13, maxW: 160, tx: 150 })}
      ${A("c-pop", 1.4, chip(278, 150, "⏱ 30분 뒤", { bg: "#5b8def", d: 0 }))}
      ${Bu(500, L("jungmin"), { expr: "surprise", pose: "wave" }, 1.5, 430, { cls: "c-slide-r", d: 1.6 })}
      ${bubble(620, 112, "오늘 공고 올려야 해요! 문구 검수 급해요!", { d: 2.0, fs: 13, maxW: 160, anchor: "r", fill: "#fff1f1", tx: 500 })}
      ${deskTop(286)}
      ${A("c-drop", 0.7, at(250, 330, `<g transform="rotate(-8) scale(1.6)">${doc(0, 0, "임원 보고", "#2f4b6e")}</g>`))}
      ${A("c-drop", 2.2, at(390, 334, `<g transform="rotate(7) scale(1.6)">${doc(0, 0, "공고 검수", "#c2453d")}</g>`))}
      ${mine(320, 262, "둘 다 급하다는데…?!", 2.7)}${vignette}`,
  });

  SC.c06 = (ctx) => ({
    place: "💬 사내 메신저", dur: 3800, sfx: [[0.5, "pop"], [1.4, "type"], [1.8, "type"]],
    svg: `<rect width="${W}" height="${H}" fill="#2b2f3a"/><rect x="40" y="10" width="560" height="290" rx="10" fill="#e8edf3"/>
      <g transform="translate(110,22)"><rect width="420" height="262" rx="14" fill="#fff" stroke="#cdd5df" stroke-width="2"/>
        <rect width="420" height="46" rx="14" fill="#2f4b6e"/><rect y="30" width="420" height="16" fill="#2f4b6e"/>
        <circle cx="28" cy="23" r="13" fill="#8d99ae"/>${T(50, 21, "개발팀 팀장님", { fs: 14, c: "#fff", fw: 700 })}${T(50, 37, "● 온라인 · 개발팀", { fs: 10, c: "#9fe0b8" })}
        ${A("c-in", 0.3, `<g><rect x="18" y="60" width="300" height="56" rx="10" fill="#fff4f2" stroke="#f0b8ae"/>${T(30, 82, "📋 필수 교육 미이수자 (마감 D-2)", { fs: 12, fw: 700, c: "#c2453d" })}${T(30, 102, "… 개발팀 / 팀장 / 미이수", { fs: 12, c: "#5a6475" })}</g>`)}
        ${A("c-pop", 0.6, `<rect x="160" y="89" width="90" height="20" rx="4" fill="none" stroke="#c2453d" stroke-width="2.5"/>`)}
        ${A("c-in", 2.4, T(30, 170, "보낼까… 말까… 말투는 괜찮나?", { fs: 12, c: "#8a93a3" }))}
        ${A("c-in", 1.2, `<g><rect x="18" y="196" width="384" height="52" rx="10" fill="#f4f6fa" stroke="#cdd5df"/>
          ${A("c-type", 1.3, T(32, 228, "팀장님, 필수 교육이…", { fs: 14, c: "#1f2733" }), "animation-duration:1.4s")}
          <rect class="c-caret" x="182" y="212" width="2" height="22" fill="#5b8def"/>
          <rect x="342" y="206" width="50" height="32" rx="8" fill="#cdd5df"/>${T(367, 227, "전송", { fs: 12, a: "middle", c: "#fff" })}</g>`)}
      </g>
      ${keyboard(ctx.me, true)}
      ${A("c-pop", 2.6, T(560, 70, "😰", { fs: 34 }))}${vignette}`,
  });

  SC.c07 = (ctx) => ({
    place: "📊 팀장님께 보고하러 가는 길 · 오후 3:00", dur: 3800, sfx: [[1.5, "bad"]],
    svg: `${bgOffice({ id: "g", win: [[40, 40, 140, 100]], sign: "팀장석" })}
      <g><rect x="420" y="190" width="170" height="14" rx="4" fill="#8a6a4e"/><rect x="430" y="204" width="150" height="60" fill="#7a5c43"/>
        ${P(505, 196, 0.55, L("doyoon"), { expr: "neutral", seated: true })}<rect x="470" y="150" width="70" height="44" rx="4" fill="#2b2f3a"/></g>
      ${paperInHands(ctx.me, `${T(16, 30, "신규 리더 교육 만족도", { fs: 16, fw: 800 })}
        ${[["강의 내용", 3.9], ["강사", 3.6], ["운영", 2.8], ["실무 적용", 2.5]].map(([k, v], i) => `${T(16, 62 + i * 26, k, { fs: 11, c: "#5a6475" })}<rect x="84" y="${52 + i * 26}" width="150" height="12" rx="6" fill="#eef1f5"/>${A("c-growx", 0.5 + i * 0.15, `<rect x="84" y="${52 + i * 26}" width="${v * 30}" height="12" rx="6" fill="${v < 3 ? "#e8a33d" : "#5b8def"}"/>`)}${T(242, 62 + i * 26, v.toFixed(1), { fs: 11, fw: 700 })}`).join("")}
        ${A("c-pop", 1.5, T(140, 186, "평균 3.2 / 5.0", { fs: 22, fw: 900, a: "middle", c: "#c2453d" }))}`)}
      ${mine(520, 120, "팀장님께 어떻게 말씀드리지…", 2.0)}${vignette}`,
  });

  SC.c08 = (ctx) => ({
    place: "📧 메일함 · 오전 10:20", dur: 4000, sfx: [[0.2, "send"], [1.4, "bad"], [1.9, "pop"], [2.3, "pop"], [2.7, "pop"]],
    svg: `<rect width="${W}" height="${H}" fill="#2b2f3a"/><rect x="20" y="10" width="600" height="290" rx="10" fill="#e8edf3"/>
      <g transform="translate(40,26)"><rect width="370" height="260" rx="12" fill="#fff" stroke="#cdd5df" stroke-width="2"/>
        <rect width="370" height="40" rx="12" fill="#5b8def"/><rect y="28" width="370" height="12" fill="#5b8def"/>${T(16, 26, "✉️ 보낸 메일", { fs: 14, c: "#fff", fw: 700 })}
        ${T(16, 66, "받는 사람: 전 직원 (200명)", { fs: 12, c: "#5a6475" })}
        ${T(16, 94, "[교육 안내] 하반기 법정 의무교육", { fs: 15, fw: 800 })}
        ${T(16, 128, "교육 일시: 11월 15일(금) 14:00", { fs: 14 })}
        ${[0, 1, 2].map((k) => `<rect x="16" y="${148 + k * 14}" width="${[320, 280, 220][k]}" height="6" rx="3" fill="#e3e8ef"/>`).join("")}
        ${A("c-pop", 1.4, `<ellipse cx="174" cy="123" rx="44" ry="17" fill="none" stroke="#c2453d" stroke-width="3"/>${T(132, 214, "목요일인데…?!", { fs: 15, fw: 900, c: "#c2453d" })}`)}
      </g>
      ${A("c-fly tmp", 0.15, at(330, 260, `<path d="M0,0 L34,-12 L10,6Z M10,6 L14,16 L18,2" fill="#fff" stroke="#5b8def" stroke-width="2" stroke-linejoin="round"/>`))}
      ${[["영업팀", "목요일? 금요일?"], ["개발팀", "날짜 확인 부탁해요!"], ["재무팀", "15일 금요일 맞나요?"]].map(([t, m], i) =>
        A("c-slide-r", 1.9 + i * 0.4, `<g transform="translate(424,${30 + i * 62})"><rect width="180" height="52" rx="10" fill="#fff" stroke="#cdd5df" stroke-width="1.5"/><circle cx="22" cy="26" r="12" fill="${["#8d99ae", "#7bc8a4", "#f7c548"][i]}"/>${T(42, 21, t, { fs: 11, fw: 800 })}${T(42, 39, m, { fs: 11, c: "#5a6475" })}<circle cx="172" cy="8" r="7" fill="#c2453d"/></g>`)).join("")}
      ${A("c-pop", 3.0, chip(470, 222, "+ 문의 12건", { bg: "#c2453d" }))}
      ${deskTop(300, "#b98a5e")}
      <ellipse cx="520" cy="336" rx="30" ry="40" fill="#e3e8ef" stroke="#b9c2ce" stroke-width="2"/>${hand(ctx.me, 520, 344, -6, { s: 0.9 })}
      ${A("c-pop", 1.7, T(250, 300, "😱", { fs: 36 }))}${vignette}`,
  });

  SC.c09 = (ctx) => ({
    place: "🪑 회의실 A · 주간회의", dur: 3800, sfx: [[0.5, "pop"], [1.8, "spot"]],
    svg: `<rect width="${W}" height="${H}" fill="#e3e9f0"/>
      <rect x="390" y="24" width="220" height="104" rx="6" fill="#fff" stroke="#c9d2de" stroke-width="3"/>${T(500, 56, "주간회의", { fs: 17, fw: 800, a: "middle" })}${T(500, 82, "• 채용 현황  • 교육 일정", { fs: 12, a: "middle", c: "#5a6475" })}${T(500, 106, "• 온보딩 개선 ?", { fs: 12, a: "middle", c: "#c2453d", fw: 700 })}
      ${Bu(80, L("seoyeon"), { expr: "neutral" }, 1.05, 330)}
      ${Bu(560, L("jungmin"), { expr: "neutral" }, 1.05, 330)}
      ${Bu(190, L("jihoon"), { expr: "neutral" }, 1.2, 345)}
      ${Bu(450, L("mina"), { expr: "neutral" }, 1.2, 345)}
      ${Bu(320, L("doyoon"), { expr: "smile", pose: "arms" }, 1.4, 365)}
      <path d="M0,250 L640,250 L640,360 L0,360Z" fill="#8a6a4e"/><path d="M0,250 L640,250" stroke="#a6845f" stroke-width="6"/>
      ${mug(150, 262)}${mug(500, 262, true)}
      <g transform="translate(70,330) rotate(-6)"><rect width="200" height="120" rx="4" fill="#fff"/>${[0, 1, 2].map((k) => `<path d="M14,${22 + k * 18} H${170 - k * 30}" stroke="#c9d2de" stroke-width="2"/>`).join("")}</g>
      ${hand(ctx.me, 240, 336, -24, { fist: true })}<path d="M222,300 L196,256" stroke="#2f4b6e" stroke-width="7" stroke-linecap="round"/>
      ${bubble(330, 128, "신입 시각에서 우리 온보딩 프로그램 어때요?", { d: 0.5, fs: 13, maxW: 200, anchor: "c", tx: 330 })}
      ${A("c-pop", 1.8, `<rect width="${W}" height="${H}" fill="rgba(20,24,40,.12)"/>`)}
      ${["80,186", "190,166", "450,166", "560,186"].map((p, i) => A("c-pop", 2.0 + i * 0.1, `<g transform="translate(${p})">${T(-14, -6, "👀", { fs: 20 })}</g>`)).join("")}
      ${vignette}`,
  });

  SC.c10 = (ctx) => ({
    place: "🍜 회사 앞 식당 · 점심", dur: 3800, sfx: [[1.0, "pop"]],
    svg: `<rect width="${W}" height="${H}" fill="#f4e3c8"/><rect y="0" width="${W}" height="24" fill="#c2453d"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<path d="M${k * 80},24 q40,24 80,0" fill="#c2453d"/>`).join("")}
      <g transform="translate(26,46)"><rect width="140" height="96" rx="8" fill="#3b3330"/>${T(70, 26, "오늘의 메뉴", { fs: 14, fw: 800, a: "middle", c: "#ffd27a" })}${T(14, 50, "김치찌개  9,000", { fs: 11, c: "#fff" })}${T(14, 68, "제육볶음  9,500", { fs: 11, c: "#fff" })}${T(14, 86, "칼국수     8,500", { fs: 11, c: "#fff" })}</g>
      ${A("c-lean", 0.6, Bu(350, L("peer"), { expr: "smile" }, 1.55, 420))}
      <path d="M0,262 L640,262 L640,360 L0,360Z" fill="#9b6b43"/><path d="M0,262 L640,262" stroke="#b8865a" stroke-width="6"/>
      ${at(350, 282, `<ellipse cx="0" cy="-4" rx="46" ry="13" fill="#f0e2c4"/><ellipse cx="0" cy="-8" rx="40" ry="9" fill="#f7d9a0"/>`)}
      ${at(300, 352, `<ellipse cx="0" cy="-10" rx="110" ry="34" fill="#2b2f3a"/><ellipse cx="0" cy="-18" rx="96" ry="24" fill="#c2453d"/><ellipse cx="-20" cy="-20" rx="20" ry="7" fill="#f2efe6"/><ellipse cx="30" cy="-16" rx="14" ry="5" fill="#3f8a68"/>`)}
      <g opacity=".7">${[0, 1, 2].map((k) => `<path class="c-rise" style="animation-delay:${k * 0.5}s" d="M${270 + k * 30},300 q-8,-14 0,-28 q8,-14 0,-28" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>`).join("")}</g>
      <path d="M470,360 L410,250 M488,360 L432,252" stroke="#c9a46a" stroke-width="6" stroke-linecap="round"/>${hand(ctx.me, 490, 330, -28, { fist: true })}
      ${bubble(620, 104, "🤫 너 인사팀이잖아. 우리 팀 ○○ 선배 연봉 대충 얼마야?", { d: 1.0, fs: 13, maxW: 190, anchor: "r", tx: 450 })}
      ${A("c-pop", 2.2, A("c-float", 0, T(200, 160, "💰?", { fs: 32 })))}${vignette}`,
  });

  SC.c11 = (ctx) => ({
    place: "🏢 인사팀 내 자리 · 오후 4:20", dur: 3800, sfx: [[1.3, "bad"]],
    svg: `${bgOffice({ id: "k", win: [[440, 30, 160, 100]], sign: false })}
      <g><rect x="470" y="170" width="140" height="12" rx="4" fill="#8a6a4e"/><rect x="480" y="182" width="120" height="70" fill="#7a5c43"/><rect x="500" y="140" width="80" height="30" rx="4" fill="#6b6f7a"/>
        ${A("c-pop", 0.4, `<g><rect x="498" y="196" width="84" height="30" rx="5" fill="#fff" stroke="#c2453d" stroke-width="2"/>${T(540, 216, "🚗 외근 중", { fs: 12, a: "middle", c: "#c2453d", fw: 700 })}</g>`)}
        ${T(540, 134, "팀장님 자리 (비어 있음)", { fs: 11, a: "middle", c: "#7a8494" })}</g>
      ${A("c-slide-l c-fast", 0, Bu(250, L("visitor"), { expr: "angry", pose: "arms" }, 1.75, 450))}
      ${A("c-pop", 1.0, `<g>${[0, 1, 2].map((k) => `<path class="c-rise" style="animation-delay:${k * 0.3}s" d="M${196 + k * 50},90 q-8,-12 0,-24" stroke="#c9ced6" stroke-width="6" fill="none" stroke-linecap="round"/>`).join("")}</g>`)}
      ${bubble(20, 74, "우리 팀 ○○씨 때문에 미치겠어요. 인사팀에서 좀 어떻게 해줘요!", { d: 1.3, fs: 13, maxW: 190, fill: "#fff1f1", tx: 170, tdir: 1 })}
      ${deskTop(300)}
      ${mine(510, 300, "팀장님도 안 계신데…!", 2.2)}${vignette}`,
  });

  SC.c12 = (ctx) => ({
    place: "🌙 내 자리 · 오후 8:50", dur: 4000, sfx: [[1.9, "pop"]],
    svg: `${bgOffice({ id: "l", night: true, sign: false, win: [[440, 30, 170, 110]] })}
      ${A("c-in", 0, `<g transform="translate(30,30)"><rect width="120" height="100" rx="6" fill="#f7f9fc"/><rect width="120" height="26" rx="6" fill="#c2453d"/>${T(60, 18, "평가 시즌", { fs: 12, a: "middle", c: "#fff" })}
        ${[1, 2].map((n, i) => A("c-flash", 0.2 + i * 0.5, T(60, 72, `야근 ${n}일차`, { fs: 16, fw: 800, a: "middle", c: "#3b4250" }), "animation-duration:.5s")).join("")}
        ${A("c-in", 1.2, T(60, 72, "야근 3일차", { fs: 16, fw: 800, a: "middle", c: "#c2453d" }))}</g>`)}
      <ellipse cx="320" cy="220" rx="260" ry="120" fill="#ffe7a8" opacity=".12"/>
      ${A("c-slide-r", 1.5, Bu(560, L("jihoon"), { expr: "smile", pose: "hold" }, 1.35, 400))}
      ${deskTop(262, "#8a6a4e")}
      ${monitor(170, 44, 270, 170, `<rect width="270" height="170" fill="#e9edf3"/>${[0, 1, 2, 3, 4, 5, 6].map((k) => `<rect x="14" y="${16 + k * 20}" width="${[220, 180, 240, 120, 200, 160, 230][k]}" height="8" rx="3" fill="#c5cedb"/>`).join("")}`)}
      ${[0, 1, 2].map((k) => A("c-drop", 0.3 + k * 0.35, at(60 + k * 44, 300, `<g transform="scale(1.6)">${mug(0, 0).replace(/^<g transform="translate\(0,0\)">/, "<g>")}</g>`))).join("")}
      ${keyboard(ctx.me, true)}
      ${bubble(630, 120, "혹시 이것도 오늘 가능할까요?", { d: 1.9, fs: 13, maxW: 150, anchor: "r", tx: 560 })}
      ${mine(330, 250, "😵 오늘도 야근인데…", 2.6)}${vignette}`,
  });

  SC.c13 = (ctx) => ({
    place: "💻 내 자리 · 오후 4:00", dur: 3800, sfx: [[0.3, "pop"], [1.2, "pop"]],
    svg: `${bgOffice({ id: "m", win: [[240, 30, 160, 100]], sign: false })}
      ${Bu(110, L("jungmin"), { expr: "neutral", pose: "arms" }, 1.5, 430, { cls: "c-slide-l", d: 0 })}
      ${Bu(530, L("jihoon"), { expr: "neutral", pose: "arms" }, 1.5, 430, { cls: "c-slide-r", d: 0.9 })}
      ${bubble(14, 106, "평가 안내 메일은 짧게 핵심만!", { d: 0.3, fs: 13, maxW: 140, tx: 110, tdir: 1 })}
      ${bubble(626, 106, "자세히 써야 문의가 안 와요", { d: 1.2, fs: 13, maxW: 140, anchor: "r", tx: 530, tdir: -1 })}
      ${A("c-pop", 2.4, chip(258, 140, "📅 내일 오전 발송", { bg: "#2f4b6e" }))}
      ${paperInHands(ctx.me, `${T(16, 30, "✉️ 평가 안내 메일 (초안)", { fs: 15, fw: 800 })}${[0, 1, 2, 3, 4, 5].map((k) => `<rect x="16" y="${48 + k * 20}" width="${[240, 200, 230, 150, 220, 120][k]}" height="8" rx="3" fill="#dfe5ec"/>`).join("")}`, "c-tug", 2.0)}
      ${vignette}`,
  });

  SC.c14 = (ctx) => ({
    place: "🏢 인사팀 · 금요일 오후", dur: 3800, sfx: [[0.8, "pop"], [2.4, "good"]],
    svg: `${bgOffice({ id: "n", win: [[440, 30, 170, 100]], sign: false })}
      <g><rect x="40" y="86" width="100" height="176" fill="#8a6a4e"/><rect x="46" y="92" width="88" height="170" fill="#a37b58"/><circle cx="124" cy="180" r="5" fill="#ffd27a"/></g>
      ${A("c-in", 0.2, P(92, 262, 0.62, { ...DEFAULT_LOOK, shirt: "#bcd3f0", hair: "#4a3328", style: "long" }, { expr: "smile", pose: "wave" }))}
      ${A("c-pop", 0.5, chip(40, 58, "다음 주 신규 입사자", { bg: "#3f8a68", fs: 11 }))}
      ${Bu(420, L("doyoon"), { expr: "smile", pose: "arms" }, 1.6, 440, { cls: "c-in", d: 0.4 })}
      ${bubble(620, 96, "○○님이 첫 주 온보딩 일부를 맡아줄래요?", { d: 0.8, fs: 13, maxW: 170, anchor: "r", tx: 490, tdir: -1 })}
      ${A("c-up", 1.9, `<g transform="translate(140,286) rotate(-6)"><rect x="-44" y="-56" width="88" height="112" rx="8" fill="#fff" stroke="#c9d2de" stroke-width="2"/><rect x="-44" y="-56" width="88" height="22" rx="8" fill="#2f4b6e"/>${T(0, -40, "HIBRIDGE", { fs: 10, a: "middle", c: "#fff", fw: 800 })}
        <g transform="translate(0,14) scale(.3)">${person(ctx.me, { seated: true, idle: false, expr: "smile" }).replace(/c-blink/g, "")}</g>${T(0, 34, ctx.name || "신입사원", { fs: 11, a: "middle", fw: 800 })}</g>
        ${A("c-pop", 2.4, `<g><circle cx="186" cy="232" r="22" fill="#e8a33d"/>${T(186, 237, "D+100", { fs: 11, fw: 900, a: "middle", c: "#fff" })}</g>`)}${hand(ctx.me, 150, 344, 8, { fist: true })}`)}
      ${mine(330, 300, "아직 100일밖에 안 됐는데…", 1.9)}${vignette}`,
  });

  SC.c15 = (ctx) => ({
    place: "☕ 1:1 미팅룸 · 100일 면담", dur: 3800, sfx: [[0.6, "good"], [1.2, "pop"]],
    svg: `<rect width="${W}" height="${H}" fill="#f2ece2"/>
      ${A("c-pop", 0.6, `<g><path d="M150,20 L490,20 L470,62 L170,62Z" fill="#e8a33d"/>${T(320, 48, "🎉 입사 100일 축하해요", { fs: 18, fw: 800, a: "middle", c: "#fff" })}</g>`)}
      ${[0, 1, 2, 3, 4, 5].map((k) => A("c-fall", 0.7 + k * 0.12, `<rect x="${160 + k * 60}" y="70" width="8" height="12" fill="${["#5b8def", "#f29bb5", "#7bc8a4", "#f7c548"][k % 4]}"/>`)).join("")}
      ${plant(590, 250, 1.1)}${plant(50, 250, 0.9)}
      ${Bu(320, L("doyoon"), { expr: "smile" }, 1.6, 440)}
      <path d="M0,262 L640,262 L640,360 L0,360Z" fill="#8a6a4e"/><path d="M0,262 L640,262" stroke="#a6845f" stroke-width="6"/>
      ${at(400, 286, `<g transform="scale(1.3)">${mug(0, 0, true).replace(/^<g transform="translate\(0,0\)">/, "<g>")}</g>`)}
      ${at(190, 340, `<g transform="scale(2.2)">${mug(0, 0, true).replace(/^<g transform="translate\(0,0\)">/, "<g>")}</g>`)}${hand(ctx.me, 228, 350, -80, { fist: true, s: 0.9 })}
      ${bubble(470, 150, "100일 어땠어요? 바라는 점 있으면 편하게 말해줘요.", { d: 1.2, fs: 13, maxW: 170, tx: 490, tdir: -1 })}${vignette}`,
  });

  // 선배 등록 카드 · 그 외: 게시판 앞에 서서 보는 시점
  SC.custom = (ctx, card) => ({
    place: "📌 선배 경험 게시판 앞", dur: 3200, sfx: [[0.6, "pop"]],
    svg: `<rect width="${W}" height="${H}" fill="#e6eaf0"/>
      <g transform="translate(70,30)"><rect width="500" height="300" rx="12" fill="#c49a6c"/><rect x="14" y="14" width="472" height="272" rx="8" fill="#e9d3b2"/>
        <g transform="rotate(4 70 70)"><rect x="34" y="34" width="90" height="70" fill="#cde8ff"/></g><g transform="rotate(-5 420 220)"><rect x="380" y="190" width="80" height="64" fill="#ffd6e0"/></g>
        ${A("c-drop", 0.3, `<g transform="rotate(-3 250 150)"><rect x="110" y="56" width="280" height="170" fill="#fff8b5"/><circle cx="250" cy="66" r="8" fill="#c2453d"/>
          ${wrap(card ? card.title : "선배의 경험", 240, 20).slice(0, 2).map((l, i) => T(250, 124 + i * 30, l, { fs: 20, fw: 800, a: "middle" })).join("")}
          ${T(250, 204, "— " + (card && card.author ? card.author : "선배"), { fs: 13, a: "middle", c: "#7a6a40" })}</g>`)}</g>
      ${hand(ctx.me, 470, 340, -30)}
      ${mine(320, 330, "선배도 이런 일이 있었구나", 1.2)}${vignette}`,
  });

  // 카드 → 장면
  const build = (key, ctx, card) => (SC[key] ? SC[key](ctx, card) : null);
  function forCard(card, ctx) {
    if (!card) return null;
    return SC[card.id] ? build(card.id, ctx, card) : build("custom", ctx, card);
  }
  const svgOf = (sc, cls) => `<svg class="scene ${cls || ""}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">${A("c-zoom", 0, A("c-pov", 0, sc.svg))}</svg>`;

  return { forCard, elevator: (ctx, dir) => SC.elevator(ctx, dir), svgOf };
})();
