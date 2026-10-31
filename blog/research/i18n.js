'use strict';
(() => {
  const catalogs = window.IrohaMessages;
  const supported = ['zh', 'ja', 'en'];
  const storageKey = 'iroha-blog-language';
  let saved;
  try { saved = localStorage.getItem(storageKey); } catch (_) { /* Storage can be disabled. */ }
  const routeLanguage = () => location.pathname.match(/^\/blog\/research\/(zh|ja|en)\//)?.[1];
  const requested = new URLSearchParams(location.search).get('lang');
  let language = routeLanguage() || (supported.includes(requested) ? requested : null)
    || document.documentElement.dataset.locale || (supported.includes(saved) ? saved : 'ja');
  const picker = document.getElementById('language-select');
  function t(key, values = {}) {
    const value = catalogs[language][key] ?? catalogs.zh[key] ?? key;
    return value.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
  }
  function apply() {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
    document.documentElement.dataset.locale = language;
    // Markup comes exclusively from the checked-in translation catalog.
    document.querySelectorAll('[data-i18n]').forEach(element => {
      element.innerHTML = t(element.dataset.i18n);
      element.lang = document.documentElement.lang;
    });
    for (const attribute of ['aria-label', 'title']) {
      document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(element => {
        element.setAttribute(attribute, t(element.getAttribute(`data-i18n-${attribute}`)));
      });
    }
    document.title = t('ui.pageTitle');
    document.querySelector('meta[name="description"]').content = t('ui.pageDescription');
    document.querySelector('link[rel="canonical"]').href = `https://irohastudios.github.io/blog/research/${language}/`;
    document.querySelectorAll('[data-release-link]').forEach(link => { link.href = `/blog/${language}/`; });
    document.querySelectorAll('[data-home-link]').forEach(link => { link.href = `/${language}/`; });
    const snapshot = document.querySelector('.research-snapshot');
    snapshot.textContent = snapshot.dataset[language];
    picker.value = language;
    window.dispatchEvent(new CustomEvent('iroha:languagechange', { detail: { language } }));
  }
  function setLanguage(value, persist = true) {
    if (!supported.includes(value)) return;
    language = value;
    if (persist) {
      try { localStorage.setItem(storageKey, language); } catch (_) { /* In-memory selection still works. */ }
    }
    apply();
    const url = new URL(location.href);
    url.pathname = `/blog/research/${language}/`;
    url.searchParams.delete('lang');
    history.replaceState(null, '', url);
  }
  picker.addEventListener('change', () => setLanguage(picker.value));
  window.addEventListener('popstate', () => { language = routeLanguage() || 'ja'; apply(); });
  window.IrohaI18n = { t, setLanguage, get language() { return language; },
    glossary: key => window.IrohaGlossary?.[language]?.[key] };
  apply();
})();
