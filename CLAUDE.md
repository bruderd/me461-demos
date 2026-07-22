# CLAUDE.md — MECHENG 461 Interactive Controls Demos

> This file is the project brief. It carries over the decisions made while
> planning this project so you (Claude Code) have full context on launch.

## Goal

Interactive, browser-based teaching tools for **MECHENG 461: Automatic Controls**
(University of Michigan). Students design controllers and watch simulated dynamical
systems respond. **All computation runs client-side in the browser — no server-side
compute, no backend.** The whole project deploys as static files.

## Two tracks (deliberately complementary)

1. **JS demos** (`/demos/`) — real-time, animated "playgrounds." Drag sliders or edit
   controller code and watch the system respond live at 60 fps. Best for intuition-building.
2. **Python notebooks** (`/notebooks/`) — JupyterLite + Pyodide running `python-control`,
   for more rigorous in-class exercises (Bode, root locus, pole placement, LQR, etc.).
   Runs entirely in-browser via WebAssembly; deploys as static files too.

## Hosting plan (decided)

- **Single GitHub Pages repo** hosts both tracks. GitHub allows one Pages site per repo
  and unlimited repos, so this sits alongside the user's existing lab site + lab wiki
  with no conflict.
- The site is served from a **project subpath**: `https://<user>.github.io/<repo>/`.
  This matters for JupyterLite — its **base URL must be set to the repo name** or assets
  404. The self-contained JS demos use relative paths and don't care about the subpath.
- Deploy via **GitHub Actions** (`.github/workflows/deploy.yml`): build JupyterLite, stage
  the demos + landing page, publish to Pages. Pushing to `main` redeploys everything.
- Optional, cosmetic: the College of Engineering's CAEN can point an `engin.umich.edu`
  hostname at the GitHub Pages site if an official URL is wanted. Only pursue U-M-hosted
  auth (Cosign/Shibboleth) if access must be restricted to *enrolled* students — GitHub
  Pages on a free account is public.

## The JS demo pattern (reuse this skeleton for every new system)

Every demo is a **single self-contained `.html` file, zero external dependencies**
(no CDN) so it deploys and archives anywhere, works offline, and reads as a clean
teaching artifact. The reference implementation is `demos/cruise-control/index.html`
(a car holding target speed over hills; the road grade is the disturbance). Its structure:

1. `dynamics(x, u)` → returns ẋ. The **plant**, written as explicit ODEs. Do NOT use a
   game physics engine (matter.js/planck.js) — hiding the equations of motion is exactly
   wrong for a controls course. Students must be able to see and model the plant.
2. `rk4(x, u, dt)` → fixed-step 4th-order Runge–Kutta integrator.
3. `controller(x, ref, p, mem, dt)` → the part **students write/tune**. Compiled live from
   a `<textarea>` via `new Function(...)`, wrapped in try/catch. `mem` is a persistent
   scratch object for controller state (e.g. integral term). Actuator output is clamped
   to a saturation limit (teaches windup/saturation).
4. **Loop:** `requestAnimationFrame` + a fixed-timestep accumulator, running several sim
   substeps per rendered frame so behavior is framerate-independent. Then draw.
5. **Rendering:** hand-drawn HTML `<canvas>` for both the physical scene (camera follows
   the object, tilts to local slope) and the telemetry strip charts. No plotting library.

### Design conventions
- Palette: Michigan blue `#00274C` + maize `#FFCB05`; an "instrument cluster / telemetry"
  aesthetic. Monospace for all numeric readouts, sans for UI chrome.
- Sliders for guided tuning (gains, reference, disturbance severity) **and** an editable
  controller code box for open-ended design. Show live readouts: measured output, error,
  control effort, and a saturation indicator.

## Systems roadmap

- [x] Cruise control over hills (PID vs. gravity disturbance) — DONE, the reference demo.
- [x] Phase Portrait Explorer (`demos/phase-portrait/`) — type any 2-D ẋ=f(x), see the
      vector field, drop ICs, watch trajectories in phase space and in time.
- [x] Linearization Explorer (`demos/linearization/`) — nonlinear system vs. your
      linearization of it, side by side. (See "Session resume notes" below.)
- [ ] DC motor (position/speed control; V→current→torque).
- [ ] Inverted pendulum / cart-pole (stabilization; nonlinear, great for state feedback).
- [ ] Ball & beam.
- [ ] Kinematic bicycle (steering for path following) and/or bicycle *lean* balance.
- [ ] Mass-spring-damper (the canonical 2nd-order teaching system).

Keep all of them on the same skeleton so students recognize the interface across the term.

## Notebook track notes

- Stack: **JupyterLite** (static Jupyter) + **Pyodide** (CPython in WASM) + `python-control`,
  `numpy`, `scipy`, `matplotlib`, `sympy`. Install `control` at runtime in the notebook
  (`%pip install control`), or bundle it in the build.
- **Caveat:** functions that depend on `slycot` (compiled Fortran) are unavailable under
  Pyodide. The pure-Python majority of `python-control` works fine.
- `notebooks/content/` holds the `.ipynb` files students open; a starter is included.

## Local development

- JS demos: `python3 -m http.server` from the repo root, open the demo's `index.html`.
  (Opening via `file://` also works since there are no external fetches.)
- Notebooks: `pip install jupyterlite-core jupyterlite-pyodide-kernel`, then
  `jupyter lite build --contents notebooks/content` and serve the output.
- **Verify current build/deploy specifics against the JupyterLite and GitHub Pages docs** —
  those tools move quickly, so confirm the workflow file rather than trusting it blindly.

## Suggested first tasks for Claude Code

1. Read `demos/cruise-control/index.html` end to end — it defines the house style + skeleton.
2. Stand up the landing page (`index.html`) and confirm the Actions workflow deploys a
   working Pages site (demos load; JupyterLite loads at the correct subpath base URL).
3. Build the **DC motor** demo next, cloning the cruise-control skeleton.
4. Flesh out the starter notebook into a first graded exercise.

---

## Session resume notes (last updated 2026-07-22)

Where we left off, so the conversation can be cleared and resumed later.

### Status: Linearization Explorer is DONE and verified — but NOT yet committed/pushed.
- Files exist locally: `demos/linearization/index.html` (the demo, ~600 lines) and the
  landing-page card in `index.html` (already added, points at the demo).
- Live deploy target once pushed: `https://danielbruder.com/me461-demos/demos/linearization/`
  (the site serves at **danielbruder.com/me461-demos/**, not the github.io URL).
- **Nothing has been committed or pushed.** Standing rule: commit/push only when the user
  asks. When they do, verify git state first — the working dir may not be the git root.

### What the Linearization Explorer is
Two columns; each has a phase portrait (top) + time-response plot (bottom). **Left =
user-defined nonlinear system ẋ=f(x); right = the user's linearization of it**, both run
from the same IC for one shared **duration**. Phase-portrait axis limits/zoom are
independent per column. Traces persist until cleared. Three coordinate-frame design
decisions the user chose and that are implemented:
- Right frame has a **toggle between x̃ (deviation coords) and x (mapped back)**.
- The change of variables is entered as **general expressions x̃₁(x), x̃₂(x)**.
- ICs are placed by **clicking either plot**.

### How it works (the math/plumbing that isn't obvious from the skeleton)
- Three live-compiled `new Function`s: `Fnl(x1,x2,t)` (nonlinear ẋ), `Tf(x1,x2)` (transform
  x→x̃), `Flin(xt1,xt2,t)` (linearized x̃̇=Ax̃). All smoke-tested in `compile()`.
- Numerical Jacobian `DT(x)=∂x̃/∂x` (central differences); Newton inverse `invT(x̃)`
  (exact one-step for affine shifts, continuation-seeded when nonlinear).
- x-frame pushforward field `linFieldX(x)=[DT(x)]⁻¹·Flin(T(x))`; `mapLinToX` maps the
  x̃-trajectory back to x-coords by Newton continuation from the known start.
- Shared params auto-detected across all six expressions; `RESERVED` excludes
  x1,x2,xt1,xt2,t. Default example = inverted pendulum linearized about upright (π,0),
  params b=0.4, c=4.
- Time-plot y-range is percentile-clipped (P2/P98) with an early-window cap (2.6× the
  first-12% spread) so a divergent linear run clips off-screen while early agreement stays
  legible.

### Two known CSS gotchas already solved (don't re-break them)
- Left/right phase cards are height-matched by pinning `.phcard h2`/`.axisrow`/`.status`
  min-heights and moving the frame toggle out of the header into the axisrow.
- The combining tilde (U+0303) drifts right after `x ` in the **sans** UI font — fixed with
  a `.xt::after{content:"~"}` overlay (offset `top:-.28em`). It renders fine in **mono**,
  so the readout tile keeps the plain combining tilde and uses class `xtro` (renamed from
  `xt` to avoid colliding with the overlay rule).

### Verification harness (in this session's scratchpad, reusable)
- `test_lin.mjs` — 14/14 Node logic checks (param scan, inverse exactness/round-trip,
  pushforward field, blow-up guard, mapLinToX residual ~4e-13, malformed-expr rejection).
- `drive_lin.mjs` — headless-Chrome driver that overrides `performance.now`/`rAF` to pump
  the animation synchronously, then screenshots + dumps DOM. Last run: RESULT OK, no JS
  errors, columns aligned, tildes correct.

### Likely next steps (none in flight)
- On request: commit + push to deploy. Otherwise: next roadmap demo is the **DC motor**.
