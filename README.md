






# 📊 vn-macro-monthly — Báo cáo vĩ mô Việt Nam hàng tháng

Skill tạo **bản tin phân tích vĩ mô VN hàng tháng** (macro briefing) từ 5 nguồn chính thức (NSO + Customs + S&P PMI + VBMA + VNBA). Triết lý: **bản tin, không phải dashboard** — mỗi nhóm = đoạn dẫn kể chuyện (text) + biểu đồ minh họa (graph) + dòng dữ liệu; mọi thứ do dữ liệu (report.json) quyết định, không có khung cố định ép nội dung.

## Kiến trúc hiện tại (data-driven)

```
vn-macro-monthly/
├── SKILL.md                      # Workflow (pre-flight → fetch → extract → verify → render → QA)
├── references/                   # core_rules · sources_overview · preflight_check · data_cards · rendering · news_sources
├── assets/
│   ├── skin.css                  # GIAO DIỆN (chỉ sửa khi đổi thiết kế)
│   └── skin.js                   # JS (sparkline · gauge · arrows · modal · offline guard)
└── scripts/
    ├── render.js                 # MÁY RENDER: report.json + history.json → report.html
    ├── verify_data.js            # MÁY KIỂM TRA: provenance · bounds · history · coverage · độ dài chữ
    ├── qa_report.js              # QA Playwright (data-driven, đọc report.json để đối chiếu)
    ├── run_monthly.js            # Pipeline 1 lệnh: verify → render → QA
    └── package.json              # Playwright cho QA
```

## Pipeline chuẩn mỗi tháng

```bash
# 1. AI viết report.json (sau khi tải cache 5 nguồn)
# 2. Kiểm tra dữ liệu (BẮT BUỘC — bắt lỗi bịa số, sai đơn vị, over text)
node scripts/verify_data.js --json=2026-07/report.json --history=history.json
# 3. Sinh báo cáo + QA
node scripts/render.js --json=2026-07/report.json --history=history.json --out=2026-07/report.html
```

## Đặc điểm chính

- **Bản tin phân tích, không phải dashboard**: mỗi nhóm = đoạn dẫn kể chuyện (lead) + 1 biểu đồ SVG minh họa + 3-5 dòng dữ liệu text
- **Nhóm/tab động**: tháng thiếu nguồn → nhóm tự biến mất, không placeholder
- **Biểu đồ SVG vẽ tĩnh ngay trong file**: in/PDF/offline đều hiện; bar vẽ từ số tháng, line tự nạp history (đủ 2 kỳ mới hiện)
- **Bề rộng đọc chuẩn báo chí** (~1120px): chữ không trải cả màn hình
- **Offline-first**: không phụ thuộc ảnh ngoài; mất mạng vẫn chạy bình thường
- **Máy kiểm soát 3 lớp**: verify_data (số liệu + độ dài chữ) · render (cấu trúc) · QA (giao diện)
- **Chuẩn độ dài có máy bắt**: lead ≤130 từ + ≥2 con số, note ≤22 từ + ≥1 số so sánh — hết over text

## Sử dụng

Kích hoạt: `/vn-macro-monthly <tháng> <năm>`. Changelog chi tiết ở cuối `SKILL.md`.

## License

Miễn phí cho mục đích cá nhân và nghiên cứu. KHÔNG phải lời khuyên đầu tư.
