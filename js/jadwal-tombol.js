// =====================================================================
// CACHE — simpan pilihan bulan & unit di sessionStorage selama 10 menit
// =====================================================================
const CACHE_KEY    = 'jadwal_cache';
const CACHE_DURASI = 10 * 60 * 1000;

function simpanCache() {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({
    bulan     : selectedBulan,
    unit      : selectedUnit,
    timestamp : Date.now()
  }));
}

function hapusCache() {
  sessionStorage.removeItem(CACHE_KEY);
}

function muatCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    if (Date.now() - cache.timestamp > CACHE_DURASI) { hapusCache(); return null; }
    return cache;
  } catch { return null; }
}

// =====================================================================
// HELPER TOMBOL
// =====================================================================
function setBtnAktif(id, aktif) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled      = !aktif;
  btn.style.cursor  = aktif ? 'pointer' : 'not-allowed';
  btn.style.opacity = aktif ? '1' : '0.5';
}

function setBtnBulanAktif(aktif) {
  const btn = document.getElementById('btn-bulan');
  if (!btn) return;
  btn.disabled      = !aktif;
  btn.style.cursor  = aktif ? 'pointer' : 'not-allowed';
  btn.style.opacity = aktif ? '1' : '0.5';
}

function setBtnUnitAktif(aktif) {
  const btn = document.getElementById('btn-unit');
  if (!btn) return;
  btn.disabled      = !aktif;
  btn.style.cursor  = aktif ? 'pointer' : 'not-allowed';
  btn.style.opacity = aktif ? '1' : '0.5';
}

// =====================================================================
// MODAL PILIH BULAN / UNIT
// =====================================================================
function openModal(tipe) {
  const overlay   = document.getElementById('modal-overlay');
  const titleText = document.getElementById('modal-title-text');
  const content   = document.getElementById('modal-content');
  content.innerHTML = '';

  if (tipe === 'bulan') {
    titleText.textContent = 'PILIH BULAN';
    dataBulan.forEach(b => {
      const label    = `${BULAN_NAMA[b.value]} ${b.tahun}`;
      const terpilih = selectedBulan &&
        selectedBulan.value === b.value &&
        selectedBulan.tahun === b.tahun;
      const btn = document.createElement('button');
      btn.textContent   = label;
      btn.style.cssText = `height:clamp(32px,5.5vh,52px); border:2px solid #000;
        background:${terpilih ? '#000' : '#fff'}; color:${terpilih ? '#fff' : '#000'};
        font-family:'Share Tech Mono',monospace; font-size:clamp(10px,1.8vh,15px);
        cursor:pointer; letter-spacing:0.05em; white-space:nowrap; overflow:hidden;`;
      btn.onmouseover = () => { if (!terpilih) btn.style.background = '#f0f0f0'; };
      btn.onmouseout  = () => { if (!terpilih) btn.style.background = '#fff'; };
      btn.onclick     = () => pilihBulan(b);
      content.appendChild(btn);
    });
  }

  if (tipe === 'unit') {
    titleText.textContent = 'PILIH UNIT';
    dataUnit.forEach(u => {
      const terpilih = selectedUnit === u;
      const btn = document.createElement('button');
      btn.textContent   = u;
      btn.style.cssText = `height:clamp(32px,5.5vh,52px); border:2px solid #000;
        background:${terpilih ? '#000' : '#fff'}; color:${terpilih ? '#fff' : '#000'};
        font-family:'Share Tech Mono',monospace; font-size:clamp(10px,1.8vh,15px);
        cursor:pointer; letter-spacing:0.05em; white-space:nowrap; overflow:hidden;`;
      btn.onmouseover = () => { if (!terpilih) btn.style.background = '#f0f0f0'; };
      btn.onmouseout  = () => { if (!terpilih) btn.style.background = '#fff'; };
      btn.onclick     = () => pilihUnit(u);
      content.appendChild(btn);
    });
  }

  overlay.style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

// =====================================================================
// PILIH BULAN
// =====================================================================
function pilihBulan(b) {
  selectedBulan = b;
  selectedUnit  = null;

  const label = `${BULAN_NAMA[b.value]} ${b.tahun}`;
  document.getElementById('btn-bulan').textContent  = label;
  document.getElementById('x-bulan').style.display  = 'block';
  document.getElementById('info-bulan').textContent = `✅ ${label} dipilih`;

  // Reset unit
  document.getElementById('btn-unit').textContent  = '— PILIH UNIT —';
  document.getElementById('x-unit').style.display  = 'none';
  document.getElementById('info-unit').textContent = `${dataUnit.length} unit tersedia`;

  setBtnBulanAktif(false);
  setBtnUnitAktif(true);
  renderHeader(b);
  initScrollSync();
  _setJudulTabel(
    `${JUDUL_MODE[MODE] || 'JADWAL KERJA'} — ${label}`);

  hapusCache();
  closeModal();
}

// =====================================================================
// PILIH UNIT
// =====================================================================
async function pilihUnit(u) {
  selectedUnit = u;

  document.getElementById('btn-unit').textContent  = u;
  document.getElementById('x-unit').style.display  = 'block';
  document.getElementById('info-unit').textContent = `✅ ${u} dipilih`;

  // Update judul tabel dengan bulan + unit
  const label = `${BULAN_NAMA[selectedBulan.value]} ${selectedBulan.tahun}`;
  _setJudulTabel(
    `${JUDUL_MODE[MODE] || 'JADWAL KERJA'} — ${label} — ${u}`);

  setBtnUnitAktif(false);
  simpanCache();
  closeModal();
  await loadJadwal();
}

// =====================================================================
// MODAL KONFIRMASI — YA / TIDAK
// =====================================================================
function tampilKonfirmasi(pesan, onYa) {
  const existing = document.getElementById('konfirmasi-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'konfirmasi-overlay';
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.45);
    z-index:200; display:flex; align-items:center; justify-content:center;
  `;
  overlay.innerHTML = `
    <div style="background:#fff; border:2px solid #000; width:clamp(240px,40vw,420px); font-family:'Share Tech Mono',monospace;">
      <div style="min-height:6vh; border-bottom:2px solid #000; display:flex; align-items:center;
        justify-content:center; font-weight:bold; font-size:clamp(12px,2vh,18px); padding:0.5vh 1vh; text-align:center;">KONFIRMASI</div>
      <div style="padding:2vh 2vw; font-size:clamp(11px,1.8vh,16px); text-align:center; line-height:1.8;">${pesan}</div>
      <div style="min-height:6vh; border-top:2px solid #000; display:flex;">
        <button id="konfirmasi-ya"
          style="flex:1; border:none; border-right:2px solid #000; background:#000; color:#fff;
          font-family:'Share Tech Mono',monospace; font-size:clamp(11px,1.8vh,16px); cursor:pointer;">YA</button>
        <button id="konfirmasi-tidak"
          style="flex:1; border:none; background:#fff;
          font-family:'Share Tech Mono',monospace; font-size:clamp(11px,1.8vh,16px); cursor:pointer;">TIDAK</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('konfirmasi-ya').onclick    = () => { overlay.remove(); onYa(); };
  document.getElementById('konfirmasi-tidak').onclick = () => overlay.remove();
}

// =====================================================================
// RESET BULAN
// =====================================================================
function konfirmasiResetBulan() {
  // Cek dulu kalau sedang mode edit
  if (typeof modeEdit !== 'undefined' && modeEdit) {
    tampilKonfirmasi(
      'Anda sedang dalam mode edit.<br>Batalkan perubahan dan reset bulan?',
      () => { batalEdit(); lakukanResetBulan(); }
    );
    return;
  }

  const adaJadwal = document.getElementById('tbody-data').children.length > 0;
  tampilKonfirmasi(
    adaJadwal
      ? 'Reset bulan akan menutup jadwal yang ditampilkan.<br><br>Yakin reset pilihan bulan?'
      : 'Yakin reset pilihan bulan?',
    lakukanResetBulan
  );
}

function lakukanResetBulan() {
  selectedBulan = null;
  selectedUnit  = null;

  // Reset header tabel
  document.getElementById('tr-hari').querySelectorAll('th.col-hari').forEach(th => th.remove());
  document.getElementById('tr-tanggal').innerHTML = '';
  document.getElementById('colgroup-hari').querySelectorAll('col.col-hari').forEach(c => c.remove());

  document.getElementById('btn-bulan').textContent  = '— PILIH BULAN —';
  document.getElementById('x-bulan').style.display  = 'none';
  document.getElementById('info-bulan').textContent = `${dataBulan.length} bulan tersedia`;

  document.getElementById('btn-unit').textContent  = '— PILIH UNIT —';
  document.getElementById('x-unit').style.display  = 'none';
  document.getElementById('info-unit').textContent = 'Pilih bulan terlebih dahulu';

  _setJudulTabel(JUDUL_MODE[MODE] || 'JADWAL KERJA');
  document.getElementById('tbody-data').innerHTML = '';

  setBtnBulanAktif(true);
  setBtnUnitAktif(false);
  setBtnAktif('btn-download', false);
  setBtnAktif('btn-edit', false);
  hapusCache();
}

// =====================================================================
// RESET UNIT
// =====================================================================
function konfirmasiResetUnit() {
  if (typeof modeEdit !== 'undefined' && modeEdit) {
    tampilKonfirmasi(
      'Anda sedang dalam mode edit.<br>Batalkan perubahan dan tutup jadwal?',
      () => { batalEdit(); tampilModalResetUnit(); }
    );
    return;
  }
  tampilModalResetUnit();
}

function tampilModalResetUnit() {
  const existing = document.getElementById('konfirmasi-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'konfirmasi-overlay';
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.45);
    z-index:200; display:flex; align-items:center; justify-content:center;
  `;
  overlay.innerHTML = `
    <div style="background:#fff; border:2px solid #000; width:clamp(240px,40vw,420px); font-family:'Share Tech Mono',monospace;">
      <div style="min-height:6vh; border-bottom:2px solid #000; display:flex; align-items:center;
        justify-content:center; font-weight:bold; font-size:clamp(12px,2vh,18px); padding:0.5vh 1vh; text-align:center; word-break:break-word;">UNIT: ${selectedUnit}</div>
      <div style="padding:1.5vh 2vw; font-size:clamp(10px,1.6vh,14px); text-align:center; line-height:1.8;">
        Pilih tindakan untuk jadwal ini:
      </div>
      <div style="border-top:2px solid #000; display:flex; flex-direction:column;">
        <button id="k-tutup"
          style="height:clamp(32px,5.5vh,52px); border:none; border-bottom:1px solid #000; background:#fff;
          font-family:'Share Tech Mono',monospace; font-size:clamp(10px,1.6vh,14px); cursor:pointer; white-space:normal; line-height:1.3;"
          onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='#fff'">
          ✕ TUTUP JADWAL ${selectedUnit}
        </button>
        <button id="k-ganti"
          style="height:clamp(32px,5.5vh,52px); border:none; border-bottom:1px solid #000; background:#fff;
          font-family:'Share Tech Mono',monospace; font-size:clamp(10px,1.6vh,14px); cursor:pointer; white-space:normal; line-height:1.3;"
          onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='#fff'">
          ⇄ PILIH UNIT LAIN
        </button>
        <button id="k-batal"
          style="height:clamp(32px,5.5vh,52px); border:none; background:#fff;
          font-family:'Share Tech Mono',monospace; font-size:clamp(10px,1.6vh,14px); cursor:pointer; white-space:normal; line-height:1.3;"
          onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='#fff'">
          BATAL
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('k-tutup').onclick = () => {
    overlay.remove(); _resetUnitUI(); tutupJadwal(); hapusCache();
  };
  document.getElementById('k-ganti').onclick = () => {
    overlay.remove(); _resetUnitUI(); tutupJadwal(); hapusCache(); openModal('unit');
  };
  document.getElementById('k-batal').onclick = () => overlay.remove();
}

function _resetUnitUI() {
  selectedUnit = null;
  document.getElementById('btn-unit').textContent  = '— PILIH UNIT —';
  document.getElementById('x-unit').style.display  = 'none';
  document.getElementById('info-unit').textContent = `${dataUnit.length} unit tersedia`;
  setBtnUnitAktif(true);
}

// =====================================================================
// NAVIGASI
// =====================================================================
function aksiKembali() {
  // Tutup modal jika ada yang terbuka
  const modals = ['modal-overlay','modal-nilai-overlay','modal-download-overlay','konfirmasi-overlay'];
  for (const id of modals) {
    const el = document.getElementById(id);
    if (el && el.style.display !== 'none' && el.offsetParent !== null) {
      el.style.display === 'none' ? null : el.tagName === 'DIV' && el.style.position === 'fixed'
        ? el.remove() : closeModal();
      return;
    }
  }

  // Saat mode edit → perilaku seperti tombol BATAL edit
  if (typeof modeEdit !== 'undefined' && modeEdit) {
    batalEdit();
    return;
  }

  const adaJadwal = document.getElementById('tbody-data').children.length > 0;
  if (adaJadwal) {
    tampilModalResetUnit();
  } else if (selectedBulan) {
    konfirmasiResetBulan();
  } else {
    window.location.href = '../index.html';
  }
}

// Intercept tombol back HP
function _initBackIntercept() {
  // Push state dummy agar ada history entry yang bisa di-intercept
  history.pushState({ page: 'jadwal' }, '');

  window.addEventListener('popstate', (e) => {
    // Push lagi agar back berikutnya juga ter-intercept
    history.pushState({ page: 'jadwal' }, '');
    aksiKembali();
  });
}
// =====================================================================
// FOOTER — tahun & ADMIN MODE
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
  const elTahun = document.getElementById('footer-tahun');
  if (elTahun) elTahun.textContent = new Date().getFullYear();

  // Set judul header & tabel sesuai mode
  const elJudul = document.getElementById('header-judul');
  if (elJudul && typeof JUDUL_MODE !== 'undefined') {
    elJudul.textContent = JUDUL_MODE[MODE] || 'JADWAL KERJA';
  }
  const elJudulTabel = document.querySelector('.jadwal-judul');
  if (elJudulTabel && typeof JUDUL_MODE !== 'undefined' && MODE) {
    elJudulTabel.textContent = JUDUL_MODE[MODE] || 'JADWAL KERJA';
  }
});

let adminMode = false;

function toggleAdminMode() {
  adminMode = !adminMode;
  const btn       = document.getElementById('btn-admin-mode');
  const indicator = document.getElementById('admin-mode-indicator');
  if (adminMode) {
    indicator.style.background    = '#000';
    indicator.style.borderColor   = '#000';
    btn.style.fontWeight          = 'bold';
  } else {
    indicator.style.background    = '#fff';
    indicator.style.borderColor   = '#000';
    btn.style.fontWeight          = 'normal';
  }
  // Dispatch event agar modul lain bisa bereaksi
  window.dispatchEvent(new CustomEvent('adminModeChange', { detail: { aktif: adminMode } }));
}