// Shared real-time store for the event check-in system.
// Both the customer page and the staff console read/write through this module.
// Persistence: localStorage (stands in for the Google Sheet).
// Live sync: BroadcastChannel + storage events, so every open tab/device view
// updates within the same tick a write happens.

const KEY = "tt-evsys-v1";
const CH = "tt-evsys";

const NAMES = ["ณัฐพงษ์ สุวรรณเลิศ", "พิมพ์ชนก วราภรณ์", "กิตติภพ ธนะโชติ", "ศิรินทรา บุญมาก", "ธนกฤต อารีวงศ์", "ปวีณา จันทรเกษม", "อรรถพล ศรีสมบูรณ์", "ชนิดาภา เกียรติกุล", "วรินทร ทองประเสริฐ", "เมธาวี ปิยะวัฒน์", "สุทธิพงษ์ แก้วมณี", "ญาณิศา รัตนพล"];
const MAILS = ["nattapong.s", "pimchanok.w", "kittipop.t", "sirintra.b", "thanakrit.a", "paveena.j", "atthaphon.s", "chanidapa.k", "warintorn.t", "methawee.p", "sutthipong.k", "yanisa.r"];
const DOMAINS = ["corp.co.th", "siamdigital.com", "oceanworks.io", "gmail.com", "utech.ac.th", "energyone.co"];
const ORGS = ["บริษัท คอร์ปเทค จำกัด", "สยามดิจิทัล กรุ๊ป", "โอเชียนเวิร์คส์", "ฟรีแลนซ์", "มหาวิทยาลัยเทคโนโลยี", "เอ็นเนอร์จีวัน"];
const CREW = ["พิมพ์ชนก ว.", "ธนกฤต อ.", "ญาณิศา ร."];
const GATES = ["ประตู A", "ประตู B", "ประตู A"];

const baseFields = extra => [
  { label: "ชื่อ–นามสกุล", type: "TEXT", req: true },
  { label: "อีเมล", type: "EMAIL", req: true },
  { label: "เบอร์โทรศัพท์", type: "PHONE", req: true },
  ...(extra || [])
];

function seed() {
  const mk = (prefix, n, checked, dayOffset) => Array.from({ length: n }, (_, i) => {
    const isIn = i < checked;
    const who = i % 3;
    return {
      id: prefix + i,
      name: NAMES[i % NAMES.length],
      email: MAILS[i % MAILS.length] + "@" + DOMAINS[i % DOMAINS.length],
      phone: "08" + (i % 9) + " " + (312 + i * 7) % 1000 + " " + (4100 + i * 13) % 10000,
      org: ORGS[i % ORGS.length],
      code: prefix.toUpperCase() + "-" + (4000 + i * 137).toString(16).toUpperCase() + "-" + (901 + i),
      type: i % 7 === 0 ? "VIP" : i % 5 === 0 ? "สื่อ" : "ทั่วไป",
      answers: {},
      source: "online",
      walkin: false,
      registeredAt: iso(-(dayOffset || 3), 9 + (i % 8), (i * 7) % 60),
      checkedIn: isIn,
      by: isIn ? CREW[who] : null,
      gate: isIn ? GATES[who] : null,
      at: isIn ? iso(0, 9, 12 + i * 3) : null
    };
  });

  const events = [
    { id: "tt", name: "ThinkTech Summit 2026", date: "18–19 ธ.ค. 2569", place: "ไบเทค บางนา · ฮอลล์ 2", short: "THINKTECH SUMMIT · 2026", theme: "editorial", accent: "#d8482b", open: true, seats: "เหลือ 240 ที่", price: "ไม่มีค่าใช้จ่าย", status: "เปิดรับ", scrim: "mid", fields: baseFields([{ label: "บริษัท / องค์กร", type: "TEXT", req: false }]), att: mk("tt", 12, 7, 6) },
    { id: "gala", name: "Annual Partner Gala", date: "24 ธ.ค. 2569", place: "ดุสิตธานี · แกรนด์บอลรูม", short: "PARTNER GALA · 2026", theme: "brass", accent: "#a8874f", open: true, seats: "เหลือ 32 ที่", price: "ตามบัตรเชิญ", status: "เชิญเท่านั้น", scrim: "mid", fields: baseFields([{ label: "ข้อจำกัดด้านอาหาร", type: "SELECT", req: false }]), att: mk("gl", 8, 2, 4) },
    { id: "lab", name: "Founder Lab · รุ่น 4", date: "9 ม.ค. 2570", place: "ทองหล่อ · ชั้น 6", short: "FOUNDER LAB · 04", theme: "forest", accent: "#2f6b4f", open: true, seats: "เหลือ 18 ที่", price: "2,500 บาท", status: "เปิดรับ", scrim: "mid", fields: baseFields([{ label: "ตำแหน่งงาน", type: "TEXT", req: true }]), att: mk("fl", 6, 0, 2) },
    { id: "roadshow", name: "Regional Roadshow", date: "22 ก.พ. 2570", place: "เชียงใหม่ · เซ็นทรัลเฟส", short: "REGIONAL ROADSHOW", theme: "ink", accent: "#2f4d8c", open: false, seats: "ยังไม่เปิดรับ", price: "ไม่มีค่าใช้จ่าย", status: "เร็ว ๆ นี้", scrim: "mid", fields: baseFields(), att: [] }
  ];

  const checkins = [];
  const log = [];
  events.forEach(ev => ev.att.filter(a => a.checkedIn).forEach(a => {
    checkins.push({ scanId: "s" + checkins.length, eventId: ev.id, regId: a.id, badgeCode: a.code, name: a.name, scannedAt: a.at, scannedBy: a.by, gate: a.gate, device: "STAFF-0" + (1 + checkins.length % 3), result: "ok" });
    log.push({ time: shortTime(a.at), text: a.by + " เช็คอิน " + a.name + " ที่" + a.gate, eventId: ev.id });
  }));

  return {
    v: 1,
    events,
    checkins,
    log: log.slice(-8).reverse(),
    crew: [
      { name: "พิมพ์ชนก ว.", email: "pimchanok@thinktech.co.th", role: "ADMIN", gate: "ประตู A", scope: "ทุก Event", online: true },
      { name: "ธนกฤต อ.", email: "thanakrit@thinktech.co.th", role: "STAFF", gate: "ประตู B", scope: "ThinkTech Summit", online: true },
      { name: "ญาณิศา ร.", email: "yanisa@thinktech.co.th", role: "STAFF", gate: "ประตู A", scope: "ThinkTech Summit", online: true },
      { name: "วรินทร ท.", email: "warintorn@partner.co", role: "VIEWER", gate: "—", scope: "Founder Lab", online: false }
    ],
    badge: { size: "A6", logo: true, org: true, type: true, qr: true, bar: true },
    updatedAt: new Date().toISOString()
  };
}

function iso(dayOffset, h, m) {
  const d = new Date();
  d.setDate(d.getDate() + (dayOffset || 0));
  d.setHours(h || 9, m || 0, 0, 0);
  return d.toISOString();
}
function shortTime(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}
export function timeOf(isoStr) { return shortTime(isoStr); }
export function dateOf(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + d.getFullYear();
}

let state = null;
const subs = new Set();
let chan = null;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.events) return parsed;
    }
  } catch (e) { }
  return seed();
}

function persist(silent) {
  state.updatedAt = new Date().toISOString();
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { }
  if (!silent && chan) { try { chan.postMessage({ t: "sync", at: state.updatedAt }); } catch (e) { } }
  subs.forEach(fn => fn(state));
}

export function init() {
  if (state) return state;
  state = load();
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { }
  if (typeof BroadcastChannel !== "undefined") {
    chan = new BroadcastChannel(CH);
    chan.onmessage = () => { state = load(); subs.forEach(fn => fn(state)); };
  }
  window.addEventListener("storage", e => {
    if (e.key !== KEY) return;
    state = load();
    subs.forEach(fn => fn(state));
  });
  return state;
}

export function get() { return state || init(); }
export function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
export function lastSync() { return get().updatedAt; }

export function update(mutator) {
  const s = get();
  mutator(s);
  persist();
  return s;
}

export function eventById(id) { return get().events.find(e => e.id === id); }

export function addEvent(ev) {
  return update(s => {
    s.events.push({
      id: ev.id, name: ev.name, date: ev.date || "ยังไม่กำหนดวัน", place: ev.place || "",
      short: ev.name.toUpperCase(), theme: ev.theme || "editorial", accent: ev.accent || "#d8482b",
      open: true, seats: "เปิดรับแล้ว", price: ev.price || "ไม่มีค่าใช้จ่าย", status: "เปิดรับ", scrim: "mid",
      fields: baseFields(), att: []
    });
    s.log = [{ time: shortTime(new Date().toISOString()), text: (ev.actor || "เจ้าหน้าที่") + " สร้างงานใหม่ · " + ev.name, eventId: ev.id }, ...s.log].slice(0, 8);
  });
}

export function register(eventId, person) {
  const code = eventId.toUpperCase().slice(0, 4) + "-" + Math.random().toString(16).slice(2, 6).toUpperCase() + "-" + (900 + Math.floor(Math.random() * 99));
  const reg = {
    id: "r" + Date.now().toString(36),
    name: person.name, email: person.email, phone: person.phone || "—",
    org: person.org || "—", type: person.type || "ทั่วไป", answers: person.answers || {},
    code, source: person.source || "online", walkin: person.source === "walkin",
    registeredAt: new Date().toISOString(),
    checkedIn: false, by: null, gate: null, at: null
  };
  update(s => {
    const ev = s.events.find(e => e.id === eventId);
    if (!ev) return;
    ev.att.unshift(reg);
    s.log = [{ time: shortTime(reg.registeredAt), text: (person.source === "walkin" ? (person.actor || "เจ้าหน้าที่") + " เพิ่ม Walk-in · " : "ลงทะเบียนออนไลน์ · ") + reg.name, eventId }, ...s.log].slice(0, 8);
  });
  return reg;
}

// First scan wins. A later scan of the same badge returns result "duplicate"
// with the original scanner's name, mirroring the Apps Script LockService flow.
export function checkin(eventId, badgeCode, staff) {
  const s = get();
  const ev = s.events.find(e => e.id === eventId);
  if (!ev) return { result: "not_found" };
  const reg = ev.att.find(a => a.code === badgeCode);
  if (!reg) {
    update(st => {
      st.checkins.unshift({ scanId: "s" + Date.now().toString(36), eventId, regId: null, badgeCode, name: "— ไม่พบรหัสนี้ —", scannedAt: new Date().toISOString(), scannedBy: staff.name, gate: staff.gate, device: staff.device || "STAFF-01", result: "not_found" });
    });
    return { result: "not_found" };
  }
  const already = reg.checkedIn;
  const at = new Date().toISOString();
  update(st => {
    const e = st.events.find(x => x.id === eventId);
    const r = e.att.find(a => a.code === badgeCode);
    if (!already) { r.checkedIn = true; r.by = staff.name; r.gate = staff.gate; r.at = at; }
    st.checkins.unshift({ scanId: "s" + Date.now().toString(36), eventId, regId: r.id, badgeCode, name: r.name, scannedAt: at, scannedBy: staff.name, gate: staff.gate, device: staff.device || "STAFF-01", result: already ? "duplicate" : "ok" });
    const crew = st.crew.find(c => c.name === staff.name);
    if (crew && !already) crew.scans = (crew.scans || 0) + 1;
    st.log = [{ time: shortTime(at), text: already ? staff.name + " สแกนซ้ำ · " + r.name : staff.name + " เช็คอิน " + r.name + " ที่" + staff.gate, eventId }, ...st.log].slice(0, 8);
  });
  const fresh = eventById(eventId).att.find(a => a.code === badgeCode);
  return {
    result: already ? "duplicate" : "ok",
    reg: fresh,
    firstBy: fresh.by, firstAt: fresh.at, firstGate: fresh.gate
  };
}

export function setCheckedIn(eventId, regId, on, staff) {
  const at = new Date().toISOString();
  update(s => {
    const ev = s.events.find(e => e.id === eventId);
    const r = ev && ev.att.find(a => a.id === regId);
    if (!r) return;
    if (on) { r.checkedIn = true; r.by = staff.name; r.gate = staff.gate; r.at = at; s.checkins.unshift({ scanId: "s" + Date.now().toString(36), eventId, regId, badgeCode: r.code, name: r.name, scannedAt: at, scannedBy: staff.name, gate: staff.gate, device: "MANUAL", result: "ok" }); }
    else { r.checkedIn = false; r.by = null; r.gate = null; r.at = null; s.checkins.unshift({ scanId: "s" + Date.now().toString(36), eventId, regId, badgeCode: r.code, name: r.name, scannedAt: at, scannedBy: staff.name, gate: staff.gate, device: "MANUAL", result: "undo" }); }
    s.log = [{ time: shortTime(at), text: staff.name + (on ? " เช็คอิน " : " ยกเลิกเช็คอิน ") + r.name, eventId }, ...s.log].slice(0, 8);
  });
}

export function removeAttendee(eventId, regId, staff) {
  update(s => {
    const ev = s.events.find(e => e.id === eventId);
    if (!ev) return;
    const r = ev.att.find(a => a.id === regId);
    ev.att = ev.att.filter(a => a.id !== regId);
    if (r) s.log = [{ time: shortTime(new Date().toISOString()), text: staff.name + " ลบข้อมูล " + r.name, eventId }, ...s.log].slice(0, 8);
  });
}

export function setFields(eventId, fields) {
  update(s => { const ev = s.events.find(e => e.id === eventId); if (ev) ev.fields = fields; });
}
export function setEventProp(eventId, patch) {
  update(s => { const ev = s.events.find(e => e.id === eventId); if (ev) Object.assign(ev, patch); });
}
export function setBadge(patch) {
  update(s => { s.badge = { ...s.badge, ...patch }; });
}

export function csv(eventId) {
  const ev = eventById(eventId);
  const head = ["reg_id", "badge_code", "full_name", "email", "phone", "org", "type", "source", "registered_at", "status", "checked_in_at", "checked_in_by", "gate"];
  const rows = ev.att.map(a => [a.id, a.code, a.name, a.email, a.phone, a.org, a.type, a.source, a.registeredAt, a.checkedIn ? "checked_in" : "registered", a.at || "", a.by || "", a.gate || ""]);
  return [head, ...rows].map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
}

export function history(eventId, filter) {
  const s = get();
  let rows = s.checkins.filter(c => !eventId || c.eventId === eventId);
  if (filter && filter !== "all") rows = rows.filter(c => c.result === filter);
  return rows.slice().sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt));
}

export function stats(eventId) {
  const ev = eventById(eventId);
  if (!ev) return { total: 0, checkedIn: 0, walkins: 0, rate: "0%" };
  const total = ev.att.length;
  const checkedIn = ev.att.filter(a => a.checkedIn).length;
  return {
    total, checkedIn,
    walkins: ev.att.filter(a => a.walkin).length,
    rate: total ? Math.round(checkedIn / total * 100) + "%" : "0%"
  };
}

export function reset() {
  state = seed();
  persist();
  return state;
}
