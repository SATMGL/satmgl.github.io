/* ═══════════════════════════════════════════
   EDIT JADWAL
   Bergantung pada variabel global dari
   jadwal-absensi.js:
     GS_URL, MODE, selectedBulan, selectedUnit
═══════════════════════════════════════════ */
let modeEdit    = false;
let dataAsli    = [];
let tdAktif     = null; // cell yang sedang dipilih
let _undoStack  = [];   // history perubahan
let _redoStack  = [];   // history redo

const SHIFT_WEEKDAY  = ['P', 'S', 'M', 'OFF', 'CUTI'];
const SHIFT_WEEKEND  = ['P12', 'M12', 'OFF', 'CUTI'];

const SHIFT_COLOR = {
  'P'   : '#e3f2fd',
  'S'   : '#fff9c4',
  'M'   : '#fce4ec',
  'P12' : '#e8f5e9',
  'M12' : '#f3e5f5',
  'OFF' : '#f5f5f5',
  'CUTI': '#fff3e0',
  ''    : '#fff'
};

/* ── Popup shift ─────────────────────────── */
function _buatPopup() {
  if (document.getElementById('shift-popup')) return;
  const popup = document.createElement('div');
  popup.id = 'shift-popup';
  popup.style.cssText = `
    position: fixed;
    display: none;
    z-index: 999;
    background: #fff;
    border: 2px solid #000;
    font-family: 'Caveat', cursive;
    box-shadow: 4px 4px 0 #111;
  `;
  document.body.appendChild(popup);

  // Tutup popup saat klik di luar
  document.addEventListener('mousedown', function(e) {
    if (!popup.contains(e.target) && e.target !== tdAktif) {
      _tutupPopup();
    }
  });
}

function _tampilPopup(td, shifts) {
  tdAktif = td;
  const popup  = document.getElementById('shift-popup');
  const nilaiSaat = td.textContent.trim().toUpperCase();

  popup.innerHTML = shifts.map(s => `
    <button
      onclick="pilihShift('${s}')"
      style="
        display: block;
        width: 100%;
        padding: 0.8vh 2vw;
        border: none;
        border-bottom: 1px solid #eee;
        background: ${s === nilaiSaat ? '#000' : SHIFT_COLOR[s] || '#fff'};
        color: ${s === nilaiSaat ? '#fff' : '#000'};
        font-family: 'Caveat', cursive;
        font-size: clamp(11px, 1.9vh, 15px);
        cursor: pointer;
        text-align: center;
        letter-spacing: 0.05em;
      "
      onmouseover="if('${s}' !== '${nilaiSaat}'){this.style.background='#000';this.style.color='#fff'}"
      onmouseout="if('${s}' !== '${nilaiSaat}'){this.style.background='${SHIFT_COLOR[s] || '#fff'}';this.style.color='#000'}"
    >${s || '—'}</button>
  `).join('') + `
    <button
      onclick="pilihShift('')"
      style="
        display: block;
        width: 100%;
        padding: 0.8vh 2vw;
        border: none;
        background: ${nilaiSaat === '' ? '#000' : '#fff'};
        color: ${nilaiSaat === '' ? '#fff' : '#888'};
        font-family: 'Caveat', cursive;
        font-size: clamp(11px, 1.9vh, 15px);
        cursor: pointer;
        text-align: center;
      "
      onmouseover="this.style.background='#000';this.style.color='#fff'"
      onmouseout="this.style.background='${nilaiSaat === '' ? '#000' : '#fff'}';this.style.color='${nilaiSaat === '' ? '#fff' : '#888'}'"
    >— KOSONG —</button>
  `;

  // Posisi popup dekat cell
  const rect    = td.getBoundingClientRect();
  const popupW  = 120;
  let   left    = rect.left;
  let   top     = rect.bottom + 4;

  // Cegah keluar layar kanan
  if (left + popupW > window.innerWidth - 8) left = window.innerWidth - popupW - 8;
  // Cegah keluar layar bawah
  const popupH  = shifts.length * 36 + 36;
  if (top + popupH > window.innerHeight - 8) top = rect.top - popupH - 4;

  popup.style.left    = left + 'px';
  popup.style.top     = top  + 'px';
  popup.style.width   = popupW + 'px';
  popup.style.display = 'block';
}

function _tutupPopup() {
  const popup = document.getElementById('shift-popup');
  if (popup) popup.style.display = 'none';
  if (tdAktif) {
    tdAktif.style.outline = '';
    tdAktif = null;
  }
}

function pilihShift(nilai) {
  if (!tdAktif) return;
  const td    = tdAktif;
  const col   = parseInt(td.dataset.col);
  const tbody = document.getElementById('tbody-data');

  // Hitung pIdx (hanya baris yang tampil)
  let pIdx = 0;
  let found = false;
  tbody.querySelectorAll('tr').forEach((tr) => {
    if (found) return;
    if (tr.style.display === 'none') return;
    if (tr.contains(td)) { found = true; return; }
    pIdx++;
  });

  // jIdx = 0-based index tanggal, sesuai mapping GS (col D=4 = tanggal 1 = jIdx 0)
  const jIdx = col - 1;

  // Simpan nilai sebelumnya untuk undo
  const nilaiBefore = td.textContent.trim();

  // Update UI dulu
  td.textContent      = nilai;
  td.style.background = SHIFT_COLOR[nilai] || '#fff';
  _tutupPopup();

  // Push ke undo stack, reset redo stack
  _undoStack.push({ td, pIdx, col, nilaiBefore, nilaiAfter: nilai });
  _redoStack = [];
  _updateUndoRedoBtn();

  // Tandai cell sedang saving
  td.style.opacity = '0.5';

  // Kirim saveSingleCell ke GS
  // GS: row = startRow+3+pIdx, dimana personil pertama ada di startRow+4
  // maka pIdx yang dikirim = pIdx + 1
  const url = GS_URL + '?' + new URLSearchParams({
    action : 'saveSingleCell',
    mode   : MODE,
    bulan  : selectedBulan.value,
    tahun  : selectedBulan.tahun,
    unit   : selectedUnit,
    pIdx   : pIdx + 1,
    jIdx,
    value  : nilai
  }).toString();

  fetch(url)
    .then(r => r.json())
    .then(result => {
      td.style.opacity = '1';
      if (!result.success) {
        // Rollback UI jika gagal
        const nilaiLama = (dataAsli[pIdx] && dataAsli[pIdx][col - 1]) || '';
        td.textContent      = nilaiLama;
        td.style.background = SHIFT_COLOR[nilaiLama] || '#fffde7';
        alert('Gagal simpan: ' + result.message);
      }
      // dataAsli TIDAK diupdate — tetap snapshot saat masuk mode edit
      // agar batalEdit() selalu bisa rollback ke kondisi awal
    })
    .catch(err => {
      td.style.opacity = '1';
      console.error('saveSingleCell error:', err);
    });
}

/* ── Mode Edit ───────────────────────────── */
function editJadwal() {
  if (modeEdit) return;
  modeEdit = true;
  _buatPopup();
  if (typeof _pushState === 'function') _pushState('edit');

  // Backup data asli
  dataAsli = [];
  const tbody    = document.getElementById('tbody-data');
  let pIdxBackup = 0;
  tbody.querySelectorAll('tr').forEach((tr) => {
    if (tr.style.display === 'none') return;
    const baris = [];
    tr.querySelectorAll('td.col-hari').forEach(td => {
      const col = parseInt(td.dataset.col);
      baris[col - 1] = td.textContent;
    });
    dataAsli[pIdxBackup] = baris;
    pIdxBackup++;
  });

  // Pasang listener klik pada cell jadwal
  const hari = new Date(parseInt(selectedBulan.tahun), selectedBulan.value, 0).getDate();
  tbody.querySelectorAll('tr').forEach((tr) => {
    if (tr.style.display === 'none') return;
    tr.querySelectorAll('td.col-hari').forEach((td) => {
      const col     = parseInt(td.dataset.col);
      if (col > hari) return;

      // Warnai cell sesuai nilai saat ini
      td.style.background = SHIFT_COLOR[td.textContent.trim()] || '#fffde7';
      td.style.cursor     = 'pointer';
      td.style.outline    = 'none';

      td.addEventListener('click', _onCellClick);
    });
  });

  // Ubah tombol jadi SIMPAN & BATAL
  _tampilTombolSimpanBatalUI();

  // Kunci tombol bulan & unit
  document.getElementById('btn-bulan').disabled = true;
  document.getElementById('btn-unit').disabled  = true;
  document.getElementById('x-bulan').style.pointerEvents = 'none';
  document.getElementById('x-unit').style.pointerEvents  = 'none';
}

function _onCellClick(e) {
  e.stopPropagation();
  const td  = e.currentTarget;
  const col = parseInt(td.dataset.col);

  // Tentukan hari (0=Min, 1=Sen, ... 6=Sab)
  const hariAngka = new Date(parseInt(selectedBulan.tahun), selectedBulan.value - 1, col).getDay();
  const isWeekend = hariAngka === 0 || hariAngka === 6;
  const shifts    = isWeekend ? SHIFT_WEEKEND : SHIFT_WEEKDAY;

  // Highlight cell aktif
  if (tdAktif && tdAktif !== td) {
    tdAktif.style.outline = '';
  }
  td.style.outline = '2px solid #000';

  _tampilPopup(td, shifts);
}

/* ── Simpan ──────────────────────────────── */
async function simpanJadwal() {
  _tutupPopup();

  // Cek apakah ada perubahan
  const tbody  = document.getElementById('tbody-data');
  const hari   = new Date(parseInt(selectedBulan.tahun), selectedBulan.value, 0).getDate();
  let adaPerubahan = false;
  let pChk = 0;
  tbody.querySelectorAll('tr').forEach((tr) => {
    if (adaPerubahan) return;
    if (tr.style.display === 'none') return;
    tr.querySelectorAll('td.col-hari').forEach((td) => {
      if (adaPerubahan) return;
      const col = parseInt(td.dataset.col);
      if (col > hari) return;
      const nilaiAsli = (dataAsli[pChk] && dataAsli[pChk][col - 1]) || '';
      if (td.textContent.trim() !== nilaiAsli) adaPerubahan = true;
    });
    pChk++;
  });

  keluarModeEdit();
  _tampilToast(adaPerubahan ? '✔ Jadwal berhasil disimpan' : 'Tidak ada perubahan');
}

/* ── Batal ───────────────────────────────── */
function batalEdit() {
  _tutupPopup();

  // Cek apakah ada perubahan dibanding dataAsli
  const tbody  = document.getElementById('tbody-data');
  const hari   = new Date(parseInt(selectedBulan.tahun), selectedBulan.value, 0).getDate();
  let adaPerubahan = false;
  let pChk = 0;
  tbody.querySelectorAll('tr').forEach((tr) => {
    if (adaPerubahan) return;
    if (tr.style.display === 'none') return;
    tr.querySelectorAll('td.col-hari').forEach((td) => {
      if (adaPerubahan) return;
      const col = parseInt(td.dataset.col);
      if (col > hari) return;
      const nilaiAsli = (dataAsli[pChk] && dataAsli[pChk][col - 1]) || '';
      if (td.textContent.trim() !== nilaiAsli) adaPerubahan = true;
    });
    pChk++;
  });

  if (!adaPerubahan) {
    // Tidak ada perubahan, langsung keluar
    keluarModeEdit();
    return;
  }

  // Ada perubahan — tampilkan konfirmasi
  _tampilKonfirmasiBatal();
}

function _tampilKonfirmasiBatal() {
  if (typeof _pushState === 'function') _pushState('konfirmasi-batal');
  // Nonaktifkan klik cell selama konfirmasi
  document.getElementById('tbody-data').querySelectorAll('td.col-hari').forEach(td => {
    td.removeEventListener('click', _onCellClick);
    td.style.pointerEvents = 'none';
    td.style.cursor        = 'default';
  });

  const panelBottom = document.querySelector('.panel-bottom > div');
  panelBottom.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.8vh; height:100%; padding:0.5vh 0; box-sizing:border-box;">
      <span style="font-family:'Caveat',cursive; font-size:clamp(13px,2vh,17px); text-align:center; letter-spacing:0.03em;">
        Semua perubahan yang baru saja dibuat akan dibatalkan.
      </span>
      <div style="display:flex; gap:2vw;">
        <button onclick="_konfirmasiBatalYa()"
          style="height:4vh; padding:0 2vw; border:2.5px solid #111; background:#000; color:#fff; font-family:'Caveat',cursive; font-size:clamp(13px,2vh,17px); cursor:pointer; letter-spacing:0.05em; white-space:nowrap;"
          onmouseover="this.style.background='#333'"
          onmouseout="this.style.background='#111'">Ya, Batalkan</button>
        <button onclick="_konfirmasiBatalTidak()"
          style="height:4vh; padding:0 2vw; border:2.5px solid #111; background:transparent; font-family:'Caveat',cursive; font-size:clamp(13px,2vh,17px); cursor:pointer; letter-spacing:0.05em; white-space:nowrap;"
          onmouseover="this.style.background='#000';this.style.color='#fff'"
          onmouseout="this.style.background='transparent';this.style.color='#111';this.style.transform='';this.style.boxShadow='3px 3px 0 #111'">Lanjut Edit</button>
      </div>
    </div>
  `;
}

function _konfirmasiBatalYa() {
  // Rollback UI ke dataAsli lalu keluar
  const tbody = document.getElementById('tbody-data');
  const hari  = new Date(parseInt(selectedBulan.tahun), selectedBulan.value, 0).getDate();
  let pIdx = 0;
  tbody.querySelectorAll('tr').forEach((tr) => {
    if (tr.style.display === 'none') return;
    tr.querySelectorAll('td.col-hari').forEach((td) => {
      const col = parseInt(td.dataset.col);
      if (col > hari) return;
      td.textContent      = (dataAsli[pIdx] && dataAsli[pIdx][col - 1]) || '';
      td.style.background = SHIFT_COLOR[td.textContent.trim()] || '#fffde7';
    });
    pIdx++;
  });
  keluarModeEdit();
}

function _konfirmasiBatalTidak() {
  // Aktifkan kembali klik cell
  const hari = new Date(parseInt(selectedBulan.tahun), selectedBulan.value, 0).getDate();
  document.getElementById('tbody-data').querySelectorAll('tr').forEach(tr => {
    if (tr.style.display === 'none') return;
    tr.querySelectorAll('td.col-hari').forEach(td => {
      const col = parseInt(td.dataset.col);
      if (col > hari) return;
      td.style.pointerEvents = '';
      td.style.cursor        = 'pointer';
      td.addEventListener('click', _onCellClick);
    });
  });
  // Kembali ke tampilan tombol SELESAI & BATAL
  _tampilTombolSimpanBatalUI();
}


/* ── Undo / Redo ─────────────────────────── */
function _updateUndoRedoBtn() {
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  if (!btnUndo || !btnRedo) return;

  const bisaUndo = _undoStack.length > 0;
  const bisaRedo = _redoStack.length > 0;

  btnUndo.disabled = !bisaUndo;
  btnUndo.style.opacity = bisaUndo ? '1'    : '0.35';
  btnUndo.style.cursor  = bisaUndo ? 'pointer' : 'not-allowed';

  btnRedo.disabled = !bisaRedo;
  btnRedo.style.opacity = bisaRedo ? '1'    : '0.35';
  btnRedo.style.cursor  = bisaRedo ? 'pointer' : 'not-allowed';
}

function _terapkanNilai(td, pIdx, col, nilai) {
  // Update UI
  td.textContent      = nilai;
  td.style.background = SHIFT_COLOR[nilai] || '#fff';
  td.style.opacity    = '0.5';

  // Kirim ke GS
  const jIdx = col - 1;
  const url  = GS_URL + '?' + new URLSearchParams({
    action : 'saveSingleCell',
    mode   : MODE,
    bulan  : selectedBulan.value,
    tahun  : selectedBulan.tahun,
    unit   : selectedUnit,
    pIdx   : pIdx + 1,
    jIdx,
    value  : nilai
  }).toString();

  fetch(url)
    .then(r => r.json())
    .then(result => {
      td.style.opacity = '1';
      if (!result.success) {
        alert('Gagal simpan: ' + result.message);
      }
    })
    .catch(() => { td.style.opacity = '1'; });
}

function aksiUndo() {
  if (_undoStack.length === 0) return;
  const aksi = _undoStack.pop();
  _redoStack.push(aksi);
  _terapkanNilai(aksi.td, aksi.pIdx, aksi.col, aksi.nilaiBefore);
  _updateUndoRedoBtn();
}

function aksiRedo() {
  if (_redoStack.length === 0) return;
  const aksi = _redoStack.pop();
  _undoStack.push(aksi);
  _terapkanNilai(aksi.td, aksi.pIdx, aksi.col, aksi.nilaiAfter);
  _updateUndoRedoBtn();
}
/* ── Keluar mode edit ────────────────────── */
function keluarModeEdit() {
  modeEdit    = false;
  dataAsli    = [];
  _undoStack  = [];
  _redoStack  = [];

  // Lepas listener & reset style cell
  const tbody = document.getElementById('tbody-data');
  tbody.querySelectorAll('td.col-hari').forEach(td => {
    td.removeEventListener('click', _onCellClick);
    td.style.background = '';
    td.style.cursor     = '';
    td.style.outline    = '';
  });

  // Sembunyikan popup
  const popup = document.getElementById('shift-popup');
  if (popup) popup.style.display = 'none';

  // Kembalikan tombol DOWNLOAD & EDIT JADWAL
  document.querySelector('.panel-bottom > div').innerHTML = `
    <button id="btn-download" onclick="downloadJadwal()" style="width:25vw; height:5vh; border:2.5px solid #111; background:transparent; font-family:'Caveat',cursive; font-size:clamp(14px,2.4vh,20px); cursor:pointer; letter-spacing:0.05em; white-space:nowrap; overflow:hidden;" onmouseover="this.style.background='#000';this.style.color='#fff'" onmouseout="this.style.background='transparent';this.style.color='#111';this.style.transform='';this.style.boxShadow='3px 3px 0 #111'">⬇ DOWNLOAD</button>
    <button id="btn-edit" onclick="editJadwal()" style="width:25vw; height:5vh; border:2.5px solid #111; background:transparent; font-family:'Caveat',cursive; font-size:clamp(14px,2.4vh,20px); cursor:pointer; letter-spacing:0.05em; white-space:nowrap; overflow:hidden;" onmouseover="this.style.background='#000';this.style.color='#fff'" onmouseout="this.style.background='transparent';this.style.color='#111';this.style.transform='';this.style.boxShadow='3px 3px 0 #111'">✎ EDIT JADWAL</button>
  `;

  // Buka kembali tombol bulan & unit
  document.getElementById('btn-bulan').disabled = false;
  document.getElementById('btn-unit').disabled  = false;
  document.getElementById('x-bulan').style.pointerEvents = '';
  document.getElementById('x-unit').style.pointerEvents  = '';
}

/* ── Helper UI tombol simpan/batal ──────── */
function _tampilTombolSimpanBatalUI(pesan) {
  const panelBottom = document.querySelector('.panel-bottom > div');
  panelBottom.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:center; gap:1.5vw; height:100%; box-sizing:border-box; flex-wrap:nowrap;">
      ${pesan ? `<span style="font-family:'Caveat',cursive; font-size:2vh; color:red;">${pesan}</span>` : ''}
      <button id="btn-undo"
        onclick="aksiUndo()"
        disabled
        style="height:5vh; padding:0 1.5vw; border:2.5px solid #111; background:transparent; font-family:'Caveat',cursive; font-size:clamp(14px,2.4vh,20px); cursor:not-allowed; opacity:0.35; letter-spacing:0.05em; white-space:nowrap;"
        onmouseover="if(!this.disabled){this.style.background='#000';this.style.color='#fff'}"
        onmouseout="this.style.background='transparent';this.style.color='#111';this.style.transform='';this.style.boxShadow='3px 3px 0 #111'">↩ UNDO</button>
      <button id="btn-redo"
        onclick="aksiRedo()"
        disabled
        style="height:5vh; padding:0 1.5vw; border:2.5px solid #111; background:transparent; font-family:'Caveat',cursive; font-size:clamp(14px,2.4vh,20px); cursor:not-allowed; opacity:0.35; letter-spacing:0.05em; white-space:nowrap;"
        onmouseover="if(!this.disabled){this.style.background='#000';this.style.color='#fff'}"
        onmouseout="this.style.background='transparent';this.style.color='#111';this.style.transform='';this.style.boxShadow='3px 3px 0 #111'">↪ REDO</button>
      <button onclick="simpanJadwal()"
        style="height:5vh; padding:0 1.5vw; border:2.5px solid #111; background:#000; color:#fff; font-family:'Caveat',cursive; font-size:clamp(14px,2.4vh,20px); cursor:pointer; letter-spacing:0.05em; white-space:nowrap;"
        onmouseover="this.style.background='#333'"
        onmouseout="this.style.background='#111'">✔ SELESAI</button>
      <button onclick="batalEdit()"
        style="height:5vh; padding:0 1.5vw; border:2.5px solid #111; background:transparent; font-family:'Caveat',cursive; font-size:clamp(14px,2.4vh,20px); cursor:pointer; letter-spacing:0.05em; white-space:nowrap;"
        onmouseover="this.style.background='#000';this.style.color='#fff'"
        onmouseout="this.style.background='transparent';this.style.color='#111';this.style.transform='';this.style.boxShadow='3px 3px 0 #111'">✕ BATAL</button>
    </div>
  `;
}

/* ── Toast notifikasi ────────────────────── */
function _tampilToast(pesan) {
  let toast = document.getElementById('edit-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'edit-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 12vh;
      left: 50%;
      transform: translateX(-50%) translateY(10px);
      background: #111;
      color: #fffef5;
      font-family: 'Caveat', cursive;
      font-size: clamp(12px, 1.9vh, 16px);
      letter-spacing: 0.08em;
      padding: 1.2vh 3vw;
      border: 2px solid #000;
      white-space: nowrap;
      z-index: 9998;
      opacity: 0;
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = pesan;
  // Muncul
  requestAnimationFrame(() => {
    toast.style.opacity   = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  // Hilang setelah 2.5 detik
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
  }, 2500);
}
