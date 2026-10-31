'use strict';
(() => {
  const supported = ['zh', 'ja', 'en'];
  const storageKey = 'iroha-preferred-language';
  const valid = value => supported.includes(value);
  function route(pathname) {
    const path = pathname.replace(/\/index\.html$/, '/').replace(/\/?$/, '/');
    const match = path.match(/^(\/(?:blog\/(?:irohattsv1|research)\/|blog\/)?)(?:(zh|ja|en)\/)?$/);
    return match ? {base:match[1], language:match[2]} : null;
  }
  const current = route(location.pathname);
  if (!current) return;
  function remember(language) {
    if (!valid(language)) return;
    try { localStorage.setItem(storageKey, language); } catch (_) { /* URLs work without storage. */ }
  }
  function savedLanguage() {
    try {
      const value = localStorage.getItem(storageKey) || localStorage.getItem('iroha-blog-language');
      return valid(value) ? value : null;
    } catch (_) { return null; }
  }
  function url(language, base = current.base) {
    const target = new URL(location.href);
    target.pathname = `${base}${language}/`;
    target.searchParams.delete('lang');
    return target;
  }
  const requested = new URLSearchParams(location.search).get('lang');
  const language = (valid(requested) ? requested : null) || current.language || savedLanguage() || 'en';
  if (valid(requested)) remember(requested);
  const target = url(language);
  const redirecting = location.pathname !== target.pathname;
  window.IrohaLanguage = {language, remember, url, redirecting};
  if (redirecting) location.replace(target.href);
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.blog-languages a, .language-fallback a, .research-language-fallback a').forEach(link => {
      link.addEventListener('click', () => {
        const destination = route(new URL(link.href).pathname);
        if (!destination?.language) return;
        remember(destination.language);
        link.href = url(destination.language, destination.base).href;
      });
    });
  });
})();
