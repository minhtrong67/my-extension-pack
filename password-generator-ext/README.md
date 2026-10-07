# 🔐 LockSmith — Password, Passphrase & PIN Generator

A fast, private, Material Design 3 password generator for Chrome. Generate strong passwords, memorable passphrases, and numeric PINs — with a live strength meter and a plain-language "time to crack" estimate — entirely offline, with zero network requests.

**Author / Tác giả:** gnort67 · **Version:** 2.0.0 (previously released as *PassForge*)

---

## 🇬🇧 English

### Why the rename from PassForge?
Version 2.0.0 is a substantial rework — a new generation mode, several real bug fixes, and a full Material 3 interface refresh — so it ships under a new name, **LockSmith**, to mark that. If you're upgrading from PassForge, your saved settings and history migrate automatically the first time you open the new version; nothing is lost.

### Features

- **Three generation modes**
  - **Password** — fully customizable character-based passwords.
  - **Passphrase** — memorable word-based phrases (e.g. `Kite-Rough-Field-62`).
  - **PIN** *(new)* — numeric-only codes for ATMs, door locks, SIM cards, etc.
- **Live strength meter** with 5 distinct levels (Weak → Very strong), computed from the *actual* character pool used for each generation — not a rough guess.
- **Time-to-crack estimate** *(new)* — a plain-language estimate ("29,000+ billion years", "6 days", "instantly") shown next to every result, so the strength bar isn't just an abstract color.
- **Password options**: length (4-64), uppercase/lowercase/numbers/symbols toggles, exclude ambiguous characters (`l 1 I O 0`), avoid repeated characters, custom character exclusion list.
- **Passphrase options**: word count, separator character, capitalization, optional trailing number. Powered by the standard **2048-word BIP-39 wordlist** — the same list used by hardware crypto wallets — for precisely 11 bits of entropy per word.
- **PIN options**: digit count (4-12).
- **One-click copy** with instant visual confirmation (the copy button briefly turns into a checkmark).
- **Recent history** — click any past value to copy it again. Fully optional: turning "Save recent history" off stops anything from being written to storage at all, not just from being displayed.
- **Export history as .txt**, or **export/import all settings as JSON** for backing up your configuration.
- **Reset to default** — a safe, two-step "click again to confirm" action (see note below on why this isn't a browser confirm dialog).
- Light / Dark / System theme, adjustable font size, and full English/Vietnamese localization — all switchable instantly from the header.

### What changed in v2.0.0 (bug fixes)

This release fixed several real issues found in the previous version:

- **PIN mode's digit-count control was silently ignored** — the generator was reading the wrong options field internally, so the PIN always matched the *password* length setting instead of its own slider. Fixed, and covered by a regression test.
- **"Save recent history" didn't actually stop saving** — turning it off only hid the history panel; every generated value was still being written to storage underneath. It now fully honors your choice.
- **A password with "avoid repeated characters" enabled could silently come out shorter than requested** if the character pool ran out of unique options before reaching your target length — a real security surprise with zero indication. Now it's flagged with a clear warning.
- **The theme toggle could appear to do nothing** on its very first click (cycling from "System" landed back on whichever theme System already resolved to). Fixed to always produce a visible change.
- **The passphrase wordlist was only 160 words** (~7.3 bits of entropy per word). Replaced with the industry-standard 2048-word BIP-39 list (11 bits/word) — the same passphrase length is now meaningfully more resistant to guessing.
- **The "Strong" strength label was defined but never actually reachable** — the 5-level scale silently collapsed two levels into "Weak". All 5 levels are now distinct and correctly triggered.
- Reset and Clear History no longer rely on the browser's native `confirm()` dialog, which is unreliable inside extension popups (popups can close or the dialog can fail to render the moment focus shifts). They now use an in-page "click again to confirm" pattern that works reliably everywhere.
- Minor: the secure-random rejection-sampling threshold now uses the mathematically exact 2^32 boundary instead of 2^32-1, for a marginally tighter, more correct uniform distribution.

### Security notes

- All randomness comes from `crypto.getRandomValues()` — the Web Crypto API's cryptographically secure random number generator — **never** `Math.random()`, which is not safe for anything security-sensitive.
- Character selection uses rejection sampling to eliminate modulo bias, so every character in the pool is exactly equally likely.
- **History is stored locally in plain text.** This is clearly disclosed in the app itself: anyone with access to your computer/profile could read previously generated values from extension storage. If you generate anything highly sensitive, turn "Save recent history" off beforehand, or clear history afterward.
- LockSmith makes zero network requests. Nothing you generate ever leaves your device.

### Installation (unpacked / developer mode)
1. Unzip this package.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the `locksmith` folder.
4. Pin the LockSmith icon to your toolbar.

### Permissions
Only `storage` — used solely to save your settings and (optionally) your recent history locally. LockSmith requests no host permissions and cannot read or interact with any webpage.

### Project structure
```
locksmith/
├── manifest.json          Manifest V3 configuration
├── popup.html               Popup UI
├── css/
│   ├── tokens.css            Material Design 3 tokens (seeded from the official M3 reference purple #6750A4)
│   ├── popup.css             Component styles and layout
│   └── fonts.css             Be Vietnam Pro @font-face declarations
├── fonts/                   Be Vietnam Pro (woff2, self-hosted)
├── js/
│   ├── generator.js           Core crypto logic: password/passphrase/PIN generation, strength scoring, crack-time estimation
│   ├── wordlist.js            The 2048-word BIP-39 English wordlist
│   ├── storage.js             Settings + history persistence, with legacy-key migration from PassForge
│   ├── theme.js                Light/Dark/System theme + font-size
│   ├── i18n.js                 English/Vietnamese dictionary
│   └── main.js                 UI wiring and event handling
├── icons/                   16/32/48/128 px extension icons
└── _locales/en, _locales/vi  Chrome Web Store name/description localization
```

### Tech stack
Plain HTML, CSS, and JavaScript, Manifest V3 — no build step, no runtime dependencies, no network calls.

---

## 🇻🇳 Tiếng Việt

### Vì sao đổi tên từ PassForge?
Phiên bản 2.0.0 là một bản nâng cấp đáng kể — thêm chế độ tạo mới, sửa nhiều lỗi thực sự, và làm mới hoàn toàn giao diện theo Material 3 — nên được phát hành dưới tên mới **LockSmith**. Nếu bạn đang nâng cấp từ PassForge, cài đặt và lịch sử đã lưu sẽ tự động được chuyển sang ngay lần đầu mở phiên bản mới, không bị mất dữ liệu.

### Tính năng

- **Ba chế độ tạo**: **Mật khẩu** (tuỳ chỉnh đầy đủ ký tự), **Cụm mật khẩu** (dễ nhớ, dạng từ), **Mã PIN** *(mới)* — mã số cho ATM, khoá cửa, SIM...
- **Thanh đo độ mạnh trực tiếp** với 5 mức rõ rệt (Yếu → Rất mạnh), tính từ bộ ký tự **thực tế** đã dùng để tạo, không phải ước lượng thô.
- **Ước tính thời gian bẻ khoá** *(mới)* — hiển thị ngay cạnh mỗi kết quả bằng ngôn ngữ dễ hiểu.
- **Tuỳ chọn mật khẩu**: độ dài (4-64), chữ hoa/thường/số/ký tự đặc biệt, loại ký tự dễ nhầm, tránh lặp ký tự, danh sách ký tự tuỳ chỉnh cần loại bỏ.
- **Tuỳ chọn cụm mật khẩu**: số từ, ký tự phân cách, viết hoa, thêm số ngẫu nhiên. Dùng danh sách chuẩn **BIP-39 gồm 2048 từ** — cùng danh sách được dùng trong ví tiền mã hoá phần cứng — cho đúng 11 bit entropy mỗi từ.
- **Tuỳ chọn mã PIN**: số chữ số (4-12).
- **Sao chép một chạm** với xác nhận hình ảnh tức thì.
- **Lịch sử gần đây** — nhấn vào bất kỳ giá trị nào để sao chép lại. Có thể tắt hoàn toàn: khi tắt, không có gì được ghi vào bộ nhớ nữa (không chỉ ẩn khỏi giao diện).
- **Xuất lịch sử ra .txt**, hoặc **xuất/nhập toàn bộ cài đặt dạng JSON**.
- **Khôi phục mặc định** — hành động an toàn hai bước "nhấn lại để xác nhận".
- Giao diện Sáng/Tối/Theo hệ thống, cỡ chữ tuỳ chỉnh, song ngữ Anh/Việt đầy đủ.

### Những gì đã sửa trong v2.0.0

- **Chế độ PIN bỏ qua tuỳ chỉnh số chữ số** — trình tạo đọc nhầm trường dữ liệu nội bộ nên mã PIN luôn theo độ dài của chế độ Mật khẩu thay vì thanh trượt riêng của nó. Đã sửa và có kiểm thử hồi quy.
- **"Lưu lịch sử gần đây" tắt nhưng không thực sự dừng lưu** — trước đây chỉ ẩn bảng lịch sử, mọi giá trị vẫn âm thầm được ghi vào bộ nhớ. Nay tắt là dừng lưu hoàn toàn.
- **Mật khẩu với "tránh lặp ký tự" có thể ngắn hơn yêu cầu mà không cảnh báo** nếu bộ ký tự cạn kiệt trước khi đạt độ dài mong muốn. Nay có cảnh báo rõ ràng.
- **Nút chuyển chủ đề có thể như không phản hồi** ở lần nhấn đầu tiên. Đã sửa để luôn có thay đổi rõ rệt.
- **Danh sách từ cho cụm mật khẩu trước đây chỉ có 160 từ** (~7,3 bit/từ). Đã thay bằng danh sách chuẩn BIP-39 gồm 2048 từ (11 bit/từ).
- **Nhãn "Mạnh" được định nghĩa nhưng không bao giờ hiển thị được** — thang 5 mức trước đây gộp nhầm hai mức thành "Yếu". Nay cả 5 mức đều hoạt động đúng.
- Khôi phục mặc định và Xoá lịch sử không còn dùng hộp thoại `confirm()` gốc của trình duyệt (vốn không đáng tin cậy trong popup extension) — nay dùng mẫu "nhấn lại để xác nhận" ngay trong giao diện.

### Lưu ý bảo mật
Mọi số ngẫu nhiên đều lấy từ `crypto.getRandomValues()` — **không bao giờ** dùng `Math.random()`. **Lịch sử được lưu dưới dạng văn bản thường trên máy** — bất kỳ ai dùng chung máy đều có thể đọc được; nên tắt tính năng này nếu bạn tạo thứ gì đó thực sự nhạy cảm. LockSmith không gửi bất kỳ dữ liệu nào qua mạng.

### Cài đặt
1. Giải nén gói này. 2. Mở `chrome://extensions`, bật **Developer mode**. 3. **Load unpacked** → chọn thư mục `locksmith`. 4. Ghim biểu tượng lên thanh công cụ.

### Quyền truy cập
Chỉ `storage` — dùng để lưu cài đặt và lịch sử (tuỳ chọn) trên máy bạn. Không có quyền truy cập trang web nào khác.

---

Made with care by **gnort67**.
