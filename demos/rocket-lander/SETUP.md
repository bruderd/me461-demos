# Rocket Lander — leaderboard setup

The simulator (`play.html`) and briefing page (`index.html`) work **immediately with
no backend** — the demo runs fully client-side, and if no leaderboard is configured,
submitted scores are saved to the student's own browser (`localStorage`). Follow the
steps below only when you want a **shared, class-wide leaderboard** and an archive of
every submitted controller.

Everything here is serverless from your side: a Google Apps Script Web App reads/writes
a Google Sheet (the leaderboard) and a Google Doc (the code archive). No server to run,
free, and you own the data.

---

## What you get

- **Leaderboard** in a Google Sheet, sorted best-first, **one row per student**
  (keyed by `@umich.edu` email; only a student's *best* score is kept — resubmitting a
  lower score changes nothing).
- **Code archive** in a Google Doc: every submission appends a section with the
  student's name, email, score, and their full controller code (auditable).
- The briefing page shows the live leaderboard (names + scores only — emails are never
  exposed publicly).

---

## Steps (~10 minutes, one time)

1. **Create the Sheet.** In Google Drive → New → Google Sheets. Name it e.g.
   "ME461 Rocket Leaderboard". (You don't need to add headers — the script does.)

2. **Create the Doc** (optional, for the code archive). New → Google Docs, name it e.g.
   "ME461 Rocket Submissions". Copy its **ID** from the URL:
   `https://docs.google.com/document/d/`**`THIS_LONG_TOKEN`**`/edit`.

3. **Open Apps Script bound to the Sheet.** In the Sheet: **Extensions → Apps Script**.
   Delete the starter `Code.gs` contents and paste the entire contents of
   [`apps-script.gs`](apps-script.gs).

4. **Fill in CONFIG** at the top of the script:
   - Leave `SPREADSHEET_ID = ''` (the script is bound to your Sheet).
   - Set `DOC_ID = '...'` to the Doc ID from step 2 (or leave `''` to skip archiving).

5. **Authorize + smoke-test (recommended).** In the Apps Script editor, pick the
   `_selftest` function in the toolbar and click **Run**. Approve the permission prompts
   (it needs access to your Sheet/Doc). Check the Sheet now has a "Test Student" row and
   the Doc has a section. Delete the test row afterward if you like.

6. **Deploy as a Web App.** Click **Deploy → New deployment** → gear icon → **Web app**.
   Set:
   - **Execute as:** *Me*
   - **Who has access:** *Anyone*  ← required so students' browsers can post/read
   Click **Deploy** and copy the **Web app URL** (ends in `/exec`).

7. **Wire it up.** Open [`config.js`](config.js) in this folder and set:
   ```js
   leaderboardUrl: "https://script.google.com/macros/s/XXXXXXXX/exec",
   ```
   Commit/push. The briefing page will now show the live board and the workbench's
   **Submit score** button will post to it.

8. **Verify.** Open the briefing page — the leaderboard pill should read **live**. Open
   the workbench, run a test, and submit a score; refresh the board to see it appear.

---

## Updating the script later

If you edit `apps-script.gs` after deploying, you must **Deploy → Manage deployments →
edit → New version** for the changes to take effect. (The `/exec` URL stays the same.)

---

## Notes & options

- **Honor system.** Scores are computed in the student's browser, so a determined
  student could POST a fabricated number. That's normal for an in-class leaderboard; the
  Doc archive lets you spot-check the top entries' code. If you need it airtight, grade
  the archived controllers yourself, or move to a server that re-runs the simulation.

- **Privacy.** Emails are stored in the Sheet (so you can identify students and dedupe)
  but the public `GET` endpoint and the briefing page **never expose them** — only names,
  scores, and dates.

- **CORS.** The front end POSTs with `Content-Type: text/plain` on purpose — that keeps
  it a "simple" cross-origin request so Apps Script (which can't answer CORS preflight)
  responds cleanly. Don't change it to `application/json`.

- **Resetting between terms.** Just clear the Sheet's data rows (keep the header) and,
  if you want, start a fresh Doc.

- **Real Docs "tabs" instead of sections.** The archive appends a *section* per
  submission, which is robust across Apps Script versions. Google Docs now also supports
  first-class **tabs**; if you prefer one tab per student you can adapt the `DOC_ID`
  block using `DocumentApp`'s tab API, but sections need no special handling and keep all
  submissions in chronological order.

- **No Google account / different stack?** The demo also works against any endpoint that
  accepts the same JSON `POST` and returns `{ok:true, leaderboard:[...]}` on `GET`
  (e.g., a Cloudflare Worker + KV, or Firebase). Only `config.js` needs the URL.
