#!/usr/bin/env python3
"""Build the release article and the complete migrated research notes."""
from pathlib import Path
import hashlib
import html
import json
import re

from bs4 import BeautifulSoup
from markdown_it import MarkdownIt

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://irohastudios.github.io'
LANGS = ('ja', 'en', 'zh')
RELEASE = '/blog/irohattsv1/'
SITE_COPY = json.loads((ROOT / 'src/locales.json').read_text())
UI = {
    'ja': dict(home='ホーム', work='作品', journal='制作ノート', research='技術ノート', language='言語', skip='本文へ', release='リリース', toc='この記事の内容', listen='同じセリフを、聴き比べる', note='同じテキスト・同じ参照音声の日本語サンプルです。選んだ実例であり、成功率を示すものではありません。', emotions=['喜び', '怒り', '悲しみ', '驚き'], translation='そうね、ざっと千モラってとこかしら。', original='Fish S2-Pro · オリジナル', iroha='Iroha-TTS-V1', more='全20件のサンプルと実装を読む', download='Markdown を読む', next='7つの制御をどう実装したか', nextcopy='データと学習、音声デモ、評価条件、うまくいかなかった試み。', footer='AI、アニメーション、ときどき思いつくこと。', back='ページの先頭へ ↑', table='横にスクロールできるデータ表', audio='音声サンプル', error='音声を読み込めませんでした。下のリンクから音声を開いてください。', direct='音声ファイルを開く', source='2026年10月29日の技術ノート。聴取評価は10月30日の集計に更新しました。', snapshot='更新：2026年10月31日'),
    'en': dict(home='Home', work='Work', journal='Journal', research='Technical notes', language='Language', skip='Skip to article', release='Release', toc='In this article', listen='One line, different deliveries', note='Japanese samples with the same text and reference voice. These are selected examples, not a measure of success rate.', emotions=['Joy', 'Anger', 'Sadness', 'Surprise'], translation='Let’s see, roughly a thousand Mora, I suppose.', original='Fish S2-Pro · Original', iroha='Iroha-TTS-V1', more='Explore all 20 samples and the implementation', download='Read the Markdown', next='How we built Iroha’s seven controls', nextcopy='Data and training, audio demos, evaluation conditions, and attempts that didn’t work.', footer='AI, animation, and the occasional odd idea.', back='Back to top ↑', table='Horizontally scrollable data table', audio='Audio sample', error='The audio could not load. Use the link below to open the audio file.', direct='Open audio file', source='Technical notes from October 29, 2026, with the October 30 listening-study snapshot added.', snapshot='Updated October 31, 2026'),
    'zh': dict(home='主页', work='作品', journal='创作日志', research='技术笔记', language='语言', skip='跳到正文', release='版本发布', toc='本文目录', listen='同一句台词，听听不同的表达', note='同一段日语文本与同一参考音色的试听。这些是精选例子，不用于推断成功率。', emotions=['开心', '生气', '难过', '惊讶'], translation='嗯，大概一千摩拉左右吧。', original='Fish S2-Pro · 原版', iroha='Iroha-TTS-V1', more='查看全部 20 段试听与实现方法', download='阅读 Markdown', next='Iroha 的七种控制是怎么做出来的', nextcopy='数据与训练方法、音频演示、评测条件，以及没有奏效的尝试。', footer='关于 AI、动画，以及偶尔冒出来的想法。', back='回到开头 ↑', table='可横向滚动的数据表', audio='试听音频', error='音频加载失败，可以使用下方链接打开音频文件。', direct='打开音频文件', source='技术笔记基于 2026-10-29 的报告；人工听测已补充 10-30 的快照。', snapshot='更新于 2026 年 10 月 31 日'),
}
SECTION_IDS = ['release', 'motivation', 'evaluation', 'uses', 'getting-started', 'next']
SUBSECTION_IDS = ['automatic-evaluation', 'human-evaluation', 'other-results']


def esc(value):
    return html.escape(value, quote=True)


def asset(path):
    digest = hashlib.sha256((ROOT / path.lstrip('/')).read_bytes()).hexdigest()[:12]
    return f'{path}?v={digest}'


def language_links(lang, prefix):
    return ''.join(f'<a href="{prefix}{code}/" lang="{code}" hreflang="{code}"'
                   f'{" aria-current=\"page\"" if code == lang else ""}>{label}</a>'
                   for code, label in [('ja', '日本語'), ('en', 'English'), ('zh', '中文')])


def brand(lang):
    return f'<a class="studio-brand" href="/{lang}/" aria-label="Iroha Studios · {UI[lang]["home"]}"><img class="studio-mark" src="/assets/iroha-logo.svg" width="52" height="52" alt=""/><img class="studio-wordmark" src="/assets/iroha-wordmark-brush-v1.png" width="112" height="46" alt="Iroha"/><span>Studios</span></a>'


def head_links(lang, prefix):
    result = f'<link rel="canonical" href="{ORIGIN}{prefix}{lang}/"/>'
    for code in LANGS:
        result += f'<link rel="alternate" hreflang="{code}" href="{ORIGIN}{prefix}{code}/"/>'
    return result + f'<link rel="alternate" hreflang="x-default" href="{ORIGIN}{prefix}"/>'


def demo(lang):
    u = UI[lang]
    tabs = ''.join(f'<button type="button" role="tab" id="sample-{key}" data-emotion="{key}" aria-selected="{str(i == 0).lower()}" aria-controls="sample-panel" tabindex="{0 if i == 0 else -1}">{label}</button>' for i, (key, label) in enumerate(zip(['joy','anger','sadness','surprise'], u['emotions'])))
    players = ''
    for key, label in [('stock', u['original']), ('iroha-v1', u['iroha'])]:
        src = asset(f'/blog/research/assets/audio/{key}--emo-joy.mp3')
        players += f'<div class="release-player"><h3>{label}</h3><audio controls preload="none" src="{src}" data-model="{key}" aria-label="{label} · {u["emotions"][0]}"></audio><a class="audio-file" href="{src}">{u["direct"]} ↗</a></div>'
    return f'<section class="release-demo" id="listen" aria-labelledby="listen-title"><h2 id="listen-title">{u["listen"]}</h2><p>{u["note"]}</p><div class="sample-tabs" role="tablist" aria-label="{u["audio"]}">{tabs}</div><div id="sample-panel" role="tabpanel" aria-labelledby="sample-joy"><p class="sample-line" lang="ja"><code id="sample-tag">[happy]</code> そうね、ざっと千モラってとこかしら。</p>{"" if lang == "ja" else "<p class=\"sample-translation\">"+u["translation"]+"</p>"}<div class="release-players">{players}</div></div><p class="audio-error" role="status" hidden>{u["error"]}</p><a class="more-samples" href="/blog/research/{lang}/#listen">{u["more"]} →</a></section>'


def video_demos(lang):
    m = SITE_COPY[lang]
    cards = []
    for key, filename, duration in [('asmr', 'asmr-3d', '3:17'), ('intro', 'feature-tour', '4:06')]:
        title = esc(m[f'demo.{key}.title'])
        src = f'/assets/demos/{filename}.mp4'
        cards.append(f'<article class="release-film" id="demo-{key}"><video controls playsinline preload="none" width="1920" height="1080" poster="/assets/demos/{filename}.jpg" src="{src}" aria-labelledby="demo-{key}-title" aria-describedby="demo-{key}-description"></video><div class="film-meta"><span>{esc(m[f"demo.{key}.label"])}</span><span>{duration}</span></div><h3 id="demo-{key}-title">{title}</h3><p id="demo-{key}-description">{esc(m[f"demo.{key}.description"])}</p><a href="{src}" target="_blank" rel="noopener noreferrer">{esc(m["demo.open"])} ↗</a></article>')
    return f'<section class="release-videos" id="demos" aria-labelledby="demo-heading"><h2 id="demo-heading">{esc(m["demo.title"])}</h2><div class="release-film-grid">{"".join(cards)}</div><details class="film-credits"><summary>{esc(m["demo.credits"])}</summary><p>{esc(m["demo.credits.audio"])} <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>.</p></details></section>'


def build_journal(lang):
    u = UI[lang]
    article = BeautifulSoup((ROOT / f'blog/irohattsv1/{lang}/index.html').read_text(), 'html.parser')
    title = article.h1.get_text()
    lead = article.select_one('.article-lead').get_text()
    byline = article.select_one('.article-byline').get_text()
    link = f'{RELEASE}{lang}/'
    tag = 'zh-CN' if lang == 'zh' else lang
    page = f'''<!doctype html>
<html lang="{tag}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>{u['journal']} · Iroha Studios</title>{head_links(lang,'/blog/')}<link rel="icon" type="image/svg+xml" href="/assets/iroha-logo.svg"/><link rel="stylesheet" href="{asset('/blog/blog.css')}"/></head><body id="top"><header class="studio-header">{brand(lang)}<nav class="studio-nav" aria-label="{u['journal']}"><a href="/{lang}/#work">{u['work']}</a><a class="current" href="/blog/{lang}/" aria-current="page">{u['journal']}</a><a href="/blog/research/{lang}/">{u['research']}</a></nav><nav class="blog-languages" aria-label="{u['language']}">{language_links(lang,'/blog/')}</nav></header><main class="journal-index"><h1>{u['journal']}</h1><article class="journal-entry"><a class="journal-image" href="{link}" aria-label="{esc(title)}"><img src="/assets/sky-observatory.png" width="1536" height="1024" alt=""/></a><div><p class="article-eyebrow">{u['release']}</p><h2><a href="{link}">{esc(title)}</a></h2><p class="article-byline">{esc(byline)}</p><p>{esc(lead)}</p><a href="{link}">{esc(SITE_COPY[lang]['research.read'])} →</a></div></article></main><footer class="studio-footer">{brand(lang)}<p>{u['footer']}</p><a href="#top">{u['back']}</a></footer><script>function redirectLegacySection(){{if(["release","motivation","evaluation","uses","getting-started","next","listen","human-evaluation","automatic-evaluation","other-results","demos"].includes(location.hash.slice(1)))location.replace({json.dumps(link)}+location.hash);}}redirectLegacySection();addEventListener("hashchange",redirectLegacySection);</script></body></html>'''
    destination = ROOT / f'blog/{lang}/index.html'
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(page)
    if lang == 'ja': (ROOT / 'blog/index.html').write_text(page)


def model_mark(model):
    return f'<span class="model-mark model-{model}" aria-hidden="true"></span>'


def evaluation_table(lang, messages, data):
    def label(key):
        return esc(messages['evaluation.' + key])
    def header(key, detail=None):
        return f'<th scope="col">{label(key)}' + (f'<small>{detail}</small>' if detail else '') + '</th>'
    headers = header('correct', 'emo2vec large') + header('correct', 'EmoRuler') + header('emotions', 'EmoRuler')
    measures = header('similarity', 'speaker similarity') + header('quality', 'UTMOS') + header('cer')
    rows = []
    for row in data['rows']:
        key = row['id']
        model = f'<th scope="row"><span class="model-name">{model_mark(row["mark"])}<span>{label(key)}</span></span><small>{label(key + ".note")}</small></th>'
        if row['emotional'] is None:
            metrics = f'<td colspan="6" class="unsupported">{label("unsupported")}</td>'
        else:
            metrics = ''.join(f'<td><strong>{esc(value)}</strong></td>' if index == 0 else f'<td>{esc(value)}</td>' for index, value in enumerate(row['emotional']))
        metrics += ''.join(f'<td>{esc(value)}</td>' for value in row['neutral'])
        row_class = ' class="ours"' if key == 'ours' else ''
        rows.append(f'<tr{row_class}>{model}{metrics}</tr>')
    columns = '<colgroup><col class="model-column"/><col/><col/><col class="emotions-column"/>' + '<col/>' * 6 + '</colgroup>'
    return f'<div class="table-scroll overview-scroll" tabindex="0" role="region" aria-label="{UI[lang]["table"]}"><table class="overview-table">{columns}<thead><tr><th rowspan="2" scope="col"><span class="sr-only">{esc(messages["label.82"])}</span></th><th colspan="6" scope="colgroup"><span class="metric-group">{label("emotional")}</span></th><th colspan="3" scope="colgroup"><span class="metric-group">{label("neutral")}</span></th></tr><tr>{headers}{measures}{measures}</tr></thead><tbody>{"".join(rows)}</tbody></table></div>'


def research_mos(body):
    soup = BeautifulSoup(body, 'html.parser')
    for row, model in zip(soup.select('table')[0].select('tbody tr'), ['ours', 'fish', 'irodori', 'fish', 'index']):
        cell = row.find('td')
        label = soup.new_tag('span', attrs={'class':'model-name'})
        label.append(BeautifulSoup(model_mark(model), 'html.parser'))
        name = soup.new_tag('span')
        for node in list(cell.contents): name.append(node.extract())
        label.append(name)
        cell.append(label)
    return str(soup)


def release_actions(markup):
    anchors = BeautifulSoup(markup, 'html.parser').select('a')
    hf, demos = anchors[:2]
    arrow = '<span class="resource-arrow" aria-hidden="true">↗</span>'
    bars = f'<a class="resource-bar resource-hf" href="{esc(hf["href"])}"><span class="resource-icon"><img src="/assets/huggingface-logo.svg" width="44" height="44" alt=""/></span><span class="resource-label"><strong>Hugging Face</strong><small>Iroha-TTS-V1</small></span>{arrow}</a>'
    bars += f'<a class="resource-bar resource-listen" href="{esc(demos["href"])}"><img class="listening-mascot" src="/assets/listening-chibi-v1.png" width="88" height="88" alt=""/><span class="resource-label"><strong>{esc(demos.get_text())}</strong></span><span class="resource-play" aria-hidden="true">▶</span></a>'
    secondary = ' · '.join(str(a) for a in anchors[2:])
    return f'<div class="release-resources">{bars}</div><p class="release-secondary-links">{secondary}</p>'


def build_release(lang):
    u = UI[lang]
    md = (ROOT / f'blog/content/iroha-tts-v1-{lang}.md').read_text()
    soup = BeautifulSoup(MarkdownIt('commonmark', {'html': True}).enable('table').render(md), 'html.parser')
    title = soup.h1.get_text(); soup.h1.decompose()
    lead, byline, links = [str(soup.p.extract()) for _ in range(3)]
    links = release_actions(links)
    if soup.hr: soup.hr.decompose()
    headings = soup.find_all('h2')
    if len(headings) != len(SECTION_IDS): raise ValueError(f'Unexpected section count for {lang}')
    for h, id_ in zip(headings, SECTION_IDS): h['id'] = id_
    for h, id_ in zip(soup.find_all('h3'), SUBSECTION_IDS): h['id'] = id_
    headings[2].insert_before(BeautifulSoup(demo(lang), 'html.parser'))
    for table in soup.find_all('table'):
        for th in table.select('thead th'): th['scope'] = 'col'
        wrapper = soup.new_tag('div', attrs={'class':'table-scroll','tabindex':'0','role':'region','aria-label':u['table']})
        table.wrap(wrapper)
    mos_heading = soup.select_one('#human-evaluation')
    mos = soup.new_tag('section', attrs={'class': 'mos-results'})
    mos_heading.insert_before(mos)
    node = mos_heading
    while node is not None:
        following = node.next_sibling
        mos.append(node.extract())
        if following is not None and following.name == 'h3': break
        node = following
    toc = f'<a href="#demos">{esc(SITE_COPY[lang]["demo.title"])}</a>' + ''.join(f'<a href="#{h["id"]}">{esc(h.get_text())}</a>' for h in headings)
    toc = toc.replace('<a href="#evaluation">', f'<a href="#listen">{u["listen"]}</a><a href="#evaluation">')
    evaluation_link = f'<a href="#evaluation">{esc(headings[2].get_text())}</a>'
    toc = toc.replace(evaluation_link, evaluation_link + f'<a href="#human-evaluation">{esc(mos_heading.get_text())}</a>')
    mobile_toc = f'<details class="mobile-toc"><summary>{u["toc"]}</summary><nav aria-label="{u["toc"]}">{toc}</nav></details>'
    tag = 'zh-CN' if lang == 'zh' else lang
    home_lang = lang
    runtime = json.dumps(dict(emotions=u['emotions'], audio={model:{emotion:asset(f'/blog/research/assets/audio/{model}--emo-{emotion}.mp3') for emotion in ['joy','anger','sadness','surprise']} for model in ['stock','iroha-v1']}), ensure_ascii=False).replace('<','\\u003c')
    page = f'''<!doctype html>
<html lang="{tag}" data-locale="{lang}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>{esc(title)} · Iroha Studios</title><meta name="description" content="{esc(BeautifulSoup(lead,'html.parser').get_text())}"/><meta name="theme-color" content="#fafdff"/><meta property="og:title" content="{esc(title)}"/><meta property="og:type" content="article"/><meta property="og:url" content="{ORIGIN}{RELEASE}{lang}/"/><meta property="og:image" content="{ORIGIN}/assets/sky-observatory.png"/>{head_links(lang,RELEASE)}<link rel="icon" type="image/svg+xml" href="/assets/iroha-logo.svg"/><link rel="stylesheet" href="{asset('/blog/blog.css')}"/><link rel="stylesheet" href="{asset('/blog/mos.css')}"/><script defer src="{asset('/blog/release.js')}"></script><script id="blog-ui" type="application/json">{runtime}</script><noscript><style>.sample-tabs{{display:none}}</style></noscript></head>
<body id="top"><a class="blog-skip" href="#article">{u['skip']}</a><header class="studio-header">{brand(lang)}<nav class="studio-nav" aria-label="{u['journal']}"><a href="/{home_lang}/#work">{u['work']}</a><a class="current" href="/blog/{lang}/" aria-current="page">{u['journal']}</a><a href="/blog/research/{lang}/">{u['research']}</a></nav><nav class="blog-languages" aria-label="{u['language']}">{language_links(lang,RELEASE)}</nav></header>
<main><header class="article-hero"><div class="article-hero-inner"><a class="article-eyebrow" href="/blog/{lang}/">{u['journal']} <span>/</span> {u['release']}</a><h1>{esc(title)}</h1><div class="article-lead">{lead}</div><div class="article-byline">{byline}</div><div class="article-actions">{links}</div></div></header>
{video_demos(lang)}<div class="reading-layout">{mobile_toc}<article id="article" class="release-prose">{soup}<div class="article-source"><a href="/blog/content/iroha-tts-v1-{lang}.md">{u['download']} ↓</a></div><a class="next-article" href="/blog/research/{lang}/"><span>{u['research']} ↗</span><h2>{u['next']}</h2><p>{u['nextcopy']}</p></a></article><aside class="article-toc"><nav aria-label="{u['toc']}"><p>{u['toc']}</p>{toc}</nav></aside></div></main>
<footer class="studio-footer">{brand(lang)}<p>{u['footer']}</p><a href="#top">{u['back']}</a></footer></body></html>'''
    destination = ROOT / f'blog/irohattsv1/{lang}/index.html'
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(page)
    if lang == 'ja': (ROOT / 'blog/irohattsv1/index.html').write_text(page)
    return mos_heading.get_text(), ''.join(str(node) for node in mos.contents if node is not mos_heading)


def build_research(lang, catalog):
    u = UI[lang]
    soup = BeautifulSoup((ROOT / 'src/blog/research.template.html').read_text(), 'html.parser')
    release_link = soup.new_tag('a', attrs={'class':'mobile-release-link', 'data-i18n':'label.5', 'href':'/blog/'})
    soup.select_one('.masthead > nav').append(release_link)
    soup.html['lang'] = 'zh-CN' if lang == 'zh' else lang
    soup.html['data-locale'] = lang
    for element in soup.select('[data-i18n]'):
        element.clear()
        element.append(BeautifulSoup(catalog[lang][element['data-i18n']], 'html.parser'))
    for attribute in ('aria-label','title'):
        for element in soup.select(f'[data-i18n-{attribute}]'):
            element[attribute] = catalog[lang][element[f'data-i18n-{attribute}']]
    soup.title.string = catalog[lang]['ui.pageTitle']
    soup.select_one('meta[name="description"]')['content'] = catalog[lang]['ui.pageDescription']
    soup.head.append(BeautifulSoup(head_links(lang,'/blog/research/'), 'html.parser'))
    soup.head.append(soup.new_tag('link', rel='stylesheet', href=asset('/blog/research-theme.css')))
    soup.head.append(soup.new_tag('link', rel='stylesheet', href=asset('/blog/mos.css')))
    for element in soup.select('link[rel="stylesheet"],script[src]'):
        attr = 'href' if element.name == 'link' else 'src'
        if '?' not in element[attr]: element[attr] = asset(element[attr])
    for option in soup.select('#language-select option'):
        option.attrs.pop('selected',None)
        if option['value'] == lang: option['selected']=''
    for a in soup.select('a[href="/blog/"]'):
        a['href'] = f'{RELEASE}{lang}/';a['data-release-link'] = ''
    for a in soup.select('a.brand'):
        a['href'] = f'/{lang}/';a['data-home-link']=''
    for e in soup.select('.brand-edition'): e.string='Studios'
    for e in soup.select('.brand-slash'): e.decompose()
    notice = soup.new_tag('p', attrs={'class':'research-snapshot'})
    for code in LANGS: notice[f'data-{code}'] = UI[code]['source']
    notice.string = u['source']; soup.select_one('.hero-copy').append(notice)
    nojs = soup.new_tag('noscript')
    nojs.append(BeautifulSoup(f'<nav class="research-language-fallback" aria-label="{u["language"]}">{language_links(lang,"/blog/research/")}</nav><style>.language-control,.vtuber-stage{{display:none}}</style>', 'html.parser'))
    soup.select_one('header').append(nojs)
    # Static audio fallback retains all samples when scripting is unavailable.
    fallback = soup.new_tag('noscript')
    samples = json.loads((ROOT/'blog/research/assets/samples.json').read_text())
    fallback.append(BeautifulSoup('<div class="fallback-samples">'+''.join(f'<details><summary>{esc(key)}</summary><audio controls preload="none" src="{esc(value["url"])}" aria-label="{esc(key)}"></audio></details>' for key,value in samples.items())+'</div>', 'html.parser'))
    soup.select_one('#listen').append(fallback)
    soup.select_one('body > noscript').decompose()
    destination = ROOT/f'blog/research/{lang}/index.html'
    destination.parent.mkdir(exist_ok=True)
    destination.write_text(str(soup))
    if lang == 'ja': (ROOT/'blog/research/index.html').write_text(str(soup))


def main():
    catalog = json.loads((ROOT/'src/blog/research-locales.json').read_text())
    evaluation = json.loads((ROOT/'src/blog/evaluation-table.json').read_text())
    # Both articles share the MOS section maintained in the release Markdown.
    for lang in LANGS:
        catalog[lang]['label.89'], catalog[lang]['copy.p43'] = build_release(lang)
        catalog[lang]['copy.p43'] = research_mos(catalog[lang]['copy.p43'])
        catalog[lang]['evaluation.table'] = evaluation_table(lang, catalog[lang], evaluation)
    existing = (ROOT/'blog/research/locales.js').read_text()
    glossary = existing[existing.index('window.IrohaGlossary'):]
    (ROOT/'blog/research/locales.js').write_text("'use strict';\nwindow.IrohaMessages = "+json.dumps(catalog,ensure_ascii=False,indent=2)+';\n'+glossary)
    for lang in LANGS:
        build_research(lang,catalog)
        build_journal(lang)
        print(f'Rendered {lang}: release article + complete research notes')


if __name__ == '__main__':
    main()
