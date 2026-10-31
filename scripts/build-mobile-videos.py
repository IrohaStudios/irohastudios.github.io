#!/usr/bin/env python3
"""Create phone-sized video variants while preserving the AAC audio packets."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIRECTORY = ROOT / 'assets/demos'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    manifest = []
    for name in ('asmr-3d', 'feature-tour', 'after-school'):
        source = DIRECTORY / f'{name}.mp4'
        output = DIRECTORY / f'{name}-720p.mp4'
        command = ['ffmpeg', '-v', 'error', '-nostdin', '-i', str(source),
                   '-map', '0:v:0', '-map', '0:a:0',
                   '-vf', 'scale=1280:720:flags=lanczos',
                   '-c:v', 'libx264', '-profile:v', 'main', '-level:v', '3.1',
                   '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '27',
                   '-maxrate', '500k', '-bufsize', '1000k', '-threads', '2',
                   '-c:a', 'copy', '-movflags', '+faststart', str(output)]
        subprocess.run(command, check=True)
        manifest.append({'file': output.name, 'source': source.name,
                         'sourceSha256': digest(source), 'sha256': digest(output),
                         'bytes': output.stat().st_size, 'width': 1280, 'height': 720,
                         'video': 'H.264 Main, Level 3.1, yuv420p',
                         'audio': 'Original AAC stereo packets copied without re-encoding',
                         'faststart': True})
        print(f'{output.name}: {output.stat().st_size} bytes', flush=True)
    (DIRECTORY / 'mobile-sources.json').write_text(json.dumps(manifest, indent=2) + '\n')


if __name__ == '__main__':
    main()
