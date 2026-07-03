# News Sources — Báo chí để enrich data card

Báo chí = **lớp enrich** (bổ sung), KHÔNG thay thế số liệu chính từ 5 nguồn. Cho 2 thứ 5 nguồn không có: **phân tích chuyên gia** + **giải thích nguyên nhân**.

## Mục lục

- [Nguyên tắc enrich](#nguyên-tắc-enrich)
- [3 nhóm nguồn ưu tiên](#3-nhóm-nguồn-ưu-tiên)
- [Cách fetch + filter](#cách-fetch--filter)
- [News enrichment schema](#news-enrichment-schema)
- [Quy tắc tránh sai](#quy-tắc-tránh-sai)

---

## Nguyên tắc enrich

### Enrichment ≠ số liệu chính

| Vai trò | Data chính | News enrichment |
|---|---|---|
| Số liệu (CPI 5.60%, PMI 52.8...) | ✅ 5 nguồn chính thức (NSO/Customs/...) | ❌ KHÔNG dùng báo chí cho số |
| Phân tích ("vì sao CPI tăng") | ❌ 5 nguồn chỉ có số + nhận định ngắn | ✅ Báo chí trích chuyên gia |
| Quote ("theo SSI Research...") | ❌ | ✅ Báo chí trích báo cáo CTCK |
| Cập nhật real-time | ❌ (data chốt cuối tháng) | ✅ Tin mới nhất trong tháng |

### Time Rule áp dụng cho báo chí

- Chỉ dùng tin **publish trong tháng báo cáo** (≤ data_cutoff 31/05/2026)
- Tin tháng 6 → đẩy sang báo cáo tháng 6 (nhất quán với Time Rule)

### Số lượng

- **1-2 tin enrich mỗi data card** (không spam)
- Ưu tiên tin có **quote chuyên gia** hoặc **số liệu so sánh** cụ thể
- Nếu không có tin chất lượng → KHÔNG enrich (thà trống hơn là tin rác)

---

## 3 nhóm nguồn ưu tiên

### Nhóm A — Báo kinh tế chính thống (chất lượng cao nhất)

| Nguồn | URL | Mạnh về |
|---|---|---|
| **VnEconomy** (Thời báo Kinh tế VN) | vneconomy.vn | Phân tích vĩ mô, CPI, FDI, XNK |
| **Báo Điện tử Chính phủ** | baochinhphu.vn | Công bố chính thức, tổng hợp Bộ |
| **Tạp chí Kinh tế VN** | tapchicongthuong.vn | Ngành, thương mại |
| **Đầu tư** | baodautu.vn | FDI, đầu tư nước ngoài |
| **Thời báo Tài chính VN** | thoibaotaichinhvietnam.vn | Tài chính, ngân sách |

**Query WebSearch**:
```
site:vneconomy.vn [chỉ số] [tháng] [năm]
VD: site:vneconomy.vn CPI tháng 5 2026
```

### Nhóm B — Báo tài chính / chứng khoán (có trích báo cáo CTCK)

| Nguồn | URL | Mạnh về |
|---|---|---|
| **CafeF** | cafef.vn | Trích báo cáo SSI/VDirect/BSC/VNDirect... |
| **Vietstock** | vietstock.vn | Data + phân tích chuyên sâu |
| **VietnamFinance** | vietnamfinance.vn | Tiền tệ, trái phiếu |
| **Dautucophieu** | dautucophieu.vn | Thị trường CK |

**Query WebSearch**:
```
site:cafef.vn "[chỉ số]" [tháng] [năm] (SSI|VDirect|BSC|VNDirect|Mirae)
VD: site:cafef.vn "lãi suất liên ngân hàng" tháng 5 2026 SSI
```

### Nhóm C — Báo ngành (chuyên sâu)

| Nguồn | URL | Mạnh về |
|---|---|---|
| **Công Thương** | congthuong.vn | Xuất nhập khẩu, sản xuất |
| **Hải quan** | haiquanonline.com.vn | XNK chi tiết |
| **Nông nghiệp VN** | nongnghiep.vn | Nông/lâm/thủy sản |
| **Bất động sản» | batdongsan.com.vn | TPDN, BĐS |
| **Điện tử** | ictnews.vn | Công nghệ, viễn thông |

**Query WebSearch**:
```
site:congthuong.vn [ngành/hàng hóa] [tháng] [năm]
VD: site:congthuong.vn xuất khẩu dệt may tháng 5 2026
```

---

## Cách fetch + filter

### Workflow enrich (sau khi data chính đã xong)

```
1. Cho mỗi data card CÓ GIÁ TRỊ KINH TẾ (skip panel/_type):
   ↓
2. WebSearch theo template:
   "[chỉ số tiếng Việt] [tháng] [năm]" site:[nguồn ưu tiên]
   VD: "CPI tháng 5 2026" site:vneconomy.vn
   ↓
3. Filter kết quả:
   - ✅ Đúng tháng báo cáo (publish ≤ data_cutoff)
   - ✅ Có quote chuyên gia HOẶC số liệu so sánh
   - ✅ Nguồn từ 1 trong 3 nhóm ưu tiên
   - ❌ Bỏ tin rác (clickbait, không có insight)
   ↓
4. Extract 1-2 tin tốt nhất → embed vào card
```

### Template WebSearch theo nhóm chỉ số

| Nhóm chỉ số | Query mẫu | Ưu tiên nguồn |
|---|---|---|
| CPI, lạm phát | `"[CPI/lạm phát] tháng [M] [Y]" site:vneconomy.vn` | A (VnEconomy, Báo CP) |
| PMI | `"PMI" "tháng [M]" [Y] site:cafef.vn` | B (CafeF trích S&P) |
| IIP, sản xuất | `"sản xuất công nghiệp" tháng [M] [Y]` | A + C |
| XNK, thương mại | `"xuất nhập khẩu" tháng [M] [Y] site:congthuong.vn` | C + A |
| FDI | `"FDI" "[M] tháng" [Y] site:baodautu.vn` | A (Đầu tư) |
| Lãi suất, LNH, NHNN | `"lãi suất" tháng [M] [Y] site:cafef.vn` | B |
| Trái phiếu, TPCP | `"trái phiếu" tháng [M] [Y] site:vietnamfinance.vn` | B |
| Tỷ giá | `"tỷ giá" tháng [M] [Y]` | B + A |
| Tín dụng, ngân hàng | `"tín dụng" "ngân hàng" tháng [M] [Y]` | B |
| Vàng, dầu | `"giá [vàng/dầu]" tháng [M] [Y]` | A + B |
| Vĩ mô tổng hợp | `"kinh tế vĩ mô" "[M]/[Y]" site:vneconomy.vn` | A |

---

## News enrichment schema

Mỗi news item có cấu trúc:

```json
{
  "news_enrichment": [
    {
      "headline": "CPI tháng 5 tăng 0,29%: Giá điện, nước và xăng dầu tác động lớn",
      "source": "VnEconomy",
      "source_url": "https://vneconomy.vn/cpi-thang-5-tang-029-...",
      "published_date": "2026-06-03",
      "expert_quote": {
        "author": "TS. Nguyễn Trí Hiếu",
        "role": "Chuyên gia kinh tế",
        "text": "Áp lực lạm phát tháng 6 có thể tiếp tục tăng do yếu tố thời tiết và giá năng lượng..."
      },
      "key_insight": "1 câu insight quan trọng nhất từ bài (KHÔNG copy tiêu đề)",
      "sentiment": "TIÊU CỰC",
      "relevance": "GIẢI THÍCH vì sao CPI tăng (điện nước + xăng)"
    }
  ]
}
```

### Trường bắt buộc vs tùy chọn

| Trường | Bắt buộc | Khi nào thêm |
|---|---|---|
| `headline`, `source`, `source_url`, `published_date` | ✅ Luôn | — |
| `key_insight` | ✅ Luôn | 1 câu chắt nhất |
| `sentiment` | ✅ Luôn | TÍCH CỰC/TRUNG TÍNH/TIÊU CỰC |
| `expert_quote` | ⚠️ Khi có | 1 quote chuyên gia (tên + role) |
| `relevance` | ⚠️ Khi cần làm rõ | "GIẢI THÍCH vì sao", "XÁC NHẬN số liệu", "DỰ BÁO xu hướng" |

---

## Quy tắc tránh sai

### ❌ Sai thường gặp

1. **Dùng số liệu báo chí thay số liệu chính thức** — VD báo chí ghi "CPI 5.5%" khác NSO 5.60% → vẫn dùng NSO, báo chí chỉ enrich context
2. **Tin cũ** — `search_recency_filter=oneMonth` không tin cậy cho VN, phải filter thủ công theo `published_date ≤ data_cutoff`
3. **Tin rác / clickbait** — VD "CPI tăng sốc!" không có nội dung → bỏ
4. **Trùng lặp** — nhiều báo copy tin từ NSO → chỉ lấy 1 nguồn, ưu tiên báo phân tích sâu (không copy-paste)
5. **Quá nhiều tin** — 1 card có 5 tin → giảm chất lượng. Tối đa 2 tin / card

### ✅ Đúng

1. **Cross-check số liệu báo chí vs chính thức** — nếu báo chí cho số khác, note `conflict_note` nhưng vẫn dùng số chính thức
2. **Ưu tiên tin có quote chuyên gia** — VD "theo SSI Research, lãi suất H2 có thể hạ nhiệt"
3. **Lấy insight, không copy tiêu đề** — `key_insight` phải là 1 câu chắt nhất, KHÔNG lặp headline
4. **Sentiment đúng** — đánh giá tổng thể bài, không chỉ tiêu đề (VD tiêu đề tiêu cực nhưng body trung tính)

### Kiểm tra cuối trước khi embed

- [ ] Tin publish ≤ data_cutoff?
- [ ] Tin từ 1 trong 3 nhóm ưu tiên?
- [ ] Có quote chuyên gia hoặc insight cụ thể?
- [ ] Source URL hoạt động?
- [ ] Sentiment đánh đúng?
- [ ] Insight KHÔNG trùng headline?

→ Pass hết → embed vào card. Fail bất kỳ → bỏ tin.
