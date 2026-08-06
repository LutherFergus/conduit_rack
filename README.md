# Conduit Rack Layout Calculator (PWA)

Local-first conduit rack layout, geometry, clearance, and 3D viewing tool.

## Run online (GitHub Pages)

After Pages is enabled, open:

**Rack app:** https://lutherfergus.github.io/conduit_rack/

**Single stick (same engine, simpler UI):** https://lutherfergus.github.io/conduit_rack/single.html

(Use your own username/repo if different.)

Works offline after the first visit if you add it to your home screen (PWA).

## Run on your PC

```powershell
cd path\to\conduit_rack
python serve.py
```

Then open:
- Rack: http://127.0.0.1:8000/
- Single stick: http://127.0.0.1:8000/single.html

## Two shells, one calculator

| Entry | Purpose |
|--------|---------|
| `index.html` | Full rack calculator (multi-conduit, CTC, trim, runs) |
| `single.html` | Simplest single-stick UI (`?app=single`) |

Bend math, bender profiles, and 3D geometry live in one place so algorithm updates apply to both.

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Released app (what Pages serves) |
| `experiment/ui-playground` | UI experiments |

## Notes

- No API keys required.
- Do not commit `.env` files.
- Changelog: see `README.txt`
- On phones/tablets the 3D viewer docks to the bottom (collapsed peek). Expand it to work the camera; tap outside to collapse.
