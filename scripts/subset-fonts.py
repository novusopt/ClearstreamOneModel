#!/usr/bin/env python3
"""
Trims the Fraunces display face (headings, transliterations) from the full files in assets/fonts-src
to what Mishkah renders, writing app/fonts/. Requires fonttools and brotli: pip install fonttools brotli.

- Weight axis limited to 400-600 (headings use 500 and 600; transliterations inherit 400). The optical-size
  axis is kept: headlines draw with the display cut.
- The Latin-Extended file keeps only the diacritics of Arabic transliteration (every one used by the
  dataset's word and ayah transliterations), the European and Turkish letters of the site's languages,
  and the hamza/ayn marks. Anything else falls back to Inter per character.

Run: python3 scripts/subset-fonts.py
"""
import io
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

SRC = Path("assets/fonts-src")
OUT = Path("app/fonts")
EXT_CHARS = "ĀāĒēĪīŌōŪūḤḥṢṣṬṭḌḍẒẓḎḏṮṯĠġẖŠšŽžČčĆćĞğİıŞşŁłŃńŒœŘřŚśŹźŻżĄąĘęŐőŰűʾʿʼ"


def build(name: str, unicodes=None) -> None:
    font = instancer.instantiateVariableFont(TTFont(SRC / name), {"wght": (400, 600)})
    if unicodes is not None:
        opts = subset.Options()
        opts.layout_features = ["*"]
        opts.notdef_outline = True
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=unicodes)
        sub.subset(font)
    font.flavor = "woff2"
    buf = io.BytesIO()
    font.save(buf)
    (OUT / name).write_bytes(buf.getvalue())
    print(f"{name}: {(SRC / name).stat().st_size:,} -> {len(buf.getvalue()):,} bytes")


build("fraunces-latin.woff2")
build("fraunces-latin-ext.woff2", sorted({ord(c) for c in EXT_CHARS}))
