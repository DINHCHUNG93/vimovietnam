# Images — Ảnh minh họa stock photo (Unsplash)

Ảnh minh họa = **lớp visual** làm báo cáo bớt khô cứng. KHÔNG thay thế data — chỉ minh họa concept.

## Mục lục

- [Quy tắc](#quy-tắc)
- [Nguồn: Unsplash (miễn phí, không bản quyền)](#nguồn-unsplash-miễn-phí-không-bản-quyền)
- [Cách tìm + lấy URL ảnh](#cách-tìm--lấy-url-ảnh)
- [URL pattern](#url-pattern)
- [6 vị trí ảnh cố định](#6-vị-trí-ảnh-cố-định)
- [Image schema trong JSON](#image-schema-trong-json)

---

## Quy tắc

### 1. Chỉ 6 ảnh mỗi báo cáo (không spam)
- 1 ảnh Hero (banner trên cùng)
- 5 ảnh special insight (mỗi chuyên đề 1 ảnh)

### 2. Tone ảnh
- Ưu tiên ảnh **concept** (không phải ảnh người cụ thể) → tránh cảm giác cá nhân hóa
- Ảnh nền tối + overlay gradient để text dễ đọc
- Không dùng ảnh có chữ/watermark

### 3. Khi không tìm được ảnh phù hợp
- **Bỏ ảnh, KHÔNG dùng ảnh thay thế kém chất lượng**
- Thà không ảnh còn hơn ảnh sai concept

---

## Nguồn: Unsplash (miễn phí, không bản quyền)

**Unsplash**: `unsplash.com` — thư viện 3M+ ảnh chất lượng cao, **free for commercial use, no attribution required**.

### Tại sao Unsplash (không Pexels/ khác)
- API URL `images.unsplash.com/photo-XXX` chạy trực tiếp trong `<img>`/CSS **không cần API key**
- Image requests **không count rate limit**
- Thư viện ảnh concept kinh tế/tài chính/phương tiện phong phú

### Lưu ý
- Endpoint cũ `source.unsplash.com/random?query=xxx` đã **deprecated** → KHÔNG dùng
- Phải tìm photo cụ thể rồi copy `images.unsplash.com/photo-XXX` URL

---

## Cách tìm + lấy URL ảnh

### Workflow (sau khi biết chủ đề)

```
1. WebSearch: "unsplash photo [concept tiếng Anh]" VD: "unsplash photo inflation shopping"
   ↓
2. Chọn photo cụ thể (URL dạng unsplash.com/photos/...-XXX)
   ↓
3. Đọc trang photo → tìm direct URL: images.unsplash.com/photo-XXX
   ↓
4. Thêm tham số: ?w=1200&q=80&fit=crop (cho hero) hoặc ?w=600&h=300&q=80&fit=crop (cho insight)
   ↓
5. Verify URL load được (WebReader hoặc curl -I 200 OK)
```

### Search keyword gợi ý theo chủ đề

| Chủ đề | Keyword tiếng Anh (search Unsplash) |
|---|---|
| **CPI / Lạm phát** | `inflation shopping`, `grocery prices`, `supermarket market` |
| **Lãi suất** | `bank building`, `finance district`, `money currency` |
| **XNK / Thương mại** | `container ship port`, `cargo export`, `shipping logistics` |
| **Bán lẻ** | `retail shopping`, `market vendor`, `consumer goods` |
| **PMI / Sản xuất** | `factory manufacturing`, `industrial production`, `assembly line` |
| **FDI** | `investment finance`, `business meeting`, `office corporate` |
| **Hero vĩ mô VN** | `Vietnam Hanoi skyline`, `Vietnam city`, `financial district` |

---

## URL pattern

### Direct image URL (sau khi có photo ID)

```
https://images.unsplash.com/photo-{ID}?w={WIDTH}&q={QUALITY}&fit=crop
```

| Vị trí | WIDTH | HEIGHT | Lý do |
|---|---|---|---|
| Hero | 1600 | auto | banner lớn full-width |
| Special insight | 800 | 300 | banner trên mỗi insight |

### Ví dụ photo thật (verify OK tháng 6/2026)

```
# Hero — Vietnam Hanoi skyline
https://images.unsplash.com/photo-1583417319070-4a69db38a675?w=1600&q=80&fit=crop

# CPI — shopping market
https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=300&q=80&fit=crop

# XNK — container ship port
https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=800&h=300&q=80&fit=crop
```

---

## 6 vị trí ảnh cố định

```
┌─── HERO ────────────────────────────────────┐
│ [Ảnh nền banner: Vietnam cityscape]         │
│  📊 BÁO CÁO VĨ MÔ VN · Tháng 5/2026         │
│  Verdict + 4 KPI boxes                      │
└─────────────────────────────────────────────┘

┌─── SPECIAL INSIGHT: CPI ────────────────────┐
│ [Ảnh thumbnail: shopping/grocery]           │
│ 🔥 Lạm phát: CPI vượt mục tiêu              │
└─────────────────────────────────────────────┘

┌─── SPECIAL INSIGHT: PMI ────────────────────┐
│ [Ảnh thumbnail: factory/manufacturing]      │
│ 🏭 Sản xuất: PMI bật tăng                   │
└─────────────────────────────────────────────┘

┌─── SPECIAL INSIGHT: Retail ─────────────────┐
│ [Ảnh thumbnail: market/vendor]              │
│ 🛍️ Tiêu dùng nội địa                        │
└─────────────────────────────────────────────┘

┌─── SPECIAL INSIGHT: Lãi suất ───────────────┐
│ [Ảnh thumbnail: bank/finance]               │
│ 💧 Thanh khoản VND                          │
└─────────────────────────────────────────────┘

┌─── SPECIAL INSIGHT: XNK ────────────────────┐
│ [Ảnh thumbnail: container port]             │
│ 🌍 Ngoại thương                             │
└─────────────────────────────────────────────┘
```

### Overlay CSS (cho text dễ đọc)

Hero và insight banner dùng overlay gradient:
```css
background:linear-gradient(135deg,rgba(10,10,20,0.85) 0%,rgba(28,28,48,0.7) 100%),
  url('https://images.unsplash.com/photo-XXX?w=1600&q=80') center/cover;
```

→ Đậm 70-85% để text vẫn dễ đọc, ảnh chỉ làm nền mood.

---

## Image schema trong JSON

### Hero image

```json
{
  "hero": {
    "image_url": "https://images.unsplash.com/photo-1583417319070-4a69db38a675?w=1600&q=80&fit=crop",
    "image_credit": "Minh Bách Trương / Unsplash",
    "image_concept": "Hanoi skyline night"
  }
}
```

### Special insight image

```json
{
  "special_insights": {
    "cpi_inflation": {
      "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=300&q=80&fit=crop",
      "image_credit": "Unsplash",
      "image_concept": "shopping market inflation",
      "title": "🔥 Lạm phát...",
      ...
    }
  }
}
```

### Trường bắt buộc

| Trường | Bắt buộc | Ý nghĩa |
|---|---|---|
| `image_url` | ✅ | Direct URL Unsplash (có tham số w/q/fit) |
| `image_credit` | ✅ | Tác giả + Unsplash (VD: "Minh Bách Trương / Unsplash") |
| `image_concept` | ⚠️ | Mô tả concept (debug/audit) |

---

## Checklist trước khi render

- [ ] URL load được (HTTP 200)?
- [ ] Ảnh đúng concept chủ đề (không chọn đại)?
- [ ] Có overlay gradient đậm đủ để text dễ đọc?
- [ ] Có `image_credit` ghi tác giả?
- [ ] Mobile: ảnh không vỡ layout?
