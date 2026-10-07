# YouTube Column Ajuster

A Chrome extension that gives you back control of YouTube's grid layout —
choose exactly how many video columns are shown on Home, Subscriptions and
Channel pages, and declutter the rest of the interface with a set of
one-click toggles. Built entirely with a Material Design 3 interface,
available in **English** and **Vietnamese**.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4)
![License](https://img.shields.io/badge/license-MIT-green)
![Material Design 3](https://img.shields.io/badge/Design-Material%203-6750A4)

---

## Features

- **Custom column count** — pick anywhere from 3 to 8 columns per row,
  applied instantly on every open YouTube tab.
- **Per-page columns (advanced)** — set independent column counts for the
  Home, Subscriptions and Channel pages instead of one global value.
- **One-click decluttering**
  - Hide the Shorts shelf
  - Compact cards (hide descriptions & channel avatars)
  - Hide comments on watch pages
  - Hide end-screen suggestion cards
  - Focus mode (hides the related-videos sidebar while watching)
- **Master on/off switch** — pause every effect instantly without losing
  your configuration.
- **Backup & restore** — export your full configuration to a JSON file and
  import it again on any computer.
- **Material Design 3 interface** — dynamic color roles, expressive shape,
  soft elevation and motion-respecting animations, with a light/dark/system
  theme and adjustable font size.
- **Bilingual** — switch between English and Vietnamese anywhere in the
  extension with a single tap; every string, including the landing page, is
  fully translated.
- **Keyboard shortcut** — `Alt+Shift+Y` toggles custom columns on the active
  tab without opening the popup (configurable at `chrome://extensions/shortcuts`).
- **Toolbar badge** — the extension icon shows the active column count at a
  glance when custom columns are enabled.
- **Landing page** — a built-in, self-contained marketing page (`landing.html`)
  you can open from the popup or the settings page.
- **Private by design** — no accounts, no analytics, no network requests.
  Every setting is stored locally with `chrome.storage.local`.

## Screens

| Surface | Purpose |
|---|---|
| **Popup** (`popup.html`) | Quick access to the master switch, column slider and decluttering toggles from the toolbar. |
| **Settings** (`options.html`) | Full settings experience with General / Layout / Appearance / Data / About tabs, opened as its own browser tab. |
| **Landing page** (`landing.html`) | A polished, bilingual introduction to the extension — hero, feature grid, how-it-works, and FAQ. |

## Installation (Developer / unpacked)

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome (or any Chromium-based browser).
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `youtube-column-ajuster` folder.
5. Open any `youtube.com` tab, then click the toolbar icon to start
   customizing your grid.

## Project structure

```
youtube-column-ajuster/
├── manifest.json              Manifest V3 configuration
├── popup.html / options.html  Extension UI surfaces
├── landing.html                Marketing / introduction page
├── css/
│   ├── tokens.css              Material Design 3 design tokens (color, shape, elevation, motion)
│   ├── components.css          Shared M3 components (buttons, switches, sliders, cards, ripple)
│   ├── fonts.css                Be Vietnam Pro font-face declarations
│   ├── popup.css / options.css / landing.css   Per-surface layout rules
├── js/
│   ├── storage.js              Settings schema + load/save/export/import
│   ├── content.js               Injected into youtube.com — builds the override <style> tag
│   ├── background.js            Service worker: keyboard shortcut, toolbar badge, first-install page
│   ├── i18n.js                   English/Vietnamese dictionary + DOM translation helper
│   ├── theme.js                  Light/dark/system theme resolution + font size
│   ├── ripple.js                 Material ripple positioning helper
│   ├── popup.js / options.js / landing.js   Per-surface UI logic
├── icons/                        16 / 32 / 48 / 128 px extension icons
├── fonts/                        Be Vietnam Pro (woff2)
└── _locales/en, _locales/vi      Chrome Web Store name & description strings
```

## How the column override works

YouTube renders its video grid with a custom element (`ytd-rich-grid-renderer`)
driven by a `--ytd-rich-grid-items-per-row` CSS custom property. The content
script injects a single `<style>` tag (rather than mutating the DOM on every
render) that overrides this property — plus a `grid-template-columns` /
`display: contents` fallback for older layout versions — so the override
keeps applying automatically as YouTube's single-page app re-renders content,
with no `MutationObserver` and near-zero runtime cost.

When **per-page columns** is enabled, the same rule is scoped with an
attribute selector on `ytd-browse[page-subtype="…"]` so Home, Subscriptions
and Channel can each carry their own value.

## Permissions

The extension requests a single permission: **`storage`**, used only to save
your preferences locally. It does not request `tabs`, host permissions for
analytics, or any network access.

## Privacy

YouTube Column Ajuster does not collect, transmit, or sell any data. All
settings live in `chrome.storage.local` on your device. There is no
telemetry, no remote configuration, and no third-party script.

## Author

Developed by **gnort67**.

## License

MIT
