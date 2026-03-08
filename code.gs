// =====================================================================
// CODE.GS - JADWAL KERJA SATPAM
// Google Apps Script - Sistem jadwal kerja unit satpam
// =====================================================================
// Status: 11/20 Fungsi Selesai
// Terakhir update: Maret 2026
// =====================================================================

// =====================================================================
// KONSTANTA
// =====================================================================

const MODE = {
  PEL: 'PEL',  // Pelaksanaan Kerja
  PEN: 'PEN'   // Pengiriman Absensi
};

const UNIT_MAPPING = {
  'AKMIL':            'A2:AI9',
  'BANDONGAN':        'A11:AI17',
  'BOROBUDUR':        'A19:AI26',
  'BOTTON':           'A28:AI34',
  'CANDIMULYO':       'A36:AI42',
  'GLAGAH':           'A44:AI50',
  'GRABAG':           'A52:AI59',
  'KAJORAN':          'A61:AI67',
  'KALIANGKRIK':      'A69:AI75',
  'KARANG GADING':    'A77:AI83',
  'KC MAGELANG':      'A85:AI100',
  'KCP SHOPPING':     'A102:AI108',
  'KRASAK':           'A110:AI116',
  'MAGELANG SELATAN': 'A118:AI124',
  'MAGELANG UTARA':   'A126:AI132',
  'MERTOYUDAN':       'A134:AI140',
  'NGABLAK':          'A142:AI148',
  'PAKIS':            'A150:AI156',
  'PAYAMAN':          'A158:AI164',
  'REJOWINANGUN':     'A166:AI173',
  'SALAMAN':          'A175:AI182',
  'SECANG':           'A184:AI191',
  'SUKARNO HATTA':    'A193:AI199',
  'TEGALREJO':        'A201:AI208',
  'TEMPURAN':         'A210:AI216',
  'WINDUSARI':        'A218:AI224'
};

// =====================================================================
// FUNGSI HELPER
// =====================================================================

/**
 * getSheetName(mode, bulan, tahun)
 * Menghasilkan nama sheet dari kombinasi mode, bulan, tahun
 * @param {String} mode - MODE.PEL atau MODE.PEN
 * @param {Number} bulan - 1-12
 * @param {Number|String} tahun - 4 digit atau 2 digit
 * @return {String} nama sheet (contoh: 'PEL03-26')
 */
function getSheetName(mode, bulan, tahun) {
  const mm = String(bulan).padStart(2, '0');
  const yy = String(tahun).slice(-2);
  return `${mode}${mm}-${yy}`;
}

/**
 * getDaysInMonth(bulan, tahun)
 * Menghitung jumlah hari dalam bulan tertentu, termasuk tahun kabisat
 * @param {Number} bulan - 1-12
 * @param {Number|String} tahun - 4 digit atau 2 digit
 * @return {Number} jumlah hari
 */
function getDaysInMonth(bulan, tahun) {
  return new Date(parseInt(tahun), parseInt(bulan), 0).getDate();
}

/**
 * getStartRow(range)
 * Mengambil nomor baris awal dari string range
 * @param {String} range - Format 'A2:AI9'
 * @return {Number} nomor baris awal
 */
function getStartRow(range) {
  return parseInt(range.split(':')[0].replace('A', ''));
}

/**
 * getUnits()
 * Mengembalikan daftar semua nama unit
 * @return {Array<String>} array nama unit (26 unit)
 */
function getUnits() {
  return Object.keys(UNIT_MAPPING);
}

/**
 * getAvailableMonths(mode)
 * Mengembalikan daftar bulan yang tersedia berdasarkan sheet di spreadsheet
 * @param {String} mode - MODE.PEL atau MODE.PEN
 * @return {Array<Object>} array {value, tahun, sheet}, diurutkan
 */
function getAvailableMonths(mode) {
  const ss     = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const months = [];

  sheets.forEach(sheet => {
    const name  = sheet.getName();
    const regex = new RegExp('^' + mode + '([0-9]{2})-([0-9]{2})$');
    const match = name.match(regex);
    if (match) {
      const num = parseInt(match[1]);
      if (num >= 1 && num <= 12) {
        months.push({
          value: num,
          tahun: '20' + match[2],
          sheet: name
        });
      }
    }
  });

  months.sort((a, b) => a.tahun - b.tahun || a.value - b.value);
  return months;
}

// =====================================================================
// FUNGSI READ DATA
// =====================================================================

/**
 * getJadwal(mode, bulan, tahun, unit)
 * Membaca data jadwal satu unit dari sheet
 * @param {String} mode - MODE.PEL atau MODE.PEN
 * @param {Number} bulan - 1-12
 * @param {Number|String} tahun - 4 digit atau 2 digit
 * @param {String} unit - nama unit dari UNIT_MAPPING
 * @return {Object} {success, unitName, headerHari, headerTanggal, personil[], startRow, lastDateCol}
 */
function getJadwal(mode, bulan, tahun, unit) {
  try {
    const ss        = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = getSheetName(mode, bulan, tahun);
    const sheet     = ss.getSheetByName(sheetName);
    if (!sheet) return { success: false, message: `Sheet ${sheetName} tidak ditemukan` };

    const range = UNIT_MAPPING[unit];
    if (!range) return { success: false, message: 'Unit tidak ditemukan: ' + unit };

    const days        = getDaysInMonth(bulan, tahun);
    const lastDateCol = 2 + days;
    const numCols     = lastDateCol + 1;
    const startRow    = getStartRow(range);
    const endRow      = parseInt(range.split(':')[1].replace('AI', ''));
    const numRows     = endRow - startRow + 1;

    const data = sheet.getRange(startRow, 1, numRows, numCols).getValues();

    // Bangun header hari dari kalender
    const HARI_NAMES    = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
    const headerHari    = [];
    const headerTanggal = [];
    for (let d = 1; d <= days; d++) {
      const date = new Date(parseInt(tahun), parseInt(bulan) - 1, d);
      headerHari.push(HARI_NAMES[date.getDay()]);
      headerTanggal.push(d);
    }

    const result = {
      success      : true,
      unitName     : unit,
      headerHari,
      headerTanggal,
      personil     : [],
      startRow,
      lastDateCol
    };

    // Baca personil mulai index 3
    for (let i = 3; i < data.length; i++) {
      const col0 = String(data[i][0] || '').trim();
      const col1 = String(data[i][1] || '').trim();
      if (!col0 && !col1) break;
      if (isNaN(col0) || col0 === '' || col1 === '') continue;

      result.personil.push({
        no    : data[i][0],
        nama  : col1,
        jadwal: data[i].slice(3, lastDateCol + 1).map(v => String(v || '').trim())
      });
    }

    return result;

  } catch (error) {
    return { success: false, message: 'Error: ' + error.message };
  }
}

// =====================================================================
// FUNGSI SAVE DATA
// =====================================================================

/**
 * saveSingleCell(mode, bulan, tahun, unit, pIdx, jIdx, value)
 * Menyimpan satu nilai jadwal ke cell tertentu
 * @param {String} mode - MODE.PEL atau MODE.PEN
 * @param {Number} bulan - 1-12
 * @param {Number|String} tahun - 4 digit atau 2 digit
 * @param {String} unit - nama unit
 * @param {Number} pIdx - index personil (0-based)
 * @param {Number} jIdx - index tanggal (tanggal - 1)
 * @param {String} value - nilai jadwal (P, M12, OFF, SM, dst)
 * @return {Object} {success, message}
 */
function saveSingleCell(mode, bulan, tahun, unit, pIdx, jIdx, value) {
  try {
    const ss        = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = getSheetName(mode, bulan, tahun);
    const sheet     = ss.getSheetByName(sheetName);
    if (!sheet) return { success: false, message: `Sheet ${sheetName} tidak ditemukan` };

    const range = UNIT_MAPPING[unit];
    if (!range) return { success: false, message: 'Unit tidak ditemukan' };

    const startRow = getStartRow(range);
    const row      = startRow + 3 + parseInt(pIdx);
    const col      = 4 + parseInt(jIdx);
    sheet.getRange(row, col).setValue(value);
    SpreadsheetApp.flush();

    return { success: true, message: 'Cell berhasil disimpan' };
  } catch (error) {
    return { success: false, message: 'Error: ' + error.message };
  }
}

/**
 * saveJadwalBatch(mode, bulan, tahun, unit, changes)
 * Menyimpan banyak cell sekaligus (lebih efisien)
 * @param {String} mode - MODE.PEL atau MODE.PEN
 * @param {Number} bulan - 1-12
 * @param {Number|String} tahun - 4 digit atau 2 digit
 * @param {String} unit - nama unit
 * @param {Array} changes - array {pIdx, jIdx, value}
 * @return {Object} {success, message}
 */
function saveJadwalBatch(mode, bulan, tahun, unit, changes) {
  try {
    const ss        = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = getSheetName(mode, bulan, tahun);
    const sheet     = ss.getSheetByName(sheetName);
    if (!sheet) return { success: false, message: `Sheet ${sheetName} tidak ditemukan` };

    const range = UNIT_MAPPING[unit];
    if (!range) return { success: false, message: 'Unit tidak ditemukan' };

    const startRow = getStartRow(range);

    changes.forEach(({ pIdx, jIdx, value }) => {
      const row = startRow + 3 + parseInt(pIdx);
      const col = 4 + parseInt(jIdx);
      sheet.getRange(row, col).setValue(value);
    });

    SpreadsheetApp.flush();
    return { success: true, message: `${changes.length} cell berhasil disimpan` };
  } catch (error) {
    return { success: false, message: 'Error: ' + error.message };
  }
}

/**
 * saveJadwal(mode, bulan, tahun, unit, jadwalData)
 * Menyimpan seluruh jadwal satu unit (full overwrite)
 * @param {String} mode - MODE.PEL atau MODE.PEN
 * @param {Number} bulan - 1-12
 * @param {Number|String} tahun - 4 digit atau 2 digit
 * @param {String} unit - nama unit
 * @param {Array} jadwalData - array {jadwal: []}
 * @return {Object} {success, message}
 */
function saveJadwal(mode, bulan, tahun, unit, jadwalData) {
  try {
    const ss        = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = getSheetName(mode, bulan, tahun);
    const sheet     = ss.getSheetByName(sheetName);
    if (!sheet) return { success: false, message: `Sheet ${sheetName} tidak ditemukan` };

    const range = UNIT_MAPPING[unit];
    if (!range) return { success: false, message: 'Unit tidak ditemukan' };

    const startRow = getStartRow(range);

    jadwalData.forEach((personil, index) => {
      const row = startRow + 3 + index;
      sheet.getRange(row, 4, 1, personil.jadwal.length).setValues([personil.jadwal]);
    });

    SpreadsheetApp.flush();
    return { success: true, message: 'Jadwal berhasil disimpan' };
  } catch (error) {
    return { success: false, message: 'Error: ' + error.message };
  }
}

// =====================================================================
// ROUTING: doGet (GET request)
// =====================================================================

/**
 * doGet(e)
 * Routing untuk semua GET request dari HTML
 * Parameter query: ?action=...
 */
function doGet(e) {
  const action = e.parameter.action;
  let result;

  try {
    switch(action) {
      // Helper
      case 'getUnits':
        result = getUnits();
        break;

      case 'getAvailableMonths':
        result = getAvailableMonths(e.parameter.mode);
        break;

      // Read Jadwal
      case 'getJadwal':
        result = getJadwal(
          e.parameter.mode,
          parseInt(e.parameter.bulan),
          e.parameter.tahun,
          e.parameter.unit
        );
        break;

      default:
        result = { success: false, message: 'Action tidak dikenali: ' + action };
    }
  } catch(error) {
    result = { success: false, message: 'Error: ' + error.message };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// =====================================================================
// ROUTING: doPost (POST request)
// =====================================================================

/**
 * doPost(e)
 * Routing untuk semua POST request dari HTML
 * Body JSON: {action: '...', ...params}
 */
function doPost(e) {
  try {
    const data   = JSON.parse(e.postData.contents);
    const action = data.action;
    let result;

    switch(action) {
      // Save Jadwal
      case 'saveSingleCell':
        result = saveSingleCell(
          data.mode,
          data.bulan,
          data.tahun,
          data.unit,
          data.pIdx,
          data.jIdx,
          data.value
        );
        break;

      case 'saveJadwalBatch':
        result = saveJadwalBatch(
          data.mode,
          data.bulan,
          data.tahun,
          data.unit,
          data.changes
        );
        break;

      case 'saveJadwal':
        result = saveJadwal(
          data.mode,
          data.bulan,
          data.tahun,
          data.unit,
          data.jadwalData
        );
        break;

      default:
        result = { success: false, message: 'Action tidak dikenali: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: 'Error: ' + error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// =====================================================================
// END OF CODE.GS
// =====================================================================