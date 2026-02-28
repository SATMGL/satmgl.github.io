// ===================================================
// editmode.js — Edit Mode Logic untuk Jadwal Kerja BRI Magelang
// Pisahkan dari testtabel.js agar lebih modular
//
// Bergantung pada variabel global di testtabel.js:
//   - MODE, API_URL
//   - lastJadwalData, lastUnit, lastBulan, lastTahun
//   - apiCall()
//   - showToast(), showConfirm()
// ===================================================

// ===================================================
// KONSTANTA SHIFT
// ===================================================

const SHIFT_OPTIONS_WEEKDAY = ['P', 'S', 'M', 'OFF'];
const SHIFT_OPTIONS_WEEKEND = ['P12', 'M12', 'OFF'];

const SHIFT_LABELS = {
  P:   'PAGI',
  S:   'SIANG',
  M:   'MALAM',
  SM:  'SIANG-MALAM',
  P12: 'PAGI 12 JAM',
  M12: 'MALAM 12 JAM',
  OFF: 'LIBUR'
};

// Warna tiap shift (untuk popup preview)
const SHIFT_COLORS = {
  P:   '#1565c0',
  S:   '#f57f17',
  M:   '#6a1b9a',
  SM:  '#00695c',
  P12: '#0277bd',
  M12: '#4a148c',
  OFF: '#424242'
};

// ===================================================
// HITUNG HK STATS LOKAL
// ===================================================

// HK  : P(+1), S(+1), M(+1), SM(+2) — hari apapun
// HL  : P12(+1), M12(+1)             — hari apapun (lembur weekend)
// OFF : OFF                           — hari apapun
// HW  : tetap dari lastHkData (dihitung spreadsheet, tidak berubah)

const HK_WEIGHT = { P: 1, S: 1, M: 1, SM: 2 };
const HL_SHIFTS = new Set(['P12', 'M12']);

function hitungHkStats(pIdx) {
  const row = lastJadwalData?.[pIdx];
  if (!row) return null;

  let hk = 0, hl = 0, off = 0;

  Object.keys(row).forEach(key => {
    if (!key.startsWith('day')) return;
    const shift = row[key] || '';
    if (!shift) return;

    if (HK_WEIGHT[shift] !== undefined) {
      hk += HK_WEIGHT[shift];
    } else if (HL_SHIFTS.has(shift)) {
      hl += 1;
    } else if (shift === 'OFF') {
      off += 1;
    }
  });

  // HW tetap dari server — tidak berubah karena tidak bergantung shift
  const hw = lastHkData[row.nama]?.hw ?? 0;

  return { hk, hl, hw, off };
}

function updateHkStatsRow(pIdx) {
  const stats = hitungHkStats(pIdx);
  if (!stats) return;

  const row = document.querySelector(`tbody tr[data-pidx="${pIdx}"]`);
  if (!row) return;

  const items = row.querySelectorAll('.hk-stats-item .value');
  if (items.length < 4) return;

  // Urutan: HK, HL, HW, OFF (sama dengan renderTable)
  items[0].textContent = stats.hk;
  items[1].textContent = stats.hl;
  items[2].textContent = stats.hw;
  items[3].textContent = stats.off;

  // Juga update lastHkData supaya konsisten
  if (lastHkData[lastJadwalData[pIdx]?.nama]) {
    lastHkData[lastJadwalData[pIdx].nama].hk  = stats.hk;
    lastHkData[lastJadwalData[pIdx].nama].hl  = stats.hl;
    lastHkData[lastJadwalData[pIdx].nama].off = stats.off;
  }
}

// ===================================================
// STATE EDIT MODE
// ===================================================

let isEditMode      = false;
let undoHistory     = [];
let redoHistory     = [];
let originalSnapshot = null; // snapshot data sebelum edit dimulai
const MAX_UNDO      = 20;

// ===================================================
// ATURAN SHIFT — weekday vs weekend
// ===================================================

function getShiftOptions(dayOfWeek) {
  // 0 = Minggu, 6 = Sabtu
  return (dayOfWeek === 0 || dayOfWeek === 6)
    ? SHIFT_OPTIONS_WEEKEND
    : SHIFT_OPTIONS_WEEKDAY;
}

function getDayOfWeekFromCell(jIdx) {
  // Ambil dari header tabel — th ke jIdx+1 (skip kolom NAMA)
  const headerRow  = document.querySelector('thead tr:nth-child(2)');
  const thElements = headerRow?.querySelectorAll('th') || [];
  const dayText    = thElements[jIdx]?.textContent?.trim() || '';
  const hariMap    = { MIN: 0, SEN: 1, SEL: 2, RAB: 3, KAM: 4, JUM: 5, SAB: 6 };
  return hariMap[dayText] ?? 1; // default Senin
}

// ===================================================
// UNDO / REDO
// ===================================================

function pushUndo(pIdx, jIdx, oldValue, newValue) {
  undoHistory.push({ pIdx, jIdx, oldValue, newValue });
  if (undoHistory.length > MAX_UNDO) undoHistory.shift();
  // Setiap perubahan baru hapus redo history
  redoHistory = [];
  updateUndoRedoButtons();
}

function doUndo() {
  if (!undoHistory.length) return;
  const action = undoHistory.pop();
  const { pIdx, jIdx, oldValue, newValue } = action;

  // Simpan ke redo
  redoHistory.push(action);

  // Update cell di tabel
  const cell = getCellElement(pIdx, jIdx);
  if (cell) applyShiftToCell(cell, oldValue, false);

  // Flash animasi
  if (cell) flashCell(cell);

  // Update data lokal
  if (lastJadwalData?.[pIdx]) {
    lastJadwalData[pIdx][`day${jIdx + 1}`] = oldValue;
  }

  // Update HK stats lokal
  updateHkStatsRow(pIdx);

  // Auto save hasil undo
  autoSaveCell(pIdx, jIdx, oldValue);
  updateUndoRedoButtons();
}

function doRedo() {
  if (!redoHistory.length) return;
  const action = redoHistory.pop();
  const { pIdx, jIdx, newValue } = action;

  // Kembalikan ke undo
  undoHistory.push(action);

  // Update cell di tabel
  const cell = getCellElement(pIdx, jIdx);
  if (cell) applyShiftToCell(cell, newValue, false);

  // Flash animasi
  if (cell) flashCell(cell);

  // Update data lokal
  if (lastJadwalData?.[pIdx]) {
    lastJadwalData[pIdx][`day${jIdx + 1}`] = newValue;
  }

  // Update HK stats lokal
  updateHkStatsRow(pIdx);

  // Auto save hasil redo
  autoSaveCell(pIdx, jIdx, newValue);
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  // Undo button
  const undoBtn   = document.querySelector('[data-action="undo"]');
  const undoBadge = document.getElementById('undoCount');
  if (undoBtn) {
    undoBtn.disabled      = undoHistory.length === 0;
    undoBtn.style.opacity = undoHistory.length === 0 ? '0.4' : '1';
    undoBtn.title         = undoHistory.length > 0
      ? `Undo (${undoHistory.length} perubahan)`
      : 'Tidak ada yang bisa di-undo';
  }
  if (undoBadge) {
    if (undoHistory.length > 0) {
      undoBadge.textContent   = undoHistory.length;
      undoBadge.style.display = 'flex';
    } else {
      undoBadge.style.display = 'none';
    }
  }

  // Redo button
  const redoBtn   = document.querySelector('[data-action="redo"]');
  const redoBadge = document.getElementById('redoCount');
  if (redoBtn) {
    redoBtn.disabled      = redoHistory.length === 0;
    redoBtn.style.opacity = redoHistory.length === 0 ? '0.4' : '1';
    redoBtn.title         = redoHistory.length > 0
      ? `Redo (${redoHistory.length} perubahan)`
      : 'Tidak ada yang bisa di-redo';
  }
  if (redoBadge) {
    if (redoHistory.length > 0) {
      redoBadge.textContent   = redoHistory.length;
      redoBadge.style.display = 'flex';
    } else {
      redoBadge.style.display = 'none';
    }
  }
}

// ===================================================
// POPUP SHIFT
// ===================================================

function closeAllPopups() {
  document.querySelectorAll('.shift-popup').forEach(p => p.remove());
  document.removeEventListener('click', onDocClickClosePopup);
}

function onDocClickClosePopup(e) {
  document.querySelectorAll('.shift-popup').forEach(p => {
    if (!p.contains(e.target)) p.remove();
  });
  document.removeEventListener('click', onDocClickClosePopup);
}

function showShiftPopup(cell, pIdx, jIdx) {
  if (!isEditMode) return;
  closeAllPopups();

  const dayOfWeek    = getDayOfWeekFromCell(jIdx);
  const options      = getShiftOptions(dayOfWeek);
  const currentValue = cell.textContent.trim();
  const isWeekend    = dayOfWeek === 0 || dayOfWeek === 6;

  const popup = document.createElement('div');
  popup.className = 'shift-popup';

  // Header popup
  const header = document.createElement('div');
  header.className   = 'shift-popup-header';
  header.textContent = isWeekend ? '📅 Hari Weekend' : '📅 Hari Kerja';
  popup.appendChild(header);

  // Opsi shift
  options.forEach(opt => {
    const div = document.createElement('div');
    div.className = 'shift-option' + (opt === currentValue ? ' active' : '');

    // Warna indikator
    const dot = document.createElement('span');
    dot.className   = 'shift-dot';
    dot.style.background = SHIFT_COLORS[opt] || '#999';

    const label = document.createElement('span');
    label.textContent = `${SHIFT_LABELS[opt] || opt} [${opt}]`;


    div.appendChild(dot);
    div.appendChild(label);

    div.onclick = e => {
      e.stopPropagation();
      selectShift(cell, pIdx, jIdx, opt, currentValue);
      popup.remove();
      document.removeEventListener('click', onDocClickClosePopup);
    };

    popup.appendChild(div);
  });

  // Posisi popup
  const rect = cell.getBoundingClientRect();
  const popupW = 200;
  let left = rect.left;
  let top  = rect.bottom + 4;

  if (left + popupW > window.innerWidth - 8) {
    left = window.innerWidth - popupW - 8;
  }
  if (top + 200 > window.innerHeight) {
    top = rect.top - 200;
  }

  popup.style.top  = top  + 'px';
  popup.style.left = left + 'px';
  document.body.appendChild(popup);

  setTimeout(() => document.addEventListener('click', onDocClickClosePopup), 100);
}

// ===================================================
// SELECT SHIFT — ubah nilai cell
// ===================================================

function selectShift(cell, pIdx, jIdx, newValue, oldValue) {
  if (newValue === oldValue) return;

  // Terapkan ke cell
  applyShiftToCell(cell, newValue, true);

  // Flash animasi
  flashCell(cell);

  // Push ke undo history
  pushUndo(pIdx, jIdx, oldValue, newValue);

  // Update data lokal
  if (lastJadwalData?.[pIdx]) {
    lastJadwalData[pIdx][`day${jIdx + 1}`] = newValue;
  }

  // Update HK stats lokal
  updateHkStatsRow(pIdx);

  // Auto save ke GAS
  autoSaveCell(pIdx, jIdx, newValue);
}

function applyShiftToCell(cell, value, _pushUndoFlag) {
  cell.textContent = value;
  // Reset semua class shift, set yang baru
  cell.className = cell.className
    .split(' ')
    .filter(c => !c.startsWith('shift-') && c !== 'save-flash')
    .join(' ');
  if (value) cell.classList.add(`shift-${value}`);
}

// ===================================================
// FLASH ANIMASI SAAT CELL DIUBAH
// ===================================================

function flashCell(cell) {
  cell.classList.remove('save-flash');
  // Trigger reflow agar animasi restart
  void cell.offsetWidth;
  cell.classList.add('save-flash');
  setTimeout(() => cell.classList.remove('save-flash'), 700);
}

// ===================================================
// AUTO SAVE KE GAS
// ===================================================

let saveQueue    = [];
let isSaving     = false;
let saveDebounce = null;

function autoSaveCell(pIdx, jIdx, value) {
  // Tambah ke antrian
  // Kalau ada antrian dengan pIdx+jIdx yang sama, replace
  const existing = saveQueue.findIndex(q => q.pIdx === pIdx && q.jIdx === jIdx);
  if (existing >= 0) {
    saveQueue[existing].value = value;
  } else {
    saveQueue.push({ pIdx, jIdx, value });
  }

  // Debounce: tunggu 300ms sebelum kirim (hindari spam request)
  clearTimeout(saveDebounce);
  saveDebounce = setTimeout(processSaveQueue, 300);
}

async function processSaveQueue() {
  if (isSaving || saveQueue.length === 0) return;
  isSaving = true;

  const { pIdx, jIdx, value } = saveQueue.shift();

  const unit  = lastUnit;
  const bulan = lastBulan;
  const tahun = lastTahun;

  // Tampilkan indikator saving
  showSaveStatus('saving');

  try {
    const res = await apiCall({
      action: 'saveSingleCell',
      mode: MODE,
      bulan,
      tahun,
      unit,
      pIdx,
      jIdx,
      value
    });

    if (res?.success) {
      showSaveStatus('success');
      // Sync cell lain dari server setelah save berhasil
      syncOtherCellsFromServer();
    } else {
      showSaveStatus('error', res?.message);
      console.warn('Save gagal:', res?.message);
    }
  } catch (err) {
    showSaveStatus('error', err.message);
    console.error('Save error:', err);
  } finally {
    isSaving = false;
    // Proses antrian berikutnya jika ada
    if (saveQueue.length > 0) {
      setTimeout(processSaveQueue, 100);
    }
  }
}

// ===================================================
// SAVE STATUS INDICATOR
// ===================================================

let saveStatusTimeout = null;

function showSaveStatus(status, msg = '') {
  let indicator = document.getElementById('saveStatusIndicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'saveStatusIndicator';
    document.body.appendChild(indicator);
  }

  clearTimeout(saveStatusTimeout);

  if (status === 'saving') {
    indicator.className   = 'save-status saving';
    indicator.textContent = '💾 Menyimpan...';
    indicator.style.display = 'flex';
  } else if (status === 'success') {
    indicator.className   = 'save-status success';
    indicator.textContent = '✅ Tersimpan';
    indicator.style.display = 'flex';
    saveStatusTimeout = setTimeout(() => {
      indicator.style.display = 'none';
    }, 1500);
  } else if (status === 'error') {
    indicator.className   = 'save-status error';
    indicator.textContent = '❌ Gagal simpan' + (msg ? ': ' + msg : '');
    indicator.style.display = 'flex';
    saveStatusTimeout = setTimeout(() => {
      indicator.style.display = 'none';
    }, 3000);
  }
}

// ===================================================
// TOGGLE EDIT MODE
// ===================================================

function toggleEditMode() {
  if (isEditMode) {
    saveAndExitEdit();
  } else {
    enterEditMode();
  }
}

function enterEditMode() {
  isEditMode       = true;
  undoHistory      = [];
  redoHistory      = [];
  // Snapshot data saat ini — SEBELUM user mulai edit
  // Termasuk perubahan orang lain yang sudah masuk via sync
  originalSnapshot = lastJadwalData
    ? JSON.parse(JSON.stringify(lastJadwalData))
    : null;
  updateUndoRedoButtons();

  const editBtn         = document.getElementById('editBtn');
  const downloadSection = document.getElementById('downloadSection');
  const tbody           = document.querySelector('table tbody');
  const undoBtn         = document.querySelector('[data-action="undo"]');

  if (editBtn) {
    editBtn.innerHTML = '<span class="btn-icon">💾</span><span class="btn-text">Simpan</span>';
    editBtn.classList.add('editing');
    editBtn.onclick = saveAndExitEdit;
  }
  if (downloadSection) downloadSection.style.display = 'none';
  if (tbody) tbody.classList.add('edit-active');
  const redoBtn = document.getElementById('redoBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  if (undoBtn) undoBtn.style.display = 'flex';
  if (cancelBtn) cancelBtn.style.display = 'flex';
  if (redoBtn) redoBtn.style.display = 'flex';
  updateUndoRedoButtons();

  attachInlineEdit();
  showToast('Mode edit aktif — ketuk cell untuk ubah shift', 'info', 2500);
}

function exitEditMode() {
  isEditMode       = false;
  undoHistory      = [];
  redoHistory      = [];
  saveQueue        = [];
  originalSnapshot = null;

  updateUndoRedoButtons();
  closeAllPopups();

  const editBtn         = document.getElementById('editBtn');
  const downloadSection = document.getElementById('downloadSection');
  const tbody           = document.querySelector('table tbody');
  const undoBtn         = document.querySelector('[data-action="undo"]');

  if (editBtn) {
    editBtn.innerHTML = '<span class="btn-icon">✏️</span><span class="btn-text">Edit Jadwal</span>';
    editBtn.classList.remove('editing');
    editBtn.onclick = toggleEditMode;
  }
  if (downloadSection) downloadSection.style.display = 'grid';
  if (tbody) tbody.classList.remove('edit-active');
  const redoBtnExit  = document.getElementById('redoBtn');
  const cancelBtnExit = document.getElementById('cancelBtn');
  if (undoBtn) undoBtn.style.display = 'none';
  if (redoBtnExit) redoBtnExit.style.display = 'none';
  if (cancelBtnExit) cancelBtnExit.style.display = 'none';
  const redoBtn3 = document.querySelector('[data-action="redo"]');
  if (redoBtn3) redoBtn3.style.display = 'none';
}

function saveAndExitEdit() {
  // Tunggu save queue selesai dulu kalau masih ada
  if (saveQueue.length > 0 || isSaving) {
    showToast('Menunggu proses simpan selesai...', 'info', 1500);
    setTimeout(saveAndExitEdit, 800);
    return;
  }

  showConfirm({
    title     : 'Simpan Perubahan',
    message   : 'Simpan semua perubahan dan keluar dari mode edit?',
    icon      : '💾',
    okText    : 'Simpan & Keluar',
    cancelText: 'Batal',
    okClass   : 'btn-confirm-ok btn-confirm-save',
    onOk      : () => {
      exitEditMode();
      showToast('Perubahan berhasil disimpan!', 'success');
    }
  });
}

// ===================================================
// CANCEL EDIT — restore data asli ke spreadsheet
// ===================================================

function cancelEdit() {
  if (!isEditMode) return;

  const totalPerubahan = undoHistory.length;

  showConfirm({
    title     : 'Batalkan Perubahan?',
    message   : totalPerubahan > 0
      ? `Ada ${totalPerubahan} perubahan yang akan dikembalikan ke data semula.`
      : 'Tidak ada perubahan. Keluar dari mode edit?',
    icon      : '⚠️',
    okText    : 'Ya, Batalkan',
    cancelText: 'Lanjut Edit',
    okClass   : 'btn-confirm-ok btn-confirm-danger',
    onOk      : () => {
      if (!originalSnapshot) {
        exitEditMode();
        showToast('Keluar dari mode edit', 'info');
        return;
      }

      // Bandingkan originalSnapshot (saat masuk edit) vs lastJadwalData (sekarang)
      // Hanya kirim cell yang berbeda dari snapshot — HANYA perubahan ANDA
      // Perubahan orang lain (yang masuk via sync) tidak ikut di-cancel
      const changes = [];

      originalSnapshot.forEach((snapRow, pIdx) => {
        const curRow = lastJadwalData?.[pIdx];
        if (!curRow) return;

        Object.keys(snapRow).forEach(key => {
          if (!key.startsWith('day')) return;
          const jIdx    = parseInt(key.replace('day', '')) - 1;
          const snapVal = snapRow[key] || '';
          const curVal  = curRow[key]  || '';

          if (snapVal !== curVal) {
            // Cell ini berubah sejak edit dimulai — restore ke snapshot
            changes.push({ pIdx, jIdx, value: snapVal });

            // Update tampilan
            const cell = getCellElement(pIdx, jIdx);
            if (cell) applyShiftToCell(cell, snapVal, false);

            // Update data lokal
            lastJadwalData[pIdx][key] = snapVal;
          }
        });
      });

      // Kosongkan history
      undoHistory = [];
      redoHistory = [];
      updateUndoRedoButtons();
      exitEditMode();

      if (changes.length === 0) {
        showToast('Tidak ada perubahan untuk dibatalkan', 'info');
        return;
      }

      // Kirim ke GAS via saveJadwalBatch
      showSaveStatus('saving');
      apiCall({
        action  : 'saveJadwalBatch',
        mode    : MODE,
        bulan   : lastBulan,
        tahun   : lastTahun,
        unit    : lastUnit,
        changes : JSON.stringify(changes)
      })
      .then(res => {
        if (res?.success) {
          showSaveStatus('success');
          showToast(`${changes.length} perubahan Anda berhasil dibatalkan`, 'warning');
        } else {
          showSaveStatus('error', res?.message);
          showToast('Gagal: ' + (res?.message || ''), 'error');
        }
      })
      .catch(err => {
        showSaveStatus('error');
        showToast('Gagal: ' + err.message, 'error');
      });
    }
  });
}

// Cek apakah sedang dalam edit mode (dipanggil dari testtabel.js)
function isInEditMode() {
  return isEditMode;
}

// Restore data ke snapshot awal dan save ke GAS — dipanggil dari testtabel.js
// Return Promise agar caller bisa tunggu sebelum lanjut (misal clearTabel)
function restoreToSnapshot() {
  return new Promise((resolve) => {
    if (!originalSnapshot) {
      exitEditMode();
      resolve();
      return;
    }

    const changes = [];
    originalSnapshot.forEach((snapRow, pIdx) => {
      const curRow = lastJadwalData?.[pIdx];
      if (!curRow) return;
      Object.keys(snapRow).forEach(key => {
        if (!key.startsWith('day')) return;
        const jIdx    = parseInt(key.replace('day', '')) - 1;
        const snapVal = snapRow[key] || '';
        const curVal  = curRow[key]  || '';
        if (snapVal !== curVal) {
          changes.push({ pIdx, jIdx, value: snapVal });
          // Update tampilan
          const cell = getCellElement(pIdx, jIdx);
          if (cell) applyShiftToCell(cell, snapVal, false);
          lastJadwalData[pIdx][key] = snapVal;
        }
      });
    });

    undoHistory = [];
    redoHistory = [];
    updateUndoRedoButtons();
    exitEditMode();

    if (changes.length === 0) {
      resolve();
      return;
    }

    // Save restore ke GAS
    showSaveStatus('saving');
    apiCall({
      action  : 'saveJadwalBatch',
      mode    : MODE,
      bulan   : lastBulan,
      tahun   : lastTahun,
      unit    : lastUnit,
      changes : JSON.stringify(changes)
    })
    .then(res => {
      if (res?.success) showSaveStatus('success');
      else showSaveStatus('error', res?.message);
      resolve();
    })
    .catch(err => {
      showSaveStatus('error');
      resolve(); // tetap resolve agar clearTabel jalan
    });
  });
}

// ===================================================
// SYNC SETELAH SAVE — update cell lain dari server
// ===================================================

async function syncOtherCellsFromServer() {
  // Skip sync kalau masih ada antrian save — hindari konflik data
  if (saveQueue.length > 0 || isSaving) return;
  if (!lastUnit || !lastBulan || !lastTahun) return;

  try {
    const res = await apiCall({
      action: 'getJadwal',
      mode  : MODE,
      bulan : lastBulan,
      tahun : lastTahun,
      unit  : lastUnit
    });

    if (!res?.personil) return;

    let adaPerubahan = false;
    const changedPIdx = new Set();

    // Buat set cell yang masih dalam antrian save — jangan ditimpa sync
    const pendingKeys = new Set(saveQueue.map(q => `${q.pIdx}_${q.jIdx}`));

    res.personil.forEach((personil, pIdx) => {
      const localRow = lastJadwalData?.[pIdx];
      if (!localRow) return;

      personil.jadwal.forEach((serverVal, jIdx) => {
        // Skip cell yang masih dalam antrian save
        if (pendingKeys.has(`${pIdx}_${jIdx}`)) return;

        const localVal = localRow[`day${jIdx + 1}`] || '';
        const sVal     = String(serverVal || '');

        if (sVal !== localVal) {
          // Update data lokal
          lastJadwalData[pIdx][`day${jIdx + 1}`] = sVal;

          // Update tampilan cell
          const cell = getCellElement(pIdx, jIdx);
          if (cell) {
            applyShiftToCell(cell, sVal, false);
            // Highlight oranye — berubah oleh orang lain
            cell.classList.remove('sync-flash');
            void cell.offsetWidth;
            cell.classList.add('sync-flash');
            setTimeout(() => cell.classList.remove('sync-flash'), 2000);
          }
          adaPerubahan = true;
          changedPIdx.add(pIdx);
        }
      });
    });

    if (adaPerubahan) {
      changedPIdx.forEach(pIdx => updateHkStatsRow(pIdx));
      showToast('Ada perubahan dari pengguna lain', 'info', 2500);
    }

  } catch (err) {
    // Sync gagal — tidak perlu tampilkan error, biarkan saja
    console.warn('Sync error:', err.message);
  }
}

// ===================================================
// ATTACH INLINE EDIT — event listener ke tbody
// ===================================================

function attachInlineEdit() {
  const tbody = document.querySelector('table tbody');
  if (!tbody) return;

  // Clone untuk hapus listener lama
  const newTbody = tbody.cloneNode(true);
  tbody.replaceWith(newTbody);

  newTbody.addEventListener('click', e => {
    if (!isEditMode) return;
    const td = e.target.closest('td');
    if (!td || td.classList.contains('nama-col')) return;

    const row  = td.closest('tr');
    const pIdx = parseInt(row?.dataset.pidx ?? -1);
    if (pIdx < 0) return;

    const jIdx = Array.from(row.cells).indexOf(td) - 1;
    if (jIdx < 0) return;

    showShiftPopup(td, pIdx, jIdx);
  });
}

// ===================================================
// HELPER — ambil element cell dari pIdx & jIdx
// ===================================================

function getCellElement(pIdx, jIdx) {
  const row = document.querySelector(`tbody tr[data-pidx="${pIdx}"]`);
  if (!row) return null;
  return row.cells[jIdx + 1] || null; // +1 karena kolom pertama = NAMA
}