// TubeShot — i18n module
// Bilingual dictionary: English (en) and Vietnamese (vi)

const I18N = {
  en: {
    tagline: "YouTube Screenshot",
    noVideoTitle: "Open a YouTube video",
    noVideoSub: "Play any YouTube video, then reopen TubeShot to start capturing",
    openYoutube: "Open YouTube",

    back10: "-10s",
    back1: "-1s",
    fwd1: "+1s",
    fwd10: "+10s",
    seekPlaceholder: "mm:ss",
    go: "Go",

    format: "Format",
    scale: "Scale",
    watermarkTimestamp: "Show timestamp on image",
    captionInfo: "Add title & channel caption",
    captureFrame: "Capture Frame",
    captureCopy: "Capture and copy to clipboard",

    history: "Recent captures",
    exportTxt: "Export .txt",
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
    showHistory: "Show recent captures",
    historyLimit: "History items to keep",
    captureQuality: "Capture quality",
    jpegQuality: "JPEG quality",
    qualityHint: "Only applies when JPEG is selected as the capture format — PNG is always lossless.",
    dataManagement: "Data",
    exportSettings: "Export settings",
    importSettings: "Import settings",
    resetDefault: "Reset to default",
    about: "About",
    authorLine: "Developed by",

    historyEmpty: "No captures yet",
    toastCaptured: "Frame captured and downloaded",
    toastCopied: "Frame copied to clipboard",
    toastCopyFailed: "Could not copy to clipboard",
    toastNoVideo: "No YouTube video found on this tab",
    toastCaptureFailed: "Could not capture this frame",
    toastCleared: "History cleared",
    toastExported: "Settings exported",
    toastImported: "Settings imported successfully",
    toastImportFailed: "Invalid settings file",
    toastReset: "Settings reset to default",
    toastHistoryExported: "History exported as .txt",
    toastHistoryEmpty: "No history to export",
    toastInvalidTime: "Enter a time like 1:23 or 12:34:56"
  },
  vi: {
    tagline: "Chụp Ảnh YouTube",
    noVideoTitle: "Mở một video YouTube",
    noVideoSub: "Phát bất kỳ video YouTube nào, sau đó mở lại TubeShot để bắt đầu chụp",
    openYoutube: "Mở YouTube",

    back10: "-10s",
    back1: "-1s",
    fwd1: "+1s",
    fwd10: "+10s",
    seekPlaceholder: "mm:ss",
    go: "Đi tới",

    format: "Định dạng",
    scale: "Tỉ lệ",
    watermarkTimestamp: "Hiện mốc thời gian trên ảnh",
    captionInfo: "Thêm chú thích tiêu đề & kênh",
    captureFrame: "Chụp Khung Hình",
    captureCopy: "Chụp và sao chép vào clipboard",

    history: "Ảnh đã chụp gần đây",
    exportTxt: "Xuất .txt",
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
    showHistory: "Hiện ảnh đã chụp gần đây",
    historyLimit: "Số mục lịch sử lưu trữ",
    captureQuality: "Chất lượng chụp",
    jpegQuality: "Chất lượng JPEG",
    qualityHint: "Chỉ áp dụng khi chọn định dạng JPEG — PNG luôn không nén mất dữ liệu.",
    dataManagement: "Dữ liệu",
    exportSettings: "Xuất cài đặt",
    importSettings: "Nhập cài đặt",
    resetDefault: "Khôi phục mặc định",
    about: "Giới thiệu",
    authorLine: "Phát triển bởi",

    historyEmpty: "Chưa có ảnh chụp nào",
    toastCaptured: "Đã chụp và tải khung hình xuống",
    toastCopied: "Đã sao chép khung hình vào clipboard",
    toastCopyFailed: "Không thể sao chép vào clipboard",
    toastNoVideo: "Không tìm thấy video YouTube trên tab này",
    toastCaptureFailed: "Không thể chụp khung hình này",
    toastCleared: "Đã xoá lịch sử",
    toastExported: "Đã xuất cài đặt",
    toastImported: "Nhập cài đặt thành công",
    toastImportFailed: "Tệp cài đặt không hợp lệ",
    toastReset: "Đã khôi phục cài đặt mặc định",
    toastHistoryExported: "Đã xuất lịch sử ra file .txt",
    toastHistoryEmpty: "Không có lịch sử để xuất",
    toastInvalidTime: "Nhập thời gian dạng 1:23 hoặc 12:34:56"
  }
};

const i18n = {
  current: "en",

  t(key, vars) {
    let str = (I18N[this.current] && I18N[this.current][key]) || I18N.en[key] || key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), vars[k]);
      });
    }
    return str;
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
