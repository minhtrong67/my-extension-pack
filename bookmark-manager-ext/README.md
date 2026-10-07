# 🔖 TagMark — Smart Bookmark Manager

A smarter way to manage your real Chrome bookmarks — add custom tags and notes, search everything instantly, spot duplicates, organize folders, and act on many bookmarks at once, all from one clean Material Design 3 popup. Bilingual (English / Tiếng Việt), themeable, and 100% on-device.

**Author / Tác giả:** gnort67

---

## ⚠️ v1.1.0 — this release fixes a critical packaging bug

The previous package was **missing its entire implementation**: `css/popup.css`, `css/fonts.css`, `js/i18n.js`, `js/storage.js`, `js/theme.js`, `js/main.js`, `js/background.js`, and the `_locales/` folder referenced by `manifest.json`'s `default_locale` were all absent from the zip. Only `popup.html` (unstyled, with no scripts behind it) and the icons survived.

Practical effect: **Chrome would refuse to even install the extension** (a `default_locale` with no matching `_locales` folder is a hard install-time error), and even bypassing that, the popup would have rendered as unstyled HTML with zero working buttons.

Everything above has been rebuilt from the original HTML skeleton and this README's own feature spec, and is now fully implemented and tested — see below.

---

## 🇬🇧 English

### Important: this manages your real Chrome bookmarks
TagMark reads and writes your actual Chrome bookmarks through the official `chrome.bookmarks` API — it is not a separate, disconnected list. Anything you add, edit, move, or delete here also shows up in Chrome's own bookmark manager (`chrome://bookmarks`), and vice versa. Tags and notes are an extra layer TagMark keeps on top, stored only inside the extension and keyed by each bookmark's own id (so two bookmarks pointing at the same URL can carry different tags).

### Features
- **One-click "Bookmark This Page"** — instantly saves the active tab (opens right into the edit view so you can add tags immediately), or opens the existing entry for editing if it's already saved. Never creates a duplicate.
- **Instant search** across titles, URLs, and tags as you type.
- **Custom tags** on any bookmark — Chrome doesn't support this natively, TagMark adds it. Filter by tag with one click; tag chips show a live count.
- **Notes** — attach a private note to any bookmark, shown with a small note icon on the list.
- **Duplicate detection** — a "Duplicates" chip appears automatically whenever the same URL is bookmarked more than once, and duplicate items are badged in the list.
- **Folder browsing & filtering** — pick any folder (including nested ones — selecting a parent folder includes everything in its subfolders too) to see everything inside it; create new folders on the fly while editing a bookmark.
- **Multi-select & bulk actions (new)** — tap the select icon to enter selection mode, then bulk-tag or bulk-delete several bookmarks at once.
- **Sort** by newest, title A-Z, or title Z-A.
- **List or grid view**, remembered as your default.
- Per-item quick actions: open (click), edit, copy URL, delete.
- **Keyboard shortcut (new)** — `Alt+Shift+M` bookmarks the current tab instantly from anywhere, no popup required, with a native notification confirming (or warning you it's already saved).
- **Toolbar badge (new)** — shows your total bookmark count at a glance.
- **Settings panel**
  - Theme: Light / Dark / follows system, plus a one-tap header toggle.
  - Font size: Small / Medium / Large.
  - Interface language: English / Vietnamese, plus a one-tap header toggle.
  - Default view, default sort, show/hide favicons, tags, and folder path.
  - Default folder used by "Bookmark This Page".
- **Export as JSON** — a full backup of every bookmark's URL, title, folder path, tags, and notes.
- **Export as HTML** — a standard Netscape bookmarks file with real nested folders, importable into any browser (Chrome, Firefox, Edge, Safari).
- **Import (JSON)** — merges tags/notes onto matching bookmarks (matched by URL, tags unioned, notes never overwritten if you already have one) and creates any bookmarks from the file that don't exist yet inside a "TagMark Import" folder.
- **Reset extension data** — clears TagMark's own tags/notes/settings only. This **never** deletes or changes your actual Chrome bookmarks.
- Clean Material Design 3 interface, **Be Vietnam Pro** font, crisp inline SVG icons (no emoji, no icon-font dependency), favicons shown via Chrome's built-in favicon service (no external requests) with a graceful fallback icon if one is unavailable.

### Installation (unpacked / developer mode)
1. Unzip this package to a folder on your computer.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the unzipped `tagmark` folder.
5. Pin the TagMark icon to your toolbar.

### Required permissions (and why)
| Permission | Why it's needed |
|---|---|
| `bookmarks` | Read and manage your actual Chrome bookmarks and folders. |
| `storage` | Save your tags, notes, and settings locally. |
| `favicon` | Show each site's favicon using Chrome's built-in favicon service — no external image requests. |
| `activeTab` | Read the URL/title of the page you're on, only when you click "Bookmark This Page" or use the keyboard shortcut. |
| `notifications` | Confirm a keyboard-shortcut bookmark with a native notification. |

TagMark does not request access to browse or read the content of any website.

### Project structure
```
tagmark/
├── manifest.json           Extension manifest (Manifest V3)
├── popup.html               Popup UI (list/search/filters + add/edit form + settings)
├── css/
│   ├── tokens.css           Material Design 3 color/shape/elevation tokens (light + dark)
│   ├── popup.css            Component styles and layout
│   └── fonts.css            Be Vietnam Pro @font-face declarations
├── fonts/                   Be Vietnam Pro (woff2, self-hosted)
├── js/
│   ├── i18n.js               English/Vietnamese dictionary + apply logic
│   ├── storage.js            chrome.storage.local wrapper for settings + tags/notes metadata
│   ├── theme.js              Light/Dark/System theme + font-size + language resolution
│   ├── main.js                All bookmark CRUD, search/filter/sort, bulk actions, import/export
│   └── background.js         Metadata cleanup, toolbar badge, keyboard-shortcut quick-bookmark
├── icons/                   16/32/48/128 px extension icons
└── _locales/en, _locales/vi  Chrome Web Store name/description localization
```

### Tech stack
Plain **HTML, CSS, and JavaScript**, Manifest V3 — no build step, no external runtime dependencies. Uses `chrome.bookmarks` for the actual bookmark data and `chrome.storage.local` for the tags/notes/settings layer.

### Privacy
TagMark never sends your bookmarks anywhere. All data — your Chrome bookmarks, plus the tags/notes/settings TagMark adds — stays on your device, managed by Chrome's own storage and bookmark systems.

---

## 🇻🇳 Tiếng Việt

### Lưu ý quan trọng: đây là công cụ quản lý bookmark Chrome thật
TagMark đọc và ghi trực tiếp vào bookmark Chrome thực tế của bạn thông qua API `chrome.bookmarks` chính thức — đây không phải một danh sách riêng biệt, tách rời. Bất cứ gì bạn thêm, sửa, di chuyển hay xoá ở đây cũng sẽ hiện trong trình quản lý bookmark của chính Chrome (`chrome://bookmarks`), và ngược lại. Thẻ tag và ghi chú là một lớp bổ sung mà TagMark lưu riêng bên trong extension, gắn theo id riêng của từng bookmark.

### Tính năng
- **"Lưu Trang Này Vào Bookmark" chỉ một cú nhấp** — lưu ngay tab đang mở (mở thẳng vào màn hình sửa để thêm tag ngay), hoặc mở để chỉnh sửa nếu trang đã được lưu từ trước. Không bao giờ tạo trùng lặp.
- **Tìm kiếm tức thì** theo tiêu đề, URL và thẻ tag ngay khi gõ.
- **Thẻ tag tuỳ chỉnh** cho bất kỳ bookmark nào. Lọc theo tag chỉ với một cú nhấp, mỗi chip hiển thị số lượng.
- **Ghi chú** — đính kèm ghi chú riêng, hiển thị bằng biểu tượng ghi chú nhỏ trong danh sách.
- **Phát hiện trùng lặp** — thẻ "Trùng lặp" tự động xuất hiện khi có URL nào đó được lưu nhiều hơn một lần.
- **Duyệt & lọc theo thư mục** — chọn bất kỳ thư mục nào (chọn thư mục cha sẽ bao gồm cả các thư mục con bên trong); tạo thư mục mới ngay khi đang sửa một bookmark.
- **Chọn nhiều & thao tác hàng loạt (mới)** — nhấn biểu tượng chọn để vào chế độ chọn nhiều, sau đó gắn tag hoặc xoá nhiều bookmark cùng lúc.
- **Sắp xếp** theo mới nhất, tiêu đề A-Z, hoặc tiêu đề Z-A.
- **Xem dạng danh sách hoặc dạng lưới**, ghi nhớ làm mặc định.
- Thao tác nhanh trên từng mục: mở (nhấp vào), sửa, sao chép URL, xoá.
- **Phím tắt (mới)** — `Alt+Shift+M` lưu ngay tab hiện tại vào bookmark từ bất kỳ đâu, không cần mở popup, có thông báo xác nhận.
- **Huy hiệu thanh công cụ (mới)** — hiển thị tổng số bookmark.
- **Bảng cài đặt**: chủ đề, cỡ chữ, ngôn ngữ, chế độ xem/sắp xếp mặc định, ẩn/hiện biểu tượng/tag/đường dẫn thư mục, thư mục mặc định cho lưu nhanh.
- **Xuất JSON** — sao lưu đầy đủ URL, tiêu đề, đường dẫn thư mục, thẻ tag và ghi chú của mọi bookmark.
- **Xuất HTML** — tệp bookmark chuẩn Netscape với cấu trúc thư mục lồng nhau thật, nhập được vào mọi trình duyệt.
- **Nhập (JSON)** — hợp nhất thẻ tag/ghi chú vào bookmark khớp URL, tạo bookmark chưa tồn tại trong thư mục "TagMark Import".
- **Khôi phục dữ liệu extension** — chỉ xoá thẻ tag/ghi chú/cài đặt riêng của TagMark, **không bao giờ** đụng đến bookmark Chrome thực tế.

### Hướng dẫn cài đặt
1. Giải nén gói này. 2. Mở `chrome://extensions`. 3. Bật **Developer mode**. 4. **Load unpacked** → chọn thư mục `tagmark`. 5. Ghim biểu tượng lên thanh công cụ.

### Quyền cần thiết
`bookmarks` (đọc/quản lý bookmark), `storage` (lưu cài đặt), `favicon` (hiển thị biểu tượng trang), `activeTab` (đọc tab hiện tại khi lưu nhanh), `notifications` (xác nhận khi dùng phím tắt).

---

Made with care by **gnort67**.
