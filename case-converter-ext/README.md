<div align="center">

<img src="icons/icon128.png" width="88" height="88" alt="Case Converter logo" />

# Case Converter

**A Material Design 3 Chrome extension for converting text case — anywhere on the web.**

[English](#english) · [Tiếng Việt](#tiếng-việt)

</div>

---

<a id="english"></a>

## English

### Table of contents
- [Overview](#overview)
- [Features](#features)
- [The killer feature: in‑page shortcuts](#the-killer-feature-in-page-shortcuts)
- [Installation](#installation)
- [Usage](#usage)
- [Settings](#settings)
- [Project structure](#project-structure)
- [Privacy](#privacy)
- [Tech notes for developers](#tech-notes-for-developers)
- [Roadmap](#roadmap)
- [License](#license)

### Overview

Case Converter is a lightweight Chrome extension that converts text between cases — `UPPERCASE`, `lowercase`, `Capitalize Each Word`, `Sentence case`, `Title Case`, `aLTERNATING cASE`, `snake_case`, `kebab-case`, `camelCase`, and more — from a clean popup **or directly inside any text field on any website**, using configurable keyboard shortcuts.

The UI follows **Material Design 3**: tonal color roles, pill-shaped buttons, elevation-free tonal surfaces, and full support for **light, dark, and system** theme, in **English and Vietnamese**, with a choice of **Be Vietnam Pro** (default) or **Inter** as the interface font.

### Features

- 🔤 **11 case styles** — UPPERCASE, lowercase, Capitalize Each Word, Sentence case, Title Case, aLTERNATING cASE, InVeRsE CaSe, snake_case, kebab-case, camelCase, trim extra spaces
- ⚡ **Global in-page shortcuts** that work inside inputs, textareas, and rich `contenteditable` composers (Facebook, TikTok, X, LinkedIn, Gmail, Notion, and virtually anywhere else)
- 🎨 **Material Design 3** interface — tonal palettes, segmented controls, MD3 switches, elevation-appropriate surfaces
- 🌗 **Light / Dark / System** theme, applied instantly across popup and settings
- 🌐 **English & Vietnamese** interface, switchable at any time
- 🔠 **Be Vietnam Pro** (default) or **Inter** font, loaded from Google Fonts
- 🖱️ **Right-click context menu** for converting a selection without touching the keyboard
- 🚫 **Per-site disable list** — turn shortcuts off on sites where they might conflict
- 🔒 **100% local** — no analytics, no network calls, no data collection

### The killer feature: in‑page shortcuts

Most case-converter extensions only transform text that you paste *into the extension's own popup*. Case Converter goes further: press a shortcut (`Alt + C` by default for **Capitalize Each Word**) while typing **directly into a Facebook post, a TikTok caption, a tweet, an email, or any other input field**, and the field's actual content is rewritten in place — not just displayed differently.

That means when you publish the post, **the published text is the converted text**, exactly as intended — not the original casing.

How it works, technically:
- For native `<input>` / `<textarea>` fields, the extension writes the new value through the field's native property setter and dispatches real `input`/`change` events, so frameworks like React (used by Facebook and TikTok) pick up the change as if you had typed it.
- For rich `contenteditable` composers (Draft.js, Lexical, and similar editors), the extension selects the relevant text and replaces it using the browser's native text-insertion command, which these editors already listen to as genuine user input — keeping undo history and the editor's internal state consistent.
- If there is a text selection, only the selection is converted; otherwise, the whole field is converted.

Default shortcuts (all customizable in **Settings → Keyboard Shortcuts**):

| Shortcut | Action |
|---|---|
| `Alt + U` | UPPERCASE |
| `Alt + L` | lowercase |
| `Alt + C` | Capitalize Each Word |
| `Alt + S` | Sentence case |
| `Alt + T` | Title Case |
| `Alt + X` | aLTERNATING cASE |

### Installation

**From source (Developer Mode):**
1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome (or any Chromium-based browser: Edge, Brave, Opera…).
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the extension folder.
5. Pin the extension from the toolbar for quick access.

**From the Chrome Web Store:** *(link to be added once published)*

### Usage

1. Click the extension icon to open the popup.
2. Type or paste text into the input box.
3. Click any tool chip (e.g. **UPPERCASE**, **Title Case**) to convert it.
4. Use **Copy** to copy the result, or **Use as input** to chain conversions.
5. Anywhere else on the web, place your cursor in a text field and press a shortcut (e.g. `Alt + C`) to convert in place — select text first to convert only the selection.
6. Right-click a text field or selection for the same tools via the context menu.

### Settings

Open **Settings** from the gear icon in the popup, or via `chrome://extensions` → *Case Converter* → *Extension options*.

- **Appearance** — Theme (Light / Dark / System), Language (English / Tiếng Việt), Font (Be Vietnam Pro / Inter)
- **Keyboard Shortcuts** — enable/disable in-page shortcuts globally, and re-record any shortcut by clicking it and pressing a new key combination (a modifier key is required)
- **Disabled on these sites** — list domains (one per line) where in-page shortcuts should not fire, useful for sites with conflicting shortcuts
- **About** — version info, source code, issue tracker, and a one-click reset to defaults

### Project structure

```
case-converter-extension/
├── manifest.json            # Manifest V3 configuration
├── background.js            # Service worker — context menu
├── content.js                # In-page shortcut engine (runs on every page)
├── content.css               # Toast notification style
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── options/
│   ├── options.html
│   ├── options.css
│   └── options.js
├── js/
│   ├── case-utils.js         # Pure text-transformation functions
│   ├── i18n.js                # English/Vietnamese string dictionary
│   └── settings.js           # Shared settings schema + chrome.storage helpers
├── icons/                    # MD3-style icon, 16/32/48/128px
└── _locales/                 # Chrome Web Store listing strings (en, vi)
```

### Privacy

Case Converter performs all text transformations **locally in the browser**. It does not use `remote code`, does not send text to any server, does not include analytics or tracking, and only requests the permissions it needs to function:

- `storage` — to save your settings
- `contextMenus` — to show the right-click menu
- `activeTab` / `scripting` — to apply a conversion to the page you're on
- Host access (`<all_urls>`) — required so the in-page shortcut can work on any site you choose to use it on; it is never used to read or transmit your browsing data

### Tech notes for developers

- **Manifest V3**, no build step required — plain HTML/CSS/JS.
- Case transforms live in `js/case-utils.js` as pure functions (`CaseUtils.apply(id, text)`), reused identically by the popup and the content script.
- Settings are stored via `chrome.storage.sync` under a single `caseConverterSettings` key (see `js/settings.js`) and propagate live to every open popup/options/content script via `chrome.storage.onChanged`.
- Unicode-safe: transformations use `\p{L}` Unicode property matching rather than ASCII `\w`/`\b`, so Vietnamese diacritics (à, ế, ộ, …) are handled correctly.
- To add a new case style: add a function to `CaseUtils.transforms` in `js/case-utils.js`, add its id to `CaseUtils.ORDER`, and add an English/Vietnamese label in `js/i18n.js`.

### Roadmap

- [ ] Chrome Web Store listing
- [ ] Firefox (Manifest V3 / WebExtensions) build
- [ ] Per-site custom shortcut overrides
- [ ] Additional locales

### License

MIT — see [`LICENSE`](./LICENSE).

---

<a id="tiếng-việt"></a>

## Tiếng Việt

### Mục lục
- [Giới thiệu](#giới-thiệu)
- [Tính năng](#tính-năng)
- [Tính năng nổi bật: phím tắt ngay trong trang](#tính-năng-nổi-bật-phím-tắt-ngay-trong-trang)
- [Cài đặt tiện ích](#cài-đặt-tiện-ích)
- [Cách sử dụng](#cách-sử-dụng)
- [Trang cài đặt](#trang-cài-đặt)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Quyền riêng tư](#quyền-riêng-tư)
- [Ghi chú kỹ thuật cho lập trình viên](#ghi-chú-kỹ-thuật-cho-lập-trình-viên)
- [Lộ trình phát triển](#lộ-trình-phát-triển)
- [Giấy phép](#giấy-phép)

### Giới thiệu

Case Converter là tiện ích Chrome gọn nhẹ giúp chuyển đổi kiểu chữ — `UPPERCASE` (CHỮ HOA), `lowercase` (chữ thường), `Capitalize Each Word` (Viết Hoa Từng Từ), `Sentence case` (Viết hoa đầu câu), `Title Case` (Viết Hoa Tiêu Đề), `aLTERNATING cASE` (chữ xen kẽ), `snake_case`, `kebab-case`, `camelCase`, và nhiều hơn nữa — ngay từ cửa sổ popup gọn gàng **hoặc trực tiếp trong bất kỳ ô nhập liệu nào trên mọi trang web**, thông qua phím tắt có thể tuỳ chỉnh.

Giao diện được thiết kế theo **Material Design 3**: hệ màu tonal, nút bo tròn dạng pill, bề mặt phẳng không đổ bóng rườm rà, hỗ trợ đầy đủ chủ đề **sáng, tối và theo hệ thống**, hai ngôn ngữ **Tiếng Việt và Tiếng Anh**, cùng lựa chọn phông chữ **Be Vietnam Pro** (mặc định) hoặc **Inter**.

### Tính năng

- 🔤 **11 kiểu chữ** — CHỮ HOA, chữ thường, Viết Hoa Từng Từ, Viết hoa đầu câu, Viết Hoa Tiêu Đề, chữ xen kẽ, đảo ngược chữ hoa, snake_case, kebab-case, camelCase, xoá khoảng trắng thừa
- ⚡ **Phím tắt hoạt động ngay trong trang** — áp dụng trực tiếp trong ô input, textarea, và cả vùng soạn thảo `contenteditable` phức tạp (Facebook, TikTok, X, LinkedIn, Gmail, Notion, và hầu hết mọi nơi khác)
- 🎨 Giao diện **Material Design 3** — bảng màu tonal, điều khiển dạng segmented, công tắc chuẩn MD3
- 🌗 Chủ đề **Sáng / Tối / Theo hệ thống**, áp dụng tức thì cho cả popup và trang cài đặt
- 🌐 Giao diện **Tiếng Việt & Tiếng Anh**, chuyển đổi bất cứ lúc nào
- 🔠 Phông chữ **Be Vietnam Pro** (mặc định) hoặc **Inter**, tải từ Google Fonts
- 🖱️ **Menu chuột phải** để chuyển đổi văn bản đã chọn mà không cần dùng phím tắt
- 🚫 **Danh sách trang bị tắt** — tắt phím tắt trên các trang có thể xảy ra xung đột
- 🔒 **Xử lý hoàn toàn cục bộ** — không thu thập dữ liệu, không phân tích, không gửi bất kỳ thông tin nào ra ngoài

### Tính năng nổi bật: phím tắt ngay trong trang

Hầu hết các tiện ích chuyển đổi kiểu chữ chỉ hoạt động với văn bản được dán *vào popup của chính tiện ích*. Case Converter làm được nhiều hơn thế: nhấn một phím tắt (mặc định `Alt + C` cho **Viết Hoa Từng Từ**) ngay khi đang gõ **trực tiếp vào bài đăng Facebook, chú thích TikTok, một dòng tweet, email, hoặc bất kỳ ô nhập liệu nào khác**, nội dung thực tế của ô đó sẽ được viết lại ngay tại chỗ — chứ không chỉ hiển thị khác đi.

Điều đó có nghĩa là khi bạn đăng bài, **văn bản được đăng chính là văn bản đã được chuyển đổi**, đúng như bạn mong muốn — không phải kiểu chữ ban đầu.

Cách hoạt động (kỹ thuật):
- Với các ô `<input>` / `<textarea>` gốc, tiện ích ghi giá trị mới thông qua setter gốc của phần tử và phát ra sự kiện `input`/`change` thật, để các framework như React (được Facebook và TikTok sử dụng) nhận diện thay đổi như thể bạn vừa gõ.
- Với các trình soạn thảo `contenteditable` phức tạp (Draft.js, Lexical và tương tự), tiện ích chọn đoạn văn bản liên quan và thay thế bằng lệnh chèn văn bản gốc của trình duyệt — lệnh mà các trình soạn thảo này vốn đã lắng nghe như thao tác gõ thật của người dùng, giúp giữ nguyên lịch sử hoàn tác (undo) và trạng thái nội bộ của trình soạn thảo.
- Nếu đang có vùng văn bản được chọn, chỉ vùng đó được chuyển đổi; nếu không, toàn bộ nội dung ô sẽ được chuyển đổi.

Phím tắt mặc định (đều có thể tuỳ chỉnh trong **Cài đặt → Phím tắt**):

| Phím tắt | Chức năng |
|---|---|
| `Alt + U` | CHỮ HOA |
| `Alt + L` | chữ thường |
| `Alt + C` | Viết Hoa Từng Từ |
| `Alt + S` | Viết hoa đầu câu |
| `Alt + T` | Viết Hoa Tiêu Đề |
| `Alt + X` | chữ xen kẽ |

### Cài đặt tiện ích

**Từ mã nguồn (chế độ Nhà phát triển):**
1. Tải về hoặc clone kho mã nguồn này.
2. Mở `chrome://extensions` trên Chrome (hoặc trình duyệt nền Chromium khác: Edge, Brave, Opera…).
3. Bật **Chế độ nhà phát triển** (góc trên bên phải).
4. Nhấn **Tải tiện ích đã giải nén** và chọn thư mục tiện ích.
5. Ghim tiện ích trên thanh công cụ để truy cập nhanh.

**Từ Chrome Web Store:** *(liên kết sẽ được cập nhật sau khi phát hành)*

### Cách sử dụng

1. Nhấp vào biểu tượng tiện ích để mở popup.
2. Nhập hoặc dán văn bản vào ô nhập.
3. Nhấn vào một công cụ (ví dụ **CHỮ HOA**, **Viết Hoa Tiêu Đề**) để chuyển đổi.
4. Dùng **Sao chép** để lấy kết quả, hoặc **Dùng làm đầu vào** để chuyển đổi tiếp.
5. Ở bất kỳ đâu khác trên web, đặt con trỏ vào ô nhập liệu và nhấn phím tắt (ví dụ `Alt + C`) để chuyển đổi ngay tại chỗ — chọn văn bản trước nếu chỉ muốn chuyển đổi phần đã chọn.
6. Nhấp chuột phải vào ô nhập hoặc văn bản đã chọn để dùng cùng các công cụ qua menu ngữ cảnh.

### Trang cài đặt

Mở **Cài đặt** từ biểu tượng bánh răng trong popup, hoặc qua `chrome://extensions` → *Case Converter* → *Tùy chọn tiện ích*.

- **Giao diện** — Chủ đề (Sáng / Tối / Theo hệ thống), Ngôn ngữ (Tiếng Anh / Tiếng Việt), Phông chữ (Be Vietnam Pro / Inter)
- **Phím tắt** — bật/tắt phím tắt trong trang trên toàn cục, và ghi lại phím tắt mới bằng cách nhấp vào rồi nhấn tổ hợp phím mong muốn (bắt buộc có ít nhất một phím bổ trợ)
- **Tắt trên các trang sau** — liệt kê tên miền (mỗi dòng một tên) muốn tắt phím tắt, hữu ích cho các trang có xung đột phím tắt
- **Giới thiệu** — thông tin phiên bản, mã nguồn, nơi báo lỗi, và nút đặt lại toàn bộ cài đặt về mặc định

### Cấu trúc dự án

```
case-converter-extension/
├── manifest.json            # Cấu hình Manifest V3
├── background.js            # Service worker — menu ngữ cảnh
├── content.js                # Bộ máy phím tắt trong trang (chạy trên mọi trang)
├── content.css               # Kiểu dáng thông báo toast
├── popup/                    # Giao diện popup
├── options/                  # Giao diện trang cài đặt
├── js/
│   ├── case-utils.js         # Các hàm chuyển đổi văn bản thuần
│   ├── i18n.js                # Từ điển chuỗi Tiếng Anh/Tiếng Việt
│   └── settings.js           # Schema cài đặt dùng chung + hỗ trợ chrome.storage
├── icons/                    # Icon phong cách MD3, các cỡ 16/32/48/128px
└── _locales/                 # Chuỗi hiển thị trên Chrome Web Store (en, vi)
```

### Quyền riêng tư

Case Converter thực hiện toàn bộ việc chuyển đổi văn bản **ngay trên trình duyệt của bạn**. Tiện ích không dùng mã từ xa, không gửi văn bản lên bất kỳ máy chủ nào, không có công cụ phân tích hay theo dõi, và chỉ yêu cầu những quyền cần thiết để hoạt động:

- `storage` — lưu cài đặt của bạn
- `contextMenus` — hiển thị menu chuột phải
- `activeTab` / `scripting` — áp dụng chuyển đổi lên trang bạn đang xem
- Quyền truy cập trang (`<all_urls>`) — cần thiết để phím tắt trong trang hoạt động trên bất kỳ trang nào bạn chọn sử dụng; quyền này không bao giờ được dùng để đọc hay truyền dữ liệu duyệt web của bạn

### Ghi chú kỹ thuật cho lập trình viên

- **Manifest V3**, không cần bước build — HTML/CSS/JS thuần.
- Các hàm chuyển đổi kiểu chữ nằm trong `js/case-utils.js` dưới dạng hàm thuần (`CaseUtils.apply(id, text)`), dùng chung y hệt giữa popup và content script.
- Cài đặt được lưu qua `chrome.storage.sync` dưới một khoá duy nhất `caseConverterSettings` (xem `js/settings.js`), và đồng bộ trực tiếp tới mọi popup/trang cài đặt/content script đang mở thông qua `chrome.storage.onChanged`.
- An toàn với Unicode: các phép biến đổi dùng biểu thức chính quy `\p{L}` (Unicode property) thay vì `\w`/`\b` kiểu ASCII, nên dấu tiếng Việt (à, ế, ộ, …) được xử lý chính xác.
- Để thêm một kiểu chữ mới: thêm hàm vào `CaseUtils.transforms` trong `js/case-utils.js`, thêm id vào `CaseUtils.ORDER`, và thêm nhãn Tiếng Anh/Tiếng Việt trong `js/i18n.js`.

### Lộ trình phát triển

- [ ] Đăng tải lên Chrome Web Store
- [ ] Bản dành cho Firefox (Manifest V3 / WebExtensions)
- [ ] Tuỳ chỉnh phím tắt riêng theo từng trang
- [ ] Bổ sung thêm ngôn ngữ

### Giấy phép

MIT — xem [`LICENSE`](./LICENSE).

