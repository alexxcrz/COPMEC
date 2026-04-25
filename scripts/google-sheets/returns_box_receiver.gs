function doGet(e) {
  var sheetName = 'Escaneos';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  var pallet = String((e.parameter.pallet || '')).trim();
  var flow = String((e.parameter.flow || '')).trim();
  var reviewer = String((e.parameter.reviewer || '')).trim();
  var codesRaw = String((e.parameter.codes || '')).trim();
  var codes = codesRaw ? codesRaw.split(/\r?\n/).map(function(code) { return String(code || '').trim(); }).filter(Boolean) : [];

  if (!sheet.getLastRow()) {
    sheet.appendRow(['Fecha', 'Tarima', 'Flujo', 'Revisor', 'Código']);
  }

  var now = new Date();
  codes.forEach(function(code) {
    sheet.appendRow([now, pallet, flow, reviewer, code]);
  });

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, inserted: codes.length, pallet: pallet }))
    .setMimeType(ContentService.MimeType.JSON);
}
