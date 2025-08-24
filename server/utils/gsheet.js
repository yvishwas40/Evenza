// server/utils/gsheet.js
const SHEET_URL = process.env.APPS_SCRIPT_SHEETS_WEBAPP_URL;

// Push new registration data into Google Sheets
export async function syncToGoogleSheets(data) {
  try {
    if (!SHEET_URL) {
      console.warn("⚠️ No Google Sheets URL configured. Skipping sync.");
      return { success: false, error: "No SHEET_URL" };
    }

    const res = await fetch(SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return await res.json();
  } catch (err) {
    console.error("❌ Google Sheets logging failed:", err);
    return { success: false, error: err.message };
  }
}

// Dummy setup function (placeholder for initialization if needed)
export function setupGoogleSheet() {
  console.log("📑 Google Sheets setup called (no-op).");
  return true;
}

// Dummy fetch function (real data fetch requires advanced Apps Script endpoint)
export async function getSheetData() {
  console.log("📑 getSheetData called. Returning empty array (placeholder).");
  return [];
}
