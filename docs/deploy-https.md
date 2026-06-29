# Deploy: ตั้ง HTTPS ด้วย DuckDNS + Let's Encrypt

บันทึกขั้นตอนการตั้ง HTTPS ให้ server (`103.117.149.68`) เพื่อแก้ปัญหา
**อัปโหลดรูปไม่ได้ (401 unauthenticated)**

---

## ทำไมต้องทำ (ต้นเหตุของปัญหา)

session cookie ตั้ง flag `Secure` เมื่อ `NODE_ENV=production` ([lib/auth.ts](../lib/auth.ts))
→ เบราว์เซอร์จะ **ส่ง cookie เฉพาะผ่าน HTTPS** เท่านั้น

ตอนเข้าผ่าน `http://` เปล่า ๆ เบราว์เซอร์ทิ้ง cookie → ทุก request ที่ต้อง login
(รวมถึง `POST /api/upload`) ได้ `401 unauthenticated`

**ทางแก้ถาวร = ใช้ HTTPS** (ทำตามด้านล่าง) แล้ว cookie จะทำงานปกติ

> ทางปลดบล็อกชั่วคราว (ไม่แนะนำสำหรับใช้จริง): ตั้ง `COOKIE_SECURE=false` ใน `.env`
> ของ server แล้ว `pm2 restart stoneclub` — token จะวิ่งผ่าน HTTP แบบไม่เข้ารหัส

---

## ข้อมูลของระบบนี้

| รายการ | ค่า |
|---|---|
| Domain (ฟรี) | `demostone.duckdns.org` |
| Server IP | `103.117.149.68` |
| App | Next.js (pm2 ชื่อ `stoneclub`) รันที่ port `3000` |
| DuckDNS | https://www.duckdns.org (login Google/GitHub) |

---

## ขั้นตอนติดตั้ง (ทำครั้งเดียว)

### 1. ตั้ง DuckDNS
1. เข้า https://www.duckdns.org → login
2. สร้าง subdomain `demostone`
3. ใส่ IP `103.117.149.68` ในช่อง current ip → **update ip**
4. เช็คว่า DNS ชี้มาถูก:
   ```bash
   ping demostone.duckdns.org      # ต้องได้ 103.117.149.68
   ```

### 2. เปิด firewall port 80 + 443 (ถ้ามี ufw)
```bash
sudo ufw allow 80,443/tcp
sudo ufw status
```

### 3. ติดตั้ง nginx + certbot
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 4. สร้าง nginx config (reverse proxy → app)
```bash
sudo nano /etc/nginx/sites-available/demostone
```
วางเนื้อหานี้:
```nginx
server {
    listen 80;
    server_name demostone.duckdns.org;

    # สำคัญ! ให้อัปโหลดรูปได้ถึง 10MB (default nginx แค่ 1MB → 413 Request Entity Too Large)
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 5. เปิดใช้ config + reload
```bash
sudo ln -s /etc/nginx/sites-available/demostone /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default      # เอา default ออกกันชน
sudo nginx -t                                     # ต้องขึ้น "syntax is ok"
sudo systemctl reload nginx
```
> ⚠️ อย่า copy หลายบรรทัดที่มี comment ภาษาไทยพร้อมกัน — shell จะงง รันทีละบรรทัด

ลองเข้า `http://demostone.duckdns.org` ต้องเห็นเว็บก่อน แล้วค่อยไปต่อ

### 6. ออก cert HTTPS
```bash
sudo certbot --nginx -d demostone.duckdns.org
```
ตอบ prompt:
- **email** → อีเมลของคุณ
- **Terms** → `A` (Agree)
- **share email to EFF** → `N`
- **redirect** → `2` (Redirect HTTP → HTTPS)

สำเร็จจะขึ้น `Congratulations! ... https://demostone.duckdns.org`
certbot ตั้ง auto-renew ให้เองแล้ว (เช็คได้ด้วย `sudo certbot renew --dry-run`)

### 7. ปิด COOKIE_SECURE กลับไปปลอดภัย
```bash
cd ~/Stone-demoversion
nano .env        # ลบบรรทัด COOKIE_SECURE=false (หรือเปลี่ยนเป็น true)
pm2 restart stoneclub
```

### 8. ทดสอบ
1. เข้า `https://demostone.duckdns.org`
2. **logout แล้ว login ใหม่** (เพื่อให้ได้ cookie ตัวใหม่)
3. ลองอัปโหลดรูป → ต้องได้แล้ว ✅

---

## แก้ปัญหาที่อาจเจอ

| อาการ | สาเหตุ / ทางแก้ |
|---|---|
| certbot error: ขอ cert ไม่ได้ | DNS ยังไม่ชี้มา (`ping` เช็ค) หรือ port 80 ปิด (`ufw allow`) |
| อัปโหลดได้ 401 | ยังไม่ได้ login ใหม่ หลังเปลี่ยนเป็น HTTPS / ยังตั้ง COOKIE_SECURE ผิด |
| อัปโหลด 413 | nginx ไม่มี `client_max_body_size 10M;` ใน config |
| อัปโหลด 500 | ดู `pm2 logs stoneclub` — มักเป็นสิทธิ์เขียน `public/uploads` หรือดิสก์เต็ม (`df -h`) |
| รูปอัปขึ้นแต่ไม่โชว์ | เช็คว่า nginx ส่ง `/uploads/...` ผ่าน (proxy ไป port 3000 อยู่แล้วในนี้) |

---

## คำสั่งที่ใช้บ่อย
```bash
pm2 status                       # ดูสถานะ app
pm2 logs stoneclub --lines 50    # ดู log
sudo nginx -t                    # เทสต์ nginx config
sudo systemctl reload nginx      # reload nginx
sudo certbot renew --dry-run     # ทดสอบต่ออายุ cert
```
