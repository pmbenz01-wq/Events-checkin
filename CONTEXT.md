# CONTEXT — 1NEVE event check-in

Glossary for this repo. Terms only; no implementation detail.

## People and organisations

**ผู้จัดงาน (Organizer)** — the company that hires 1NEVE to run registration
for their event. They decide what data is collected and what happens to it
afterwards. Under PDPA they are the **ผู้ควบคุมข้อมูลส่วนบุคคล (data
controller)**. Not currently stored anywhere in the system.

**1NEVE** — runs the registration and check-in system on the Organizer's
behalf and does not use attendee data for its own purposes. Under PDPA this is
the **ผู้ประมวลผลข้อมูลส่วนบุคคล (data processor)** role.

**ผู้ลงทะเบียน / attendee** — the person who fills in the registration form.
Called `Registrations` in the sheets and `reg` in code.

**เจ้าหน้าที่ (staff)** — a 1NEVE person with a role in Team Access
(STAFF / ADMIN). Signs into the console or the gate app.

## The word "org" is overloaded — two different things

**`org` (a column in `Registrations`, a toggle on the badge)** — the
*attendee's own* employer, typed into the registration form and printed on
their badge. Nothing to do with the Organizer.

**Organizer** — always written out in full, never abbreviated to `org` in
code or copy, precisely because of the clash above.

## Event vocabulary

**event** — one occasion with its own registration form, its own Google Sheet
file, its own badge design and its own Organizer.

**banner** — the wide image at the top of an event's customer page. Stored as
a URL in `image_url`; blank means the shared 1NEVE surface is shown instead.

**pass** — what an attendee receives after registering: a badge code and a QR
token. Not an email; it is looked up by phone number.

**gate** — a phone running the scanning app at a door.
