/***** KONFIGURASI *****/
const ADMIN_ID = "admin1";
const ADMIN_PASS = "admin123";
const ADMIN_NAME = "Administrator";
const SHEET_KARYAWAN = "Karyawan";
const SHEET_ABSENSI = "Absensi";
const SHEET_LOGPASS = "LogPassword";

/***** UTAMA *****/
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_KARYAWAN);
  const data = sheet.getDataRange().getValues();
  const result = [];

  // Tambahkan admin hardcode
  result.push({
    id: ADMIN_ID,
    name: ADMIN_NAME,
    password: ADMIN_PASS,
    role: "admin"
  });

  // Tambahkan semua karyawan dari Sheet
  for (let i = 1; i < data.length; i++) {
    result.push({
      id: String(data[i][0]).trim(),
      name: String(data[i][1]).trim(),
      password: String(data[i][2]).trim(),
      role: String(data[i][3] || "user").toLowerCase()
    });
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    // Update password
    if (payload.action === "updatePassword") {
      return updatePassword(payload);
    }

    // Simpan absensi (Finger In/Out)
    return saveAttendance(payload);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/***** SIMPAN ABSENSI *****/
function saveAttendance(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ABSENSI);
  sheet.appendRow([
    new Date(),
    data.userId,
    data.name,
    data.type, // in / out
    data.date,
    data.time,
    data.shift || ""
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/***** UPDATE PASSWORD + LOG *****/
function updatePassword(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_KARYAWAN);
  const logSheet = ss.getSheetByName(SHEET_LOGPASS);

  let updated = false;

  // Admin hardcode → hanya ubah di kode, tidak di Sheet
  if (data.id === ADMIN_ID) {
    logSheet.appendRow([new Date(), data.id, "ADMIN HARDCODE", data.password, data.changedBy || ""]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true, note: "Password admin hardcode diubah di kode" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Cari di sheet karyawan
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === data.id) {
      sheet.getRange(i + 1, 3).setValue(data.password); // kolom password (C)
      updated = true;
      break;
    }
  }

  if (updated) {
    logSheet.appendRow([new Date(), data.id, "GANTI PASSWORD", data.password, data.changedBy || ""]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } else {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "User tidak ditemukan" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
