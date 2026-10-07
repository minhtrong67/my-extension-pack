# 🔄 PixFlip — Image Format Converter

A fast, private Chrome extension for converting images between PNG, JPEG, and WEBP — right-click any image on the web, or drop in your own files for batch conversion. Material Design 3 interface, fully offline, zero network requests beyond loading the image you asked for.

**Author / Tác giả:** gnort67 · **Version:** 2.0.0 (previously released as *Save Image As... (Type)*)

---

## 🇬🇧 English

### Why the rename?
Version 2.0.0 adds batch conversion, a redo action, clipboard paste, and a full Material 3 interface refresh — enough of a step up to mark with a new name, **PixFlip**. If you're upgrading from the previous version, your saved settings and history migrate automatically the first time you open it; nothing is lost.

### Features

- **Right-click any image** on any webpage and save it instantly as PNG, JPEG, WEBP, or its original format — no popup needed.
- **Batch conversion** *(new)* — drop in (or paste) multiple images at once. They're all converted with the same format/quality settings and bundled into a single **.zip** download, so Chrome never throws up its "this site is trying to download multiple files" prompt.
- **Paste from clipboard** *(new)* — press Ctrl+V anywhere in the popup to load a copied image or screenshot directly, no need to save it to disk first.
- **Convert again** *(new)* — history items saved via right-click keep a link back to their source, so you can re-run the exact same conversion later with one click (e.g. you saved as JPEG but now want the same image as WEBP too).
- **Resize while converting** — set an exact width/height with an optional aspect-ratio lock (single-image mode only — resizing a whole batch to one fixed size would distort most of the images in it).
- **Adjustable quality** for JPEG/WEBP, with a live preview of the percentage.
- **Custom filenames** for single conversions; batch conversions keep each file's own original name (de-duplicated automatically if two different source files happen to share a name).
- **Recent history** with thumbnails, exportable as a plain-text log.
- **Configurable right-click menu** — turn individual format options (Original / PNG / JPEG / WEBP) on or off.
- **Export/import all settings** as JSON, and a safe two-step **Reset to default**.
- Light / Dark / System theme, adjustable font size, full English/Vietnamese localization — all switchable instantly from the header.

### What changed in v2.0.0 (bug fixes)

- **Reset and Clear History had no confirmation whatsoever** — a single accidental click instantly wiped your settings or history with no warning. They now require a deliberate two-step "click again to confirm" action, done entirely in-page (native `confirm()` dialogs are unreliable inside extension popups, which are lightweight overlay windows that can close the instant a modal would try to render).
- **The theme toggle could appear to do nothing** on its very first click (cycling from "System" landed back on whichever theme System already resolved to). Fixed to always produce a visible change.
- **A CSS layout bug** in Settings caused the "Default quality" slider to be squeezed into the wrong orientation, overlapping its own label in the Vietnamese interface. Fixed.
- **The aspect-ratio-lock toggle had no visible label** next to the resize width/height fields — just an unexplained switch. It now reads "Lock aspect ratio."
- **A badge-notification race condition**: two saves completing in quick succession could have the first one's "clear the badge" timer fire after the second one's badge was set, erasing feedback for the second save prematurely. Fixed.
- Minor: file input and drop zone now genuinely accept multiple images (previously only the first dropped/selected file was used, with the rest silently discarded).

### How batch conversion works
Every image you load is decoded and re-encoded locally with the Canvas API — nothing is uploaded anywhere. For a single image, you get the same direct-download experience as before. For two or more, PixFlip bundles the results into one `.zip` file using a small, dependency-free ZIP writer built for this extension (uncompressed "stored" entries — the images inside are already compressed formats, so there's nothing to gain from re-compressing them, and it keeps the implementation simple and fast).

### Installation (unpacked / developer mode)
1. Unzip this package.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the `pixflip` folder.
4. Pin the PixFlip icon to your toolbar.

### Permissions
| Permission | Why it's needed |
|---|---|
| `contextMenus` | Adds the "Save image as..." options to the right-click menu. |
| `downloads` | Saves converted images and history exports to disk. |
| `storage` | Persists your settings and history locally. |
| `offscreen` | Runs the actual canvas-based image conversion for right-click saves (service workers have no DOM/Canvas access in Manifest V3, so an offscreen document handles this). |
| `notifications` | Optional confirmation toast after a right-click save. |
| `host_permissions: <all_urls>` | Lets the right-click menu work on images on any website. |

### Project structure
```
pixflip/
├── manifest.json           Manifest V3 configuration
├── popup.html                Popup UI (converter + settings)
├── offscreen.html            Offscreen document used for canvas conversion
├── css/
│   ├── tokens.css             Material Design 3 tokens (warm orange seed)
│   ├── popup.css              Component styles and layout
│   └── fonts.css              Be Vietnam Pro @font-face declarations
├── fonts/                   Be Vietnam Pro (woff2, self-hosted)
├── js/
│   ├── background.js          Service worker: context menu, offscreen orchestration, badge, redo
│   ├── offscreen.js            Canvas-based conversion logic (runs in the offscreen document)
│   ├── zip.js                  Minimal dependency-free ZIP file writer, used for batch downloads
│   ├── storage.js              Settings + history persistence, with legacy-key migration
│   ├── theme.js                 Light/Dark/System theme + font-size
│   ├── i18n.js                  English/Vietnamese dictionary
│   └── main.js                  Popup UI logic: image queue, conversion, history, settings
├── icons/                   16/32/48/128 px extension icons
└── _locales/en, _locales/vi  Chrome Web Store name/description localization
```

### Tech stack
Plain HTML, CSS, and JavaScript, Manifest V3 — no build step, no bundler, no runtime dependencies (including the ZIP writer, written from scratch specifically to avoid pulling in a library for something this small).

### Privacy
PixFlip makes no network requests other than fetching an image you explicitly asked to load (by URL, or when redoing a right-click save). Conversion happens entirely on your device. Settings and history are stored locally and never transmitted anywhere.

---

## 🇻🇳 Tiếng Việt

### Vì sao đổi tên?
Phiên bản 2.0.0 bổ sung chuyển đổi hàng loạt, thao tác làm lại, dán ảnh từ clipboard, và làm mới hoàn toàn giao diện theo Material 3 — đủ lớn để đổi sang tên mới **PixFlip**. Nếu bạn đang nâng cấp từ phiên bản trước, cài đặt và lịch sử đã lưu sẽ tự động chuyển sang ngay lần đầu mở, không mất dữ liệu.

### Tính năng

- **Chuột phải vào bất kỳ ảnh nào** trên trang web và lưu ngay dưới dạng PNG, JPEG, WEBP, hoặc định dạng gốc — không cần mở popup.
- **Chuyển đổi hàng loạt** *(mới)* — thả (hoặc dán) nhiều ảnh cùng lúc. Tất cả được chuyển đổi với cùng cài đặt định dạng/chất lượng và đóng gói thành một tệp **.zip** duy nhất.
- **Dán từ clipboard** *(mới)* — nhấn Ctrl+V ở bất kỳ đâu trong popup để tải ảnh đã sao chép hoặc ảnh chụp màn hình trực tiếp.
- **Chuyển đổi lại** *(mới)* — các mục lịch sử lưu qua chuột phải vẫn giữ liên kết đến nguồn gốc, cho phép chạy lại chính xác cùng một chuyển đổi chỉ với một cú nhấp.
- **Đổi kích thước khi chuyển đổi** — đặt chiều rộng/cao chính xác với tuỳ chọn khoá tỉ lệ khung hình (chỉ khi tải một ảnh duy nhất).
- **Chất lượng tuỳ chỉnh** cho JPEG/WEBP.
- **Tên tệp tuỳ chỉnh** cho chuyển đổi đơn; chuyển đổi hàng loạt giữ nguyên tên gốc của từng tệp (tự động tránh trùng tên).
- **Lịch sử gần đây** kèm ảnh thu nhỏ, xuất được ra file văn bản.
- **Tuỳ chỉnh menu chuột phải** — bật/tắt từng tuỳ chọn định dạng.
- **Xuất/nhập toàn bộ cài đặt** dạng JSON, và **Khôi phục mặc định** an toàn hai bước.
- Giao diện Sáng/Tối/Theo hệ thống, cỡ chữ tuỳ chỉnh, song ngữ Anh/Việt đầy đủ.

### Những gì đã sửa trong v2.0.0

- **Khôi phục mặc định và Xoá lịch sử trước đây không có xác nhận nào cả** — chỉ một cú nhấp nhầm là xoá ngay lập tức, không cảnh báo. Nay yêu cầu "nhấn lại để xác nhận" ngay trong giao diện (không dùng hộp thoại `confirm()` gốc của trình duyệt, vốn không đáng tin cậy trong popup extension).
- **Nút chuyển chủ đề có thể như không phản hồi** ở lần nhấn đầu tiên. Đã sửa để luôn có thay đổi rõ rệt.
- **Lỗi bố cục CSS** khiến thanh trượt "Chất lượng mặc định" trong Cài đặt bị ép sai hướng, chồng lên nhãn của chính nó ở giao diện tiếng Việt. Đã sửa.
- **Công tắc khoá tỉ lệ khung hình không có nhãn** — chỉ là một công tắc không giải thích. Nay đã có nhãn "Khoá tỉ lệ khung hình" rõ ràng.
- **Lỗi tranh chấp thời gian ở huy hiệu thông báo**: hai lần lưu liên tiếp nhanh có thể khiến huy hiệu của lần lưu thứ hai bị xoá sớm. Đã sửa.
- Trước đây chỉ tệp đầu tiên được kéo thả/chọn mới thực sự được dùng dù chọn nhiều tệp; nay đã hỗ trợ đúng nhiều tệp cùng lúc.

### Cài đặt
1. Giải nén gói này. 2. Mở `chrome://extensions`, bật **Developer mode**. 3. **Load unpacked** → chọn thư mục `pixflip`. 4. Ghim biểu tượng lên thanh công cụ.

### Quyền truy cập
`contextMenus` (menu chuột phải), `downloads` (lưu tệp), `storage` (lưu cài đặt), `offscreen` (chuyển đổi ảnh qua canvas), `notifications` (thông báo tuỳ chọn), `host_permissions: <all_urls>` (menu chuột phải hoạt động trên mọi trang).

### Quyền riêng tư
PixFlip không gửi bất kỳ yêu cầu mạng nào ngoài việc tải ảnh bạn yêu cầu. Toàn bộ quá trình chuyển đổi diễn ra trên máy bạn.

---

Made with care by **gnort67**.
