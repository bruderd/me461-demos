# MECHENG 461 — Interactive Controls Demos

Browser-based teaching tools for Automatic Controls at the University of Michigan.
Students design controllers and simulate system behavior. **Everything runs client-side**
(no server compute); the whole project is static files hosted on GitHub Pages.

## Layout
```
.
├── index.html                     # landing page
├── demos/                         # self-contained JS playgrounds (one .html each)
│   └── cruise-control/index.html  # reference demo: cruise control over hills
├── notebooks/                     # JupyterLite + python-control exercises
│   └── content/                   # the .ipynb files students open
├── .github/workflows/deploy.yml   # build JupyterLite + deploy site to Pages
└── CLAUDE.md                      # project brief / context for Claude Code
```

## Run locally
- **Demos:** `python3 -m http.server` then open `index.html` (or open a demo directly).
- **Notebooks:** `pip install jupyterlite-core jupyterlite-pyodide-kernel` then
  `jupyter lite build --contents notebooks/content --output-dir _site/notebooks`.

## Deploy
Push to `main`. The GitHub Actions workflow builds the notebook site and publishes
everything to GitHub Pages. In the repo Settings → Pages, set the source to
"GitHub Actions". The site serves at `https://<user>.github.io/<repo>/`.

> New here? Open this folder in **Claude Code** — it reads `CLAUDE.md` automatically
> and has the full plan.
