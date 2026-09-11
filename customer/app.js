(function () {
  "use strict";

  const PASS_KEY = "tt26-pass";
  // It used to read "TT / 26" on every screen, so a pass for any other event
  // was stamped with ThinkTech's initials.
  const BRAND = "1NEVE";

  const COPY = {
    th: {
      pick: {
        title: "คุณจะเข้าร่วมงานไหน?",
        sub: "เลือกงานเพื่อเปิดฟอร์มลงทะเบียนของงานนั้น แต่ละงานมีคำถามและบัตรของตัวเอง",
        cta: "ลงทะเบียนงานนี้", soon: "ยังไม่เปิดรับลงทะเบียน",
        facts: ["วันที่จัด", "สถานที่", "ที่นั่ง", "ค่าเข้าร่วม"],
        loading: "กำลังโหลดรายการงาน…",
        error: "โหลดรายการงานไม่สำเร็จ ลองใหม่อีกครั้ง", retry: "ลองใหม่",
        empty: "ยังไม่มีงานที่เปิดให้ลงทะเบียนตอนนี้",
        emptySub: "ผู้จัดงานยังไม่ได้เปิดงานใด หรือเพิ่งปิดรับไป ลองกลับมาดูใหม่อีกครั้ง"
      },
      fieldLabels: { name: "ชื่อ–นามสกุล", email: "อีเมล", phone: "เบอร์โทรศัพท์", org: "บริษัท / องค์กร" },
      fieldPh: { name: "เช่น สมชาย ใจดี", email: "name@company.com", phone: "08X XXX XXXX", org: "เช่น Qudsun" },
      emailChips: ["@gmail.com", "@corp.co.th"],
      askP1: { eyebrow: "ขั้นที่ 1 · จำเป็น", title: "ข้อมูลผู้เข้าร่วม", sub: "ใช้พิมพ์บัตรแขวนคอและส่ง QR เข้างานให้คุณ" },
      askP2: { eyebrow: "ขั้นที่ 2 · ไม่บังคับ", title: "อีกนิดเดียว ถ้าสะดวก", sub: "ข้ามได้ทั้งหน้า — ไม่กระทบการเข้างานของคุณ" },
      eventQuestions: "คำถามของงานนี้",
      pdpaNotice: "การกดยืนยันถือว่าคุณยอมรับนโยบาย PDPA ของผู้จัดงาน",
      formLoading: "กำลังเปิดฟอร์ม…",
      types: ["ทั่วไป", "VIP", "สื่อ"],
      consent: "ยินยอมให้ผู้จัดงานเก็บและใช้ข้อมูลตามนโยบาย PDPA",
      next: "ถัดไป", skip: "ข้าม", finish: "ยืนยันและรับ QR",
      already: "ลงทะเบียนไว้แล้ว?", lookupLink: "เปิดดู QR ของฉัน",
      saving: "กำลังบันทึกลง Google Sheet…",
      lookupTitle: "เปิดดู\nบัตรของฉัน", lookupSub: "กรอกเบอร์โทรศัพท์ที่ใช้ลงทะเบียน (หรืออีเมลก็ได้) ระบบจะเปิด QR ใบเดิมให้", lookupBtn: "ค้นหาบัตร",
      lookupPh: "08X XXX XXXX",
      done: "เรียบร้อย\nแล้ว!", passNote: "ยื่น QR นี้ที่ประตู เจ้าหน้าที่จะพิมพ์บัตรแขวนคอให้ทันที · ปิดหน้านี้ไปแล้วเปิดใหม่ได้ตลอด ด้วยเบอร์โทรที่ลงทะเบียนไว้",
      kicker: "ENTRY PASS", eventDate: "วันที่จัดงาน", gate: "จุดลงทะเบียน",
      doors: "เวลาเปิดประตู", contact: "เบอร์ที่ลงทะเบียนไว้",
      saveImg: "บันทึกรูป", newReg: "ลงทะเบียนคนใหม่",
      // A blank field and a malformed one are different problems and deserve
      // different words. Telling somebody their email is badly formatted when
      // they simply have not typed one sends them hunting for a typo.
      blank: { name: "กรุณากรอกชื่อ", email: "กรุณากรอกอีเมล", phone: "กรุณากรอกเบอร์โทรศัพท์" },
      err: { name: "กรุณากรอกชื่อ", email: "รูปแบบอีเมลไม่ถูกต้อง", phone: "กรอกเบอร์ 9–10 หลัก", requiredField: "กรุณากรอกข้อมูลนี้", missingField: "ยังกรอกข้อมูลไม่ครบ กรุณาตรวจอีกครั้ง", busy: "ระบบกำลังบันทึกรายการอื่น รอสักครู่แล้วลองใหม่", failed: "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", saveImg: "บันทึกรูปไม่สำเร็จ ลองใหม่อีกครั้ง", notfound: "ไม่พบการลงทะเบียนของเบอร์หรืออีเมลนี้",
        dupPhone: "เบอร์นี้ลงทะเบียนงานนี้ไว้แล้ว — กด “เปิดดู QR ของฉัน” ด้านล่างเพื่อเปิดบัตรใบเดิม",
        dupEmail: "อีเมลนี้ลงทะเบียนงานนี้ไว้แล้ว — กด “เปิดดู QR ของฉัน” ด้านล่างเพื่อเปิดบัตรใบเดิม", eventClosed: "งานนี้ยังไม่เปิดรับลงทะเบียน", network: "เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง" },
      toastSaved: "บันทึกลง Google Sheet แล้ว", toastImg: "บันทึกรูปบัตรลงเครื่องแล้ว"
    },
    en: {
      pick: {
        title: "Which event are you joining?",
        sub: "Pick an event to open its registration form. Each event has its own questions and badge.",
        cta: "Register for this event", soon: "Registration not open yet",
        facts: ["Date", "Venue", "Availability", "Fee"],
        loading: "Loading events…",
        error: "Couldn't load events. Please try again.", retry: "Retry",
        empty: "No events are open for registration right now",
        emptySub: "The organiser hasn't opened one yet, or registration has just closed. Please check back."
      },
      fieldLabels: { name: "Full name", email: "Email", phone: "Phone number", org: "Company or organisation" },
      fieldPh: { name: "e.g. Alex Chen", email: "name@company.com", phone: "08X XXX XXXX", org: "e.g. Qudsun" },
      emailChips: ["@gmail.com", "@corp.co.th"],
      askP1: { eyebrow: "STEP 1 · REQUIRED", title: "Your details", sub: "Used to print your lanyard badge and send your entry QR." },
      askP2: { eyebrow: "STEP 2 · OPTIONAL", title: "A little more, if you like", sub: "Skip the whole page — it won't affect your entry." },
      eventQuestions: "About this event",
      pdpaNotice: "By confirming you accept the organiser's PDPA policy.",
      formLoading: "Opening the form…",
      types: ["General", "VIP", "Press"],
      consent: "I consent to the organiser storing my data under its PDPA policy.",
      next: "NEXT", skip: "SKIP", finish: "CONFIRM & GET QR",
      already: "Already registered?", lookupLink: "Open my QR",
      saving: "Saving to Google Sheet…",
      lookupTitle: "Find\nmy pass", lookupSub: "Enter the phone number you registered with — or your email — and we'll reopen the same QR.", lookupBtn: "FIND MY PASS",
      lookupPh: "08X XXX XXXX",
      done: "You're\nin!", passNote: "Show this QR at the door — staff print your lanyard badge on the spot. Close this page and you can reopen it any time with the phone number you registered.",
      kicker: "ENTRY PASS", eventDate: "Event date", gate: "Check-in point",
      doors: "Doors open", contact: "Registered phone",
      saveImg: "SAVE IMAGE", newReg: "Register someone else",
      blank: { name: "Please enter your name", email: "Please enter your email", phone: "Please enter your phone number" },
      err: { name: "Please enter your name", email: "Invalid email format", phone: "Enter a 9–10 digit number", requiredField: "This field is required", missingField: "Some required details are missing — please check the form.", busy: "The system is saving another registration. Please try again in a moment.", failed: "Couldn't save your registration. Please try again.", saveImg: "Couldn't save the image. Please try again.", notfound: "No registration found for that phone number or email.",
        dupPhone: "That phone number is already registered for this event — use “Open my QR” below to reopen the same pass.",
        dupEmail: "That email is already registered for this event — use “Open my QR” below to reopen the same pass.", eventClosed: "Registration opens later — check back soon.", network: "Couldn't reach the server. Please try again." },
      toastSaved: "Saved to Google Sheet", toastImg: "Badge image saved"
    }
  };

  const state = {
    lang: "th",
    screen: "pick", // pick | ask | sending | lookup | pass
    events: [], eventsLoading: true,
    // Codes, not sentences. Storing the translated text meant an error raised
    // in Thai stayed Thai after the customer pressed EN.
    eventsError: "",
    evIdx: 0,
    page: 1,
    fields: [], fieldsLoading: false, fieldsError: "",   // "" | "network"
    vals: {},
    errors: {},
    lookupTerm: "", lookupError: "", lookupBusy: false,   // lookupError: "" | "notfound"
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

  // What an event with no banner shows. A designed surface, not a fault: the
  // hatch swatch it replaces read as a broken image and its caption invited
  // people to drop a file on something that could never receive one.
  // The mark sits in the middle band on purpose — .hero-media-scrim darkens
  // the bottom and .hero-topshade the top 120px, so the middle is the only
  // part a surface actually gets to show. See ADR events-checkin-0024.
  function brandSurfaceHtml() {
    return `<div class="brand-surface" aria-hidden="true">
      <span class="bs-ghost">1N</span>
      <span class="bs-mark">1NEVE</span>
      <span class="bs-hair"></span>
    </div>`;
  }

  // Error codes become sentences at the moment of drawing, so the words always
  // match the language button as it stands now.
  function errText(code) {
    if (!code) return "";
    const c = t();
    if (code === "events") return c.pick.error;
    if (code === "notfound") return c.err.notfound;
    return c.err[code] || c.err.network;
  }

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
    // Old links mailed out before the pass email was dropped carry ?lookup=<email>.
    const lookupTerm = urlParams.get("lookup");

    await loadEvents();

    if (lookupTerm) {
      state.lookupTerm = lookupTerm;
      state.screen = "lookup";
      render();
      doLookup();
      return;
    }

    if (state.pass) state.screen = "pass";
    render();
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
      state.eventsError = "events";
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
      // Three situations that used to look identical: still loading, the
      // request failed, and the organiser has nothing open. The last one sat on
      // "loading…" for ever, because the request had in fact succeeded and
      // nothing was ever going to change the message.
      const failed = !!state.eventsError;
      const empty = !state.eventsLoading && !failed;
      const msg = failed ? errText(state.eventsError) : empty ? c.empty : c.loading;
      return `<div class="screen"><div class="screen-inner">
        <div class="pick-topbar"><div class="brandmark">${esc(BRAND)}</div>${langToggleHtml()}</div>
        <div class="pick-heading">
          <div class="pick-title">${esc(msg)}</div>
          ${empty ? `<div class="pick-sub">${esc(c.emptySub)}</div>` : ""}
          ${failed || empty ? `<div class="cta is-open" data-action="retry-events" style="margin-top:16px;max-width:160px">${esc(c.retry)}</div>` : ""}
        </div>
      </div></div>`;
    }

    const evs = state.events;

    const last = evs.length - 1;
    const sections = evs.map((e, i) => {
      const facts = [
        [c.facts[0], e.date], [c.facts[1], e.place], [c.facts[2], e.seats], [c.facts[3], e.price]
      ].filter(([, v]) => String(v === null || v === undefined ? "" : v).trim())
       .map(([k, v]) => `<div class="pick-fact"><span class="k">${esc(k)}</span><span>${esc(v)}</span></div>`).join("");
      // Goes straight into a style attribute, so it is quoted like the rest.
      const badgeBg = esc(e.open ? e.accent : "#ded8c6");
      const badgeFg = e.open ? "#fff" : "#57533f";
      // status_label is the wording for an open event. A closed one says so,
      // whatever the sheet holds — a grey pill still reading เปิดรับ is the
      // page contradicting its own disabled button.
      const badgeText = e.open ? (e.status || "เปิดรับ") : "ปิดรับแล้ว";
      return `<section class="hero-stage" data-hero-stage>
        <div class="hero-frame">
          <div class="hero-media">
            ${e.image ? `<img class="hero-img" src="${esc(e.image)}" alt="">` : brandSurfaceHtml()}
            <div class="hero-media-scrim"></div>
            <div class="hero-media-badge" style="background:${badgeBg};color:${badgeFg}">${esc(badgeText)}</div>
          </div>
          <div class="hero-topshade"></div>
          <div class="hero-content">
            <div class="hero-kicker">${esc((e.date || "").toUpperCase())}</div>
            <div class="hero-name">${esc(e.name)}</div>
            <div class="hero-place">${esc(e.place)}</div>
            <div class="pick-facts">${facts}</div>
            <div class="cta ${e.open ? "is-open" : "is-closed"}" data-action="hero-enter" data-idx="${i}">${esc(e.open ? c.cta : c.soon)}</div>
            ${i === last ? `<div class="lookup-link-row" data-action="go-lookup">${esc(t().already)} <span class="accent">${esc(t().lookupLink)}</span></div>` : ""}
          </div>
        </div>
      </section>`;
    }).join("");

    return `<div class="screen is-pick">
      <div class="pick-topbar"><div class="brandmark">${esc(BRAND)}</div>${langToggleHtml()}</div>
      ${sections}
    </div>`;
  }

  // Scroll-linked hero reveal. Each event owns a tall stage whose frame is
  // held to the viewport (CSS position:sticky) while that stage's scroll
  // length passes underneath. Scrolling stays 1:1 with the page the whole
  // time; what the scroll drives is the geometry inside the frame — the
  // banner growing from card to full screen, and the copy gliding up from
  // below it to in front of it. Nothing toggles: every value below is a
  // continuous function of the stage's own progress, which is what makes
  // the motion read as smooth rather than as a switch being thrown.
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

  // Pure helpers — no DOM access, so they stay checkable with plain `node -e`.
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function heroRadiusPx(p) {
    // Rises to 22px through the first 70% of the reveal, eases back to 0
    // through the last 30% — a rounded corner at true full-bleed would sit
    // on the literal edge of the screen and read as a bug.
    return p < 0.7 ? (p / 0.7) * 22 : 22 * (1 - (p - 0.7) / 0.3);
  }
  function mixRgb(c1, c2, t) {
    return "rgb(" + Math.round(lerp(c1[0], c2[0], t)) + "," +
                    Math.round(lerp(c1[1], c2[1], t)) + "," +
                    Math.round(lerp(c1[2], c2[2], t)) + ")";
  }

  const HERO_INK = [23, 21, 15], HERO_WHITE = [255, 255, 255], HERO_MUTED = [125, 119, 103];

  function onHeroScroll() {
    const stages = document.querySelectorAll("[data-hero-stage]");
    if (!stages.length) return;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const topbar = document.querySelector(".is-pick .pick-topbar");
    let topbarP = 0;

    stages.forEach(stage => {
      // Progress through this stage's own scroll length. 0 while the stage
      // is still below the fold, 1 once it has been scrolled through, so
      // each event reveals on its own as it comes up.
      const runway = Math.max(1, stage.offsetHeight - vh);
      const p = clamp01((window.scrollY - stage.offsetTop) / runway);

      const media = stage.querySelector(".hero-media");
      const content = stage.querySelector(".hero-content");
      if (!media || !content) return;

      // The banner: a centred card at rest, the whole viewport at the end.
      const restW = Math.min(440, vw) * 0.56;
      const restH = vh * 0.64;
      // frame-relative: at rest the frame already begins below the sticky
      // topbar, and once it sticks it owns the whole viewport
      const restTop = 30;
      const w = lerp(restW, vw, p);
      const h = lerp(restH, vh, p);
      const top = lerp(restTop, 0, p);
      media.style.width = w + "px";
      media.style.height = h + "px";
      media.style.left = ((vw - w) / 2) + "px";
      media.style.top = top + "px";
      media.style.borderRadius = Math.max(0, heroRadiusPx(p)) + "px";
      media.style.boxShadow = p > 0.92 ? "none" : "0 18px 40px rgba(23,21,15,.22)";

      const img = stage.querySelector(".hero-img");
      if (img) img.style.transform = "scale(" + (1.35 - p * 0.35) + ")";

      // The copy travels as one block: resting just below the card, ending
      // against the bottom of the full-screen banner.
      const blockH = content.offsetHeight;
      const copyTop = lerp(restTop + restH + 22, vh - 26 - blockH, p);
      content.style.top = copyTop + "px";

      // Colour follows how far the banner has actually covered the copy,
      // not the raw scroll position — so the text turns light exactly as it
      // crosses onto the photo rather than on a guessed cue.
      const over = clamp01(((top + h) - copyTop) / Math.max(1, blockH * 0.55));
      content.style.color = mixRgb(HERO_INK, HERO_WHITE, over);
      const place = content.querySelector(".hero-place");
      if (place) place.style.color = mixRgb(HERO_MUTED, HERO_WHITE, over);
      const lookup = content.querySelector(".lookup-link-row");
      if (lookup) lookup.style.color = mixRgb(HERO_MUTED, HERO_WHITE, over);
      content.querySelectorAll(".pick-fact").forEach(f => {
        f.style.borderBottomColor = over > 0
          ? "rgba(255,255,255," + lerp(0.08, 0.22, over) + ")"
          : "#ddd7c4";
        const k = f.firstElementChild;
        if (k) {
          k.style.color = mixRgb(HERO_MUTED, HERO_WHITE, over);
          k.style.opacity = lerp(1, 0.72, over);
        }
      });

      const shade = stage.querySelector(".hero-topshade");
      if (shade) shade.style.opacity = clamp01((p - 0.25) / 0.35);

      // The status pill sits at the banner's top-right, which becomes the
      // screen's top-right — where the language toggle already lives.
      const badge = stage.querySelector(".hero-media-badge");
      if (badge) badge.style.opacity = 1 - clamp01((p - 0.45) / 0.35);

      // The topbar reads against whichever stage currently fills the screen.
      const rect = stage.getBoundingClientRect();
      if (rect.top <= 0 && rect.bottom > 0) topbarP = p;
    });

    if (topbar) topbar.style.color = mixRgb(HERO_INK, HERO_WHITE, clamp01(topbarP * 2));
  }

  // ---------------------------------------------------------------------
  // Ask screen — 5-step form
  // ---------------------------------------------------------------------
  function renderAsk() {
    const c = t();
    const ev = state.events[state.evIdx];
    const banner = `<div class="ask-banner">
        ${ev.image ? `<img class="ask-banner-img" src="${esc(ev.image)}" alt="">` : brandSurfaceHtml()}
        <div class="ask-banner-scrim"></div>
        <div class="ask-banner-info">
          <div class="ask-banner-meta">${esc((ev.date || "") + " · " + (ev.place || ""))}</div>
          <div class="ask-banner-name">${esc(ev.name)}</div>
        </div>
      </div>`;

    if (state.fieldsLoading || state.fieldsError) {
      return `<div class="screen"><div class="screen-inner">
        ${banner}
        <div class="ask-topbar">
          <div class="change-event" data-action="go-pick">← ${state.lang === "en" ? "Change event" : "เปลี่ยนงาน"}</div>
          ${langToggleHtml()}
        </div>
        <div class="ask-body">
          <div class="ask-title">${esc(state.fieldsError ? errText(state.fieldsError) : c.formLoading)}</div>
          ${state.fieldsError ? `<div class="cta is-open" data-action="retry-form" style="max-width:160px">${esc(c.pick.retry)}</div>` : ""}
        </div>
      </div></div>`;
    }

    // The event's own Fields sheet decides both the questions and the split:
    // ticked rows make the first page, un-ticked rows the second.
    const required = state.fields.filter(f => f.required);
    const optional = state.fields.filter(f => !f.required);
    const hasOptional = optional.length > 0;
    const onFirst = state.page === 1;
    const list = onFirst ? required : optional;
    const submits = !onFirst || !hasOptional;
    const meta = onFirst ? c.askP1 : c.askP2;
    const pageCount = hasOptional ? 2 : 1;

    const ticks = Array.from({ length: pageCount }, (_, k) =>
      `<div class="tick ${k < state.page ? "is-done" : ""}"></div>`).join("");

    const core = { name: 1, email: 1, phone: 1, org: 1 };
    let sawEventQuestion = false;
    const fieldsHtml = list.map(f => {
      // On the optional page the event's own questions are marked off from
      // the fields the site itself asks for, so it reads as the organiser
      // asking rather than more of the same form.
      let divider = "";
      if (!onFirst && !core[f.key] && !sawEventQuestion) {
        sawEventQuestion = true;
        divider = `<div class="ask-divider">${esc(c.eventQuestions)}</div>`;
      }
      const label = (c.fieldLabels && c.fieldLabels[f.key]) || f.label || f.key;
      const ph = (c.fieldPh && c.fieldPh[f.key]) || "";
      const mode = f.type === "EMAIL" ? "email" : f.type === "PHONE" ? "tel" : "text";
      const err = state.errors[f.key] || "";
      const chips = f.key === "email"
        ? `<div class="chips">${(c.emailChips || []).map(l =>
            `<div class="chip" data-action="chip" data-label="${esc(l)}">${esc(l)}</div>`).join("")}</div>`
        : "";
      return `${divider}<div class="ff ${err ? "is-bad" : ""}">
        <label class="ff-label">${esc(label)}${f.required ? ` <span class="ff-req">*</span>` : ""}</label>
        <div class="ff-line"><input class="ff-input" data-field="${esc(f.key)}" type="${mode}" value="${esc(state.vals[f.key] || "")}" placeholder="${esc(ph)}" autocomplete="${f.key === "name" ? "name" : f.key === "email" ? "email" : f.key === "phone" ? "tel" : "off"}"></div>
        <div class="ff-msg">${esc(err)}</div>
        ${chips}
      </div>`;
    }).join("");

    const pdpa = (submits && ev.pdpa)
      ? `<div class="pdpa-note">${esc(c.pdpaNotice)}</div>` : "";

    return `<div class="screen"><div class="screen-inner">
      ${banner}
      <div class="ask-topbar">
        <div class="change-event" data-action="go-pick">← ${state.lang === "en" ? "Change event" : "เปลี่ยนงาน"}</div>
        <div class="ask-topbar-right">
          <div class="ticks">${ticks}</div>
          ${langToggleHtml()}
        </div>
      </div>
      <div class="ask-body">
        <div class="ask-head">
          <div class="ask-eyebrow">${esc(meta.eyebrow)}</div>
          <div class="ask-title">${esc(meta.title)}</div>
          <div class="ask-sub">${esc(meta.sub)}</div>
        </div>
        <div class="ask-fields">${fieldsHtml}</div>
      </div>
      <div class="ask-actions">
        <div class="back-btn" data-action="back">←</div>
        <div class="next-btn" data-action="next">${esc(submits ? c.finish : c.next)}</div>
      </div>
      ${pdpa}
      <div class="already-row">${esc(c.already)} <span class="accent" data-action="go-lookup">${esc(c.lookupLink)}</span></div>
    </div></div>`;
  }

  async function loadForm(eventId) {
    try {
      const res = await window.Api.getEventForm(eventId);
      // A slow answer for an event the customer has since navigated away from
      // would otherwise paint that event's questions onto this one's form.
      if (currentEventId() !== eventId) return;
      if (!res.ok) throw new Error(res.error || "form_failed");
      const fields = (res.data || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
      if (!fields.length) throw new Error("empty_form");
      const vals = {};
      fields.forEach(f => { vals[f.key] = ""; });
      setState({ fields, vals, fieldsLoading: false, fieldsError: "" });
    } catch (e) {
      if (currentEventId() !== eventId) return;
      setState({ fieldsLoading: false, fieldsError: "network" });
    }
  }

  function currentEventId() {
    const ev = state.events[state.evIdx];
    return ev ? ev.id : null;
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
      <div class="brandmark">${esc(BRAND)}</div>
      <div class="lookup-body">
        <div class="lookup-title">${esc(nl2sp(c.lookupTitle))}</div>
        <div class="lookup-sub">${esc(c.lookupSub)}</div>
        <div class="lookup-underline">
          <input class="lookup-input" id="lookup-input" type="text" inputmode="tel" value="${esc(state.lookupTerm)}" placeholder="${esc(c.lookupPh)}" autocomplete="off" />
        </div>
        <div class="lookup-error">${esc(errText(state.lookupError))}</div>
      </div>
      <div class="lookup-actions">
        <div class="back-btn" data-action="go-pick">←</div>
        <div class="lookup-submit" data-action="do-lookup">${state.lookupBusy ? "…" : esc(c.lookupBtn)}</div>
      </div>
    </div></div>`;
  }

  // The three standard types are translated; anything else the organiser has
  // typed is shown as they wrote it. Falling back to index 0 printed "ทั่วไป"
  // on a speaker's badge and said nothing about it.
  function typeLabelFor(pass) {
    for (const l of ["th", "en"]) {
      const i = COPY[l].types.indexOf(pass.type);
      if (i >= 0) return t().types[i];
    }
    return pass.type || t().types[0];
  }

  // What a pass knows about its own event. Registration and lookup now send
  // these along, so a pass keeps working after its event is hidden from the
  // customer list — but a pass saved before that change carries none of them,
  // and the live event list is the fallback.
  function passEvent(p) {
    const live = state.events.find(e => e.id === p.eventId);
    return {
      name: p.eventName || (live && live.name) || "",
      date: p.eventDate || (live && live.date) || "",
      place: p.eventPlace || (live && live.place) || "",
      doors: p.eventDoors || (live && live.doors) || ""
    };
  }

  function renderPass() {
    const c = t();
    const p = state.pass;
    const ev = passEvent(p);
    const typeLabel = typeLabelFor(p).toUpperCase();
    // Only rows there is an answer for. A heading with nothing under it tells
    // the customer nothing and reads as something that failed to load.
    const facts = [
      [c.eventDate, ev.date], [c.gate, ev.place],
      [c.doors, ev.doors], [c.contact, p.phone]
    ].filter(pair => pair[1])
     .map(pair => `<div class="pass-fact"><span class="k">${esc(pair[0])}</span><span>${esc(pair[1])}</span></div>`)
     .join("");
    return `<div class="pass-screen"><div class="pass-inner">
      <div class="pass-topbar"><div class="pass-brandmark">${esc(BRAND)}</div>${langToggleHtml()}</div>
      <div>
        <div class="done-title">${esc(nl2sp(c.done))}</div>
        <div class="pass-note">${esc(c.passNote)}</div>
      </div>
      <div class="badge-card">
        <div class="badge-top">
          <div style="min-width:0">
            <div class="badge-kicker">${esc(c.kicker)} · ${esc(ev.name)}</div>
            <div class="badge-name">${esc(p.name)}</div>
            <div class="badge-org">${esc(p.org)}</div>
          </div>
          <div class="badge-type">${esc(typeLabel)}</div>
        </div>
        <div class="badge-qr">${window.renderQrSvg(p.qrPayload)}</div>
        <div class="badge-bottom">
          <div class="badge-code">${esc(p.code)}</div>
          <div class="badge-date">${esc(ev.date)}</div>
        </div>
      </div>
      <div class="pass-facts">${facts}</div>
      <div class="pass-buttons">
        <div class="save-btn" data-action="save-img">${esc(c.saveImg)}</div>
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

    app.querySelectorAll("[data-field]").forEach(input => {
      const key = input.dataset.field;
      input.addEventListener("input", e => {
        // written straight to state, never through setState — re-rendering
        // mid-keystroke would tear the focus out of the field being typed in
        state.vals[key] = e.target.value;
        if (state.errors[key]) {
          state.errors[key] = "";
          const ff = input.closest(".ff");
          if (ff) {
            ff.classList.remove("is-bad");
            const msg = ff.querySelector(".ff-msg");
            if (msg) msg.textContent = "";
          }
        }
      });
      input.addEventListener("keydown", e => { if (e.key === "Enter") next(); });
    });

    const lookupInput = document.getElementById("lookup-input");
    if (lookupInput) {
      lookupInput.focus();
      lookupInput.addEventListener("input", e => {
        state.lookupTerm = e.target.value;
        state.lookupError = "";
        const errorEl = app.querySelector(".lookup-error");
        if (errorEl) errorEl.textContent = "";
      });
      lookupInput.addEventListener("keydown", e => { if (e.key === "Enter") doLookup(); });
    }
  }

  function handleAction(action, el) {
    switch (action) {
      case "lang": setState({ lang: el.dataset.lang, errors: {} }); break;
      case "retry-events": loadEvents(); break;
      case "retry-form": {
        const ev = state.events[state.evIdx];
        if (!ev) break;
        setState({ fieldsLoading: true, fieldsError: "" });
        loadForm(ev.id);
        break;
      }
      case "hero-enter": {
        const idx = Number(el.dataset.idx);
        const ev = state.events[idx];
        if (!ev) break;
        if (!ev.open) { flash(t().err.eventClosed); break; }
        setState({ screen: "ask", evIdx: idx, page: 1, errors: {}, vals: {}, fields: [], fieldsLoading: true, fieldsError: "" });
        loadForm(ev.id);
        break;
      }
      case "go-lookup": setState({ screen: "lookup", lookupError: "" }); break;
      case "go-pick": setState({ screen: "pick" }); break;
      case "chip": {
        const base = (state.vals.email || "").split("@")[0];
        state.vals.email = base + el.dataset.label;
        state.errors.email = "";
        render();
        break;
      }
      case "back": back(); break;
      case "next": next(); break;
      case "do-lookup": doLookup(); break;
      case "save-img": saveBadgeImage(); break;
      case "reset": resetAll(); break;
    }
  }

  // One field's verdict. Format rules only bite once something is typed, so
  // an optional email left blank is fine while a malformed one is not.
  function fieldError(f) {
    const c = t(), v = (state.vals[f.key] || "").trim();
    if (!v) return f.required ? ((c.blank && c.blank[f.key]) || c.err.requiredField) : "";
    if (f.type === "EMAIL" && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v)) return c.err.email;
    if (f.type === "PHONE" && v.replace(/\D/g, "").length < 9) return c.err.phone;
    return "";
  }

  // Every field on the page is judged at once, so the customer sees
  // everything that needs fixing in one pass rather than one screen at a time.
  function pageErrors(list) {
    const errors = {};
    list.forEach(f => { const e = fieldError(f); if (e) errors[f.key] = e; });
    return errors;
  }

  function next() {
    const required = state.fields.filter(f => f.required);
    const optional = state.fields.filter(f => !f.required);
    const list = state.page === 1 ? required : optional;
    const errors = pageErrors(list);
    if (Object.keys(errors).length) { setState({ errors }); return; }
    if (state.page === 1 && optional.length) { setState({ page: 2, errors: {} }); return; }
    submit();
  }

  function back() {
    if (state.page === 2) { setState({ page: 1, errors: {} }); return; }
    setState({ screen: "pick", errors: {} });
  }

  async function submit() {
    const c = t();
    setState({ screen: "sending" });
    const ev = state.events[state.evIdx];
    // Anything beyond the four the Registrations sheet has columns for goes
    // into answers, which the backend stores as answers_json.
    const core = { name: 1, email: 1, phone: 1, org: 1 };
    const answers = {};
    state.fields.forEach(f => {
      if (core[f.key]) return;
      answers[f.key] = (state.vals[f.key] || "").trim();
    });
    const val = k => (state.vals[k] || "").trim();
    try {
      const res = await window.Api.register({
        eventId: ev.id,
        name: val("name"), email: val("email"),
        phone: val("phone"), org: val("org"),
        // Tapping the confirm button is the consenting act, and it is only
        // asked for where the event actually shows the notice.
        consent: !!ev.pdpa,
        answers
      });
      if (!res.ok) throw new Error(res.error || "register_failed");
      const d = res.data;
      const pass = {
        name: d.name, email: d.email, phone: d.phone,
        org: d.org || (state.lang === "en" ? "Individual" : "ผู้เข้าร่วมทั่วไป"),
        type: d.type, code: d.badgeCode, qrPayload: d.qrPayload,
        eventId: d.eventId, eventName: d.eventName,
        eventDate: d.eventDate, eventPlace: d.eventPlace, eventDoors: d.eventDoors
      };
      try { localStorage.setItem(PASS_KEY, JSON.stringify(pass)); } catch (e) { /* ignore */ }
      state.pass = pass;
      state.screen = "pass";
      render();
      flash(c.toastSaved);
    } catch (e) {
      setState({ screen: "ask" });
      flash(registerErrorMessage(e, c));
    }
  }

  // Everything the server can refuse a registration for used to surface as
  // "couldn't reach the server", so a customer whose email the server dislikes
  // was told to check their connection and retried forever.
  function registerErrorMessage(e, c) {
    var code = String((e && e.message) || "");
    if (code === "invalid_email") return c.err.email;
    if (code === "invalid_phone") return c.err.phone;
    if (code === "invalid_name") return c.err.name;
    if (code === "phone_already_registered") return c.err.dupPhone;
    if (code === "email_already_registered") return c.err.dupEmail;
    if (code === "event_closed") return c.err.eventClosed;
    if (code === "consent_required") return c.err.missingField;
    if (code.indexOf("missing_") === 0) return c.err.missingField;
    if (code === "busy") return c.err.busy;
    if (code === "register_failed") return c.err.failed;
    // A genuine transport failure has no server code to read — TypeError from
    // fetch, or an empty body.
    return c.err.network;
  }

  // Draws the badge onto a canvas rather than rasterising the DOM: no
  // library, and the page's own font is available to fillText once
  // document.fonts has settled.
  async function badgeBlob(pass) {
    const ev = passEvent(pass);
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (e) { /* font API is optional */ }
    }
    const qr = qrcode(0, "M");
    qr.addData(String(pass.qrPayload));
    qr.make();
    const n = qr.getModuleCount();

    const SCALE = 3, W = 440, PAD = 22, HEAD = 104, FOOT = 56;
    const qrSize = W - PAD * 2;
    const H = PAD + HEAD + qrSize + FOOT + PAD;
    const cv = document.createElement("canvas");
    cv.width = W * SCALE;
    cv.height = H * SCALE;
    const x = cv.getContext("2d");
    x.scale(SCALE, SCALE);

    x.fillStyle = "#f4f1e6";
    x.fillRect(0, 0, W, H);

    const type = typeLabelFor(pass).toUpperCase();
    x.textBaseline = "alphabetic";
    x.fillStyle = "#d8482b";
    x.font = "600 11px Prompt, sans-serif";
    x.textAlign = "right";
    x.fillText(type, W - PAD, PAD + 14);

    x.textAlign = "left";
    x.fillStyle = "#8a8474";
    x.font = "500 9.5px Prompt, sans-serif";
    x.fillText((t().kicker + " · " + ev.name).toUpperCase(), PAD, PAD + 14);

    x.fillStyle = "#17150f";
    x.font = "600 22px Prompt, sans-serif";
    x.fillText(pass.name || "", PAD, PAD + 46);

    x.fillStyle = "#7d7767";
    x.font = "400 12px Prompt, sans-serif";
    x.fillText(pass.org || "", PAD, PAD + 68);

    const qrTop = PAD + HEAD;
    const cell = qrSize / n;
    x.fillStyle = "#17150f";
    for (let r = 0; r < n; r++) {
      for (let col = 0; col < n; col++) {
        if (qr.isDark(r, col)) {
          // ceil the cell so neighbouring modules meet with no seam
          x.fillRect(PAD + col * cell, qrTop + r * cell, Math.ceil(cell), Math.ceil(cell));
        }
      }
    }

    const footTop = qrTop + qrSize + 18;
    x.strokeStyle = "#d6d0bd";
    x.lineWidth = 1;
    x.beginPath();
    x.moveTo(PAD, footTop);
    x.lineTo(W - PAD, footTop);
    x.stroke();

    x.fillStyle = "#17150f";
    x.font = "600 14px Prompt, sans-serif";
    x.fillText(pass.code || "", PAD, footTop + 24);

    x.fillStyle = "#6f6a5a";
    x.font = "500 10px Prompt, sans-serif";
    x.textAlign = "right";
    x.fillText(ev.date, W - PAD, footTop + 24);

    return new Promise((resolve, reject) => {
      cv.toBlob(b => b ? resolve(b) : reject(new Error("toBlob_failed")), "image/png");
    });
  }

  async function saveBadgeImage() {
    const c = t(), pass = state.pass;
    if (!pass) return;

    let blob;
    try {
      blob = await badgeBlob(pass);
    } catch (e) {
      flash(c.err.saveImg);
      return;
    }
    const name = "entry-pass-" + (pass.code || "badge") + ".png";

    // iOS Safari ignores a programmatic download click, and the share sheet is
    // the path that offers Save to Photos there. Only the customer dismissing
    // it counts as done — every other failure falls through to the download
    // below rather than leaving them with nothing and no message.
    try {
      const file = new File([blob], name, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        flash(c.toastImg);
        return;
      }
    } catch (e) {
      if (e && e.name === "AbortError") return;
    }

    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      flash(c.toastImg);
    } catch (e) {
      flash(c.err.saveImg);
    }
  }

  function looksLikeLookup(v) {
    const s = String(v || "").trim();
    if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(s)) return s.toLowerCase();
    return s.replace(/\D/g, "").length >= 9 ? s : "";
  }

  async function doLookup() {
    const c = t();
    const term = looksLikeLookup(state.lookupTerm);
    if (!term) { setState({ lookupError: "notfound" }); return; }
    state.lookupBusy = true;
    render();
    try {
      const res = await window.Api.getMyPass(term);
      if (!res.ok) throw new Error(res.error || "not_found");
      const d = res.data;
      const pass = {
        name: d.name, email: d.email, phone: d.phone, org: d.org,
        type: d.type, code: d.badgeCode, qrPayload: d.qrPayload,
        eventId: d.eventId, eventName: d.eventName,
        eventDate: d.eventDate, eventPlace: d.eventPlace, eventDoors: d.eventDoors
      };
      try { localStorage.setItem(PASS_KEY, JSON.stringify(pass)); } catch (e) { /* ignore */ }
      state.pass = pass;
      state.screen = "pass";
      state.lookupBusy = false;
      render();
    } catch (e) {
      state.lookupBusy = false;
      setState({ lookupError: "notfound" });
    }
  }

  function resetAll() {
    try { localStorage.removeItem(PASS_KEY); } catch (e) { /* ignore */ }
    setState({
      screen: "pick", page: 1, vals: {}, errors: {},
      fields: [], fieldsLoading: false, fieldsError: "", pass: null
    });
  }

  init();
})();
