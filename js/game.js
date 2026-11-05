// =============================================================
// 신입 100일 생존기 — 2D 탑뷰 사무실 게임
// 방향키/WASD 이동, Space/Enter 대화, 1~3 선택
// =============================================================
const T = 32, COLS = 30, ROWS = 18, GW = COLS * T, GH = ROWS * T;

// ---------- 캐릭터 외형 ----------
const LOOKS = {
  jungmin: { skin: "#f2c9a0", hair: "#3b2a20", shirt: "#5b8def", pants: "#2d3446", style: "short", glasses: true },
  jihoon: { skin: "#e8b98f", hair: "#1e1e24", shirt: "#f4f4f4", pants: "#3a3f55", style: "short", tie: "#c2453d" },
  seoyeon: { skin: "#f5d0ad", hair: "#5a3825", shirt: "#f29bb5", pants: "#4a4a5a", style: "long" },
  doyoon: { skin: "#e3b38a", hair: "#6b6b75", shirt: "#2f4b6e", pants: "#22262f", style: "short", tie: "#e8a33d", glasses: true },
  mina: { skin: "#f3cba5", hair: "#2a1d18", shirt: "#7bc8a4", pants: "#2d3446", style: "bun" },
  peer: { skin: "#f6d3b0", hair: "#8a5a3b", shirt: "#f7c548", pants: "#3d5a80", style: "long" },
  visitor: { skin: "#dcae86", hair: "#2b2b2b", shirt: "#8d99ae", pants: "#2b2d42", style: "short", tie: "#3d405b" },
};
const DEFAULT_LOOK = { skin: "#f5d0ad", hair: "#2b2b33", shirt: "#3f8a68", pants: "#2d3446", style: "short" };

// ---------- NPC & 오브젝트 ----------
// x, y = 발 위치(타일 단위). ix, iy = 말 거는 지점(없으면 발 위치)
const NPCS = [
  { id: "jungmin", name: "정민 선임", role: "사수 · 채용 운영", x: 14.5, y: 9.95, dir: "up", look: "jungmin",
    idle: ["모르는 건 메신저로 편하게 물어봐요!", "우리 팀은 '오늘 중'이면 보통 6시 전이에요. 근데 물어보는 게 제일 확실해요 😉"] },
  { id: "jihoon", name: "김지훈 책임", role: "채용 담당 · 8년차", x: 16.5, y: 7.35, dir: "down", look: "jihoon", iy: 6.3,
    idle: ["채용은 회사의 첫인상이에요.", "지원자한테는 '언제까지 연락드린다'만 꼭 지키면 돼요."] },
  { id: "seoyeon", name: "박서연 선임", role: "교육(HRD) · 5년차", x: 12.5, y: 7.35, dir: "down", look: "seoyeon", iy: 6.3,
    idle: ["교육 만족도는 숫자보다 주관식 의견이 진짜예요.", "점심 메뉴 고민되면 저한테 물어봐요 🍜"] },
  { id: "mina", name: "최민아 선임", role: "노무 · 조직문화 · 6년차", x: 17.5, y: 9.95, dir: "up", look: "mina",
    idle: ["인사팀은 '말하지 않는 것'도 일이에요.", "메신저엔 이모지 하나가 톤을 바꿔요 :)"] },
  { id: "doyoon", name: "이도윤 팀장", role: "인사팀장 · 15년차", x: 24.5, y: 3.35, dir: "down", look: "doyoon", iy: 4.6,
    idle: ["보고는 결론부터. 나쁜 소식은 먼저.", "바쁘면 바쁘다고 말해줘요. 조용히 무너지는 게 제일 걱정이에요."] },
  { id: "peer", name: "한유진", role: "마케팅팀 입사 동기", x: 25.5, y: 14.4, dir: "left", look: "peer",
    idle: ["우리 동기방 들어왔지? 상단 💬 소통 공간 확인해봐!", "오늘 점심 뭐 먹지… 🤔"] },
  { id: "visitor", name: "강팀장", role: "영업팀장", x: 6.5, y: 14.8, dir: "right", look: "visitor", days: [4],
    idle: ["인사팀 담당자 어디 계세요…?"] },
];
const OBJECTS = [
  { id: "mydesk", name: "내 자리", icon: "💻", x: 12.5, y: 10.1, r: 40,
    idle: "모니터에 포스트잇이 붙어 있다. '모르면 물어보기!'" },
  { id: "meeting", name: "회의실", icon: "🪑", x: 5, y: 6.6, r: 56, idle: "비어 있는 회의실이다." },
  { id: "board", name: "선배 경험 게시판", icon: "📌", x: 21.1, y: 12.2, r: 40, idle: null },
  { id: "coffee", name: "커피 머신", icon: "☕", x: 27.6, y: 11.6, r: 40, idle: null },
  { id: "door", name: "출입문", icon: "🚪", x: 3, y: 16.4, r: 44, idle: null },
];
// 상황 카드 → 누구(어디)에게서 시작되는지
const CARD_NPC = {
  c01: "jungmin", c02: "jungmin", c03: "peer",
  c04: "mydesk", c05: "doyoon", c06: "mydesk",
  c07: "doyoon", c08: "mydesk", c09: "meeting",
  c10: "peer", c11: "visitor", c12: "jihoon",
  c13: "jungmin", c14: "doyoon", c15: "meeting",
};
const CARD_SPEAKER = { c04: "📞 지원자의 전화", c06: "💻 메신저", c08: "📧 메일함" };
const SENIOR_LOOK = { jihoon: "jihoon", seoyeon: "seoyeon", doyoon: "doyoon", mina: "mina" };

// ---------- 충돌 영역 (타일 단위 [x, y, w, h]) ----------
const SOLIDS = [
  [0, 0, 30, 2], [0, 0, 1, 18], [29, 0, 1, 18], [0, 17, 30, 1],
  [9, 2, 0.25, 6.25], [1, 8, 4, 0.25], [6, 8, 3.25, 0.25],   // 회의실 유리벽 (문: x 5~6)
  [3, 4, 4, 2],                                               // 회의 테이블
  [11, 7, 8, 2],                                              // 인사팀 책상
  [23, 3, 3, 1],                                              // 팀장 책상
  [19, 2, 2, 0.9],                                            // 복합기
  [20.1, 7.2, 0.8, 0.7],                                      // 정수기
  [28, 10, 1, 3.5],                                           // 라운지 카운터
  [23, 13, 1.4, 1],                                           // 라운지 테이블
  [21, 16, 3, 1],                                             // 소파
  [20.6, 11.2, 1, 0.5],                                       // 게시판
  [9.6, 2.2, 0.8, 0.6], [27.6, 6.3, 0.8, 0.6], [1.2, 15.6, 0.8, 0.6], [19.2, 15.6, 0.8, 0.6], // 화분
];

// =============================================================
// 픽셀 캐릭터 그리기
// =============================================================
function drawPerson(c, x, y, look, dir, frame, bob) {
  const P = 2, ox = Math.round(x - 6 * P), oy = Math.round(y - 18 * P + (bob || 0));
  const r = (px, py, w, h, col) => { c.fillStyle = col; c.fillRect(ox + px * P, oy + py * P, w * P, h * P); };
  c.fillStyle = "rgba(0,0,0,.18)"; c.beginPath(); c.ellipse(x, y - 1, 9, 3.5, 0, 0, Math.PI * 2); c.fill();
  // 다리
  const lUp = frame === 1 ? 1 : 0, rUp = frame === 2 ? 1 : 0;
  r(3, 14, 2, 4 - lUp, look.pants); r(7, 14, 2, 4 - rUp, look.pants);
  r(3, 17 - lUp, 2, 1, "#23232b"); r(7, 17 - rUp, 2, 1, "#23232b");
  // 몸통 & 팔
  r(2, 8, 8, 6, look.shirt);
  if (dir === "left" || dir === "right") {
    const swing = frame === 1 ? -1 : frame === 2 ? 1 : 0;
    r(5 + swing, 9, 2, 4, shade(look.shirt)); r(5 + swing, 13, 2, 1, look.skin);
  } else {
    r(1, 9, 1, 4, look.shirt); r(10, 9, 1, 4, look.shirt); r(1, 13, 1, 1, look.skin); r(10, 13, 1, 1, look.skin);
    if (look.tie && dir === "down") r(5, 8, 2, 4, look.tie);
  }
  // 머리
  r(2, 1, 8, 7, look.skin);
  const h = look.hair;
  if (look.style === "long") {
    if (dir === "up") r(1, 0, 10, 10, h);
    else { r(1, 0, 10, 3, h); r(1, 3, 1, 7, h); r(10, 3, 1, 7, h); if (dir === "left") r(6, 3, 5, 5, h); if (dir === "right") r(1, 3, 5, 5, h); }
  } else {
    if (dir === "up") r(2, 0, 8, 7, h);
    else { r(2, 0, 8, 3, h); if (dir === "down") { r(2, 3, 1, 2, h); r(9, 3, 1, 2, h); } if (dir === "left") r(7, 3, 3, 3, h); if (dir === "right") r(2, 3, 3, 3, h); }
    if (look.style === "bun") r(4, -2, 4, 2, h);
  }
  // 눈 · 안경
  const eye = "#1d1d24";
  if (dir === "down") { r(4, 4, 1, 2, eye); r(7, 4, 1, 2, eye); r(5, 6, 2, 1, "#e0a08a"); }
  if (dir === "left") r(3, 4, 1, 2, eye);
  if (dir === "right") r(8, 4, 1, 2, eye);
  if (look.glasses && dir !== "up") {
    c.strokeStyle = "#2b2b33"; c.lineWidth = 1;
    if (dir === "down") { c.strokeRect(ox + 3 * P + 0.5, oy + 3 * P + 0.5, 3 * P - 1, 3 * P - 1); c.strokeRect(ox + 6 * P + 0.5, oy + 3 * P + 0.5, 3 * P - 1, 3 * P - 1); }
    else { const gx = dir === "left" ? 2 : 7; c.strokeRect(ox + gx * P + 0.5, oy + 3 * P + 0.5, 3 * P - 1, 3 * P - 1); }
  }
}
function shade(hex) {
  const n = parseInt(hex.slice(1), 16), f = 0.82;
  return "rgb(" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * f)).join(",") + ")";
}
function portrait(look, size) {
  const c = document.createElement("canvas"); c.width = c.height = 40;
  const x = c.getContext("2d"); x.imageSmoothingEnabled = false;
  x.fillStyle = "#e9efe9"; x.fillRect(0, 0, 40, 40);
  x.save(); x.translate(20, 46); x.scale(1.5, 1.5); drawPerson(x, 0, 0, look, "down", 0); x.restore();
  return `<img class="portrait" src="${c.toDataURL()}" width="${size || 48}" height="${size || 48}" alt="" />`;
}

// =============================================================
// 배경 (한 번만 그려서 캐시)
// =============================================================
let BG = null;
function buildBG() {
  const cv = document.createElement("canvas"); cv.width = GW; cv.height = GH;
  const c = cv.getContext("2d");
  const rect = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x * T, y * T, w * T, h * T); };
  const px = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };

  // 바닥
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    let a = "#e4dfd3", b = "#ddd7ca";
    if (x >= 1 && x <= 8 && y >= 2 && y <= 7) { a = "#d6e4ea"; b = "#cddce3"; }
    else if (x >= 20 && x <= 28 && y >= 10 && y <= 16) { a = "#d4ad80"; b = "#cba274"; }
    else if (x >= 21 && x <= 28 && y >= 2 && y <= 5) { a = "#dcd6e6"; b = "#d5cee0"; }
    rect(x, y, 1, 1, (x + y) % 2 ? a : b);
    if (x >= 20 && x <= 28 && y >= 10 && y <= 16) px(x * T, y * T + 15, T, 2, "rgba(120,80,40,.18)");
  }
  // 러그
  c.fillStyle = "#b7cfc0"; c.fillRect(21.6 * T, 12.4 * T, 3.8 * T, 3 * T);
  c.strokeStyle = "#9cbaa8"; c.lineWidth = 3; c.strokeRect(21.75 * T, 12.55 * T, 3.5 * T, 2.7 * T);

  // 벽
  rect(0, 0, 30, 1, "#3d4250"); rect(0, 1, 30, 1, "#efe9dc"); px(0, 2 * T - 5, GW, 5, "#bfb7a6");
  rect(0, 0, 1, 18, "#3d4250"); rect(29, 0, 1, 18, "#3d4250"); rect(0, 17, 30, 1, "#3d4250");
  // 창문
  [11, 15, 26].forEach((wx) => {
    px(wx * T, T + 4, T * 2, T - 12, "#8a7f6b"); px(wx * T + 3, T + 7, T * 2 - 6, T - 18, "#bfe0f2");
    px(wx * T + T - 1, T + 7, 2, T - 18, "#8a7f6b");
  });
  // 표지판
  const sign = (x, text) => {
    px(x * T - 30, T + 6, 60, 18, "#2f6b4f"); c.fillStyle = "#fff"; c.font = "bold 11px Galmuri11, Pretendard, sans-serif";
    c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, x * T, T + 15.5);
  };
  sign(4.5, "회의실"); sign(14, "인사팀"); sign(23, "팀장석");
  // 출입문
  px(2 * T, 17 * T, 2 * T, T, "#8a6440"); px(2 * T + 4, 17 * T + 4, T - 6, T - 8, "#b98b5e"); px(3 * T + 2, 17 * T + 4, T - 6, T - 8, "#b98b5e");
  px(2 * T + 10, 17 * T + 8, 10, 10, "#cfe8f5"); px(3 * T + 8, 17 * T + 8, 10, 10, "#cfe8f5");
  c.fillStyle = "#3d4250"; c.font = "bold 11px Galmuri11, Pretendard, sans-serif"; c.textAlign = "center"; c.fillText("▼ 출입문", 3 * T, 17 * T - 6);

  // 회의실 테이블 & 의자
  for (let i = 0; i < 4; i++) {
    roundRect(c, (3.15 + i) * T, 3.35 * T, 0.7 * T, 0.55 * T, 6, "#3f4656");
    roundRect(c, (3.15 + i) * T, 6.1 * T, 0.7 * T, 0.55 * T, 6, "#3f4656");
  }
  roundRect(c, 3 * T, 4 * T, 4 * T, 2 * T, 8, "#f3f1ea"); roundRect(c, 3 * T + 4, 4 * T + 4, 4 * T - 8, 2 * T - 8, 6, "#fbfaf6");
  px(4.6 * T, 4.7 * T, 26, 18, "#3d4250"); px(4.6 * T + 3, 4.7 * T + 3, 20, 12, "#7fb3d5");
  // 회의실 유리벽
  c.fillStyle = "rgba(150,200,230,.55)"; c.fillRect(9 * T, 2 * T, 8, 6.25 * T); c.fillRect(1 * T, 8 * T, 4 * T, 8); c.fillRect(6 * T, 8 * T, 3.25 * T, 8);
  c.fillStyle = "rgba(255,255,255,.7)"; c.fillRect(9 * T + 2, 2 * T, 2, 6.25 * T); c.fillRect(1 * T, 8 * T + 2, 4 * T, 2); c.fillRect(6 * T, 8 * T + 2, 3.25 * T, 2);

  // 인사팀 의자 (북쪽/남쪽)
  [11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.5, 18.5].forEach((cx) => {
    roundRect(c, cx * T - 10, 6.25 * T, 20, 18, 6, "#4b5263");
    roundRect(c, cx * T - 10, 9.15 * T, 20, 18, 6, "#4b5263");
  });
  // 팀장 의자
  roundRect(c, 24.5 * T - 12, 2.55 * T, 24, 20, 6, "#2d3446");

  // 복합기 & 정수기
  px(19 * T, 2 * T, 2 * T, 0.9 * T, "#c9ccd1"); px(19 * T + 4, 2 * T + 4, 2 * T - 8, 8, "#8d939c"); px(19 * T + 8, 2 * T + 18, 20, 4, "#3fb37f");
  px(20.1 * T, 7.2 * T, 0.8 * T, 0.7 * T, "#dfe7ee"); px(20.1 * T + 6, 7.2 * T - 10, 0.8 * T - 12, 12, "#9fd3f0");
  // 라운지 카운터 & 커피머신
  px(28 * T, 10 * T, T, 3.5 * T, "#8a6440"); px(28 * T + 3, 10 * T, T - 3, 3.5 * T - 4, "#b98b5e");
  px(28 * T + 4, 11.1 * T, 22, 26, "#3d4250"); px(28 * T + 8, 11.1 * T + 6, 14, 6, "#e86a5c"); px(28 * T + 10, 11.1 * T + 18, 10, 6, "#fff");
  // 라운지 테이블 & 소파
  c.fillStyle = "#f3f1ea"; c.beginPath(); c.ellipse(23.7 * T, 13.5 * T, 0.8 * T, 0.6 * T, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#e86a5c"; c.fillRect(23.5 * T, 13.3 * T, 10, 10);
  roundRect(c, 21 * T, 16 * T, 3 * T, T, 8, "#4f7cac"); roundRect(c, 21 * T + 4, 16 * T + 4, 3 * T - 8, T - 12, 6, "#6b97c6");
  // 게시판
  px(20.6 * T, 10.4 * T, T, 0.9 * T, "#8a6440"); px(20.6 * T + 3, 10.4 * T + 3, T - 6, 0.9 * T - 6, "#e9d6b0");
  ["#f7c548", "#f29bb5", "#7bc8a4"].forEach((col, i) => px(20.6 * T + 5 + i * 8, 10.4 * T + 6 + (i % 2) * 6, 7, 7, col));
  px(20.6 * T + 4, 11.3 * T, 3, 8, "#6b4a2e"); px(21.6 * T - 7, 11.3 * T, 3, 8, "#6b4a2e");
  // 화분
  [[10, 2.5], [28, 6.6], [1.6, 15.9], [19.6, 15.9]].forEach(([x, y]) => plant(c, x * T, y * T));
  // 바닥 라벨
  c.fillStyle = "rgba(90,60,30,.25)"; c.font = "bold 14px Galmuri11, Pretendard, sans-serif"; c.textAlign = "center";
  c.fillText("라 운 지", 24.5 * T, 10.75 * T);
  BG = cv;
}
function roundRect(c, x, y, w, h, r, col) {
  c.fillStyle = col; c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); c.fill();
}
function plant(c, x, y) {
  c.fillStyle = "#b5653f"; c.fillRect(x - 9, y, 18, 14);
  c.fillStyle = "#3f8a52"; [[-8, -6], [0, -12], [8, -6], [-4, -2], [4, -2]].forEach(([dx, dy]) => { c.beginPath(); c.arc(x + dx, y + dy, 7, 0, Math.PI * 2); c.fill(); });
  c.fillStyle = "#5fae6e"; c.beginPath(); c.arc(x - 2, y - 10, 4, 0, Math.PI * 2); c.fill();
}
// y-정렬로 그리는 가구 (캐릭터 앞/뒤 표현)
const PROPS = [
  { sortY: 9 * T, draw(c) { // 인사팀 책상
    roundRect(c, 11 * T, 7 * T, 8 * T, 2 * T, 6, "#8a6440"); roundRect(c, 11 * T + 2, 7 * T + 2, 8 * T - 4, 2 * T - 8, 5, "#c99a6a");
    c.fillStyle = "rgba(0,0,0,.15)"; c.fillRect(11 * T + 4, 8 * T - 1, 8 * T - 8, 2);
    for (let i = 0; i < 8; i++) {
      const mx = (11.5 + i) * T;
      c.fillStyle = "#30343f"; c.fillRect(mx - 9, 7 * T + 8, 18, 12); c.fillStyle = "#6fa3c7"; c.fillRect(mx - 7, 7 * T + 10, 14, 7);
      c.fillStyle = "#30343f"; c.fillRect(mx - 9, 8 * T + 12, 18, 12); c.fillStyle = "#6fa3c7"; c.fillRect(mx - 7, 8 * T + 14, 14, 7);
    }
    c.fillStyle = "#f7c548"; c.fillRect(12.5 * T + 6, 8 * T + 10, 7, 7); // 내 자리 포스트잇
  } },
  { sortY: 4 * T, draw(c) { // 팀장 책상
    roundRect(c, 23 * T, 3 * T, 3 * T, T, 6, "#5a4030"); roundRect(c, 23 * T + 2, 3 * T + 2, 3 * T - 4, T - 8, 5, "#8a6440");
    c.fillStyle = "#30343f"; c.fillRect(24.5 * T - 12, 3 * T + 4, 24, 14); c.fillStyle = "#6fa3c7"; c.fillRect(24.5 * T - 10, 3 * T + 6, 20, 9);
    c.fillStyle = "#f3f1ea"; c.fillRect(23.3 * T, 3 * T + 8, 14, 10);
  } },
];

// =============================================================
// 게임 런타임
// =============================================================
const Game = (() => {
  let cv, ctx, wrap, raf = null, mode = "walk", tick = 0;
  const keys = {};
  const player = { x: 3 * T, y: 15.8 * T, dir: "up", moving: false };
  let floats = [], typer = null, dlgDone = null, choiceHandler = null;

  const g = () => S.game;
  const look = () => g().look || DEFAULT_LOOK;
  const dayCards = () => cardsForDay(g().day);
  const curCard = () => dayCards()[g().idx];
  const targetOf = (card) => (card ? CARD_NPC[card.id] || (card.custom ? "board" : "jungmin") : "door");
  const visibleNpcs = () => NPCS.filter((n) => !n.days || n.days.includes(g().day) || targetOf(curCard()) === n.id);
  const nameOfTarget = (id) => (NPCS.find((n) => n.id === id) || OBJECTS.find((o) => o.id === id)).name;

  // ---------- 마운트 ----------
  function mount(app) {
    if (!BG) buildBG();
    const gm = g();
    if (["card", "result"].includes(gm.phase)) gm.phase = "play";
    if (!gm.look) gm.look = { ...DEFAULT_LOOK };
    app.innerHTML = `
      <div class="ghud" id="ghud"></div>
      <div class="gwrap" id="gwrap">
        <canvas id="cv" width="${GW}" height="${GH}"></canvas>
        <div class="quest" id="quest"></div>
        <div class="dlg hidden" id="dlg"></div>
        <div class="gpanel hidden" id="gpanel"></div>
        <div class="touch">
          <div class="dpad">
            <button data-k="ArrowUp" class="u">▲</button><button data-k="ArrowLeft" class="l">◀</button>
            <button data-k="ArrowRight" class="r">▶</button><button data-k="ArrowDown" class="d">▼</button>
          </div>
          <button class="abtn" data-k=" ">A</button>
        </div>
      </div>
      <p class="ghelp">⌨️ <b>방향키 / WASD</b> 이동 · <b>Space</b> 말 걸기 · 대화 중 <b>1 2 3</b> 선택 &nbsp;|&nbsp; 머리 위 <b class="bang">!</b> 표시를 찾아가세요</p>`;
    cv = document.getElementById("cv"); ctx = cv.getContext("2d"); ctx.imageSmoothingEnabled = false;
    wrap = document.getElementById("gwrap");
    wrap.querySelectorAll("[data-k]").forEach((b) => {
      const k = b.dataset.k;
      const on = (e) => { e.preventDefault(); if (k === " ") press(" "); else keys[k] = true; };
      const off = (e) => { e.preventDefault(); keys[k] = false; };
      b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointerleave", off);
    });
    floats = []; mode = "walk";
    updateHUD();
    if (gm.phase === "dayIntro") showDayIntro();
    else if (gm.phase === "retro") showRetro();
    else if (gm.phase === "ending") showEnding();
    if (!raf) raf = requestAnimationFrame(loop);
  }

  // ---------- 입력 ----------
  function onKeyDown(e) {
    if (!cv || !document.body.contains(cv)) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "textarea" || tag === "input" || tag === "select") return;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
    const map = { w: "ArrowUp", a: "ArrowLeft", s: "ArrowDown", d: "ArrowRight", W: "ArrowUp", A: "ArrowLeft", S: "ArrowDown", D: "ArrowRight" };
    const k = map[e.key] || e.key;
    if (k.startsWith("Arrow")) { keys[k] = true; return; }
    if (e.repeat) return;
    press(k);
  }
  function onKeyUp(e) {
    const map = { w: "ArrowUp", a: "ArrowLeft", s: "ArrowDown", d: "ArrowRight", W: "ArrowUp", A: "ArrowLeft", S: "ArrowDown", D: "ArrowRight" };
    keys[map[e.key] || e.key] = false;
  }
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  function press(k) {
    if (mode === "walk" && (k === " " || k === "Enter" || k === "e" || k === "E")) return interact();
    if (mode === "dialog") {
      if (choiceHandler && ["1", "2", "3", "4"].includes(k)) {
        const b = document.querySelector(`#dlg [data-c="${+k - 1}"]`); if (b) b.click(); return;
      }
      if (k === " " || k === "Enter") advance();
    }
  }

  // ---------- 루프 ----------
  function loop() {
    if (!cv || !document.body.contains(cv)) { raf = null; return; }
    tick++;
    if (mode === "walk") move();
    draw();
    raf = requestAnimationFrame(loop);
  }

  function blocked(x, y) {
    const hb = [x - 8, y - 8, 16, 8];
    const hit = (r) => hb[0] < r[0] + r[2] && hb[0] + hb[2] > r[0] && hb[1] < r[1] + r[3] && hb[1] + hb[3] > r[1];
    if (SOLIDS.some((s) => hit([s[0] * T, s[1] * T, s[2] * T, s[3] * T]))) return true;
    return visibleNpcs().some((n) => hit([n.x * T - 10, n.y * T - 10, 20, 10]));
  }
  function move() {
    let dx = 0, dy = 0;
    if (keys.ArrowLeft) dx -= 1; if (keys.ArrowRight) dx += 1; if (keys.ArrowUp) dy -= 1; if (keys.ArrowDown) dy += 1;
    player.moving = !!(dx || dy);
    if (!player.moving) return;
    if (dx && dy) { dx *= 0.707; dy *= 0.707; }
    const sp = 2.6;
    if (dx) player.dir = dx < 0 ? "left" : "right"; else player.dir = dy < 0 ? "up" : "down";
    if (!blocked(player.x + dx * sp, player.y)) player.x += dx * sp;
    if (!blocked(player.x, player.y + dy * sp)) player.y += dy * sp;
  }

  function nearest() {
    let best = null, bd = 1e9;
    const consider = (o, ix, iy, range) => {
      const d = Math.hypot(player.x - ix * T, player.y - iy * T);
      if (d < range && d < bd) { bd = d; best = o; }
    };
    visibleNpcs().forEach((n) => consider(n, n.ix || n.x, n.iy || n.y, 46));
    OBJECTS.forEach((o) => consider(o, o.x, o.y, o.r));
    return best;
  }

  // ---------- 그리기 ----------
  function draw() {
    const gm = g();
    ctx.drawImage(BG, 0, 0);
    const target = gm.phase === "play" ? targetOf(curCard()) : null;
    const ents = [];
    PROPS.forEach((p) => ents.push({ y: p.sortY, draw: () => p.draw(ctx) }));
    visibleNpcs().forEach((n) => {
      const bob = Math.round(Math.sin((tick + n.x * 40) / 30));
      ents.push({ y: n.y * T, draw: () => drawPerson(ctx, n.x * T, n.y * T, LOOKS[n.look], n.dir, 0, bob > 0 ? 1 : 0) });
    });
    const frame = player.moving ? [0, 1, 0, 2][Math.floor(tick / 7) % 4] : 0;
    ents.push({ y: player.y, draw: () => drawPerson(ctx, player.x, player.y, look(), player.dir, frame) });
    ents.sort((a, b) => a.y - b.y).forEach((e) => e.draw());

    // 이름표
    ctx.font = "bold 10px Galmuri11, Pretendard, sans-serif"; ctx.textAlign = "center";
    visibleNpcs().forEach((n) => label(n.name, n.x * T, n.y * T - 44, n.id === target ? "#2f6b4f" : "rgba(40,44,56,.75)"));
    label(gm.name, player.x, player.y - 44, "#e8a33d");

    // 퀘스트 표시 (!)
    if (target) {
      const n = NPCS.find((x) => x.id === target), o = OBJECTS.find((x) => x.id === target);
      const tx = (n ? n.x : o.x) * T, ty = n ? n.y * T - 58 : o.y * T - 40;
      bang(tx, ty + Math.sin(tick / 8) * 3);
    }
    if (gm.phase === "play" && !curCard()) {
      const o = OBJECTS.find((x) => x.id === "door"); bang(o.x * T, o.y * T - 34 + Math.sin(tick / 8) * 3);
    }

    // 상호작용 안내
    if (mode === "walk") {
      const nb = nearest();
      if (nb) {
        const ix = (nb.ix || nb.x) * T, iy = (nb.y) * T - (nb.look ? 70 : 30);
        const txt = "Space  " + (nb.look ? "말 걸기" : nb.name);
        ctx.font = "bold 11px Galmuri11, Pretendard, sans-serif";
        const w = ctx.measureText(txt).width + 14;
        roundRect(ctx, ix - w / 2, iy - 12, w, 20, 6, "rgba(31,36,48,.88)");
        ctx.fillStyle = "#fff"; ctx.textBaseline = "middle"; ctx.fillText(txt, ix, iy - 2); ctx.textBaseline = "alphabetic";
      }
    }

    // 떠오르는 수치
    floats = floats.filter((f) => f.t < 70);
    floats.forEach((f) => {
      f.t++; ctx.globalAlpha = Math.max(0, 1 - f.t / 70);
      ctx.font = "bold 13px Galmuri11, Pretendard, sans-serif"; ctx.textAlign = "center";
      ctx.lineWidth = 3; ctx.strokeStyle = "#fff"; ctx.strokeText(f.text, f.x, f.y - f.t * 0.6);
      ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y - f.t * 0.6); ctx.globalAlpha = 1;
    });

    // 시간 흐름 (하루가 지날수록 노을빛)
    const n = dayCards().length || 1, prog = Math.min(1, gm.idx / n);
    if (gm.phase === "retro" || gm.phase === "ending") { ctx.fillStyle = "rgba(20,24,60,.45)"; ctx.fillRect(0, 0, GW, GH); }
    else if (prog > 0) { ctx.fillStyle = `rgba(255,140,60,${prog * 0.16})`; ctx.fillRect(0, 0, GW, GH); }
  }
  function label(text, x, y, bg) {
    const w = ctx.measureText(text).width + 10;
    roundRect(ctx, x - w / 2, y - 9, w, 15, 5, bg);
    ctx.fillStyle = "#fff"; ctx.textBaseline = "middle"; ctx.fillText(text, x, y - 1.5); ctx.textBaseline = "alphabetic";
  }
  function bang(x, y) {
    roundRect(ctx, x - 10, y - 14, 20, 22, 6, "#e8a33d");
    ctx.beginPath(); ctx.moveTo(x - 4, y + 8); ctx.lineTo(x + 4, y + 8); ctx.lineTo(x, y + 14); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 15px Galmuri11, Pretendard, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("!", x, y - 2); ctx.textBaseline = "alphabetic";
  }

  // ---------- HUD ----------
  function updateHUD() {
    const gm = g(), d = DAYS[gm.day - 1];
    document.getElementById("ghud").innerHTML = `
      <div class="who">${portrait(look(), 40)}<div><b>${esc(gm.name)}</b><br/><span class="muted small">인사팀 신입 · ${d.label} ${d.title}</span></div></div>
      <div class="mini-gauges">${GAUGES.map((x) => {
        const v = gm.gauges[x.key];
        return `<div class="mg ${v <= 20 ? "low" : ""}" title="${x.desc}"><span>${x.icon} ${x.label}</span><div class="bar"><i style="width:${v}%;background:${GCOLOR[x.key]}"></i></div><b>${v}</b></div>`;
      }).join("")}</div>
      <div class="days">${DAYS.map((x) => `<span class="${x.day < gm.day ? "done" : x.day === gm.day ? "now" : ""}">${x.label}</span>`).join("")}</div>`;
    const card = curCard(), n = dayCards().length;
    document.getElementById("quest").innerHTML = gm.phase !== "play" ? "" :
      card ? `📌 <b>오늘의 할 일 ${gm.idx + 1}/${n}</b><br/>${esc(nameOfTarget(targetOf(card)))}${NPCS.some((x) => x.id === targetOf(card)) ? "에게 말 걸기" : "(으)로 가기"}`
           : `📌 <b>오늘 일 끝!</b><br/>출입문으로 가서 퇴근하기 🌙`;
  }

  // ---------- 상호작용 ----------
  function interact() {
    const nb = nearest(); if (!nb) return;
    const gm = g(), card = curCard();
    if (nb.look) player.dir = faceTo(nb);
    if (gm.phase !== "play") return;
    if (card && targetOf(card) === nb.id) return startCard(card, nb);
    if (nb.id === "door") {
      if (card) return say(nb, "아직 오늘 할 일이 남았어요. 왼쪽 위 📌 할 일을 확인하세요.");
      gm.phase = "retro"; save(); return showRetro();
    }
    if (nb.id === "coffee") {
      if (gm.coffee === gm.day) return say(nb, "오늘은 이미 한 잔 마셨어요. 카페인은 하루 한 잔! ☕");
      gm.coffee = gm.day; gm.gauges.hp = clamp(gm.gauges.hp + 3); save(); updateHUD();
      floats.push({ x: player.x, y: player.y - 50, text: "🔋 체력 +3", color: "#c98a20", t: 0 });
      return say(nb, "따뜻한 커피 한 잔. 잠깐 숨 돌렸다. (체력 +3)");
    }
    if (nb.id === "board") {
      const mine = S.customCards.length;
      return say(nb, mine ? `선배들이 남긴 경험 카드 ${mine}장이 붙어 있다. 해당 시기가 되면 여기서 상황이 시작된다.`
        : "아직 붙은 경험 카드가 없다. 시니어가 '✍️ 시니어' 탭에서 경험을 등록하면 여기에 붙는다.");
    }
    const line = Array.isArray(nb.idle) ? nb.idle[Math.floor(Math.random() * nb.idle.length)] : nb.idle;
    say(nb, line);
  }
  function faceTo(n) {
    const dx = n.x * T - player.x, dy = n.y * T - player.y;
    return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : dy < 0 ? "up" : "down";
  }

  // ---------- 대화창 ----------
  function speakerHTML(who) {
    if (!who) return "";
    const pic = who.look ? portrait(LOOKS[who.look], 52) : `<div class="portrait emoji">${who.icon || "💬"}</div>`;
    return `<div class="spk">${pic}<div><b>${esc(who.name)}</b>${who.role ? `<br/><span class="small muted">${esc(who.role)}</span>` : ""}</div></div>`;
  }
  function openDlg(who, text, opts) {
    mode = "dialog"; choiceHandler = null;
    const el = document.getElementById("dlg"); el.classList.remove("hidden");
    el.innerHTML = `${speakerHTML(who)}<div class="dbody">${opts && opts.head ? opts.head : ""}<p class="dtext" id="dtext"></p><div id="dchoices"></div><div class="dnext hidden" id="dnext">▼</div></div>`;
    el.onclick = (e) => { if (!e.target.closest("button")) advance(); };
    const tEl = document.getElementById("dtext");
    let i = 0;
    clearInterval(typer);
    typer = setInterval(() => {
      i += 2; tEl.textContent = text.slice(0, i);
      if (i >= text.length) finishType();
    }, 22);
    function finishType() {
      clearInterval(typer); typer = null; tEl.textContent = text;
      if (opts && opts.choices) showChoices(opts.choices, opts.onPick, opts.extra);
      else document.getElementById("dnext").classList.remove("hidden");
    }
    dlgDone = { finishType, after: opts && opts.after };
  }
  function advance() {
    if (!dlgDone) return;
    if (typer) return dlgDone.finishType();
    if (choiceHandler) return;
    const after = dlgDone.after; closeDlg(); if (after) after();
  }
  function closeDlg() {
    clearInterval(typer); typer = null; dlgDone = null; choiceHandler = null;
    const el = document.getElementById("dlg"); if (el) el.classList.add("hidden");
    mode = "walk";
  }
  function showChoices(list, onPick, extra) {
    choiceHandler = onPick;
    document.getElementById("dchoices").innerHTML = list.map((t, k) => `<button class="dchoice" data-c="${k}"><b>${k + 1}</b> ${esc(t)}</button>`).join("") + (extra || "");
    document.querySelectorAll("#dchoices [data-c]").forEach((b) => b.addEventListener("click", () => { const f = choiceHandler; choiceHandler = null; f(+b.dataset.c); }));
    const ask = document.getElementById("dask"); if (ask) ask.addEventListener("click", () => openAsk(curCard()));
  }
  function say(who, text, after) { openDlg(who, text, { after }); }

  // ---------- 상황 카드 ----------
  function startCard(card, who) {
    const order = orderOf(card);
    const speaker = CARD_SPEAKER[card.id] ? { name: CARD_SPEAKER[card.id], icon: "" } : who;
    const head = `<div class="dhead"><span class="tag">${esc(card.category)}</span>${card.custom ? ' <span class="tag amber">선배 등록 카드</span>' : ""} <b>${esc(card.title)}</b></div>`;
    openDlg(speaker, card.text, {
      head,
      choices: order.map((oi) => card.choices[oi].text),
      extra: `<button class="dask" id="dask">🙋 선배에게 물어보기</button>`,
      onPick: (k) => pick(card, order[k], who),
    });
  }
  function pick(card, i, who) {
    const gm = g(), eff = card.choices[i].effects, delta = {};
    GAUGES.forEach((x, k) => { const b = gm.gauges[x.key]; gm.gauges[x.key] = clamp(b + eff[k]); delta[x.key] = gm.gauges[x.key] - b; });
    gm.history.push({ cardId: card.id, choice: i, best: card.best, day: gm.day });
    gm.last = { cardId: card.id, choice: i, delta };
    gm.idx++;
    const dead = GAUGES.find((x) => gm.gauges[x.key] <= 0); if (dead) gm.failKey = dead.key;
    S.stats.choices[card.id] = S.stats.choices[card.id] || card.choices.map(() => 0);
    S.stats.choices[card.id][i] = (S.stats.choices[card.id][i] || 0) + 1;
    S.stats.plays[card.id] = (S.stats.plays[card.id] || 0) + 1;
    save(); updateHUD();
    GAUGES.forEach((x, k) => { if (delta[x.key]) floats.push({ x: player.x + (k - 1.5) * 4, y: player.y - 50 - k * 16,
      text: `${x.icon} ${x.label} ${delta[x.key] > 0 ? "+" : ""}${delta[x.key]}`, color: delta[x.key] > 0 ? "#2f9e6b" : "#c2453d", t: -k * 6 }); });
    if (Object.values(delta).some((v) => v <= -15)) shake();
    closeDlg();
    setTimeout(() => say({ name: "결과", icon: "📎" }, card.choices[i].result, () => showFeedback(card, i)), 250);
  }
  function shake() { wrap.classList.remove("shake"); void wrap.offsetWidth; wrap.classList.add("shake"); }

  // ---------- 패널 (피드백 · 회고 · 하루 시작 · 엔딩) ----------
  function panel(html, cls) {
    mode = "panel";
    const p = document.getElementById("gpanel"); p.className = "gpanel " + (cls || ""); p.innerHTML = `<div class="gbox">${html}</div>`;
    return p;
  }
  function closePanel() {
    const p = document.getElementById("gpanel"); if (p) p.classList.add("hidden"); mode = "walk";
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  function showFeedback(card, mine) {
    const order = orderOf(card), letter = (oi) => order.indexOf(oi) + 1;
    const same = card.feedback.filter((f) => f.pick === mine).length;
    const p = panel(`
      <div class="row" style="justify-content:space-between"><h2 style="margin:0">👥 선배들은 어떻게 했을까?</h2>
        <span class="tag ${same ? "" : "gray"}">나와 같은 선택 ${same}/${card.feedback.length}</span></div>
      <p class="muted small">내 선택: <b>${letter(mine)}번</b> ${esc(card.choices[mine].text)}</p>
      ${card.feedback.map((f) => {
        const s = seniorOf(f), lk = SENIOR_LOOK[f.senior];
        return `<div class="senior-fb">${lk ? portrait(LOOKS[lk], 44) : `<div class="portrait emoji">${s.emoji}</div>`}
          <div><span class="who">${esc(s.name)}</span> <span class="muted small">${esc(s.role)}</span>
          <span class="tag ${f.pick === mine ? "" : "gray"}">${letter(f.pick)}번 선택</span><div>${esc(f.text)}</div></div></div>`;
      }).join("")}
      <div class="insight"><strong>💡 판단 근거 (우리 회사 암묵지)</strong><br/>${esc(card.insight)}</div>
      <div class="row" style="justify-content:space-between;margin-top:14px">
        <button class="btn soft" id="fask">🙋 더 물어보기</button>
        <button class="btn" id="fok">${g().failKey ? "결과 보기 →" : "계속하기 ▶"}</button>
      </div>`);
    p.querySelector("#fask").addEventListener("click", () => openAsk(card));
    p.querySelector("#fok").addEventListener("click", () => {
      closePanel();
      if (g().failKey) { g().phase = "ending"; save(); showEnding(); }
      else updateHUD();
    });
  }

  function showDayIntro() {
    const gm = g(), d = DAYS[gm.day - 1];
    player.x = 3 * T; player.y = 15.8 * T; player.dir = "up";
    const p = panel(`
      <div class="day-intro"><div class="muted">Day ${d.day} / ${DAYS.length}</div><div class="big">${d.label}</div>
      <h2>${d.title}</h2><p class="muted">${d.sub} · 오늘의 상황 ${dayCards().length}개</p>
      <button class="btn" id="dgo">출근하기 ☀️</button></div>`, "intro");
    p.querySelector("#dgo").addEventListener("click", () => { gm.phase = "play"; save(); closePanel(); updateHUD(); });
  }

  function showRetro() {
    const gm = g(), d = DAYS[gm.day - 1], r = RETRO[gm.day] || RETRO[5], s = SENIORS[r.senior];
    const todays = gm.history.filter((h) => h.day === gm.day), match = todays.filter((h) => h.choice === h.best).length;
    const revealed = gm.revealed[gm.day];
    updateHUD();
    const p = panel(`
      <span class="tag amber">🌙 퇴근 회고 · ${d.label}</span>
      <h2 style="margin-top:10px">오늘 하루 수고했어요</h2>
      <p class="muted small">오늘 ${todays.length}개 상황 중 ${match}개에서 선배 다수와 같은 선택을 했어요.</p>
      <label>✏️ ${esc(r.q)}</label>
      <textarea id="rt" placeholder="나라면…" ${revealed ? "disabled" : ""}>${esc(gm.retro[gm.day] || "")}</textarea>
      ${revealed ? `<div class="senior-fb" style="margin-top:12px">${portrait(LOOKS[SENIOR_LOOK[r.senior]], 44)}
          <div><span class="who">${s.name}</span> <span class="muted small">${s.role}</span><div>${esc(r.tip)}</div></div></div>
        <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" id="rnext">${gm.day >= DAYS.length ? "🏁 100일 엔딩 보기" : "집에 가서 쉬기 →"}</button></div>`
      : `<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" id="rrev">작성하고 선배 팁 보기</button></div>`}`, "night");
    if (!revealed) p.querySelector("#rrev").addEventListener("click", () => {
      const t = p.querySelector("#rt").value.trim();
      if (t.length < 5) return toast("한두 문장이라도 적어보세요 ✍️");
      gm.retro[gm.day] = t; gm.revealed[gm.day] = true; save(); showRetro();
    });
    else p.querySelector("#rnext").addEventListener("click", () => {
      if (gm.day >= DAYS.length) { gm.phase = "ending"; save(); return showEnding(); }
      gm.day++; gm.idx = 0; gm.gauges.hp = clamp(gm.gauges.hp + 10); gm.phase = "dayIntro"; save();
      toast("🔋 푹 쉬고 왔어요. 체력 +10"); updateHUD(); showDayIntro();
    });
  }

  function showEnding() {
    const gm = g(), e = endingOf(gm);
    if (!gm.counted) {
      gm.counted = true; S.stats.endings[e.key] = (S.stats.endings[e.key] || 0) + 1;
      if (!e.fail) S.stats.completed++; save();
    }
    updateHUD();
    const match = gm.history.filter((h) => h.choice === h.best).length;
    const retros = Object.entries(gm.retro);
    const p = panel(`
      <div class="ending-card ${e.fail ? "fail" : ""}">
        ${portrait(look(), 72)}
        <div class="emoji">${e.emoji}</div>
        <div style="opacity:.85">${esc(gm.name)}의 ${e.fail ? DAYS[gm.day - 1].label + "에서 멈춘 기록" : "100일 성장 유형"}</div>
        <h1>${e.title}</h1><p style="opacity:.92;margin:0">${e.desc}</p>
      </div>
      <div class="grid4" style="margin:14px 0">${GAUGES.map((x) => `<div class="kpi"><div class="l">${x.icon} ${x.label}</div><div class="v">${gm.gauges[x.key]}</div></div>`).join("")}</div>
      <p>🎯 선배 다수와 같은 선택 <b>${match} / ${gm.history.length}</b>개</p>
      ${retros.length ? `<h3>📔 나의 퇴근 회고</h3>${retros.map(([d, t]) => `<p class="small"><span class="tag gray">${DAYS[d - 1].label}</span> ${esc(t)}</p>`).join("")}` : ""}
      ${e.fail ? `<div class="insight"><strong>다시 도전할 때 팁</strong><br/>${esc(failTip(gm.failKey))}</div>` : ""}
      <div class="row" style="margin-top:14px">
        <button class="btn" id="eshare">📣 동기 피드에 공유</button>
        <button class="btn soft" id="esenior">✍️ 다음 신입에게 경험 남기기</button>
        <button class="btn ghost" id="eagain">↺ 처음부터 다시</button>
      </div>`, "night");
    p.querySelector("#eshare").addEventListener("click", () => {
      S.posts.push({ id: "p" + Date.now(), ch: "peers", author: gm.name, time: Date.now(),
        text: `${e.emoji} 100일 생존기 결과: [${e.title}] 나왔어! 선배들과 같은 선택 ${match}/${gm.history.length}개. 너희는?`, replies: [] });
      save(); S.channel = "peers"; toast("동기방에 공유했어요"); go("community");
    });
    p.querySelector("#esenior").addEventListener("click", () => { S.seniorPrefill = gm.retro[5] || ""; go("senior"); });
    p.querySelector("#eagain").addEventListener("click", () => { S.game = null; save(); render(); });
  }

  return { mount, drawPerson, _player: player, _press: press };
})();
