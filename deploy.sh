#!/usr/bin/env bash
#
# deploy.sh — ดึงโค้ดใหม่ + build + รีสตาร์ท app บน server
# ใช้งาน:  ./deploy.sh
#
# รันที่โฟลเดอร์โปรเจกต์บน server (~/Stone-demoversion)
# DB จัดการแยกที่ ~/stoneclub-db — สคริปต์นี้ไม่แตะ docker

set -euo pipefail

APP_NAME="stoneclub"

# ทำงานจากโฟลเดอร์ที่สคริปต์อยู่เสมอ (ไม่ว่าจะรันมาจากที่ไหน)
cd "$(dirname "$0")"

echo "==> 1/5 ดึงโค้ดล่าสุด (git pull)"
git pull

echo "==> 2/5 ติดตั้ง dependency (npm install)"
npm install

echo "==> 3/5 อัปเดตตาราง DB (prisma migrate deploy)"
npx prisma migrate deploy

# โฟลเดอร์เก็บรูปที่ผู้ใช้อัปโหลด (gitignored — git pull ไม่แตะ) ต้องมีอยู่เสมอ
mkdir -p public/uploads

echo "==> 4/5 build production (npm run build)"
npm run build

echo "==> 5/5 รีสตาร์ท app ผ่าน pm2"
# restart ถ้ามีอยู่แล้ว, ถ้ายังไม่เคย start ก็ start ให้ครั้งแรก
pm2 restart "$APP_NAME" || pm2 start npm --name "$APP_NAME" -- start

echo "✅ deploy เสร็จแล้ว — เช็คสถานะด้วย: pm2 status"
