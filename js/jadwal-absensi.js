/* ═══════════════════════════════════════════
   KONFIGURASI GS
═══════════════════════════════════════════ */
const GS_URL = 'https://script.google.com/macros/s/AKfycbxCT9hMfzXw6y2ruQD8Wr9L3D83rspDGjCk31nVW96W6bZJKNGU13oKljYUE16sfWgtFg/exec';
const MODE   = 'PEN';

/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */
let selectedBulan = null;
let selectedUnit  = null;
let cacheBulan    = [];
let cacheUnit     = [];
const namaHari    = ['MIN','SEN','SEL','RAB','KAM','JUM','SAB'];

/* ═══════════════════════════════════════════
   FETCH HELPER
═══════════════════════════════════════════ */
async function fetchGS(params) {
  const url = GS_URL + '?' + new URLSearchParams(params).toString();
  const res = await fetch(url);
  return res.json();
}

/* ═══════════════════════════════════════════
   KOLOM — show/hide smooth via class
═══════════════════════════════════════════ */
function setKolom(jumlahHari) {
  document.querySelectorAll('.last-col').forEach(el => el.classList.remove('last-col'));

  document.querySelectorAll('[data-col]').forEach(el => {
    const col = parseInt(el.dataset.col);
    if (col > jumlahHari) {
      el.classList.add('hidden');
      el.style.borderRight = '';
    } else {
      el.classList.remove('hidden');
      if (selectedBulan) {
        if (el.tagName === 'TH' && el.closest('thead') && el.parentElement.id !== 'tr-tanggal') {
          el.textContent = namaHari[new Date(parseInt(selectedBulan.tahun), selectedBulan.value - 1, col).getDay()];
        }
        if (el.tagName === 'TH' && el.parentElement.id === 'tr-tanggal') {
          el.textContent = col;
        }
      }
      if (col === jumlahHari) {
        el.classList.add('last-col');
      }
    }
  });

  document.querySelectorAll('.jadwal table').forEach(t => {
    t.style.width    = `calc(var(--lebar-no) + var(--lebar-nama) + var(--lebar-hari) * ${jumlahHari})`;
    t.style.minWidth = `calc(var(--lebar-no) + var(--lebar-nama) + var(--lebar-hari) * ${jumlahHari})`;
  });

  setTimeout(updateThumb, 450);
}

setKolom(31);

function kosongkanData() {
  document.getElementById('tbody-data').querySelectorAll('tr').forEach(tr => {
    tr.querySelectorAll('td').forEach(td => td.textContent = '');
  });
  document.querySelector('.jadwal-judul').textContent = 'JADWAL XXXXXX UNIT XXX BULAN XXX';
}

function kosongkanHeader() {
  document.querySelectorAll('[data-col]').forEach(el => {
    if (el.tagName === 'TH') { el.textContent = ''; el.style.borderRight = ''; }
  });
}

/* ═══════════════════════════════════════════
   LOADING OVERLAY — animasi coretan
═══════════════════════════════════════════ */
(function _buatLoadingOverlay() {
  if (document.getElementById('loading-overlay')) return;
  const el = document.createElement('div');
  el.id = 'loading-overlay';
  el.innerHTML = `
    <svg id="loading-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"></svg>
    <div id="loading-text">MEMUAT...</div>
  `;
  document.body.appendChild(el);
})();

let _scribbleTimer = null;
let _scribbleAnim  = null;

function _acak(min, max) { return min + Math.random() * (max - min); }

function _buatPath() {
  // Garis coretan acak seperti tangan mencoret
  const pts = [];
  let x = _acak(20, 60), y = _acak(80, 120);
  pts.push(`M${x.toFixed(1)},${y.toFixed(1)}`);
  for (let i = 0; i < 8; i++) {
    x += _acak(10, 35) * (Math.random() > 0.3 ? 1 : -1);
    y += _acak(-20, 20);
    x = Math.max(5, Math.min(195, x));
    y = Math.max(10, Math.min(190, y));
    // Bezier kurva untuk efek tangan
    const cx1 = x + _acak(-15, 15), cy1 = y + _acak(-20, 20);
    pts.push(`Q${cx1.toFixed(1)},${cy1.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

function _animasiCoretan(svg) {
  svg.innerHTML = '';
  let delay = 0;

  // Buat 5 goresan berurutan
  for (let i = 0; i < 5; i++) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', _buatPath());
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', i % 2 === 0 ? '#000' : '#FFE600');
    path.setAttribute('stroke-width', _acak(2, 4).toFixed(1));
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);

    // Hitung panjang path lalu animasikan stroke-dashoffset
    const len = path.getTotalLength ? path.getTotalLength() : 200;
    path.style.strokeDasharray  = len;
    path.style.strokeDashoffset = len;
    path.style.transition       = `stroke-dashoffset ${_acak(0.3, 0.6).toFixed(2)}s ease ${delay}s`;
    // Trigger animasi setelah frame berikutnya
    requestAnimationFrame(() => requestAnimationFrame(() => {
      path.style.strokeDashoffset = '0';
    }));
    delay += _acak(0.15, 0.3);
  }

  // Ulangi terus
  _scribbleTimer = setTimeout(() => _animasiCoretan(svg), (delay + 0.4) * 1000);
}

function tampilLoading() {
  const overlay = document.getElementById('loading-overlay');
  const svg     = document.getElementById('loading-svg');
  if (!overlay) return;
  clearTimeout(_scribbleTimer);
  if (_scribbleAnim) cancelAnimationFrame(_scribbleAnim);
  overlay.classList.add('aktif');
  _animasiCoretan(svg);
}

function sembunyiLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (!overlay) return;
  clearTimeout(_scribbleTimer);
  overlay.classList.remove('aktif');
}

/* ═══════════════════════════════════════════
   LOAD JADWAL
═══════════════════════════════════════════ */
async function loadJadwal() {
  const judul = document.querySelector('.jadwal-judul');
  judul.textContent = '⏳ Memuat jadwal...';
  tampilLoading();

  try {
    const data = await fetchGS({
      action: 'getJadwal',
      mode  : MODE,
      bulan : selectedBulan.value,
      tahun : selectedBulan.tahun,
      unit  : selectedUnit
    });

    if (!data.success) {
      sembunyiLoading();
      judul.textContent = '✗ ' + data.message;
      return;
    }

    judul.textContent = `JADWAL ${MODE} — ${selectedUnit} — ${selectedBulan.label} ${selectedBulan.tahun}`;

    const tbody          = document.getElementById('tbody-data');
    const hari           = new Date(parseInt(selectedBulan.tahun), selectedBulan.value, 0).getDate();
    const jumlahPersonil = data.personil.length;

    // Tambah baris jika personil lebih dari 4
    const barisAda = tbody.querySelectorAll('tr').length;
    for (let i = barisAda; i < jumlahPersonil; i++) {
      const tr = document.createElement('tr');
      let html = `<td class="col-no"></td><td class="col-nama"></td>`;
      for (let d = 1; d <= 31; d++) {
        html += `<td class="col-hari" data-col="${d}"></td>`;
      }
      tr.innerHTML = html;
      tbody.appendChild(tr);
    }

    // Sembunyikan baris lebih
    tbody.querySelectorAll('tr').forEach((tr, i) => {
      tr.style.display = i < jumlahPersonil ? '' : 'none';
    });

    // Isi data
    tbody.querySelectorAll('tr').forEach((tr, i) => {
      const p = data.personil[i];
      if (!p) return;
      tr.querySelector('td.col-no').textContent   = p.no;
      tr.querySelector('td.col-nama').textContent = p.nama;
      tr.querySelectorAll('td.col-hari').forEach(td => {
        const col = parseInt(td.dataset.col);
        td.textContent = col <= hari ? (p.jadwal[col - 1] || '') : '';
      });
    });

    // Aktifkan scroll vertikal jika personil > 4
    const perluVScroll = jumlahPersonil > 4;
    bodyWrapper.style.overflowY = perluVScroll ? 'auto' : 'hidden';
    vTrack.classList.toggle('aktif', perluVScroll);
    if (perluVScroll) setTimeout(updateVThumb, 50);

    // Aktifkan tombol download dan edit
    ['btn-download','btn-edit'].forEach(id => {
      const btn = document.getElementById(id);
      btn.disabled = false; btn.style.cursor = 'pointer'; btn.style.opacity = '1';
    });

    updateThumb();
    sembunyiLoading();
  } catch(err) {
    sembunyiLoading();
    document.querySelector('.jadwal-judul').textContent = '✗ Gagal memuat jadwal';
    console.error(err);
  }
}

/* ═══════════════════════════════════════════
   DOWNLOAD
═══════════════════════════════════════════ */
function downloadJadwal() {
  // TODO: implementasi download
}


/* ═══════════════════════════════════════════
   PRELOAD
═══════════════════════════════════════════ */
function setButtonReady(id, infoId, txt) {
  const btn = document.getElementById(id);
  btn.disabled = false; btn.style.cursor = 'pointer'; btn.style.opacity = '1';
  const info = document.getElementById(infoId);
  info.textContent = txt; info.style.color = '#228B22';
}
function setButtonError(infoId, txt) {
  const info = document.getElementById(infoId);
  info.textContent = txt; info.style.color = 'red';
}

async function preloadData() {
  tampilLoading();
  const [resBulan, resUnit] = await Promise.allSettled([
    fetchGS({ action: 'getAvailableMonths', mode: MODE }),
    fetchGS({ action: 'getUnits' })
  ]);

  sembunyiLoading();

  if (resBulan.status === 'fulfilled' && Array.isArray(resBulan.value) && resBulan.value.length > 0) {
    cacheBulan = resBulan.value;
    setButtonReady('btn-bulan', 'info-bulan', '✓ ' + cacheBulan.length + ' bulan tersedia');
  } else {
    setButtonError('info-bulan', '✗ Gagal memuat data bulan');
  }

  if (resUnit.status === 'fulfilled' && Array.isArray(resUnit.value) && resUnit.value.length > 0) {
    cacheUnit = resUnit.value;
    document.getElementById('info-unit').textContent = 'Pilih bulan terlebih dahulu';
    document.getElementById('info-unit').style.color = '#888';
  } else {
    setButtonError('info-unit', '✗ Gagal memuat data unit');
  }
}

/* ═══════════════════════════════════════════
   MODAL
═══════════════════════════════════════════ */
function openModal(type) {
  const content  = document.getElementById('modal-content');
  const modalBox = document.getElementById('modal-box');
  document.getElementById('modal-footer').style.display = 'flex';
  document.getElementById('modal-overlay').style.display = 'flex';

  if (type === 'bulan') {
    modalBox.style.width  = '50vw';
    content.style.padding = '1.5vh 1.5vw';
    content.style.gap     = '1vh';
    _pushState('modal-bulan');
    document.getElementById('modal-title-text').textContent = 'PILIH BULAN';
    content.style.gridTemplateColumns = 'repeat(3, 1fr)';
    content.innerHTML = cacheBulan.map(b =>
      `<button onclick="pilihBulan(${b.value},'${b.tahun}','${b.label}')"
        style="border:2px solid #000; background:#fff; padding:1.2vh 0; font-family:'Share Tech Mono',monospace; font-size:2vh; cursor:pointer;"
        onmouseover="this.style.background='#000';this.style.color='#fff'"
        onmouseout="this.style.background='#fff';this.style.color='#000'">
        ${b.label}<br><span style="font-size:1.6vh;">${b.tahun}</span>
      </button>`
    ).join('');
  } else if (type === 'unit') {
    modalBox.style.width  = '85vw';
    content.style.padding = '1.5vh 2vw';
    content.style.gap     = '0.8vh';
    _pushState('modal-unit');
    document.getElementById('modal-title-text').textContent = 'PILIH UNIT';
    content.style.gridTemplateColumns = 'repeat(3, 1fr)';
    content.innerHTML = cacheUnit.map(u =>
      `<button onclick="pilihUnit('${u.replace(/'/g,"\\'")}')"
        style="border:2px solid #000; background:#fff; padding:1.4vh 0; font-family:'Share Tech Mono',monospace; font-size:clamp(11px,1.9vh,16px); cursor:pointer; width:100%; letter-spacing:0.04em;"
        onmouseover="this.style.background='#000';this.style.color='#fff'"
        onmouseout="this.style.background='#fff';this.style.color='#000'">
        ${u}
      </button>`
    ).join('');
  }
}

function _kunciModal() {
  // Blokir klik di luar modal (overlay tidak bisa tutup)
  const overlay = document.getElementById('modal-overlay');
  overlay.onclick = function(e) { e.stopPropagation(); };
  overlay.style.pointerEvents = 'all';
  // Tombol ✕ pojok kanan atas tetap tampil
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.getElementById('modal-footer').style.display = 'flex';
  // Restore overlay: klik luar bisa tutup lagi
  document.getElementById('modal-overlay').style.pointerEvents = '';
  document.getElementById('modal-overlay').onclick = closeModal;
}

/* ═══════════════════════════════════════════
   PILIH & RESET
═══════════════════════════════════════════ */
function pilihBulan(value, tahun, label) {
  selectedBulan = { value, tahun, label };
  const btn = document.getElementById('btn-bulan');
  btn.textContent = label + ' ' + tahun;
  btn.disabled = true; btn.style.cursor = 'not-allowed'; btn.style.opacity = '0.8';
  document.getElementById('x-bulan').style.display = 'flex';
  document.getElementById('info-bulan').textContent = '';
  const hari = new Date(parseInt(tahun), value, 0).getDate();
  setKolom(hari);
  enableUnit();
  closeModal();
}

function pilihUnit(nama) {
  selectedUnit = nama;
  const btn = document.getElementById('btn-unit');
  btn.textContent = nama;
  btn.disabled = true; btn.style.cursor = 'not-allowed'; btn.style.opacity = '0.8';
  document.getElementById('x-unit').style.display = 'flex';
  document.getElementById('info-unit').textContent = '';
  loadJadwal();
  closeModal();
}

function enableUnit() {
  const btn = document.getElementById('btn-unit');
  btn.disabled = false; btn.style.cursor = 'pointer'; btn.style.opacity = '1';
  document.getElementById('info-unit').textContent = '✓ ' + cacheUnit.length + ' unit tersedia';
  document.getElementById('info-unit').style.color = '#228B22';
}

function resetUnit() {
  selectedUnit = null;
  const btn = document.getElementById('btn-unit');
  btn.textContent = '— PILIH UNIT —';
  btn.disabled = true; btn.style.cursor = 'not-allowed'; btn.style.opacity = '0.5';
  document.getElementById('x-unit').style.display = 'none';
  document.getElementById('info-unit').textContent = '';
  kosongkanData();
  bodyWrapper.style.overflowY = 'hidden';
  vTrack.classList.remove('aktif');
  ['btn-download','btn-edit'].forEach(id => {
    const btn = document.getElementById(id);
    btn.disabled = true; btn.style.cursor = 'not-allowed'; btn.style.opacity = '0.5';
  });
}

function konfirmasiResetUnit() {
  const namaUnit = selectedUnit || 'unit ini';
  _pushState('modal-konfirmasi-unit');
  document.getElementById('modal-title-text').textContent = 'KONFIRMASI';
  document.getElementById('modal-content').style.gridTemplateColumns = '1fr';
  document.getElementById('modal-content').innerHTML = `
    <div style="text-align:center; padding:2vh 1vw; font-size:2vh; line-height:2;">
      Anda sedang melihat jadwal<br><strong>${namaUnit}</strong>
    </div>
    <div style="display:flex; flex-direction:column; gap:1vh; padding:0 1vw 1.5vh;">
      <button onclick="doResetUnit(false)" style="border:2px solid #000; background:#fff; padding:1.5vh; font-family:'Share Tech Mono',monospace; font-size:1.9vh; cursor:pointer;" onmouseover="this.style.background='#000';this.style.color='#fff'" onmouseout="this.style.background='#fff';this.style.color='#000'">Tutup Jadwal ${namaUnit}</button>
      <button onclick="doResetUnit(true)"  style="border:2px solid #000; background:#fff; padding:1.5vh; font-family:'Share Tech Mono',monospace; font-size:1.9vh; cursor:pointer;" onmouseover="this.style.background='#000';this.style.color='#fff'" onmouseout="this.style.background='#fff';this.style.color='#000'">Ganti Jadwal Lain</button>
      <button onclick="closeModal()" style="border:2px solid #000; background:#fff; padding:1.5vh; font-family:'Share Tech Mono',monospace; font-size:1.9vh; cursor:pointer; color:#888;" onmouseover="this.style.background='#000';this.style.color='#fff'" onmouseout="this.style.background='#fff';this.style.color='#888'">✕ Batal</button>
    </div>`;
  document.getElementById('modal-footer').style.display = 'none';
  _kunciModal();
  document.getElementById('modal-overlay').style.display = 'flex';
}

function doResetUnit(gantiLain) {
  document.getElementById('modal-footer').style.display = 'flex';
  resetUnit();
  enableUnit();
  if (gantiLain) openModal('unit');
  else closeModal();
}

function konfirmasiResetBulan() {
  const namaBulan = selectedBulan ? selectedBulan.label + ' ' + selectedBulan.tahun : 'bulan ini';
  _pushState('modal-konfirmasi-bulan');
  document.getElementById('modal-title-text').textContent = 'KONFIRMASI';
  document.getElementById('modal-content').style.gridTemplateColumns = '1fr';
  document.getElementById('modal-content').innerHTML = `
    <div style="text-align:center; padding:2vh 1vw; font-size:2vh; line-height:2;">
      Anda sedang melihat jadwal bulan<br><strong>${namaBulan}</strong>
    </div>
    <div style="display:flex; flex-direction:column; gap:1vh; padding:0 1vw 1.5vh;">
      <button onclick="doResetBulan()" style="border:2px solid #000; background:#fff; padding:1.5vh; font-family:'Share Tech Mono',monospace; font-size:1.9vh; cursor:pointer;" onmouseover="this.style.background='#000';this.style.color='#fff'" onmouseout="this.style.background='#fff';this.style.color='#000'">Tutup Jadwal ${namaBulan}</button>
      <button onclick="closeModal()" style="border:2px solid #000; background:#fff; padding:1.5vh; font-family:'Share Tech Mono',monospace; font-size:1.9vh; cursor:pointer; color:#888;" onmouseover="this.style.background='#000';this.style.color='#fff'" onmouseout="this.style.background='#fff';this.style.color='#888'">✕ Batal</button>
    </div>`;
  document.getElementById('modal-footer').style.display = 'none';
  _kunciModal();
  document.getElementById('modal-overlay').style.display = 'flex';
}

function doResetBulan() {
  document.getElementById('modal-footer').style.display = 'flex';
  resetUnit();
  selectedBulan = null;
  const btn = document.getElementById('btn-bulan');
  btn.textContent = '— PILIH BULAN —';
  btn.disabled = false; btn.style.cursor = 'pointer'; btn.style.opacity = '1';
  document.getElementById('x-bulan').style.display = 'none';
  document.getElementById('info-bulan').textContent = '✓ ' + cacheBulan.length + ' bulan tersedia';
  document.getElementById('info-bulan').style.color = '#228B22';
  document.getElementById('info-unit').textContent  = 'Pilih bulan terlebih dahulu';
  document.getElementById('info-unit').style.color  = '#888';
  document.querySelectorAll('[data-col]').forEach(el => el.classList.remove('hidden'));
  kosongkanHeader();
  document.querySelectorAll('.jadwal table').forEach(t => {
    t.style.width = ''; t.style.minWidth = '';
  });
  setTimeout(updateThumb, 450);
  closeModal();
}

/* ═══════════════════════════════════════════
   SCROLLBAR CUSTOM
═══════════════════════════════════════════ */
const headerWrapper = document.querySelector('.jadwal-header-wrapper');
const bodyWrapper   = document.querySelector('.jadwal-body-wrapper');
const track         = document.querySelector('.jadwal-scrollbar');
const thumb         = document.querySelector('.jadwal-scrollbar-thumb');

function updateThumb() {
  const table      = bodyWrapper.querySelector('table');
  const scrollable = table.offsetWidth - bodyWrapper.offsetWidth;
  const ratio      = bodyWrapper.offsetWidth / table.offsetWidth;
  const thumbW     = Math.max(track.offsetWidth * ratio, 20);
  const thumbLeft  = scrollable > 0 ? (bodyWrapper.scrollLeft / scrollable) * (track.offsetWidth - thumbW) : 0;
  thumb.style.width = thumbW + 'px';
  thumb.style.left  = thumbLeft + 'px';
}

const vTrack = document.getElementById('vscrollbar');
const vThumb = document.getElementById('vscrollbar-thumb');

function updateVThumb() {
  const scrollable = bodyWrapper.scrollHeight - bodyWrapper.clientHeight;
  if (scrollable <= 0) { vThumb.style.height = '100%'; vThumb.style.top = '0'; return; }
  const ratio  = bodyWrapper.clientHeight / bodyWrapper.scrollHeight;
  const thumbH = Math.max(vTrack.clientHeight * ratio, 20);
  const thumbT = (bodyWrapper.scrollTop / scrollable) * (vTrack.clientHeight - thumbH);
  vThumb.style.height = thumbH + 'px';
  vThumb.style.top    = thumbT + 'px';
}

bodyWrapper.addEventListener('scroll', () => {
  headerWrapper.scrollLeft = bodyWrapper.scrollLeft;
  updateThumb();
  updateVThumb();
});

let vDragging = false, vStartY, vStartTop;
vThumb.addEventListener('mousedown', e => {
  vDragging = true; vStartY = e.clientY; vStartTop = bodyWrapper.scrollTop;
  e.preventDefault();
});
document.addEventListener('mousemove', e => {
  if (!vDragging) return;
  const scrollable = bodyWrapper.scrollHeight - bodyWrapper.clientHeight;
  const trackH     = vTrack.clientHeight - vThumb.clientHeight;
  bodyWrapper.scrollTop = vStartTop + ((e.clientY - vStartY) / trackH) * scrollable;
});
document.addEventListener('mouseup', () => vDragging = false);

let dragging = false, startX, startLeft;
thumb.addEventListener('mousedown', e => {
  dragging = true; startX = e.clientX; startLeft = bodyWrapper.scrollLeft;
  e.preventDefault();
});
document.addEventListener('mousemove', e => {
  if (!dragging) return;
  const table      = bodyWrapper.querySelector('table');
  const scrollable = table.offsetWidth - bodyWrapper.offsetWidth;
  const trackW     = track.offsetWidth - thumb.offsetWidth;
  bodyWrapper.scrollLeft = startLeft + ((e.clientX - startX) / trackW) * scrollable;
});
document.addEventListener('mouseup', () => dragging = false);
track.addEventListener('click', e => {
  if (e.target === thumb) return;
  const table      = bodyWrapper.querySelector('table');
  const scrollable = table.offsetWidth - bodyWrapper.offsetWidth;
  bodyWrapper.scrollLeft = ((e.offsetX - thumb.offsetWidth / 2) / (track.offsetWidth - thumb.offsetWidth)) * scrollable;
});

updateThumb();
window.addEventListener('resize', updateThumb);

/* ═══════════════════════════════════════════
   HISTORY API — tombol back HP & tombol ←
═══════════════════════════════════════════ */

// State stack: 'home' | 'modal-bulan' | 'modal-unit' | 'modal-konfirmasi-unit' | 'modal-konfirmasi-bulan' | 'edit' | 'konfirmasi-batal'
// Kita pakai replaceState untuk state awal, pushState tiap transisi

function _pushState(state) {
  history.pushState({ state }, '', location.href.split('?')[0]);
}

function aksiKembali() {
  history.back();
}

window.addEventListener('popstate', function(e) {
  const state = e.state && e.state.state;

  if (!state || state === 'home') {
    // Sudah di paling awal — ke index.html
    location.href = '/index.html';
    return;
  }

  if (state === 'modal-bulan' || state === 'modal-unit') {
    closeModal();
    return;
  }

  if (state === 'modal-konfirmasi-unit' || state === 'modal-konfirmasi-bulan') {
    closeModal();
    return;
  }

  if (state === 'edit') {
    // Panggil batalEdit dari edit js
    if (typeof batalEdit === 'function') batalEdit();
    return;
  }

  if (state === 'konfirmasi-batal') {
    // Kembali dari konfirmasi batal → lanjut edit
    if (typeof _konfirmasiBatalTidak === 'function') _konfirmasiBatalTidak();
    return;
  }
});

// Set state awal
history.replaceState({ state: 'home' }, '', location.href.split('?')[0]);

preloadData();