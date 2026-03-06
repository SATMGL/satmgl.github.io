// =====================================================================
// MODAL PILIH MODE
// =====================================================================
function _tampilModalPilihMode() {
  const overlay = document.createElement('div');
  overlay.id = 'modal-mode-overlay';
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:500;
    display:flex; align-items:center; justify-content:center;
    font-family:'Share Tech Mono',monospace;
    background:#e8d8c8;
    overflow:hidden;
  `;

  overlay.innerHTML = `
    <style>
      /* ── Bata pastel offset ── */
      #batik-bg {
        position:absolute; inset:0; z-index:0;
        background-color: #e8d8c8;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='40'%3E%3Crect x='2' y='2' width='76' height='16' rx='2' fill='%23f0e0cc' stroke='%23c8b49a' stroke-width='1.5'/%3E%3Crect x='2' y='22' width='36' height='16' rx='2' fill='%23ecd8c0' stroke='%23c8b49a' stroke-width='1.5'/%3E%3Crect x='42' y='22' width='36' height='16' rx='2' fill='%23f0dcc8' stroke='%23c8b49a' stroke-width='1.5'/%3E%3C/svg%3E");
        background-size: 80px 40px;
      }

      #pilih-mode-wrap {
        position:relative; z-index:1;
        display:flex; flex-direction:column;
        align-items:center; gap:2vh;
        width:clamp(260px,80vw,400px);
      }

      #pilih-mode-judul {
        color:#555; font-size:clamp(9px,1.4vh,13px);
        letter-spacing:0.45em; text-align:center;
      }

      /* ── Kartu — efek tombol timbul ── */
      .mode-kartu {
        width:100%; display:flex; align-items:stretch;
        border:2px solid; cursor:pointer;
        box-sizing:border-box;
        font-family:'Share Tech Mono',monospace;
        outline:none; text-align:left;
        background:#fff;
        /* efek timbul */
        box-shadow: 0 6px 0 0 #bbb, 0 7px 4px rgba(0,0,0,0.18);
        transform: translateY(0px);
        transition: box-shadow 0.08s, transform 0.08s, background 0.15s;
        border-bottom-width: 3px;
      }

      /* saat ditekan */
      .mode-kartu:active {
        box-shadow: 0 1px 0 0 #bbb, 0 2px 2px rgba(0,0,0,0.15);
        transform: translateY(5px);
      }

      #kartu-pel { border-color:#f37021; box-shadow: 0 6px 0 0 #b85400, 0 7px 4px rgba(0,0,0,0.2); }
      #kartu-pen { border-color:#85bb65; box-shadow: 0 6px 0 0 #4a7c34, 0 7px 4px rgba(0,0,0,0.2); }

      #kartu-pel:active { box-shadow: 0 1px 0 0 #b85400, 0 2px 2px rgba(0,0,0,0.15); }
      #kartu-pen:active { box-shadow: 0 1px 0 0 #4a7c34, 0 2px 2px rgba(0,0,0,0.15); }

      #kartu-pel:hover { background:#fff5ee; }
      #kartu-pen:hover { background:#f2f8ee; }

      .kartu-sisi { width:6px; flex-shrink:0; }
      #kartu-pel .kartu-sisi { background:#f37021; }
      #kartu-pen .kartu-sisi { background:#85bb65; }

      .kartu-isi {
        flex:1; display:flex; flex-direction:column;
        padding:2vh 2vw; gap:0.6vh; box-sizing:border-box;
      }
      .kartu-nama {
        font-size:clamp(12px,2vh,17px); font-weight:bold;
        letter-spacing:0.12em; line-height:1.3; color:#111;
      }
      .kartu-desc {
        font-size:clamp(8px,1.15vh,11px);
        color:#666; line-height:1.8; letter-spacing:0.04em;
      }
      .kartu-key { color:#c00; font-weight:bold; }

      .kartu-aksi {
        width:clamp(36px,5.5vw,50px); flex-shrink:0;
        display:flex; align-items:center; justify-content:center;
        border-left:2px solid; font-size:clamp(9px,1.3vh,12px);
        letter-spacing:0.1em; writing-mode:vertical-rl;
        font-weight:bold;
      }
      #kartu-pel .kartu-aksi { border-left-color:#f37021; color:#f37021; }
      #kartu-pen .kartu-aksi { border-left-color:#85bb65; color:#85bb65; }

      #pilih-mode-sep {
        width:100%; display:flex; align-items:center; gap:1vw;
        color:#bbb; font-size:clamp(7px,1vh,10px); letter-spacing:0.3em;
      }
      #pilih-mode-sep::before, #pilih-mode-sep::after {
        content:''; flex:1; height:1px; background:#ccc;
      }
    </style>

    <div id="batik-bg"></div>

    <div id="pilih-mode-wrap">

      <div id="pilih-mode-judul">&#9656; &nbsp; PILIH MODE JADWAL &nbsp; &#9666;</div>

      <button class="mode-kartu" id="kartu-pel">
        <span class="kartu-sisi"></span>
        <span class="kartu-isi">
          <span class="kartu-nama">&#128203; &nbsp;PELAKSANAAN KERJA</span>
          <span class="kartu-desc">
            Jadwal tugas harian personil yang dijalankan
            <span class="kartu-key">di lapangan</span>.<br>
            Memuat <span class="kartu-key">shift yang dijalankan</span> setiap hari dalam sebulan,<br>
            termasuk pengaturan <span class="kartu-key">hari libur</span> sesuai kondisi lapangan.
          </span>
        </span>
        <span class="kartu-aksi">PILIH</span>
      </button>

      <div id="pilih-mode-sep">atau</div>

      <button class="mode-kartu" id="kartu-pen">
        <span class="kartu-sisi"></span>
        <span class="kartu-isi">
          <span class="kartu-nama">&#128228; &nbsp;PENGIRIMAN ABSENSI</span>
          <span class="kartu-desc">
            Jadwal yang dicatat di <span class="kartu-key">timesheet resmi</span>
            untuk dikirim ke kantor.<br>
            Disusun berdasarkan <span class="kartu-key">pola shift standar</span>
            dan digunakan sebagai dasar<br>
            <span class="kartu-key">laporan kehadiran</span> personil secara administratif.
          </span>
        </span>
        <span class="kartu-aksi">PILIH</span>
      </button>

    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('kartu-pel').onclick = () => {
    overlay.remove();
    window.location.href = window.location.pathname + '?mode=PEL';
  };
  document.getElementById('kartu-pen').onclick = () => {
    overlay.remove();
    window.location.href = window.location.pathname + '?mode=PEN';
  };
}

// =====================================================================
// KONFIGURASI — edit bagian ini sesuai kebutuhan
// =====================================================================
const GS_URL = 'https://script.google.com/macros/s/AKfycbxCT9hMfzXw6y2ruQD8Wr9L3D83rspDGjCk31nVW96W6bZJKNGU13oKljYUE16sfWgtFg/exec';
const MODE   = new URLSearchParams(location.search).get('mode');
const JUDUL_MODE = {
  PEL: 'JADWAL PELAKSANAAN KERJA',
  PEN: 'JADWAL PENGIRIMAN ABSENSI'
};

function _setJudulTabel(teks) {
  const el = document.querySelector('.jadwal-judul span') || document.querySelector('.jadwal-judul');
  if (el) el.textContent = teks;
}

const BULAN_NAMA = {
  1:'JANUARI', 2:'FEBRUARI', 3:'MARET',    4:'APRIL',
  5:'MEI',     6:'JUNI',     7:'JULI',      8:'AGUSTUS',
  9:'SEPTEMBER', 10:'OKTOBER', 11:'NOVEMBER', 12:'DESEMBER'
};

const NILAI_WEEKDAY = {
  PEL: ['P', 'S', 'M', 'SM', 'OFF', 'CUTI'],
  PEN: ['P', 'S', 'M', 'OFF', 'CUTI']
};
const NILAI_WEEKEND = ['P12', 'M12', 'OFF', 'CUTI'];
const HARI_WEEKEND  = ['MIN', 'SAB'];
const HARI_NAMES    = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

// =====================================================================
// STATE GLOBAL
// =====================================================================
let dataBulan     = [];
let dataUnit      = [];
let selectedBulan = null;
let selectedUnit  = null;
let faderInit     = false;

// =====================================================================
// FETCH KE GAS — GET request, CORS-safe
// =====================================================================
async function fetchGS(params) {
  const url = GS_URL + '?' + new URLSearchParams(params).toString();
  const res = await fetch(url);
  return await res.json();
}

// =====================================================================
// POST KE GAS — untuk saveSingleCell & saveJadwalBatch
// Di localhost: otomatis fallback ke GET (hindari CORS preflight)
// Di server asli: tetap pakai POST seperti biasa
// =====================================================================
const IS_LOCALHOST = ['localhost', '127.0.0.1'].includes(location.hostname);

async function postGS(body) {
  if (IS_LOCALHOST) {
    // Serialize nilai berupa object/array (misal: changes) menjadi JSON string
    const params = {};
    for (const [k, v] of Object.entries(body)) {
      params[k] = (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v;
    }
    const url = GS_URL + '?' + new URLSearchParams(params).toString();
    const res = await fetch(url, { method: 'GET' });
    return await res.json();
  }

  const res = await fetch(GS_URL, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify(body)
  });
  return await res.json();
}

// =====================================================================
// LOADING OVERLAY
// =====================================================================
function buatLoadingOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.innerHTML = `
    <svg id="loading-svg" viewBox="0 0 100 100">
      <path d="M10,30 Q30,10 50,30 Q70,50 90,30" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round"
        stroke-dasharray="120" stroke-dashoffset="120">
        <animate attributeName="stroke-dashoffset" from="120" to="0" dur="0.8s" begin="0s" repeatCount="indefinite"/>
      </path>
      <path d="M10,50 Q30,70 50,50 Q70,30 90,50" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round"
        stroke-dasharray="120" stroke-dashoffset="120">
        <animate attributeName="stroke-dashoffset" from="120" to="0" dur="0.8s" begin="0.3s" repeatCount="indefinite"/>
      </path>
      <path d="M10,70 Q30,50 50,70 Q70,90 90,70" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round"
        stroke-dasharray="120" stroke-dashoffset="120">
        <animate attributeName="stroke-dashoffset" from="120" to="0" dur="0.8s" begin="0.6s" repeatCount="indefinite"/>
      </path>
    </svg>
    <div id="loading-text">MEMUAT DATA...</div>
  `;
  document.body.appendChild(overlay);
}

function showLoading(teks = 'MEMUAT DATA...') {
  const overlay = document.getElementById('loading-overlay');
  const txt     = document.getElementById('loading-text');
  if (txt) txt.textContent = teks;
  if (overlay) overlay.classList.add('aktif');
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.remove('aktif');
}

// =====================================================================
// INIT
// =====================================================================
async function init() {
  // Jika tidak ada mode di URL, tampilkan modal pilihan mode dulu
  if (!MODE) {
    _tampilModalPilihMode();
    return;
  }

  // Load tema CSS sesuai mode
  const linkTema = document.getElementById('tema-mode');
  if (linkTema) linkTema.href = `../css/${MODE}.css`;

  // Set running teks & warna sesuai mode
  const elWrap   = document.querySelector('.running-teks-wrap');
  const elTicker = document.getElementById('running-teks-isi');
  if (elWrap && elTicker) {
    if (MODE === 'PEL') {
      elWrap.classList.add('mode-pel');
      elTicker.classList.add('mode-pel');
      elTicker.innerHTML = ('<span class="mode-label">PELAKSANAAN KERJA</span> MODE  ● ').repeat(8);
    } else if (MODE === 'PEN') {
      elWrap.classList.add('mode-pen');
      elTicker.classList.add('mode-pen');
      elTicker.innerHTML = ('<span class="mode-label">PENGIRIMAN ABSENSI</span> MODE  ● ').repeat(8);
    }
  }

  buatLoadingOverlay();
  showLoading('MEMUAT DATA...');
  _initBackIntercept();

  try {
    const [resBulan, resUnit] = await Promise.all([
      fetchGS({ action: 'getAvailableMonths', mode: MODE }),
      fetchGS({ action: 'getUnits' })
    ]);

    dataBulan = resBulan;
    dataUnit  = resUnit;

    document.getElementById('info-bulan').textContent = `${dataBulan.length} bulan tersedia`;
    document.getElementById('info-unit').textContent  = 'Pilih bulan terlebih dahulu';

    setBtnBulanAktif(true);
    setBtnUnitAktif(false);
    setBtnAktif('btn-download', false);
    setBtnAktif('btn-edit', false);

    // Cek cache — langsung restore kalau ada
    const cache = muatCache();
    if (cache && cache.bulan && cache.unit) {
      selectedBulan = cache.bulan;
      selectedUnit  = cache.unit;

      const label = `${BULAN_NAMA[selectedBulan.value]} ${selectedBulan.tahun}`;
      document.getElementById('btn-bulan').textContent  = label;
      document.getElementById('x-bulan').style.display  = 'block';
      document.getElementById('info-bulan').textContent = `✅ ${label} dipilih`;
      document.getElementById('btn-unit').textContent   = selectedUnit;
      document.getElementById('x-unit').style.display   = 'block';
      document.getElementById('info-unit').textContent  = `✅ ${selectedUnit} dipilih`;

      setBtnBulanAktif(false);
      setBtnUnitAktif(false);
      renderHeader(selectedBulan);
      hideLoading();
      await loadJadwal();
      return;
    }

  } catch (err) {
    document.getElementById('info-bulan').textContent = '❌ Gagal memuat data';
    document.getElementById('info-unit').textContent  = '❌ Gagal memuat data';
    console.error('Init error:', err);
  }

  hideLoading();
}

// =====================================================================
// RENDER HEADER TABEL
// =====================================================================
function renderHeader(bulan) {
  const days      = new Date(parseInt(bulan.tahun), parseInt(bulan.value), 0).getDate();
  const trHari    = document.getElementById('tr-hari');
  const trTanggal = document.getElementById('tr-tanggal');
  const colgroup  = document.getElementById('colgroup-hari');

  // Hapus kolom lama
  trHari.querySelectorAll('th.col-hari').forEach(th => th.remove());
  trTanggal.innerHTML = '';
  colgroup.querySelectorAll('col.col-hari').forEach(c => c.remove());

  for (let col = 1; col <= days; col++) {
    const date      = new Date(parseInt(bulan.tahun), parseInt(bulan.value) - 1, col);
    const hari      = HARI_NAMES[date.getDay()];
    const isWeekend = HARI_WEEKEND.includes(hari);
    const isLast    = col === days;

    const c = document.createElement('col');
    c.className   = 'col-hari';
    c.dataset.col = col;
    colgroup.appendChild(c);

    const thH = document.createElement('th');
    thH.className   = 'col-hari' + (isLast ? ' last-col' : '');
    thH.dataset.col = col;
    thH.textContent = hari;
    thH.style.color = isWeekend ? 'red' : '';
    trHari.appendChild(thH);

    const thT = document.createElement('th');
    thT.className   = 'col-hari' + (isLast ? ' last-col' : '');
    thT.dataset.col = col;
    thT.textContent = col;
    thT.style.color = isWeekend ? 'red' : '';
    trTanggal.appendChild(thT);
  }

  // Update lebar tabel
  const lebarNo    = 25;
  const lebarNama  = window.innerHeight * 0.26;
  const lebarHari  = 40;
  const lebarTotal = (lebarNo + lebarNama + (lebarHari * days)) + 'px';
  const tabel      = document.getElementById('tabel-jadwal');
  tabel.style.width    = lebarTotal;
  tabel.style.minWidth = lebarTotal;

  // judul tidak perlu di-resize — lebarnya 100% viewport (di luar scroll wrapper)
}

// =====================================================================
// LOAD JADWAL
// =====================================================================
async function loadJadwal() {
  showLoading('MEMUAT JADWAL...');
  try {
    const data = await fetchGS({
      action : 'getJadwal',
      mode   : MODE,
      bulan  : selectedBulan.value,
      tahun  : selectedBulan.tahun,
      unit   : selectedUnit
    });

    if (!data.success) {
      alert('Gagal memuat jadwal: ' + data.message);
      hideLoading();
      return;
    }

    renderJadwal(data);

  } catch (err) {
    alert('Error memuat jadwal: ' + err.message);
    console.error(err);
  }
  hideLoading();
}

// =====================================================================
// RENDER JADWAL
// =====================================================================
function renderJadwal(data) {
  const bulanLabel = BULAN_NAMA[selectedBulan.value];
  const days       = data.headerTanggal.length;

  _setJudulTabel(
    `${JUDUL_MODE[MODE] || 'JADWAL KERJA'} — ${data.unitName} — ${bulanLabel} ${selectedBulan.tahun}`);

  const tbody = document.getElementById('tbody-data');
  tbody.innerHTML = '';

  data.personil.forEach((p, pIdx) => {
    const tr = document.createElement('tr');

    // Kolom NO
    const tdNo = document.createElement('td');
    tdNo.className   = 'col-no';
    tdNo.textContent = p.no;
    tr.appendChild(tdNo);

    // Kolom NAMA + HK grid
    const hk     = hitungHK(p.jadwal, data.headerHari, days);
    const tdNama = document.createElement('td');
    tdNama.className = 'col-nama';
    tdNama.innerHTML = `
      <div class="nama-cell">
        <span class="nama-text">${p.nama}</span>
        <div class="hk-grid">
          <div class="hk-item"><span class="lbl">HK</span><span class="val">${hk.hk}</span></div>
          <div class="hk-item"><span class="lbl">HL</span><span class="val">${hk.hl}</span></div>
          <div class="hk-item"><span class="lbl">HW</span><span class="val">${hk.hw}</span></div>
          <div class="hk-item"><span class="lbl">OFF</span><span class="val">${hk.off}</span></div>
        </div>
      </div>`;
    tr.appendChild(tdNama);

    // Kolom hari
    for (let col = 1; col <= days; col++) {
      const hari   = data.headerHari[col - 1];
      const isLast = col === days;
      const td     = document.createElement('td');
      td.className   = 'col-hari' + (isLast ? ' last-col' : '');
      td.dataset.col  = col;
      td.dataset.pIdx = pIdx;
      td.dataset.jIdx = col - 1;
      td.textContent  = p.jadwal[col - 1] || '';
      td.style.color  = HARI_WEEKEND.includes(hari) ? 'red' : '';
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  });

  setBtnAktif('btn-download', true);
  setBtnAktif('btn-edit', true);
  setBtnBulanAktif(false);
  setBtnUnitAktif(false);

  initScrollSync();
}

// =====================================================================
// HITUNG HK
// =====================================================================
function hitungHK(jadwal, headerHari, days) {
  let hk = 0, hl = 0, hw = 0, off = 0;

  for (let i = 0; i < days; i++) {
    const nilai     = (jadwal[i] || '').toUpperCase();
    const hari      = headerHari[i];
    const isWeekend = HARI_WEEKEND.includes(hari);

    // HW — jumlah hari SEN-JUM di bulan ini
    if (!isWeekend) hw++;

    if (isWeekend) {
      // HL — lembur SAB/MIN: P12 atau M12
      if      (nilai === 'P12' || nilai === 'M12')  hl++;
      // OFF/CUTI di SAB/MIN tetap dihitung
      else if (nilai === 'OFF' || nilai === 'CUTI') off++;
    } else {
      // HK — hari kerja SEN-JUM
      if      (nilai === 'SM')                        hk += 2;
      else if (nilai === 'OFF' || nilai === 'CUTI')   off++;
      else if (nilai !== '')                          hk += 1;
    }
  }

  return { hk, hl, hw, off };
}

// =====================================================================
// TUTUP JADWAL (dipanggil dari tombol.js saat reset unit)
// =====================================================================
function tutupJadwal() {
  document.getElementById('tbody-data').innerHTML = '';
  _setJudulTabel(
    `${JUDUL_MODE[MODE] || 'JADWAL KERJA'} — ${BULAN_NAMA[selectedBulan.value]} ${selectedBulan.tahun}`);
  setBtnAktif('btn-download', false);
  setBtnAktif('btn-edit', false);
}

// =====================================================================
// FADER — sinkronisasi scroll horizontal tabel
// =====================================================================
function initScrollSync() {
  if (faderInit) return;
  faderInit = true;

  const wrapper = document.querySelector('.jadwal-scroll-wrapper');
  const knob    = document.getElementById('fader-knob');
  const track   = knob?.parentElement;
  if (!wrapper || !knob || !track) return;

  wrapper.addEventListener('scroll', () => updateFader(wrapper, knob, track));

  // Mouse drag
  knob.onmousedown = (e) => {
    e.preventDefault();
    const startX    = e.clientX;
    const maxLeft   = track.clientWidth - knob.offsetWidth;
    const startLeft = parseFloat(knob.style.left) || 0;
    const onMove = (ev) => {
      const newLeft = Math.max(0, Math.min(startLeft + (ev.clientX - startX), maxLeft));
      knob.style.left    = newLeft + 'px';
      wrapper.scrollLeft = (newLeft / maxLeft) * (wrapper.scrollWidth - wrapper.clientWidth);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // Touch drag
  knob.addEventListener('touchstart', (e) => {
    const startX    = e.touches[0].clientX;
    const maxLeft   = track.clientWidth - knob.offsetWidth;
    const startLeft = parseFloat(knob.style.left) || 0;
    const onMove = (ev) => {
      const newLeft = Math.max(0, Math.min(startLeft + (ev.touches[0].clientX - startX), maxLeft));
      knob.style.left    = newLeft + 'px';
      wrapper.scrollLeft = (newLeft / maxLeft) * (wrapper.scrollWidth - wrapper.clientWidth);
    };
    const onEnd = () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
  }, { passive: true });
}

function updateFader(wrapper, knob, track) {
  const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
  if (maxScroll <= 0) return;
  const ratio   = wrapper.scrollLeft / maxScroll;
  const maxLeft = track.clientWidth - knob.offsetWidth;
  knob.style.left = (ratio * maxLeft) + 'px';
}

// =====================================================================
// START
// =====================================================================
document.addEventListener('DOMContentLoaded', init);