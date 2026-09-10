// Thin client for the Apps Script backend (see the staff-console repo's backend/Code.gs).
//
// POST bodies are sent as text/plain (containing JSON) rather than
// application/json, and GETs use a plain query string — both are CORS
// "simple requests" that skip the preflight OPTIONS call Apps Script Web
// Apps can't answer.
window.Api = (function () {
  function url() { return window.APP_CONFIG.API_URL; }

  // Apps Script under load has been measured stalling for 38 and 48 seconds
  // and then answering with an HTML error page instead of JSON. With no
  // deadline the customer simply watched a spinner for the whole of it, which
  // is exactly what happens at the moment a queue of people is registering at
  // once. Giving up at 30s turns an unbounded wait into a message they can act
  // on, and the retry button is already on every screen that calls this.
  const TIMEOUT_MS = 30000;

  async function withDeadline(run) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await run(ctrl.signal);
      // An HTML error page parses as neither JSON nor anything useful; say so
      // in the same voice as a dropped connection rather than throwing a
      // SyntaxError nobody upstream knows how to read.
      const text = await res.text();
      try { return JSON.parse(text); } catch (e) { throw new Error("bad_response"); }
    } finally {
      clearTimeout(timer);
    }
  }

  async function get(params) {
    const u = new URL(url());
    Object.keys(params || {}).forEach(k => u.searchParams.set(k, params[k]));
    return withDeadline(signal => fetch(u.toString(), { method: "GET", signal }));
  }

  async function post(params) {
    return withDeadline(signal => fetch(url(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(params),
      signal
    }));
  }

  return {
    listEvents: () => get({ action: "listEvents" }),
    getEventForm: eventId => get({ action: "getEventForm", eventId }),
    register: p => post(Object.assign({ action: "register" }, p)),
    // Phone or email — the server decides which it is looking at.
    getMyPass: term => get({ action: "getMyPass", q: term })
  };
})();
