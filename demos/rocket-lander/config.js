/* ============================================================================
   Rocket-Lander configuration — EDIT THIS ONE FILE after deploying the backend.
   Both index.html (landing/leaderboard) and play.html (the simulator) read it.
   ============================================================================ */
window.ROCKET_CONFIG = {
  // Paste the Google Apps Script Web-App URL here after you deploy it
  // (see SETUP.md). Leave "" to run fully offline: the simulator still works,
  // and the leaderboard falls back to this browser's local storage.
  leaderboardUrl: "https://script.google.com/a/macros/umich.edu/s/AKfycbwWr2r7zeB_Ql9P09sSGukricCxJMyWD-GKRvHNCQ4gwu78vR0vYgVv5W-54-JkDoyP6g/exec",

  // Course label shown in the header.
  course: "MECHENG 461",

  // Pyodide (in-browser Python) distribution. Only fetched when a student
  // switches the controller language to Python. Pin to a version you trust.
  pyodideUrl: "https://cdn.jsdelivr.net/pyodide/v314.0.3/full/",
};
