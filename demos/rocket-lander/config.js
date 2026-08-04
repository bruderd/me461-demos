/* ============================================================================
   Rocket-Lander configuration — EDIT THIS ONE FILE after deploying the backend.
   Both index.html (landing/leaderboard) and play.html (the simulator) read it.
   ============================================================================ */
window.ROCKET_CONFIG = {
  // Paste the Google Apps Script Web-App URL here after you deploy it
  // (see SETUP.md). Leave "" to run fully offline: the simulator still works,
  // and the leaderboard falls back to this browser's local storage.
  leaderboardUrl: "",

  // Course label shown in the header.
  course: "MECHENG 461",

  // Pyodide (in-browser Python) distribution. Only fetched when a student
  // switches the controller language to Python. Pin to a version you trust.
  pyodideUrl: "https://cdn.jsdelivr.net/pyodide/v314.0.3/full/",
};
