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
- [x] Complex Exponential Explorer (`demos/complex-exponential/`) — place a pole s = σ+jω
      in the s-plane, watch the mode e^{st} spiral (decay / sustain / grow) live like a 2-D
      slider; Re/Im-vs-t strip, ζ & ωₙ readouts, conjugate-pair toggle.
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

## Session resume notes (last updated 2026-07-23)

Where we left off, so the conversation can be cleared and resumed later.

### Status: Complex Exponential Explorer is DONE + verified — NOT committed (newest work).
- Files: `demos/complex-exponential/index.html` (self-contained single file) and its
  landing-page card in `index.html` (added). The roadmap checkbox above is ticked.
- Live target once pushed: `https://danielbruder.com/me461-demos/demos/complex-exponential/`.
- Still uncommitted: this demo, the Linearization Explorer (below), the `index.html` card
  edits, and this `CLAUDE.md`. Standing rule: commit/push only when asked, verify git state
  first (working dir may not be the git root).

### What the Complex Exponential Explorer is
Visualises the mode e^{st} generated by a pole **s = σ + jω**. **Left = s-plane** with a
draggable pole marker (acts like a 2-D slider) + manual σ/ω fields; **right = the complex
plane** tracing the spiral e^{st}=e^{σt}(cos ωt + j sin ωt) for t≥0, redrawn live as you
drag; a **full-width Re/Im-vs-t strip** sits below both planes. Design decisions the user
chose:
- **Horizon = auto-fit-to-view** (no t_max control): the spiral is traced until it exits
  the visible right-plane window (σ≥0, growing) or the decaying tail reaches a view-relative
  floor (σ<0). Zoom the right plane out to see more of a growing spiral; zoom into the
  origin to see deeper into a decaying one. **Fit ⤢** frames the current mode; **Reset
  view** restores defaults.
- **Conjugate toggle** (off by default): adds the mirror pole s̄=σ−jω and its mirror-image
  spiral, AND switches the time strip to plot the **sum e^{st}+e^{s̄t}** — the Im line
  collapses to ≡0, showing the imaginary parts cancel to the real signal 2e^{σt}cos ωt.

### How it works (non-obvious plumbing)
- e^{st} is sampled **analytically** (no ODE/RK4). `genTraj(σ,ω,A)` marches t with adaptive
  dt (≤0.05 rad rotation & ≤2.5% radius change per step), stopping on: exit-visible-box
  (σ≥0), decay-below-floor (σ<0, floor = max(1e-6, viewScale·3e-4)), a 16-revolution cap, or
  a 4000-point cap. Returns `{pts, mirror (im-negated ⇒ the conjugate), tEnd, constant}`;
  s=0 degenerates to a single point at 1+0j.
- **Equal-aspect** rendering via `actual(cv,v)`: derives the on-screen window from a
  requested box with equal px/unit on both axes, so circles stay circular and the s-plane
  damping angle reads true. `D2P`/`P2D` and the exit-box test all use this actual view.
- Right plane is two layers: static content (grid, dashed unit circle, dim→bright gradient
  spiral, t=0 marker, direction arrow) is cached to an offscreen canvas `estCache`, rebuilt
  only on s/view/size change; a persistent `rAF` blits it and draws the continuously
  **sweeping comet** (the direction-of-increasing-t cue) each frame.
- Left plane: LHP/RHP shading split at the jω axis (Re s=0, drawn maize), a damping-angle
  radial spoke, draggable marker (grab within ~13px moves s; else drag=pan; click on empty
  space places s), wheel zoom. Right plane: drag=pan, wheel=zoom, no marker.
- Time-strip y-range shows the **true amplitude, capped at 3× the early-window peak** so a
  growing mode's blow-up clips off-screen while bounded modes render full height (this
  replaced an inherited P2/P98 clip that was cutting the t=0 peak).
- Default s = −0.4 + 3.2j (stable damped oscillation). After user feedback the top readouts
  are minimal — only **s** and a one-word **mode** tag; the ωₙ and ζ tiles and the whole
  verbose "Mode analysis" box were **removed** (wanted an exploratory tool, not one that
  over-explains).

### CSS gotchas already solved (don't re-break)
- Left/right plane cards are equal height because they are direct children of a 2-col
  `.grid` (grid stretch) with identical structure; the Re/Im strip is a separate full-width
  card below them.
- `.k` field labels are `text-transform:uppercase`, which turned σ/ω into Σ/Ω — fixed by
  wrapping the Greek letters in `.lc{text-transform:none}` (so the label reads "RE(S) = σ").
- The combining macron over "s" (s̄) drifts in the **sans** button font — rendered in
  **mono** via `.sb{font-family:var(--mono)}` (same finding as the linearization tilde).

### Verification harness (this session's scratchpad, reusable)
- `test.mjs` — 25/25 Node logic checks on `genTraj`/`classify`/`actual` (decay→floor,
  growth→exits box, marginal→unit circle capped ~16 rev, pure-real stays on-axis, s=0
  constant, conjugate mirror, equal-aspect invariants, zoom-in reveals more loops, bounded
  point count).
- `node --check` on the extracted `<script>`; headless-Chrome screenshots (Chrome.app is
  present, **no puppeteer** — drive it via `--headless=new --screenshot --virtual-time-
  budget`) of default / growing / conjugate / grow+conjugate / top-controls — all render
  cleanly with no JS errors.

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
