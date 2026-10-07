// PixFlip — i18n module
// Bilingual dictionary: English (en) and Vietnamese (vi)

const I18N = {
  en: {
    tagline: "Image Format Converter",
    dropTitle: "Drag & drop images, or click to browse",
    dropSub: "PNG, JPEG, WEBP, GIF, BMP · multiple files supported",
    pasteHint: "You can also paste an image with Ctrl+V",
    urlPlaceholder: "Or paste an image URL...",
    load: "Load",
    clear: "Clear",
    format: "Format",
    quality: "Quality",
    resize: "Resize image",
    lockRatio: "Lock aspect ratio",
    resizeUnavailableBatch: "Resize is only available with a single image loaded",
    width: "Width",
    height: "Height",
    filename: "File name",
    convertDownload: "Convert & Download",
    convertAll: (n) => `Convert All (${n})`,
    queueTitle: "Images to convert",
    queueCount: (n) => `${n} image${n !== 1 ? "s" : ""}`,
    removeImage: "Remove",
    clearQueue: "Clear all",

    history: "Recent history",
    exportTxt: "Export .txt",
    madeBy: "Made by",
    redoAction: "Convert again",

    settings: "Settings",
    appearance: "Appearance",
    theme: "Theme",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",
    fontSize: "Font size",
    fontSmall: "Small",
    fontMedium: "Medium",
    fontLarge: "Large",
    language: "Language",
    displayOptions: "Display",
    showHistory: "Show recent history",
    historyLimit: "History items to keep",
    conversionDefaults: "Conversion defaults",
    defaultFormat: "Default format",
    defaultQuality: "Default quality",
    contextMenu: "Right-click menu",
    menuOriginal: "Original format",
    menuPng: "PNG",
    menuJpeg: "JPEG",
    menuWebp: "WEBP",
    behavior: "Behavior",
    askFilename: "Ask where to save each time",
    showNotification: "Show notification after saving",
    dataManagement: "Data",
    exportSettings: "Export settings",
    importSettings: "Import settings",
    resetDefault: "Reset to default",
    confirmClickAgain: "Click again to confirm",
    about: "About",
    authorLine: "Developed by",

    sourceContextMenu: "Right-click",
    sourcePopup: "Converter",
    historyEmpty: "No conversions yet",

    toastLoaded: "Image loaded",
    toastImagesLoaded: (n) => `${n} image${n !== 1 ? "s" : ""} loaded`,
    toastLoadFailed: "Could not load this image",
    toastInvalidFile: "Please choose a valid image file",
    toastNoImage: "Load an image first",
    toastConverted: "Image converted and downloaded",
    toastConvertedZip: (n) => `${n} images converted and zipped`,
    toastConvertFailed: "Conversion failed",
    toastCleared: "History cleared",
    toastExported: "Settings exported",
    toastImported: "Settings imported successfully",
    toastImportFailed: "Invalid settings file",
    toastReset: "Settings reset to default",
    toastHistoryExported: "History exported as .txt",
    toastHistoryEmpty: "No history to export",
    toastPasted: "Image pasted from clipboard",
    toastRedoing: "Re-converting from the original source...",
    toastRedoUnavailable: "The original file isn't available to convert again — only images saved from a webpage can be redone",
    converting: "Converting..."
  },
  vi: {
    tagline: "Chuyển Đổi Định Dạng Ảnh",
    dropTitle: "Kéo thả ảnh vào đây, hoặc nhấp để chọn tệp",
    dropSub: "Hỗ trợ PNG, JPEG, WEBP, GIF, BMP · nhiều tệp cùng lúc",
    pasteHint: "Bạn cũng có thể dán ảnh bằng Ctrl+V",
    urlPlaceholder: "Hoặc dán URL hình ảnh...",
    load: "Tải",
    clear: "Xoá",
    format: "Định dạng",
    quality: "Chất lượng",
    resize: "Thay đổi kích thước",
    lockRatio: "Khoá tỉ lệ khung hình",
    resizeUnavailableBatch: "Chỉ đổi kích thước được khi tải một ảnh duy nhất",
    width: "Chiều rộng",
    height: "Chiều cao",
    filename: "Tên tệp",
    convertDownload: "Chuyển Đổi & Tải Xuống",
    convertAll: (n) => `Chuyển Đổi Tất Cả (${n})`,
    queueTitle: "Ảnh cần chuyển đổi",
    queueCount: (n) => `${n} ảnh`,
    removeImage: "Xoá khỏi danh sách",
    clearQueue: "Xoá tất cả",

    history: "Lịch sử gần đây",
    exportTxt: "Xuất .txt",
    madeBy: "Thực hiện bởi",
    redoAction: "Chuyển đổi lại",

    settings: "Cài đặt",
    appearance: "Giao diện",
    theme: "Chủ đề",
    themeSystem: "Theo hệ thống",
    themeLight: "Sáng",
    themeDark: "Tối",
    fontSize: "Cỡ chữ",
    fontSmall: "Nhỏ",
    fontMedium: "Vừa",
    fontLarge: "Lớn",
    language: "Ngôn ngữ",
    displayOptions: "Hiển thị",
    showHistory: "Hiện lịch sử gần đây",
    historyLimit: "Số mục lịch sử lưu trữ",
    conversionDefaults: "Mặc định chuyển đổi",
    defaultFormat: "Định dạng mặc định",
    defaultQuality: "Chất lượng mặc định",
    contextMenu: "Menu chuột phải",
    menuOriginal: "Định dạng gốc",
    menuPng: "PNG",
    menuJpeg: "JPEG",
    menuWebp: "WEBP",
    behavior: "Hành vi",
    askFilename: "Hỏi vị trí lưu mỗi lần",
    showNotification: "Hiện thông báo sau khi lưu",
    dataManagement: "Dữ liệu",
    exportSettings: "Xuất cài đặt",
    importSettings: "Nhập cài đặt",
    resetDefault: "Khôi phục mặc định",
    confirmClickAgain: "Nhấn lại để xác nhận",
    about: "Giới thiệu",
    authorLine: "Phát triển bởi",

    sourceContextMenu: "Chuột phải",
    sourcePopup: "Bộ chuyển đổi",
    historyEmpty: "Chưa có chuyển đổi nào",

    toastLoaded: "Đã tải ảnh",
    toastImagesLoaded: (n) => `Đã tải ${n} ảnh`,
    toastLoadFailed: "Không thể tải hình ảnh này",
    toastInvalidFile: "Vui lòng chọn một tệp hình ảnh hợp lệ",
    toastNoImage: "Vui lòng tải ảnh trước",
    toastConverted: "Đã chuyển đổi và tải ảnh xuống",
    toastConvertedZip: (n) => `Đã chuyển đổi và nén ${n} ảnh`,
    toastConvertFailed: "Chuyển đổi thất bại",
    toastCleared: "Đã xoá lịch sử",
    toastExported: "Đã xuất cài đặt",
    toastImported: "Nhập cài đặt thành công",
    toastImportFailed: "Tệp cài đặt không hợp lệ",
    toastReset: "Đã khôi phục cài đặt mặc định",
    toastHistoryExported: "Đã xuất lịch sử ra file .txt",
    toastHistoryEmpty: "Không có lịch sử để xuất",
    toastPasted: "Đã dán ảnh từ bộ nhớ tạm",
    toastRedoing: "Đang chuyển đổi lại từ nguồn gốc...",
    toastRedoUnavailable: "Không có sẵn tệp gốc để chuyển đổi lại — chỉ ảnh lưu từ trang web mới dùng lại được",
    converting: "Đang chuyển đổi..."
  }
};

const i18n = {
  current: "en",

  /** Look up a key; if its value is a function (for strings needing a
   *  number interpolated, e.g. "Convert All (3)"), call it with the args. */
  t(key, ...args) {
    const entry = (I18N[this.current] && I18N[this.current][key]) ?? I18N.en[key] ?? key;
    return typeof entry === "function" ? entry(...args) : entry;
  },

  setLang(lang) {
    this.current = I18N[lang] ? lang : "en";
    this.apply();
  },

  apply() {
    document.documentElement.lang = this.current;

    document.querySelectorAll("[data-i18n]").forEach((elx) => {
      if (elx.classList.contains("is-armed")) return; // mid-countdown "click again to confirm" — don't clobber it
      const key = elx.getAttribute("data-i18n");
      elx.textContent = this.t(key);
    });

    document.querySelectorAll("[data-i18n-title]").forEach((elx) => {
      const key = elx.getAttribute("data-i18n-title");
      elx.title = this.t(key);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((elx) => {
      const key = elx.getAttribute("data-i18n-placeholder");
      elx.placeholder = this.t(key);
    });

    const langCode = document.getElementById("langCode");
    if (langCode) langCode.textContent = this.current.toUpperCase();

    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect) languageSelect.value = this.current;
  }
};
