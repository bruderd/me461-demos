/* ============================================================================
   Rocket-Lander leaderboard backend — Google Apps Script Web App.
   See SETUP.md for step-by-step deployment. Paste this whole file into the
   Apps Script editor, fill in the CONFIG below, then Deploy → Web app.

   Endpoints (both same URL):
     GET   -> returns the sorted leaderboard as JSON (no emails exposed)
     POST  -> body = JSON {name, email, score, landed, lang, trials, code, ts}
              upserts by email keeping the BEST score, sorts the sheet, and
              archives the submitted code to a Google Doc. Returns {ok, rank}.
   ============================================================================ */

/* ----------------------------- CONFIG ------------------------------------- */
const SHEET_NAME = 'Leaderboard';

// If you create the script from INSIDE the Sheet (Extensions → Apps Script),
// leave SPREADSHEET_ID = '' to use that bound spreadsheet. For a STANDALONE
// script, paste the spreadsheet's ID (from its URL) here instead.
const SPREADSHEET_ID = '';

// Paste a Google Doc's ID here to archive every submitted controller into it.
// Leave '' to skip code archiving. (The Doc ID is the long token in its URL.)
const DOC_ID = '';
/* -------------------------------------------------------------------------- */


function ss_() {
  return SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID)
                        : SpreadsheetApp.getActiveSpreadsheet();
}
function sheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['timestamp', 'name', 'email', 'score', 'landed', 'lang', 'trials']);
    sh.getRange(1, 1, 1, 7).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}
function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}
function readBoard_() {
  const sh = sheet_(), last = sh.getLastRow();
  if (last < 2) return [];
  const vals = sh.getRange(2, 1, last - 1, 7).getValues();
  const rows = vals.map(v => ({
    ts: v[0] instanceof Date ? v[0].toISOString() : String(v[0]),
    name: v[1], email: String(v[2]).toLowerCase(),
    score: Number(v[3]) || 0, landed: v[4], lang: v[5]
  }));
  rows.sort((a, b) => b.score - a.score);
  return rows;
}

/* ------------------------------- GET -------------------------------------- */
function doGet(e) {
  // Public leaderboard: names + scores only, emails withheld.
  const board = readBoard_().map(r => ({
    name: r.name, score: r.score, landed: r.landed, ts: r.ts, lang: r.lang
  }));
  return jsonOut_({ ok: true, leaderboard: board });
}

/* ------------------------------- POST ------------------------------------- */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(20000); }
  catch (err) { return jsonOut_({ ok: false, error: 'server busy, please retry' }); }

  try {
    const data = JSON.parse(e.postData.contents);
    const name   = String(data.name  || '').trim().slice(0, 80);
    const email  = String(data.email || '').trim().toLowerCase();
    const score  = Number(data.score);
    const landed = Number(data.landed) || 0;
    const lang   = String(data.lang || '').slice(0, 12);
    const trials = JSON.stringify(data.trials || []);
    const code   = String(data.code || '');

    if (!name) return jsonOut_({ ok: false, error: 'name required' });
    if (!/^[^\s@]+@([\w-]+\.)*umich\.edu$/.test(email))
      return jsonOut_({ ok: false, error: 'a valid @umich.edu email is required' });
    if (!isFinite(score)) return jsonOut_({ ok: false, error: 'score is not a number' });

    const sh = sheet_(), last = sh.getLastRow(), ts = new Date();
    const emails = last >= 2
      ? sh.getRange(2, 3, last - 1, 1).getValues().map(r => String(r[0]).toLowerCase())
      : [];
    const idx = emails.indexOf(email);   // 0-based within data rows

    let updated = true;
    if (idx < 0) {
      sh.appendRow([ts, name, email, score, landed, lang, trials]);
    } else {
      const row = idx + 2, existing = Number(sh.getRange(row, 4).getValue()) || 0;
      if (score > existing) sh.getRange(row, 1, 1, 7).setValues([[ts, name, email, score, landed, lang, trials]]);
      else updated = false;   // keep the better existing score
    }

    // keep the sheet sorted best-first
    const l2 = sh.getLastRow();
    if (l2 >= 3) sh.getRange(2, 1, l2 - 1, 7).sort({ column: 4, ascending: false });

    // archive the submitted controller (every submission, for auditing)
    if (DOC_ID) {
      try {
        const doc = DocumentApp.openById(DOC_ID), body = doc.getBody();
        body.appendParagraph(name + '  <' + email + '>  —  ' + score.toFixed(1) +
                             ' pts  (' + landed + '/10, ' + lang + ')  ' + ts.toISOString())
            .setHeading(DocumentApp.ParagraphHeading.HEADING2);
        const p = body.appendParagraph(code);
        p.setFontFamily('Courier New'); p.setFontSize(9);
        body.appendHorizontalRule();
        doc.saveAndClose();
      } catch (docErr) { /* never fail the submission just because the Doc hiccuped */ }
    }

    const board = readBoard_();
    const me = board.find(r => r.email === email);
    const rank = board.findIndex(r => r.email === email) + 1;
    return jsonOut_({ ok: true, rank: rank, best: me ? me.score : score, improved: updated });

  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* --------- Optional: run once from the editor to authorize + self-test ----- */
function _selftest() {
  const fake = { postData: { contents: JSON.stringify({
    name: 'Test Student', email: 'test@umich.edu', score: 512.3, landed: 6,
    lang: 'js', trials: [90,90,90,90,90,0,62,0,0,0], code: '// hello', ts: new Date().toISOString()
  }) } };
  Logger.log(doPost(fake).getContent());
  Logger.log(doGet({}).getContent());
}
