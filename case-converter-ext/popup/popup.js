(async () => {
  const inputEl = document.getElementById('inputText');
  const outputEl = document.getElementById('outputText');
  const inputCount = document.getElementById('inputCount');
  const outputCount = document.getElementById('outputCount');
  const toolGrid = document.getElementById('toolGrid');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');
  const pasteBtn = document.getElementById('pasteBtn');
  const useAsInputBtn = document.getElementById('useAsInputBtn');
  const settingsBtn = document.getElementById('settingsBtn');

  let settings = await SettingsStore.load();
  let lastTransform = 'capitalize';

  function render() {
    applyThemeClass(settings.theme);
    applyFontClass(settings.font);
    I18N.apply(settings.language);
    renderTools();
    updateCounts();
  }

  function updateCounts() {
    const wc = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);
    inputCount.innerHTML = `${inputEl.value.length} <span data-i18n="charCount">${I18N.get(settings.language, 'charCount')}</span> · ${wc(inputEl.value)} ${I18N.get(settings.language, 'wordCount')}`;
    outputCount.innerHTML = `${outputEl.value.length} <span data-i18n="charCount">${I18N.get(settings.language, 'charCount')}</span> · ${wc(outputEl.value)} ${I18N.get(settings.language, 'wordCount')}`;
  }

  function renderTools() {
    toolGrid.innerHTML = '';
    CaseUtils.ORDER.forEach((id) => {
      const btn = document.createElement('button');
      btn.className = 'cc-chip';
      btn.type = 'button';

      const label = document.createElement('span');
      label.textContent = I18N.get(settings.language, id);
      btn.appendChild(label);

      const scEntry = settings.shortcuts[id];
      if (scEntry) {
        const sc = document.createElement('span');
        sc.className = 'cc-chip__shortcut';
        sc.textContent = SettingsStore.formatShortcut(scEntry);
        btn.appendChild(sc);
      }

      btn.addEventListener('click', () => runTransform(id));
      toolGrid.appendChild(btn);
    });
  }

  function runTransform(id) {
    lastTransform = id;
    outputEl.value = CaseUtils.apply(id, inputEl.value);
    updateCounts();
  }

  inputEl.addEventListener('input', () => {
    updateCounts();
    if (outputEl.value) runTransform(lastTransform);
  });

  clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
    updateCounts();
    inputEl.focus();
  });

  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      inputEl.value = text;
      updateCounts();
      if (outputEl.value) runTransform(lastTransform);
    } catch (e) {
      inputEl.focus();
    }
  });

  useAsInputBtn.addEventListener('click', () => {
    inputEl.value = outputEl.value;
    outputEl.value = '';
    updateCounts();
  });

  copyBtn.addEventListener('click', async () => {
    if (!outputEl.value) return;
    try {
      await navigator.clipboard.writeText(outputEl.value);
      const original = copyBtn.textContent;
      copyBtn.textContent = I18N.get(settings.language, 'copied');
      copyBtn.classList.add('cc-filled-btn--success');
      setTimeout(() => {
        copyBtn.textContent = I18N.get(settings.language, 'copy');
        copyBtn.classList.remove('cc-filled-btn--success');
      }, 1200);
    } catch (e) {
      /* clipboard permission denied — ignore silently */
    }
  });

  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  SettingsStore.onChange((next) => {
    settings = next;
    render();
  });

  render();
  inputEl.focus();
})();
