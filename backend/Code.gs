/**
 * Event Check-in — Apps Script backend for the customer-facing site.
 *
 * Implements the public endpoints from "Handoff - Google Sheet และ Apps Script":
 *   listEvents   (addition — needed by the event picker, not itemised in the handoff
 *                 doc's endpoint table but required by the same "public" architecture)
 *   getEventForm
 *   register
 *   getMyPass
 *
 * Staff-only endpoints (checkin, searchAttendees, addWalkin, updateAttendee,
 * deleteAttendee, saveFields, saveBadgeConfig, getDashboard) are NOT implemented
 * here — they belong to the Staff Console, which is a separate build.
 *
 * Team access (Staff allowlist: who, what role, which events) lives in a
 * SEPARATE spreadsheet file from customer data — see the "Team access" section
 * below and setupTeamAccessSheet(). Nothing wires into it yet (no staff
 * endpoints exist), but the split is decided now so the Staff Console build
 * doesn't have to retrofit it later.
 *
 * Deploy: see README.md in this folder.
 */

var SHEETS = {
  EVENTS: 'Events',
  FIELDS: 'Fields',
  REGISTRATIONS: 'Registrations'
};

var EVENTS_HEADERS = ['event_id', 'name', 'date_display', 'place', 'status_label', 'seats_label', 'price_label', 'accent', 'theme', 'open', 'short_label'];
var FIELDS_HEADERS = ['event_id', 'key', 'label', 'type', 'required', 'sort_order'];
var REG_HEADERS = ['reg_id', 'event_id', 'badge_code', 'qr_token', 'full_name', 'email', 'phone', 'org', 'type', 'answers_json', 'source', 'status', 'registered_at', 'consent_at', 'checked_in_at', 'checked_in_by', 'gate', 'device_id', 'scan_count', 'updated_at', 'updated_by'];

// ---------------------------------------------------------------------------
// One-time setup — run this once from the Apps Script editor (select
// `setupSheets` in the function dropdown, then Run) before deploying.
// Safe to re-run: it only creates sheets/seed rows that don't exist yet.
// This sets up CUSTOMER data only — see setupTeamAccessSheet() below for the
// separate team/roles spreadsheet.
// ---------------------------------------------------------------------------
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, SHEETS.EVENTS, EVENTS_HEADERS);
  ensureSheet_(ss, SHEETS.FIELDS, FIELDS_HEADERS);
  ensureSheet_(ss, SHEETS.REGISTRATIONS, REG_HEADERS);
  seedEvents_();
  seedFields_();
  ensureQrSecret_();
  Logger.log('Setup complete. Sheets ready, QR secret ' + (PropertiesService.getScriptProperties().getProperty('QR_SECRET') ? 'present' : 'MISSING'));
}

function ensureSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  return sh;
}

function seedEvents_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.EVENTS);
  if (sh.getLastRow() > 1) return; // already seeded
  var rows = [
    ['tt', 'ThinkTech Summit 2026', '18–19 ธ.ค. 2569', 'ไบเทค บางนา · ฮอลล์ 2', 'เปิดรับ', 'เหลือ 240 ที่', 'ไม่มีค่าใช้จ่าย', '#d8482b', 'editorial', true, 'THINKTECH SUMMIT · 2026'],
    ['gala', 'Annual Partner Gala', '24 ธ.ค. 2569', 'ดุสิตธานี · แกรนด์บอลรูม', 'เชิญเท่านั้น', 'เหลือ 32 ที่', 'ตามบัตรเชิญ', '#a8874f', 'brass', true, 'PARTNER GALA · 2026'],
    ['lab', 'Founder Lab · รุ่น 4', '9 ม.ค. 2570', 'ทองหล่อ · ชั้น 6', 'เปิดรับ', 'เหลือ 18 ที่', '2,500 บาท', '#2f6b4f', 'forest', true, 'FOUNDER LAB · 04'],
    ['roadshow', 'Regional Roadshow', '22 ก.พ. 2570', 'เชียงใหม่ · เซ็นทรัลเฟส', 'เร็ว ๆ นี้', 'ยังไม่เปิดรับ', 'ไม่มีค่าใช้จ่าย', '#2f4d8c', 'ink', false, 'REGIONAL ROADSHOW']
  ];
  sh.getRange(2, 1, rows.length, EVENTS_HEADERS.length).setValues(rows);
}

function seedFields_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.FIELDS);
  if (sh.getLastRow() > 1) return; // already seeded
  function base(eventId, extra) {
    return [
      [eventId, 'name', 'ชื่อ–นามสกุล', 'TEXT', true, 1],
      [eventId, 'email', 'อีเมล', 'EMAIL', true, 2],
      [eventId, 'phone', 'เบอร์โทรศัพท์', 'PHONE', true, 3]
    ].concat(extra || []);
  }
  var rows = []
    .concat(base('tt', [['tt', 'org', 'บริษัท / องค์กร', 'TEXT', false, 4]]))
    .concat(base('gala', [['gala', 'diet', 'ข้อจำกัดด้านอาหาร', 'SELECT', false, 4]]))
    .concat(base('lab', [['lab', 'role', 'ตำแหน่งงาน', 'TEXT', true, 4]]))
    .concat(base('roadshow', []));
  sh.getRange(2, 1, rows.length, FIELDS_HEADERS.length).setValues(rows);
}

function ensureQrSecret_() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('QR_SECRET')) {
    props.setProperty('QR_SECRET', Utilities.getUuid() + Utilities.getUuid());
  }
}

// ---------------------------------------------------------------------------
// Team access — kept in a SEPARATE spreadsheet file from customer data, on
// purpose: who can see/edit customer Registrations and who can see/edit staff
// roles are two different access decisions, and putting them in one file
// means anyone with edit rights on one has a path to the other. This script
// project still owns both files; it just opens the team-access one by ID
// (stored in Script Properties) instead of by getActiveSpreadsheet().
//
// Run setupTeamAccessSheet() once, alongside setupSheets(). Nothing calls
// findStaffByEmail_() yet — no staff endpoint exists in this file — but the
// Staff Console backend should call it from its own requireStaff()-style
// check rather than re-deriving role/scope logic.
// ---------------------------------------------------------------------------
var TEAM_SHEETS = { STAFF: 'Staff' };
var STAFF_HEADERS = ['email', 'name', 'role', 'event_scope', 'gate'];

function setupTeamAccessSheet() {
  var props = PropertiesService.getScriptProperties();
  var existingId = props.getProperty('STAFF_SHEET_ID');
  var ss = null;
  if (existingId) {
    try { ss = SpreadsheetApp.openById(existingId); } catch (err) { ss = null; }
  }
  if (!ss) {
    ss = SpreadsheetApp.create('Event Check-in — Team Access');
    props.setProperty('STAFF_SHEET_ID', ss.getId());
  }
  var sh = ensureSheet_(ss, TEAM_SHEETS.STAFF, STAFF_HEADERS);
  seedStaff_(sh);

  // Drop the blank default tab Spreadsheet.create() adds, once Staff exists.
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) ss.deleteSheet(defaultSheet);

  Logger.log('Team access spreadsheet ready: ' + ss.getUrl());
  return ss.getUrl();
}

function seedStaff_(sh) {
  if (sh.getLastRow() > 1) return; // already seeded
  var rows = [
    // event_scope is 'ALL' or a comma-separated list of event_id values.
    ['pimchanok@thinktech.co.th', 'พิมพ์ชนก ว.', 'ADMIN', 'ALL', 'ประตู A'],
    ['thanakrit@thinktech.co.th', 'ธนกฤต อ.', 'STAFF', 'tt', 'ประตู B'],
    ['yanisa@thinktech.co.th', 'ญาณิศา ร.', 'STAFF', 'tt', 'ประตู A'],
    ['warintorn@partner.co', 'วรินทร ท.', 'VIEWER', 'lab', '—']
  ];
  sh.getRange(2, 1, rows.length, STAFF_HEADERS.length).setValues(rows);
}

function getStaffSheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('STAFF_SHEET_ID');
  if (!id) throw new Error('team_access_not_configured — run setupTeamAccessSheet() first');
  return SpreadsheetApp.openById(id).getSheetByName(TEAM_SHEETS.STAFF);
}

// Looks up one person's role/scope from the team-access allowlist by email.
// Returns null if they're not on it. Scope check (does role cover eventId) is
// left to the caller, since "ALL" vs a specific list is a caller-side decision.
function findStaffByEmail_(email) {
  var em = String(email || '').trim().toLowerCase();
  var sh = getStaffSheet_();
  var rows = sh.getDataRange().getValues();
  var headers = rows.shift();
  var row = rows.find(function (r) { return String(r[0]).toLowerCase() === em; });
  return row ? rowToObj_(headers, row) : null;
}

// ---------------------------------------------------------------------------
// HTTP entry points
// ---------------------------------------------------------------------------
function doGet(e) { return handle_(e); }
function doPost(e) { return handle_(e); }

function handle_(e) {
  var action = '';
  try {
    var params = parseParams_(e);
    action = params.action;
    var data;
    switch (action) {
      case 'listEvents': data = listEvents(); break;
      case 'getEventForm': data = getEventForm(params.eventId); break;
      case 'register': data = register(params); break;
      case 'getMyPass': data = getMyPass(params.email); break;
      default: return json_({ ok: false, error: 'unknown_action' });
    }
    return json_({ ok: true, data: data });
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

// Reads either query-string params (GET) or a JSON body sent as text/plain
// (POST — text/plain avoids the CORS preflight that Apps Script can't answer).
function parseParams_(e) {
  if (e && e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (err) { /* fall through to query params */ }
  }
  return (e && e.parameter) || {};
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function rowToObj_(headers, row) {
  var o = {};
  for (var i = 0; i < headers.length; i++) o[headers[i]] = row[i];
  return o;
}

function readSheet_(name) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  var rows = sh.getDataRange().getValues();
  var headers = rows.shift();
  return { sheet: sh, headers: headers, rows: rows };
}

function isTrue_(v) { return v === true || v === 'TRUE' || v === 'true'; }

// ---------------------------------------------------------------------------
// listEvents — public. Feeds the event picker (arc carousel).
// ---------------------------------------------------------------------------
function listEvents() {
  var t = readSheet_(SHEETS.EVENTS);
  return t.rows.filter(function (r) { return r[0]; }).map(function (r) {
    var o = rowToObj_(t.headers, r);
    return {
      id: o.event_id, name: o.name, date: o.date_display, place: o.place,
      status: o.status_label, seats: o.seats_label, price: o.price_label,
      accent: o.accent, theme: o.theme, open: isTrue_(o.open), short: o.short_label
    };
  });
}

// ---------------------------------------------------------------------------
// getEventForm — public. Field list for a given event (Staff Console territory
// mostly, but kept here per the handoff doc's endpoint table).
// ---------------------------------------------------------------------------
function getEventForm(eventId) {
  if (!eventId) throw new Error('missing_event_id');
  var t = readSheet_(SHEETS.FIELDS);
  return t.rows.filter(function (r) { return r[0] === eventId; }).map(function (r) {
    var o = rowToObj_(t.headers, r);
    return { key: o.key, label: o.label, type: o.type, required: isTrue_(o.required), order: o.sort_order };
  }).sort(function (a, b) { return a.order - b.order; });
}

// ---------------------------------------------------------------------------
// register — public. Creates a Registrations row, signs a QR token, emails
// the attendee a reopen link, and returns everything the pass screen needs.
// ---------------------------------------------------------------------------
function register(p) {
  var eventId = String(p.eventId || '').trim();
  var name = String(p.name || '').trim();
  var email = String(p.email || '').trim().toLowerCase();
  var phone = String(p.phone || '').trim();
  var org = String(p.org || '').trim();
  var type = String(p.type || '').trim();
  var consent = p.consent === true || p.consent === 'true';

  if (!eventId) throw new Error('missing_event');
  if (!name) throw new Error('invalid_name');
  if (!/^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(email)) throw new Error('invalid_email');
  if (phone.replace(/\D/g, '').length < 9) throw new Error('invalid_phone');
  if (!consent) throw new Error('consent_required');

  var ev = eventById_(eventId);
  if (!ev) throw new Error('event_not_found');
  if (!isTrue_(ev.open)) throw new Error('event_closed');

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw new Error('busy');
  var regId, badgeCode, qrToken, nowIso;
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.REGISTRATIONS);
    regId = 'r' + Utilities.getUuid().replace(/-/g, '').slice(0, 10);
    badgeCode = eventId.toUpperCase().slice(0, 4) + '-' + randomHex_(4) + '-' + (900 + Math.floor(Math.random() * 99));
    qrToken = signQr_(eventId, badgeCode);
    nowIso = new Date().toISOString();
    sh.appendRow([
      regId, eventId, badgeCode, qrToken, name, email, phone, org, type,
      JSON.stringify({ org: org }), 'online', 'registered', nowIso,
      consent ? nowIso : '', '', '', '', '', 0, nowIso, 'customer'
    ]);
  } finally {
    lock.releaseLock();
  }

  sendPassEmail_(email, name, ev, badgeCode);

  return {
    regId: regId, badgeCode: badgeCode,
    qrPayload: eventId + '|' + badgeCode + '|' + qrToken,
    name: name, email: email, phone: phone, org: org, type: type,
    eventId: eventId, eventName: ev.name
  };
}

function randomHex_(n) {
  var chars = '0123456789ABCDEF', s = '';
  for (var i = 0; i < n; i++) s += chars[Math.floor(Math.random() * 16)];
  return s;
}

// QR content is `EVENT|BADGE_CODE|SIG` — SIG is the first 10 hex chars of
// HMAC-SHA256(EVENT|BADGE_CODE) signed with a secret kept in Script
// Properties, so a badge can't be forged without the secret (per handoff §6).
function signQr_(eventId, badgeCode) {
  var secret = PropertiesService.getScriptProperties().getProperty('QR_SECRET');
  if (!secret) throw new Error('qr_secret_not_configured');
  var raw = eventId + '|' + badgeCode;
  var sigBytes = Utilities.computeHmacSha256Signature(raw, secret);
  var hex = sigBytes.map(function (b) { return ((b < 0 ? b + 256 : b).toString(16)).padStart(2, '0'); }).join('');
  return hex.slice(0, 10).toUpperCase();
}

function eventById_(id) {
  var t = readSheet_(SHEETS.EVENTS);
  var row = t.rows.find(function (r) { return r[0] === id; });
  return row ? rowToObj_(t.headers, row) : null;
}

// Best-effort — a mail quota hiccup shouldn't fail the registration itself.
function sendPassEmail_(email, name, ev, badgeCode) {
  try {
    var siteUrl = PropertiesService.getScriptProperties().getProperty('CUSTOMER_SITE_URL') || '';
    var link = siteUrl ? (siteUrl + (siteUrl.indexOf('?') >= 0 ? '&' : '?') + 'lookup=' + encodeURIComponent(email)) : '';
    var subject = '[' + ev.name + '] บัตรเข้างานของคุณ / Your entry pass';
    var body = 'สวัสดีคุณ ' + name + ',\n\n' +
      'ลงทะเบียนเข้างาน "' + ev.name + '" สำเร็จแล้ว\n' +
      'รหัสบัตร: ' + badgeCode + '\n\n' +
      (link ? ('เปิดดู QR เข้างานได้ที่ลิงก์นี้ / Reopen your QR pass:\n' + link + '\n\n') : '') +
      '— ทีมผู้จัดงาน';
    MailApp.sendEmail(email, subject, body);
  } catch (err) {
    Logger.log('sendPassEmail_ failed: ' + err);
  }
}

// ---------------------------------------------------------------------------
// getMyPass — public. Reopens a badge by email, across all events, so a
// customer who lost their pass image can pull it back up. Returns the most
// recently registered match.
// ---------------------------------------------------------------------------
function getMyPass(email) {
  var em = String(email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(em)) throw new Error('invalid_email');

  var t = readSheet_(SHEETS.REGISTRATIONS);
  var matches = t.rows.map(function (r) { return rowToObj_(t.headers, r); })
    .filter(function (o) { return o.email && String(o.email).toLowerCase() === em && o.status !== 'deleted'; });
  if (!matches.length) throw new Error('not_found');

  matches.sort(function (a, b) { return new Date(b.registered_at) - new Date(a.registered_at); });
  var o = matches[0];
  var ev = eventById_(o.event_id);
  return {
    regId: o.reg_id, badgeCode: o.badge_code,
    qrPayload: o.event_id + '|' + o.badge_code + '|' + o.qr_token,
    name: o.full_name, email: o.email, phone: o.phone, org: o.org, type: o.type,
    eventId: o.event_id, eventName: ev ? ev.name : o.event_id
  };
}
