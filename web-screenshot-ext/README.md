# 📸 SmartShot — Screenshot & Annotate

Capture the visible area, the entire scrolling page, or a hand-picked region of any tab — then draw, arrow, redact, and crop it in a full annotation editor before saving. Bilingual (English / Tiếng Việt), themeable, and 100% on-device.

**Author / Tác giả:** gnort67

---

## 🇬🇧 English

### Features

**Three capture modes**
- **Capture Visible Area** — exactly what's on screen right now, instantly.
- **Capture Full Page** — automatically scrolls the page in steps and stitches every piece into one tall image.
- **Capture Selected Area** — drag a rectangle anywhere on the page to capture just that region.

**Full annotation editor** (opens automatically in a new tab after capture)
- **Pen** — freehand drawing.
- **Arrow**, **Rectangle**, **Ellipse** — drag-to-draw shapes.
- **Text** — click anywhere to type a label.
- **Highlight** — semi-transparent marker stroke.
- **Blur / Pixelate** — drag over sensitive info (passwords, personal data) to redact it irreversibly.
- **Crop** — drag to keep only the part you need.
- Color palette with 6 presets plus a custom color picker, adjustable stroke/font size.
- **Undo / Redo** (up to 15 steps) and **Clear all** (reverts to the original capture).
- Save as **PNG** or **JPEG** (with quality control), editable filename, **Download** or **Copy to Clipboard**.

**General**
- **Recent history** of every screenshot you've saved, with thumbnail, capture type, and action. Configurable limit, clearable.
- **Settings panel**
  - Theme: Light / Dark / follows system.
  - Font size: Small / Medium / Large.
  - Interface language: English / Vietnamese.
  - Show/hide the history panel, history size limit.
  - Default format, JPEG quality, full-page scroll delay.
  - **Open editor after capture** toggle (off by default) — when off, screenshots save straight to your default Downloads folder (or copy to clipboard, your choice); when on, the annotation editor opens automatically instead.
- **Import / Export** all settings and history as a JSON file. **Reset to default** with one click.
- All preferences saved locally (`chrome.storage.local`) and restored automatically.
- Clean Material Design 3–inspired interface, **Be Vietnam Pro** font, crisp SVG icons (no emoji).
- Fully responsive, wide popup layout built for a Chrome extension window.

### Installation (unpacked / developer mode)
1. Unzip this package to a folder on your computer.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the unzipped `smartscreenshot` folder.
5. Pin the SmartShot icon to your toolbar and click it on any page to try it out.

### How it works (and its limitations)
- **Visible area**: a single call to Chrome's tab-capture API.
- **Selected area**: a temporary on-page overlay lets you drag-select a rectangle; the visible tab is then captured and cropped to that rectangle via a hidden offscreen canvas page (Chrome's official Offscreen Documents API, required because Manifest V3 service workers can't reliably do canvas work on their own).
- **Full page**: the page is scrolled in viewport-sized steps (with a short delay between each to let content settle), captured at every step, then all the pieces are stitched into one image. **Known limitation:** fixed/sticky elements (sticky headers, cookie banners, chat widgets) may appear repeated once per captured segment, since the extension does not attempt to hide them — this is a common tradeoff of scroll-and-stitch screenshot tools.
- Chrome enforces a rate limit on tab captures (roughly two per second), so the full-page capture always waits at least ~550 ms between steps regardless of the delay you configure lower than that.

### Required permissions (and why)
| Permission | Why it's needed |
|---|---|
| `activeTab` | Grants temporary access to the tab you're capturing, only when you trigger it from the popup — no background access to other tabs. |
| `scripting` | Injects the small helper script used for full-page scrolling and area selection, only on demand. |
| `tabs` | Lets the extension query the active tab and open the editor in a new tab. |
| `downloads` | Saves the final image to your Downloads folder. |
| `storage` | Saves your settings and history locally. |
| `offscreen` | Runs the canvas-based crop/stitch/encode/clipboard operations (see above). |

SmartShot does **not** request access to all websites (`<all_urls>`) — it only ever touches the one tab you actively capture from.

### Project structure
```
smartscreenshot/
├── manifest.json          Extension manifest (Manifest V3)
├── popup.html              Popup UI (capture buttons + history + settings)
├── editor.html             Full-tab annotation editor
├── offscreen.html          Hidden page used for canvas-based image processing
├── css/
│   ├── popup.css           Popup styles, theme tokens
│   ├── editor.css          Editor page styles
│   └── fonts.css           Be Vietnam Pro @font-face declarations
├── fonts/                  Be Vietnam Pro (woff2, self-hosted)
├── js/
│   ├── i18n.js             English/Vietnamese dictionary + apply logic
│   ├── storage.js          chrome.storage wrapper (settings, history, pending capture hand-off)
│   ├── theme.js            Light/Dark/System theme + font-size handling
│   ├── main.js              Popup UI wiring
│   ├── editor.js           Annotation tool logic (drawing, undo/redo, save)
│   ├── background.js       Service worker: capture orchestration, downloads, history
│   ├── content.js          Injected on demand: page metrics, scrolling, area-selection overlay
│   └── offscreen.js        Crop / stitch / encode / clipboard logic (canvas)
├── icons/                  16/32/48/128 px extension icons
└── _locales/en, _locales/vi   Chrome Web Store name/description localization
```

### Tech stack
Plain **HTML, CSS, and JavaScript**, Manifest V3 — no build step, no external runtime dependencies. Uses the Canvas API for annotation/cropping/stitching and Chrome's Offscreen Documents API for MV3 compatibility.

### Privacy
SmartShot never uploads your screenshots anywhere — every capture, edit, and conversion happens locally in your browser. Nothing is sent to any server. Settings and a small history (thumbnails + metadata only) are stored locally on your device.

### Minimum Chrome version
Chrome 109 or later (required for the Offscreen Documents API).

---

## 🇻🇳 Tiếng Việt

### Tính năng

**Ba chế độ chụp**
- **Chụp Vùng Hiển Thị** — đúng phần đang hiện trên màn hình, ngay lập tức.
- **Chụp Toàn Trang** — tự động cuộn trang theo từng bước và ghép tất cả lại thành một ảnh dài.
- **Chụp Vùng Chọn** — kéo một hình chữ nhật ở bất kỳ đâu trên trang để chỉ chụp đúng phần đó.

**Trình chỉnh sửa chú thích đầy đủ** (tự động mở trong tab mới sau khi chụp)
- **Bút vẽ** — vẽ tự do.
- **Mũi tên**, **Hình chữ nhật**, **Hình elip** — kéo để vẽ hình.
- **Chữ** — nhấp vào bất kỳ đâu để gõ nhãn.
- **Đánh dấu** — nét vẽ bán trong suốt kiểu bút highlight.
- **Làm mờ / Che điểm ảnh** — kéo qua thông tin nhạy cảm (mật khẩu, dữ liệu cá nhân) để che vĩnh viễn, không thể phục hồi.
- **Cắt ảnh** — kéo để chỉ giữ lại phần bạn cần.
- Bảng màu 6 màu có sẵn cùng bộ chọn màu tuỳ chỉnh, kích thước nét vẽ/chữ điều chỉnh được.
- **Hoàn tác / Làm lại** (tối đa 15 bước) và **Xoá tất cả** (quay về ảnh chụp gốc ban đầu).
- Lưu dưới dạng **PNG** hoặc **JPEG** (có điều chỉnh chất lượng), tên tệp có thể chỉnh sửa, **Tải xuống** hoặc **Sao chép vào Clipboard**.

**Chung**
- **Lịch sử gần đây** mọi ảnh chụp bạn đã lưu, kèm ảnh thu nhỏ, loại chụp và hành động. Giới hạn tuỳ chỉnh, xoá được.
- **Bảng cài đặt**
  - Chủ đề: Sáng / Tối / Theo hệ thống.
  - Cỡ chữ: Nhỏ / Vừa / Lớn.
  - Ngôn ngữ giao diện: Tiếng Anh / Tiếng Việt.
  - Ẩn/hiện bảng lịch sử, giới hạn số mục lịch sử.
  - Định dạng mặc định, chất lượng JPEG, độ trễ cuộn khi chụp toàn trang.
  - Công tắc **Mở trình chỉnh sửa sau khi chụp** (mặc định TẮT) — khi tắt, ảnh chụp sẽ được lưu thẳng vào thư mục Downloads mặc định của bạn (hoặc sao chép vào clipboard, tuỳ bạn chọn); khi bật, trình chỉnh sửa chú thích sẽ tự động mở thay vào đó.
- **Nhập / Xuất** toàn bộ cài đặt và lịch sử dưới dạng tệp JSON. **Khôi phục mặc định** chỉ với một cú nhấp.
- Mọi tuỳ chỉnh được lưu cục bộ (`chrome.storage.local`) và tự động khôi phục.
- Giao diện hiện đại theo phong cách Material Design 3, font **Be Vietnam Pro**, icon SVG sắc nét (không dùng emoji).
- Bố cục popup responsive, rộng rãi, phù hợp chuẩn cửa sổ tiện ích mở rộng Chrome.

### Hướng dẫn cài đặt (chế độ nhà phát triển)
1. Giải nén gói này vào một thư mục trên máy tính.
2. Mở Chrome và truy cập `chrome://extensions`.
3. Bật **Chế độ dành cho nhà phát triển** (Developer mode) ở góc trên bên phải.
4. Nhấn **Tải tiện ích đã giải nén** (Load unpacked) và chọn thư mục `smartscreenshot` vừa giải nén.
5. Ghim biểu tượng SmartShot lên thanh công cụ và nhấp vào đó trên bất kỳ trang nào để dùng thử.

### Cơ chế hoạt động (và giới hạn)
- **Vùng hiển thị**: một lệnh gọi duy nhất đến API chụp tab của Chrome.
- **Vùng chọn**: một lớp phủ tạm thời trên trang cho phép bạn kéo chọn hình chữ nhật; sau đó tab hiển thị được chụp và cắt theo đúng vùng đó thông qua một trang canvas ẩn (Offscreen Documents API chính thức của Chrome — cần thiết vì service worker của Manifest V3 không thể tự xử lý canvas ổn định).
- **Toàn trang**: trang được cuộn theo từng bước bằng chiều cao khung nhìn (có độ trễ ngắn giữa mỗi bước để nội dung ổn định), chụp ở mỗi bước, rồi ghép tất cả các mảnh lại thành một ảnh. **Giới hạn đã biết:** các phần tử cố định/dính (header dính, banner cookie, widget chat) có thể xuất hiện lặp lại ở mỗi đoạn chụp vì extension không cố gắng ẩn chúng — đây là đánh đổi phổ biến của các công cụ chụp-cuộn-ghép ảnh.
- Chrome giới hạn tốc độ chụp tab (khoảng 2 lần/giây), vì vậy chụp toàn trang luôn chờ ít nhất khoảng 550ms giữa mỗi bước, bất kể bạn đặt độ trễ thấp hơn trong cài đặt.

### Các quyền cần thiết (và lý do)
| Quyền | Lý do cần thiết |
|---|---|
| `activeTab` | Cấp quyền truy cập tạm thời vào tab bạn đang chụp, chỉ khi bạn kích hoạt từ popup — không truy cập nền vào các tab khác. |
| `scripting` | Chèn đoạn script hỗ trợ nhỏ dùng cho cuộn toàn trang và chọn vùng, chỉ khi cần. |
| `tabs` | Cho phép extension truy vấn tab đang hoạt động và mở trình chỉnh sửa trong tab mới. |
| `downloads` | Lưu ảnh cuối cùng vào thư mục Downloads. |
| `storage` | Lưu cài đặt và lịch sử cục bộ. |
| `offscreen` | Chạy các thao tác cắt/ghép/mã hoá/sao chép clipboard dựa trên canvas (xem phần trên). |

SmartShot **không** yêu cầu quyền truy cập mọi trang web (`<all_urls>`) — extension chỉ chạm vào đúng tab bạn đang chủ động chụp.

### Cấu trúc dự án
Xem sơ đồ thư mục ở phần tiếng Anh phía trên — cấu trúc là chung cho cả hai ngôn ngữ.

### Công nghệ sử dụng
**HTML, CSS và JavaScript thuần**, Manifest V3 — không cần bước build, không phụ thuộc thư viện ngoài. Sử dụng Canvas API để chú thích/cắt/ghép ảnh và Offscreen Documents API của Chrome để tương thích MV3.

### Quyền riêng tư
SmartShot không bao giờ tải ảnh chụp màn hình của bạn lên bất kỳ đâu — mọi thao tác chụp, chỉnh sửa và chuyển đổi đều diễn ra cục bộ ngay trên trình duyệt của bạn. Không có gì được gửi đến bất kỳ máy chủ nào. Cài đặt và một phần lịch sử nhỏ (chỉ ảnh thu nhỏ + thông tin mô tả) được lưu cục bộ trên thiết bị của bạn.

### Phiên bản Chrome tối thiểu
Chrome 109 trở lên (yêu cầu để sử dụng Offscreen Documents API).

---

Made with care by **gnort67**.
