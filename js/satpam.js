/* ═══════════════════════════════════════════════════════════════
   SATPAM.JS — Karakter satpam mengambang yang berjalan ke sel
   dan mengubah nilai jadwal secara interaktif.

   CARA PAKAI:
   1. Tambahkan di jadwal.html (setelah semua script lain):
        <link rel="stylesheet" href="../css/satpam.css">
        <script src="../js/satpam.js"></script>

   2. Tidak ada perubahan pada jadwal.js, jadwal-edit.js, dll.
      Satpam "menumpang" di atas UI yang sudah ada.

   INTEGRASI:
   - Satpam muncul otomatis setelah jadwal selesai dirender
     (menunggu #tbody-data terisi).
   - Saat user klik sel jadwal (col-hari di tbody), satpam
     berjalan ke sana, lalu membuka modal pilih nilai yang
     sudah ada (dari jadwal-edit.js) ATAU membuka popup sendiri
     jika mode edit tidak aktif.
   - Semua perubahan tetap melalui fungsi yang sudah ada di
     jadwal-edit.js (saveSingleCell / applyNilai).
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────
  let charX        = 0;
  let charY        = 0;
  let walkTimer    = null;
  let bubbleTimer  = null;
  let isWalking    = false;
  let pulangTimer  = null;   // timer tunda pulang ke pos jaga
  let sedangTugas  = false;  // true = satpam sedang di sel (write/happy), belum pulang
  let antrianTd    = null;   // sel berikutnya yang sudah diklik user (antrian)

  const TUNDA_PULANG_MS = 4000; // tunggu 4 detik setelah selesai sebelum pulang

  // ── SVG satpam (dipakai di header & saat jalan) ──────────────
  const SVG_INNER = `
    <svg id="sp-svg" viewBox="0 0 52 72" xmlns="http://www.w3.org/2000/svg" overflow="visible">
      <defs>
        <radialGradient id="sp-skin" cx="50%" cy="40%" r="55%">
          <stop offset="0%"   stop-color="#ffe4c0"/>
          <stop offset="100%" stop-color="#e8a870"/>
        </radialGradient>
      </defs>
      <ellipse cx="26" cy="71" rx="14" ry="3.5" fill="rgba(0,0,0,0.15)"/>
      <g id="sp-body" style="transform-origin:26px 48px">
        <g id="sp-arm-l" style="transform-origin:14px 34px">
          <rect x="9"  y="32" width="7" height="16" rx="3.5" fill="#1a2a44"/>
          <ellipse cx="12.5" cy="49" rx="4" ry="3" fill="url(#sp-skin)"/>
        </g>
        <g id="sp-arm-r" style="transform-origin:38px 34px">
          <rect x="36" y="32" width="7" height="16" rx="3.5" fill="#1a2a44"/>
          <ellipse cx="39.5" cy="49" rx="4" ry="3" fill="url(#sp-skin)"/>
          <g id="sp-pensil" opacity="0" style="transform-origin:42px 48px">
            <rect x="41" y="42" width="2.5" height="11" rx="1" fill="#f5c842"
                  transform="rotate(-15,42.5,47)"/>
            <polygon points="41.2,53 43.8,53 42.5,57" fill="#e07020"
                     transform="rotate(-15,42.5,53)"/>
          </g>
        </g>
        <rect x="16" y="30" width="20" height="22" rx="5" fill="#1a2a44"/>
        <rect x="16" y="35" width="20" height="4"  fill="#253660"/>
        <rect id="sp-badge" x="20" y="39" width="8" height="6" rx="2" fill="#f5c842"/>
        <text x="24" y="44" text-anchor="middle" font-size="4" font-weight="bold" fill="#1a1a00">★</text>
        <rect x="16" y="46" width="20" height="4" rx="2" fill="#0f1828"/>
        <rect id="sp-belt-buckle" x="22" y="47" width="6" height="2" rx="1" fill="#f5c842"/>
        <g id="sp-leg-l" style="transform-origin:21px 53px">
          <rect x="16" y="52" width="9"  height="14" rx="4" fill="#253660"/>
          <rect x="14" y="63" width="11" height="6"  rx="3" fill="#111"/>
        </g>
        <g id="sp-leg-r" style="transform-origin:31px 53px">
          <rect x="27" y="52" width="9"  height="14" rx="4" fill="#253660"/>
          <rect x="27" y="63" width="11" height="6"  rx="3" fill="#111"/>
        </g>
        <g id="sp-head" style="transform-origin:26px 18px">
          <rect x="22" y="24" width="8" height="8" rx="3" fill="url(#sp-skin)"/>
          <ellipse cx="26" cy="16" rx="13" ry="14" fill="url(#sp-skin)"/>
          <ellipse cx="13" cy="17" rx="3"   ry="4.5" fill="url(#sp-skin)"/>
          <ellipse cx="39" cy="17" rx="3"   ry="4.5" fill="url(#sp-skin)"/>
          <rect id="sp-hat-brim"   x="9"  y="6"   width="34" height="4"  rx="2.5" fill="#1a2a44"/>
          <rect id="sp-hat-top"    x="13" y="1"   width="26" height="8"  rx="5"   fill="#1a2a44"/>
          <rect id="sp-hat-badge"  x="18" y="2.5" width="16" height="6"  rx="2.5" fill="#f5c842"/>
          <text x="26" y="7.5" text-anchor="middle" font-size="4" font-weight="bold" fill="#1a1a00">SAT</text>
          <rect id="sp-hat-stripe" x="9"  y="7.5" width="34" height="1.5" rx="1"  fill="#f5c842"/>
          <rect x="18" y="12" width="6" height="1.8" rx="1" fill="#5a3a1a"/>
          <rect x="28" y="12" width="6" height="1.8" rx="1" fill="#5a3a1a"/>
          <circle cx="21" cy="17" r="3.5" fill="white"/>
          <circle cx="22" cy="17" r="2"   fill="#2a1800"/>
          <circle cx="22.6" cy="16" r="0.7" fill="white"/>
          <circle cx="31" cy="17" r="3.5" fill="white"/>
          <circle cx="32" cy="17" r="2"   fill="#2a1800"/>
          <circle cx="32.6" cy="16" r="0.7" fill="white"/>
          <ellipse cx="26" cy="21" rx="1.8" ry="1.2" fill="#d4906a"/>
          <path id="sp-mouth" d="M 21 25 Q 26 29 31 25"
                stroke="#8a4a2a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <path d="M 20 24 Q 23 26 26 24 Q 29 26 32 24" fill="#5a3a1a"/>
          <ellipse cx="16" cy="22" rx="3.5" ry="2.5" fill="#ffb0a0" opacity="0.4"/>
          <ellipse cx="36" cy="22" rx="3.5" ry="2.5" fill="#ffb0a0" opacity="0.4"/>
        </g>
      </g>
    </svg>`;

  // ── Posisi "pos jaga" = koordinat fixed dari th.col-nama ─────
  function getPosJaga() {
    // Kembalikan posisi di dalam header NAMA (untuk walking char)
    const th = document.querySelector('thead th.col-nama');
    if (!th) return { x: 20, y: window.innerHeight - 120 };
    const r = th.getBoundingClientRect();
    // Tengah horizontal th, sedikit di atas baris header
    return {
      x: r.left + r.width / 2 - 26,
      y: r.top  + r.height / 2 - 36
    };
  }

  // ── Buat karakter walking (fixed, dipakai saat jalan ke sel) ─
  function buatKarakter() {
    if (document.getElementById('satpam-char')) return;

    // ① Karakter kecil di dalam th.col-nama (sticky, always visible)
    _buatKarakterHeader();

    // ② Karakter walking (fixed, hidden saat idle di header)
    const div = document.createElement('div');
    div.id        = 'satpam-char';
    div.className = 'state-idle';
    div.style.display = 'none'; // tersembunyi sampai dipakai jalan
    div.innerHTML = SVG_INNER;
    document.body.appendChild(div);

    // bubble (tetap fixed)
    const bubble = document.createElement('div');
    bubble.id = 'satpam-bubble';
    document.body.appendChild(bubble);

    // Posisi awal walking char = posisi th.col-nama
    const pos = getPosJaga();
    charX = pos.x;
    charY = pos.y;
    setPos(charX, charY);
  }

  // ── Karakter kecil permanen di dalam header NAMA ──────────────
  function _buatKarakterHeader() {
    const th = document.querySelector('thead th.col-nama');
    if (!th || document.getElementById('sp-header-wrap')) return;

    const wrap = document.createElement('div');
    wrap.id = 'sp-header-wrap';
    wrap.innerHTML = SVG_INNER.replace('id="sp-svg"', 'id="sp-svg-header"')
                               .replace(/id="sp-/g, 'id="sph-'); // prefix beda agar tidak konflik
    th.appendChild(wrap);
  }

  // ── Posisi ───────────────────────────────────────────────────
  function setPos(x, y) {
    const el = document.getElementById('satpam-char');
    if (!el) return;
    el.style.position = 'fixed';
    el.style.left     = x + 'px';
    el.style.top      = y + 'px';
    el.style.bottom   = 'auto';
  }

  function setFacing(kiri) {
    const el = document.getElementById('satpam-char');
    if (el) el.style.transform = kiri ? 'scaleX(-1)' : 'scaleX(1)';
  }

  function setState(state) {
    const el = document.getElementById('satpam-char');
    if (!el) return;
    el.className = 'state-' + state;
  }

  // ── Bubble ───────────────────────────────────────────────────
  function showBubble(teks, durasi) {
    const el = document.getElementById('satpam-bubble');
    if (!el) return;
    clearTimeout(bubbleTimer);
    el.textContent = teks;
    el.style.opacity = '1';
    updateBubblePos();
    if (durasi) {
      bubbleTimer = setTimeout(() => { el.style.opacity = '0'; }, durasi);
    }
  }

  function hideBubble() {
    const el = document.getElementById('satpam-bubble');
    if (el) el.style.opacity = '0';
    clearTimeout(bubbleTimer);
  }

  function updateBubblePos() {
    const el  = document.getElementById('satpam-char');
    const bbl = document.getElementById('satpam-bubble');
    if (!el || !bbl) return;
    const rect = el.getBoundingClientRect();
    // Bubble di atas kepala, geser kiri kalau dekat tepi kanan
    let bx = rect.left + 8;
    let by = rect.top  - bbl.offsetHeight - 12;
    if (bx + bbl.offsetWidth > window.innerWidth - 10)
      bx = window.innerWidth - bbl.offsetWidth - 10;
    if (by < 10) by = rect.bottom + 10;
    bbl.style.left = bx + 'px';
    bbl.style.top  = by + 'px';
  }

  // ── Show/hide karakter header vs walking ─────────────────────
  function showWalkingChar() {
    const wc = document.getElementById('satpam-char');
    const hc = document.getElementById('sp-header-wrap');
    if (wc) wc.style.display = 'block';
    if (hc) hc.style.opacity = '0.25'; // redup saat satpam keluar
  }

  function showHeaderChar() {
    const wc = document.getElementById('satpam-char');
    const hc = document.getElementById('sp-header-wrap');
    if (wc) wc.style.display = 'none';
    if (hc) { hc.style.opacity = '1'; hc.style.transition = 'opacity 0.4s'; }
  }

  // ── Jalan ke koordinat ───────────────────────────────────────
  function walkTo(tx, ty, onTiba) {
    clearInterval(walkTimer);
    isWalking = true;
    showWalkingChar();
    setState('walk');
    const speed = 5;

    walkTimer = setInterval(() => {
      const dx   = tx - charX;
      const dy   = ty - charY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      setFacing(dx < 0);
      updateBubblePos();

      if (dist <= speed + 1) {
        clearInterval(walkTimer);
        charX = tx; charY = ty;
        setPos(charX, charY);
        isWalking = false;
        setState('idle');
        if (onTiba) onTiba();
        return;
      }
      charX += (dx / dist) * speed;
      charY += (dy / dist) * speed;
      setPos(charX, charY);
    }, 16);
  }

  // ── Jadwalkan pulang (ditunda, bisa dibatalkan) ───────────────
  // Kalau user klik sel lain sebelum timer habis → pulang dibatal,
  // satpam langsung belok ke sel baru.
  function jadwalkanPulang(pesanSetelah) {
    clearTimeout(pulangTimer);
    pulangTimer = setTimeout(() => {
      // Kalau ada antrian sel, proses antrian — jangan pulang dulu
      if (antrianTd) {
        const td = antrianTd;
        antrianTd = null;
        prosesKlikSel(td);
        return;
      }
      sedangTugas = false;
      _kembaliKePos(pesanSetelah);
    }, TUNDA_PULANG_MS);
  }

  function _kembaliKePos(pesanSetelah) {
    const pos = getPosJaga();
    showBubble('Kembali ke pos... 🚶', 2000);
    walkTo(pos.x, pos.y, () => {
      setState('idle');
      showBubble(pesanSetelah || 'Siap jaga! 🫡', 2500);
      // Sampai di header — walking char masuk, header char menyala lagi
      setTimeout(() => {
        showHeaderChar();
        hideBubble();
      }, 2600);
    });
  }

  // ── Hitung posisi tujuan (sebelah kiri sel) ───────────────────
  function hitungPosTujuan(tdRect) {
    // Targetkan tepat di sebelah kiri sel, sejajar vertikal
    return {
      x: tdRect.left - 28,
      y: tdRect.top  + (tdRect.height / 2) - 36  // tengah karakter setara tengah sel
    };
  }

  // ── Daftar nilai sesuai mode & hari ──────────────────────────
  function getNilaiList(hari) {
    const mode = (typeof MODE !== 'undefined') ? MODE : null;
    const isWeekend = ['MIN', 'SAB'].includes((hari || '').toUpperCase());

    if (isWeekend) return ['P12', 'M12', 'OFF', 'CUTI'];
    if (mode === 'PEL') return ['P', 'S', 'M', 'SM', 'OFF', 'CUTI'];
    if (mode === 'PEN') return ['P', 'S', 'M', 'OFF', 'CUTI'];
    return ['P', 'S', 'M', 'OFF', 'CUTI'];
  }

  // ── Popup pilih nilai (buatan sendiri, muncul dekat sel) ──────
  let popupEl = null;

  function buatPopup() {
    if (popupEl) return;
    popupEl = document.createElement('div');
    popupEl.id = 'satpam-popup';
    popupEl.style.cssText = `
      position:fixed; z-index:900;
      background:#fff; border:2px solid #000;
      font-family:'Share Tech Mono',monospace;
      display:none; flex-direction:column;
      box-shadow: 4px 4px 0 #000;
      min-width:120px;
    `;
    document.body.appendChild(popupEl);
  }

  function showPopup(tdEl, nilaiSaat, nilaiList, onPilih) {
    if (!popupEl) buatPopup();

    const mode  = (typeof MODE !== 'undefined') ? MODE : '';
    const warna = mode === 'PEL' ? '#f37021' : mode === 'PEN' ? '#85bb65' : '#000';

    popupEl.innerHTML = `
      <div style="
        padding:6px 12px; border-bottom:2px solid ${warna};
        font-size:clamp(8px,1.2vh,11px); letter-spacing:0.12em;
        color:${warna}; font-weight:bold; text-align:center;">
        GANTI NILAI
      </div>
    `;

    nilaiList.forEach(val => {
      const btn = document.createElement('button');
      btn.textContent = val;
      btn.style.cssText = `
        width:100%; padding:6px 14px;
        border:none; border-bottom:1px solid #eee;
        background:${val === nilaiSaat ? '#fffbe6' : '#fff'};
        font-family:'Share Tech Mono',monospace;
        font-size:clamp(10px,1.6vh,13px);
        letter-spacing:0.08em; cursor:pointer;
        text-align:left; font-weight:${val === nilaiSaat ? 'bold' : 'normal'};
        color:${val === nilaiSaat ? warna : '#000'};
      `;
      btn.onmouseover = () => { btn.style.background = '#fffbe6'; btn.style.color = warna; };
      btn.onmouseout  = () => { btn.style.background = val === nilaiSaat ? '#fffbe6' : '#fff'; btn.style.color = val === nilaiSaat ? warna : '#000'; };
      btn.onclick = () => {
        tutupPopup();
        onPilih(val);
      };
      popupEl.appendChild(btn);
    });

    // tombol batal
    const batal = document.createElement('button');
    batal.textContent = '✕ BATAL';
    batal.style.cssText = `
      width:100%; padding:6px 14px;
      border:none; background:#f5f5f5;
      font-family:'Share Tech Mono',monospace;
      font-size:clamp(9px,1.3vh,11px);
      letter-spacing:0.08em; cursor:pointer;
      color:#999; text-align:center;
    `;
    batal.onmouseover = () => { batal.style.background = '#000'; batal.style.color = '#fff'; };
    batal.onmouseout  = () => { batal.style.background = '#f5f5f5'; batal.style.color = '#999'; };
    batal.onclick = () => {
      tutupPopup();
      hapusTarget();
      sedangTugas = false;
      jadwalkanPulang('Baik, tidak jadi diubah. 😅');
    };
    popupEl.appendChild(batal);

    // posisi popup — muncul di atas/bawah sel
    popupEl.style.display = 'flex';
    const tdRect = tdEl.getBoundingClientRect();
    let px = tdRect.left;
    let py = tdRect.bottom + 4;
    if (px + 130 > window.innerWidth) px = window.innerWidth - 134;
    if (py + popupEl.offsetHeight > window.innerHeight - 20)
      py = tdRect.top - popupEl.offsetHeight - 4;
    popupEl.style.left = px + 'px';
    popupEl.style.top  = py + 'px';
  }

  function tutupPopup() {
    if (popupEl) popupEl.style.display = 'none';
  }

  // ── Highlight sel ─────────────────────────────────────────────
  function setTarget(td) {
    document.querySelectorAll('td.satpam-target').forEach(el => el.classList.remove('satpam-target'));
    if (td) td.classList.add('satpam-target');
  }

  function hapusTarget() {
    document.querySelectorAll('td.satpam-target').forEach(el => el.classList.remove('satpam-target'));
  }

  // ── Terapkan perubahan nilai ──────────────────────────────────
  function terapkanNilai(td, nilaiLama, nilaiBaru, pIdx, jIdx) {
    if (!nilaiBaru || nilaiBaru === nilaiLama) {
      showBubble('Nilainya sama, tidak diubah. 😅', 2000);
      hapusTarget();
      sedangTugas = false;
      jadwalkanPulang('Siap jaga! 🫡');
      return;
    }

    setState('write');
    showBubble('Menulis... ✍️', 1200);

    setTimeout(() => {
      // Update cell langsung
      td.textContent = nilaiBaru;
      td.classList.remove('satpam-target');

      // Flash visual
      const warnaSemula = td.style.background;
      td.style.transition = 'background 0.5s';
      td.style.background = '#fffbe6';
      setTimeout(() => { td.style.background = warnaSemula; td.style.transition = ''; }, 600);

      // Update HK grid jika ada
      _updateHKRow(td);

      // Tandai sel berubah (kompatibel dengan jadwal-edit.js)
      td.dataset.changed = '1';
      td.style.background = '#fffbe6';

      setState('happy');
      showBubble(`✅ ${nilaiLama || '—'} → ${nilaiBaru}`, 2500);

      // Aktifkan tombol simpan jika ada
      _aktifkanBtnSimpan();

      sedangTugas = false;
      // Tunda pulang — kalau user klik sel lain dalam TUNDA_PULANG_MS detik,
      // satpam langsung belok tanpa pulang dulu
      jadwalkanPulang('Siap jaga! 🫡');
    }, 800);
  }

  // Update grid HK/HL/HW/OFF di kolom nama setelah perubahan
  function _updateHKRow(tdChanged) {
    try {
      const tr    = tdChanged.closest('tr');
      if (!tr) return;

      const allTds  = Array.from(tr.querySelectorAll('td.col-hari'));
      const jadwal  = allTds.map(td => td.textContent.trim());

      // Ambil header hari dari thead
      const thHaris = Array.from(document.querySelectorAll('#tr-hari th.col-hari'));
      const headerHari = thHaris.map(th => th.textContent.trim());

      if (typeof hitungHK === 'function') {
        const hk = hitungHK(jadwal, headerHari, jadwal.length);
        const grid = tr.querySelector('.hk-grid');
        if (grid) {
          const items = grid.querySelectorAll('.hk-item .val');
          if (items[0]) items[0].textContent = hk.hk;
          if (items[1]) items[1].textContent = hk.hl;
          if (items[2]) items[2].textContent = hk.hw;
          if (items[3]) items[3].textContent = hk.off;
        }
      }
    } catch (e) { /* silent */ }
  }

  // Aktifkan tombol simpan jika mode edit sudah aktif
  function _aktifkanBtnSimpan() {
    const btnSimpan = document.getElementById('btn-simpan');
    if (btnSimpan && btnSimpan.style.display !== 'none') {
      btnSimpan.disabled = false;
      btnSimpan.style.opacity = '1';
      btnSimpan.style.cursor  = 'pointer';
    }
  }

  // ── Handler klik sel ─────────────────────────────────────────
  function onKlikSel(e) {
    const td = e.currentTarget;
    if (!td) return;

    tutupPopup();
    hapusTarget();
    clearTimeout(pulangTimer); // batalkan rencana pulang

    const isEditMode = document.querySelector('.jadwal.mode-edit') !== null;
    if (isEditMode) {
      animasiMenuju(td, () => {
        showBubble('Sel ini sedang di-edit 👀', 2000);
        jadwalkanPulang('Pantau terus! 🫡');
      });
      return;
    }

    // Kalau sedang tugas (write/happy) → simpan sebagai antrian, satpam selesai dulu
    if (sedangTugas) {
      antrianTd = td;
      showBubble('Sebentar ya, masih nulis... ✍️', 1500);
      return;
    }

    prosesKlikSel(td);
  }

  // ── Proses klik sel (bisa dipanggil dari antrian) ─────────────
  function prosesKlikSel(td) {
    antrianTd   = null;
    sedangTugas = true;
    clearTimeout(pulangTimer);

    const col      = parseInt(td.dataset.col);
    const thHari   = document.querySelector(`#tr-hari th[data-col="${col}"]`);
    const hari     = thHari ? thHari.textContent.trim() : '';
    const nilaiLama = td.textContent.trim();
    const nilaiList = getNilaiList(hari);

    setTarget(td);

    animasiMenuju(td, () => {
      const nama = _getNamaDari(td) || '';
      showBubble(`${nama} tgl ${col}: ${nilaiLama || '—'} ✍️`);
      setState('write');

      showPopup(td, nilaiLama, nilaiList, (nilaiBaru) => {
        hapusTarget();
        terapkanNilai(td, nilaiLama, nilaiBaru);
      });
    });
  }

  function animasiMenuju(td, onTiba) {
    const tdRect = td.getBoundingClientRect();
    const tujuan = hitungPosTujuan(tdRect);
    const nama   = _getNamaDari(td) || '';
    showBubble(`Menuju ${nama}... 🚶`);
    walkTo(tujuan.x, tujuan.y, onTiba);
  }

  function _getNamaDari(td) {
    try {
      const tr   = td.closest('tr');
      const span = tr && tr.querySelector('.nama-text');
      return span ? span.textContent.trim().split(' ')[0] : '';
    } catch (e) { return ''; }
  }

  // ── Pasang listener ke sel ────────────────────────────────────
  function pasangListener() {
    const tbody = document.getElementById('tbody-data');
    if (!tbody) return;

    // Pasang di tbody (event delegation)
    tbody.addEventListener('click', function (e) {
      const td = e.target.closest('td.col-hari');
      if (!td) return;
      // Hapus popup lama dulu
      tutupPopup();
      hapusTarget();
      // Jalankan
      onKlikSel({ currentTarget: td });
    });
  }

  // ── Pantau kapan tbody terisi (jadwal dirender) ───────────────
  function tunggaTabelTerisi() {
    const observer = new MutationObserver(() => {
      const tbody = document.getElementById('tbody-data');
      if (tbody && tbody.children.length > 0) {
        observer.disconnect();
        setTimeout(() => {
          buatKarakter();
          pasangListener();
          // Pastikan header char muncul (thead sudah ada saat ini)
          _buatKarakterHeader();
          showHeaderChar();
        }, 300);
      }
    });

    const tbody = document.getElementById('tbody-data');
    if (tbody) {
      if (tbody.children.length > 0) {
        buatKarakter();
        pasangListener();
        _buatKarakterHeader();
        showHeaderChar();
      } else {
        observer.observe(tbody, { childList: true });
      }
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        const t = document.getElementById('tbody-data');
        if (t) observer.observe(t, { childList: true });
      });
    }
  }

  // ── Sinkron mode body class (untuk CSS tema) ──────────────────
  function syncModeClass() {
    const mode = (typeof MODE !== 'undefined') ? MODE : null;
    if (mode === 'PEL') document.body.classList.add('mode-pel');
    if (mode === 'PEN') document.body.classList.add('mode-pen');
  }

  // ── Mulai ─────────────────────────────────────────────────────
  function mulai() {
    syncModeClass();
    tunggaTabelTerisi();

    // Jika MODE berubah (navigasi SPA), sync ulang
    const origPushState = history.pushState;
    history.pushState = function () {
      origPushState.apply(this, arguments);
      syncModeClass();
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mulai);
  } else {
    mulai();
  }

})();