// =====================================================================
// LOADING HELPER — animasi titik pada tombol saat menunggu server
// Pakai di semua modal yang ada fetch/async
// =====================================================================
(function _injectLoadingStyle() {
  if (document.getElementById('style-loading-btn')) return;
  const s = document.createElement('style');
  s.id = 'style-loading-btn';
  s.textContent = `
    @keyframes _dotPulse {
      0%,80%,100% { opacity: 0.2; transform: scale(0.8); }
      40%          { opacity: 1;   transform: scale(1.2); }
    }
    .mp-loading-dots {
      display: inline-flex; align-items: center; justify-content: center;
      gap: 5px; pointer-events: none;
    }
    .mp-loading-dots span {
      width: 6px; height: 6px; border-radius: 50%;
      background: currentColor; display: inline-block;
      animation: _dotPulse 1.2s ease-in-out infinite;
    }
    .mp-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
    .mp-loading-dots span:nth-child(3) { animation-delay: 0.4s; }
  `;
  document.head.appendChild(s);
})();

function _setBtnLoading(btn, aktif, labelAsli) {
  if (aktif) {
    btn.disabled = true;
    btn.style.cursor = 'not-allowed';
    btn.style.opacity = '0.75';
    btn.innerHTML = '<span class="mp-loading-dots"><span></span><span></span><span></span></span>';
  } else {
    btn.disabled = false;
    btn.style.cursor = 'pointer';
    btn.style.opacity = '1';
    btn.textContent = labelAsli || 'MASUK';
  }
}

// =====================================================================
// VISUAL VIEWPORT HELPER — cegah modal tertutup keyboard HP
// Pasang ke overlay setiap modal yang ada input teks
// =====================================================================
function _pasangViewportFix(overlay) {
  if (!window.visualViewport) return;

  const inner = overlay.querySelector('div');  // kotak modal di dalam overlay
  if (!inner) return;

  // Simpan posisi awal
  inner.style.transition   = 'transform 0.15s ease';
  inner.style.willChange   = 'transform';

  function _adjustPos() {
    const vv        = window.visualViewport;
    const vvTop     = vv.offsetTop;
    const vvHeight  = vv.height;
    const rect      = inner.getBoundingClientRect();
    const modalH    = rect.height;

    // Posisi ideal: tengah visual viewport
    const idealTop  = vvTop + (vvHeight - modalH) / 2;
    // Posisi aktual tengah layar penuh
    const fullMid   = (window.innerHeight - modalH) / 2;
    const delta     = idealTop - fullMid;

    inner.style.transform = delta !== 0 ? `translateY(${delta}px)` : '';
  }

  function _reset() {
    inner.style.transform = '';
  }

  window.visualViewport.addEventListener('resize', _adjustPos);
  window.visualViewport.addEventListener('scroll', _adjustPos);

  // Bersihkan listener saat overlay dihapus pakai MutationObserver
  const obs = new MutationObserver(() => {
    if (!document.body.contains(overlay)) {
      window.visualViewport.removeEventListener('resize', _adjustPos);
      window.visualViewport.removeEventListener('scroll', _adjustPos);
      obs.disconnect();
    }
  });
  obs.observe(document.body, { childList: true, subtree: false });
}

// =====================================================================
// CACHE — simpan pilihan bulan & unit di sessionStorage selama 10 menit
// =====================================================================
const CACHE_KEY    = 'jadwal_cache';
const CACHE_DURASI = 10 * 60 * 1000;

function simpanCache() {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({
    bulan     : selectedBulan,
    unit      : selectedUnit,
    role      : roleTerlogin,
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
// =====================================================================
// KUNCI / BEBAS FOOTER saat modal aktif
// =====================================================================
function _kunciFooter() {
  ['btn-admin-mode','btn-admin-panel','z-05','z-07','z-10'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.pointerEvents = 'none'; el.style.opacity = '0.4'; }
  });
}
function _bebasFooter() {
  ['btn-admin-mode','btn-admin-panel','z-05','z-07','z-10'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.pointerEvents = ''; el.style.opacity = ''; }
  });
}

// =====================================================================
// STYLE TOMBOL PILIH — sudah pilih vs belum pilih
// =====================================================================
function _styleBtn(id, terpilih, teks) {
  const btn  = document.getElementById(id);
  const wrap = document.getElementById('wrap-' + id.replace('btn-', ''));
  if (!btn) return;
  if (terpilih) {
    btn.textContent      = teks;
    btn.style.opacity    = '1';
    btn.style.fontWeight = 'bold';
    btn.style.cursor     = 'pointer';
    if (wrap) wrap.classList.add('terpilih');
  } else {
    btn.textContent      = teks;
    btn.style.opacity    = '1';
    btn.style.fontWeight = 'normal';
    btn.style.cursor     = 'not-allowed';
    if (wrap) wrap.classList.remove('terpilih');
  }
}

// =====================================================================
// HELPER STYLE TOMBOL PILIH — dipilih vs belum
// =====================================================================
function _setTombolDipilih(tipe, teks) {
  const btn  = document.getElementById(`btn-${tipe}`);
  const wrap = document.getElementById(`wrap-${tipe}`);
  if (!btn || !wrap) return;
  btn.textContent   = `✅ ${teks}`;
  btn.style.opacity = '1';
  btn.style.fontWeight = 'bold';
  wrap.style.background = 'var(--tema-sedang, #e8f5e9)';
  wrap.style.borderWidth = '2px';
}

function _setTombolBelumDipilih(tipe, teks) {
  const btn  = document.getElementById(`btn-${tipe}`);
  const wrap = document.getElementById(`wrap-${tipe}`);
  if (!btn || !wrap) return;
  btn.textContent      = tipe === 'bulan' ? '📅 PILIH BULAN' : '🏢 PILIH UNIT';
  btn.style.opacity    = '0.5';
  btn.style.fontWeight = 'normal';
  wrap.style.background = 'transparent';
}

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
      btn.style.cssText = `min-height:clamp(28px,4.5vh,44px); height:auto; border:2px solid #000;
        background:${terpilih ? '#000' : '#fff'}; color:${terpilih ? '#fff' : '#000'};
        font-family:'Share Tech Mono',monospace; font-size:clamp(8px,1.5vh,13px);
        cursor:pointer; letter-spacing:0.03em; white-space:normal; word-break:break-word;
        padding:clamp(4px,0.8vh,8px) 4px; line-height:1.3; text-align:center; box-sizing:border-box;`;
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
      btn.style.cssText = `min-height:clamp(28px,4.5vh,44px); height:auto; border:2px solid #000;
        background:${terpilih ? '#000' : '#fff'}; color:${terpilih ? '#fff' : '#000'};
        font-family:'Share Tech Mono',monospace; font-size:clamp(8px,1.5vh,13px);
        cursor:pointer; letter-spacing:0.03em; white-space:normal; word-break:break-word;
        padding:clamp(4px,0.8vh,8px) 4px; line-height:1.3; text-align:center; box-sizing:border-box;`;
      btn.onmouseover = () => { if (!terpilih) btn.style.background = '#f0f0f0'; };
      btn.onmouseout  = () => { if (!terpilih) btn.style.background = '#fff'; };
      btn.onclick     = () => pilihUnit(u);
      content.appendChild(btn);
    });
  }

  overlay.style.display = 'flex';
  _kunciFooter();
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  _bebasFooter();
}

// =====================================================================
// PILIH BULAN
// =====================================================================
function pilihBulan(b) {
  selectedBulan = b;
  selectedUnit  = null;

  const label = `${BULAN_NAMA[b.value]} ${b.tahun}`;
  _styleBtn('btn-bulan', true, label);
  document.getElementById('x-bulan').style.display  = 'block';
  document.getElementById('info-bulan').textContent = `✅ ${label} dipilih`;

  // Reset unit
  _styleBtn('btn-unit', false, '— PILIH UNIT —');
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
// =====================================================================
// STATE LOGIN
// =====================================================================
window.unitTerlogin = null;
window.roleTerlogin = null;

// =====================================================================
// PILIH UNIT — tampil modal password dulu
// =====================================================================
function pilihUnit(u) {
  closeModal();
  // Kalau admin mode sudah aktif → skip password, langsung proses
  if (adminMode) {
    _prosesUnitTerpilih(u);
    return;
  }
  tampilModalPassword(u);
}

// =====================================================================
// MODAL PASSWORD
// =====================================================================
function tampilModalPassword(u) {
  const existing = document.getElementById('modal-password-overlay');
  if (existing) existing.remove();

  // Inject style ke head
  if (!document.getElementById('style-modal-password')) {
    const s = document.createElement('style');
    s.id = 'style-modal-password';
    s.textContent = `
      #modal-password-overlay .mp-input {
        width:100% !important; padding:1vh 1vw !important;
        border:2px solid #000 !important; background:#fff !important;
        color:#000 !important; font-family:'Share Tech Mono',monospace !important;
        font-size:clamp(12px,1.8vh,16px) !important;
        letter-spacing:0.1em !important; box-sizing:border-box !important;
        text-align:center !important;
      }
      #modal-password-overlay .mp-btn {
        flex:1 !important; height:clamp(32px,5vh,48px) !important;
        border:none !important; font-family:'Share Tech Mono',monospace !important;
        font-size:clamp(10px,1.6vh,14px) !important; cursor:pointer !important;
      }
      #modal-password-overlay .mp-btn-masuk {
        background:#000 !important; color:#fff !important;
        border-right:2px solid #000 !important;
      }
      #modal-password-overlay .mp-btn-masuk:hover {
        background:#333 !important;
      }
      #modal-password-overlay .mp-btn-batal {
        background:#fff !important; color:#000 !important;
      }
      #modal-password-overlay .mp-btn-batal:hover {
        background:#f0f0f0 !important;
      }
      #modal-password-overlay .mp-error {
        color:#c62828 !important; font-size:clamp(9px,1.4vh,12px) !important;
        text-align:center !important; min-height:2vh !important;
        font-family:'Share Tech Mono',monospace !important;
      }
    `;
    document.head.appendChild(s);
  }

  const overlay = document.createElement('div');
  overlay.id = 'modal-password-overlay';
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.55);
    z-index:400; display:flex; align-items:center; justify-content:center;
  `;
  overlay.innerHTML = `
    <div style="background:#fff; border:2px solid #000;
      width:clamp(260px,80vw,400px); font-family:'Share Tech Mono',monospace;">
      <div style="min-height:6vh; border-bottom:2px solid #000; display:flex;
        align-items:center; justify-content:center; padding:0.5vh 6vh 0.5vh 1vh;
        font-weight:bold; font-size:clamp(11px,1.8vh,16px); text-align:center;
        position:relative; box-sizing:border-box;">
        🔒 ${u}
        <button id="mp-btn-x" style="position:absolute; right:0; top:0; height:100%; width:6vh;
          border:none; border-left:2px solid #c62828; background:#c62828; color:#fff;
          font-family:'Share Tech Mono',monospace; font-size:clamp(12px,2vh,18px); cursor:pointer;
          display:flex; align-items:center; justify-content:center;">✕</button>
      </div>
      <div style="padding:2vh 3vw; display:flex; flex-direction:column; gap:1.5vh;">
        <div style="font-size:clamp(9px,1.3vh,12px); color:#555; text-align:center; letter-spacing:0.05em;">
          Masukkan password untuk membuka jadwal unit ini
        </div>
        <input class="mp-input" id="mp-input" type="password"
          placeholder="PASSWORD" autocomplete="off">
        <div class="mp-error" id="mp-error"></div>
      </div>
      <div style="border-top:2px solid #000; display:flex;">
        <button class="mp-btn mp-btn-masuk" id="mp-btn-masuk">MASUK</button>
        <button class="mp-btn mp-btn-batal" id="mp-btn-batal">BATAL</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  _pasangViewportFix(overlay);
  _kunciFooter();

  const input   = overlay.querySelector('#mp-input');
  const errEl   = overlay.querySelector('#mp-error');
  const btnMasuk = overlay.querySelector('#mp-btn-masuk');
  const btnBatal = overlay.querySelector('#mp-btn-batal');

  // Fokus otomatis
  setTimeout(() => input.focus(), 100);

  // Enter = submit
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') btnMasuk.click();
  });

  overlay.querySelector('#mp-btn-x').addEventListener('click', () => { overlay.remove(); _bebasFooter(); });
  btnBatal.addEventListener('click', () => { overlay.remove(); _bebasFooter(); });

  btnMasuk.addEventListener('click', async () => {
    const pass = input.value.trim();
    if (!pass) { errEl.textContent = '⚠ Password tidak boleh kosong'; return; }

    _setBtnLoading(btnMasuk, true);
    input.disabled    = true;
    errEl.textContent = '';

    try {
      const res = await fetchGS({ action: 'checkPassword', unit: u, password: pass });

      if (res.success) {
        // Login berhasil
        window.unitTerlogin = res.unit;
        window.roleTerlogin = res.role;
        overlay.remove(); _bebasFooter();
        await _prosesUnitTerpilih(u);
      } else {
        errEl.textContent    = '❌ ' + (res.message || 'Password salah');
        input.value          = '';
        input.focus();
        _setBtnLoading(btnMasuk, false, 'MASUK');
        input.disabled = false;
      }
    } catch (err) {
      errEl.textContent    = '❌ Gagal terhubung ke server';
      _setBtnLoading(btnMasuk, false, 'MASUK');
      input.disabled = false;
    }
  });
}

// =====================================================================
// PROSES UNIT TERPILIH — setelah login berhasil
// =====================================================================
async function _prosesUnitTerpilih(u) {
  // Kalau admin → bisa pilih unit mana saja
  // Kalau user → unit terkunci ke yang dipilih
  const isAdmin = window.roleTerlogin === 'admin';

  selectedUnit = (isAdmin && u === 'ADMIN') ? null : u;

  // Update UI tombol admin mode
  if (isAdmin) {
    adminMode = true;
    const indicator = document.getElementById('admin-mode-indicator');
    const btnAdmin  = document.getElementById('btn-admin-mode');
    if (indicator) indicator.textContent = '🔓';
    if (btnAdmin)  { btnAdmin.style.setProperty('background','#2e7d32','important'); btnAdmin.style.fontWeight = 'bold'; }
    const btnPanel = document.getElementById('btn-admin-panel');
    if (btnPanel) btnPanel.style.display = 'block';
    window.dispatchEvent(new CustomEvent('adminModeChange', { detail: { aktif: true } }));

    // Admin: buka kembali modal pilih unit
    if (u === 'ADMIN') {
      document.getElementById('btn-unit').textContent  = '— PILIH UNIT —';
      document.getElementById('x-unit').style.display  = 'none';
      document.getElementById('info-unit').textContent = `🔓 Admin — pilih unit`;
      setBtnUnitAktif(true);
      openModal('unit');
      return;
    }
  }

  _styleBtn('btn-unit', true, u);
  document.getElementById('x-unit').style.display  = 'block';
  document.getElementById('info-unit').textContent = `✅ ${u} dipilih`;

  const label = `${BULAN_NAMA[selectedBulan.value]} ${selectedBulan.tahun}`;
  _setJudulTabel(`${JUDUL_MODE[MODE] || 'JADWAL KERJA'} — ${label} — ${u}`);

  setBtnUnitAktif(false);
  simpanCache();
  await loadJadwal();

  // Semua yang sudah login boleh edit & download
  setBtnAktif('btn-edit', true);
  setBtnAktif('btn-download', true);
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
    <div style="background:#fff; border:2px solid #000; width:clamp(220px,90vw,400px); font-family:'Share Tech Mono',monospace; box-sizing:border-box;">
      <div style="min-height:6vh; border-bottom:2px solid #000; display:flex; align-items:center;
        justify-content:center; font-weight:bold; font-size:clamp(11px,1.7vh,15px);
        position:relative; padding:0.5vh 6vh 0.5vh 1vh; box-sizing:border-box; text-align:center;">
        KONFIRMASI
        <button id="konfirmasi-x" style="position:absolute; right:0; top:0; height:100%; width:6vh;
          border:none; border-left:2px solid #c62828; background:#c62828; color:#fff;
          font-family:'Share Tech Mono',monospace; font-size:clamp(11px,1.8vh,15px); cursor:pointer;">✕</button>
      </div>
      <div style="padding:1.5vh 2vw; font-size:clamp(10px,1.6vh,14px); text-align:center; line-height:1.7;">${pesan}</div>
      <div style="min-height:6vh; border-top:2px solid #000; display:flex;">
        <button id="konfirmasi-ya"
          style="flex:1; border:none; border-right:2px solid #000; background:#000; color:#fff;
          font-family:'Share Tech Mono',monospace; font-size:clamp(10px,1.6vh,14px); cursor:pointer;">YA</button>
        <button id="konfirmasi-tidak"
          style="flex:1; border:none; background:#fff;
          font-family:'Share Tech Mono',monospace; font-size:clamp(10px,1.6vh,14px); cursor:pointer;">TIDAK</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  _kunciFooter();
  const btnX     = document.getElementById('konfirmasi-x');
  const btnYa    = document.getElementById('konfirmasi-ya');
  const btnTidak = document.getElementById('konfirmasi-tidak');

  btnX.onclick     = () => { overlay.remove(); _bebasFooter(); };
  btnTidak.onclick = () => { overlay.remove(); _bebasFooter(); };
  btnYa.onclick    = () => {
    // Loading saat YA diklik — cegah double-klik
    _setBtnLoading(btnYa, true, 'YA');
    btnTidak.disabled = true;
    btnX.disabled     = true;
    overlay.remove(); _bebasFooter();
    onYa();
  };
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
    <div style="background:#fff; border:2px solid #000; width:clamp(220px,90vw,400px); font-family:'Share Tech Mono',monospace; box-sizing:border-box;">
      <div style="min-height:6vh; border-bottom:2px solid #000; display:flex; align-items:center;
        justify-content:center; font-weight:bold; font-size:clamp(12px,2vh,18px);
        position:relative; padding:0.5vh 6vh 0.5vh 1vh; box-sizing:border-box; text-align:center; word-break:break-word;">
        UNIT: ${selectedUnit}
        <button id="k-x" style="position:absolute; right:0; top:0; height:100%; width:6vh;
          border:none; border-left:2px solid #c62828; background:#c62828; color:#fff;
          font-family:'Share Tech Mono',monospace; font-size:clamp(12px,2vh,18px); cursor:pointer;">✕</button>
      </div>
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
  _pasangViewportFix(overlay);
  _kunciFooter();

  document.getElementById('k-x').onclick    = () => { overlay.remove(); _bebasFooter(); };
  document.getElementById('k-tutup').onclick = () => {
    overlay.remove(); _bebasFooter(); _resetUnitUI(); tutupJadwal(); hapusCache();
  };
  document.getElementById('k-ganti').onclick = () => {
    overlay.remove(); _bebasFooter(); _resetUnitUI(); tutupJadwal(); hapusCache(); openModal('unit');
  };
  document.getElementById('k-batal').onclick = () => { overlay.remove(); _bebasFooter(); };
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

  // Saat mode edit → tampil konfirmasi dulu sebelum batal
  if (typeof modeEdit !== 'undefined' && modeEdit) {
    konfirmasiBatalEdit();
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
  if (adminMode) {
    // Sudah admin → tap lagi = logout
    tampilKonfirmasi('Keluar dari mode Admin?', () => {
      adminMode    = false;
      roleTerlogin = null;
      unitTerlogin = null;
      const indicator = document.getElementById('admin-mode-indicator');
      const btn       = document.getElementById('btn-admin-mode');
      if (indicator) indicator.textContent = '🔒';
      if (btn)       { btn.style.setProperty('background','#c62828','important'); btn.style.fontWeight = 'normal'; }
      const btnPanel = document.getElementById('btn-admin-panel');
      if (btnPanel) btnPanel.style.display = 'none';
      tutupPanelAdmin();
      hapusCache();
      window.dispatchEvent(new CustomEvent('adminModeChange', { detail: { aktif: false } }));
      // Reset jadwal — user harus pilih unit + password lagi
      lakukanResetBulan();
    });
    return;
  }

  // Belum admin → tampil modal input password ADMIN
  tampilModalPasswordAdmin();
}

function tampilModalPasswordAdmin() {
  const existing = document.getElementById('modal-password-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'modal-password-overlay';
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.55);
    z-index:400; display:flex; align-items:center; justify-content:center;
  `;
  overlay.innerHTML = `
    <div style="background:#fff; border:2px solid #000;
      width:clamp(260px,80vw,400px); font-family:'Share Tech Mono',monospace;">
      <div style="min-height:6vh; border-bottom:2px solid #000; display:flex;
        align-items:center; justify-content:center; padding:0.5vh 6vh 0.5vh 1vh;
        font-weight:bold; font-size:clamp(11px,1.8vh,16px); text-align:center;
        position:relative; box-sizing:border-box;">
        🔑 LOGIN ADMIN
        <button id="mp-btn-x" style="position:absolute; right:0; top:0; height:100%; width:6vh;
          border:none; border-left:2px solid #c62828; background:#c62828; color:#fff;
          font-family:'Share Tech Mono',monospace; font-size:clamp(12px,2vh,18px); cursor:pointer;
          display:flex; align-items:center; justify-content:center;">✕</button>
      </div>
      <div style="padding:2vh 3vw; display:flex; flex-direction:column; gap:1.5vh;">
        <div style="font-size:clamp(9px,1.3vh,12px); color:#555; text-align:center;">
          Masukkan password Admin untuk mengaktifkan mode Admin
        </div>
        <input id="mp-input" type="password" placeholder="PASSWORD ADMIN"
          autocomplete="off"
          style="width:100%; padding:1vh 1vw; border:2px solid #000;
          font-family:'Share Tech Mono',monospace; font-size:clamp(12px,1.8vh,16px);
          letter-spacing:0.1em; text-align:center; box-sizing:border-box;">
        <div id="mp-error"
          style="color:#c62828; font-size:clamp(9px,1.4vh,12px);
          text-align:center; min-height:2vh; font-family:'Share Tech Mono',monospace;"></div>
      </div>
      <div style="border-top:2px solid #000; display:flex;">
        <button id="mp-btn-masuk"
          style="flex:1; height:clamp(32px,5vh,48px); border:none; border-right:2px solid #000;
          background:#000; color:#fff; font-family:'Share Tech Mono',monospace;
          font-size:clamp(10px,1.6vh,14px); cursor:pointer;">MASUK</button>
        <button id="mp-btn-batal"
          style="flex:1; height:clamp(32px,5vh,48px); border:none;
          background:#fff; color:#000; font-family:'Share Tech Mono',monospace;
          font-size:clamp(10px,1.6vh,14px); cursor:pointer;">BATAL</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  _pasangViewportFix(overlay);

  const input    = overlay.querySelector('#mp-input');
  const errEl    = overlay.querySelector('#mp-error');
  const btnMasuk = overlay.querySelector('#mp-btn-masuk');
  const btnBatal = overlay.querySelector('#mp-btn-batal');

  setTimeout(() => input.focus(), 100);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') btnMasuk.click(); });
  overlay.querySelector('#mp-btn-x').addEventListener('click', () => { overlay.remove(); _bebasFooter(); });
  btnBatal.addEventListener('click', () => { overlay.remove(); _bebasFooter(); });

  btnMasuk.addEventListener('click', async () => {
    const pass = input.value.trim();
    if (!pass) { errEl.textContent = '⚠ Password tidak boleh kosong'; return; }

    _setBtnLoading(btnMasuk, true);
    input.disabled    = true;
    errEl.textContent = '';

    try {
      const res = await fetchGS({ action: 'loginAdmin', password: pass });

      if (res.success) {
        roleTerlogin = 'admin';
        unitTerlogin = 'ADMIN';
        adminMode    = true;

        // Aktifkan indikator
        const indicator = document.getElementById('admin-mode-indicator');
        const btn       = document.getElementById('btn-admin-mode');
        if (indicator) indicator.textContent = '🔓';
        if (btn)       { btn.style.setProperty('background','#2e7d32','important'); btn.style.fontWeight = 'bold'; }
        const btnPanel = document.getElementById('btn-admin-panel');
        if (btnPanel) btnPanel.style.display = 'block';
        window.dispatchEvent(new CustomEvent('adminModeChange', { detail: { aktif: true } }));

        overlay.remove(); _bebasFooter();

        // Aktifkan tombol edit kalau jadwal sudah tampil
        if (document.getElementById('tbody-data').children.length > 0) {
          setBtnAktif('btn-edit', true);
        }

      } else {
        errEl.textContent    = '❌ ' + (res.message || 'Password salah');
        input.value          = '';
        input.focus();
        _setBtnLoading(btnMasuk, false, 'MASUK');
        input.disabled = false;
      }
    } catch (err) {
      errEl.textContent    = '❌ Gagal terhubung ke server';
      _setBtnLoading(btnMasuk, false, 'MASUK');
      input.disabled = false;
    }
  });
}

// =====================================================================
// PINCH TO ZOOM TABEL
// - Pinch in/out  : zoom tabel via CSS zoom property
// - Double tap    : reset zoom ke normal
// Modal tidak terpengaruh karena di-append ke body langsung
// =====================================================================
const ZOOM_MIN  = 0.4;
const ZOOM_MAX  = 1.0;
let   zoomLevel = 0.7;
let   zoomAwal  = 1.0;
let   jarakAwal = 0;

function _hitungJarak(t1, t2) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function terapkanZoom(level) {
  zoomLevel = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, level));
  const tabel = document.getElementById('tabel-jadwal');
  if (tabel) tabel.style.zoom = zoomLevel;
}

function _updateTombolZoom(level) {
  const preset = { 'z-05': 0.5, 'z-07': 0.7, 'z-10': 1.0 };
  Object.entries(preset).forEach(([id, val]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const aktif = Math.abs(val - level) < 0.05;
    btn.dataset.aktif = aktif ? '1' : '';
    if (aktif) {
      btn.style.background  = '#000';
      btn.style.color       = '#fff';
      btn.style.border      = 'none';
      btn.style.fontWeight  = 'bold';
      btn.style.boxShadow   = '0 0 0 2px #fff, 0 0 0 4px #000';
    } else {
      btn.style.background  = '#555';
      btn.style.color       = '#fff';
      btn.style.border      = 'none';
      btn.style.fontWeight  = 'normal';
      btn.style.boxShadow   = 'none';
    }
  });
}

function setZoomPreset(level) {
  terapkanZoom(level);
  _updateTombolZoom(level);
}

function resetZoom() {
  setZoomPreset(0.7);
  const box = document.querySelector('.box-jadwal');
  if (box) {
    box.style.outline = '2px solid #f9a825';
    setTimeout(() => { box.style.outline = ''; }, 300);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const target = document.querySelector('.jadwal-scroll-wrapper');
  if (!target) return;

  // ── Pinch ────────────────────────────────────────────────
  target.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      jarakAwal = _hitungJarak(e.touches[0], e.touches[1]);
      zoomAwal  = zoomLevel;
    }
  }, { passive: true });

  target.addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
      const jarakBaru = _hitungJarak(e.touches[0], e.touches[1]);
      const level = zoomAwal * (jarakBaru / jarakAwal);
      terapkanZoom(level);
      _updateTombolZoom(level);
    }
  }, { passive: true });

  // Double tap reset zoom dihapus — mengganggu saat user edit jadwal
});