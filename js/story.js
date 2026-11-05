// =============================================================
// 공통 게임 진행 — 대화창 · 선택 · 피드백 · 회고 · 엔딩 · HUD · 효과음
// 렌더러(2D/3D)는 R 어댑터로 연결된다.
//   R.kind, R.portrait(look,size), R.nearest(), R.faceTo(target), R.onGain(delta),
//   R.shake(), R.resetPlayer(), R.onTalk(target, card), R.onTalkEnd(), R.sync()
// =============================================================
const Story = (() => {
  let R = null, mode = "walk", typer = null, dlgDone = null, choiceHandler = null;
  const keys = {};
  const g = () => S.game;
  const look = () => (g() && g().look) || DEFAULT_LOOK;
  const $id = (id) => document.getElementById(id);

  // ---------- 효과음 (WebAudio로 즉석 합성) ----------
  let actx = null, muted = null;
  const isMuted = () => (muted === null ? (muted = LS.get("muted", false)) : muted);
  function tone(freq, start, dur, type, vol) {
    const o = actx.createOscillator(), gn = actx.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    gn.gain.setValueAtTime(0.0001, actx.currentTime + start);
    gn.gain.exponentialRampToValueAtTime(vol || 0.05, actx.currentTime + start + 0.01);
    gn.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + start + dur);
    o.connect(gn).connect(actx.destination); o.start(actx.currentTime + start); o.stop(actx.currentTime + start + dur + 0.02);
  }
  function sfx(type) {
    if (isMuted()) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      if (type === "blip") tone(660 + Math.random() * 80, 0, 0.04, "square", 0.012);
      if (type === "open") { tone(520, 0, 0.08, "sine", 0.05); tone(780, 0.06, 0.1, "sine", 0.05); }
      if (type === "select") { tone(600, 0, 0.06, "triangle", 0.06); tone(900, 0.05, 0.08, "triangle", 0.05); }
      if (type === "good") [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.07, 0.18, "triangle", 0.05));
      if (type === "bad") [392, 330, 262].forEach((f, i) => tone(f, i * 0.09, 0.2, "sawtooth", 0.025));
      if (type === "day") [392, 523, 659, 784].forEach((f, i) => tone(f, i * 0.1, 0.3, "sine", 0.05));
      if (type === "night") [659, 523, 392].forEach((f, i) => tone(f, i * 0.16, 0.45, "sine", 0.04));
      if (type === "end") [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, i * 0.09, 0.4, "triangle", 0.05));
    } catch (e) {}
  }

  // ---------- 입력 ----------
  const MAP = { w: "ArrowUp", a: "ArrowLeft", s: "ArrowDown", d: "ArrowRight", W: "ArrowUp", A: "ArrowLeft", S: "ArrowDown", D: "ArrowRight" };
  document.addEventListener("keydown", (e) => {
    if (!$id("gwrap")) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "textarea" || tag === "input" || tag === "select") return;
    if (!$id("modal").classList.contains("hidden")) return;
    const k = MAP[e.key] || e.key;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(k)) e.preventDefault();
    keys[k.length === 1 ? k.toLowerCase() : k] = true;
    if (k.startsWith("Arrow") || e.repeat) return;
    press(k);
  });
  document.addEventListener("keyup", (e) => { const k = MAP[e.key] || e.key; keys[k.length === 1 ? k.toLowerCase() : k] = false; });
  window.addEventListener("blur", () => Object.keys(keys).forEach((k) => (keys[k] = false)));

  function press(k) {
    if (mode === "walk" && (k === " " || k === "Enter")) return interact();
    if (mode === "dialog") {
      if (choiceHandler && ["1", "2", "3", "4"].includes(k)) {
        const b = document.querySelector(`#dlg [data-c="${+k - 1}"]`); if (b) b.click(); return;
      }
      if (k === " " || k === "Enter") advance();
    }
  }

  // ---------- 공통 화면 골격 ----------
  function shell(app, kind) {
    app.innerHTML = `
      ${kind === "2d" ? '<div class="ghud" id="ghud"></div>' : ""}
      <div class="gwrap g${kind}" id="gwrap">
        <div class="gstage" id="gstage"></div>
        <div class="glabels" id="glabels"></div>
        ${kind === "3d" ? '<div class="ghud overlay" id="ghud"></div><canvas class="minimap" id="minimap" width="240" height="144"></canvas>' : ""}
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
      <p class="ghelp">${kind === "3d"
        ? "⌨️ <b>WASD / 방향키</b> 이동 · <b>마우스 드래그 / Q E</b> 시점 회전 · <b>휠</b> 줌 · <b>클릭</b> 그곳으로 이동 · <b>Space</b> 말 걸기 · <b>1 2 3</b> 선택"
        : "⌨️ <b>방향키 / WASD</b> 이동 · <b>Space</b> 말 걸기 · 대화 중 <b>1 2 3</b> 선택"} &nbsp;|&nbsp; <b class="bang">!</b> 표시를 찾아가세요</p>`;
    app.querySelectorAll(".touch [data-k]").forEach((b) => {
      const k = b.dataset.k;
      const on = (e) => { e.preventDefault(); if (k === " ") press(" "); else keys[k] = true; };
      const off = (e) => { e.preventDefault(); keys[k] = false; };
      b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointerleave", off);
    });
    return $id("gstage");
  }

  function attach(renderer) {
    R = renderer; mode = "walk"; closeDlgSilently();
    const gm = g();
    if (["card", "result"].includes(gm.phase)) gm.phase = "play";
    if (!gm.look) gm.look = { ...DEFAULT_LOOK };
    updateHUD();
    if (gm.phase === "dayIntro") showDayIntro();
    else if (gm.phase === "retro") showRetro();
    else if (gm.phase === "ending") showEnding();
    R.sync();
  }

  // ---------- HUD ----------
  function updateHUD() {
    const gm = g(), el = $id("ghud"); if (!gm || !el) return;
    const d = DAYS[gm.day - 1];
    el.innerHTML = `
      <div class="who">${R.portrait(look(), 40)}<div><b>${esc(gm.name)}</b><br/><span class="small hud-sub">인사팀 신입 · ${d.label} ${d.title}</span></div></div>
      <div class="mini-gauges">${GAUGES.map((x) => {
        const v = gm.gauges[x.key];
        return `<div class="mg ${v <= 20 ? "low" : ""}" title="${x.desc}"><span>${x.icon} ${x.label}</span><div class="bar"><i style="width:${v}%;background:${GCOLOR[x.key]}"></i></div><b>${v}</b></div>`;
      }).join("")}</div>
      <div class="hud-right">
        <div class="days">${DAYS.map((x) => `<span class="${x.day < gm.day ? "done" : x.day === gm.day ? "now" : ""}">${x.label}</span>`).join("")}</div>
        <div class="hud-btns">
          <button id="hb-mute" title="효과음">${isMuted() ? "🔇" : "🔊"}</button>
          ${typeof Game3D !== "undefined" && Game3D.supported ? `<button id="hb-mode" title="2D/3D 전환">${R.kind === "3d" ? "2D" : "3D"}</button>` : ""}
          ${R.kind === "3d" ? '<button id="hb-full" title="전체 화면">⛶</button>' : ""}
        </div>
      </div>`;
    $id("hb-mute").onclick = () => { muted = !isMuted(); LS.set("muted", muted); updateHUD(); };
    if ($id("hb-mode")) $id("hb-mode").onclick = () => { S.mode = R.kind === "3d" ? "2d" : "3d"; LS.set("mode", S.mode); render(); };
    if ($id("hb-full")) $id("hb-full").onclick = () => {
      const w = $id("gwrap");
      if (document.fullscreenElement) document.exitFullscreen(); else if (w.requestFullscreen) w.requestFullscreen();
    };
    const q = $id("quest"), card = World.curCard(), n = World.dayCards().length;
    if (gm.phase !== "play") { q.innerHTML = ""; return; }
    const t = World.targetOf(card), isNpc = NPCS.some((x) => x.id === t);
    q.innerHTML = card
      ? `<div class="q-title">📌 오늘의 할 일 <span>${gm.idx + 1} / ${n}</span></div>${esc(World.nameOf(t))}${isNpc ? "에게 말 걸기" : "(으)로 가기"}`
      : `<div class="q-title">📌 오늘 일 끝!</div>출입문으로 가서 퇴근하기 🌙`;
  }

  // ---------- 상호작용 ----------
  function interact() {
    const nb = R.nearest(); if (!nb) return;
    const gm = g(), card = World.curCard();
    if (nb.look) R.faceTo(nb);
    if (gm.phase !== "play") return;
    if (card && World.targetOf(card) === nb.id) return startCard(card, nb);
    if (nb.id === "door") {
      if (card) return say(nb, "아직 오늘 할 일이 남았어요. 📌 할 일을 확인하세요.");
      gm.phase = "retro"; save(); sfx("night"); R.sync(); return showRetro();
    }
    if (nb.id === "coffee") {
      if (gm.coffee === gm.day) return say(nb, "오늘은 이미 한 잔 마셨어요. 카페인은 하루 한 잔! ☕");
      gm.coffee = gm.day; gm.gauges.hp = clamp(gm.gauges.hp + 3); save(); updateHUD();
      R.onGain({ hp: 3 }); sfx("good");
      return say(nb, "따뜻한 커피 한 잔. 잠깐 숨 돌렸다. (체력 +3)");
    }
    if (nb.id === "board") {
      const n = S.customCards.length;
      return say(nb, n ? `선배들이 남긴 경험 카드 ${n}장이 붙어 있다. 해당 시기가 되면 여기서 상황이 시작된다.`
        : "아직 붙은 경험 카드가 없다. 시니어가 '✍️ 시니어' 탭에서 경험을 등록하면 여기에 붙는다.");
    }
    const line = Array.isArray(nb.idle) ? nb.idle[Math.floor(Math.random() * nb.idle.length)] : nb.idle;
    say(nb, line);
  }

  // ---------- 대화창 ----------
  function speakerHTML(who) {
    if (!who) return "";
    const pic = who.look ? R.portrait(LOOKS[who.look], 64) : `<div class="portrait emoji">${who.icon || "💬"}</div>`;
    return `<div class="spk">${pic}<div><b>${esc(who.name)}</b>${who.role ? `<br/><span class="small muted">${esc(who.role)}</span>` : ""}</div></div>`;
  }
  function openDlg(who, text, opts) {
    mode = "dialog"; choiceHandler = null;
    if (opts && opts.talkTo) R.onTalk(opts.talkTo, opts.card);
    sfx("open");
    const el = $id("dlg"); el.classList.remove("hidden");
    el.innerHTML = `${speakerHTML(who)}<div class="dbody">${opts && opts.head ? opts.head : ""}<p class="dtext" id="dtext"></p><div id="dchoices"></div><div class="dnext hidden" id="dnext">▼ Space</div></div>`;
    el.onclick = (e) => { if (!e.target.closest("button")) advance(); };
    const tEl = $id("dtext");
    let i = 0;
    clearInterval(typer);
    typer = setInterval(() => {
      i += 2; tEl.textContent = text.slice(0, i);
      if (i % 6 === 0) sfx("blip");
      if (i >= text.length) finishType();
    }, 24);
    function finishType() {
      clearInterval(typer); typer = null; tEl.textContent = text;
      if (opts && opts.choices) showChoices(opts.choices, opts.onPick, opts.extra);
      else $id("dnext").classList.remove("hidden");
    }
    dlgDone = { finishType, after: opts && opts.after, keepTalk: opts && opts.keepTalk };
  }
  function advance() {
    if (!dlgDone) return;
    if (typer) return dlgDone.finishType();
    if (choiceHandler) return;
    const after = dlgDone.after, keep = dlgDone.keepTalk; closeDlg(keep); if (after) after();
  }
  function closeDlgSilently() { clearInterval(typer); typer = null; dlgDone = null; choiceHandler = null; }
  function closeDlg(keepTalk) {
    closeDlgSilently();
    const el = $id("dlg"); if (el) el.classList.add("hidden");
    mode = "walk";
    if (!keepTalk) R.onTalkEnd();
  }
  function showChoices(list, onPick, extra) {
    choiceHandler = onPick;
    $id("dchoices").innerHTML = list.map((t, k) => `<button class="dchoice" data-c="${k}"><b>${k + 1}</b> ${esc(t)}</button>`).join("") + (extra || "");
    document.querySelectorAll("#dchoices [data-c]").forEach((b) => b.addEventListener("click", () => {
      const f = choiceHandler; if (!f) return; choiceHandler = null; sfx("select"); f(+b.dataset.c);
    }));
    const ask = $id("dask"); if (ask) ask.addEventListener("click", () => openAsk(World.curCard()));
  }
  function say(who, text, after) { openDlg(who, text, { after, talkTo: who && (who.look || who.p3) ? who : null }); }

  // ---------- 상황 카드 ----------
  function startCard(card, who) {
    const order = orderOf(card);
    const speaker = CARD_SPEAKER[card.id] ? { name: CARD_SPEAKER[card.id], icon: "" } : who;
    const head = `<div class="dhead"><span class="tag">${esc(card.category)}</span>${card.custom ? ' <span class="tag amber">선배 등록 카드</span>' : ""} <b>${esc(card.title)}</b></div>`;
    openDlg(speaker, card.text, {
      head, talkTo: who, card,
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
    const sum = Object.values(delta).reduce((a, b) => a + b, 0);
    sfx(sum >= 0 ? "good" : "bad");
    R.onGain(delta);
    if (Object.values(delta).some((v) => v <= -15)) R.shake();
    closeDlgSilently(); $id("dlg").classList.add("hidden"); mode = "busy";
    setTimeout(() => openDlg({ name: "결과", icon: "📎" }, card.choices[i].result, { keepTalk: true, after: () => showFeedback(card, i) }), 350);
  }

  // ---------- 패널 ----------
  function panel(html, cls) {
    mode = "panel";
    const p = $id("gpanel"); p.className = "gpanel " + (cls || ""); p.innerHTML = `<div class="gbox">${html}</div>`;
    return p;
  }
  function closePanel() {
    const p = $id("gpanel"); if (p) p.classList.add("hidden"); mode = "walk";
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  function showFeedback(card, mine) {
    const order = orderOf(card), letter = (oi) => order.indexOf(oi) + 1;
    const same = card.feedback.filter((f) => f.pick === mine).length;
    R.sync();
    const p = panel(`
      <div class="row" style="justify-content:space-between"><h2 style="margin:0">👥 선배들은 어떻게 했을까?</h2>
        <span class="tag ${same ? "" : "gray"}">나와 같은 선택 ${same}/${card.feedback.length}</span></div>
      <p class="muted small">내 선택: <b>${letter(mine)}번</b> ${esc(card.choices[mine].text)}</p>
      ${card.feedback.map((f) => {
        const s = seniorOf(f), lk = SENIOR_LOOK[f.senior];
        return `<div class="senior-fb">${lk ? R.portrait(LOOKS[lk], 52) : `<div class="portrait emoji">${s.emoji}</div>`}
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
      closePanel(); R.onTalkEnd();
      if (g().failKey) { g().phase = "ending"; save(); R.sync(); showEnding(); }
      else { updateHUD(); R.sync(); }
    });
  }

  function showDayIntro() {
    const gm = g(), d = DAYS[gm.day - 1];
    R.resetPlayer(); R.sync();
    const p = panel(`
      <div class="day-intro"><div class="muted">Day ${d.day} / ${DAYS.length}</div><div class="big">${d.label}</div>
      <h2>${d.title}</h2><p class="muted">${d.sub} · 오늘의 상황 ${World.dayCards().length}개</p>
      <button class="btn" id="dgo">출근하기 ☀️</button></div>`, "intro");
    p.querySelector("#dgo").addEventListener("click", () => {
      gm.phase = "play"; save(); closePanel(); updateHUD(); R.sync(); sfx("day");
    });
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
      ${revealed ? `<div class="senior-fb" style="margin-top:12px">${R.portrait(LOOKS[SENIOR_LOOK[r.senior]], 52)}
          <div><span class="who">${s.name}</span> <span class="muted small">${s.role}</span><div>${esc(r.tip)}</div></div></div>
        <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" id="rnext">${gm.day >= DAYS.length ? "🏁 100일 엔딩 보기" : "집에 가서 쉬기 →"}</button></div>`
      : `<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" id="rrev">작성하고 선배 팁 보기</button></div>`}`, "night");
    if (!revealed) p.querySelector("#rrev").addEventListener("click", () => {
      const t = p.querySelector("#rt").value.trim();
      if (t.length < 5) return toast("한두 문장이라도 적어보세요 ✍️");
      gm.retro[gm.day] = t; gm.revealed[gm.day] = true; save(); sfx("select"); showRetro();
    });
    else p.querySelector("#rnext").addEventListener("click", () => {
      if (gm.day >= DAYS.length) { gm.phase = "ending"; save(); R.sync(); return showEnding(); }
      gm.day++; gm.idx = 0; gm.gauges.hp = clamp(gm.gauges.hp + 10); gm.phase = "dayIntro"; save();
      toast("🔋 푹 쉬고 왔어요. 체력 +10"); updateHUD(); showDayIntro();
    });
  }

  function showEnding() {
    const gm = g(), e = endingOf(gm);
    if (!gm.counted) {
      gm.counted = true; S.stats.endings[e.key] = (S.stats.endings[e.key] || 0) + 1;
      if (!e.fail) S.stats.completed++; save();
      sfx(e.fail ? "bad" : "end");
    }
    updateHUD();
    const match = gm.history.filter((h) => h.choice === h.best).length;
    const retros = Object.entries(gm.retro);
    const confetti = e.fail ? "" : `<div class="confetti">${Array.from({ length: 36 }, (_, i) =>
      `<i style="left:${(i * 97) % 100}%;background:${["#e8a33d", "#3f8a68", "#5b8def", "#f29bb5", "#f7c548"][i % 5]};animation-delay:${(i % 12) * 0.12}s;animation-duration:${2.2 + (i % 5) * 0.35}s"></i>`).join("")}</div>`;
    const p = panel(`
      ${confetti}
      <div class="ending-card ${e.fail ? "fail" : ""}">
        ${R.portrait(look(), 88)}
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

  return {
    keys, shell, attach, press, updateHUD, sfx,
    get mode() { return mode; },
  };
})();
