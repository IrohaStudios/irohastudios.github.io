#!/usr/bin/env python3
"""Render Chinese, Japanese and English pages, defaulting to English."""
import hashlib
import html
import json
from pathlib import Path
import re
from audio_demo import load_audio_demo

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://irohastudios.github.io'
LOCALES = {'zh': ('zh-CN', '/zh/'), 'ja': ('ja', '/ja/'), 'en': ('en', '/en/')}


def build():
    demo, samples = load_audio_demo()
    template = (ROOT / 'src/index.template.html').read_text()
    translations = json.loads((ROOT / 'src/locales.json').read_text())
    keys = set(translations['ja'])
    for locale, (tag, path) in LOCALES.items():
        messages = translations[locale]
        if set(messages) != keys:
            raise ValueError(f'Translation keys differ for {locale}')
        values = {key: html.escape(value, quote=True).replace('\n', '<br />') for key, value in messages.items()}
        values['audio.script'] = html.escape(demo['text'])
        values['audio.translation'] = '' if locale == 'ja' else html.escape(demo['translations'][locale])
        values.update({'locale.tag': tag, 'locale.code': locale, 'locale.url': ORIGIN + path})
        values['hash.language'] = hashlib.sha256((ROOT / 'assets/language.js').read_bytes()).hexdigest()[:12]
        values['hash.asmr'] = hashlib.sha256((ROOT / 'assets/demos/asmr-3d.mp4').read_bytes()).hexdigest()[:12]
        values['hash.asmrmobile'] = hashlib.sha256((ROOT / 'assets/demos/asmr-3d-720p.mp4').read_bytes()).hexdigest()[:12]
        for key, name in [('subtitlecss', 'assets/video-subtitles.css'), ('subtitlejs', 'assets/video-subtitles.js'), ('subtitles', 'assets/demos/feature-tour.en.vtt')]:
            values[f'hash.{key}'] = hashlib.sha256((ROOT / name).read_bytes()).hexdigest()[:12]
        values['hero.language'] = 'en' if locale == 'en' else 'ja'
        values.update({f'selected.{code}': 'selected' if code == locale else '' for code in LOCALES})
        values['hash.preview'] = hashlib.sha256((ROOT / 'assets/research-preview.png').read_bytes()).hexdigest()[:12]
        for ext in ['css', 'js']:
            name = 'style.css' if ext == 'css' else 'app.js'
            values[f'hash.{ext}'] = hashlib.sha256((ROOT / name).read_bytes()).hexdigest()[:12]
        runtime = {key: value for key, value in messages.items() if key.startswith(('menu.', 'motion.', 'audio.', 'emotion.')) or key == 'demo.error'}
        runtime['samples'] = {emotion: samples[f'iroha-v1--emo-{emotion}'] for emotion in demo['emotions']}
        values['ui.messages'] = json.dumps(runtime, ensure_ascii=False).replace('<', '\\u003c')
        page = re.sub(r'{{([\w.]+)}}', lambda match: values[match[1]], template)
        destination = ROOT / path.lstrip('/') / 'index.html'
        destination.parent.mkdir(exist_ok=True)
        destination.write_text(page)
        print(f'Rendered {destination.relative_to(ROOT)} ({tag})')
        if locale == 'en':
            (ROOT / 'index.html').write_text(page)
            print('Rendered index.html (en, default)')


if __name__ == '__main__':
    build()
