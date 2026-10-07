# ▶️ TubeShot — YouTube Screenshot

Capture clean, control-free frames from any YouTube video at the exact moment you want — no player UI, no browser chrome, just the video. Fine-tune the exact frame with frame-by-frame seek controls, add an optional timestamp or title caption, and save straight to your Downloads or clipboard. Bilingual (English / Tiếng Việt), themeable, and 100% on-device.

**Author / Tác giả:** gnort67

---

## 🇬🇧 English

### Why this is better than a generic screenshot tool
Regular screenshot tools capture whatever is on your screen — including the video player's controls, YouTube's UI, and your other browser chrome. TubeShot instead reads the actual video frame directly from the page (via a canvas draw of the `<video>` element), so every capture is a perfectly clean frame at the exact playback position — with nothing else in the shot unless you explicitly turn on the optional caption/timestamp overlay.

### Features
- **Live video panel** — shows the current video's title, channel, and a live-updating time bar whenever you're on a YouTube watch page.
- **Frame-precise playback controls** — step -10s / -1s / +1s / +10s, play/pause, or jump straight to any timestamp by typing it in (`mm:ss` or `hh:mm:ss`).
- **Capture Frame** — instantly saves a clean frame to your Downloads folder.
- **Capture & copy to clipboard** — grabs the frame straight to your clipboard instead, ready to paste anywhere.
- **Optional timestamp watermark** — a small badge in the corner showing the exact video time the frame was taken at.
- **Optional title & channel caption** — adds a strip below the frame with the video title, channel name, and timestamp — handy for sharing with context.
- **Format & scale controls** — PNG (lossless) or JPEG (adjustable quality), and capture at 100/75/50/25% of the video's native resolution to keep file sizes down.
- **Recent captures history** — thumbnail, title, channel, and timestamp for your last several captures; exportable to `.txt`, clearable.
- **Settings panel**
  - Theme: Light / Dark / follows system.
  - Font size: Small / Medium / Large.
  - Interface language: English / Vietnamese.
  - Show/hide the history panel, history size limit.
  - JPEG quality slider.
- **Import / Export** all settings and history as a JSON file. **Reset to default** with one click.
- All preferences saved locally (`chrome.storage.local`) and restored automatically.
- Clean Material Design 3–inspired interface, **Be Vietnam Pro** font, crisp SVG icons (no emoji).
- Fully responsive, wide popup layout built for a Chrome extension window.

### Installation (unpacked / developer mode)
1. Unzip this package to a folder on your computer.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the unzipped `tubeshot` folder.
5. Pin the TubeShot icon to your toolbar, open any YouTube video, and click it.

### How it works
TubeShot's content script runs only on `youtube.com` pages. When you click Capture, it finds the page's `<video>` element and draws its current frame onto a canvas — the same technique YouTube's own "Share at current time" style tools use — then encodes it as PNG or JPEG. No screen-recording APIs, no tab-capture permissions, and no data ever leaves your browser.

### Required permissions (and why)
| Permission | Why it's needed |
|---|---|
| `storage` | Saves your settings and capture history locally. |
| `downloads` | Saves the captured frame to your Downloads folder. |
| Host access to `youtube.com` / `m.youtube.com` | Lets TubeShot's content script find the video element and read its current frame — it cannot see or run on any other website. |

### Project structure
```
tubeshot/
├── manifest.json          Extension manifest (Manifest V3)
├── popup.html              Popup UI (playback controls + capture + history + settings)
├── css/
│   ├── popup.css           Styles, theme tokens, responsive layout
│   └── fonts.css           Be Vietnam Pro @font-face declarations
├── fonts/                  Be Vietnam Pro (woff2, self-hosted)
├── js/
│   ├── i18n.js             English/Vietnamese dictionary + apply logic
│   ├── storage.js          chrome.storage.local wrapper (settings + history)
│   ├── theme.js            Light/Dark/System theme + font-size handling
│   ├── main.js              Popup UI wiring, status polling, capture orchestration
│   └── content.js          Runs on YouTube pages: finds the video, captures frames, playback control
├── icons/                  16/32/48/128 px extension icons
└── _locales/en, _locales/vi   Chrome Web Store name/description localization
```

### Tech stack
Plain **HTML, CSS, and JavaScript**, Manifest V3 — no build step, no external runtime dependencies. Uses the Canvas API to read video frames directly.

### Known limitations
- Only works on the standard YouTube watch page and Shorts (`youtube.com`, `m.youtube.com`) — not on embedded YouTube players on other sites.
- History only stores a small thumbnail and metadata for each capture, not the full-resolution image, to keep storage usage low — re-download isn't available from the history list, only from the moment you capture.
- If YouTube ever changes its internal page structure significantly, the video title/channel detection may need updating (the capture itself is unaffected since it reads the `<video>` element directly).

### Privacy
TubeShot never sends anything to any server. All capturing happens locally via the Canvas API, and your settings/history are stored only on your device.

---

## 🇻🇳 Tiếng Việt

### Vì sao tốt hơn công cụ chụp màn hình thông thường
Các công cụ chụp màn hình thông thường sẽ chụp mọi thứ đang hiển thị trên màn hình — bao gồm cả thanh điều khiển video, giao diện YouTube, và cả trình duyệt của bạn. TubeShot thay vào đó đọc trực tiếp khung hình video từ chính trang (bằng cách vẽ phần tử `<video>` lên canvas), nên mỗi lần chụp đều cho ra khung hình hoàn toàn sạch, đúng vị trí phát — không có gì khác trong ảnh trừ khi bạn chủ động bật tuỳ chọn chú thích/mốc thời gian.

### Tính năng
- **Bảng thông tin video trực tiếp** — hiện tiêu đề video hiện tại, tên kênh và thanh thời gian cập nhật liên tục khi bạn đang ở trang xem video YouTube.
- **Điều khiển phát chính xác từng khung hình** — tua -10s / -1s / +1s / +10s, phát/tạm dừng, hoặc nhảy thẳng đến bất kỳ mốc thời gian nào bằng cách gõ vào (`mm:ss` hoặc `hh:mm:ss`).
- **Chụp Khung Hình** — lưu ngay khung hình sạch vào thư mục Downloads.
- **Chụp và sao chép vào clipboard** — lấy khung hình thẳng vào clipboard, sẵn sàng dán ở bất kỳ đâu.
- **Đóng dấu thời gian tuỳ chọn** — một huy hiệu nhỏ ở góc ảnh hiện chính xác thời điểm video khi chụp.
- **Chú thích tiêu đề & kênh tuỳ chọn** — thêm một dải bên dưới khung hình gồm tiêu đề video, tên kênh và mốc thời gian — tiện khi chia sẻ kèm ngữ cảnh.
- **Điều khiển định dạng & tỉ lệ** — PNG (không nén mất dữ liệu) hoặc JPEG (chất lượng điều chỉnh được), và chụp ở 100/75/50/25% độ phân giải gốc của video để giảm dung lượng tệp.
- **Lịch sử ảnh đã chụp gần đây** — ảnh thu nhỏ, tiêu đề, kênh và mốc thời gian cho các lần chụp gần nhất; xuất ra `.txt`, xoá được.
- **Bảng cài đặt**
  - Chủ đề: Sáng / Tối / Theo hệ thống.
  - Cỡ chữ: Nhỏ / Vừa / Lớn.
  - Ngôn ngữ giao diện: Tiếng Anh / Tiếng Việt.
  - Ẩn/hiện bảng lịch sử, giới hạn số mục lịch sử.
  - Thanh trượt chất lượng JPEG.
- **Nhập / Xuất** toàn bộ cài đặt và lịch sử dưới dạng tệp JSON. **Khôi phục mặc định** chỉ với một cú nhấp.
- Mọi tuỳ chỉnh được lưu cục bộ (`chrome.storage.local`) và tự động khôi phục.
- Giao diện hiện đại theo phong cách Material Design 3, font **Be Vietnam Pro**, icon SVG sắc nét (không dùng emoji).
- Bố cục popup responsive, rộng rãi, phù hợp chuẩn cửa sổ tiện ích mở rộng Chrome.

### Hướng dẫn cài đặt (chế độ nhà phát triển)
1. Giải nén gói này vào một thư mục trên máy tính.
2. Mở Chrome và truy cập `chrome://extensions`.
3. Bật **Chế độ dành cho nhà phát triển** (Developer mode) ở góc trên bên phải.
4. Nhấn **Tải tiện ích đã giải nén** (Load unpacked) và chọn thư mục `tubeshot` vừa giải nén.
5. Ghim biểu tượng TubeShot lên thanh công cụ, mở bất kỳ video YouTube nào rồi nhấp vào biểu tượng.

### Cơ chế hoạt động
Content script của TubeShot chỉ chạy trên các trang `youtube.com`. Khi bạn nhấn Chụp, nó tìm phần tử `<video>` của trang và vẽ khung hình hiện tại lên canvas — cùng kỹ thuật mà các công cụ kiểu "Chia sẻ tại thời điểm hiện tại" của chính YouTube sử dụng — sau đó mã hoá thành PNG hoặc JPEG. Không dùng API ghi màn hình, không cần quyền chụp tab, và không có dữ liệu nào rời khỏi trình duyệt của bạn.

### Các quyền cần thiết (và lý do)
| Quyền | Lý do cần thiết |
|---|---|
| `storage` | Lưu cài đặt và lịch sử chụp cục bộ. |
| `downloads` | Lưu khung hình đã chụp vào thư mục Downloads. |
| Quyền truy cập `youtube.com` / `m.youtube.com` | Cho phép content script của TubeShot tìm phần tử video và đọc khung hình hiện tại — nó không thể thấy hay chạy trên bất kỳ trang web nào khác. |

### Cấu trúc dự án
Xem sơ đồ thư mục ở phần tiếng Anh phía trên — cấu trúc là chung cho cả hai ngôn ngữ.

### Công nghệ sử dụng
**HTML, CSS và JavaScript thuần**, Manifest V3 — không cần bước build, không phụ thuộc thư viện ngoài. Sử dụng Canvas API để đọc khung hình video trực tiếp.

### Giới hạn đã biết
- Chỉ hoạt động trên trang xem video YouTube chuẩn và Shorts (`youtube.com`, `m.youtube.com`) — không hoạt động trên trình phát YouTube nhúng ở các trang web khác.
- Lịch sử chỉ lưu ảnh thu nhỏ và thông tin mô tả cho mỗi lần chụp, không lưu ảnh độ phân giải đầy đủ, để giữ dung lượng lưu trữ thấp — không thể tải lại từ danh sách lịch sử, chỉ có thể tải ngay tại thời điểm chụp.
- Nếu YouTube thay đổi đáng kể cấu trúc trang nội bộ, việc nhận diện tiêu đề/kênh video có thể cần cập nhật (bản thân việc chụp ảnh không bị ảnh hưởng vì đọc trực tiếp từ phần tử `<video>`).

### Quyền riêng tư
TubeShot không bao giờ gửi bất kỳ gì đến máy chủ nào. Toàn bộ việc chụp diễn ra cục bộ qua Canvas API, và cài đặt/lịch sử của bạn chỉ được lưu trên thiết bị của bạn.

---

Made with care by **gnort67**.
