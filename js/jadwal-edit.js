// =====================================================================
// STATE EDIT
// =====================================================================
let modeEdit        = false;
let dataSebelumEdit = [];   // snapshot jadwal saat MASUK mode edit
let undoStack       = [];   // [{pIdx, jIdx, dari, ke}]
let redoStack       = [];

// =====================================================================
// EDIT JADWAL — masuk mode edit
// =====================================================================
function editJadwal() {
  if (modeEdit) return;
  modeEdit = true;

  // Snapshot semua nilai sel saat ini
  dataSebelumEdit = [];
  document.querySelectorAll('#tbody-data tr').forEach((tr, pIdx) => {
    dataSebelumEdit[pIdx] = [];
    tr.querySelectorAll('td.col-hari').forEach((td, jIdx) => {
      dataSebelumEdit[pIdx][jIdx] = td.textContent.trim();
    });
  });

  undoStack = [];
  redoStack = [];

  // Ganti tombol EDIT → SIMPAN
  const btnEdit = document.getElementById('btn-edit');
  btnEdit.textContent = '✔ SIMPAN';
  btnEdit.onclick     = () => konfirmasiSimpan();
  btnEdit.onmouseover = () => { btnEdit.style.background = '#000'; btnEdit.style.color = '#fff'; };
  btnEdit.onmouseout  = () => { btnEdit.style.background = 'transparent'; btnEdit.style.color = '#000'; };

  // Ganti tombol DOWNLOAD → BATAL
  const btnDownload = document.getElementById('btn-download');
  btnDownload.textContent = '✕ BATAL';
  btnDownload.onclick     = () => konfirmasiBatalEdit();
  btnDownload.onmouseover = () => { btnDownload.style.background = '#000'; btnDownload.style.color = '#fff'; };
  btnDownload.onmouseout  = () => { btnDownload.style.background = 'transparent'; btnDownload.style.color = '#000'; };

  // Tampilkan UNDO / REDO (sudah ada di HTML, tinggal show)
  _tampilUndoRedo();

  // Kunci pilih bulan & unit
  setBtnBulanAktif(false);
  setBtnUnitAktif(false);

  // Aktifkan border kedip merah
  document.querySelector('.jadwal')?.classList.add('mode-edit');

  // Pasang event klik pada setiap sel hari
  document.querySelectorAll('#tbody-data tr').forEach((tr, pIdx) => {
    tr.querySelectorAll('td.col-hari').forEach((td, jIdx) => {
      td.style.cursor = 'pointer';
      td.onclick = () => tampilModalNilai(td, pIdx, jIdx);
    });
  });
}

// =====================================================================
// TAMPIL / SEMBUNYIKAN UNDO-REDO
// wrap-undo-redo sudah ada di HTML dengan display:none
// =====================================================================
function _tampilUndoRedo() {
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  if (btnUndo) btnUndo.style.visibility = 'visible';
  if (btnRedo) btnRedo.style.visibility = 'visible';
  _updateUndoRedo();
}

function _sembunyiUndoRedo() {
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  if (btnUndo) { btnUndo.style.visibility = 'hidden'; btnUndo.disabled = true; btnUndo.style.opacity = '0.4'; btnUndo.style.cursor = 'not-allowed'; btnUndo.style.background = '#fff'; btnUndo.style.color = '#000'; }
  if (btnRedo) { btnRedo.style.visibility = 'hidden'; btnRedo.disabled = true; btnRedo.style.opacity = '0.4'; btnRedo.style.cursor = 'not-allowed'; btnRedo.style.background = '#fff'; btnRedo.style.color = '#000'; }
}

function _updateUndoRedo() {
  _setUndoRedoBtn('btn-undo', undoStack.length > 0);
  _setUndoRedoBtn('btn-redo', redoStack.length > 0);
}

function _setUndoRedoBtn(id, aktif) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled      = !aktif;
  btn.style.opacity = aktif ? '1' : '0.4';
  btn.style.cursor  = aktif ? 'pointer' : 'not-allowed';
  btn.onmouseover   = () => { if (aktif) { btn.style.background = '#000'; btn.style.color = '#fff'; } };
  btn.onmouseout    = () => { btn.style.background = '#fff'; btn.style.color = '#000'; };
}

// =====================================================================
// UNDO — kembalikan perubahan terakhir
// =====================================================================
async function lakukanUndo() {
  if (undoStack.length === 0) return;
  const aksi = undoStack.pop();
  redoStack.push(aksi);
  _terapkanNilai(aksi.pIdx, aksi.jIdx, aksi.dari);
  _updateUndoRedo();
  await _simpanSel(aksi.pIdx, aksi.jIdx, aksi.dari);
}

// =====================================================================
// REDO — terapkan ulang perubahan yang sudah di-undo
// =====================================================================
async function lakukanRedo() {
  if (redoStack.length === 0) return;
  const aksi = redoStack.pop();
  undoStack.push(aksi);
  _terapkanNilai(aksi.pIdx, aksi.jIdx, aksi.ke);
  _updateUndoRedo();
  await _simpanSel(aksi.pIdx, aksi.jIdx, aksi.ke);
}

// =====================================================================
// MODAL PILIH NILAI SEL
// =====================================================================
function tampilModalNilai(td, pIdx, jIdx) {
  const existing = document.getElementById('modal-nilai-overlay');
  if (existing) existing.remove();

  const thHari       = document.querySelectorAll('#tr-hari th.col-hari')[jIdx];
  const namaHari     = thHari ? thHari.textContent.trim() : '';
  const isWeekend    = HARI_WEEKEND.includes(namaHari);
  const nilaiList    = isWeekend ? NILAI_WEEKEND : NILAI_WEEKDAY[MODE];
  const nilaiSaat    = td.textContent.trim();

  const namaTd       = td.closest('tr')?.querySelector('.nama-text');
  const namaPersonil = namaTd ? namaTd.textContent.trim() : '';
  const thTgl        = document.querySelectorAll('#tr-tanggal th.col-hari')[jIdx];
  const tglLabel     = thTgl ? `${namaHari} ${thTgl.textContent}` : '';

  // Semua pilihan + opsi kosong
  const semuaNilai = [...nilaiList, ''];

  const tombolHTML = semuaNilai.map(n => {
    const label    = n === '' ? '— KOSONG —' : n;
    const terpilih = n === nilaiSaat;
    return `
      <button class="btn-nilai" data-nilai="${n}"
        style="height:clamp(32px,5.5vh,52px); border:2px solid #000;
        background:${terpilih ? '#000' : '#fff'}; color:${terpilih ? '#fff' : '#000'};
        font-family:'Share Tech Mono',monospace; font-size:clamp(10px,1.8vh,15px); cursor:pointer; letter-spacing:0.05em;"
        onmouseover="if(!this.dataset.terpilih)this.style.background='#f0f0f0'"
        onmouseout="if(!this.dataset.terpilih)this.style.background='${terpilih ? '#000' : '#fff'}'"
        ${terpilih ? 'data-terpilih="1"' : ''}>
        ${label}
      </button>`;
  }).join('');

  const overlay = document.createElement('div');
  overlay.id = 'modal-nilai-overlay';
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.45);
    z-index:300; display:flex; align-items:center; justify-content:center;
  `;
  overlay.innerHTML = `
    <div style="background:#fff; border:2px solid #000; width:clamp(240px,50vw,500px); font-family:'Share Tech Mono',monospace;">
      <div style="min-height:5vh; border-bottom:2px solid #000; display:flex; align-items:center;
        justify-content:center; position:relative; padding:0.8vh 5vh 0.8vh 1vh; box-sizing:border-box;">
        <span style="font-weight:bold; font-size:clamp(10px,1.6vh,14px); text-align:center; line-height:1.4;">${namaPersonil} — ${tglLabel}</span>
        <button onclick="document.getElementById('modal-nilai-overlay').remove()"
          style="position:absolute; right:0; top:0; height:100%; width:5vh; border:none;
          border-left:2px solid #000; background:transparent; font-family:'Share Tech Mono',monospace;
          font-size:2vh; cursor:pointer;"
          onmouseover="this.style.background='#000';this.style.color='#fff'"
          onmouseout="this.style.background='transparent';this.style.color='#000'">✕</button>
      </div>
      <div style="padding:1.5vh; display:grid; grid-template-columns:1fr 1fr 1fr; gap:1vh;
        max-height:55vh; overflow-y:auto; overflow-x:hidden; box-sizing:border-box;">
        ${tombolHTML}
      </div>
      <div style="height:5vh; border-top:2px solid #000; display:flex; align-items:center; justify-content:center;">
        <button onclick="document.getElementById('modal-nilai-overlay').remove()"
          style="border:2px solid #000; background:#fff; padding:0.5vh 3vw;
          font-family:'Share Tech Mono',monospace; font-size:2vh; cursor:pointer;">BATAL</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Event klik pilihan nilai
  overlay.querySelectorAll('.btn-nilai').forEach(btn => {
    btn.addEventListener('click', async () => {
      const nilai     = btn.dataset.nilai;
      const nilaiLama = td.textContent.trim();
      overlay.remove();
      if (nilai === nilaiLama) return;

      _terapkanNilai(pIdx, jIdx, nilai);
      undoStack.push({ pIdx, jIdx, dari: nilaiLama, ke: nilai });
      redoStack = [];
      _updateUndoRedo();
      await _simpanSel(pIdx, jIdx, nilai);
    });
  });
}

// =====================================================================
// TERAPKAN NILAI KE SEL + UPDATE HK GRID
// =====================================================================
function _terapkanNilai(pIdx, jIdx, nilai) {
  const tr = document.querySelectorAll('#tbody-data tr')[pIdx];
  if (!tr) return;
  const td = tr.querySelectorAll('td.col-hari')[jIdx];
  if (!td) return;

  td.textContent = nilai;

  // Kuning kalau beda dari data asli saat masuk edit
  const asli = dataSebelumEdit[pIdx]?.[jIdx] ?? '';
  td.style.background = nilai !== asli ? '#fffbe6' : '';

  _updateHKRow(tr);
}

function _updateHKRow(tr) {
  const tds      = tr.querySelectorAll('td.col-hari');
  const jadwal   = [];
  const hariList = [];

  tds.forEach((td, i) => {
    jadwal.push(td.textContent.trim());
    const thH = document.querySelectorAll('#tr-hari th.col-hari')[i];
    hariList.push(thH ? thH.textContent.trim() : '');
  });

  const hk    = hitungHK(jadwal, hariList, tds.length);
  const grid  = tr.querySelector('.hk-grid');
  if (!grid) return;
  const vals = grid.querySelectorAll('.hk-item .val');
  if (vals[0]) vals[0].textContent = hk.hk;
  if (vals[1]) vals[1].textContent = hk.hl;
  if (vals[2]) vals[2].textContent = hk.hw;
  if (vals[3]) vals[3].textContent = hk.off;
}

// =====================================================================
// SIMPAN SATU SEL — POST ke GAS
// CORS error hanya di localhost — berjalan normal di server asli
// =====================================================================
async function _simpanSel(pIdx, jIdx, nilai) {
  try {
    await postGS({
      action : 'saveSingleCell',
      mode   : MODE,
      bulan  : selectedBulan.value,
      tahun  : selectedBulan.tahun,
      unit   : selectedUnit,
      pIdx,
      jIdx,
      value  : nilai
    });
  } catch (err) {
    console.warn('Simpan sel gagal (normal jika localhost):', err.message);
  }
}

// =====================================================================
// KONFIRMASI SIMPAN — selesai edit, data sudah tersimpan per sel
// =====================================================================
function konfirmasiSimpan() {
  tampilKonfirmasi(
    'Selesai mengedit jadwal?<br><span style="font-size:1.4vh;color:#555;">Data sudah tersimpan otomatis tiap perubahan.</span>',
    () => selesaiEdit()
  );
}

// =====================================================================
// KONFIRMASI BATAL — tanya sebelum revert
// =====================================================================
function konfirmasiBatalEdit() {
  tampilKonfirmasi(
    undoStack.length > 0
      ? 'Batalkan semua perubahan?<br>Data akan dikembalikan ke kondisi awal.'
      : 'Keluar dari mode edit?',
    () => batalEdit()
  );
}

// =====================================================================
// BATAL EDIT — kembalikan semua sel ke dataSebelumEdit + POST batch ke GAS
// =====================================================================
async function batalEdit() {
  const kembalikan = [];

  document.querySelectorAll('#tbody-data tr').forEach((tr, pIdx) => {
    tr.querySelectorAll('td.col-hari').forEach((td, jIdx) => {
      const asli = dataSebelumEdit[pIdx]?.[jIdx] ?? '';
      const baru = td.textContent.trim();
      if (baru !== asli) {
        kembalikan.push({ pIdx, jIdx, value: asli });
        td.textContent      = asli;
        td.style.background = '';
      }
    });
    _updateHKRow(tr);
  });

  if (kembalikan.length > 0) {
    showLoading('MENGEMBALIKAN DATA...');
    try {
      await postGS({
        action  : 'saveJadwalBatch',
        mode    : MODE,
        bulan   : selectedBulan.value,
        tahun   : selectedBulan.tahun,
        unit    : selectedUnit,
        changes : kembalikan
      });
    } catch (err) {
      console.warn('Kembalikan data gagal (normal jika localhost):', err.message);
    }
    hideLoading();
  }

  undoStack = [];
  redoStack = [];
  selesaiEdit();
}

// =====================================================================
// SELESAI EDIT — kembalikan semua UI ke kondisi normal
// =====================================================================
function selesaiEdit() {
  modeEdit        = false;
  dataSebelumEdit = [];
  undoStack       = [];
  redoStack       = [];

  // Nonaktifkan border kedip merah
  document.querySelector('.jadwal')?.classList.remove('mode-edit');

  // Bersihkan warna kuning
  document.querySelectorAll('#tbody-data td.col-hari').forEach(td => {
    td.style.background = '';
  });

  // Kembalikan tombol SIMPAN → EDIT JADWAL
  const btnEdit = document.getElementById('btn-edit');
  btnEdit.textContent = '✎ EDIT JADWAL';
  btnEdit.onclick     = () => editJadwal();
  btnEdit.onmouseover = () => { if (!btnEdit.disabled) { btnEdit.style.background = '#000'; btnEdit.style.color = '#fff'; } };
  btnEdit.onmouseout  = () => { btnEdit.style.background = 'transparent'; btnEdit.style.color = '#000'; };

  // Kembalikan tombol BATAL → DOWNLOAD
  const btnDownload = document.getElementById('btn-download');
  btnDownload.textContent = '⬇ DOWNLOAD';
  btnDownload.onclick     = () => downloadJadwal();
  btnDownload.onmouseover = () => { if (!btnDownload.disabled) { btnDownload.style.background = '#000'; btnDownload.style.color = '#fff'; } };
  btnDownload.onmouseout  = () => { btnDownload.style.background = 'transparent'; btnDownload.style.color = '#000'; };

  // Lepas klik sel
  document.querySelectorAll('#tbody-data td.col-hari').forEach(td => {
    td.style.cursor = '';
    td.onclick      = null;
  });

  // Sembunyikan UNDO / REDO
  _sembunyiUndoRedo();

  // Tetap kunci bulan & unit (jadwal masih tampil)
  setBtnBulanAktif(false);
  setBtnUnitAktif(false);
}

// =====================================================================
// DOWNLOAD — modal pilih format
// =====================================================================
function downloadJadwal() {
  const existing = document.getElementById('modal-download-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'modal-download-overlay';
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.45);
    z-index:300; display:flex; align-items:center; justify-content:center;
  `;
  overlay.innerHTML = `
    <div style="background:#fff; border:2px solid #000; width:clamp(240px,40vw,420px); font-family:'Share Tech Mono',monospace;">
      <div style="min-height:6vh; border-bottom:2px solid #000; display:flex; align-items:center;
        justify-content:center; font-weight:bold; font-size:clamp(12px,2vh,18px);
        position:relative; padding:0.5vh 6vh 0.5vh 1vh; box-sizing:border-box;">
        <span>DOWNLOAD JADWAL</span>
        <button onclick="document.getElementById('modal-download-overlay').remove()"
          style="position:absolute; right:0; top:0; height:100%; width:6vh; border:none;
          border-left:2px solid #000; background:transparent; font-family:'Share Tech Mono',monospace;
          font-size:clamp(12px,2vh,18px); cursor:pointer;
          display:flex; align-items:center; justify-content:center;"
          onmouseover="this.style.background='#000';this.style.color='#fff'"
          onmouseout="this.style.background='transparent';this.style.color='#000'">✕</button>
      </div>
      <div style="display:flex; flex-direction:column;">
        <button id="dl-png"
          style="height:clamp(36px,6.5vh,60px); border:none; border-bottom:1px solid #000; background:#fff;
          font-family:'Share Tech Mono',monospace; font-size:clamp(11px,1.8vh,16px);
          cursor:pointer; letter-spacing:0.05em;"
          onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='#fff'">
          🖼 DOWNLOAD PNG
        </button>
        <button id="dl-pdf"
          style="height:clamp(36px,6.5vh,60px); border:none; background:#fff;
          font-family:'Share Tech Mono',monospace; font-size:clamp(11px,1.8vh,16px);
          cursor:pointer; letter-spacing:0.05em;"
          onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='#fff'">
          📄 DOWNLOAD PDF
        </button>
      </div>
      <div style="min-height:6vh; border-top:2px solid #000; display:flex; align-items:center; justify-content:center; padding:0.5vh;">
        <button onclick="document.getElementById('modal-download-overlay').remove()"
          style="height:5vh; border:2px solid #000; background:#fff; padding:0 3vw;
          font-family:'Share Tech Mono',monospace; font-size:clamp(11px,1.8vh,16px); cursor:pointer;"
          onmouseover="this.style.background='#000';this.style.color='#fff'"
          onmouseout="this.style.background='#fff';this.style.color='#000'">TUTUP</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('dl-png').onclick = () => { overlay.remove(); eksporPNG(); };
  document.getElementById('dl-pdf').onclick = () => { overlay.remove(); eksporPDF(); };
}

// =====================================================================
// HELPER EKSPOR — capture .jadwal (tanpa fader), scroll penuh
// =====================================================================
function _captureJadwalCanvas() {
  const SCALE = 2;
  const PAD   = 20 * SCALE;
  const TK    = 2 * SCALE; // tebal
  const TP    = 1 * SCALE; // tipis

  const judul     = document.querySelector('.jadwal-judul');
  const theadRows = document.querySelectorAll('#tabel-jadwal thead tr');
  const tbodyRows = document.querySelectorAll('#tabel-jadwal tbody tr');
  if (!judul || !theadRows.length || !tbodyRows.length) return null;

  const colNo   = document.querySelector('#tabel-jadwal .col-no');
  const colNama = document.querySelector('#tabel-jadwal .col-nama');
  const colHari = document.querySelector('#tabel-jadwal .col-hari:not(.hidden)');

  const hJudul   = Math.round(judul.offsetHeight * SCALE);
  const hHari    = Math.round(theadRows[0].offsetHeight * SCALE);
  const hTanggal = Math.round(theadRows[1].offsetHeight * SCALE);
  const hData    = Math.round(tbodyRows[0].offsetHeight * SCALE);
  const wNo      = Math.round((colNo   ? colNo.offsetWidth   : 25)  * SCALE);
  const wNama    = Math.round((colNama ? colNama.offsetWidth  : 120) * SCALE);
  const wHari    = Math.round((colHari ? colHari.offsetWidth  : 40)  * SCALE);
  const nHari    = tbodyRows[0].querySelectorAll('td.col-hari:not(.hidden)').length;
  const nData    = tbodyRows.length;

  const innerW = wNo + wNama + wHari * nHari;
  const innerH = hJudul + hHari + hTanggal + hData * nData;
  const totalW = PAD * 2 + TK * 2 + innerW;
  const totalH = PAD * 2 + TK * 2 + innerH;

  const canvas = document.createElement('canvas');
  canvas.width  = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, totalW, totalH);
  ctx.textBaseline = 'middle';
  ctx.textAlign    = 'center';

  // Origin konten
  const ox = PAD + TK;
  const oy = PAD + TK;

  // ── Helpers ──────────────────────────────────────────────
  function line(x1, y1, x2, y2, lw) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function text(str, x, y, color, font) {
    ctx.fillStyle = color || '#000';
    ctx.font = font || `normal ${8*SCALE}px "Share Tech Mono",monospace`;
    ctx.fillText(str, x, y);
  }

  // ── Border luar ──────────────────────────────────────────
  ctx.strokeStyle = '#000';
  ctx.lineWidth   = TK;
  ctx.strokeRect(PAD + TK/2, PAD + TK/2, innerW + TK, innerH + TK);

  // ── Judul ────────────────────────────────────────────────
  text(judul.textContent.trim(), ox + innerW/2, oy + hJudul/2,
    '#000', `bold ${11*SCALE}px "Share Tech Mono",monospace`);
  // Garis bawah judul — tebal
  line(ox, oy + hJudul, ox + innerW, oy + hJudul, TK);

  // ── Header NO & NAMA (rowspan) ───────────────────────────
  const hHeader = hHari + hTanggal;
  const yHeader = oy + hJudul;

  // NO — isi
  text(theadRows[0].querySelector('.col-no')?.textContent.trim() || 'NO',
    ox + wNo/2, yHeader + hHeader/2, '#000',
    `bold ${8*SCALE}px "Share Tech Mono",monospace`);
  // NAMA — isi
  text('NAMA', ox + wNo + wNama/2, yHeader + hHeader/2, '#000',
    `bold ${9*SCALE}px "Share Tech Mono",monospace`);

  // Garis kanan NO — tebal
  line(ox + wNo, yHeader, ox + wNo, yHeader + hHeader, TK);
  // Garis kanan NAMA — tebal
  line(ox + wNo + wNama, yHeader, ox + wNo + wNama, yHeader + hHeader, TK);
  // Garis bawah header (pemisah thead-tbody) — tebal
  line(ox, yHeader + hHeader, ox + innerW, yHeader + hHeader, TK);
  // Garis tengah header hari/tanggal
  line(ox + wNo + wNama, yHeader + hHari, ox + innerW, yHeader + hHari, TP);

  // ── Kolom hari & tanggal ─────────────────────────────────
  const thHari = [...theadRows[0].querySelectorAll('th.col-hari:not(.hidden)')];
  const thTgl  = [...theadRows[1].querySelectorAll('th.col-hari:not(.hidden)')];

  thHari.forEach((th, i) => {
    const x   = ox + wNo + wNama + i * wHari;
    const col = th.style.color === 'red' ? '#e00' : '#000';
    text(th.textContent.trim(), x + wHari/2, yHeader + hHari/2, col,
      `bold ${9*SCALE}px "Share Tech Mono",monospace`);
    if (i < nHari - 1) line(x + wHari, yHeader, x + wHari, yHeader + hHari, TP);
  });

  thTgl.forEach((th, i) => {
    const x   = ox + wNo + wNama + i * wHari;
    const col = th.style.color === 'red' ? '#e00' : '#000';
    text(th.textContent.trim(), x + wHari/2, yHeader + hHari + hTanggal/2, col,
      `bold ${9*SCALE}px "Share Tech Mono",monospace`);
    if (i < nHari - 1) line(x + wHari, yHeader + hHari, x + wHari, yHeader + hHari + hTanggal, TP);
  });

  // ── Baris data ───────────────────────────────────────────
  tbodyRows.forEach((tr, rIdx) => {
    const y    = oy + hJudul + hHeader + rIdx * hData;
    const isLastRow = rIdx === nData - 1;

    // Garis bawah baris (tipis kecuali terakhir)
    if (!isLastRow) line(ox, y + hData, ox + innerW, y + hData, TP);

    // NO
    const tdNo = tr.querySelector('.col-no');
    text(tdNo ? tdNo.textContent.trim() : '', ox + wNo/2, y + hData/2);
    // Garis kanan NO — tebal
    line(ox + wNo, y, ox + wNo, y + hData, TK);

    // NAMA
    const namaText = tr.querySelector('.col-nama .nama-text')?.textContent.trim() || '';
    const hkGrid   = tr.querySelector('.hk-grid');
    const namaW    = wNama - (hkGrid ? wHari : 0);

    // Teks nama — wrap 2 baris
    ctx.fillStyle = '#000';
    ctx.font = `normal ${8*SCALE}px "Share Tech Mono",monospace`;
    ctx.textAlign = 'left';
    const words = namaText.split(' ');
    let l1 = '', l2 = '';
    for (const w of words) {
      if (!l1) { l1 = w; }
      else if (ctx.measureText(l1 + ' ' + w).width < namaW - 8*SCALE) { l1 += ' ' + w; }
      else { l2 += (l2 ? ' ' : '') + w; }
    }
    if (l2) {
      ctx.fillText(l1, ox + wNo + 4*SCALE, y + hData/2 - 5*SCALE);
      ctx.fillText(l2, ox + wNo + 4*SCALE, y + hData/2 + 5*SCALE);
    } else {
      ctx.fillText(l1, ox + wNo + 4*SCALE, y + hData/2);
    }
    ctx.textAlign = 'center';

    // HK grid
    if (hkGrid) {
      const hkItems = [...hkGrid.querySelectorAll('.hk-item')];
      const gX = ox + wNo + namaW;
      const cW = wHari / 2; const cH = hData / 2;
      ctx.strokeStyle = '#aaa'; ctx.lineWidth = TP * 0.5;
      hkItems.forEach((item, i) => {
        const cx = gX + (i % 2) * cW;
        const cy = y  + Math.floor(i / 2) * cH;
        ctx.fillStyle = '#fff'; ctx.fillRect(cx, cy, cW, cH);
        ctx.strokeRect(cx, cy, cW, cH);
        const lbl = item.querySelector('.lbl')?.textContent || '';
        const val = item.querySelector('.val')?.textContent || '';
        ctx.fillStyle = '#aaa';
        ctx.font = `normal ${5*SCALE}px "Share Tech Mono",monospace`;
        ctx.fillText(lbl, cx + cW/2, cy + cH * 0.3);
        ctx.fillStyle = '#000';
        ctx.font = `bold ${7*SCALE}px "Share Tech Mono",monospace`;
        ctx.fillText(val, cx + cW/2, cy + cH * 0.72);
      });
    }

    // Garis kanan NAMA — tebal
    line(ox + wNo + wNama, y, ox + wNo + wNama, y + hData, TK);

    // Sel data hari — garis pemisah vertikal tipis, teks
    const tds = [...tr.querySelectorAll('td.col-hari:not(.hidden)')];
    tds.forEach((td, i) => {
      const x   = ox + wNo + wNama + i * wHari;
      const col = td.style.color || '#000';
      text(td.textContent.trim(), x + wHari/2, y + hData/2, col,
        `normal ${9*SCALE}px "Share Tech Mono",monospace`);
      if (i < nHari - 1) line(x + wHari, y, x + wHari, y + hData, TP);
    });
  });

  return canvas;
}

async function _captureJadwal() {
  const canvas = _captureJadwalCanvas();
  if (!canvas) throw new Error('Gagal membuat canvas jadwal');
  return canvas;
}

// =====================================================================
// EKSPOR PNG — pakai html2canvas dari CDN
// =====================================================================
async function eksporPNG() {
  showLoading('MEMBUAT PNG...');
  if (!window.html2canvas) {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    document.head.appendChild(s);
    await new Promise(res => s.onload = res);
  }
  try {
    const canvas  = await _captureJadwal();
    const link    = document.createElement('a');
    link.download = `jadwal-${selectedUnit}-${BULAN_NAMA[selectedBulan.value]}-${selectedBulan.tahun}.png`;
    link.href     = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    alert('Gagal ekspor PNG: ' + err.message);
    console.error(err);
  }
  hideLoading();
}

// =====================================================================
// EKSPOR PDF — pakai html2canvas + jsPDF dari CDN
// =====================================================================
async function eksporPDF() {
  showLoading('MEMBUAT PDF...');
  if (!window.html2canvas) {
    const s1 = document.createElement('script');
    s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    document.head.appendChild(s1);
    await new Promise(res => s1.onload = res);
  }
  if (!window.jspdf) {
    const s2 = document.createElement('script');
    s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    document.head.appendChild(s2);
    await new Promise(res => s2.onload = res);
  }
  try {
    const canvas    = await _captureJadwal();
    const imgData   = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf       = new jsPDF({
      orientation : 'landscape',
      unit        : 'px',
      format      : [canvas.width / 2, canvas.height / 2]
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`jadwal-${selectedUnit}-${BULAN_NAMA[selectedBulan.value]}-${selectedBulan.tahun}.pdf`);
  } catch (err) {
    alert('Gagal ekspor PDF: ' + err.message);
    console.error(err);
  }
  hideLoading();
}