/**
 * i18n.js — English/Vietnamese dictionary for TagMark, plus a small DOM
 * translation helper. Hand-rolled (not chrome.i18n) so the language can be
 * switched instantly at runtime without reloading the popup.
 */

const I18N = {
  en: {
    tagline: "Smart Bookmark Manager",
    madeBy: "Made by",
    addCurrentPage: "Bookmark This Page",
    editCurrentPage: "Edit This Page's Bookmark",
    searchPlaceholder: "Search bookmarks, tags...",
    allFolders: "All folders",
    duplicates: "Duplicates",
    resultsCount: (n) => `${n} bookmark${n !== 1 ? "s" : ""}`,

    emptyTitle: "No bookmarks found",
    emptyHintSearch: "Try a different search term or clear your filters",
    emptyHintEmpty: "Click \"Bookmark This Page\" or save one from Chrome to get started",

    addBookmark: "Add Bookmark",
    editBookmark: "Edit Bookmark",
    titleLabel: "Title",
    urlLabel: "URL",
    folderLabel: "Folder",
    tagsLabel: "Tags",
    noteLabel: "Note",
    newFolder: "+ New folder",
    newFolderPlaceholder: "Folder name",
    create: "Create",
    tagInputPlaceholder: "Add a tag and press Enter",
    deleteBookmark: "Delete bookmark",
    cancel: "Cancel",
    save: "Save",
    deleteConfirm: "Delete this bookmark? This also removes it from Chrome's bookmarks.",

    selectAll: "Select all",
    deselectAll: "Deselect all",
    bulkCount: (n) => `${n} selected`,
    bulkAddTag: "Add tag to selected",
    bulkDelete: "Delete selected",
    bulkTagPrompt: "Tag to add to all selected bookmarks:",
    bulkDeleteConfirm: (n) => `Delete ${n} selected bookmark${n !== 1 ? "s" : ""}? This also removes ${n !== 1 ? "them" : "it"} from Chrome's bookmarks.`,

    openBookmark: "Open",
    editAction: "Edit",
    copyUrl: "Copy URL",
    deleteAction: "Delete",

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
    defaultView: "Default view",
    defaultSort: "Default sort",
    sortDate: "Newest first",
    sortTitleAsc: "Title A-Z",
    sortTitleDesc: "Title Z-A",
    viewList: "List view",
    viewGrid: "Grid view",
    showFavicons: "Show favicons",
    showTags: "Show tags on list",
    showFolderPath: "Show folder path",
    quickAdd: "Quick add",
    defaultFolder: "Default folder",
    dataManagement: "Data",
    exportJson: "Export (JSON)",
    exportHtml: "Export (HTML)",
    importJson: "Import (JSON)",
    dataHint: "Export/Import only affects tags, notes, and settings — your actual bookmarks are always safely stored by Chrome itself.",
    resetDefault: "Reset extension data",
    resetConfirm: "Reset all tags, notes, and settings? Your actual Chrome bookmarks are never affected.",
    about: "About",
    authorLine: "Developed by",
    shortcutHint: "Keyboard shortcut",
    shortcutValue: "Alt+Shift+M bookmarks the current tab instantly",
    manageShortcuts: "Manage shortcuts",

    toastSaved: "Bookmark saved",
    toastUpdated: "Bookmark updated",
    toastDeleted: "Bookmark deleted",
    toastUrlCopied: "URL copied",
    toastError: "Something went wrong",
    toastTagAdded: (n) => `Tag added to ${n} bookmark${n !== 1 ? "s" : ""}`,
    toastBulkDeleted: (n) => `${n} bookmark${n !== 1 ? "s" : ""} deleted`,
    toastExported: "Exported successfully",
    toastImported: (created, merged) => `Imported: ${created} new, ${merged} merged`,
    toastImportFailed: "Invalid import file",
    toastReset: "Extension data reset",
    toastFolderCreated: "Folder created",
    toastInvalidUrl: "Please enter a valid URL",
    toastQuickSaved: "Page bookmarked",
  },
  vi: {
    tagline: "Quản lý bookmark thông minh",
    madeBy: "Thực hiện bởi",
    addCurrentPage: "Lưu Trang Này Vào Bookmark",
    editCurrentPage: "Sửa Bookmark Của Trang Này",
    searchPlaceholder: "Tìm bookmark, thẻ tag...",
    allFolders: "Tất cả thư mục",
    duplicates: "Trùng lặp",
    resultsCount: (n) => `${n} bookmark`,

    emptyTitle: "Không tìm thấy bookmark",
    emptyHintSearch: "Thử từ khoá khác hoặc xoá bộ lọc",
    emptyHintEmpty: "Nhấn \"Lưu Trang Này Vào Bookmark\" hoặc lưu từ Chrome để bắt đầu",

    addBookmark: "Thêm Bookmark",
    editBookmark: "Sửa Bookmark",
    titleLabel: "Tiêu đề",
    urlLabel: "URL",
    folderLabel: "Thư mục",
    tagsLabel: "Thẻ tag",
    noteLabel: "Ghi chú",
    newFolder: "+ Thư mục mới",
    newFolderPlaceholder: "Tên thư mục",
    create: "Tạo",
    tagInputPlaceholder: "Thêm thẻ tag rồi nhấn Enter",
    deleteBookmark: "Xoá bookmark",
    cancel: "Huỷ",
    save: "Lưu",
    deleteConfirm: "Xoá bookmark này? Thao tác này cũng xoá khỏi bookmark Chrome.",

    selectAll: "Chọn tất cả",
    deselectAll: "Bỏ chọn tất cả",
    bulkCount: (n) => `Đã chọn ${n}`,
    bulkAddTag: "Thêm thẻ cho mục đã chọn",
    bulkDelete: "Xoá mục đã chọn",
    bulkTagPrompt: "Thẻ tag thêm vào tất cả bookmark đã chọn:",
    bulkDeleteConfirm: (n) => `Xoá ${n} bookmark đã chọn? Thao tác này cũng xoá khỏi bookmark Chrome.`,

    openBookmark: "Mở",
    editAction: "Sửa",
    copyUrl: "Sao chép URL",
    deleteAction: "Xoá",

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
    defaultView: "Chế độ xem mặc định",
    defaultSort: "Sắp xếp mặc định",
    sortDate: "Mới nhất trước",
    sortTitleAsc: "Tiêu đề A-Z",
    sortTitleDesc: "Tiêu đề Z-A",
    viewList: "Dạng danh sách",
    viewGrid: "Dạng lưới",
    showFavicons: "Hiện biểu tượng trang",
    showTags: "Hiện thẻ tag trong danh sách",
    showFolderPath: "Hiện đường dẫn thư mục",
    quickAdd: "Lưu nhanh",
    defaultFolder: "Thư mục mặc định",
    dataManagement: "Dữ liệu",
    exportJson: "Xuất (JSON)",
    exportHtml: "Xuất (HTML)",
    importJson: "Nhập (JSON)",
    dataHint: "Xuất/Nhập chỉ ảnh hưởng đến thẻ tag, ghi chú và cài đặt — bookmark thực tế của bạn luôn được Chrome lưu trữ an toàn.",
    resetDefault: "Khôi phục dữ liệu extension",
    resetConfirm: "Khôi phục tất cả thẻ tag, ghi chú và cài đặt? Bookmark Chrome thực tế không bị ảnh hưởng.",
    about: "Giới thiệu",
    authorLine: "Phát triển bởi",
    shortcutHint: "Phím tắt",
    shortcutValue: "Alt+Shift+M lưu ngay tab hiện tại vào bookmark",
    manageShortcuts: "Quản lý phím tắt",

    toastSaved: "Đã lưu bookmark",
    toastUpdated: "Đã cập nhật bookmark",
    toastDeleted: "Đã xoá bookmark",
    toastUrlCopied: "Đã sao chép URL",
    toastError: "Đã xảy ra lỗi",
    toastTagAdded: (n) => `Đã thêm thẻ vào ${n} bookmark`,
    toastBulkDeleted: (n) => `Đã xoá ${n} bookmark`,
    toastExported: "Xuất thành công",
    toastImported: (created, merged) => `Đã nhập: ${created} mới, ${merged} đã hợp nhất`,
    toastImportFailed: "Tệp nhập không hợp lệ",
    toastReset: "Đã khôi phục dữ liệu extension",
    toastFolderCreated: "Đã tạo thư mục",
    toastInvalidUrl: "Vui lòng nhập URL hợp lệ",
    toastQuickSaved: "Đã lưu trang vào bookmark",
  }
};

const i18n = {
  current: "en",

  t(key) {
    return (I18N[this.current] && I18N[this.current][key]) ?? I18N.en[key] ?? key;
  },

  setLang(lang) {
    this.current = I18N[lang] ? lang : "en";
    this.apply();
  },

  apply() {
    document.documentElement.lang = this.current;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = this.t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.placeholder = this.t(el.getAttribute("data-i18n-placeholder"));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const val = this.t(el.getAttribute("data-i18n-title"));
      el.title = val;
      el.setAttribute("aria-label", val);
    });

    const langCode = document.getElementById("langCode");
    if (langCode) langCode.textContent = this.current.toUpperCase();
    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect) languageSelect.value = this.current;
  }
};
