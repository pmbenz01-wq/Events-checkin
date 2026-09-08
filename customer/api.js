// Thin client for the Apps Script backend (see the staff-console repo's backend/Code.gs).
//
// POST bodies are sent as text/plain (containing JSON) rather than
// application/json, and GETs use a plain query string — both are CORS
// "simple requests" that skip the preflight OPTIONS call Apps Script Web
// Apps can't answer.
window.Api = (function () {
  function url() { return window.APP_CONFIG.API_URL; }

  async function get(params) {
    const u = new URL(url());
    Object.keys(params || {}).forEach(k => u.searchParams.set(k, params[k]));
    const res = await fetch(u.toString(), { method: "GET" });
    return res.json();
  }

  async function post(params) {
    const res = await fetch(url(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(params)
    });
    return res.json();
  }

  return {
    listEvents: () => get({ action: "listEvents" }),
    getEventForm: eventId => get({ action: "getEventForm", eventId }),
    register: p => post(Object.assign({ action: "register" }, p)),
    getMyPass: email => get({ action: "getMyPass", email })
  };
})();
