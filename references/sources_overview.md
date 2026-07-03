# Sources Overview — 5 nguồn data vĩ mô VN

5 nguồn chính thức + miễn phí, cover 4 trụ cột (sản xuất + ngoại thương + tiền tệ + tài chính). Mỗi nguồn có URL pattern + cách fetch riêng.

## Mục lục

- [Bảng tổng quan 5 nguồn](#bảng-tổng-quan-5-nguồn)
- [PMI (S&P Global)](#1-pmi--sp-global)
- [NSO (Tổng cục Thống kê)](#2-nso--tổng-cục-thống-kê)
- [Customs (Tổng cục Hải quan)](#3-customs--tổng-cục-hải-quan)
- [VBMA (Hiệp hội TT Trái phiếu)](#4-vbma--hiệp-hội-thị-trường-trái-phiiu)
- [VNBA (Hiệp hội Ngân hàng)](#5-vnba--hiệp-hội-ngân-hàng)
- [Cache file naming](#cache-file-naming)

---

## Bảng tổng quan 5 nguồn

| Nguồn | Provider | Loại | Độ trễ (sau cuối RM) | Access |
|---|---|---|---|---|
| **PMI** | S&P Global | Press release HTML/PDF | ~1 ngày | Free, no account |
| **NSO** | Tổng cục Thống kê | Báo cáo KTXH tháng (web) | ~3 ngày | Free |
| **Customs** | Tổng cục Hải quan | Báo cáo XNK (JSP portal) | ~10 ngày | Free (render JS) |
| **VBMA** | Hiệp hội TT Trái phiếu | Báo cáo tuần (PDF) | ~3 ngày | Free |
| **VNBA** | Hiệp hội Ngân hàng | Báo cáo tháng (PDF, 22 trang) | ~11 ngày | Free (CDN token) |

---

## 1. PMI — S&P Global

**URL pattern**: `pmi.spglobal.com/Public/Home/PressRelease/{hash}`
- Hash thay đổi mỗi tháng (32 ký tự hex), không cố định
- Có cả tiếng Việt: thêm `?language=vi`

**Cách tìm hash**:
```
WebSearch: "Vietnam Manufacturing PMI" [tháng] [năm] site:pmi.spglobal.com
→ link press release = URL cần tìm
```

**Cách fetch**: WebReader trực tiếp (URL sạch, không ký tự đặc biệt).

**Data thu được** (10 sub-indices):
- Headline PMI + MoM delta
- Output, New Orders, New Export Orders, Employment
- Purchasing Activity, Input Costs, Output Prices
- Supplier Delivery, Stocks of Purchases, Confidence 12M
- Economist comment (Andrew Harker)

**Lưu ý**:
- Press release = đủ data cho monthly (sub-indices dạng qualitative)
- **Historical data**: Press release archive từng tháng = **FREE** (WebSearch được link các tháng trước). Chỉ **SUBSCRIPTION time series** (dạng bảng đầy đủ, nhiều năm) mới tính phí
- → Vẫn khuyến nghị **tự tích lũy qua `history.json`** cho nhất quán rule "mọi số trace về cache" (DESIGN.md). KHÔNG điền data WebSearch ngược vào history — vi phạm rule cache
- Embargo tới 0730 ICT ngày 1 của tháng M+1

---

## 2. NSO — Tổng cục Thống kê

**URL pattern**: `nso.gov.vn/bai-top/{YYYY}/{MM}/bao-cao-tinh-hinh-kinh-te-xa-hoi-thang-{...}/`
- `{YYYY}/{MM}` = tháng publish (luôn = M+1)
- Slug có dạng `thang-{tên-tháng}-va-{N}-thang-dau-nam-{YEAR}` (thường có `-2` postfix nếu trùng slug)

**Cách tìm URL chính xác**:
```
WebSearch: nso.gov.vn "báo cáo tình hình kinh tế xã hội" tháng [M] [Y]
hoặc: nso.gov.vn/bao-cao-tinh-hinh-kinh-te-xa-hoi-hang-thang/ (trang index tháng gần nhất)
```

**Cách fetch**: WebReader trực tiếp.

**Data thu được** (12 chỉ số):
- CPI (MoM/YoY/YTD/core) + Chỉ số giá vàng/USD
- IIP (MoM/YoY/YTD)
- XNK (sơ bộ, dùng Customs cho chính thức)
- FDI (đăng ký + thực hiện)
- Bán lẻ & DV tiêu dùng
- Vốn đầu tư NSNN + Thu/chi NSNN
- Đăng ký DN (mới/ra khỏi)
- Khách quốc tế + Vận tải + Nông/Lâm/Thủy sản

**Lịch release cố định**: báo cáo tháng M công bố **mùng 3 tháng M+1** (verify: báo cáo tháng 5/2026 đăng 03/06/2026).

---

## 3. Customs — Tổng cục Hải quan

**URL pattern**: `customs.gov.vn/index.jsp?pageId=4967&tkId={XXXX}`
- `pageId=4967` = trang "Preliminary assessment of Vietnam international merchandise trade"
- `{tkId}` = ID báo cáo, **tăng dần mỗi tháng**, không cố định (VD: tkId=9788 cho tháng 5/2026)

**Portal số liệu lịch sử**: `customs.gov.vn/index.jsp?pageId=4901` — data từ 2009-nay, query theo tháng.

**⚠️ Vấn đề kỹ thuật**: Trang render bằng JavaScript (JSP). WebReader **chỉ lấy metadata, không lấy nội dung**.

**Cách fetch (fallback 2 bước)**:
1. WebSearch tìm tkId: `customs.gov.vn tkId "tháng [M] [Y]" xuất nhập khẩu`
2. Lấy data từ secondary sources (đã trích lead từ Customs):
   - VnEconomy: `vneconomy.vn` — bài tóm tắt XNK hàng tháng
   - Báo Chính phủ: `baochinhphu.vn` — bài tổng hợp
   - OEC: `oec.world` — trade data

**Data thu được** (bổ sung chiều sâu cho NSO sơ bộ):
- XNK tháng đơn + YTD (chính thức)
- XNK theo nhóm hàng (công nghiệp chế biến, tư liệu SX...)
- XNK theo thị trường (TQ/US/EU/ASEAN)
- XNK khu vực FDI vs nội địa
- Cán cân thương mại chi tiết

---

## 4. VBMA — Hiệp hội Thị trường Trái phiếu

**URL pattern**: `vbma.org.vn/storage/reports/{MonthEn}{Year}/{DDMMYYYY}-{DDMMYYYY} BAO CAO TUAN TTP[N].pdf`
- `{MonthEn}` = tên tháng tiếng Anh (March, April, May...) — **tháng publish, không phải RM**
- `{DDMMYYYY}-{DDMMYYYY}` = tuần (VD: `25052026-29052026` cho tuần 25-29/5/2026)
- `[N]` = số suffix đôi khi có (TTTP1, TTTP4...) — không nhất quán

**Listing**: `vbma.org.vn/vi/reports/weekly` — trang index tất cả báo cáo tuần.

**⚠️ Vấn đề kỹ thuật**: URL có `%20` (khoảng trắng) → WebReader báo "Please Enter the Correct URL Format". Phải dùng `curl`.

**Cách fetch**:
```bash
# 1. Tìm URL chính xác qua listing hoặc WebSearch
# 2. curl tải PDF (URL-encode %20)
curl -sL "https://vbma.org.vn/storage/reports/May2026/25052026-29052026%20%20BAO%20CAO%20TUAN%20TTTP.pdf" \
  -o "vbma_weekly_25-29may.pdf"

# 3. pdftotext extract
pdftotext -layout vbma_weekly_25-29may.pdf vbma_weekly_25-29may.txt
```

**Data thu được** (snapshot tuần):
- Lãi suất liên ngân hàng (ON/1W/2W/1M)
- Tỷ giá trung tâm + NHTM
- OMO (Nghiệp vụ thị trường mở)
- TPCP đấu thầu sơ cấp + lợi suất
- TPDN phát hành + giao dịch thứ cấp
- Khối ngoại TPCP

**Áp Time Rule**: Chỉ lấy **tuần có ngày kết thúc ≤ data_cutoff** (VD tuần 25-29/5 OK cho RM 2026-05, tuần 28/5-1/6 phải BỎ).

---

## 5. VNBA — Hiệp hội Ngân hàng

**URL pattern (trang tin)**: `vnba.org.vn/vi/ban-tin-kinh-te-tai-chinh-tien-te-thang-{M}-va-tuan-1-thang-{M+1}-{Y}-{id}.htm`
- `{id}` = số thứ tự bài, tăng dần, không cố định
- VD: `...-thang-5-va-tuan-1-thang-6-2026-22126.htm`

**URL pattern (CDN PDF)**: `s-vnba-cdn.aicms.vn/vnba-media/26/{M}/{DD}/thong-tin-kinh-te-tai-chinh-tien-te-thang-{M}-va-tuan-1-thang-{M+1}-{Y}_{hash}.pdf?md5=...&expires=...`
- **Token expires** → CDN link không hardcode được
- Phải lấy link mới từ trang tin

**⚠️ Vấn đề kỹ thuật**: CDN có `expires` token → phải WebSearch trang tin → click vào → lấy CDN link mới.

**Cách fetch**:
```bash
# 1. WebSearch trang tin
WebSearch: vnba.org.vn "thông tin kinh tế tài chính tiền tệ" tháng [M] 2026

# 2. WebReader trang tin → parse link CDN PDF (trong HTML)

# 3. curl tải PDF CDN
curl -sL "[CDN_URL_with_token]" -o "vnba_monthly_may.pdf"

# 4. pdftotext extract
pdftotext -layout vnba_monthly_may.pdf vnba_monthly_may.txt
```

**Data thu được** (~22 trang, cực kỳ dày):
- **Phần I — Kinh tế TG**: GDP/lạm phát Mỹ/EU/Nhật/Trung, chính sách Fed/ECB/BOJ/PBOC, giá vàng/dầu/hàng hóa, lợi suất TP toàn cầu
- **Phần II — VN**: vĩ mô (lạm phát, IIP, FDI, bán lẻ, DN), thị trường tiền tệ (LNH, huy động, cho vay, tỷ giá, OMO), trái phiếu (CP + DN), chứng khoán (VN-Index, thanh khoản, khối ngoại), thanh toán số/Fintech
- **Phần III — Hội viên**: PBT ngân hàng Q gần nhất (data quý — bỏ theo Rule 2), policy actions (Thông tư NHNN mới)
- **⭐ Gold mine**: đôi khi có **1-2 bảng chuỗi 5 tháng** cho chỉ số chính (CPI YoY, lạm phát cơ bản) — VD `vnba_monthly.txt:425-435` (T1-T5). Dùng để verify trend khi chạy kỳ đầu tiên hoặc backfill history. Khác với snapshot đơn tháng thường thấy

**Áp Time Rule**: **Chỉ lấy phần "tháng X"**. BỎ bảng "Dữ liệu thị trường tuần 1 tháng X+1" (lợi suất/tỷ giá tuần đầu tháng sau).

---

## Cache file naming

Mỗi nguồn cache theo format cố định để dễ tìm:

```
sources_cache/
├── pmi_{month_en}_{YYYY}.html          # VD: pmi_may_2026.html
├── nso_{month_en}_{YYYY}.html          # VD: nso_may_2026.html
├── customs_{month_en}_{YYYY}.txt       # VD: customs_may_2026.txt (secondary sources)
├── vbma_weekly_{DD}-{DD}{month_en}_{YYYY}.pdf   # VD: vbma_weekly_25-29may_2026.pdf
├── vbma_weekly_{DD}-{DD}{month_en}_{YYYY}.txt   # text extract
├── vnba_monthly_{month_en}_{YYYY}.pdf           # VD: vnba_monthly_may_2026.pdf
└── vnba_monthly_{month_en}_{YYYY}.txt           # text extract
```

**Quy tắc**:
- PDF = bằng chứng gốc (không xóa)
- TXT = pdftotext extract (để LLM đọc nhanh hơn)
- HTML = WebReader output (PMI/NSO)
- Mọi số trong `report.json` phải trace được tới 1 file cache cụ thể
