/**
 * i18n.js — lightweight, dependency-free bilingual dictionary (English/
 * Vietnamese). We intentionally don't rely on chrome.i18n.getMessage() for
 * in-page strings because that API can't hot-swap language at runtime
 * without reloading the page; this hand-rolled version can, which is what
 * lets the popup's language toggle feel instant.
 *
 * chrome.i18n / the per-locale messages.json files are still used for the two fields
 * Chrome itself reads directly: the extension's Web Store name & description.
 */

const I18N = {
  en: {
    appName: "YouTube Column Ajuster",
    tagline: "Grid layout, your rules",

    navControl: "Controls",
    navSettings: "Settings",

    hintBanner: "Changes apply instantly on any open YouTube tab, and automatically on future visits.",
    masterSwitch: "Enable extension",
    masterSwitchOff: "All effects are paused",

    columnsSection: "Grid columns",
    customColumns: "Use custom column count",
    columnsPerRow: "columns per row",
    defaultNote: "Using YouTube's default responsive layout.",
    perPageColumns: "Set a different value per page",
    columnsHome: "Home",
    columnsSubscriptions: "Subscriptions",
    columnsChannel: "Channel",

    quickToggles: "Quick toggles",
    hideShorts: "Hide Shorts shelf",
    compactCards: "Compact cards (hide descriptions & avatars)",
    hideComments: "Hide comments on watch pages",
    hideEndCards: "Hide end-screen suggestion cards",
    focusMode: "Focus mode (hide related videos sidebar)",

    madeBy: "Made by",
    openSettings: "Open full settings",
    viewLanding: "View landing page",

    settings: "Settings",
    tabGeneral: "General",
    tabLayout: "Layout",
    tabAppearance: "Appearance",
    tabData: "Data",
    tabAbout: "About",

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
    showPreview: "Show mini grid preview",

    layoutSection: "Column layout",
    togglesSection: "Decluttering",

    dataManagement: "Backup & restore",
    dataManagementHint: "Save your configuration to a file, or load one on another computer.",
    exportSettings: "Export settings",
    importSettings: "Import settings",
    resetDefault: "Reset to default",
    resetConfirm: "Reset every setting back to its default value?",

    about: "About",
    authorLine: "Developed by",
    version: "Version",
    shortcutHint: "Keyboard shortcut",
    shortcutValue: "Alt+Shift+Y toggles custom columns on any tab",
    manageShortcuts: "Manage shortcuts",
    rateExtension: "Rate this extension",
    reportIssue: "Report an issue",

    toastExported: "Settings exported",
    toastImported: "Settings imported successfully",
    toastImportFailed: "Invalid settings file",
    toastReset: "Settings reset to default",
    toastEnabled: "Extension enabled",
    toastDisabled: "Extension disabled",

    // Landing page
    landingBadge: "Chrome Extension",
    landingHeroTitle: "Take control of your YouTube grid",
    landingHeroSubtitle: "Choose exactly how many video columns YouTube shows you, declutter the pages you browse every day, and keep it all in a fast, Material 3 interface available in English and Vietnamese.",
    landingCta: "Download now!",
    landingCtaSecondary: "See it in the popup",
    landingFeaturesTitle: "Everything the default YouTube settings won't let you do",
    featColumnsTitle: "Custom column count",
    featColumnsBody: "Pick anywhere from 3 to 8 columns, the same everywhere or a different value for Home, Subscriptions and Channel pages.",
    featDeclutterTitle: "One-click decluttering",
    featDeclutterBody: "Hide the Shorts shelf, compact video cards, silence comments, remove end-screen suggestion cards, or switch to a distraction-free focus mode.",
    featM3Title: "Material Design 3",
    featM3Body: "A calm, modern interface built on Google's latest design language — dynamic color, expressive shape, and smooth motion.",
    featBilingualTitle: "English & Vietnamese",
    featBilingualBody: "Switch languages instantly, anywhere in the extension, with a single tap.",
    featBackupTitle: "Backup & restore",
    featBackupBody: "Export your configuration to a JSON file and import it again on any computer in seconds.",
    featPrivacyTitle: "Private by design",
    featPrivacyBody: "No accounts, no analytics, no network requests. Every setting stays on your device.",
    landingHowTitle: "How it works",
    howStep1Title: "Install the extension",
    howStep1Body: "Add YouTube Column Ajuster from the Chrome Web Store in a few seconds.",
    howStep2Title: "Open the popup",
    howStep2Body: "Click the toolbar icon on any YouTube tab to reveal the controls.",
    howStep3Title: "Tune your grid",
    howStep3Body: "Toggle custom columns, pick a count, flip a few quick switches — done.",
    landingFaqTitle: "Frequently asked questions",
    faqQ1: "Does this extension collect any data?",
    faqA1: "No. YouTube Column Ajuster runs entirely on your device, stores settings locally with chrome.storage, and never sends anything over the network.",
    faqQ2: "Will it break when YouTube updates its design?",
    faqA2: "The extension targets YouTube's grid components with resilient CSS selectors and is actively maintained to track YouTube's markup changes.",
    faqQ3: "Can I use different column counts on different pages?",
    faqA3: "Yes — enable \"Set a different value per page\" in Settings → Layout to configure Home, Subscriptions and Channel independently.",
    faqQ4: "Is my configuration backed up anywhere?",
    faqA4: "You can export it to a JSON file at any time from Settings → Data, and import it again on any device.",
    landingFooterTagline: "Built with Material Design 3.",
    landingBackToPopup: "Close this tab and open the extension popup to get started."
  },
  vi: {
    appName: "YouTube Column Ajuster",
    tagline: "Bố cục lưới, theo ý bạn",

    navControl: "Điều khiển",
    navSettings: "Cài đặt",

    hintBanner: "Thay đổi áp dụng ngay lập tức trên mọi tab YouTube đang mở, và tự động ở những lần truy cập sau.",
    masterSwitch: "Bật tiện ích",
    masterSwitchOff: "Mọi hiệu ứng đang tạm dừng",

    columnsSection: "Số cột lưới",
    customColumns: "Dùng số cột tuỳ chỉnh",
    columnsPerRow: "cột mỗi hàng",
    defaultNote: "Đang dùng bố cục responsive mặc định của YouTube.",
    perPageColumns: "Đặt giá trị riêng cho từng trang",
    columnsHome: "Trang chủ",
    columnsSubscriptions: "Kênh đăng ký",
    columnsChannel: "Trang kênh",

    quickToggles: "Tuỳ chọn nhanh",
    hideShorts: "Ẩn dải Shorts",
    compactCards: "Thẻ gọn (ẩn mô tả & ảnh đại diện kênh)",
    hideComments: "Ẩn bình luận ở trang xem video",
    hideEndCards: "Ẩn thẻ gợi ý cuối video",
    focusMode: "Chế độ tập trung (ẩn danh sách video liên quan)",

    madeBy: "Thực hiện bởi",
    openSettings: "Cài đặt",
    viewLanding: "Giới thiệu",

    settings: "Cài đặt",
    tabGeneral: "Chung",
    tabLayout: "Bố cục",
    tabAppearance: "Giao diện",
    tabData: "Dữ liệu",
    tabAbout: "Giới thiệu",

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
    showPreview: "Hiện xem trước lưới thu nhỏ",

    layoutSection: "Bố cục cột",
    togglesSection: "Dọn giao diện",

    dataManagement: "Sao lưu & khôi phục",
    dataManagementHint: "Lưu cấu hình ra tệp, hoặc nạp lại trên một máy tính khác.",
    exportSettings: "Xuất cài đặt",
    importSettings: "Nhập cài đặt",
    resetDefault: "Khôi phục mặc định",
    resetConfirm: "Khôi phục tất cả cài đặt về giá trị mặc định?",

    about: "Giới thiệu",
    authorLine: "Phát triển bởi",
    version: "Phiên bản",
    shortcutHint: "Phím tắt",
    shortcutValue: "Alt+Shift+Y để bật/tắt số cột tuỳ chỉnh trên mọi tab",
    manageShortcuts: "Quản lý phím tắt",
    rateExtension: "Đánh giá tiện ích",
    reportIssue: "Báo lỗi",

    toastExported: "Đã xuất cài đặt",
    toastImported: "Nhập cài đặt thành công",
    toastImportFailed: "Tệp cài đặt không hợp lệ",
    toastReset: "Đã khôi phục cài đặt mặc định",
    toastEnabled: "Đã bật tiện ích",
    toastDisabled: "Đã tắt tiện ích",

    // Trang giới thiệu
    landingBadge: "Tiện ích Chrome",
    landingHeroTitle: "Làm chủ bố cục lưới YouTube của bạn",
    landingHeroSubtitle: "Chọn chính xác số cột video YouTube hiển thị, dọn gọn những trang bạn lướt mỗi ngày, tất cả trong một giao diện Material 3 nhanh nhẹn, hỗ trợ tiếng Anh và tiếng Việt.",
    landingCta: "Tải về ngay",
    landingCtaSecondary: "Xem giao diện popup",
    landingFeaturesTitle: "Những điều cài đặt mặc định của YouTube không cho phép bạn làm",
    featColumnsTitle: "Tuỳ chỉnh số cột",
    featColumnsBody: "Chọn từ 3 đến 8 cột, dùng chung một giá trị hoặc đặt riêng cho Trang chủ, Kênh đăng ký và trang Kênh.",
    featDeclutterTitle: "Dọn giao diện chỉ với một chạm",
    featDeclutterBody: "Ẩn dải Shorts, thu gọn thẻ video, tắt bình luận, bỏ thẻ gợi ý cuối video, hoặc chuyển sang chế độ tập trung không xao nhãng.",
    featM3Title: "Material Design 3",
    featM3Body: "Giao diện hiện đại, dễ chịu dựa trên ngôn ngữ thiết kế mới nhất của Google — màu sắc linh hoạt, hình khối biểu cảm và chuyển động mượt mà.",
    featBilingualTitle: "Tiếng Anh & Tiếng Việt",
    featBilingualBody: "Chuyển ngôn ngữ tức thì, ở bất kỳ đâu trong tiện ích, chỉ với một chạm.",
    featBackupTitle: "Sao lưu & khôi phục",
    featBackupBody: "Xuất cấu hình ra tệp JSON và nhập lại trên bất kỳ máy tính nào chỉ trong vài giây.",
    featPrivacyTitle: "Riêng tư theo thiết kế",
    featPrivacyBody: "Không tài khoản, không theo dõi, không kết nối mạng. Mọi cài đặt chỉ lưu trên máy của bạn.",
    landingHowTitle: "Cách hoạt động",
    howStep1Title: "Cài đặt tiện ích",
    howStep1Body: "Thêm YouTube Column Ajuster từ Chrome Web Store chỉ trong vài giây.",
    howStep2Title: "Mở popup",
    howStep2Body: "Nhấp vào biểu tượng trên thanh công cụ ở bất kỳ tab YouTube nào để mở bảng điều khiển.",
    howStep3Title: "Tinh chỉnh lưới của bạn",
    howStep3Body: "Bật số cột tuỳ chỉnh, chọn số lượng, gạt vài công tắc nhanh — xong.",
    landingFaqTitle: "Câu hỏi thường gặp",
    faqQ1: "Tiện ích này có thu thập dữ liệu không?",
    faqA1: "Không. YouTube Column Ajuster chạy hoàn toàn trên máy của bạn, lưu cài đặt cục bộ bằng chrome.storage và không bao giờ gửi bất cứ điều gì qua mạng.",
    faqQ2: "Tiện ích có bị lỗi khi YouTube cập nhật giao diện không?",
    faqA2: "Tiện ích nhắm vào các thành phần lưới của YouTube bằng bộ chọn CSS bền vững, và được duy trì tích cực để theo kịp thay đổi của YouTube.",
    faqQ3: "Tôi có thể đặt số cột khác nhau cho từng trang không?",
    faqA3: "Có — bật \"Đặt giá trị riêng cho từng trang\" trong Cài đặt → Bố cục để cấu hình riêng cho Trang chủ, Kênh đăng ký và trang Kênh.",
    faqQ4: "Cấu hình của tôi có được sao lưu ở đâu không?",
    faqA4: "Bạn có thể xuất ra tệp JSON bất cứ lúc nào từ Cài đặt → Dữ liệu, và nhập lại trên bất kỳ thiết bị nào.",
    landingFooterTagline: "Xây dựng với Material Design 3.",
    landingBackToPopup: "Đóng tab này và mở popup của tiện ích để bắt đầu."
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

  /** Walk the DOM once and fill every [data-i18n*] element. Cheap enough to
   *  call on every language switch since popup/options DOMs are tiny. */
  apply() {
    document.documentElement.lang = this.current;

    document.querySelectorAll("[data-i18n]").forEach((elx) => {
      elx.textContent = this.t(elx.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((elx) => {
      elx.title = this.t(elx.getAttribute("data-i18n-title"));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((elx) => {
      elx.setAttribute("aria-label", this.t(elx.getAttribute("data-i18n-aria")));
    });
    document.querySelectorAll("[data-i18n-html]").forEach((elx) => {
      elx.innerHTML = this.t(elx.getAttribute("data-i18n-html"));
    });

    const langCode = document.getElementById("langCode");
    if (langCode) langCode.textContent = this.current.toUpperCase();

    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect) languageSelect.value = this.current;
  }
};
