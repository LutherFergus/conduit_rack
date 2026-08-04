# Conduit Rack Layout Calculator (PWA)

Local-first conduit rack layout, geometry, clearance, and 3D viewing tool.

## Run online (GitHub Pages)

After Pages is enabled, open:

**https://lutherfergus.github.io/conduit_rack/**

(Use your own username/repo if different.)

Works offline after the first visit if you add it to your home screen (PWA).

## Run on your PC

```powershell
cd path\to\conduit_rack
python serve.py
```

Then open http://127.0.0.1:8000/

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
