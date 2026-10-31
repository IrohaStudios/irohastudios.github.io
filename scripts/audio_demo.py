"""Bind displayed dialogue to verified, immutable audio files at build time."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]


def load_audio_demo():
    demo = json.loads((ROOT / 'src/blog/emotion-demo.json').read_text())
    samples = json.loads((ROOT / 'blog/research/assets/samples.json').read_text())
    sources = json.loads((ROOT / 'src/blog/audio-sources.json').read_text())['samples']
    if sources[demo['reference_sample']]['bundle'] != demo['source_section']:
        raise ValueError('Reference voice belongs to a different comparison')
    for model in demo['models']:
        for emotion in demo['emotions']:
            key = f'{model}--emo-{emotion}'
            source = sources[key]
            expected = demo['source_section'] if model == 'stock' else 'v9-' + demo['source_section']
            if source['bundle'] != expected:
                raise ValueError(f'{key}: audio belongs to a different dialogue')
    for key, sample in samples.items():
        source = ROOT / sample['url'].split('?', 1)[0].lstrip('/')
        content = source.read_bytes()
        digest = hashlib.sha256(content).hexdigest()
        if digest != sources[key]['sha256']:
            raise ValueError(f'{key}: audio does not match its recorded source')
        destination = source.with_name(f'{key}.{digest[:16]}{source.suffix}')
        if destination.exists():
            if destination.read_bytes() != content:
                raise ValueError(f'{key}: immutable audio file was modified')
        else:
            destination.write_bytes(content)
        sample['url'] = '/' + str(destination.relative_to(ROOT))
    return demo, samples
