// ===================================================
// testtabel.js — Jadwal Kerja BRI Magelang
// Warna shift diatur CSS (class shift-P, shift-S, dst)
// ===================================================

// ===== STATE =====
let lastJadwalData = null;
let lastDays       = 0;
let lastHkData     = {};
let lastUnit       = "";
let lastBulan      = 0;
let lastTahun      = "";


// ===== SESSION STATE =====
let authSession    = null;
const WARNING_TIME = 1 * 60 * 1000;  // peringatan 1 menit sebelum timeout
const IDLE_TIMEOUT  = 10 * 60 * 1000; // 10 menit idle

function getIdleTimeout() {
  return IDLE_TIMEOUT;
}
let idleTimer      = null;
let warningTimeout = null;

const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni',
                     'Juli','Agustus','September','Oktober','November','Desember'];
const HARI_NAMES  = ['MIN','SEN','SEL','RAB','KAM','JUM','SAB'];

// ===================================================
// UI HELPERS
// ===================================================

function setLoading(show, msg = 'Memuat data') {
  const el = document.getElementById('loadingOverlay');
  if (!el) return;
  el.style.display = show ? 'flex' : 'none';
  const span = el.querySelector('.loading-text');
  if (span) span.textContent = msg;
}

function showError(msg) {
  showToast(msg, 'error');
}

// ===================================================
// TOAST SYSTEM
// ===================================================

function showToast(msg, type = 'info', duration = 3500) {
  // Hapus toast lama jika ada
  document.querySelectorAll('.custom-toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `custom-toast toast-${type}`;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-msg">${msg}</span>`;

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ===================================================
// MODAL KONFIRMASI CUSTOM
// ===================================================

function showConfirm({ title = 'Konfirmasi', message, icon = '❓',
                       okText = 'Ya', cancelText = 'Batal',
                       okClass = 'btn-confirm-ok', onOk, onCancel } = {}) {
  // Hapus modal lama jika ada
  document.getElementById('customConfirmModal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'customConfirmModal';
  modal.className = 'custom-confirm-overlay';
  modal.innerHTML = `
    <div class="custom-confirm-box">
      <div class="custom-confirm-icon">${icon}</div>
      <div class="custom-confirm-title">${title}</div>
      <div class="custom-confirm-msg">${message}</div>
      <div class="custom-confirm-actions">
        <button class="btn-confirm-cancel" id="confirmCancelBtn">${cancelText}</button>
        <button class="${okClass}" id="confirmOkBtn">${okText}</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('show'));

  const close = () => {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  };

  modal.querySelector('#confirmOkBtn').onclick = () => { close(); onOk?.(); };
  modal.querySelector('#confirmCancelBtn').onclick = () => { close(); onCancel?.(); };
  // Klik backdrop untuk tutup
  modal.addEventListener('click', e => { if (e.target === modal) { close(); onCancel?.(); } });
}

// ===================================================
// API
// ===================================================

// GET — untuk read (getJadwal, getAvailableMonths, verifyPassword, dst)
async function apiCall(params) {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// POST — untuk write (saveSingleCell, saveJadwal, dst)
async function apiPost(data) {
  const res = await fetch(API_URL, {
    method  : 'POST',
    redirect: 'follow',
    headers : { 'Content-Type': 'text/plain' }, // GAS butuh text/plain agar tidak CORS preflight
    body    : JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ===================================================
// SESSION AUTH
// ===================================================

function initSessionAuth() {
  restartIdleTimer();
  document.addEventListener('click',     restartIdleTimer);
  document.addEventListener('keypress',  restartIdleTimer);
  document.addEventListener('mousemove', restartIdleTimer);
}

function restartIdleTimer() {
  clearTimeout(idleTimer);
  clearTimeout(warningTimeout);
  warningTimeout = setTimeout(showIdleWarning, getIdleTimeout() - WARNING_TIME);
  idleTimer      = setTimeout(autoLogout,      getIdleTimeout());
}

function showIdleWarning() {
  showConfirm({
    title     : '⏳ Session Hampir Berakhir',
    message   : 'Tidak ada aktivitas selama 9 menit.<br>Session akan berakhir dalam <strong>1 menit</strong>.<br>Lanjutkan sesi?',
    icon      : '⏳',
    okText    : 'Ya, Lanjutkan',
    cancelText: 'Logout',
    okClass   : 'btn-confirm-ok',
    onOk      : () => restartIdleTimer(),
    onCancel  : () => autoLogout()
  });
}


function autoLogout() {
  authSession = null;
  sessionStorage.removeItem('authRole');
  sessionStorage.removeItem('authUnit');
  sessionStorage.removeItem('authLoginTime');
  // Hapus semua password unit yang tersimpan
  Object.keys(sessionStorage)
    .filter(k => k.startsWith('unitPwd_'))
    .forEach(k => sessionStorage.removeItem(k));
  if (isEditMode) exitEditMode();
  clearTabel();
  showToast('Session berakhir. Silakan pilih unit kembali.', 'warning', 5000);
}

function loadSessionAuth() {
  const role      = sessionStorage.getItem('authRole');
  const unit      = sessionStorage.getItem('authUnit');
  const loginTime = sessionStorage.getItem('authLoginTime');
  if (role && unit && loginTime) {
    authSession = { role, unit, loginTime };
    return true;
  }
  return false;
}

function setSessionAuth(role, unit) {
  authSession = { role, unit, loginTime: Date.now() };
  sessionStorage.setItem('authRole',      role);
  sessionStorage.setItem('authUnit',      unit);
  sessionStorage.setItem('authLoginTime', authSession.loginTime);
  initSessionAuth();
}


// ===================================================
// DROPDOWN PANEL — BULAN & UNIT
// ===================================================

const UNIT_LIST = [
  'AKMIL','BANDONGAN','BOROBUDUR','BOTTON','CANDIMULYO',
  'GLAGAH','GRABAG','KAJORAN','KALIANGKRIK','KARANG GADING',
  'KC MAGELANG','KCP SHOPING','KRASAK','MAGELANG SELATAN','MAGELANG UTARA',
  'MERTOYUDAN','NGABLAK','PAKIS','PAYAMAN','REJOWINANGUN',
  'SALAMAN','SECANG','SUKARNO HATTA','TEGALREJO','TEMPURAN','WINDUSARI'
];

function closeAllPanels() {
  closeBulanPanel();
  closeUnitPanel();
  document.getElementById('dropdownBackdrop')?.classList.remove('show');
}

// ===================================================
// HELPER: posisikan panel agar tidak keluar layar
// ===================================================
function positionPanel(btn, panel) {
  const btnRect   = btn.getBoundingClientRect();
  const panelW    = panel.offsetWidth  || parseInt(getComputedStyle(panel).width)  || 300;
  const panelH    = panel.offsetHeight || 200; // estimasi sebelum render penuh
  const viewW     = window.innerWidth;
  const viewH     = window.innerHeight;
  const margin    = 8; // px dari tepi layar

  // Posisi vertikal: bawah tombol, jika kurang ruang geser ke atas
  let top = btnRect.bottom + 6;
  if (top + panelH > viewH - margin) {
    top = btnRect.top - panelH - 6;
    if (top < margin) top = margin;
  }

  // Posisi horizontal: mulai dari kiri tombol, jika melewati kanan geser ke kiri
  let left = btnRect.left;
  if (left + panelW > viewW - margin) {
    left = viewW - panelW - margin;
  }
  if (left < margin) left = margin;

  panel.style.top  = top  + 'px';
  panel.style.left = left + 'px';
}

// ── BULAN PANEL ──

function toggleBulanPanel() {
  const panel = document.getElementById('bulanPanel');
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  closeAllPanels();
  if (!isOpen) openBulanPanel();
}

function openBulanPanel() {
  const btn   = document.getElementById('bulanBtn');
  const panel = document.getElementById('bulanPanel');
  if (!btn || !panel) return;

  panel.style.display = 'block'; // tampilkan dulu agar offsetWidth bisa dibaca
  positionPanel(btn, panel);

  panel.classList.add('open');
  btn.classList.add('open');
  document.getElementById('dropdownBackdrop')?.classList.add('show');
}

function closeBulanPanel() {
  document.getElementById('bulanPanel')?.classList.remove('open');
  document.getElementById('bulanBtn')?.classList.remove('open');
}

function selectBulan(value, label) {
  const sel = document.getElementById('bulanSelect');
  if (sel) sel.value = value;

  const lbl = document.getElementById('bulanLabel');
  if (lbl) { lbl.textContent = label; lbl.classList.remove('placeholder'); }

  document.getElementById('unitBtn')?.removeAttribute('disabled');

  document.querySelectorAll('.bulan-item').forEach(el => {
    el.classList.toggle('active', el.dataset.value === value);
  });

  resetUnitSelection();

  document.getElementById('resetBulanBtn')?.style.setProperty('display', 'flex');

  closeAllPanels();
  updateKeterangan();
}

// ── UNIT PANEL ──

function toggleUnitPanel() {
  const unitBtn = document.getElementById('unitBtn');
  if (unitBtn?.disabled) return;
  const panel = document.getElementById('unitPanel');
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  closeAllPanels();
  if (!isOpen) openUnitPanel();
}

function openUnitPanel() {
  buildUnitGrid();

  const btn   = document.getElementById('unitBtn');
  const panel = document.getElementById('unitPanel');
  if (!btn || !panel) return;

  panel.style.display = 'block'; // tampilkan dulu agar offsetWidth bisa dibaca
  positionPanel(btn, panel);

  panel.classList.add('open');
  btn.classList.add('open');
  document.getElementById('dropdownBackdrop')?.classList.add('show');
  setTimeout(() => document.getElementById('unitSearchInput')?.focus(), 150);
}

function closeUnitPanel() {
  document.getElementById('unitPanel')?.classList.remove('open');
  document.getElementById('unitBtn')?.classList.remove('open');
  const inp = document.getElementById('unitSearchInput');
  if (inp) inp.value = '';
  filterUnitList('');
}

function buildUnitGrid() {
  const grid = document.getElementById('unitGrid');
  if (!grid || grid.children.length > 0) return;

  const currentUnit = document.getElementById('unitSelect')?.value || '';
  grid.innerHTML = UNIT_LIST.map(u =>
    `<div class="unit-card${u === currentUnit ? ' active' : ''}"
          data-unit="${u}"
          onclick="selectUnit('${u}')">${u}</div>`
  ).join('');
}

function selectUnit(unit) {
  const sel = document.getElementById('unitSelect');
  if (sel) sel.value = unit;

  const lbl = document.getElementById('unitLabel');
  if (lbl) { lbl.textContent = unit; lbl.classList.remove('placeholder'); }

  document.querySelectorAll('.unit-card').forEach(el => {
    el.classList.toggle('active', el.dataset.unit === unit);
  });

  document.getElementById('resetUnitBtn')?.style.setProperty('display', 'flex');

  closeAllPanels();
  updateKeterangan();

  const bulan = document.getElementById('bulanSelect')?.value;
  if (bulan && unit) openPasswordModal(bulan, unit);
}

function filterUnitList(q) {
  const keyword = q.toLowerCase().trim();
  document.querySelectorAll('.unit-card').forEach(el => {
    el.classList.toggle('hidden', !el.dataset.unit.toLowerCase().includes(keyword));
  });
}

function resetUnitSelection() {
  const sel = document.getElementById('unitSelect');
  if (sel) sel.value = '';
  const lbl = document.getElementById('unitLabel');
  if (lbl) { lbl.textContent = 'Pilih Unit'; lbl.classList.add('placeholder'); }
  document.querySelectorAll('.unit-card').forEach(el => el.classList.remove('active'));
  document.getElementById('resetUnitBtn')?.style.setProperty('display', 'none');
  clearTabel();
}

// ===================================================
// DROPDOWN HANDLERS
// ===================================================

function onBulanChange(bulan) {
  const unitBtn = document.getElementById('unitBtn');
  if (unitBtn) unitBtn.disabled = !bulan;
  if (!bulan) resetUnitSelection();
  updateKeterangan();
}

function onUnitChange(unit) {
  if (isEditMode) exitEditMode();
  const bulan = document.getElementById('bulanSelect')?.value;
  if (bulan && unit) openPasswordModal(bulan, unit);
  updateKeterangan();
}

function updateKeterangan() {
  const keterangan = document.querySelector('.keterangan');
  if (!keterangan) return;
  const bulanEl = document.getElementById('bulanSelect');
  const unitEl  = document.getElementById('unitSelect');
  const periode = bulanEl?.options[bulanEl.selectedIndex]?.text || '';
  const unit    = unitEl?.value || '';
  keterangan.textContent = unit
    ? `PENGIRIMAN ABSENSI UNIT ${unit.toUpperCase()} ${periode.toUpperCase()}`
    : 'Silakan pilih bulan dan unit kerja';
}

// ===================================================
// PASSWORD MODAL
// ===================================================

let _pendingBulan = null;
let _pendingUnit  = null;

function openPasswordModal(bulan, unit) {
  _pendingBulan = bulan;
  _pendingUnit  = unit;

  // Hapus semua password unit lain yang tersimpan — hanya boleh 1 unit aktif
  Object.keys(sessionStorage)
    .filter(k => k.startsWith('unitPwd_') && k !== 'unitPwd_' + unit)
    .forEach(k => sessionStorage.removeItem(k));

  // Cek apakah password unit ini sudah tersimpan di session
  const savedPassword = sessionStorage.getItem('unitPwd_' + unit);
  if (savedPassword) {
    // Langsung load tanpa modal
    setSessionAuth('USER', unit);
    loadJadwal(bulan, unit);
    return;
  }

  const modal   = document.getElementById('passwordModal');
  const input   = document.getElementById('unitPasswordInput');
  const errorEl = document.getElementById('unitPasswordError');
  const labelEl = document.getElementById('passwordModalLabel');
  if (!modal) return;

  if (labelEl) labelEl.textContent = `Masukkan password unit ${unit}:`;
  input.value         = '';
  errorEl.textContent = '';
  input.classList.remove('error');
  modal.classList.add('show');
  setTimeout(() => input.focus(), 100);
}

function closePasswordModal() {
  document.getElementById('passwordModal')?.classList.remove('show');
  _pendingBulan = null;
  _pendingUnit  = null;
}

function cancelPasswordModal() {
  const unitSelect = document.getElementById('unitSelect');
  if (unitSelect) unitSelect.value = '';
  closePasswordModal();
}

async function submitUnitPassword() {
  const input    = document.getElementById('unitPasswordInput');
  const errorEl  = document.getElementById('unitPasswordError');
  const password = input.value.trim();

  if (!password) {
    input.classList.add('error');
    errorEl.textContent = 'Password tidak boleh kosong';
    return;
  }

  const btn = document.querySelector('#passwordModal .btn-admin-submit');
  btn.textContent = 'Memverifikasi...';
  btn.disabled    = true;

  try {
    const res = await apiCall({
      action  : 'verifyPassword',
      unit    : _pendingUnit,
      password: password
    });

    if (res.success) {
      const bulan = _pendingBulan;
      const unit  = _pendingUnit;
      // Simpan password di session agar tidak perlu input lagi
      sessionStorage.setItem('unitPwd_' + unit, password);
      setSessionAuth('USER', unit);
      closePasswordModal();
      await loadJadwal(bulan, unit);
    } else {
      input.classList.add('error');
      errorEl.textContent = res.message || 'Password salah';
      input.value = '';
    }
  } catch (err) {
    errorEl.textContent = 'Gagal verifikasi: ' + err.message;
    console.error('Password verification error:', err);
  } finally {
    btn.textContent = 'Masuk';
    btn.disabled    = false;
  }
}


// ===================================================
// LOAD MONTHS
// ===================================================

async function loadAvailableMonths() {
  const bulanList = document.getElementById('bulanList');
  const bulanBtn  = document.getElementById('bulanBtn');
  if (!bulanList) return;

  bulanList.innerHTML = '<div class="sheet-loading">Memuat bulan...</div>';
  if (bulanBtn) bulanBtn.disabled = true;
  setLoading(true, 'Memuat bulan...');

  try {
    const months = await apiCall({ action: 'getAvailableMonths', mode: MODE });

    if (bulanBtn) bulanBtn.disabled = false;

    if (Array.isArray(months) && months.length > 0) {
      bulanList.innerHTML = months.map(m => {
        const mm    = String(m.value).padStart(2, '0');
        const value = `${m.tahun}-${mm}`;
        const label = `${MONTH_NAMES[m.value - 1]} ${m.tahun}`;
        return `<div class="bulan-item" data-value="${value}" onclick="selectBulan('${value}','${label}')">
          <span class="bulan-icon">📅</span>
          <span class="bulan-text">${label}</span>
          <span class="bulan-check">✓</span>
        </div>`;
      }).join('');

      const sel = document.getElementById('bulanSelect');
      if (sel) {
        sel.innerHTML = '<option value="">Pilih Bulan</option>';
        months.forEach(m => {
          const mm  = String(m.value).padStart(2, '0');
          const opt = document.createElement('option');
          opt.value       = `${m.tahun}-${mm}`;
          opt.textContent = `${MONTH_NAMES[m.value - 1]} ${m.tahun}`;
          sel.appendChild(opt);
        });
      }
    } else {
      bulanList.innerHTML = '<div class="sheet-loading">Tidak ada data bulan</div>';
    }
  } catch (err) {
    console.error('Gagal load bulan:', err);
    bulanList.innerHTML = '<div class="sheet-loading">Gagal memuat bulan</div>';
    if (bulanBtn) bulanBtn.disabled = false;
  } finally {
    setLoading(false);
  }
}

// ===================================================
// LOAD JADWAL
// ===================================================

async function loadJadwal(bulan, unit) {
  if (!bulan || !unit) { showError('Bulan dan unit harus dipilih'); return; }

  const parts = bulan.split('-');
  if (parts.length !== 2) { showError('Format bulan tidak valid: ' + bulan); return; }

  const [year, month] = parts;
  const tahun         = year.slice(-2);

  // Simpan untuk dipakai autoSaveCell (unitSelect bisa disabled)
  lastUnit  = unit;
  lastBulan = parseInt(month);
  lastTahun = tahun;

  setLoading(true, 'Memuat jadwal...');

  try {
    const [jadwalRes, hkRes] = await Promise.all([
      apiCall({ action: 'getJadwal',    mode: MODE, bulan: parseInt(month), tahun, unit }),
      apiCall({ action: 'getHariKerja', mode: MODE, bulan: parseInt(month), tahun, unit })
    ]);

    if (!jadwalRes) throw new Error('Data jadwal tidak ditemukan');

    const daysInMonth = jadwalRes.headerTanggal.length;
    const jadwalData  = jadwalRes.personil.map(p => {
      const obj = { nama: p.nama };
      p.jadwal.forEach((shift, i) => { obj[`day${i + 1}`] = shift || ''; });
      return obj;
    });

    const hkData = {};
    if (hkRes?.success && hkRes?.data) {
      hkRes.data.forEach(row => {
        hkData[row.nama] = { hk: row.hk, hl: row.hl, hw: row.hw, off: row.off };
      });
    }

    lastJadwalData = jadwalData;
    lastDays       = daysInMonth;
    lastHkData     = hkData;

    renderTable(jadwalData, daysInMonth, year, month, unit);


  } catch (err) {
    console.error('Full error:', err);
    showError('Gagal memuat data: ' + err.message);
  } finally {
    setLoading(false);
  }
}

// ===================================================
// RENDER TABLE
// ===================================================

function renderTable(data, days, year, month, unit) {
  exitEditMode();

  const monthLabel = MONTH_NAMES[parseInt(month) - 1];

  const colgroup = document.querySelector('table colgroup');
  if (colgroup) {
    colgroup.innerHTML = '<col class="col-nama">' +
      Array.from({ length: days }, () => '<col class="col-day">').join('');
  }

  const thead = document.getElementById('tableThead') || document.querySelector('table thead');
  if (thead) {
    let hariHtml = '', tglHtml = '';
    for (let i = 1; i <= days; i++) {
      const date      = new Date(year, parseInt(month) - 1, i);
      const hari      = HARI_NAMES[date.getDay()];
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const style     = isWeekend ? ' style="background:#ff6b6b"' : '';
      hariHtml += `<th${style}>${hari}</th>`;
      tglHtml  += `<th${style}>${i}</th>`;
    }
    thead.innerHTML = `
      <tr>
        <th class="nama-col" rowspan="3">NAMA</th>
        <th colspan="${days}">PENGIRIMAN ABSENSI UNIT ${unit} BULAN ${monthLabel} ${year}</th>
      </tr>
      <tr>${hariHtml}</tr>
      <tr>${tglHtml}</tr>`;
  }

  const tbody = document.querySelector('table tbody');
  if (!tbody) return;

  tbody.innerHTML = data.map((person, pIdx) => {
    const hk = lastHkData[person.nama] || { hk: 0, hl: 0, hw: 0, off: 0 };

    const cells = Array.from({ length: days }, (_, i) => {
      const shift = person[`day${i + 1}`] || '';
      const cls   = shift ? ` class="shift-${shift}"` : '';
      return `<td${cls}>${shift}</td>`;
    }).join('');

    return `<tr data-pidx="${pIdx}">
      <td class="nama-col">
        <span>${person.nama}</span>
        <div class="hk-stats">
          <div class="hk-stats-item"><div class="label">HK</div><div class="value">${hk.hk}</div></div>
          <div class="hk-stats-item"><div class="label">HL</div><div class="value">${hk.hl}</div></div>
          <div class="hk-stats-item"><div class="label">HW</div><div class="value">${hk.hw}</div></div>
          <div class="hk-stats-item"><div class="label">OFF</div><div class="value">${hk.off}</div></div>
        </div>
      </td>
      ${cells}
    </tr>`;
  }).join('');

  attachInlineEdit();

  const editSection     = document.getElementById('editSection');
  const downloadSection = document.getElementById('downloadSection');
  if (editSection)     editSection.style.display     = 'grid';
  if (downloadSection) downloadSection.style.display = 'grid';

  const keterangan = document.querySelector('.keterangan');
  if (keterangan) {
    keterangan.textContent = `PENGIRIMAN ABSENSI UNIT ${unit}   ${monthLabel.toUpperCase()} ${year}`;
  }

  highlightToday(year, month);
  lockDropdowns();
}

// ===================================================
// HIGHLIGHT TODAY
// ===================================================

function highlightToday(year, month) {
  const today = new Date();
  if (today.getFullYear() !== parseInt(year) ||
      today.getMonth() + 1 !== parseInt(month)) return;

  const todayDate = today.getDate();
  document.querySelectorAll('thead tr:nth-child(3) th').forEach((th, idx) => {
    if (parseInt(th.textContent.trim()) !== todayDate) return;
    th.style.background = '#ff9800';
    th.style.color      = '#fff';
    document.querySelectorAll('tbody tr').forEach(row => {
      const cell = row.cells[idx + 1];
      if (cell) { cell.style.outline = '2px solid #ff9800'; cell.style.outlineOffset = '-2px'; }
    });
  });
}

// ===================================================
// DOWNLOAD
// ===================================================

function getFileName() {
  const unit  = lastUnit || document.getElementById('unitSelect')?.value || 'jadwal';
  const bulan = lastBulan && lastTahun
    ? `${MONTH_NAMES[lastBulan - 1]}_20${lastTahun}`
    : (document.getElementById('bulanSelect')?.options[document.getElementById('bulanSelect').selectedIndex]?.text || '');
  return `Jadwal_${unit}_${bulan}`.replace(/\s/g, '_');
}

function downloadPNG() {
  if (!lastJadwalData) { showError('Belum ada data jadwal.'); return; }
  const canvas  = drawTableToCanvas(lastJadwalData, lastDays);
  const link    = document.createElement('a');
  link.download = getFileName() + '.png';
  link.href     = canvas.toDataURL('image/png');
  link.click();
}

function downloadPDF() {
  if (!lastJadwalData) { showError('Belum ada data jadwal.'); return; }
  if (!window.jspdf)   { showError('Library jsPDF belum dimuat.'); return; }

  const canvas    = drawTableToCanvas(lastJadwalData, lastDays);
  const { jsPDF } = window.jspdf;
  const imgData   = canvas.toDataURL('image/png');
  const imgW = canvas.width, imgH = canvas.height;

  const orientation = imgW > imgH ? 'landscape' : 'portrait';
  const pageW  = orientation === 'landscape' ? 297 : 210;
  const pageH  = orientation === 'landscape' ? 210 : 297;
  const margin = 10;
  const scale  = Math.min(
    (pageW - margin * 2) / (imgW / 3.7795),
    (pageH - margin * 2) / (imgH / 3.7795)
  );
  const finalW = (imgW / 3.7795) * scale;
  const finalH = (imgH / 3.7795) * scale;

  const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  pdf.addImage(imgData, 'PNG', (pageW - finalW) / 2, (pageH - finalH) / 2, finalW, finalH);
  pdf.save(getFileName() + '.pdf');
}

const CANVAS_SHIFT_COLORS = {
  P:   { bg: '#fff3e0', text: '#e65100' },
  S:   { bg: '#e3f2fd', text: '#0d47a1' },
  M:   { bg: '#ede7f6', text: '#4a148c' },
  SM:  { bg: '#f3e5f5', text: '#6a1b9a' },
  P12: { bg: '#ffe0b2', text: '#bf360c' },
  M12: { bg: '#d1c4e9', text: '#311b92' },
  OFF: { bg: '#212121', text: '#ffffff' },
};

function drawTableToCanvas(data, days) {
  const scale      = 2;
  const namaColW   = 180;
  const dayColW    = 44;
  const rowH       = 30;
  const headerH    = rowH * 3;
  const paddingTop = 60;
  const paddingX   = 20;
  const paddingBot = 20;

  // Pakai lastUnit/lastBulan/lastTahun — unitSelect bisa disabled setelah login
  const unit       = lastUnit || document.getElementById('unitSelect')?.value || '';
  const year       = lastTahun ? '20' + lastTahun : '2026';
  const month      = String(lastBulan || '1').padStart(2, '0');
  const monthLabel = MONTH_NAMES[(lastBulan || 1) - 1];

  const totalW = paddingX + namaColW + dayColW * days + paddingX;
  const totalH = paddingTop + headerH + rowH * data.length + paddingBot;

  const canvas  = document.createElement('canvas');
  canvas.width  = totalW * scale;
  canvas.height = totalH * scale;
  const ctx     = canvas.getContext('2d');
  ctx.scale(scale, scale);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalW, totalH);

  ctx.fillStyle    = '#1976d2';
  ctx.font         = 'bold 16px Poppins, sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`PENGIRIMAN ABSENSI UNIT ${unit} BULAN ${monthLabel} ${year}`, totalW / 2, 32);

  const startX = paddingX;
  const startY = paddingTop;

  function drawCell(x, y, w, h, bg, color, text, bold) {
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle    = color;
    ctx.font         = `${bold ? 'bold ' : ''}10px Poppins, sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(text), x + w / 2, y + h / 2);
  }

  drawCell(startX, startY, namaColW, headerH, '#1565c0', '#fff', 'NAMA', true);
  drawCell(startX + namaColW, startY, dayColW * days, rowH,
    '#1976d2', '#fff', `PENGIRIMAN ABSENSI UNIT ${unit}`, true);

  for (let i = 1; i <= days; i++) {
    const date      = new Date(year, parseInt(month) - 1, i);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const bg        = isWeekend ? '#ff6b6b' : '#1976d2';
    const x         = startX + namaColW + (i - 1) * dayColW;
    drawCell(x, startY + rowH,     dayColW, rowH, bg, '#fff', HARI_NAMES[date.getDay()], true);
    drawCell(x, startY + rowH * 2, dayColW, rowH, bg, '#fff', i, true);
  }

  data.forEach((person, ri) => {
    const y     = startY + headerH + ri * rowH;
    const rowBg = ri % 2 === 1 ? '#f8f9ff' : '#ffffff';

    ctx.fillStyle = rowBg;
    ctx.fillRect(startX, y, namaColW, rowH);
    ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 0.5;
    ctx.strokeRect(startX, y, namaColW, rowH);
    ctx.strokeStyle = '#1976d2'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX + namaColW, y);
    ctx.lineTo(startX + namaColW, y + rowH);
    ctx.stroke();
    ctx.fillStyle    = '#1a1a1a';
    ctx.font         = 'bold 9px Poppins, sans-serif';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(person.nama, startX + 8, y + rowH / 2);

    for (let i = 1; i <= days; i++) {
      const shift = person[`day${i}`] || '';
      const col   = CANVAS_SHIFT_COLORS[shift] || { bg: rowBg, text: '#333' };
      const x     = startX + namaColW + (i - 1) * dayColW;

      ctx.fillStyle = rowBg;
      ctx.fillRect(x, y, dayColW, rowH);
      ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, dayColW, rowH);

      if (shift) {
        const bx = x + 4, by = y + 6, bw = dayColW - 8, bh = rowH - 12;
        ctx.fillStyle = col.bg;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 3);
        else ctx.rect(bx, by, bw, bh);
        ctx.fill();
        ctx.fillStyle    = col.text;
        ctx.font         = '9px Poppins, sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(shift, x + dayColW / 2, y + rowH / 2);
      }
    }
  });

  return canvas;
}

function handleDownload() {
  if (!lastJadwalData) { window.print(); return; }
  downloadPNG();
}

// ===================================================
// CLEAR & LOCK
// ===================================================

function clearTabel() {
  const thead      = document.getElementById('tableThead') || document.querySelector('table thead');
  const tbody      = document.querySelector('table tbody');
  const colgroup   = document.querySelector('table colgroup');
  const keterangan = document.querySelector('.keterangan');

  if (thead)    thead.innerHTML    = '';
  if (tbody)    { tbody.innerHTML = ''; tbody.classList.remove('edit-active'); }
  if (colgroup) colgroup.innerHTML = '<col class="col-nama">';
  if (keterangan) keterangan.textContent = 'Silakan pilih bulan dan unit kerja';

  document.getElementById('downloadSection')?.style.setProperty('display', 'none');
  document.getElementById('editSection')?.style.setProperty('display', 'none');

  isEditMode     = false;
  lastJadwalData = null;
  lastDays       = 0;
  lastHkData     = {};
}

function lockDropdowns() {
  document.getElementById('bulanBtn')?.setAttribute('disabled', true);
  document.getElementById('unitBtn')?.setAttribute('disabled', true);
  document.getElementById('bulanSelect')?.setAttribute('disabled', true);
  document.getElementById('unitSelect')?.setAttribute('disabled', true);

  document.getElementById('resetBulanBtn')?.style.setProperty('display', 'flex');
  document.getElementById('resetUnitBtn')?.style.setProperty('display', 'flex');
}

function resetUnit() {
  const unitLabel = document.getElementById('unitLabel')?.textContent || 'unit ini';
  const sedangEdit = typeof isInEditMode === 'function' && isInEditMode();
  const pesan = sedangEdit
    ? `Anda sedang dalam mode edit. Perubahan akan hilang jika menutup ${unitLabel}.`
    : `Tutup jadwal ${unitLabel}?`;

  showConfirm({
    title     : `Tutup ${unitLabel}?`,
    message   : pesan,
    icon      : '⚠️',
    okText    : 'Ya, Tutup',
    cancelText: 'Batal',
    okClass   : 'btn-confirm-ok btn-confirm-danger',
    onOk      : () => {
      if (sedangEdit) {
        // Kembalikan data ke awal sebelum tutup
        if (typeof restoreToSnapshot === 'function') {
          restoreToSnapshot().then(() => doResetUnit());
        } else {
          if (typeof exitEditMode === 'function') exitEditMode();
          doResetUnit();
        }
      } else {
        doResetUnit();
      }
    }
  });
}

function doResetUnit() {
  resetUnitSelection();
  const unitBtn = document.getElementById('unitBtn');
  if (unitBtn) unitBtn.disabled = false;
  clearTabel();
}

function resetBulan() {
  const bulanLabel = document.getElementById('bulanLabel')?.textContent || 'bulan ini';
  const sedangEdit = typeof isInEditMode === 'function' && isInEditMode();
  const pesan = sedangEdit
    ? `Anda sedang dalam mode edit. Perubahan akan hilang jika menutup ${bulanLabel}.`
    : `Tutup jadwal ${bulanLabel}?`;

  showConfirm({
    title     : `Tutup ${bulanLabel}?`,
    message   : pesan,
    icon      : '⚠️',
    okText    : 'Ya, Tutup',
    cancelText: 'Batal',
    okClass   : 'btn-confirm-ok btn-confirm-danger',
    onOk      : () => {
      if (sedangEdit) {
        // Kembalikan data ke awal sebelum tutup
        if (typeof restoreToSnapshot === 'function') {
          restoreToSnapshot().then(() => doResetBulan());
        } else {
          if (typeof exitEditMode === 'function') exitEditMode();
          doResetBulan();
        }
      } else {
        doResetBulan();
      }
    }
  });
}

function doResetBulan() {
  const lbl = document.getElementById('bulanLabel');
  if (lbl) { lbl.textContent = 'Pilih Bulan'; lbl.classList.add('placeholder'); }
  document.getElementById('bulanSelect')?.removeAttribute('disabled');
  document.getElementById('bulanBtn')?.removeAttribute('disabled');
  document.querySelectorAll('.bulan-item').forEach(el => el.classList.remove('active'));
  document.getElementById('resetBulanBtn')?.style.setProperty('display', 'none');

  resetUnitSelection();
  const unitBtn = document.getElementById('unitBtn');
  if (unitBtn) unitBtn.disabled = true;

  clearTabel();
}

function attachRowHover() {
  const table = document.querySelector('table');
  if (!table) return;
  table.addEventListener('mouseover', e => {
    const row = e.target.closest('tbody tr');
    if (row) row.style.filter = 'brightness(0.93)';
  });
  table.addEventListener('mouseout', e => {
    const row = e.target.closest('tbody tr');
    if (row) row.style.filter = '';
  });
}

// ===================================================
// INIT
// ===================================================

window.addEventListener('load', () => {
  if (loadSessionAuth()) initSessionAuth();

  document.getElementById('downloadBtn')
    ?.addEventListener('click', handleDownload);

  attachRowHover();

  document.getElementById('bulanLabel')?.classList.add('placeholder');
  document.getElementById('unitLabel')?.classList.add('placeholder');

  updateKeterangan();

  if (typeof API_URL !== 'undefined' && typeof MODE !== 'undefined') {
    loadAvailableMonths();
  }
});