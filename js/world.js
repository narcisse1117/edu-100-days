// =============================================================
// 공통 월드 데이터 — 2D/3D가 같은 사무실 배치를 공유 (단위: 타일 = 1m)
// x: 왼→오른쪽(0~30), y: 위→아래(0~18). 3D에서는 y가 z축이 됨
// =============================================================

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
const SENIOR_LOOK = { jihoon: "jihoon", seoyeon: "seoyeon", doyoon: "doyoon", mina: "mina" };

// x, y = 2D 발 위치 / ix, iy = 2D 말 거는 지점 / p3 = 3D 배치(의자 · 방향)
const NPCS = [
  { id: "jungmin", name: "정민 선임", role: "사수 · 채용 운영", x: 14.5, y: 9.95, dir: "up", look: "jungmin",
    p3: { x: 14.5, z: 9.55, rot: Math.PI, seat: "s14", ix: 14.5, iz: 10.3 },
    idle: ["모르는 건 메신저로 편하게 물어봐요!", "우리 팀은 '오늘 중'이면 보통 6시 전이에요. 근데 물어보는 게 제일 확실해요 😉"] },
  { id: "jihoon", name: "김지훈 책임", role: "채용 담당 · 8년차", x: 16.5, y: 7.35, dir: "down", look: "jihoon", iy: 6.3,
    p3: { x: 16.5, z: 6.45, rot: 0, seat: "n16", ix: 16.5, iz: 5.7 },
    idle: ["채용은 회사의 첫인상이에요.", "지원자한테는 '언제까지 연락드린다'만 꼭 지키면 돼요."] },
  { id: "seoyeon", name: "박서연 선임", role: "교육(HRD) · 5년차", x: 12.5, y: 7.35, dir: "down", look: "seoyeon", iy: 6.3,
    p3: { x: 12.5, z: 6.45, rot: 0, seat: "n12", ix: 12.5, iz: 5.7 },
    idle: ["교육 만족도는 숫자보다 주관식 의견이 진짜예요.", "점심 메뉴 고민되면 저한테 물어봐요 🍜"] },
  { id: "mina", name: "최민아 선임", role: "노무 · 조직문화 · 6년차", x: 17.5, y: 9.95, dir: "up", look: "mina",
    p3: { x: 17.5, z: 9.55, rot: Math.PI, seat: "s17", ix: 17.5, iz: 10.3 },
    idle: ["인사팀은 '말하지 않는 것'도 일이에요.", "메신저엔 이모지 하나가 톤을 바꿔요 :)"] },
  { id: "doyoon", name: "이도윤 팀장", role: "인사팀장 · 15년차", x: 24.5, y: 3.35, dir: "down", look: "doyoon", iy: 4.6,
    p3: { x: 24.5, z: 2.6, rot: 0, seat: "lead", ix: 24.5, iz: 4.6 },
    idle: ["보고는 결론부터. 나쁜 소식은 먼저.", "바쁘면 바쁘다고 말해줘요. 조용히 무너지는 게 제일 걱정이에요."] },
  { id: "peer", name: "한유진", role: "마케팅팀 입사 동기", x: 25.5, y: 14.4, dir: "left", look: "peer",
    p3: { x: 25.3, z: 13.6, rot: -Math.PI / 2, ix: 24.7, iz: 14.3 },
    idle: ["우리 동기방 들어왔지? 상단 💬 소통 공간 확인해봐!", "오늘 점심 뭐 먹지… 🤔"] },
  { id: "visitor", name: "강팀장", role: "영업팀장", x: 6.5, y: 14.8, dir: "right", look: "visitor", days: [4],
    p3: { x: 6.5, z: 14.4, rot: Math.PI / 2, ix: 7.3, iz: 14.5 },
    idle: ["인사팀 담당자 어디 계세요…?"] },
];
const OBJECTS = [
  { id: "mydesk", name: "내 자리", icon: "💻", x: 12.5, y: 10.1, r: 40, p3: { ix: 12.5, iz: 10.3, r: 1.2 },
    idle: "모니터에 포스트잇이 붙어 있다. '모르면 물어보기!'" },
  { id: "meeting", name: "회의실", icon: "🪑", x: 5, y: 6.6, r: 56, p3: { ix: 5.2, iz: 7.0, r: 1.5 }, idle: "비어 있는 회의실이다." },
  { id: "board", name: "선배 경험 게시판", icon: "📌", x: 21.1, y: 12.2, r: 40, p3: { ix: 21.1, iz: 12.2, r: 1.2 }, idle: null },
  { id: "coffee", name: "커피 머신", icon: "☕", x: 27.6, y: 11.6, r: 40, p3: { ix: 27.4, iz: 11.3, r: 1.2 }, idle: null },
  { id: "door", name: "출입문", icon: "🚪", x: 3, y: 16.4, r: 44, p3: { ix: 3, iz: 16.3, r: 1.3 }, idle: null },
];
const CARD_NPC = {
  c01: "jungmin", c02: "jungmin", c03: "peer",
  c04: "mydesk", c05: "doyoon", c06: "mydesk",
  c07: "doyoon", c08: "mydesk", c09: "meeting",
  c10: "peer", c11: "visitor", c12: "jihoon",
  c13: "jungmin", c14: "doyoon", c15: "meeting",
};
const CARD_SPEAKER = { c04: "📞 지원자의 전화", c06: "💻 메신저", c08: "📧 메일함" };

// 충돌 영역 [x, y, w, h]
const SOLIDS = [
  [0, 0, 30, 2], [0, 0, 1, 18], [29, 0, 1, 18], [0, 17, 30, 1],
  [9, 2, 0.25, 6.25], [1, 8, 4, 0.25], [6, 8, 3.25, 0.25],
  [3, 4, 4, 2], [11, 7, 8, 2], [23, 3, 3, 1], [19, 2, 2, 0.9], [20.1, 7.2, 0.8, 0.7],
  [28, 10, 1, 3.5], [23, 13, 1.4, 1], [21, 16, 3, 1], [20.6, 11.2, 1, 0.5],
  [9.6, 2.2, 0.8, 0.6], [27.6, 6.3, 0.8, 0.6], [1.2, 15.6, 0.8, 0.6], [19.2, 15.6, 0.8, 0.6],
];

const World = {
  g: () => S.game,
  dayCards: () => cardsForDay(S.game.day),
  curCard: () => cardsForDay(S.game.day)[S.game.idx],
  targetOf(card) { return card ? CARD_NPC[card.id] || (card.custom ? "board" : "jungmin") : "door"; },
  // 현재 퀘스트 대상 (플레이 중이 아니면 null)
  target() {
    const g = S.game; if (!g || g.phase !== "play") return null;
    return this.targetOf(this.curCard());
  },
  visibleNpcs() {
    const g = S.game, t = this.target();
    return NPCS.filter((n) => !n.days || n.days.includes(g.day) || t === n.id);
  },
  find(id) { return NPCS.find((n) => n.id === id) || OBJECTS.find((o) => o.id === id); },
  nameOf(id) { const f = this.find(id); return f ? f.name : id; },
  hit(box, solids) {
    return solids.some((s) => box[0] < s[0] + s[2] && box[0] + box[2] > s[0] && box[1] < s[1] + s[3] && box[1] + box[3] > s[1]);
  },
};
