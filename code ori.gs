/**
 * Dashboard Progres SE2026 BPS Kepahiang
 * Google Apps Script - Code.gs
 */

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Dashboard Progres SE2026 BPS Kepahiang')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Mengambil data dari sheet aktif dengan nama "Progres" atau fallback ke sheet pertama
 */
function getSheetData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Progres") || ss.getSheets()[0];
    var data = sheet.getDataRange().getValues();
    
    if (data.length < 2) {
      return { success: false, message: "Sheet kosong atau format data tidak sesuai." };
    }
    
    var headers = data[0].map(function(h) { return h.toString().trim().toUpperCase(); });
    
    // Pencarian kolom dinamis berdasarkan Header
    var idxEmailPml = headers.indexOf("EMAIL PML");
    var idxEmailPpl = headers.indexOf("EMAIL PPL");
    var idxPml = headers.indexOf("PML");
    var idxPpl = headers.indexOf("PPL");
    var idxWilayah = headers.indexOf("DESA - SLS - SUB SLS");
    var idxTotalAlokasi = headers.indexOf("TOTAL ASSIGNMENT [SAAT ALOKASI]");
    var idxTotalSekarang = headers.indexOf("TOTAL ASSIGNMENT [SEKARANG]");
    var idxOpen = headers.indexOf("OPEN");
    var idxDraft = headers.indexOf("DRAFT");
    var idxSubmittedPencacah = headers.indexOf("SUBMITTED BY PENCACAH");
    var idxSubmittedRespondent = headers.indexOf("SUBMITTED RESPONDENT");
    var idxApproved = headers.indexOf("APPROVED BY PENGAWAS");
    var idxRejected = headers.indexOf("REJECTED BY PENGAWAS");
    var idxProgres = headers.indexOf("PROGRES SLS");

    // Fallback jika ada perbedaan penamaan kolom kecil
    if (idxEmailPml === -1) idxEmailPml = 6;  // Col G
    if (idxEmailPpl === -1) idxEmailPpl = 7;  // Col H
    if (idxPml === -1) idxPml = 8;            // Col I
    if (idxPpl === -1) idxPpl = 9;            // Col J
    if (idxWilayah === -1) idxWilayah = 10;   // Col K
    if (idxTotalAlokasi === -1) idxTotalAlokasi = 11; // Col L
    if (idxTotalSekarang === -1) idxTotalSekarang = 12; // Col M
    if (idxOpen === -1) idxOpen = 13;         // Col N
    if (idxDraft === -1) idxDraft = 14;       // Col O
    if (idxSubmittedPencacah === -1) idxSubmittedPencacah = 15; // Col P
    if (idxSubmittedRespondent === -1) idxSubmittedRespondent = 16; // Col Q
    if (idxApproved === -1) idxApproved = 17;   // Col R
    if (idxRejected === -1) idxRejected = 18;   // Col S
    if (idxProgres === -1) idxProgres = 19;     // Col T

    var rows = [];
    for (var i = 1; i < data.length; i++) {
      var r = data[i];
      // Lewati baris kosong
      if (!r[idxEmailPpl] && !r[idxPpl] && !r[idxWilayah]) continue;
      
      rows.push({
        emailPml: (r[idxEmailPml] || "").toString().trim().toLowerCase(),
        emailPpl: (r[idxEmailPpl] || "").toString().trim().toLowerCase(),
        pmlName: (r[idxPml] || "").toString().trim(),
        pplName: (r[idxPpl] || "").toString().trim(),
        wilayah: (r[idxWilayah] || "").toString().trim(),
        totalAlokasi: Number(r[idxTotalAlokasi]) || 0,
        totalSekarang: Number(r[idxTotalSekarang]) || 0,
        open: Number(r[idxOpen]) || 0,
        draft: Number(r[idxDraft]) || 0,
        submittedPencacah: Number(r[idxSubmittedPencacah]) || 0,
        submittedRespondent: Number(r[idxSubmittedRespondent]) || 0,
        approved: Number(r[idxApproved]) || 0,
        rejected: Number(r[idxRejected]) || 0,
        progresSls: Number(r[idxProgres]) || 0
      });
    }
    
    return { success: true, data: rows };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}