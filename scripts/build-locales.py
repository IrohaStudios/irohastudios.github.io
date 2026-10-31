#!/usr/bin/env python3
"""Render Chinese, Japanese and English pages, defaulting to Chinese."""
import hashlib
import html
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://irohastudios.github.io'
LOCALES = {'zh': ('zh-CN', '/zh/'), 'ja': ('ja', '/ja/'), 'en': ('en', '/en/')}


def build():
    template = (ROOT / 'src/index.template.html').read_text()
    translations = json.loads((ROOT / 'src/locales.json').read_text())
    keys = set(translations['ja'])
    for locale, (tag, path) in LOCALES.items():
        messages = translations[locale]
        if set(messages) != keys:
            raise ValueError(f'Translation keys differ for {locale}')
        values = {key: html.escape(value, quote=True).replace('\n', '<br />') for key, value in messages.items()}
        values.update({'locale.tag': tag, 'locale.code': locale, 'locale.url': ORIGIN + path})
        values['hero.language'] = 'en' if locale == 'en' else 'ja'
        values.update({f'selected.{code}': 'selected' if code == locale else '' for code in LOCALES})
        values['hash.preview'] = hashlib.sha256((ROOT / 'assets/research-preview.png').read_bytes()).hexdigest()[:12]
        for ext in ['css', 'js']:
            name = 'style.css' if ext == 'css' else 'app.js'
            values[f'hash.{ext}'] = hashlib.sha256((ROOT / name).read_bytes()).hexdigest()[:12]
        runtime = {key: value for key, value in messages.items() if key.startswith(('menu.', 'motion.', 'audio.', 'emotion.')) or key == 'demo.error'}
        values['ui.messages'] = json.dumps(runtime, ensure_ascii=False).replace('<', '\\u003c')
        page = re.sub(r'{{([\w.]+)}}', lambda match: values[match[1]], template)
        destination = ROOT / path.lstrip('/') / 'index.html'
        destination.parent.mkdir(exist_ok=True)
        destination.write_text(page)
        print(f'Rendered {destination.relative_to(ROOT)} ({tag})')
        if locale == 'zh':
            (ROOT / 'index.html').write_text(page)
            print('Rendered index.html (zh-CN, default; Japanese/English slogan)')


if __name__ == '__main__':
    build()
