#!/bin/sh
# Rebuild everything from data/build_data.py (the single source of truth).
set -e
cd "$(dirname "$0")"
python3 data/build_data.py
python3 tools/build_html.py
python3 tools/build_canvas.py data/data.json dist/silver-pines-board.canvas
