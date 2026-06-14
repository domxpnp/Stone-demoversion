# StoneClub — Database Design (draft)

> เอกสารออกแบบโครงสร้างฐานข้อมูลสำหรับเว็บแคตตาล็อกหินธรรมชาติ **StoneClub**
> ฐานข้อมูลเป้าหมาย: **PostgreSQL**  · สถานะ: *ร่างให้ดูโครงสร้างก่อน ยังไม่ deploy จริง*

ปัจจุบันข้อมูลทั้งหมดเป็น seed/`localStorage` ในโค้ด (`data/stones.ts`, `data/clearance.ts`,
`app/admin/adminData.ts`, `context/StoreContext.tsx`) เอกสารนี้แปลงสิ่งเหล่านั้นให้เป็น schema จริง

---

## 1. ภาพรวม (ER overview)

```
                ┌────────────┐         ┌──────────────┐
                │  materials │         │   origins    │   ← lookup/facets
                │  finishes  │         │   colors     │
                └─────┬──────┘         └──────┬───────┘
                      │  (FK)                 │
                      ▼                       ▼
   ┌─────────┐   ┌──────────────────────────────┐   ┌──────────────┐
   │  tags   │◀─▶│            stones             │◀─▶│ stone_images │
   └─────────┘ M:N└───────┬───────────┬──────────┘   └──────────────┘
   (stone_tags)           │           │
                          │ specs     │ applications
                          ▼           ▼
                ┌──────────────┐  ┌──────────────────┐
                │ stone_specs  │  │ stone_applications│
                └──────────────┘  └──────────────────┘

   ┌──────────────────┐        ┌───────────────────────┐
   │    inquiries     │◀──────▶│    inquiry_items      │──▶ stones
   └────────┬─────────┘  1:N   └───────────────────────┘
            │  (lead → status workflow)
            ▼
   ┌──────────────────┐        ┌──────────────────┐
   │ clearance_items  │        │ clearance_settings│ (singleton)
   └──────────────────┘        └──────────────────┘

   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
   │   admin_users    │──▶│  activity_log    │   │   page_contents  │ (CMS)
   └──────────────────┘   └──────────────────┘   └────────┬─────────┘
                                                          │ 1:N
                                                          ▼
                                                ┌──────────────────┐
                                                │  page_fields     │
                                                └──────────────────┘
            ┌──────────────────┐
            │  media_assets    │  (Media Library)
            └──────────────────┘
```

---

## 2. การตัดสินใจเชิงออกแบบ (design notes)

| ประเด็น | การตัดสินใจ | เหตุผล |
|---|---|---|
| Facets (Material/Origin/Finish/Color) | แยกเป็น **lookup tables** + FK | ปัจจุบันเป็น array คงที่ใน `FACETS`; ทำเป็นตารางเพื่อให้แอดมินเพิ่ม/แก้ค่าได้ และคุม integrity |
| Tags | ตารางแยก + join `stone_tags` (M:N) | `TAGS` เป็น master vocabulary ที่ผูกหลายหินได้ |
| `spec` (Record<string,string>) | ตาราง `stone_specs` (key/value แบบมีลำดับ) | spec แต่ละหินมี key ไม่เท่ากัน — EAV เบาๆ ยืดหยุ่นกว่าเก็บ JSON ล้วน ถ้าอยากเร็วใช้ `JSONB` แทนได้ |
| สองภาษา (EN/TH) | เก็บคอลัมน์คู่ `*_en` / `*_th` | ตอนนี้มีแค่ EN/TH เท่านั้น คอลัมน์คู่อ่านง่ายกว่าตาราง translations |
| Project Palette / Basket | **ไม่เก็บเป็นตาราง** (เป็น client state) จะ persist ก็ตอนกลายเป็น `inquiry` | ตะกร้าเป็น session ฝั่ง client; เมื่อกดส่งจึงบันทึกเป็น inquiry + inquiry_items |
| Clearance settings | ตาราง singleton 1 แถว (เก็บ JSONB) | mirror `ClearanceSettings` ที่เป็น config ก้อนเดียว |
| ID ของหิน | คง slug เดิม (`bianco-carrara`) เป็น `slug` unique, ใช้ `uuid` เป็น PK | slug ใช้ใน URL อยู่แล้ว แต่ PK uuid ปลอดภัยกว่าเวลา rename |
| Enum | ใช้ Postgres `ENUM` สำหรับ status/badge | ค่าจำกัดและรู้ล่วงหน้า |
| **Audit / soft-delete** | ทุกตารางมีคอลัมน์มาตรฐานชุดเดียวกัน (ดูข้อ 3.1) | ตามที่ขอ — ติดตามว่าใครสร้าง/แก้/ลบ และเมื่อไหร่ โดยไม่ลบข้อมูลจริง |

---

## 3. SQL DDL (PostgreSQL)

### 3.1 คอลัมน์มาตรฐาน (audit columns) — มีในทุกตาราง

ทุกตารางจะมี 7 คอลัมน์นี้เหมือนกันหมด (เว้นตาราง join ล้วน เช่น `stone_tags` ที่จะมีเฉพาะ create/soft-delete):

```sql
  created_at  timestamptz not null default now(),   -- เวลาที่สร้าง
  created_by  uuid references admin_users(id),       -- ใครสร้าง (null = ระบบ/สาธารณะ)
  updated_at  timestamptz not null default now(),   -- เวลาที่แก้ล่าสุด
  updated_by  uuid references admin_users(id),       -- ใครแก้ล่าสุด
  is_deleted  boolean not null default false,        -- ธง soft-delete
  deleted_at  timestamptz,                            -- เวลาที่ลบ (null = ยังไม่ลบ)
  deleted_by  uuid references admin_users(id)         -- ใครลบ
```

แนวทางใช้งาน:
- **อย่าลบจริง** — `update ... set is_deleted = true, deleted_at = now(), deleted_by = :uid`
- ทุก query ฝั่งแอปกรอง `where is_deleted = false` (แนะนำทำเป็น VIEW หรือ Prisma middleware)
- **unique constraint ใช้ partial index** `where is_deleted = false` เพื่อให้ค่าที่ถูกลบไปแล้วนำกลับมาใช้ใหม่ได้
- `updated_at` ควรตั้ง trigger ให้อัปเดตอัตโนมัติ (ดูข้อ 3.4)

> หมายเหตุลำดับการสร้าง: เพราะทุกตาราง FK ไปที่ `admin_users` จึงต้องสร้าง `admin_users` ก่อน
> (มันอ้างถึงตัวเองได้เพราะคอลัมน์เป็น nullable)

### 3.2 Enums & admin_users

```sql
-- ===== extensions =====
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ===== enums =====
create type stone_status    as enum ('draft', 'published');
create type inquiry_status  as enum ('new', 'in-progress', 'quoted', 'won', 'archived');
create type clearance_badge as enum ('limited', 'clearance', 'last');
create type admin_role      as enum ('administrator', 'editor', 'sales');

-- ===== admin users (created first; everything else FKs to it) =====
create table admin_users (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  initials    text,
  email       text,
  role        admin_role not null default 'editor',
  active      boolean not null default true,
  -- audit
  created_at  timestamptz not null default now(),
  created_by  uuid references admin_users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references admin_users(id),
  is_deleted  boolean not null default false,
  deleted_at  timestamptz,
  deleted_by  uuid references admin_users(id)
);
create unique index admin_users_email_uq on admin_users(email) where is_deleted = false;
```

### 3.3 ตารางหลัก

```sql
-- =========================================================
--  LOOKUP / FACETS
-- =========================================================
create table materials (
  id    serial primary key,
  name  text not null,                  -- Marble, Granite, Onyx, Semi-precious, Travertine, Slate
  sort  int  not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references admin_users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id),
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references admin_users(id)
);
create unique index materials_name_uq on materials(name) where is_deleted = false;

create table origins (
  id    serial primary key,
  name  text not null,                  -- Italy, Spain, Iran, India, Brazil ...
  sort  int  not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references admin_users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id),
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references admin_users(id)
);
create unique index origins_name_uq on origins(name) where is_deleted = false;

create table finishes (
  id    serial primary key,
  name  text not null,                  -- Polished, Honed ...
  sort  int  not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references admin_users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id),
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references admin_users(id)
);
create unique index finishes_name_uq on finishes(name) where is_deleted = false;

create table colors (
  id    serial primary key,
  name  text not null,                  -- White, Brown, Green, Black ...
  hex   text,                           -- optional swatch colour
  sort  int  not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references admin_users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id),
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references admin_users(id)
);
create unique index colors_name_uq on colors(name) where is_deleted = false;

create table tags (
  id    serial primary key,
  name  text not null,                  -- Classic, Luxury, Veined, Timeless ...
  sort  int  not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references admin_users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id),
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references admin_users(id)
);
create unique index tags_name_uq on tags(name) where is_deleted = false;

-- =========================================================
--  STONES (catalog)
-- =========================================================
create table stones (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null,                   -- 'bianco-carrara' (used in /product/[id])
  name          text not null,
  material_id   int  references materials(id),
  origin_id     int  references origins(id),
  finish_id     int  references finishes(id),
  color_id      int  references colors(id),
  desc_en       text,                            -- English description
  desc_th       text,                            -- Thai description ("thai" field)
  applications  text,                            -- comma-separated copy (kept as text)
  premium       boolean not null default false,
  status        stone_status not null default 'draft',
  primary_image text,                            -- denormalised cover (also see stone_images)
  -- audit
  created_at    timestamptz not null default now(),
  created_by    uuid references admin_users(id),
  updated_at    timestamptz not null default now(),
  updated_by    uuid references admin_users(id),
  is_deleted    boolean not null default false,
  deleted_at    timestamptz,
  deleted_by    uuid references admin_users(id)
);
create unique index stones_slug_uq on stones(slug) where is_deleted = false;
create index stones_status_idx   on stones(status)      where is_deleted = false;
create index stones_material_idx on stones(material_id)  where is_deleted = false;

-- per-stone spec key/values (Thickness, Slab Size, Water Absorption, Hardness ...)
create table stone_specs (
  id        bigserial primary key,
  stone_id  uuid not null references stones(id) on delete cascade,
  label     text not null,                       -- 'Thickness'
  value     text not null,                       -- '20mm / 30mm'
  sort      int  not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references admin_users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id),
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references admin_users(id)
);
create unique index stone_specs_uq on stone_specs(stone_id, label) where is_deleted = false;

-- stone ⇄ tags (M:N) — join table: create + soft-delete only
create table stone_tags (
  stone_id   uuid not null references stones(id) on delete cascade,
  tag_id     int  not null references tags(id)   on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references admin_users(id),
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references admin_users(id),
  primary key (stone_id, tag_id)
);

-- multiple images per stone (gallery); primary_image above is the cover shortcut
create table stone_images (
  id         bigserial primary key,
  stone_id   uuid not null references stones(id) on delete cascade,
  url        text not null,
  alt        text,
  is_primary boolean not null default false,
  sort       int not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references admin_users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id),
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references admin_users(id)
);

-- =========================================================
--  INQUIRIES (leads from Project Palette / Contact form)
-- =========================================================
create table inquiries (
  id          text primary key,                  -- human ref 'INQ-2041'
  name        text not null,
  company     text,
  email       text not null,
  phone       text,
  channel     text not null,                     -- 'Palette' | 'Contact form'
  project     text,
  message     text,
  status      inquiry_status not null default 'new',
  received_at timestamptz not null default now(),
  -- audit
  created_at  timestamptz not null default now(),
  created_by  uuid references admin_users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references admin_users(id),
  is_deleted  boolean not null default false,
  deleted_at  timestamptz,
  deleted_by  uuid references admin_users(id)
);
create index inquiries_status_idx   on inquiries(status)          where is_deleted = false;
create index inquiries_received_idx on inquiries(received_at desc) where is_deleted = false;

create table inquiry_items (
  id          bigserial primary key,
  inquiry_id  text not null references inquiries(id) on delete cascade,
  stone_id    uuid references stones(id),         -- nullable: may reference a slug no longer in catalog
  stone_ref   text,                               -- raw slug at submit time (audit / fallback)
  qty         text not null,                      -- 'Under 50 sqm', '200–500 sqm' (range presets)
  note        text,
  sort        int not null default 0,
  created_at  timestamptz not null default now(),
  created_by  uuid references admin_users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references admin_users(id),
  is_deleted  boolean not null default false,
  deleted_at  timestamptz,
  deleted_by  uuid references admin_users(id)
);

-- =========================================================
--  CLEARANCE
-- =========================================================
create table clearance_items (
  id        text primary key,                     -- 'clr-calacatta-oro'
  name      text not null,
  material  text,                                 -- free text here (e.g. Travertine, Slate)
  image     text,
  badge     clearance_badge not null default 'clearance',
  hidden    boolean not null default false,
  sort      int not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references admin_users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id),
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references admin_users(id)
);

-- singleton config row for the clearance page (hero/section/cta/columns ...)
create table clearance_settings (
  id        boolean primary key default true check (id),  -- forces a single row
  enabled   boolean not null default true,
  nav_label text not null default 'Stock Clearance',
  columns   smallint not null default 3 check (columns between 2 and 4),
  show_enquire_hover boolean not null default true,
  config    jsonb not null default '{}',          -- hero / section / cta blocks
  created_at timestamptz not null default now(),
  created_by uuid references admin_users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id),
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references admin_users(id)
);

-- =========================================================
--  CMS (editable page content)
-- =========================================================
create table page_contents (
  id     text primary key,                        -- 'home' | 'about' | 'contact'
  label  text not null,                           -- 'Home / หน้าแรก'
  created_at timestamptz not null default now(),
  created_by uuid references admin_users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id),
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references admin_users(id)
);

create table page_fields (
  id        bigserial primary key,
  page_id   text not null references page_contents(id) on delete cascade,
  key       text not null,                        -- 'hero_title'
  label     text not null,                        -- 'Hero title'
  type      text not null default 'text',         -- 'text' | 'textarea'
  value     text,
  sort      int not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references admin_users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id),
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references admin_users(id)
);
create unique index page_fields_uq on page_fields(page_id, key) where is_deleted = false;

-- =========================================================
--  OPS (activity log + media library)
-- =========================================================
create table activity_log (
  id         bigserial primary key,
  actor_id   uuid references admin_users(id),     -- null = 'System'
  actor_name text not null,                        -- denormalised snapshot ('Nattapong', 'System')
  action     text not null,                        -- 'อัปเดตราคา', 'เผยแพร่สินค้า'
  target     text,                                 -- 'Bianco Carrara', 'INQ-2038'
  type       text,                                 -- edit | inquiry | publish | media | won
  created_at timestamptz not null default now(),
  created_by uuid references admin_users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id),
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references admin_users(id)
);
create index activity_log_created_idx on activity_log(created_at desc) where is_deleted = false;

create table media_assets (
  id          uuid primary key default gen_random_uuid(),
  url         text not null,
  filename    text,
  alt         text,
  width       int,
  height      int,
  bytes       bigint,
  created_at  timestamptz not null default now(),
  created_by  uuid references admin_users(id),     -- uploaded_by
  updated_at  timestamptz not null default now(),
  updated_by  uuid references admin_users(id),
  is_deleted  boolean not null default false,
  deleted_at  timestamptz,
  deleted_by  uuid references admin_users(id)
);
```

### 3.4 Trigger ช่วยอัปเดต `updated_at` อัตโนมัติ

```sql
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ผูก trigger นี้กับทุกตารางที่มีคอลัมน์ updated_at เช่น:
create trigger trg_stones_updated   before update on stones
  for each row execute function set_updated_at();
create trigger trg_inquiries_updated before update on inquiries
  for each row execute function set_updated_at();
-- ... (ทำซ้ำกับตารางอื่นที่มี updated_at)
```

---

## 4. Mapping จากโค้ดปัจจุบัน → ตาราง

| โค้ดเดิม | ตาราง/คอลัมน์ |
|---|---|
| `Stone.id` (slug) | `stones.slug` |
| `Stone.material/origin/finish/color` | FK → `materials/origins/finishes/colors` |
| `Stone.desc` / `Stone.thai` | `stones.desc_en` / `stones.desc_th` |
| `Stone.spec` (map) | `stone_specs` (label/value) |
| `Stone.tags[]` | `stone_tags` ⇄ `tags` |
| `Stone.img` | `stones.primary_image` + `stone_images` |
| `Stone.premium` / `status` | `stones.premium` / `stones.status` |
| `FACETS` | `materials` / `origins` / `finishes` / `colors` |
| `TAGS` | `tags` |
| `Inquiry` + `InquiryItem` | `inquiries` + `inquiry_items` |
| `ClearanceItem` / `ClearanceSettings` | `clearance_items` / `clearance_settings` |
| `PAGES` / `PageField` | `page_contents` / `page_fields` |
| `ACTIVITY` | `activity_log` |
| `ADMIN_USER` | `admin_users` |
| Basket (`StoreContext`) | *client state*; persist เมื่อกลายเป็น `inquiry` |

---

## 5. คำถามที่ควรเคาะก่อนทำจริง

1. **Spec** เก็บเป็นตาราง `stone_specs` (ค้น/รายงานง่าย) หรือ `JSONB` ก้อนเดียวใน `stones` (เขียนง่ายกว่า)?
2. **i18n** จะมีเกินสองภาษาในอนาคตไหม? ถ้ามี ควรเปลี่ยนจากคอลัมน์คู่เป็นตาราง translations
3. **Pricing** ตอนนี้ไม่มีราคาเลย (ใช้ "inquire only") — จะเพิ่ม field ราคา/สต็อกในอนาคตหรือไม่?
4. **Auth** ของแอดมิน จะใช้ระบบ auth ภายนอก (NextAuth/Clerk) หรือเก็บ password hash เองใน `admin_users`?
5. **Audit `*_by`** จะบังคับ not null ไหม (เช่น `created_by`)? ตอนนี้ปล่อย nullable เพื่อรองรับ action จากระบบ/ฟอร์มสาธารณะ (เช่น inquiry ที่ลูกค้าส่งเองไม่มี admin user)
```

ปรับให้แล้วครับ — ทุกตารางมีคอลัมน์ audit ครบชุดแล้ว

## สรุปสิ่งที่เพิ่ม

ใส่ชุดมาตรฐาน 7 คอลัมน์ในทุกตาราง:

| คอลัมน์ | ความหมาย |
|---|---|
| `created_at` / `created_by` | สร้างเมื่อไหร่ / โดยใคร |
| `updated_at` / `updated_by` | แก้ล่าสุดเมื่อไหร่ / โดยใคร |
| `is_deleted` / `deleted_at` / `deleted_by` | ธง soft-delete + เวลา + คนลบ |

จุดที่ปรับเพิ่มเพื่อให้ใช้งานได้จริง (ไม่ใช่แค่แปะคอลัมน์):

1. **ย้าย `admin_users` ขึ้นไปสร้างก่อน** — เพราะทุกตาราง FK `created_by/updated_by/deleted_by` ชี้มาที่มัน
2. **เปลี่ยน unique เป็น partial index** `where is_deleted = false` — เช่น `stones.slug`, ชื่อ lookup, `admin_users.email` ทำให้ลบแล้วเอาค่าเดิมกลับมาใช้ใหม่ได้ ไม่ชนกัน
3. **index ต่างๆ ก็เป็น partial** กรองแถวที่ลบแล้วออก ให้ query เร็วขึ้น
4. **ตาราง join `stone_tags`** ใส่แค่ create + soft-delete (ไม่มี update เพราะมันเป็นแค่ความสัมพันธ์)
5. เพิ่ม **trigger `set_updated_at()`** ตัวอย่างไว้ให้ผูกกับตารางที่มี `updated_at`

## ข้อควรเคาะเพิ่ม (ผมเพิ่มเป็นข้อ 5 ในไฟล์)

ตอนนี้ผมปล่อย `created_by` เป็น **nullable** เพราะบาง action ไม่มี admin user จริง — เช่น inquiry ที่ลูกค้าส่งเองผ่านฟอร์มสาธารณะ หรือ action จากระบบ ถ้าคุณอยากบังคับ `not null` เฉพาะตารางฝั่ง backoffice บอกได้ครับ จะแยกให้

อยากให้เดินต่อเป็น Prisma schema เลยไหมครับ?

