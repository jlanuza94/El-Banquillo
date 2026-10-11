#!/usr/bin/env python3
"""Junta todo el proyecto en un único archivo: dist/el-banquillo.html.

Sirve como copia de respaldo o para jugar sin conexión abriendo un solo archivo.
Uso:  python3 tools/build.py
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
order = json.load(open(os.path.join(ROOT, 'tools', 'load-order.json')))
index = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()

css = '\n'.join(open(os.path.join(ROOT, 'css', f), encoding='utf-8').read().replace('@charset "utf-8";\n', '')
                for f in ('base.css', 'game.css', 'layout.css'))
js = '\n'.join(open(os.path.join(ROOT, 'js', f + '.js'), encoding='utf-8').read() for f in order)

out = re.sub(r'(<link rel="stylesheet" href="css/[^"]+">\n?)+', '<style>\n' + css + '</style>\n', index, count=1)
out = re.sub(r'(<script src="js/[^"]+"( charset="utf-8")?></script>\n?)+', lambda m: '<script>\n' + js + '</script>\n', out, count=1)

os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
dest = os.path.join(ROOT, 'dist', 'el-banquillo.html')
open(dest, 'w', encoding='utf-8').write('<meta charset="utf-8">\n' + out)
print(f'Creado {dest} ({len(out) // 1024} KB)')
