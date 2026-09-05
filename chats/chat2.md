# Progress check

_Started 2026-09-05 13:04 UTC_

---

## User

ทำถึงไหนแล้ว

## Assistant

We were building a complete event registration web app with separate customer and staff interfaces, synced real-time via Google Sheet.

**What we built:**
- Customer side: arc carousel to pick event → 5-step registration form (Editorial theme, ส้มอิฐ) → QR badge. Supports TH/EN switching.
- Staff side: login via Google → multi-event dashboard with live check-in counts, activity feed, QR scanner, attendee search/edit/add, field management per event, badge theme & layout customization, history log with CSV export.
- Both synced real-time via central event-store.js (placeholder for Google Sheet), preventing duplicate scans, tracking who scanned what and when.
- Badge A6 print-ready (105×148mm, zero margin), swappable per event theme.
- 4 events with 5 color themes (Editorial/Ivory & Brass/Onyx/Forest/Ink Blue), image slots for card/banner/logo per event.

**Key decisions:**
- Editorial theme for customer (step-by-step UX, large type, fast on mobile).
- BroadcastChannel + storage events for cross-tab/cross-device sync.
- "First-scan wins" lock pattern in store to prevent duplicate check-ins.
- All data mutations (registration, check-in, field edits, theme changes, new events) instantly reflect on the other side.

**Current state:**
All files frozen and documented. Ready to hand off to backend. Files: `Event Check-in - Customer.dc.html`, `Event Check-in - Staff Console.dc.html`, `Badge A6 - Print.dc.html`, `event-store.js`, `Handoff - Google Sheet และ Apps Script.dc.html`.

**Next steps:**
You'll implement Apps Script integration (POST /register, POST /checkin with LockService, QR signing with HMAC) and wire the real Google Sheet. Store layer is already structured for it.

## User

ทำถึงไหนแล้ว

## Assistant

_[tool: list_files]_

สรุปสถานะ — ทุกไฟล์เสร็จและ freeze ไว้แล้ว พร้อมส่งต่อฝั่ง backend:

**ฝั่งลูกค้า** — `Event Check-in - Customer.dc.html`: arc carousel เลือกงาน → ฟอร์มลงทะเบียน 5 ขั้น (ธีม Editorial ส้มอิฐ) → QR badge, สลับ TH/EN ได้ มีเวอร์ชันสำรอง `(2b Onyx)` และไฟล์รวมตัวเลือกดีไซน์

**ฝั่งสตาฟ** — `Event Check-in - Staff Console.dc.html`: ล็อกอิน Google → dashboard หลายงาน, ยอดเช็คอินสด, activity feed, สแกน QR, ค้นหา/แก้/เพิ่มผู้เข้าร่วม, จัดการฟิลด์ต่องาน, ปรับธีม+เลย์เอาต์ badge, history log + export CSV

**Badge** — `Badge A6 - Print.dc.html`: A6 105×148mm ขอบศูนย์ พร้อมพิมพ์

**Sync** — `event-store.js`: BroadcastChannel + storage events, ล็อก "first-scan wins" กันสแกนซ้ำ ทุกการเปลี่ยนแปลงเด้งข้ามฝั่งทันที

**เอกสารส่งต่อ** — `Handoff - Google Sheet และ Apps Script.dc.html`

**ที่เหลือ (ฝั่งคุณ):** ต่อ Apps Script จริง — POST /register, POST /checkin พร้อม LockService, เซ็น QR ด้วย HMAC แล้ววาย Google Sheet ตัวจริง โครง store รองรับไว้แล้ว

อยากให้ผมช่วยต่ออะไรไหม? เช่น เขียนโค้ด Apps Script ตัวอย่างให้เลย หรือปรับแก้ดีไซน์จุดใดจุดหนึ่ง

