// =============================================================
// 신입 100일 생존기 — 앱 로직 (서버 없이 브라우저 localStorage에 저장)
// =============================================================

// ---------- 저장소 ----------
const LS = {
  get(k, d) {
    try { const v = localStorage.getItem("s100_" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; }
  },
  set(k, v) {
    try { localStorage.setItem("s100_" + k, JSON.stringify(v)); } catch (e) {}
  },
  clear() {
    try { Object.keys(localStorage).filter((k) => k.startsWith("s100_")).forEach((k) => localStorage.removeItem(k)); } catch (e) {}
  },
};

const S = {
  view: "home",
  channel: "peers",
  game: LS.get("game", null),
  posts: LS.get("posts", null),
  customCards: LS.get("customCards", []),
  disabled: LS.get("disabled", []),
  stats: LS.get("stats", null),
  suggestions: LS.get("suggestions", []),
  writer: LS.get("writer", ""),
  seniorName: LS.get("seniorName", ""),
  seniorPrefill: "",
  mode: LS.get("mode", "3d"),
};

if (!S.posts) {
  S.posts = SEED_POSTS.map((p, i) => ({ ...p, id: "seed" + i, time: Date.now() - (SEED_POSTS.length - i) * 3600e3 }));
  LS.set("posts", S.posts);
}
if (!S.stats) { S.stats = seedStats(); LS.set("stats", S.stats); }

function save() {
  LS.set("game", S.game); LS.set("posts", S.posts); LS.set("customCards", S.customCards);
  LS.set("disabled", S.disabled); LS.set("stats", S.stats); LS.set("suggestions", S.suggestions);
  LS.set("writer", S.writer); LS.set("seniorName", S.seniorName);
}

// HRD 대시보드가 비어 보이지 않도록 넣는 시연용 데이터 (HRD 화면에서 지울 수 있음)
function seedStats() {
  const demo = {
    c01: [6, 14, 4], c02: [11, 9, 4], c03: [5, 16, 3], c04: [7, 13, 4], c05: [9, 10, 5],
    c06: [6, 15, 3], c07: [8, 7, 9], c08: [3, 18, 3], c09: [9, 12, 3], c10: [2, 20, 2],
    c11: [5, 12, 4], c12: [10, 8, 3], c13: [4, 12, 5], c14: [3, 15, 3], c15: [5, 14, 2],
  };
  const asks = { c02: 6, c05: 4, c07: 7, c11: 5, c12: 6, c10: 2, c04: 3 };
  const plays = {};
  Object.keys(demo).forEach((k) => (plays[k] = demo[k].reduce((a, b) => a + b, 0)));
  return {
    demo: true, learners: 24, completed: 21,
    endings: { "s-all": 5, "s-trust": 4, "s-peer": 6, "s-perf": 3, "s-hp": 1, "f-hp": 2, "f-peer": 1 },
    choices: demo, asks, plays,
  };
}

// ---------- 유틸 ----------
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clamp = (v) => Math.max(0, Math.min(100, v));
const LETTERS = ["A", "B", "C", "D"];
const GCOLOR = { trust: "var(--g-trust)", peer: "var(--g-peer)", perf: "var(--g-perf)", hp: "var(--g-hp)" };

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.add("hidden"), 2600);
}
function openModal(html) { $("#modal-box").innerHTML = html; $("#modal").classList.remove("hidden"); }
function closeModal() { $("#modal").classList.add("hidden"); }
$("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });

function timeAgo(t) {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return "방금"; if (m < 60) return m + "분 전";
  const h = Math.floor(m / 60); if (h < 24) return h + "시간 전";
  return Math.floor(h / 24) + "일 전";
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const allCards = () => CARDS.concat(S.customCards);
const activeCards = () => allCards().filter((c) => !S.disabled.includes(c.id));
const cardsForDay = (d) => activeCards().filter((c) => c.day === d);
const findCard = (id) => allCards().find((c) => c.id === id);
const seniorOf = (fb) => SENIORS[fb.senior] || { name: fb.seniorName || "익명의 선배", role: fb.seniorRole || "인사팀 선배", emoji: "🧑‍🏫" };

// ---------- 라우팅 ----------
function go(view) { S.view = view; render(); window.scrollTo(0, 0); }
document.querySelectorAll("[data-nav]").forEach((el) => el.addEventListener("click", () => go(el.dataset.nav)));

function render() {
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("active", b.dataset.nav === S.view));
  const app = $("#app");
  ({ home: renderHome, game: renderGame, community: renderCommunity, senior: renderSenior, hrd: renderHRD }[S.view] || renderHome)(app);
}

// =============================================================
// 홈
// =============================================================
function renderHome(app) {
  const g = S.game;
  app.innerHTML = `
    <section class="hero">
      <span class="tag" style="background:rgba(255,255,255,.2);color:#fff">에듀링크 · 교육공학 프로젝트</span>
      <h1 style="margin-top:12px">AI가 알려주지 않는<br/>'우리 회사'의 암묵지</h1>
      <p>${COMPANY.name} ${COMPANY.team}에 막 입사한 당신.<br/>선배들의 실제 경험으로 만든 상황 카드로 첫 100일을 미리 살아보세요.</p>
      <div class="row">
        <button class="btn" data-go="game">${g && g.phase !== "ending" ? "▶ 이어하기 (" + DAYS[g.day - 1].label + ")" : "🎮 생존기 시작하기"}</button>
        <button class="btn ghost" data-go="community">💬 소통 공간 둘러보기</button>
      </div>
    </section>

    <div class="grid2">
      <div class="card role-card" data-go="game">
        <div class="emoji">🧑‍💻</div><h3>신입사원</h3>
        <p class="muted small">하루 3~4개 상황 카드에 대응하고, 여러 시니어의 판단 근거와 비교하며, 퇴근 회고로 정리해요.</p>
      </div>
      <div class="card role-card" data-go="senior">
        <div class="emoji">✍️</div><h3>시니어 (선배 · 팀장)</h3>
        <p class="muted small">4가지 질문, 5분 템플릿으로 경험을 등록하면 그대로 게임 속 상황 카드가 됩니다.</p>
      </div>
      <div class="card role-card" data-go="hrd">
        <div class="emoji">📊</div><h3>HRD 담당자</h3>
        <p class="muted small">신입들의 선택 데이터로 자주 막히는 상황을 파악하고, 교육과 멘토링을 보완해요.</p>
      </div>
      <div class="card role-card" data-go="community">
        <div class="emoji">💬</div><h3>직원 간 소통 공간</h3>
        <p class="muted small">동기 · 선배 · 팀장과의 대화, 부담 없는 익명 질문방. 좋은 질문은 새 상황 카드가 돼요.</p>
      </div>
    </div>

    <div class="card">
      <h3>🏢 가상 기업 프로필</h3>
      <div class="grid4 small">
        <div><b>기업</b><br/>${COMPANY.name} (가칭)</div>
        <div><b>업종</b><br/>${COMPANY.desc}</div>
        <div><b>조직</b><br/>${COMPANY.team}</div>
        <div><b>문화</b><br/>${COMPANY.culture}</div>
      </div>
    </div>`;
  app.querySelectorAll("[data-go]").forEach((el) => el.addEventListener("click", () => go(el.dataset.go)));
}

// =============================================================
// 게임: 신입 100일 생존기
// =============================================================
function renderGame(app) {
  if (!S.game) return renderAvatar(app);
  use3D() ? Game3D.mount(app) : Game2D.mount(app);
}
const use3D = () => S.mode !== "2d" && typeof Game3D !== "undefined" && Game3D.supported;

function orderOf(card) {
  const g = S.game;
  if (!g.order[card.id] || g.order[card.id].length !== card.choices.length) g.order[card.id] = shuffle(card.choices.map((_, i) => i));
  return g.order[card.id];
}

const LOOK_OPTS = {
  style: [["short", "짧은 머리"], ["long", "긴 머리"], ["bun", "똥머리"]],
  hair: ["#2b2b33", "#5a3825", "#8a5a3b", "#c9a15a", "#b04a4a"],
  shirt: ["#3f8a68", "#5b8def", "#f29bb5", "#f7c548", "#f4f4f4", "#7a5cc2"],
  skin: ["#f8dcc0", "#f5d0ad", "#e3b38a", "#c48c63"],
};

function renderAvatar(app) {
  const lk = { ...DEFAULT_LOOK, ...(LS.get("look", {})) };
  const sw = (key, vals) => vals.map((v) => `<button class="sw ${lk[key] === v ? "sel" : ""}" data-key="${key}" data-v="${v}" style="background:${v}"></button>`).join("");
  app.innerHTML = `
    <div class="card" style="max-width:640px;margin:0 auto">
      <span class="tag">STEP 1 · 캐릭터 만들기</span>
      <h2 style="margin-top:10px">입사를 축하합니다! 🎉</h2>
      <p class="muted">${COMPANY.name} ${COMPANY.team}의 신입사원이 되었어요. 사무실을 돌아다니며 선배들과 부딪히는 100일을 살아보세요.</p>
      <div class="maker">
        <div class="preview ${use3D() ? "p3d" : ""}" id="pvbox">${use3D() ? "" : '<canvas id="pv" width="120" height="150"></canvas>'}</div>
        <div style="flex:1;min-width:220px">
          <label style="margin-top:0">이름</label>
          <input id="nm" maxlength="8" placeholder="예: 김신입" value="${esc(S.writer)}" />
          <label>헤어</label>
          <div class="row">${LOOK_OPTS.style.map(([v, t]) => `<button class="btn small ${lk.style === v ? "" : "ghost"}" data-key="style" data-v="${v}">${t}</button>`).join("")}</div>
          <label>머리 색</label><div class="row">${sw("hair", LOOK_OPTS.hair)}</div>
          <label>옷 색</label><div class="row">${sw("shirt", LOOK_OPTS.shirt)}</div>
          <label>피부 톤</label><div class="row">${sw("skin", LOOK_OPTS.skin)}</div>
        </div>
      </div>
      <div class="card" style="background:var(--bg);box-shadow:none;margin-top:18px">
        <h3>📏 4대 밸런스 지표</h3>
        ${GAUGES.map((x) => `<div class="small">${x.icon} <b>${x.label}</b> <span class="muted">${x.desc}</span></div>`).join("")}
        <p class="small" style="margin:8px 0 0;color:var(--danger)">⚠ 하나라도 0이 되면 번아웃 · 고립 엔딩!</p>
      </div>
      <button class="btn" id="start" style="width:100%;margin-top:6px">입사하기 →</button>
    </div>`;
  if (use3D()) Game3D.preview($("#pvbox"), lk);
  else (function () {
  const pv = $("#pv"), pc = pv.getContext("2d");
  let t = 0, dirs = ["down", "left", "up", "right"];
  (function anim() {
    if (!document.body.contains(pv)) return;
    t++; pc.clearRect(0, 0, 120, 150); pc.imageSmoothingEnabled = false;
    pc.save(); pc.translate(60, 138); pc.scale(3, 3);
    Game2D.drawPerson(pc, 0, 0, lk, dirs[Math.floor(t / 90) % 4], [0, 1, 0, 2][Math.floor(t / 10) % 4]);
    pc.restore(); requestAnimationFrame(anim);
  })();
  })();
  app.querySelectorAll("[data-key]").forEach((b) => b.addEventListener("click", () => {
    lk[b.dataset.key] = b.dataset.v; LS.set("look", lk); S.writer = $("#nm").value.trim(); renderAvatar(app);
  }));
  $("#start").addEventListener("click", () => {
    const name = $("#nm").value.trim() || "김신입";
    S.writer = name; LS.set("look", lk);
    S.game = { name, look: { ...lk }, day: 1, idx: 0, gauges: { ...START_GAUGES }, phase: "dayIntro",
      order: {}, history: [], retro: {}, revealed: {}, last: null, failKey: null, counted: false };
    S.stats.learners++;
    save(); render();
  });
}

function endingOf(g) {
  if (g.failKey) return { key: "f-" + g.failKey, fail: true, ...ENDINGS.fail[g.failKey] };
  const v = g.gauges;
  if (GAUGES.every((x) => v[x.key] >= 60)) return { key: "s-all", ...ENDINGS.success.all };
  const top = GAUGES.slice().sort((a, b) => v[b.key] - v[a.key])[0].key;
  return { key: "s-" + top, ...ENDINGS.success[top] };
}

function failTip(k) {
  return {
    trust: "보고는 '빨리, 결론 먼저, 나쁜 소식일수록 먼저'. 중간 공유만 잘해도 신뢰는 쌓여요.",
    peer: "혼자 끙끙대지 말고, 짧게라도 공유하고 물어보세요. 관계는 작은 메시지에서 시작돼요.",
    perf: "확인 없이 약속하거나 여러 일을 동시에 벌이면 결과물이 흔들려요. 우선순위를 먼저 정하세요.",
    hp: "'No'가 아니라 '지금 하는 일 + 가능한 시점'으로 답하는 연습을 해보세요. 체력도 자원이에요.",
  }[k];
}

// ---------- 선배에게 물어보기 (게임 ↔ 소통 공간 연결) ----------
function openAsk(card) {
  openModal(`
    <h3>🙋 선배에게 물어보기</h3>
    <p class="muted small"><span class="card-ref">🃏 ${esc(card.title)}</span> 상황에서 궁금한 점을 남기면 선배들이 답해줘요.</p>
    <label>어디에 물어볼까요?</label>
    <select id="ach"><option value="ask">🙋 선배에게 묻기 (이름 공개)</option><option value="anon">🎭 익명 질문방</option></select>
    <label>질문</label>
    <textarea id="aq" placeholder="예: 이런 상황에서 팀장님께 먼저 말씀드려야 할까요, 사수에게 먼저 물어봐야 할까요?"></textarea>
    <div class="row" style="justify-content:flex-end;margin-top:14px">
      <button class="btn ghost" id="ac">취소</button><button class="btn" id="as">질문 올리기</button>
    </div>`);
  $("#ac").addEventListener("click", closeModal);
  $("#as").addEventListener("click", () => {
    const text = $("#aq").value.trim(), ch = $("#ach").value;
    if (!text) return toast("질문을 입력해 주세요");
    const post = { id: "p" + Date.now(), ch, author: ch === "anon" ? "익명" : (S.game ? S.game.name : S.writer || "신입"),
      text, cardRef: card.id, time: Date.now(), replies: [] };
    S.posts.push(post);
    S.stats.asks[card.id] = (S.stats.asks[card.id] || 0) + 1;
    save(); closeModal(); toast("질문을 올렸어요. 선배 답변을 기다려요…");
    autoReply(post, card);
  });
}

// 프로토타입: 카드에 등록된 선배 경험을 바탕으로 자동 답변을 시뮬레이션
function autoReply(post, card) {
  setTimeout(() => {
    const fb = card.feedback[Math.floor(Math.random() * card.feedback.length)];
    const s = seniorOf(fb);
    post.replies.push({ author: post.ch === "anon" ? "익명의 선배" : s.name, senior: post.ch !== "anon",
      text: `좋은 질문이에요! 제 경험으로는… ${fb.text} 정리하면, ${card.insight}` });
    save(); toast(`💬 ${post.ch === "anon" ? "익명의 선배" : s.name}가 답변했어요`);
    if (S.view === "community") render();
  }, 2500);
}

// =============================================================
// 소통 공간
// =============================================================
function renderCommunity(app) {
  const ch = CHANNELS.find((c) => c.id === S.channel);
  const posts = S.posts.filter((p) => p.ch === S.channel).slice().reverse();
  const anon = S.channel === "anon";
  app.innerHTML = `
    <h2>💬 직원 간 소통 공간</h2>
    <p class="muted small" style="margin-top:-6px">동기 · 선배 · 팀장과의 대화 (SECI: 공동화). 좋은 질문과 답변은 새 상황 카드로 이어져요.</p>
    <div class="comm">
      <div class="card channels" style="padding:10px">
        ${CHANNELS.map((c) => `<button data-ch="${c.id}" class="${c.id === S.channel ? "active" : ""}">${c.icon} ${c.name}
          <small>${c.desc} · ${S.posts.filter((p) => p.ch === c.id).length}</small></button>`).join("")}
      </div>
      <div>
        <div class="card">
          <h3>${ch.icon} ${ch.name}</h3>
          ${anon ? '<p class="muted small">🎭 이 방의 글은 이름 없이 올라가요.</p>' : `<label style="margin-top:0">작성자</label><input id="wr" value="${esc(S.writer)}" placeholder="이름" maxlength="20" />`}
          <textarea id="pt" placeholder="${anon ? "누구에게도 묻기 어려웠던 것, 편하게 물어보세요" : "메시지를 남겨보세요"}" style="margin-top:10px"></textarea>
          <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" id="post">올리기</button></div>
        </div>
        <div class="card">
          ${posts.length ? posts.map(postHTML).join("") : '<p class="muted">아직 글이 없어요. 첫 글을 남겨보세요!</p>'}
        </div>
      </div>
    </div>`;
  app.querySelectorAll("[data-ch]").forEach((b) => b.addEventListener("click", () => { S.channel = b.dataset.ch; render(); }));
  $("#post").addEventListener("click", () => {
    const text = $("#pt").value.trim(); if (!text) return;
    if (!anon) { S.writer = $("#wr").value.trim() || "신입"; }
    S.posts.push({ id: "p" + Date.now(), ch: S.channel, author: anon ? "익명" : S.writer, text, time: Date.now(), replies: [] });
    save(); render();
  });
  app.querySelectorAll("[data-reply]").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.reply, inp = document.getElementById("r-" + id), t = inp.value.trim(); if (!t) return;
    const p = S.posts.find((x) => x.id === id);
    p.replies.push({ author: anon ? "익명" : (($("#wr") && $("#wr").value.trim()) || S.writer || "신입"), text: t });
    save(); render();
  }));
  app.querySelectorAll("[data-suggest]").forEach((b) => b.addEventListener("click", () => {
    const p = S.posts.find((x) => x.id === b.dataset.suggest);
    if (S.suggestions.some((s) => s.postId === p.id)) return toast("이미 제안된 질문이에요");
    S.suggestions.push({ postId: p.id, text: p.text, ch: p.ch, time: Date.now(), done: false });
    save(); toast("🃏 HRD · 시니어에게 상황 카드 후보로 전달했어요");
  }));
}

function postHTML(p) {
  const card = p.cardRef && findCard(p.cardRef);
  return `<div class="post">
    <div class="meta"><span class="author ${p.senior ? "senior" : ""}">${esc(p.author)}</span> · ${timeAgo(p.time)}
      ${card ? ` · <span class="card-ref">🃏 ${esc(card.title)}</span>` : ""}</div>
    <div style="margin:4px 0">${esc(p.text)}</div>
    ${p.replies.map((r) => `<div class="reply"><span class="author ${r.senior ? "senior" : ""}" style="font-weight:800">${esc(r.author)}</span> ${esc(r.text)}</div>`).join("")}
    <div class="row" style="margin-top:8px">
      <input id="r-${p.id}" placeholder="답글 달기" style="flex:1;min-width:160px;padding:7px 10px" />
      <button class="btn small soft" data-reply="${p.id}">답글</button>
      <button class="btn small ghost" data-suggest="${p.id}" title="좋은 질문을 새 상황 카드 후보로 제안">🃏 카드로 제안</button>
    </div>
  </div>`;
}

// =============================================================
// 시니어: 5분 경험 등록 템플릿
// =============================================================
function renderSenior(app) {
  const mine = S.customCards.filter((c) => S.seniorName && c.author === S.seniorName);
  const learners = mine.reduce((a, c) => a + (S.stats.plays[c.id] || 0), 0);
  const replies = S.posts.reduce((a, p) => a + p.replies.filter((r) => S.seniorName && r.author === S.seniorName).length, 0);
  const badges = [
    { ok: mine.length >= 1, t: "🌱 첫 경험 나눔" },
    { ok: mine.length >= 3, t: "📚 경험 부자 (3건)" },
    { ok: learners >= 10, t: "🎓 신입 10명 학습" },
    { ok: replies >= 3, t: "💬 답변 선배 (3회)" },
  ];
  const openSug = S.suggestions.filter((s) => !s.done);
  app.innerHTML = `
    <h2>✍️ 시니어 경험 등록</h2>
    <p class="muted small" style="margin-top:-6px">4가지 질문, 5분이면 완성. 시니어의 경험이 그대로 게임 콘텐츠가 됩니다. (SECI: 표출화)</p>
    <div class="grid2">
      <div class="card">
        <h3>🏅 나의 기여</h3>
        <label style="margin-top:0">내 이름</label>
        <input id="sn" placeholder="예: 홍길동 선임" value="${esc(S.seniorName)}" />
        <div class="grid4" style="margin-top:12px">
          <div class="kpi"><div class="v">${mine.length}</div><div class="l">등록한 경험</div></div>
          <div class="kpi"><div class="v">${learners}</div><div class="l">내 사례로 학습한 신입</div></div>
        </div>
        <div style="margin-top:10px">${badges.map((b) => `<span class="badge ${b.ok ? "" : "locked"}">${b.t}</span>`).join("")}</div>
        ${mine.length ? `<div style="margin-top:12px">${mine.map((c) => `<div class="small">🃏 ${esc(c.title)} <span class="muted">· ${DAYS[c.day - 1].label} · 학습 ${S.stats.plays[c.id] || 0}명</span></div>`).join("")}</div>` : ""}
      </div>
      <div class="card">
        <h3>📥 신입들이 궁금해하는 상황</h3>
        <p class="muted small">소통 공간에서 '카드로 제안'된 질문이에요. 클릭하면 템플릿에 채워져요.</p>
        ${openSug.length ? openSug.map((s, i) => `<button class="choice small" data-sug="${i}">💭 ${esc(s.text)}</button>`).join("") : '<p class="muted small">아직 제안된 질문이 없어요.</p>'}
      </div>
    </div>

    <div class="card">
      <div class="row" style="justify-content:space-between"><h3 style="margin:0">⏱️ 5분 템플릿</h3><span class="tag amber">4 PROCESS · 5 MIN</span></div>
      <div class="grid2" style="margin-top:10px">
        <div><label>상황 제목</label><input id="t-title" placeholder="예: 첫 급여 정산 오류 문의" maxlength="30"/></div>
        <div class="row" style="gap:10px;flex-wrap:nowrap">
          <div style="flex:1"><label>어느 시기?</label><select id="t-day">${DAYS.map((d) => `<option value="${d.day}">${d.label} ${d.title}</option>`).join("")}</select></div>
          <div style="flex:1"><label>분야</label><select id="t-cat">${["채용", "교육(HRD)", "평가 · 보상", "노무 · 조직문화", "보고", "우선순위", "관계 형성", "소통"].map((c) => `<option>${c}</option>`).join("")}</select></div>
        </div>
      </div>
      <div class="template-q" style="margin-top:14px"><span class="num">1</span><b>신입 때 가장 당황했던 순간은?</b> <span class="muted small">→ 상황 카드 지문</span>
        <textarea id="t-q1" placeholder="언제, 어디서, 누구와 어떤 일이 있었나요?">${esc(S.seniorPrefill)}</textarea></div>
      <div class="template-q"><span class="num">2</span><b>그때 실제로 어떻게 행동했나요?</b> <span class="muted small">→ 선택지 + 시니어 피드백</span>
        <textarea id="t-q2" placeholder="구체적인 행동으로 적어주세요"></textarea>
        <details style="margin-top:8px"><summary class="small muted">신입이 흔히 하는 다른 대응 (선택지로 쓰여요, 선택 사항)</summary>
          <input id="t-alt1" placeholder="예: 혼자 해결하려다 시간을 넘긴다" style="margin-top:8px"/>
          <input id="t-alt2" placeholder="예: 바로 팀장님께 가져간다" style="margin-top:8px"/>
        </details></div>
      <div class="template-q"><span class="num">3</span><b>왜 그렇게 했나요? 무엇을 보고 판단했나요?</b> <span class="muted small">→ 피드백의 핵심</span>
        <textarea id="t-q3" placeholder="판단의 근거, 당시 보았던 신호"></textarea></div>
      <div class="template-q"><span class="num">4</span><b>지금 신입에게 해주고 싶은 조언은?</b> <span class="muted small">→ 퇴근 회고의 선배 팁</span>
        <textarea id="t-q4" placeholder="한두 문장이면 충분해요"></textarea></div>
      <div class="row" style="justify-content:space-between">
        <span class="muted small">💡 바쁘다면 HRD 담당자가 인터뷰 후 대신 입력할 수도 있어요.</span>
        <button class="btn" id="t-save">경험 등록 → 상황 카드 만들기</button>
      </div>
    </div>`;
  S.seniorPrefill = "";
  $("#sn").addEventListener("input", (e) => { S.seniorName = e.target.value.trim(); save(); });
  app.querySelectorAll("[data-sug]").forEach((b) => b.addEventListener("click", () => {
    const s = openSug[+b.dataset.sug]; $("#t-q1").value = "신입들의 질문: " + s.text + "\n\n제 경험은… "; $("#t-q1").focus();
    $("#t-q1").dataset.sug = s.postId;
  }));
  $("#t-save").addEventListener("click", () => {
    const v = (id) => $("#" + id).value.trim();
    const name = v("sn"); if (!name) return toast("내 이름을 먼저 입력해 주세요");
    if (!v("t-q1") || !v("t-q2") || !v("t-q3") || !v("t-q4")) return toast("4가지 질문에 모두 답해 주세요");
    S.seniorName = name;
    const card = {
      id: "u" + Date.now(), custom: true, author: name, day: +v("t-day"), category: v("t-cat"),
      title: v("t-title") || v("t-q1").slice(0, 18) + "…",
      text: v("t-q1"),
      choices: [
        { text: v("t-q2"), effects: [10, 5, 10, -5], result: "선배가 실제로 했던 방법이에요. 상황이 잘 풀렸어요." },
        { text: v("t-alt1") || "혼자 해결해 보려고 일단 버틴다", effects: [-5, -5, -5, -10], result: "시간은 흘렀고, 결국 다른 사람이 수습해야 했다." },
        { text: v("t-alt2") || "누군가 알려줄 때까지 기다린다", effects: [-10, 0, -5, 0], result: "아무도 먼저 알려주지 않았다." },
      ],
      best: 0,
      feedback: [{ seniorName: name, seniorRole: "인사팀 선배 (등록 경험)", pick: 0, text: v("t-q3") }],
      insight: v("t-q4"),
    };
    S.customCards.push(card);
    const sugId = $("#t-q1").dataset.sug;
    if (sugId) { const s = S.suggestions.find((x) => x.postId === sugId); if (s) s.done = true; }
    save();
    openModal(`
      <h3>🎉 상황 카드가 만들어졌어요!</h3>
      <p class="muted small">${DAYS[card.day - 1].label} 상황 카드에 추가되어 신입들이 바로 학습할 수 있어요.</p>
      <div class="card" style="box-shadow:none">
        <span class="tag">${esc(card.category)}</span> <span class="tag amber">선배 등록 카드</span>
        <h3 style="margin-top:8px">${esc(card.title)}</h3>
        <p class="small">${esc(card.text)}</p>
        ${card.choices.map((c, i) => `<div class="small">• ${esc(c.text)} ${i === 0 ? '<span class="tag">선배의 실제 대응</span>' : ""}</div>`).join("")}
        <div class="insight small"><strong>💡 판단 근거</strong> ${esc(card.feedback[0].text)}<br/><strong>📌 선배 팁</strong> ${esc(card.insight)}</div>
      </div>
      <div class="row" style="justify-content:flex-end"><button class="btn" id="ok">확인</button></div>`);
    $("#ok").addEventListener("click", () => { closeModal(); render(); });
  });
}

// =============================================================
// HRD 대시보드
// =============================================================
function renderHRD(app) {
  const st = S.stats;
  const totalAsks = Object.values(st.asks).reduce((a, b) => a + b, 0);
  const endTotal = Object.values(st.endings).reduce((a, b) => a + b, 0) || 1;
  const endLabels = Object.entries(st.endings).sort((a, b) => b[1] - a[1]).map(([k, n]) => {
    const [t, g] = k.split("-"); const e = t === "s" ? ENDINGS.success[g] : ENDINGS.fail[g];
    return { name: `${e.emoji} ${e.title}`, n, fail: t === "f" };
  });
  const rows = allCards().map((c) => {
    const counts = st.choices[c.id] || c.choices.map(() => 0);
    const total = counts.reduce((a, b) => a + b, 0);
    const bestRate = total ? Math.round((counts[c.best] / total) * 100) : null;
    const asks = st.asks[c.id] || 0;
    const stuck = total && (bestRate < 50 || asks >= 5);
    return { c, counts, total, bestRate, asks, stuck };
  });
  const stuckRows = rows.filter((r) => r.stuck).sort((a, b) => a.bestRate - b.bestRate);
  const recentQ = S.posts.filter((p) => p.ch === "ask" || p.ch === "anon").slice(-5).reverse();
  const colors = ["#2f9e6b", "#c9ccd1", "#e8a33d", "#c2453d"];

  app.innerHTML = `
    <div class="row" style="justify-content:space-between">
      <div><h2 style="margin:0">📊 HRD 대시보드</h2><p class="muted small" style="margin:0">신입들의 선택 데이터로 자주 막히는 상황을 파악하고 교육 · 멘토링을 보완하세요.</p></div>
      <div class="row">${st.demo ? '<span class="tag amber">시연용 데모 데이터 포함</span>' : ""}
        <button class="btn small ghost" id="reset">데이터 초기화</button></div>
    </div>
    <div class="grid4" style="margin:16px 0">
      <div class="kpi"><div class="v">${st.learners}</div><div class="l">참여 신입</div></div>
      <div class="kpi"><div class="v">${st.completed}</div><div class="l">100일 완주</div></div>
      <div class="kpi"><div class="v">${activeCards().length}<span class="small muted"> / ${allCards().length}</span></div><div class="l">활성 상황 카드</div></div>
      <div class="kpi"><div class="v">${totalAsks}</div><div class="l">게임 중 '선배에게 물어보기'</div></div>
    </div>

    <div class="grid2">
      <div class="card">
        <h3>⚠️ 자주 막히는 상황</h3>
        <p class="muted small">선배 다수 선택과 일치율이 50% 미만이거나, 질문이 5건 이상인 카드</p>
        ${stuckRows.length ? stuckRows.map((r) => `<div class="hbar"><span class="name small">${esc(r.c.title)}</span>
          <span class="track"><i style="width:${r.bestRate}%;background:var(--danger)"></i></span><span class="n small">${r.bestRate}%</span></div>
          <div class="small muted" style="margin:-4px 0 8px">${esc(r.c.category)} · 질문 ${r.asks}건 → 멘토링 · 교육 보완 필요</div>`).join("") : '<p class="muted small">아직 없음</p>'}
      </div>
      <div class="card">
        <h3>🏁 엔딩 분포</h3>
        ${endLabels.map((e) => `<div class="hbar"><span class="name small">${e.name}</span>
          <span class="track"><i style="width:${(e.n / endTotal) * 100}%;background:${e.fail ? "var(--danger)" : "var(--primary)"}"></i></span><span class="n small">${e.n}</span></div>`).join("")}
      </div>
    </div>

    <div class="card" style="overflow-x:auto">
      <div class="row" style="justify-content:space-between"><h3 style="margin:0">🃏 상황 카드별 선택 데이터</h3>
        <div class="legend"><span style="--c:${colors[0]}">선배 다수 선택</span><span style="--c:${colors[1]}">다른 선택지</span><span style="--c:${colors[2]}">다른 선택지</span></div></div>
      <table style="margin-top:10px">
        <thead><tr><th>시기</th><th>상황</th><th>선택 분포</th><th>일치율</th><th>질문</th><th>상태</th></tr></thead>
        <tbody>${rows.map((r) => {
          const off = S.disabled.includes(r.c.id);
          const ord = [r.c.best].concat(r.c.choices.map((_, i) => i).filter((i) => i !== r.c.best));
          return `<tr style="${off ? "opacity:.45" : ""}">
            <td class="small">${DAYS[r.c.day - 1].label}</td>
            <td><b class="small">${esc(r.c.title)}</b><br/><span class="muted small">${esc(r.c.category)}${r.c.custom ? " · ✍️ " + esc(r.c.author) : ""}</span></td>
            <td>${r.total ? `<div class="stack" title="${ord.map((i) => r.counts[i] || 0).join(" / ")}">${ord.map((i, k) => `<i style="width:${((r.counts[i] || 0) / r.total) * 100}%;background:${colors[k]}"></i>`).join("")}</div><span class="muted small">${r.total}명</span>` : '<span class="muted small">데이터 없음</span>'}</td>
            <td>${r.bestRate === null ? "-" : `<span class="tag ${r.bestRate < 50 ? "red" : ""}">${r.bestRate}%</span>`}</td>
            <td class="small">${r.asks}</td>
            <td><button class="btn small ${off ? "soft" : "ghost"}" data-toggle="${r.c.id}">${off ? "비활성" : "활성"}</button></td>
          </tr>`;
        }).join("")}</tbody>
      </table>
    </div>

    <div class="grid2">
      <div class="card">
        <h3>🙋 최근 신입 질문</h3>
        ${recentQ.length ? recentQ.map((p) => `<div class="post small"><span class="author">${esc(p.author)}</span> <span class="muted">· ${timeAgo(p.time)}</span><br/>${esc(p.text)}</div>`).join("") : '<p class="muted small">없음</p>'}
      </div>
      <div class="card">
        <h3>🃏 상황 카드 후보 (소통 공간 제안)</h3>
        ${S.suggestions.length ? S.suggestions.slice().reverse().map((s) => `<div class="post small">${s.done ? '<span class="tag">카드화 완료</span>' : '<span class="tag amber">시니어 작성 대기</span>'} ${esc(s.text)}</div>`).join("") : '<p class="muted small">소통 공간에서 \'🃏 카드로 제안\'을 누르면 여기에 모여요.</p>'}
      </div>
    </div>`;

  app.querySelectorAll("[data-toggle]").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.toggle;
    S.disabled = S.disabled.includes(id) ? S.disabled.filter((x) => x !== id) : S.disabled.concat(id);
    save(); render();
  }));
  $("#reset").addEventListener("click", () => {
    openModal(`<h3>데이터 초기화</h3><p class="small">어떤 데이터를 지울까요?</p>
      <div class="row" style="margin-top:12px">
        <button class="btn soft" id="r1">통계만 비우기 (데모 제거)</button>
        <button class="btn warn" id="r2">전체 초기화</button>
        <button class="btn ghost" id="r3">취소</button></div>`);
    $("#r1").addEventListener("click", () => {
      S.stats = { demo: false, learners: 0, completed: 0, endings: {}, choices: {}, asks: {}, plays: {} };
      save(); closeModal(); render(); toast("통계를 비웠어요");
    });
    $("#r2").addEventListener("click", () => { LS.clear(); location.reload(); });
    $("#r3").addEventListener("click", closeModal);
  });
}

render();
