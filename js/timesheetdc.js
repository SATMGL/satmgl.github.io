// =====================================================================
//  timesheetDC.js — Download & Cetak Module
//  Handles: downloadPDF(), cetakForm(), generateAdminPages()
//  Dependencies: dom-to-image (CDN), jsPDF (CDN)
//  Requires: timesheet.js sudah di-load (untuk SHIFT_MAPPING, BULAN, dll)
// =====================================================================

// ─────────────────────────────────────────────────────────────────────
//  KONFIGURASI
// ─────────────────────────────────────────────────────────────────────
const DC_CONFIG = {
  PAGE_W  : 794,    // px — lebar A4 pada 96dpi
  PAGE_H  : 1123,   // px — tinggi A4 pada 96dpi
  SCALE   : 4,      // resolusi render (4 = ultra-high quality)
  QUALITY : 1.0     // kualitas maksimal
};

// ─────────────────────────────────────────────────────────────────────
//  HELPER: fix rowspan untuk html2canvas / dom-to-image
// ─────────────────────────────────────────────────────────────────────
function _fixRowspan(tableEl) {
  const rows = Array.from(tableEl.querySelectorAll('tr'));
  const rowHeights = rows.map(r => parseInt(r.style.height) || 20);
  rows.forEach((tr, rIdx) => {
    Array.from(tr.cells).forEach(td => {
      const rs = parseInt(td.getAttribute('rowspan') || 1);
      if (rs > 1) {
        let totalH = 0;
        for (let i = rIdx; i < rIdx + rs && i < rowHeights.length; i++) totalH += rowHeights[i];
        td.style.height    = totalH + 'px';
        td.style.minHeight = totalH + 'px';
        td.style.maxHeight = totalH + 'px';
        td.style.verticalAlign = 'middle';
        td.style.overflow  = 'visible';
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────
//  DOWNLOAD PDF — Single Person (dom-to-image + jsPDF)
// ─────────────────────────────────────────────────────────────────────
async function downloadPDF() {
  const namaRaw = cddNama._getValue();
  if (!namaRaw) { showAlert('Pilih nama terlebih dahulu.'); return; }

  const nama    = singkatNama(namaRaw);
  const periode = document.getElementById('fill-periode').textContent || '';
  const srcEl   = document.querySelector('.page');

  showLoading();

  try {
    // Simpan state asli
    const origTransform       = srcEl.style.transform;
    const origTransformOrigin = srcEl.style.transformOrigin;
    const origMarginLeft      = srcEl.style.marginLeft;
    const origMarginTop       = srcEl.style.marginTop;
    const origMarginBottom    = srcEl.style.marginBottom;
    const origBoxShadow       = srcEl.style.boxShadow;

    // Sembunyikan elemen UI agar tidak ikut ter-capture
    const adminPanel       = document.getElementById('admin-panel');
    const origPanelDisplay = adminPanel ? adminPanel.style.display : '';
    if (adminPanel) adminPanel.style.display = 'none';

    // Reset transform untuk capture bersih
    srcEl.style.transform       = 'none';
    srcEl.style.transformOrigin = 'top left';
    srcEl.style.marginLeft      = '0';
    srcEl.style.marginTop       = '0';
    srcEl.style.marginBottom    = '0';
    srcEl.style.boxShadow       = 'none';

    const scale = DC_CONFIG.SCALE;

    const imgData = await domtoimage.toJpeg(srcEl, {
      quality : DC_CONFIG.QUALITY,
      width   : DC_CONFIG.PAGE_W * scale,
      height  : DC_CONFIG.PAGE_H * scale,
      style   : {
        transform      : 'scale(' + scale + ')',
        transformOrigin: 'top left'
      }
    });

    // Restore UI segera setelah capture selesai
    if (adminPanel) adminPanel.style.display = origPanelDisplay;
    srcEl.style.transform       = origTransform;
    srcEl.style.transformOrigin = origTransformOrigin;
    srcEl.style.marginLeft      = origMarginLeft;
    srcEl.style.marginTop       = origMarginTop;
    srcEl.style.marginBottom    = origMarginBottom;
    srcEl.style.boxShadow       = origBoxShadow;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    pdf.save(nama + ' - ' + periode + '.pdf');
    hideLoading();

  } catch (err) {
    console.error('[downloadPDF] Error:', err);
    showAlert('✘ Gagal membuat PDF. Coba lagi.');
    hideLoading();
  }
}

// ─────────────────────────────────────────────────────────────────────
//  CETAK — Single Person
// ─────────────────────────────────────────────────────────────────────
function cetakForm() {
  const printStyle = document.createElement('style');
  printStyle.id = '_print_style_temp';
  printStyle.innerHTML = `
    @media print {
      @page { margin: 0; size: A4 portrait; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body > *:not(.page) { display: none !important; }
      .panel, #loading-overlay, #modal-overlay,
      #custom-alert, #modal-admin, #admin-panel { display: none !important; }
      .page {
        width: 794px !important;
        height: 1123px !important;
        transform: none !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        overflow: hidden !important;
      }
    }
  `;
  document.head.appendChild(printStyle);

  const page = document.querySelector('.page');
  const origTransform  = page.style.transform;
  const origMarginLeft = page.style.marginLeft;
  const origMarginTop  = page.style.marginTop;
  const origMarginBot  = page.style.marginBottom;

  page.style.transform    = 'none';
  page.style.marginLeft   = '0';
  page.style.marginTop    = '0';
  page.style.marginBottom = '0';

  window.print();

  // Restore setelah print dialog ditutup
  page.style.transform    = origTransform;
  page.style.marginLeft   = origMarginLeft;
  page.style.marginTop    = origMarginTop;
  page.style.marginBottom = origMarginBot;

  const tmp = document.getElementById('_print_style_temp');
  if (tmp) tmp.remove();
}

// ─────────────────────────────────────────────────────────────────────
//  ADMIN DOWNLOAD PDF — Batch
// ─────────────────────────────────────────────────────────────────────
async function adminDownloadPDF() {
  if (!daftarTerpilih.length) { showAlert('Pilih nama terlebih dahulu.'); return; }
  await generateAdminPages('pdf');
}

// ─────────────────────────────────────────────────────────────────────
//  ADMIN CETAK — Batch
// ─────────────────────────────────────────────────────────────────────
async function adminCetak() {
  if (!daftarTerpilih.length) { showAlert('Pilih nama terlebih dahulu.'); return; }
  await generateAdminPages('print');
}

// ─────────────────────────────────────────────────────────────────────
//  GENERATE ADMIN PAGES — Core (PDF & Print)
// ─────────────────────────────────────────────────────────────────────
async function generateAdminPages(mode) {
  const periodeVal = cddPeriode._getValue();
  if (!periodeVal) { showAlert('Pilih periode terlebih dahulu.'); return; }
  const [bulan, tahun] = periodeVal.split('-').map(Number);

  showLoading();

  try {
    // ── Group by unit agar fetch GAS cukup sekali per unit ──────────
    const byUnit = {};
    daftarTerpilih.forEach(({ nama, unit }) => {
      if (!byUnit[unit]) byUnit[unit] = [];
      byUnit[unit].push(nama);
    });

    // ── Fetch jadwal per unit (paralel) ──────────────────────────────
    const jadwalMap = {}; // key: "nama|unit" → array jadwal
    const fetchPromises = Object.entries(byUnit).map(async ([unit, namaList]) => {
      try {
        const unitGas = UNIT_KEY_TO_GAS[unit] || unit;
        const url = GAS_JADWAL_URL +
          '?action=getJadwal&mode=PEN&bulan=' + bulan +
          '&tahun=' + tahun +
          '&unit=' + encodeURIComponent(unitGas);
        const res  = await fetch(url);
        const data = await res.json();
        if (data.success !== false && data.personil) {
          const normalize = s => s.trim().toUpperCase().replace(/\s+/g, ' ');
          namaList.forEach(nama => {
            const p = data.personil.find(p => p.nama && normalize(p.nama) === normalize(nama));
            jadwalMap[nama + '|' + unit] = (p && Array.isArray(p.jadwal)) ? p.jadwal : [];
          });
        }
      } catch(e) {
        console.warn('[generateAdminPages] Gagal fetch unit', unit, e);
      }
    });
    await Promise.all(fetchPromises);

    // ── Build semua pages ─────────────────────────────────────────────
    const pages = [];
    for (let i = 0; i < daftarTerpilih.length; i++) {
      const { nama, unit } = daftarTerpilih[i];
      const jadwal = jadwalMap[nama + '|' + unit] || [];
      const page = _buildPage(nama, unit, jadwal, bulan, tahun, i, daftarTerpilih.length);
      if (page) pages.push(page);
    }

    if (pages.length === 0) { showAlert('Tidak ada data untuk dicetak.'); return; }

    if (mode === 'pdf') {
      await _exportAdminPDF(pages, bulan, tahun);
      hideLoading();
    } else {
      hideLoading();
      _printAdminContainer(pages);
    }

  } catch (err) {
    console.error('[generateAdminPages] Error:', err);
    showAlert('✘ Gagal memproses halaman.');
    hideLoading();
  }
}

// ─────────────────────────────────────────────────────────────────────
//  BUILD satu halaman (clone + isi data — tanpa fetch, data sudah siap)
// ─────────────────────────────────────────────────────────────────────
function _buildPage(nama, unit, jadwal, bulan, tahun, idx, total) {
  try {
    const page = document.querySelector('.page').cloneNode(true);
    page.style.transform       = 'none';
    page.style.transformOrigin = 'top left';
    page.style.marginLeft      = '0';
    page.style.marginTop       = '0';
    page.style.marginBottom    = '0';
    page.style.boxShadow       = 'none';
    page.style.width           = DC_CONFIG.PAGE_W + 'px';
    page.style.height          = DC_CONFIG.PAGE_H + 'px';
    page.style.pageBreakAfter  = idx < total - 1 ? 'always' : 'auto';

    const table = page.querySelector('table.waffle');
    if (table) _fixRowspan(table);

    const pData = personilData.find(d =>
      (d['NAMA'] || '').trim().toUpperCase() === nama.toUpperCase()
    );
    const setEl = (id, val) => {
      const el = page.querySelector('#' + id);
      if (el) el.textContent = val || '';
    };
    const noPrefix = ['KC MAGELANG', 'KCP SHOPPING'];

    setEl('fill-proyek', 'BRI KANCA MAGELANG');
    setEl('fill-nama',   singkatNama(nama));
    setEl('fill-lokasi', noPrefix.includes(unit) ? unit : 'UNIT ' + unit);

    const secEl = page.querySelector('#fill-security-nama');
    if (secEl) {
      secEl.innerHTML = '<span style="color:#004B87;font-weight:bold;font-size:6pt;font-family:Arial;white-space:normal;line-height:1.2;">' + singkatNama(nama) + '</span>';
    }

    if (pData) {
      setEl('fill-noreg',    pData['NO_REG']       || '');
      setEl('fill-tglmasuk', formatTanggal(pData['TGL_MASUK']));
      setEl('fill-norek',    pData['NO_REK']       || '');
      setEl('fill-bank',     pData['BANK'] || pData['Bank'] || '');
      setEl('fill-nohp',     pData['NO. HP']       || '');
      setEl('fill-email',    pData['ALAMAT EMAIL'] || '');
    }

    const lastDay = new Date(tahun, bulan, 0).getDate();
    const elPeriode = page.querySelector('#fill-periode');
    if (elPeriode) elPeriode.textContent = '1 s/d ' + lastDay + ' ' + BULAN[bulan - 1] + ' ' + tahun;

    for (let d = 1; d <= lastDay; d++) {
      const tglEl = page.querySelector('#tgl-' + d);
      if (!tglEl) continue;
      const row   = tglEl.parentElement;
      const cells = row.querySelectorAll('td');
      if (cells.length < 13) continue;

      const dow       = new Date(tahun, bulan - 1, d).getDay();
      const isWeekend = dow === 0 || dow === 6;
      const namaHari  = dow === 6 ? 'SABTU' : dow === 0 ? 'MINGGU' : '';
      const shiftCode = String(jadwal[d - 1] || '').trim().toUpperCase();
      const shiftData = SHIFT_MAPPING[shiftCode] || null;

      for (let c = 1; c <= 4; c++) { cells[c].textContent = ''; cells[c].removeAttribute('style'); }
      tglEl.removeAttribute('style');
      cells[12].textContent = '';
      cells[12].className   = d === 31 ? 's17' : 's15';

      if (!shiftData) {
        if (isWeekend) {
          cells[12].textContent = namaHari;
          cells[12].classList.add(dow === 6 ? 'keterangan-sabtu' : 'keterangan-minggu');
        }
        continue;
      }

      if (shiftCode === 'OFF' || shiftCode === 'CUTI') {
        for (let c = 1; c <= 4; c++) {
          cells[c].textContent   = shiftData.mulai;
          cells[c].style.cssText = shiftData.style;
        }
        tglEl.style.cssText = shiftData.style;
        if (isWeekend && shiftCode === 'CUTI') {
          cells[12].textContent = namaHari;
          cells[12].classList.add(dow === 6 ? 'keterangan-sabtu' : 'keterangan-minggu');
        }
      } else {
        cells[1].textContent = shiftData.mulai;
        cells[2].textContent = shiftData.selesai;
        if (shiftData.lemburMulai) {
          cells[3].textContent = shiftData.lemburMulai;
          cells[4].textContent = shiftData.lemburSelesai;
        }
        if (isWeekend) {
          const os = 'color:#ff8800;font-weight:bold;';
          for (let c = 1; c <= (shiftData.lemburMulai ? 4 : 2); c++) cells[c].style.cssText = os;
          cells[12].textContent = namaHari;
          cells[12].classList.add(dow === 6 ? 'keterangan-sabtu' : 'keterangan-minggu');
        }
      }
    }

    for (let d = lastDay + 1; d <= 31; d++) {
      const tglEl = page.querySelector('#tgl-' + d);
      if (!tglEl) continue;
      const row   = tglEl.parentElement;
      const cells = row.querySelectorAll('td');
      for (let c = 1; c <= 4; c++) {
        if (cells[c]) { cells[c].textContent = ''; cells[c].removeAttribute('style'); }
      }
      if (cells[12]) { cells[12].textContent = ''; cells[12].className = d === 31 ? 's17' : 's15'; }
    }

    let hk = 0;
    for (let d = 1; d <= lastDay; d++) {
      const kode = String(jadwal[d - 1] || '').trim().toUpperCase();
      if (kode && kode !== 'OFF' && kode !== 'CUTI') hk++;
    }
    const elHK = page.querySelector('#fill-harikerja');
    if (elHK) elHK.textContent = hk;

    return page;
  } catch (err) {
    console.error('[_buildPage] Error untuk', nama, ':', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────
//  EXPORT PDF batch (dom-to-image + jsPDF)
//  Setiap page di-render satu per satu langsung dari DOM agar
//  domtoimage dapat mengaksesnya dengan benar (tidak dari container
//  tersembunyi di -9999px)
// ─────────────────────────────────────────────────────────────────────
async function _exportAdminPDF(pages, bulan, tahun) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const lastDay      = new Date(tahun, bulan, 0).getDate();
  const periodeLabel = '1 s/d ' + lastDay + ' ' + BULAN[bulan - 1] + ' ' + tahun;
  const scale = DC_CONFIG.SCALE;

  // Wrapper off-screen tapi TETAP dalam viewport agar domtoimage bisa render
  const wrapper = document.createElement('div');
  wrapper.style.cssText = [
    'position:fixed',
    'top:0',
    'left:' + DC_CONFIG.PAGE_W + 'px',   // geser ke kanan layar, tidak menutupi UI
    'width:' + DC_CONFIG.PAGE_W + 'px',
    'height:' + DC_CONFIG.PAGE_H + 'px',
    'overflow:hidden',
    'z-index:-1',
    'pointer-events:none',
    'background:#fff'
  ].join(';');
  document.body.appendChild(wrapper);

  try {
    for (let i = 0; i < pages.length; i++) {
      const pg = pages[i];
      pg.style.position = 'absolute';
      pg.style.top      = '0';
      pg.style.left     = '0';
      wrapper.appendChild(pg);

      // Beri sedikit waktu agar browser merender layout
      await new Promise(r => setTimeout(r, 60));

      const imgData = await domtoimage.toJpeg(pg, {
        quality : DC_CONFIG.QUALITY,
        width   : DC_CONFIG.PAGE_W * scale,
        height  : DC_CONFIG.PAGE_H * scale,
        style   : {
          transform      : 'scale(' + scale + ')',
          transformOrigin: 'top left',
          width          : DC_CONFIG.PAGE_W + 'px',
          height         : DC_CONFIG.PAGE_H + 'px'
        }
      });

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    }
  } finally {
    document.body.removeChild(wrapper);
  }

  pdf.save('DAFTAR CETAK - ' + periodeLabel + '.pdf');
}

// ─────────────────────────────────────────────────────────────────────
//  PRINT batch — inject ke body lalu window.print() (sama seperti cetakForm)
// ─────────────────────────────────────────────────────────────────────
function _printAdminContainer(pages) {

  // Inject style print
  const printStyle = document.createElement('style');
  printStyle.id = '_print_admin_style';
  printStyle.innerHTML = `
    @media print {
      @page { margin: 0; size: A4 portrait; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body > *:not(._print_admin_wrap) { display: none !important; }
      ._print_admin_wrap {
        display: block !important;
        position: static !important;
        width: auto !important;
        height: auto !important;
        overflow: visible !important;
      }
      ._print_admin_wrap .page {
        display: block !important;
        width: ${DC_CONFIG.PAGE_W}px !important;
        height: ${DC_CONFIG.PAGE_H}px !important;
        transform: none !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        overflow: hidden !important;
        page-break-after: always;
        break-after: page;
      }
    }
  `;
  document.head.appendChild(printStyle);

  // Wrap pakai position:static agar semua pages mengalir natural
  // dan page-break-after bekerja dengan benar
  const wrap = document.createElement('div');
  wrap.className = '_print_admin_wrap';
  wrap.style.cssText = 'position:static;display:block;';
  pages.forEach(pg => {
    pg.style.transform  = 'none';
    pg.style.margin     = '0';
    pg.style.boxShadow  = 'none';
    pg.style.position   = 'relative';
    pg.style.display    = 'block';
    wrap.appendChild(pg);
  });
  document.body.appendChild(wrap);

  // Sembunyikan body content lain secara inline sebelum print
  const bodyChildren = Array.from(document.body.children).filter(el => el !== wrap);
  const origDisplays = bodyChildren.map(el => el.style.display);
  bodyChildren.forEach(el => el.style.display = 'none');

  window.print();

  // Restore semua
  bodyChildren.forEach((el, i) => el.style.display = origDisplays[i]);
  document.body.removeChild(wrap);
  const tmp = document.getElementById('_print_admin_style');
  if (tmp) tmp.remove();
}