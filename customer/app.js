(function () {
  "use strict";

  const PASS_KEY = "tt26-pass";

  const COPY = {
    th: {
      pick: {
        title: "คุณจะเข้าร่วมงานไหน?",
        sub: "เลือกงานเพื่อเปิดฟอร์มลงทะเบียนของงานนั้น แต่ละงานมีคำถามและบัตรของตัวเอง",
        cta: "ลงทะเบียนงานนี้", soon: "ยังไม่เปิดรับลงทะเบียน",
        facts: ["วันที่จัด", "สถานที่", "ที่นั่ง", "ค่าเข้าร่วม"],
        hint: "วางรูปงานที่นี่", loading: "กำลังโหลดรายการงาน…",
        error: "โหลดรายการงานไม่สำเร็จ ลองใหม่อีกครั้ง", retry: "ลองใหม่"
      },
      steps: [
        { key: "name", q: "คุณชื่อ\nอะไร?", helper: "ชื่อนี้จะพิมพ์บนบัตรแขวนคอของคุณ", ph: "ชื่อ–นามสกุล", mode: "text" },
        { key: "email", q: "อีเมล\nของคุณ", helper: "เราจะส่ง QR สำหรับเข้างานไปที่อีเมลนี้ และเปิดดูซ้ำได้ทุกเมื่อ", ph: "name@company.com", mode: "email", chips: ["@gmail.com", "@corp.co.th"] },
        { key: "phone", q: "เบอร์ติดต่อ\nหน้างาน", helper: "ใช้เฉพาะกรณีติดต่อเรื่องงานนี้เท่านั้น", ph: "08X XXX XXXX", mode: "tel" },
        { key: "org", q: "ทำงานที่\nไหน?", helper: "ไม่บังคับ — ข้ามได้ถ้าไม่ต้องการระบุ แล้วยืนยันการเก็บข้อมูล", ph: "ชื่อบริษัทหรือองค์กร", mode: "text" }
      ],
      types: ["ทั่วไป", "VIP", "สื่อ"],
      consent: "ยินยอมให้ผู้จัดงานเก็บและใช้ข้อมูลตามนโยบาย PDPA",
      next: "ถัดไป", skip: "ข้าม", finish: "ยืนยันและรับ QR",
      already: "ลงทะเบียนไว้แล้ว?", lookupLink: "เปิดดู QR ของฉัน",
      saving: "กำลังบันทึกลง Google Sheet…",
      lookupTitle: "เปิดดู\nบัตรของฉัน", lookupSub: "กรอกอีเมลที่ใช้ลงทะเบียน ระบบจะเปิด QR ใบเดิมให้", lookupBtn: "ค้นหาบัตร",
      done: "เรียบร้อย\nแล้ว!", passNote: "ยื่น QR นี้ที่ประตู เจ้าหน้าที่จะพิมพ์บัตรแขวนคอให้ทันที · เปิดซ้ำได้จากลิงก์ในอีเมล",
      kicker: "ENTRY PASS", gate: "จุดลงทะเบียน", gateVal: "ฮอลล์ 2 · ประตู A", doors: "เวลาเปิดประตู", contact: "เบอร์ติดต่อ",
      saveImg: "บันทึกรูป", newReg: "ลงทะเบียนคนใหม่",
      err: { name: "กรุณากรอกชื่อ", email: "รูปแบบอีเมลไม่ถูกต้อง", phone: "กรอกเบอร์ 9–10 หลัก", consent: "กรุณายอมรับนโยบาย PDPA ก่อนดำเนินการต่อ", notfound: "ไม่พบการลงทะเบียนของอีเมลนี้", eventClosed: "งานนี้ยังไม่เปิดรับลงทะเบียน", network: "เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง" },
      toastSaved: "บันทึกลง Google Sheet แล้ว", toastImg: "บันทึกรูป QR ลงเครื่องแล้ว", toastWallet: "เพิ่มบัตรใน Wallet แล้ว"
    },
    en: {
      pick: {
        title: "Which event are you joining?",
        sub: "Pick an event to open its registration form. Each event has its own questions and badge.",
        cta: "Register for this event", soon: "Registration not open yet",
        facts: ["Date", "Venue", "Availability", "Fee"],
        hint: "Drop the event photo", loading: "Loading events…",
        error: "Couldn't load events. Please try again.", retry: "Retry"
      },
      steps: [
        { key: "name", q: "What's\nyour name?", helper: "This is the name printed on your lanyard badge.", ph: "Full name", mode: "text" },
        { key: "email", q: "Your\nemail", helper: "We'll send your entry QR here — reopen it any time.", ph: "name@company.com", mode: "email", chips: ["@gmail.com", "@corp.co.th"] },
        { key: "phone", q: "Contact\nnumber", helper: "Used only if we need to reach you about this event.", ph: "08X XXX XXXX", mode: "tel" },
        { key: "org", q: "Where do\nyou work?", helper: "Optional — skip if you'd rather not say. Then confirm data consent.", ph: "Company or organisation", mode: "text" }
      ],
      types: ["General", "VIP", "Press"],
      consent: "I consent to the organiser storing my data under its PDPA policy.",
      next: "NEXT", skip: "SKIP", finish: "CONFIRM & GET QR",
      already: "Already registered?", lookupLink: "Open my QR",
      saving: "Saving to Google Sheet…",
      lookupTitle: "Find\nmy pass", lookupSub: "Enter the email you registered with and we'll reopen the same QR.", lookupBtn: "FIND MY PASS",
      done: "You're\nin!", passNote: "Show this QR at the door — staff print your lanyard badge on the spot. Reopen it any time from the email link.",
      kicker: "ENTRY PASS", gate: "Check-in point", gateVal: "Hall 2 · Gate A", doors: "Doors open", contact: "Contact",
      saveImg: "SAVE IMAGE", newReg: "Register someone else",
      err: { name: "Please enter your name", email: "Invalid email format", phone: "Enter a 9–10 digit number", consent: "Please accept the PDPA policy to continue.", notfound: "No registration found for that email.", eventClosed: "Registration opens later — check back soon.", network: "Couldn't reach the server. Please try again." },
      toastSaved: "Saved to Google Sheet", toastImg: "QR image saved", toastWallet: "Pass added to Wallet"
    }
  };

  const state = {
    lang: "th",
    screen: "pick", // pick | ask | sending | lookup | pass
    events: [], eventsLoading: true, eventsError: "",
    evIdx: 0,
    step: 0,
    vals: { name: "", email: "", phone: "", org: "" },
    consent: false,
    error: "", consentError: "",
    lookupEmail: "", lookupError: "", lookupBusy: false,
    pass: null, toast: "",
    submitError: ""
  };

  const app = document.getElementById("app");
  let toastTimer = null;

  function t() { return COPY[state.lang]; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function nl2sp(s) { return String(s || "").replace(/\n/g, " "); }

  function setState(patch) { Object.assign(state, patch); render(); }
  function flash(msg) {
    state.toast = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { state.toast = ""; render(); }, 2000);
    render();
  }

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------
  async function init() {
    try {
      const raw = localStorage.getItem(PASS_KEY);
      if (raw) state.pass = JSON.parse(raw);
    } catch (e) { /* ignore */ }

    const urlParams = new URLSearchParams(location.search);
    const lookupEmail = urlParams.get("lookup");

    await loadEvents();

    if (lookupEmail) {
      state.lookupEmail = lookupEmail;
      state.screen = "lookup";
      render();
      doLookup();
      return;
    }

    if (state.pass) state.screen = "pass";
    render();

    window.addEventListener("keydown", e => {
      if (state.screen !== "pick") return;
      if (e.key === "ArrowRight") moveEv(1);
      if (e.key === "ArrowLeft") moveEv(-1);
    });
  }

  async function loadEvents() {
    state.eventsLoading = true;
    state.eventsError = "";
    render();
    try {
      const res = await window.Api.listEvents();
      if (!res.ok) throw new Error(res.error || "load_failed");
      state.events = res.data || [];
      state.eventsLoading = false;
    } catch (e) {
      state.eventsLoading = false;
      state.eventsError = t().pick.error;
    }
    render();
  }

  // ---------------------------------------------------------------------
  // Render dispatch
  // ---------------------------------------------------------------------
  function render() {
    let html = "";
    if (state.screen === "pick") html = renderPick();
    else if (state.screen === "ask") html = renderAsk();
    else if (state.screen === "sending") html = renderSending();
    else if (state.screen === "lookup") html = renderLookup();
    else if (state.screen === "pass") html = renderPass();

    if (state.toast) html += `<div class="toast">${esc(state.toast)}</div>`;

    app.innerHTML = html;
    bindEvents();
    if (state.screen === "pick") ensureHeroScroll();
  }

  function langToggleHtml() {
    return `<div class="lang-toggle">
      <div class="lang-btn ${state.lang === "th" ? "is-active" : ""}" data-action="lang" data-lang="th">TH</div>
      <div class="lang-btn ${state.lang === "en" ? "is-active" : ""}" data-action="lang" data-lang="en">EN</div>
    </div>`;
  }

  // ---------------------------------------------------------------------
  // Pick screen — event picker (arc carousel)
  // ---------------------------------------------------------------------
  function renderPick() {
    const c = t().pick;
    if (state.eventsLoading || state.eventsError || !state.events.length) {
      const msg = state.eventsError || (state.eventsLoading ? c.loading : c.loading);
      return `<div class="screen"><div class="screen-inner">
        <div class="pick-topbar"><div class="brandmark">TT / 26</div>${langToggleHtml()}</div>
        <div class="pick-heading">
          <div class="pick-title">${esc(msg)}</div>
          ${state.eventsError ? `<div class="cta is-open" data-action="retry-events" style="margin-top:16px;max-width:160px">${esc(c.retry)}</div>` : ""}
        </div>
      </div></div>`;
    }

    const evs = state.events;

    const sections = evs.map((e, i) => {
      const facts = [
        [c.facts[0], e.date], [c.facts[1], e.place], [c.facts[2], e.seats], [c.facts[3], e.price]
      ].map(([k, v]) => `<div class="pick-fact"><span class="k">${esc(k)}</span><span>${esc(v)}</span></div>`).join("");
      const badgeBg = e.open ? e.accent : "#ded8c6";
      const badgeFg = e.open ? "#fff" : "#57533f";
      return `<section class="hero-event">
        <div class="hero-media-wrap" data-hero-media>
          <div class="hero-media">
            ${e.image ? `<img class="hero-img" src="${esc(e.image)}" alt="">` : `<div class="img-placeholder">${esc(c.hint)}</div>`}
            <div class="hero-media-scrim"></div>
            <div class="hero-media-badge" style="background:${badgeBg};color:${badgeFg}">${esc(e.status)}</div>
          </div>
        </div>
        <div class="hero-info">
          <div class="hero-kicker">${esc((e.date || "").toUpperCase())}</div>
          <div class="hero-name">${esc(e.name)}</div>
          <div class="hero-place">${esc(e.place)}</div>
          <div class="pick-facts">${facts}</div>
          <div class="cta ${e.open ? "is-open" : "is-closed"}" data-action="hero-enter" data-idx="${i}">${esc(e.open ? c.cta : c.soon)}</div>
        </div>
      </section>`;
    }).join("");

    return `<div class="screen"><div class="screen-inner">
      <div class="pick-topbar"><div class="brandmark">TT / 26</div>${langToggleHtml()}</div>
      ${sections}
      <div class="lookup-link-row" data-action="go-lookup">${esc(t().already)} <span class="accent">${esc(t().lookupLink)}</span></div>
    </div></div>`;
  }

  // Scroll-linked reveal for the hero picker: each event's image container
  // grows from a narrow, zoomed-in square to full-width with rounded corners
  // as its section crosses the viewport — same "start end" -> "start start"
  // progress convention a scroll-linked library would use, just computed by
  // hand off getBoundingClientRect() so no animation dependency is needed.
  let heroRaf = null;
  let heroScrollBound = false;

  function ensureHeroScroll() {
    if (!heroScrollBound) {
      window.addEventListener("scroll", onHeroScrollRaw, { passive: true });
      window.addEventListener("resize", onHeroScrollRaw, { passive: true });
      heroScrollBound = true;
    }
    onHeroScroll();
  }

  function onHeroScrollRaw() {
    if (heroRaf) return;
    heroRaf = requestAnimationFrame(() => { heroRaf = null; onHeroScroll(); });
  }

  // Pure interpolation helpers for the hero reveal — no DOM access, so
  // they're checkable with plain `node -e` (see Task 2's verification
  // steps) without a browser or a test framework.
  function heroWidthPx(p, startW, endW) {
    return startW + p * (endW - startW);
  }
  function heroHeightPx(p, vh) {
    const startH = vh * 0.64, endH = vh;
    return startH + p * (endH - startH);
  }
  function heroRadiusPx(p) {
    // Rises to 22px through the first 70% of the reveal, eases back to 0
    // through the last 30% — a rounded corner at true full-bleed (p=1)
    // would sit at the literal edge of the screen and read as a bug.
    return p < 0.7 ? (p / 0.7) * 22 : 22 * (1 - (p - 0.7) / 0.3);
  }

  function onHeroScroll() {
    const wraps = document.querySelectorAll("[data-hero-media]");
    if (!wraps.length) return;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    wraps.forEach(wrap => {
      const rect = wrap.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (vh - rect.top) / vh));
      const media = wrap.querySelector(".hero-media");
      if (media) {
        const startW = wrap.clientWidth * 0.56;
        media.style.width = heroWidthPx(p, startW, window.innerWidth) + "px";
        media.style.height = heroHeightPx(p, vh) + "px";
        media.style.borderRadius = heroRadiusPx(p) + "px";
      }
      const img = wrap.querySelector(".hero-img");
      if (img) img.style.transform = `scale(${1.35 - p * 0.35})`;
      const heroEvent = wrap.closest(".hero-event");
      if (heroEvent) heroEvent.classList.toggle("is-full", p >= 0.96);
    });
  }

  // ---------------------------------------------------------------------
  // Ask screen — 5-step form
  // ---------------------------------------------------------------------
  function renderAsk() {
    const c = t();
    const ev = state.events[state.evIdx];
    const steps = c.steps, i = state.step, cur = steps[i];
    const isLast = i === steps.length - 1;
    const val = state.vals[cur.key];
    const filled = (val || "").length > 0;
    const optional = cur.key === "org";
    const inputBorder = state.error ? "#c1391f" : filled ? "#17150f" : "#c9c3b0";

    const ticks = steps.map((_, k) => `<div class="tick ${k <= i ? "is-done" : ""}"></div>`).join("");

    const chips = (cur.chips || []).map(label => `<div class="chip" data-action="chip" data-label="${esc(label)}">${esc(label)}</div>`).join("");
    let body = `<div class="input-block">
        <div class="input-underline" style="border-bottom-color:${inputBorder}">
          <input class="text-input" id="step-input" type="${cur.mode === "email" ? "email" : cur.mode === "tel" ? "tel" : "text"}" value="${esc(val)}" placeholder="${esc(cur.ph || "")}" autocomplete="off" />
        </div>
        <div class="field-error">${esc(state.error)}</div>
        ${chips ? `<div class="chips">${chips}</div>` : ""}
      </div>`;
    if (isLast) {
      body = `<div class="choice-block">${body}
        <div class="consent-block">
          <div class="consent-row" data-action="toggle-consent">
            <div class="consent-box ${state.consent ? "is-checked" : ""} ${state.consentError ? "is-error" : ""}"><div class="consent-box-dot"></div></div>
            <div class="consent-text ${state.consentError ? "is-error" : ""}">${esc(c.consent)}</div>
          </div>
          <div class="consent-error">${esc(state.consentError)}</div>
        </div>
      </div>`;
    }

    const nextLabel = isLast ? c.finish : (optional && !filled ? c.skip : c.next);

    return `<div class="screen"><div class="screen-inner">
      <div class="ask-banner">
        ${ev.image ? `<img class="ask-banner-img" src="${esc(ev.image)}" alt="">` : `<div class="img-placeholder">${esc(t().pick.hint)}</div>`}
        <div class="ask-banner-scrim"></div>
        <div class="ask-banner-info">
          <div class="ask-banner-meta">${esc((ev.date || "") + " · " + (ev.place || ""))}</div>
          <div class="ask-banner-name">${esc(ev.name)}</div>
        </div>
      </div>
      <div class="ask-topbar">
        <div class="change-event" data-action="go-pick">← ${state.lang === "en" ? "Change event" : "เปลี่ยนงาน"}</div>
        <div class="ask-topbar-right">
          <div class="ticks">${ticks}</div>
          ${langToggleHtml()}
        </div>
      </div>
      <div class="ask-body">
        <div class="step-num">${String(i + 1).padStart(2, "0")}</div>
        <div>
          <div class="question">${esc(nl2sp(cur.q))}</div>
          <div class="helper">${esc(cur.helper)}</div>
        </div>
        ${body}
      </div>
      <div class="ask-actions">
        <div class="back-btn" data-action="back">←</div>
        <div class="next-btn" data-action="next">${esc(nextLabel)}</div>
      </div>
      <div class="already-row">${esc(c.already)} <span class="accent" data-action="go-lookup">${esc(c.lookupLink)}</span></div>
    </div></div>`;
  }

  function renderSending() {
    return `<div class="sending-screen">
      <div class="spinner"></div>
      <div class="sending-text">${esc(t().saving)}</div>
    </div>`;
  }

  function renderLookup() {
    const c = t();
    return `<div class="lookup-screen"><div class="lookup-inner">
      <div class="brandmark">TT / 26</div>
      <div class="lookup-body">
        <div class="lookup-title">${esc(nl2sp(c.lookupTitle))}</div>
        <div class="lookup-sub">${esc(c.lookupSub)}</div>
        <div class="lookup-underline">
          <input class="lookup-input" id="lookup-input" type="email" value="${esc(state.lookupEmail)}" placeholder="name@company.com" autocomplete="off" />
        </div>
        <div class="lookup-error">${esc(state.lookupError)}</div>
      </div>
      <div class="lookup-actions">
        <div class="back-btn" data-action="go-pick">←</div>
        <div class="lookup-submit" data-action="do-lookup">${state.lookupBusy ? "…" : esc(c.lookupBtn)}</div>
      </div>
    </div></div>`;
  }

  function typeLabelFor(pass) {
    let idx = 0;
    for (const l of ["th", "en"]) {
      const i = COPY[l].types.indexOf(pass.type);
      if (i >= 0) { idx = i; break; }
    }
    return t().types[idx];
  }

  function renderPass() {
    const c = t();
    const p = state.pass;
    const typeLabel = typeLabelFor(p).toUpperCase();
    return `<div class="pass-screen"><div class="pass-inner">
      <div class="pass-topbar"><div class="pass-brandmark">TT / 26</div>${langToggleHtml()}</div>
      <div>
        <div class="done-title">${esc(nl2sp(c.done))}</div>
        <div class="pass-note">${esc(c.passNote)}</div>
      </div>
      <div class="badge-card">
        <div class="badge-top">
          <div style="min-width:0">
            <div class="badge-kicker">${esc(c.kicker)} · ${esc(p.eventName || "")}</div>
            <div class="badge-name">${esc(p.name)}</div>
            <div class="badge-org">${esc(p.org)}</div>
          </div>
          <div class="badge-type">${esc(typeLabel)}</div>
        </div>
        <div class="badge-qr">${window.renderQrSvg(p.qrPayload)}</div>
        <div class="badge-bottom">
          <div class="badge-code">${esc(p.code)}</div>
          <div class="badge-date">18.12.2026 · H2</div>
        </div>
      </div>
      <div class="pass-facts">
        <div class="pass-fact"><span class="k">${esc(c.gate)}</span><span>${esc(c.gateVal)}</span></div>
        <div class="pass-fact"><span class="k">${esc(c.doors)}</span><span>08:15</span></div>
        <div class="pass-fact"><span class="k">${esc(c.contact)}</span><span>${esc(p.phone)}</span></div>
      </div>
      <div class="pass-buttons">
        <div class="save-btn" data-action="save-img">${esc(c.saveImg)}</div>
        <div class="wallet-btn" data-action="add-wallet">WALLET</div>
      </div>
      <div class="new-reg" data-action="reset">${esc(c.newReg)}</div>
    </div></div>`;
  }

  // ---------------------------------------------------------------------
  // Event binding
  // ---------------------------------------------------------------------
  function bindEvents() {
    app.querySelectorAll("[data-action]").forEach(el => {
      const action = el.dataset.action;
      el.addEventListener("click", () => handleAction(action, el));
    });

    const stepInput = document.getElementById("step-input");
    if (stepInput) {
      stepInput.focus();
      try { const val = stepInput.value; stepInput.setSelectionRange(val.length, val.length); } catch (e) { /* email/tel inputs don't support selection ranges */ }
      const underline = app.querySelector(".input-underline");
      const errorEl = app.querySelector(".field-error");
      const c = t(), cur = c.steps[state.step];
      stepInput.addEventListener("input", e => {
        state.vals[cur.key] = e.target.value;
        state.error = "";
        if (errorEl) errorEl.textContent = "";
        if (underline) underline.style.borderBottomColor = e.target.value ? "#17150f" : "#c9c3b0";
      });
      stepInput.addEventListener("keydown", e => { if (e.key === "Enter") next(); });
    }

    const lookupInput = document.getElementById("lookup-input");
    if (lookupInput) {
      lookupInput.focus();
      lookupInput.addEventListener("input", e => {
        state.lookupEmail = e.target.value;
        state.lookupError = "";
        const errorEl = app.querySelector(".lookup-error");
        if (errorEl) errorEl.textContent = "";
      });
      lookupInput.addEventListener("keydown", e => { if (e.key === "Enter") doLookup(); });
    }
  }

  function handleAction(action, el) {
    switch (action) {
      case "lang": setState({ lang: el.dataset.lang, error: "", consentError: "" }); break;
      case "retry-events": loadEvents(); break;
      case "hero-enter": {
        const idx = Number(el.dataset.idx);
        const ev = state.events[idx];
        if (!ev) break;
        if (!ev.open) { flash(t().err.eventClosed); break; }
        setState({ screen: "ask", evIdx: idx, step: 0, error: "", consentError: "" });
        break;
      }
      case "go-lookup": setState({ screen: "lookup", lookupError: "" }); break;
      case "go-pick": setState({ screen: "pick" }); break;
      case "chip": {
        const cur = t().steps[state.step];
        const base = (state.vals[cur.key] || "").split("@")[0];
        state.vals[cur.key] = base + el.dataset.label;
        state.error = "";
        render();
        break;
      }
      case "toggle-consent": setState({ consent: !state.consent, consentError: "" }); break;
      case "back": back(); break;
      case "next": next(); break;
      case "do-lookup": doLookup(); break;
      case "save-img": flash(t().toastImg); break;
      case "add-wallet": flash(t().toastWallet); break;
      case "reset": resetAll(); break;
    }
  }

  function stepError(key) {
    const c = t(), v = state.vals;
    if (key === "name" && !v.name.trim()) return c.err.name;
    if (key === "email" && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v.email.trim())) return c.err.email;
    if (key === "phone" && v.phone.replace(/\D/g, "").length < 9) return c.err.phone;
    return "";
  }

  function next() {
    const c = t(), steps = c.steps, cur = steps[state.step];
    const isLast = state.step === steps.length - 1;
    const err = cur.key === "org" ? "" : stepError(cur.key);
    if (err) { setState({ error: err }); return; }
    if (isLast) { submit(); return; }
    setState({ step: state.step + 1, error: "" });
  }

  function back() {
    if (state.step === 0) { setState({ screen: "pick" }); return; }
    setState({ step: state.step - 1, error: "" });
  }

  async function submit() {
    const c = t();
    if (!state.consent) { setState({ consentError: c.err.consent }); return; }
    setState({ screen: "sending" });
    const ev = state.events[state.evIdx];
    try {
      const res = await window.Api.register({
        eventId: ev.id,
        name: state.vals.name.trim(), email: state.vals.email.trim(),
        phone: state.vals.phone.trim(), org: state.vals.org.trim(),
        consent: true
      });
      if (!res.ok) throw new Error(res.error || "register_failed");
      const d = res.data;
      const pass = {
        name: d.name, email: d.email, phone: d.phone,
        org: d.org || (state.lang === "en" ? "Individual" : "ผู้เข้าร่วมทั่วไป"),
        type: d.type, code: d.badgeCode, qrPayload: d.qrPayload,
        eventId: d.eventId, eventName: d.eventName
      };
      try { localStorage.setItem(PASS_KEY, JSON.stringify(pass)); } catch (e) { /* ignore */ }
      state.pass = pass;
      state.screen = "pass";
      render();
      flash(c.toastSaved);
    } catch (e) {
      setState({ screen: "ask", step: state.step });
      flash(c.err.network);
    }
  }

  async function doLookup() {
    const c = t();
    const em = state.lookupEmail.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(em)) { setState({ lookupError: c.err.notfound }); return; }
    state.lookupBusy = true;
    render();
    try {
      const res = await window.Api.getMyPass(em);
      if (!res.ok) throw new Error(res.error || "not_found");
      const d = res.data;
      const pass = {
        name: d.name, email: d.email, phone: d.phone, org: d.org,
        type: d.type, code: d.badgeCode, qrPayload: d.qrPayload,
        eventId: d.eventId, eventName: d.eventName
      };
      try { localStorage.setItem(PASS_KEY, JSON.stringify(pass)); } catch (e) { /* ignore */ }
      state.pass = pass;
      state.screen = "pass";
      state.lookupBusy = false;
      render();
    } catch (e) {
      state.lookupBusy = false;
      setState({ lookupError: c.err.notfound });
    }
  }

  function resetAll() {
    try { localStorage.removeItem(PASS_KEY); } catch (e) { /* ignore */ }
    setState({
      screen: "pick", step: 0, vals: { name: "", email: "", phone: "", org: "" },
      consent: false, error: "", consentError: "", pass: null
    });
  }

  init();
})();
