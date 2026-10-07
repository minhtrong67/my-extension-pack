// SmartShot — i18n module
// Bilingual dictionary: English (en) and Vietnamese (vi)
// Shared by popup.html and editor.html

const I18N = {
  en: {
    tagline: "Screenshot & Annotate",

    captureVisible: "Capture Visible Area",
    captureVisibleSub: "Just what's on screen right now",
    captureFullPage: "Capture Full Page",
    captureFullPageSub: "Scrolls and stitches the entire page",
    captureArea: "Capture Selected Area",
    captureAreaSub: "Drag to pick exactly what you need",

    history: "Recent history",
    clear: "Clear",
    madeBy: "Made by",

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
    captureDefaults: "Capture defaults",
    format: "Format",
    quality: "JPEG quality",
    fullPageDelay: "Scroll delay (full page)",
    openEditorAfterCapture: "Open editor after capture",
    quickSaveAction: "If not editing",
    afterDownload: "Save to Downloads",
    afterClipboard: "Copy to clipboard",
    dataManagement: "Data",
    exportSettings: "Export settings",
    importSettings: "Import settings",
    resetDefault: "Reset to default",
    about: "About",
    authorLine: "Developed by",

    typeVisible: "Visible area",
    typeFullPage: "Full page",
    typeArea: "Selected area",
    historyEmpty: "No screenshots yet",

    toastCleared: "History cleared",
    toastExported: "Settings exported",
    toastImported: "Settings imported successfully",
    toastImportFailed: "Invalid settings file",
    toastReset: "Settings reset to default",

    editorTitle: "SmartShot Editor",
    discard: "Discard & close",
    toolMove: "Move",
    toolPen: "Pen",
    toolArrow: "Arrow",
    toolRect: "Rectangle",
    toolEllipse: "Ellipse",
    toolText: "Text",
    toolHighlight: "Highlight",
    toolBlur: "Blur / Pixelate",
    toolCrop: "Crop",
    strokeSize: "Size",
    undo: "Undo",
    redo: "Redo",
    clearAll: "Clear all annotations",
    copyClipboard: "Copy to Clipboard",
    downloadImage: "Download",

    toastCopied: "Copied to clipboard",
    toastCopyFailed: "Could not copy to clipboard",
    toastDownloaded: "Image downloaded",
    toastCropApplied: "Crop applied",
    toastNothingToUndo: "Nothing to undo",
    toastNothingToRedo: "Nothing to redo",
    toastLoadFailed: "Could not load the captured image",
    toastTextEmpty: "Click again to add text"
  },
  vi: {
    tagline: "Chụp & Chú Thích Màn Hình",

    captureVisible: "Chụp Vùng Hiển Thị",
    captureVisibleSub: "Chỉ phần đang hiện trên màn hình",
    captureFullPage: "Chụp Toàn Trang",
    captureFullPageSub: "Tự động cuộn và ghép toàn bộ trang",
    captureArea: "Chụp Vùng Chọn",
    captureAreaSub: "Kéo để chọn đúng phần bạn cần",

    history: "Lịch sử gần đây",
    clear: "Xoá",
    madeBy: "Thực hiện bởi",

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
    captureDefaults: "Mặc định chụp ảnh",
    format: "Định dạng",
    quality: "Chất lượng JPEG",
    fullPageDelay: "Độ trễ cuộn (toàn trang)",
    openEditorAfterCapture: "Mở trình chỉnh sửa sau khi chụp",
    quickSaveAction: "Nếu không chỉnh sửa",
    afterDownload: "Lưu vào thư mục Downloads",
    afterClipboard: "Sao chép vào clipboard",
    dataManagement: "Dữ liệu",
    exportSettings: "Xuất cài đặt",
    importSettings: "Nhập cài đặt",
    resetDefault: "Khôi phục mặc định",
    about: "Giới thiệu",
    authorLine: "Phát triển bởi",

    typeVisible: "Vùng hiển thị",
    typeFullPage: "Toàn trang",
    typeArea: "Vùng chọn",
    historyEmpty: "Chưa có ảnh chụp nào",

    toastCleared: "Đã xoá lịch sử",
    toastExported: "Đã xuất cài đặt",
    toastImported: "Nhập cài đặt thành công",
    toastImportFailed: "Tệp cài đặt không hợp lệ",
    toastReset: "Đã khôi phục cài đặt mặc định",

    editorTitle: "Trình Chỉnh Sửa SmartShot",
    discard: "Huỷ & đóng",
    toolMove: "Di chuyển",
    toolPen: "Bút vẽ",
    toolArrow: "Mũi tên",
    toolRect: "Hình chữ nhật",
    toolEllipse: "Hình elip",
    toolText: "Chữ",
    toolHighlight: "Đánh dấu",
    toolBlur: "Làm mờ / Che điểm ảnh",
    toolCrop: "Cắt ảnh",
    strokeSize: "Kích thước",
    undo: "Hoàn tác",
    redo: "Làm lại",
    clearAll: "Xoá tất cả chú thích",
    copyClipboard: "Sao Chép Vào Clipboard",
    downloadImage: "Tải Xuống",

    toastCopied: "Đã sao chép vào bộ nhớ tạm",
    toastCopyFailed: "Không thể sao chép vào clipboard",
    toastDownloaded: "Đã tải ảnh xuống",
    toastCropApplied: "Đã áp dụng cắt ảnh",
    toastNothingToUndo: "Không có gì để hoàn tác",
    toastNothingToRedo: "Không có gì để làm lại",
    toastLoadFailed: "Không thể tải ảnh đã chụp",
    toastTextEmpty: "Nhấp lại để thêm chữ"
  }
};

const i18n = {
  current: "en",

  t(key) {
    return (I18N[this.current] && I18N[this.current][key]) || I18N.en[key] || key;
  },

  setLang(lang) {
    this.current = I18N[lang] ? lang : "en";
    this.apply();
  },

  apply() {
    document.documentElement.lang = this.current;

    document.querySelectorAll("[data-i18n]").forEach((elx) => {
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
