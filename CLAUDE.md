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
- [x] Sum of Complex Exponentials (`demos/sum-of-exponentials/`) — build f(t) = Σ cₖe^{sₖt}
      from up to 8 complex phasors, watch them chain tip-to-tail in the complex plane (tip =
      f(t)) and trace Re/Im of f(t) in time; a conjugate pair sums to a real cosine (default).
- [x] Laplace Transform Explorer (`demos/laplace/`) — type f(t); see F(s) as a hand-rolled 3-D
      surface over the s-plane (height |F(s)|, color ∠F(s)) with a draggable floor cursor + a
      linked 2-D s-plane; exact rational F(s) with true poles/ROC when f is an exp-polynomial,
      numeric ∫₀ᵀ fallback otherwise; F(s) Cartesian value plane (hue-wheel = ∠F key) + rect/polar
      readouts + poles/ROC box.
- [x] Two-Compartment Drug Delivery (`demos/drug-delivery/`) — infuse a drug into the bloodstream
      (compartment 1), control its concentration in the heart (compartment 2, the measured output).
      Reduced-LTI plant ċ = Ac + Bu with editable k₀,k₁,k₂,b₀; write a control law expression
      u(c₂,yd,t) (measured output only — c₁ hidden); the *simulated* plant adds physical limits the model
      omits (u≥0, concentrations floored at 0). Precompute + animate the response: the 50%-wide response
      panel is split into TWO stacked plots — c₂-vs-t (top; y_d dotted + steady-state-relative settling
      marker) over u-vs-t (bottom; the applied clipped infusion rate) — beside a colored Fig-3.18a flow chart
      whose arrows render as moving dotted lines (speed ∝ flux) + crimson colorbar (35%), and a centered
      patient body/heart cartoon on the same scale (15%); 2% settling time + % overshoot at the bottom.
      (No preset controller chips — the u box is edited by hand.)
- [x] Nyquist Stability Explorer (`demos/nyquist/`) — type a rational loop TF L(s) with a gain k (free-expression
      parser in s & k), sweep k on a slider (user-set min/max). Bode plot of L(jω) sits right of the L(s) box. Below,
      two complex planes: (left) the clockwise Nyquist D-contour with pole/zero markers, small rightward indentations
      around jω-axis poles (kept outside), and a dotted ∞-arc; (right) the autoscaled Nyquist plot with −1 marked. A
      single cursor rides the contour (draggable on ANY of the three plots, or auto-traced clockwise); the +jω axis,
      the Bode curves, and the corresponding Nyquist arc all share maize. Full stability readout Z = N + P (+ GM/PM).
- [x] Lyapunov Function Explorer (`demos/lyapunov/`) — enter a 2-D ẋ=f(x) and a candidate V(x); V̇=∇V·f is
      computed numerically. LEFT: a hand-rolled 3-D surface of V(x) (translucent, back-to-front) over the state
      plane, its floor + skin tinted green where V̇<0 / red where V̇>0, the phase-portrait vector field on the
      floor, and each RK4 trajectory drawn BOTH in the x-y plane and lifted onto the surface (persist until Clear).
      View-toggle: iso / overhead (x-y) / x-V / y-V. RIGHT: V(x(t)) for all runs (latest tracked) with a
      draggable time slider + play, and a short tangent line whose slope = V̇. Live "valid Lyapunov function?"
      verdict at the origin (f(0)=0, V(0)=0, V>0 & V̇<0 on a small disk).
- [x] Rocket Lander Challenge (`demos/rocket-lander/`) — a competitive project, NOT a single-file demo.
      Students write a controller (JavaScript **or** Python/Pyodide) for a planar rocket booster (constant-mass
      simplification of the CMU/Michigan/GT nonlinear-control rocket-landing project) that must fly from a fixed
      battery of 10 escalating ICs to a soft, upright, on-pad landing. Two pages: `index.html` (briefing +
      dynamics + scoring + live leaderboard + Get-Started) and `play.html` (workbench: follow-cam onboard view
      with gimballing turret + thrust flame, fixed mission-map with superimposed per-trial traces, dual-language
      editor with localStorage autosave + upload/download, precompute-then-animate playback with speed slider,
      per-trial + total scoring, submit). Backend = `apps-script.gs` + `SETUP.md` (Google Apps Script Web App:
      Sheet leaderboard upsert-by-email keep-best + sort, Google Doc code archive). `config.js` = single edit
      point (leaderboardUrl, course, pyodideUrl). Live once pushed: `danielbruder.com/me461-demos/demos/rocket-lander/`.
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

## Session resume notes (last updated 2026-08-04)

Where we left off, so the conversation can be cleared and resumed later.

### Status: Rocket Lander Challenge is DONE + verified — NOT committed (NEWEST work).
- Files: `demos/rocket-lander/{index.html, play.html, config.js, apps-script.gs, SETUP.md}` + a card in the
  top-level `index.html` (after the Lyapunov card) + roadmap entry above. Standing rule unchanged (commit/push
  only when asked; this project IS a git repo whose root is the working dir).
- **This demo deliberately breaks the single-file / zero-dep convention** (two pages + a same-origin `config.js`
  + a backend fetch + optional Pyodide CDN). Unavoidable given a leaderboard and Python support.

**Design decisions the user chose** (multiple-choice, all recommended picks): controller language = **JS + Python**
(Python via Pyodide); backend = **Google Apps Script**; rocket params = **I pick plausible values** (user did not
have the MATLAB constants).

**Physics (constant-mass simplification of the handout eq 1; γ folded so f_T is a force in N).** State
`[y,z,θ,ψ,ẏ,ż,θ̇,ψ̇]`; inputs `u=[fT,τ]`, ψ is a *gimbal state* (`ψ̈=τ/J_T`). `ÿ=-(fT/m)sin(θ+ψ)`,
`z̈=(fT/m)cos(θ+ψ)-g`, `θ̈=-(L/J)fT sinψ`. Chosen params: m=175, g=9.81, L=5, **J=mL²/3≈1458.33**, **J_T=40**
(deliberately light → fast gimbal inner loop; started at 200 and the cascade limit-cycled — see gotcha),
v_e=1000 (fuel=∫fT/v_e dt, tracked for scoring only), fT∈[0,6000] N, τ∈[±1000] N·m. RK4 @ 50 Hz (dt=0.02), T_max=60.
Landing = ground crossing of `zbottom=z-L cosθ` (interpolated to the crossing for the scored state).

**Scoring (exact handout cost).** P=[fuel,|y|,|zbottom|,|wrapπ(θ)|,√(ẏ²+ż²),|θ̇|], M=[150,20,10,π/6,5,1],
α=[10,30,20,20,10,10]. J=0 if any i≥2 exceeds its M (blow-up); else Σα_i(M_i-|P_i|)/M_i, **clamped [0,100]** per
trial (fuel P1 is NOT a hard limit — can cost points; clamp keeps a fuel-hog trial from going negative). Total over
**10 fixed ICs** = max 1000. ICs are deterministic (`mulberry32(0x1234ABCD)`, difficulty ramp f=0.18→1 scaling
each range) — same battery for everyone, increasing difficulty (higher altitude/tilt/spin).

**Default controller (both languages)** = a cascaded PD: descent-rate profile `vzTarget=-clamp(0.8√zbottom,1.2,22)`
→ thrust (gravity+tilt comp, floored at 0.25·mg for gimbal authority); horizontal error → target lean (only when
|θ|<0.5); attitude → required `sinψ=-thddCmd·J/(L·fT)` → gimbal servo torque. **Verified score = 647.8/1000, lands
7/10** (the 3 highest-altitude trials time out — intended “improve me” challenge). Faithful JS↔Python: the Python
default reproduces 647.77 exactly.

**Pyodide plumbing (don't re-break).** Pin **v314.0.3** — NB Pyodide adopted a new versioning scheme; `latest` on
jsDelivr is genuinely 314.x, and `https://cdn.jsdelivr.net/pyodide/v314.0.3/full/` resolves (verified via the
jsDelivr data API). Loaded lazily only when a student switches to Python; numpy auto-loaded if the code mentions it.
Per step: `xPy=pyodide.toPy(stateObj)` (destroy each call), call `pyCtrl(xPy, pP, memPy, dt)`, unwrap return via
`.toJs()` (tuple→Array / dict→Map) then destroy. **mem is a fresh Python dict per trial** (`startTrial()` makes a
new `toPy({})`); `simulate()`'s own `mem={}` is ignored on the Python path. Precompute is async with a per-trial
`await setTimeout` yield so the UI/progress stays alive.

**Backend (Apps Script).** `doPost` upserts by lowercased email keeping the higher score, sorts the sheet, archives
EVERY submission's code to a Google Doc (section per submission — note in SETUP on switching to real Docs *tabs*);
`doGet` returns the sorted board as JSON with **emails withheld**. Front end POSTs `Content-Type:text/plain` on
purpose (avoids the CORS preflight Apps Script can't answer). `LockService` guards concurrent writes. With
`leaderboardUrl:""` everything still works: submit falls back to a per-browser `localStorage` board and the briefing
page shows it with a “configure me” note. Honor-system caveat documented (client-side score; Doc archive = audit).

**Answers to the user's 3 questions** (for the reply): Python — yes, done via Pyodide. Local persistence — yes,
`localStorage` autosave per language + Upload/Download `.js`/`.py`. Google Sheet + Doc — yes, via the Apps Script
Web App (they must deploy it once and paste the `/exec` URL into `config.js`; SETUP.md has the steps).

**Verified this session** (scratchpad, reusable): `node --check` clean on both pages' scripts + `apps-script.gs`;
**29/29 logic asserts** (`test.mjs` — hover/freefall/gimbal-sign derivatives, RK4 vs analytic freefall, zbottom
geometry, all six scoring blow-ups + partial credit + θ=2π-wrap, IC-battery range/determinism, default lands ≥1 &
scores >0). Headless-Chrome (Chrome.app `--headless=new`, probe injected inside the inline `<script>`, `--dump-dom`
+ `RESULT` div): **JS path** total 647.77 / trials match / 7 landed / both canvases non-blank / **no JS errors**;
**Python path** (real Pyodide fetch, `--virtual-time-budget` waits on pending network) reproduced **647.77** exactly,
no explosions, no errors — proves the whole toPy/mem/return-unwrap chain. Screenshots confirm: onboard rocket with
gimballed nozzle + maize/orange flame + ground/pad follow-cam; mission map with all 10 colored traces spiraling to
the pad; briefing page equations/params/scoring/leaderboard; top-level card in the grid.

**Tweaks (post-build, this session, verified):** (1) onboard view now draws a **world-fixed coordinate grid**
(10 m spacing) that scrolls as the follow-cam tracks the rocket — y gridlines with the **y=0 pad-center line
highlighted maize**, z/altitude labels on the left; grid is drawn BEFORE the ground fill so underground lines are
covered, and y-labels sit along the TOP (not bottom) so the ground never hides them. (2) **⏭ Show all traces**
button (`skipAnimation()`) jumps to the end so every trajectory shows at once. (3) **click-to-replay a single
trial** — click a scoreboard row (`tr.onclick=playTrial(i)`) or a mission-map trace (`nearestTrial` hit-test,
14px tol, + pointer cursor on hover). Playback now has a `playMode` ∈ {'seq','solo'}: seq shows traces 0..cur-1;
solo shows every OTHER trace full as context + the replayed one animating and keeps its row highlighted. `mapXY(w,h)`
extracted so the renderer and the click hit-test share one transform. "Replay" button relabeled "Replay all".
Re-verified headless: total still 647.77, skip→all-10 traces, solo→playMode 'solo' on the clicked trial, rows
clickable, no JS errors; screenshot confirms the grid + maize pad-center line. NOTE: the user has since set a real
`leaderboardUrl` in `config.js` (backend deployed) — keep it.

**Likely next steps (none in flight):** on request, commit/push. Optional polish: a live per-trial "running tally"
reveal during playback (user chose to KEEP fill-immediately); a Python starter that also handles the 3 high-altitude
trials.



### Status: Lyapunov Function Explorer is DONE + verified — NOT committed (NEWEST work).
- Files: `demos/lyapunov/index.html` (self-contained single file) and its landing-page card in `index.html`
  (added, right after the Nyquist card). Roadmap checkbox above ticked. Live target once pushed:
  `https://danielbruder.com/me461-demos/demos/lyapunov/`. Uncommitted with all prior work; standing rule
  unchanged (commit/push only when asked; verify git state first — working dir may not be git root).

**Design decisions the user chose** (asked up front via multiple-choice, all "recommended" picks):
- **V̇ coloring = floor + surface**: both the xy-plane floor and the V(x) surface are tinted green where V̇<0 /
  red where V̇>0 (intensity ∝ |V̇| normalized by the 85th-pctile of |V̇| on the grid). This is THE Lyapunov map.
- **V-vs-t shows ALL persisted trajectories**, color-matched; the time slider + V̇ tangent track the **latest**
  (`active`) run.
- **Auto Lyapunov verdict at the origin**: checks f(0)=0, V(0)=0, and V>0 & V̇≤0 sampled on a small disk
  (r = 0.15·min span, 3 radii × 16 angles); green/red per-condition dots + a headline. Marks the equilibrium.
- **Playback = synced marker + play**: dragging the time slider (or scrubbing on the V(t) plot) moves a synced
  marker on BOTH the 3-D trajectory (ball on the surface + shadow on floor) and the V(t) curve; ▶ auto-sweeps.

**Reuse.** Compiles f1,f2,V via the phase-portrait `new Function`+`MATH_PRELUDE` pattern (states x1,x2; other
letters → tunable param sliders; `^`→`**`). RK4 + `integrate` from phase-portrait, extended so each stored
point carries `{t,x1,x2,V,Vd}`. 3-D orthographic projection (`proj`/`floorPick`, az about vertical + el tilt)
lifted from the Laplace demo. Default example = stable spiral `ẋ=(-x1+x2,-x1-x2)`, `V=x1²+x2²` (V̇=-2‖x‖²<0
everywhere → all-green bowl, verdict valid).

**Non-obvious plumbing / gotchas (don't re-break).**
- **V̇ is numeric**: `Vdot = ∂V/∂x·f` via central differences (h=1e-4·(1+‖x‖)). No symbolic diff.
- **Surface is translucent, drawn back-to-front** (`quads.sort((p,q)=>q.d-p.d)`, alpha≈0.62·shade) so the floor
  vector field + xy-trajectory show THROUGH it. Draw order: floor tint quads (coplanar, no sort) → vector field →
  floor trajectory shadows (dashed) → translucent surface quads (sorted) → surface trajectories → equilibrium →
  IC crosshair / time marker. Floor quads are coplanar at w=0 so they need no depth sort.
- **Static/dynamic split for playback**: `renderLeft()` draws the whole static scene then snapshots it into an
  offscreen `leftCache`; during playback `paintLeftMarker()` just blits the cache + draws the moving ball — so a
  ~1800-quad scene isn't re-sorted every frame. ANY static change must set `leftCache=null` before re-rendering
  (all the handlers do this). The right V(t) plot is cheap enough to fully redraw each frame.
- **View presets** (`VIEWS`): iso {az:-0.62,el:0.52}; top {az:0,el:1.5563≈89°}; xz {az:0,el:0.055 edge-on};
  yz {az:-1.5708,el:0.055}. `setView` tweens az/el (smoothstep, 380ms) AND toggles the seg button. **Click-to-set-IC
  is disabled when el≤0.22** (edge-on views make `floorPick` — which divides by se — degenerate); it tells the user
  to switch to Iso/Overhead. Height model `heightOf(V)=clamp(V/scale,-capR,capR)·HZ` with scale=75th-pctile |V|,
  capR=5.5, HZ=0.36.
- **`trajAt(tr,t)`** binary-searches the stored samples and linearly interpolates {x1,x2,V,Vd} — used by the marker,
  readouts, and the tangent. (Watch: the `(cond?a:b)=m` ternary-lvalue is NOT valid JS — it must be
  `if(cond)a=m; else b=m;`; that was the one syntax bug caught by `node --check`.)
- Number-entry fields use `.nospin`; Greek/labels wrapped in `.lc`. Same house conventions as siblings.

**Verified this session** (scratchpad, reusable): `node --check` clean; **17/17 logic asserts** (`test_lyap.mjs` —
numeric V̇ vs analytic for the spiral/pendulum, V monotonically decreasing + converging to 0 along the stable
run, indefinite-V̇ saddle signs, unstable-node V-growth, blow-up guard bounds the array). Headless-Chrome
(Chrome.app `--headless=new`, error-catcher + RESULT-div probe): **no JS errors**; default → verdict all-green
"✓ valid", a run gives V 9.25→0 (monotone), scrub at t=6 reads V≈5.7e-5/V̇≈-1.1e-4, view toggle → 'top', 2nd run
persists (2 traces), `V=x1` → verdict "not positive-definite" (box red). Screenshot confirms the translucent green
bowl with the vector field showing through, the lifted trajectory, and the V(t) plot + tangent.

**Layout/polish refinements (this session, after the initial build).**
- Top restructured for minimal vertical space: a `.sysgrid` (`1fr 300px`) with the three definitions stacked as
  `.eqrow`s (`ẋ₁ =`, `ẋ₂ =`, `V(x) =` — label + inline input) on the LEFT and the **Lyapunov-check box on the
  RIGHT**, so the function definitions and the plots are visible together. Controls collapsed to one wrapping row.
- **V-axis (z) is now user-settable**: `V min (z)`/`V max (z)` fields drive `zRange`; `heightOf` maps V linearly
  onto `[zRange.min,zRange.max]→[0,ZSPAN=1.75]` (clamped [-0.12,1.1]). Auto range = [min(0, 2nd-pctile V),
  96th-pctile V] (set in `onModelChange` when `zRange.auto`, shown via `syncZFields`); typing both fields switches
  to manual, clearing/!valid reverts to auto. This REPLACED the old `mesh.scale/capR/HZ` height model. `drawAxes`
  now draws a labelled vertical V-axis with ticks at the back-most base corner (`heightOf`-positioned).
- **V̇/ẋ typesetting**: the combining overdot (U+0307) drifts in the sans body/notes but renders fine in mono, so
  all sans-context `V̇`/`ẋ` are wrapped in `<span class="mono">` (footer, header sub, card notes). The mono
  readouts/legend/verdict were already fine.
- View-toggle labels shortened to `x-z` / `y-z`; the `Reset view` button is full-size (dropped `.mini`).

### Status: Nyquist Stability Explorer is DONE + verified — NOT committed (was NEWEST; see above).
- Files: `demos/nyquist/index.html` (self-contained single file) and its landing-page card in `index.html`
  (added, right after the Two-Compartment Drug Delivery card). Roadmap checkbox above ticked. Live target once
  pushed: `https://danielbruder.com/me461-demos/demos/nyquist/`. Still uncommitted with all prior work; standing
  rule unchanged (commit/push only when asked; verify git state first — working dir may not be git root).

**Design decisions the user chose** (asked up front via multiple-choice, all "recommended" picks):
- **L(s) input = free expression** in `s` and `k` (reuses the Laplace demo's recursive-descent parser, with
  `s`→`svar`, `k`→`kparam`). Two uses of the AST: `evalL(node,s,kv)` (complex evaluator, drives every plot) and
  `buildRational(node,kv)` (expands to numeric num(s)/den(s) polynomials with k substituted → poles/zeros via a
  hand-rolled root finder). Non-rational input (e.g. `exp(-s)`) throws `NONRAT` → flagged, no poles/zeros.
- **k slider** (user-set min/max): k may appear anywhere in L(s); as k moves, EVERYTHING recomputes live and the
  **−1 point stays fixed** so you watch it gain/lose encirclements. `rebuild(false)` on k-change keeps the two
  plane views fixed (only expr-change / Fit re-autoscales) — that's the whole pedagogy, do NOT re-fit on k.
- **Full stability readout** Z = N + P with STABLE/UNSTABLE verdict + gain/phase margins (from the Bode curves).
- **Bode cursor hides off the +jω segment** — the Bode marker only shows while the contour cursor is on `posjw`.

**What it is.** Top card: L(s) box + k slider (with min/max/exact-k boxes) + live poles(×)/zeros(○) list on the
left; **Bode plot of L(jω)** (stacked |L| dB / ∠L deg, log-ω, 0 dB & −180° reference lines) on the right. Cursor
card: **Trace** (play/pause) + ⟲ + speed slider (log₂, same pattern as siblings) + readouts (segment, s, L(s),
|L|·∠L, 1+L). Then a 2-col grid: (left) **s-plane D-contour**, (right) **Nyquist plot**. Bottom: stability strip
(P, N, Z, verdict, GM, PM) + a marginal-stability note.

**The D-contour** (`buildContour`) is one CLOCKWISE closed loop, point list tagged by segment `type`:
`negjw`(cyan) up from −jR through the origin region, `posjw`(maize) up to +jR, then the `arc`(dotted gray) from
θ=+π/2 down to −π/2 through +Re. **jω-axis poles get a small rightward semicircular `indent`** (dotted violet,
radius ρ=clamp(0.04R, …, 0.4·minGap)) that bulges into the RHP so the pole stays OUTSIDE (excluded from P).
Clockwise = up the whole jω axis then arc down through the RHP (verified, see below). Arc radius / axis extent
**R = max(6, 1.8·max|pole|,|zero|,closed-loop pole|)** — depends on the CLOSED-loop poles (roots of den+num) so
the contour always encloses them ⇒ the encirclement count stays correct even at large k. Axis sampling is
log-clustered near ω≈0 plus extra points around each corner freq (magnitudes of poles/zeros).

**Non-obvious plumbing / gotchas (don't re-break).**
- **Winding sign.** `windingNumber` sums Δarg of (L+1) around the closed contour with **adaptive subdivision in s**
  (re-eval L at chord midpoints when a step turns >0.7 rad) → CCW turns; **N = −round(CCW)** = clockwise
  encirclements of −1; **Z = N + P**, P = open-loop poles with Re>tol (indented jω poles NOT counted). The sign
  was VERIFIED in the logic test against the ground-truth closed-loop RHP pole count (roots of den+num) across
  k∈{1,2,4,6,8,10,20} for `k/(s(s+1)(s+2))` (stable k<6 → N=0/Z=0; k>6 → N=2/Z=2). If ever "flipped", negate N.
- **Pole/zero cancellation.** `cancelCommon` removes matched pole/zero pairs (tol ∝ scale) before counting P /
  drawing markers, so e.g. `k(s−1)/((s−1)(s+2))` correctly shows P=0 (no spurious RHP pole). `evalL` uses the raw
  expression, so it stays consistent (the common factor cancels numerically off the contour).
- **Cursor = a single index `ci` into `contour.pts`** — the ONE source of truth. Dragging on the D-plane picks the
  nearest contour point; on the Nyquist plane the nearest `Lpts` point; on the Bode plane the nearest `posjw` point
  by log-ω. Trace advances a fraction `frac` (frac·n→ci) at 0.12·speedMul loops/s; `dragging` flag pauses it.
- **Bode phase dot** reads the UNWRAPPED `bode.ph[]` array (via `nearestPh`), NOT `carg(L)` — the curve is unwrapped
  so a raw wrapped angle would sit 360° off.
- **Rendering is cheap enough to full-redraw each trace frame**: the contour/Nyquist are drawn as **runs batched by
  segment type** (`drawRuns` — one stroke per contiguous same-type run, dotted for indent/arc), ~4–6 strokes each,
  so no offscreen caching is needed. `Lpts` (L at every contour point) is cached at rebuild, not per frame.
- Greek/subscripts (σ, ω, L(s), y_d-style) inside uppercased `.card h2`/`.k`/`.lbl` are wrapped in
  `.lc{text-transform:none}` — same finding as the sibling demos. s-entry number fields use `.nospin`.
- **Cursor readout tiles are FIXED WIDTH** (`.curros .ro{flex:0 0 172px;width:172px;overflow:hidden}` +
  `.v{white-space:nowrap;overflow:hidden}`). Before this they were `.ros` flex tiles that grew with the value,
  so a wide number would push the row over its width and momentarily wrap to a new line during a trace — a
  reported bug. The cursor values (s, L(s), |L|·∠L, 1+L) print with **2 decimals** via `fmt2n`/`fmtC2`
  (exponential fallback only for |v|≥1000 or <0.01 → width stays bounded); the poles/zeros list still uses the
  3-decimal `fmt3`. Segment labels were shortened (`indentation`, `∞-arc`) so the segment tile fits 172px.

**Verified this session** (scratchpad, reusable): `node --check` clean on the extracted script; **31/31 logic
asserts** (`test_logic.mjs` — evalL, rational expansion coeffs, Durand-Kerner roots, canonical N/Z across k vs
closed-loop RHP count, RHP-pole P=1, cancellation, non-rational rejection, contour has all 4 segment types +
origin indent bulges into RHP + starts at −jR, GM/PM signs). Headless-Chrome (Chrome.app `--headless=new
--dump-dom`, error catcher + a RESULT-div probe): **no JS errors**, all three canvases draw, default k=2 →
STABLE (N=0,Z=0,GM=9.5dB,PM=32.6°), driving kBox→10 → UNSTABLE (N=2,Z=2), expr→`k/((s-1)(s+2))` → P=1,
expr→`k*exp(-s)/(s+1)` → flagged bad (no crash). Screenshots confirm the layout, color-matched segments across
all three plots, the R→∞ dotted arc, the origin indentation, and the −1 marker.

### Status: Playback-speed sliders + Reset-view buttons added — DONE + verified — NOT committed (was NEWEST; see above).
Cross-demo UX polish (two user requests), not a new system. All prior uncommitted work is still uncommitted;
standing rule unchanged (commit/push only when asked; verify git state first — working dir may not be git root).

**Request 1 — speed slider on `demos/phase-portrait/`** (students shouldn't wait out each trajectory in real
time). **Request 2 — same slider on `demos/linearization/`, plus a Reset-view button on any demo lacking one.**

**Speed slider (shared design, now in phase-portrait + linearization; drug-delivery & sum-of-exponentials
already had their own playback-speed sliders).** Log₂ mapping: the `<input type=range>` *value is the exponent*,
`speedMul = 2^value`; `min=-1` (0.5×) … `max=4` (16×), `step=0.05`, default `value=0` (**1×, so base behavior
is unchanged until touched**). `playbackDuration()` — the wall-clock animation length `clamp(T,2.5,9)` — is
**divided by `speedMul`**. Because `step(now)` re-reads `playbackDuration()` every frame and the slider is never
disabled, **speed is adjustable mid-animation**. `paintSpeed()` updates the `spdVal` readout (`16×`→`toFixed(0)`,
else `toFixed(1)`) and sets the track-fill CSS var `--fill = (value-min)/(max-min)*100 + '%'`. Markup lives in
`.btns` as a `.speed` flex column (`min-width:158px`) with a `.k` label (`Playback speed <b id=spdVal>1.0×</b>`).
In linearization `playbackDuration` was already an arrow fn → just appended `/speedMul`; in phase-portrait it's a
`function`. Both keep `let speedMul=1;` beside the other anim state.

**Reset-view button** — added to **phase-portrait** and **linearization** only. Pattern: the default phase
window(s) are frozen as immutable consts and the *live* view objects are spread-clones of them; the button does
`Object.assign(view, VIEW0)`, re-syncs the axis-entry input fields, re-renders, and sets a status line. It
**leaves traces, IC, and duration untouched**. Phase-portrait: `const VIEW0={x1min:-7,x1max:7,x2min:-5,x2max:5}`
→ `const view={...VIEW0}`. Linearization: **one shared button** resets all three windows — `VIEWL0` (nonlinear
x-space) + `VIEWR0.{xt,x}` (linear demo, per coordinate-frame) — via `Object.assign` on each, then
`syncAxisFields(); renderAll();`. (Chose a single shared button over per-panel, since the matched L/R pair shares
one IC/duration; flagged to user, who was fine with it.)

**Reset-view survey (why only those two got the button).** Checked all seven demos: **complex-exponential**
already has `Fit ⤢` + `Reset view`; **laplace** has two `Reset view` buttons (3-D surface + s-plane);
**sum-of-exponentials** has `Fit ⤢`, which frames all data (functionally a reset — its complex value plane has no
fixed default distinct from the data bbox, so a separate "Reset view" would just re-do Fit; **left as-is**, user
offered an explicit relabel if wanted). **cruise-control** (auto follow-camera; its "Reset" resets the *sim*) and
**drug-delivery** (static precomputed plots + scrubbers) have **no pannable/zoomable view to reset**. So only
phase-portrait and linearization genuinely lacked view restoration.

**Verified this session** (scratchpad, reusable): `node --check` clean on both edited files. Headless-Chrome
(Chrome.app `--headless=new --disable-gpu --timeout=8000 --virtual-time-budget=4000 --dump-dom`; the probe must
be injected **inside the same `<script>`** before `</script>` to share lexical scope with the top-level `const`s
— plain script, not a module, so they aren't on `window` — auto-run on `load` via `setTimeout`, writing results
into a `<div id=RESULT>` that `--dump-dom | grep -o 'RESULT=[^<]*'` reads back). Results, **no JS errors** both:
linearization → `defLabel 1.0× / dur1x 9s / max 16× / dur16x 0.5625s / min 0.5×`, and Reset view restored
`viewL`+`viewR.xt`+`viewR.x` and re-synced the `lx1min` field to `-1`; phase-portrait → Reset view restored the
default window and synced `x1min` to `-7`.

### Status: Two-Compartment Drug Delivery is DONE + verified — NOT committed (was NEWEST; see above).
- Files: `demos/drug-delivery/index.html` (self-contained single file) and its landing-page card in
  `index.html` (added, right after the Laplace card). Roadmap checkbox above ticked. Live target once
  pushed: `https://danielbruder.com/me461-demos/demos/drug-delivery/`.
- Still uncommitted along with all prior uncommitted work. Standing rule: commit/push only when asked;
  verify git state first (working dir may not be the git root).

**Design decisions the user chose** (asked up front via multiple-choice):
- **Plant params = reduced LTI** k₀,k₁,k₂,b₀ (eq 3.27 state-space form), edited in the top box; the
  scalar ODEs + matrix form + live open-loop poles are shown. (NOT the physical V₁,V₂,q,q₀,c₀ form.)
- **Control law sees the measured output only.** The `u` expression may reference `c2` (=y), `yd`, `t`,
  and the model constants `k0 k1 k2 b0` (for feed-forward) + Math via `with(Math)`. **c₁ is deliberately
  NOT exposed** (unmeasured). No injected e/ei/edot PID helpers — it's a plain expression. Default u=0.
- **Color scale = crimson single-hue** intensity (pale→deep), `conc2col(v)=hsl(352, 30+52v%, 96−62v%)`;
  shared by the flow-chart compartments, the colorbar, and the body+heart cartoon.

**"Real" plant ≠ displayed model (user request, 2nd pass).** The DISPLAYED equations stay the clean
linear eq (3.27). But the SIMULATED plant enforces physical limits the model omits: **u is clipped to
≥ 0** (`u=Math.max(0,u)` — an infusion pump can't push a negative rate) and **concentrations are floored
at 0** (`c[i]=Math.max(0,c[i])` after each RK4 step). Pedagogical payoff: the clip can't actively "brake"
c₂, so the real overshoot is *larger* than the linear model predicts (e.g. P+feed-forward: 12.6%→13.1%).
Recorded `ua[]` stores the clipped u, so readouts/flow-dots reflect what's actually applied.

**What it is.** Top SYSTEM card = equations + variable/param legend + editable k₀,k₁,k₂,b₀ (dual
value/indicator number inputs, no sliders) + live poles. CONTROLLER card = y_d, IC [c₁(0),c₂(0)],
duration T, the `u` expression box (**no preset chips** — 3rd pass removed the open-loop/proportional/
P+feed-forward example buttons; the box is edited by hand, default `0`),
Run + Play/Pause/⟲ + a playback-speed slider. **Run precomputes** the whole response (RK4, dt=min(.01,T/2500))
then animates playback of the stored arrays (NOT real-time sim — needed the full trace for metrics anyway;
same precompute+scrub pattern as sum-of-exponentials). ANIM row (grid `2fr 1.4fr 0.6fr` = **50/35/15%**,
widths chosen by the user): (50%) the **response card is split into two stacked plots** (class `.respcard`,
each canvas CSS `height:186px`, `drawPlot`+`drawUPlot`): TOP = c₂-vs-t with y_d dotted line, a **green ±2%
band around the steady-state value**, green `t_s` settling marker, dim full-curve + bright traced-so-far +
playhead (labeled `c₂(t)`); BOTTOM = u-vs-t, the **applied (clipped) infusion rate** in maize (labeled
`u(t)`). Both plots are draggable scrubbers (`scrubTo(cv,clientX)` shared over `[plot,uplot]`); (35%)
hand-drawn **Fig 3.18a** flow chart — V₁,V₂ circles filled by conc, u/k₀/k₁/k₂ arrows drawn as **moving
dotted lines** (3rd pass: `flowDots` now lays down **fixed ~13px-spaced dots so ≥2 are always visible** —
a dotted line — and only the *slide speed* `1.5·f` + a subtle alpha `0.30+0.70·f` encode the term flux
b₀u,k₀c₁,k₁c₁,k₂c₂ normalized by the run's peak flux `fref`; 0 flux ⇒ static faint line. **4th pass:** the
dot offset is the **time-integral of the (normalized) speed**, ∫₀ᵗ1.5·f dτ — precomputed per arrow in
`buildSim` as `S.phase.{u,k0,k1,k2}[i]` — NOT `simT·speed(simT)`. The old product could *decrease* as the
flow rate fell (e.g. u decaying to steady state), so the dots visibly ran **backward** even though every
arrow's flux is ≥0; the integral is monotonic non-decreasing ⇒ dots only advance or pause, never reverse),
crimson
**colorbar** (0..cmax); (15%) **patient body+heart cartoon** (`drawBody`
is centered H+V: unit `u=min(w/9,h/16)`, figure 8u×14.5u at cx=w/2, top=(h−14.5u)/2; the "body =
bloodstream…" caption was removed per user), body=c₁, heart=c₂, same scale. Bottom METRICS card =
**2% settling time** (per user: last exit of a ±2% band around the **STEADY-STATE / final value** `ss=c2[N]`,
not around y_d; "—" if ss≈0 so the band is degenerate — e.g. the u=0 default), **% overshoot** (still peak
beyond y_d as % of the step), steady-state c₂ + SS error. Colors auto-normalize to `cmax`=max(|y_d|,
peak c₁, peak c₂) over the run.

**Non-obvious plumbing / gotchas already handled (don't re-break).**
- **Playback index MUST stay a valid array index.** Bug found + fixed this session: `dtWall` from
  `(now-lastWall)/1000` could go **negative/NaN** (mixing `performance.now()` set in click handlers with
  the rAF `now`, or a tab-switch), driving `ph` negative → `S.c1[-15]` undefined → `.toFixed` crash that
  killed the rAF loop. Fixes: clamp `dtWall` to `[0,0.05]` (the `!(dtWall>0)` test also catches NaN) **and**
  route every playhead read through `curIdx() = clamp(round(ph)||0, 0, N)`. Keep both.
- **`.anim canvas` needs an explicit CSS `height:400px`.** With only `width:100%` + an HTML `height` attr,
  a canvas self-sizes by intrinsic aspect ratio, so the wide (2fr) plot ballooned tall and the 1fr panels
  had dead space. Pinning CSS height fixes it and keeps `fitDPR` stable (clientHeight constant).
- Greek/subscript labels: the `.card h2`/`.k`/`.lbl` `text-transform:uppercase` mangles σ, k₀, y_d, f(t) —
  wrap those in `.lc{text-transform:none}` (already applied throughout).
- `u` compiled via `new Function('c2','yd','t','k0','k1','k2','b0','with(Math){return (…);}')` — non-strict
  body so `with` is legal; smoke-tested to a finite number in `compileU`, else shows ⚠ and aborts the run.
- x-axis label sits on its own row (`padB=28`, ticks at `h-16`, "t (s)" centered at `h-3`) to avoid the
  earlier collision with the last tick.

**Verified** (scratchpad, reusable): `node --check` clean; **33/33 logic asserts** (`test_logic.mjs` —
const-infusion SS c₂=b₀U/k₀, proportional SS = K·y_d/(K+k₀/b₀) w/ nonzero error, P+feed-forward → ~0 SS
error, eigenvalues solve the char. eq, u=0⇒c₂≡0 & ts undefined & os=0, first-order settling ≈ 3.9τ,
overshoot metric, parser accept/reject incl. **c₁ rejected**, crimson-scale monotonicity, flux monotonic
in u; **2nd-pass**: negative control law clipped to u=0, all c₁/c₂/u ≥ 0 across an overshooting run, clip
engages when overshoot pushes ideal u<0, decay-to-empty stays non-negative, proportional now has a *finite*
steady-state-relative settling time whose band is around the final value not y_d). Headless-Chrome
(Chrome.app, `--headless=new`, **override rAF+performance.now to a `window.__pump(n,dt)` queue so playback
advances deterministically under virtual time** — NB the queue clock is in **ms**: pump `dt≈50` ms/frame,
not 0.033, or `dtWall=(now-lastWall)/1000` barely advances `ph`): after the 2nd pass — P+feed-forward ts 3.5 /
**os 13.1** (> the unclipped 12.6, because u≥0 can't brake) / SS 1.000; proportional **ts 4.0** (finite now) /
SS 0.889; poles recompute live on k-edit; bad expr caught; screenshot confirms the 50/35/15 layout with the
body centered + caption gone, green steady-state band, and flow-dots — **no JS errors**.
**3rd pass (this session):** response card split into stacked c₂(t)/u(t) plots, flow arrows redrawn as
moving dotted lines, preset chips removed. Re-verified: `node --check` clean, 33/33 asserts still pass, and a
headless probe drove default + P+feed-forward (playback to end: c₂→1.00, u→0.50 = k₀/b₀·y_d; ts 3.5/os 13.1/
SS 1.000) confirming both stacked canvases exist at 186 px, `exChips===0`, and **no JS errors**; screenshot
shows the dotted flow lines + the two-plot response panel.
**4th pass (this session):** fixed the reported "u-arrow dots run backwards" bug — the dot offset was
`(simT·speed)%1` with `speed=1.5·f` the *instantaneous* normalized flux, so as a flow decayed (u → steady
state) the product could *decrease* and the dotted line slid backward even though every arrow's flux is ≥0.
Replaced it with the **time-integral** `∫₀ᵗ1.5·f dτ`, precomputed per arrow in `buildSim` as
`S.phase.{u,k0,k1,k2}[i]` and read via `curIdx()` (so scrubbing stays consistent); monotonic non-decreasing
⇒ dots only advance or pause. Re-verified: `node --check` clean, 33/33 asserts still pass (no regression),
and an inline check confirmed the NEW integrated phase is monotonic (final 7.780 cycles) while the OLD
`simT·speed` formula reversed (worst step −0.0079 cycles) on the P+feed-forward run.

### Status: Laplace Transform Explorer is DONE + verified — NOT committed.
- Files: `demos/laplace/index.html` (self-contained single file) and its landing-page card in
  `index.html` (added, right after the Sum of Complex Exponentials card). Roadmap checkbox above
  ticked. Live target once pushed: `https://danielbruder.com/me461-demos/demos/laplace/`.
- Still uncommitted along with all prior uncommitted work. Standing rule: commit/push only when
  asked; verify git state first (working dir may not be the git root).

**Design decisions the user chose** (asked up front via multiple-choice):
- **F(s) engine = HYBRID.** Exact closed-form when f(t) is an *exponential polynomial* (sums/
  products of tⁿ, e^{at}, sin/cos/sinh/cosh of an affine arg) → rational F(s) with **true poles
  & exact ROC**; otherwise **numeric** ∫₀ᵀ f(t)e^{−st}dt (Simpson) with an honest "ROC-limited"
  warning + *estimated* abscissa (slope of ln|f| over the late window).
- **f(0) = readout only** (no separate IC control). **Time plot = static + draggable scrubber.**
- **Cursor s is the single source of truth**, draggable on the 3-D floor AND in the 2-D s-plane
  (linked). The F(s) ring is a *driven* indicator (inverting F is multivalued/ill-posed — flagged
  to the user). Told the user 3-D is hand-rolled (zero-dep rule bars three.js/plotly).

**What it is.** Top = editable `f(t)` box (+ EXACT/NUMERIC pill, live f(0), duration T, Rebuild).
**Layout** (revised per user): full-width **f(t) time plot** w/ scrubber on top; then a `.lgrid`
(**`1.3fr 1fr`** → right column ≈43.5%, widened per user from an earlier 2fr/1fr; kept <50%) with the
star — a **hand-rolled 3-D |F(s)| surface** (left) over s=σ+jω (height=|F|,
color=∠F via cyclic hue = "domain coloring"), draggable floor cursor + vertical line, tilt(drag)/
pan(shift-drag)/zoom(wheel), pole spikes (×), ROC tint on floor — beside a `.rcol` (right) that
**stacks** the 2-D **s-plane** inspector (top; draggable cursor, **dual manual s entry — rectangular
`s = a + bj` AND polar `= r·e^(θ j)`, kept in sync both ways via `syncCursorFields`**; those four
cursor inputs carry class `.nospin` = `appearance:textfield` + hidden webkit spin buttons so the
up/down steppers don't clutter them; its own **Reset
view** button `#resetViewS`, pole ×'s, ROC shading/boundary) over the **F(s) value plane** (bottom).
Grid stretch makes the two right cards' combined height equal the surface's. Full-width **poles & ROC**
box at the bottom. (The old redundant `s (rect)`/`s (polar)` readout tiles were removed since the manual
entry fields now show those; the poles box lists poles plainly with **no red `×` prefix**; the F(s) rect
readout has **no colour swatch**.)
- The **F(s) value plane** is a Cartesian F-plane (Re F / Im F axes + labeled gridlines that give
  the magnitudes) with a **hue-by-angle colour-wheel background** (the ∠F colour key, cached since
  it's scale-independent), the point F(s) with drop-lines to each axis; it auto-rescales (R =
  niceCeil(1.5|F|)). (Replaced an earlier phase *ring*; the ring is gone.)
- Height clip: model height = min(|F|/scaleZ, capR)·HZ with **scaleZ = 72nd-pct of grid |F|,
  capR=6, HZ=0.30** → poles tower as tall spikes clipped at |F| = capR·scaleZ (shown in the status).
  (User asked for taller poles; raised from capR=2.4.)

**Non-obvious plumbing.**
- Symbolic core = an **exponential-polynomial algebra**: f is reduced to a sum of atoms
  `c·tⁿ·e^{pt}` (c,p complex; n≥0). Closed under +,−,×, and under exp/sin/cos/sinh/cosh of an
  **affine** argument a₀+a₁t (Euler expands sin/cos into e^{±j·}). `2^t` / `e^(at)` handled via
  base^exp = exp(exp·ln base). Laplace{c tⁿ e^{pt}} = c·n!/(s−p)^{n+1} → poles = distinct p
  (mult = max n+1), σ_a = max Re(p). Anything outside the class throws `SYMFAIL` → numeric.
- One recursive-descent **parser** builds an AST used two ways: `toExpPoly` (symbolic) and
  `evalNum` (complex AST walker, used for the time plot in BOTH modes and for numeric f_k). Supports
  implicit multiplication (`3t`, `e^(-0.5t)cos(3t)`), `t e pi j/i`, `^` right-assoc.
- 3-D is **orthographic** (az about vertical, el tilt); painter's algorithm sorts ~2100 quads by
  depth each redraw; the floor plane (w=0) map is affine so screen→(σ,ω) picking inverts cleanly
  (elevation clamped ≥ ~0.09 rad to stay non-singular). Height = min(|F|/scaleZ, capR)·HZ with
  scaleZ = 72nd-percentile of grid |F| (poles clip to flat-topped mesas). No rAF loop — redraw on
  interaction only. Reuses the siblings' `actual/D2P/P2D/drawGrid/niceStep` equal-aspect machinery.

**Verified this session** (scratchpad, reusable): `node --check` clean; **26/26 logic asserts**
(`test_logic.mjs` — L{1},{t},{t²},{e^{at}},{cos},{sin},{e^{at}cos},{t e^{-t}},{sinh}, linearity,
poles/ROC, `2^t`→1/(s−ln2), SYMFAIL for 1/(t+1)/tan/sqrt/log, parser rejections, implicit-mult,
and a crude numeric ∫ cross-check). Headless-Chrome (Chrome.app, no puppeteer, `--headless=new
--screenshot`; **run ONE launch per Bash call with `--timeout=8000` — three sequential launches in
one call hung**): default (exact e^{-0.5t}cos3t) renders the twin resonance peaks at −0.5±3j with
F(0.5+1.5j)=0.177+0.125j (hand-checked ✓); a synchronous probe drove rotate/pan/zoom/setS/scrub +
mode switches with **no JS errors**, and numeric 1/(t+1) gave F(2)=0.3613 = e²E₁(2) ✓.

**Known gotchas already handled (don't re-break):** σ/ω are uppercased by the `.card h2` / `.lbl`
`text-transform` → wrap them (and the `f(t)` label) in `.lc{text-transform:none}` — that's why the
surface title reads "σ + jω" and the input label reads "f(t)". The F-plane hue wheel is cached by
canvas size (`fwKey`) and blitted each redraw. Landing the cursor exactly on a pole gives |F|=∞/NaN
— handled gracefully (no F-plane dot, readout shows ∞, surface height clamps to the cap).
(An earlier phase-*ring* version had a sign-flipped angle-label bug; the ring was later replaced by
the Cartesian F-plane, so that's moot now.)
- **s-plane / F-plane canvases MUST use `flex:1 1 0` (basis 0), not `flex:1 1 auto`.** They have no
  fixed CSS height and `fitDPR` sets their `height` *attribute* from `clientHeight·dpr` on every
  redraw; with `flex-basis:auto` that attribute feeds back into the flex base size, so each
  cursor-drag redraw grew the s-plane taller (a reported bug). Basis 0 makes the flex row (`.rcol`
  grid `1fr 1fr`) the sole height source → stable. Verified: 60 `setS` calls leave `clientHeight`
  pinned at 177px.

### Status: Sum of Complex Exponentials is DONE + verified — NOT committed.
- Files: `demos/sum-of-exponentials/index.html` (self-contained single file) and its
  landing-page card in `index.html` (added, right after the Complex Exponential card).
  Roadmap checkbox above is ticked. Live target once pushed:
  `https://danielbruder.com/me461-demos/demos/sum-of-exponentials/`.
- Still uncommitted along with all the prior uncommitted work (Complex Exponential,
  Linearization, index.html cards, this CLAUDE.md). Standing rule: commit/push only when
  asked; verify git state first (working dir may not be the git root).

**What it is.** Top = an editable expression `f(t) = Σ cₖ e^{sₖ t}`; each term is two
complex-number text boxes (coefficient cₖ, exponent sₖ) with a colour chip, an **+ Add term**
button (cap 8), and a per-row ✕ remove (min 1). A **Run** button (re)builds the sim; **▶/❚❚**,
**⟲ restart**, and a **speed** slider drive playback; **Duration** sets the horizon. Default =
two conjugate terms `0.5 e^{2jt} + 0.5 e^{-2jt}` = the real signal cos 2t.
- **Left panel = the complex value plane** (NOT the s-plane — the user said "s-plane" but the
  vectors are *values* cₖe^{sₖt}, not poles, so labelling it s-plane would be a math error;
  it's labelled "Complex plane" with a header note). Phasors chain **tip-to-tail** from the
  origin (running partial sums); the last tip = f(t), a glowing dot that traces the curve.
  Full tip-path drawn dim, traced-so-far bright. Pan/drag, wheel-zoom, **Fit ⤢** (frames the
  precomputed bbox of all partial sums).
- **Right panel = Re & Im of f(t) vs t**, with a dashed playhead + value dots; **click/drag
  to scrub** (pauses). y-range capped at 4× the early-window peak (same trick as the sibling
  demos) so a growing sum's blow-up clips instead of crushing early detail.

**Non-obvious plumbing.** f(t) is sampled **analytically** (`termVal = Cmul(c, e^{st})`, no
ODE). `buildSim()` samples N=1500 pts over [0,T], accumulating each partial sum to grow the
bbox (captures every vector joint, not just the tip). `parseComplex()` accepts `3`, `-2.5`,
`.5`, `2j`/`2i`, `j`, `-j`, `1+2j`, `3 - 4i`, `2j+1` (regex-validated per signed chunk;
rejects junk → red field + disabled Run). Reuses the sibling's equal-aspect `actual()`/`D2P`
canvas machinery. Two cached static layers (grid+dim-trace ; grid+Re/Im curves) blitted each
frame with only the moving chain / playhead redrawn — same architecture as complex-exponential.
Term colours by row index (`TERM_COLORS[i]`), so chip ↔ vector always match; editing a field
marks the Run button `.dirty` (maize pulse) until re-run.

**Verified this session** (scratchpad): `node --check` clean; 22/22 logic asserts
(`test_logic.mjs` — parser cases incl. rejections, default sum ≡ cos 2t with Im≡0, growing-term
magnitude e^5); headless-Chrome (Chrome.app, no puppeteer, `--headless=new` + DOM-driving probe
+ `--screenshot`/`--dump-dom`) → no JS errors, default renders the counter-rotating "roof" with
tip on the real axis, and a driven 4-harmonic case renders the epicycle chain + complex Re/Im.

### Status: Complex Exponential Explorer is DONE + verified — NOT committed.
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
