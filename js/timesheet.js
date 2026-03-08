// =====================================================================
  // KONFIGURASI URL GAS
  // =====================================================================
  const GAS_PERSONIL_URL  = 'https://script.google.com/macros/s/AKfycbwOnFO2TxMuqSsZqcFBBwDQCl-vih098DzGi54XyToJzht5RmgO3PApEyFtTP5cSBGNQA/exec';
  const GAS_JADWAL_URL    = 'https://script.google.com/macros/s/AKfycbxCT9hMfzXw6y2ruQD8Wr9L3D83rspDGjCk31nVW96W6bZJKNGU13oKljYUE16sfWgtFg/exec';

  // =====================================================================
  // MAPPING UNIT
  // =====================================================================
  const UNIT_KEY_TO_GAS = {
    'AKMIL'           : 'AKMIL',
    'BANDONGAN'       : 'BANDONGAN',
    'BOROBUDUR'       : 'BOROBUDUR',
    'BOTTON'          : 'BOTTON',
    'CANDIMULYO'      : 'CANDIMULYO',
    'GLAGAH'          : 'GLAGAH',
    'GRABAG'          : 'GRABAG',
    'KAJORAN'         : 'KAJORAN',
    'KALIANGKRIK'     : 'KALIANGKRIK',
    'KARANG GADING'   : 'KARANG GADING',
    'KC MAGELANG'     : 'KC MAGELANG',
    'KCP SHOPPING'    : 'KCP SHOPPING',
    'KRASAK'          : 'KRASAK',
    'MAGELANG SELATAN': 'MAGELANG SELATAN',
    'MAGELANG UTARA'  : 'MAGELANG UTARA',
    'MERTOYUDAN'      : 'MERTOYUDAN',
    'NGABLAK'         : 'NGABLAK',
    'PAKIS'           : 'PAKIS',
    'PAYAMAN'         : 'PAYAMAN',
    'REJOWINANGUN'    : 'REJOWINANGUN',
    'SALAMAN'         : 'SALAMAN',
    'SECANG'          : 'SECANG',
    'SUKARNO HATTA'   : 'SUKARNO HATTA',
    'TEGALREJO'       : 'TEGALREJO',
    'TEMPURAN'        : 'TEMPURAN',
    'WINDUSARI'       : 'WINDUSARI'
  };

  // =====================================================================
  // SHIFT MAPPING
  // =====================================================================
  const SHIFT_MAPPING = {
    'P'   : { mulai: '07:00', selesai: '15:00' },
    'S'   : { mulai: '15:00', selesai: '23:00' },
    'M'   : { mulai: '23:00', selesai: '07:00' },
    'P12' : { mulai: '07:00', selesai: '19:00', lemburMulai: '16:00', lemburSelesai: '19:00' },
    'M12' : { mulai: '19:00', selesai: '07:00', lemburMulai: '04:00', lemburSelesai: '07:00' },
    'OFF' : { mulai: 'OFF',  selesai: 'OFF',  style: 'background:#000 !important; color:#fff !important; font-weight:bold; text-align:center;' },
    'CUTI': { mulai: 'CUTI', selesai: 'CUTI', style: 'color:#FFD700; font-weight:bold; text-align:center;' }
  };

  const BULAN = ['JANUARI','FEBRUARI','MARET','APRIL','MEI','JUNI',
                 'JULI','AGUSTUS','SEPTEMBER','OKTOBER','NOVEMBER','DESEMBER'];

  // =====================================================================
  // STATIC DATA
  // =====================================================================
  const STATIC_DATA = {
    "AKMIL"           : ["DWI SARMANTO","DENI WILIANTORO","MIFTAKHUL KHUSNA","TAOFIK"],
    "BANDONGAN"       : ["AGUS SYAFARUDIN","IWAN SETIAWAN","MUHAMAD KHOIRUL UMAM"],
    "BOROBUDUR"       : ["EKO SUSANTO","KURNIAWAN SANTOSO","OKTA DINOVAN SAVANTINO","ARIS WIDIYANTO"],
    "BOTTON"          : ["AHMADMUSTAKIM","ARI HENDIKA PRABOWO"],
    "CANDIMULYO"      : ["DWI SETIA KURNIAWAN","ARIF GUNAWAN","MUHAMMAD IRFANDI"],
    "GLAGAH"          : ["RACHMAT KARIM","HERU SUSANTO"],
    "GRABAG"          : ["HERI PURWANTO","DAVID ZULFIKAR","FATKHUROHMAN","SIYONO"],
    "KAJORAN"         : ["RUTNO SURDIYANTO","AHMAD TAUFIQ","MUHAMMAD ADI PUTRA PANGESTU"],
    "KALIANGKRIK"     : ["ARY YULIANTO","BAGAS INDRASTATA","WAHYU DINAR WICAKSONO"],
    "KARANG GADING"   : ["AHMAD PRIYO WIDODO","ROBBY FAUZI","PRAYAN DWI R"],
    "KC MAGELANG"     : ["AGUNG TRI LUNGGONO","NELSON TURE SILITONGA","ARIF PURWANTO","GIGIH ARYOSENO","LUTHFI","SARYONO","EDI LISTIYAWAN","IRFAN SURYADIN","AGUS SUGIYONO","JOKO PRIYONO","MUHAMMAD ROSIDIN","DARMADI"],
    "KCP SHOPPING"    : ["EKO ROYO HARYONO","M.SULISTYO","NUNGKI SEPTIYANTO"],
    "KRASAK"          : ["BAGAS ANUGRAH","WISNU AJI NUGROHO","DIMAS TEGUH"],
    "MAGELANG SELATAN": ["EKO RISTIAWAN","SODIKIN","CHANDRA FANDI PRADANA"],
    "MAGELANG UTARA"  : ["ADI KURNIAWAN","RONGGO WAHYUDI","DWI ERIYANTO"],
    "MERTOYUDAN"      : ["IVAN AGUNG NUGROHO","SAEFUDIN","ADI NUR ROHMAN"],
    "NGABLAK"         : ["WORO DWI SULISTYO","HARDI SANTOSO","AHMAD NUR EFENDI"],
    "PAKIS"           : ["AJI MARDIANTO","DESTIONO PUTRA RAHAYU","SUPRIYONO"],
    "PAYAMAN"         : ["DEFRI TRI PUTRA","ERLIN ADITYA","ASMARA TRIHARTANTO"],
    "REJOWINANGUN"    : ["MOHAMAD SHOIMAN","UNTUNG TRIYONO","DANIEL KRISDIANTORO","TRI SUTARDI"],
    "SALAMAN"         : ["IMAM WICAKSONO","MUHAMMAD RIFA'I","GUNAWAN ROJA'I","SURYADI"],
    "SECANG"          : ["AGUS AZIZANA BANGKIT ANUGRAH","NANDA YULIE ALFIAN","UMAM IKHSANUDIN","IMAM SANTOSO"],
    "SUKARNO HATTA"   : ["AHMAD ROBIYANTO","WAHID WAHYUDI","DARMANTO"],
    "TEGALREJO"       : ["WAHID","DWI HERIYANTO","FAISAL ANJUN HUASAN WAWIJDAN","REYNALDI RAMA DANI"],
    "TEMPURAN"        : ["SUPRIYONO","RAFLI BAYU SATRIO","ADI NUGROHO"],
    "WINDUSARI"       : ["ARIFIN","ANSHARI DWI CAHYONO","RACHMAN EFFENDI"]
  };

  // =====================================================================
  // SCALE & POSITION
  // =====================================================================
  function scalePage() {
    const page = document.querySelector('.page');
    const scale = (window.innerHeight * 0.75) / 1123;
    const scaledWidth = 794 * scale;
    page.style.transform = 'scale(' + scale + ')';
    page.style.transformOrigin = 'top left';
    page.style.marginLeft = ((window.innerWidth - scaledWidth) / 2) + 'px';
    page.style.marginTop = '1vh';
    page.style.marginBottom = ((1123 * scale) - 1123) + 'px';
  }

  function positionPanel() {
    const panel = document.getElementById('panel');
    const scale = (window.innerHeight * 0.75) / 1123;
    const scaledWidth = 794 * scale;
    panel.style.width      = scaledWidth + 'px';
    panel.style.marginLeft = ((window.innerWidth - scaledWidth) / 2) + 'px';
    panel.style.marginTop  = '1vh';
    panel.style.height     = '23vh';
  }

  // =====================================================================
  // UTILS
  // =====================================================================
  function ukurTeks(teks, fontSize) {
    const canvas = ukurTeks._canvas || (ukurTeks._canvas = document.createElement('canvas'));
    const ctx = canvas.getContext('2d');
    ctx.font = fontSize + 'pt Arial';
    return ctx.measureText(teks).width;
  }

  function singkatNama(nama) {
    const parts = nama.trim().split(/\s+/);
    if (parts.length <= 2) return nama;
    const depan2 = parts[0] + ' ' + parts[1];
    const singkatan = parts.slice(2).map(w => w.charAt(0).toUpperCase() + '.').join('');
    return depan2 + ' ' + singkatan;
  }

  function showLoading() { document.getElementById('loading-overlay').classList.add('active'); }
  function hideLoading() { document.getElementById('loading-overlay').classList.remove('active'); }

  function showAlert(msg, duration) {
    const el  = document.getElementById('custom-alert');
    const box = document.getElementById('custom-alert-box');
    box.textContent = msg;
    el.classList.add('show');
    box.style.animation = 'none';
    box.offsetHeight;
    box.style.animation = '';
    setTimeout(() => el.classList.remove('show'), duration || 3000);
  }

  // =====================================================================
  // TANGGAL
  // =====================================================================
  function fillTanggal(month, year) {
    const lastDay = new Date(year, month, 0).getDate();
    for (let i = 1; i <= 31; i++) {
      const el = document.getElementById('tgl-' + i);
      if (!el) continue;
      el.classList.remove('tgl-empty', 'tgl-weekend');
      el.style.color = '';

      const row = el.parentElement;
      const keteranganCell = row.querySelector('.s15, .s17');

      if (i <= lastDay) {
        const dow = new Date(year, month - 1, i).getDay();
        el.textContent = i;
        if (dow === 0 || dow === 6) el.classList.add('tgl-weekend');

        if (keteranganCell && !keteranganCell.classList.contains('shift-filled')) {
          keteranganCell.textContent = '';
          keteranganCell.className = keteranganCell.tagName === 'TD' ? (i === 31 ? 's17' : 's15') : keteranganCell.className;
          if (dow === 0) {
            keteranganCell.textContent = 'MINGGU';
            keteranganCell.classList.add('keterangan-minggu');
          } else if (dow === 6) {
            keteranganCell.textContent = 'SABTU';
            keteranganCell.classList.add('keterangan-sabtu');
          }
        }
      } else {
        el.textContent = '';
        el.classList.add('tgl-empty');
        if (keteranganCell) { keteranganCell.textContent = ''; }
      }
    }
  }

  // =====================================================================
  // CUSTOM DROPDOWN
  // =====================================================================
  function createCDD(id, onSelect, defaultText) {
    const cdd    = document.getElementById(id);
    const textEl = cdd.querySelector('.cdd-text');
    const list   = cdd.querySelector('.cdd-list');
    let selected = null;

    function buildItems(arr, cols) {
      list.innerHTML = '';
      const inner = document.createElement('div');
      inner.className = 'cdd-list-inner';
      if (cols) inner.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
      arr.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cdd-item' + (item.value === selected ? ' selected' : '');
        div.textContent = item.label;
        div.dataset.value = item.value;
        div.title = item.label;
        div.addEventListener('click', e => {
          e.stopPropagation();
          selected = item.value;
          textEl.textContent = item.label;
          inner.querySelectorAll('.cdd-item').forEach(d => d.classList.toggle('selected', d.dataset.value === selected));
          closeCDD(cdd);
          onSelect(item.value, item.label);
        });
        inner.appendChild(div);
      });
      list.appendChild(inner);
    }

    cdd._buildItems = buildItems;
    cdd._reset = (text) => { selected = null; textEl.textContent = text || defaultText; list.innerHTML = ''; };
    cdd._getValue = () => selected;
    cdd._setValue = (val, label) => { selected = val; textEl.textContent = label || val; };

    cdd.querySelector('.cdd-selected').addEventListener('click', e => {
      e.stopPropagation();
      if (cdd.classList.contains('cdd-disabled')) return;
      const isOpen = cdd.classList.contains('open');
      closeAllCDD();
      if (!isOpen) {
        cdd.classList.add('open');
        const rect = cdd.getBoundingClientRect();
        const listEl = cdd.querySelector('.cdd-list');
        let listW;
        if (id === 'cdd-periode')   listW = Math.min(160, window.innerWidth * 0.4);
        else if (id === 'cdd-unit') listW = Math.min(360, window.innerWidth * 0.75);
        else                        listW = Math.min(240, window.innerWidth * 0.55);
        listEl.style.width  = listW + 'px';
        listEl.style.bottom = (window.innerHeight - rect.top + 6) + 'px';
        listEl.style.top    = 'auto';
        if (id === 'cdd-periode') {
          listEl.style.left = Math.max(8, rect.left) + 'px';
          listEl.style.right = 'auto';
        } else if (id === 'cdd-unit') {
          listEl.style.left = Math.max(8, (window.innerWidth - listW) / 2) + 'px';
          listEl.style.right = 'auto';
        } else {
          listEl.style.right = Math.max(8, window.innerWidth - rect.right) + 'px';
          listEl.style.left = 'auto';
        }
      }
    });
    return cdd;
  }

  function closeAllCDD() { document.querySelectorAll('.cdd.open').forEach(d => d.classList.remove('open')); }
  function closeCDD(el)  { el.classList.remove('open'); }
  document.addEventListener('click', closeAllCDD);

  // =====================================================================
  // INIT DROPDOWNS
  // =====================================================================
  let currentPeriodeLabel = '';

  const cddPeriode = createCDD('cdd-periode', (val, label) => {
    currentPeriodeLabel = label;
    const [m, y] = val.split('-').map(Number);
    fillTanggal(m, y);
    const lastDay = new Date(y, m, 0).getDate();
    const elPeriode = document.getElementById('fill-periode');
    if (elPeriode) elPeriode.textContent = '1 s/d ' + lastDay + ' ' + BULAN[m-1] + ' ' + y;
    fillTable();
  }, '— Pilih —');

  function buildPeriode() {
    const now = new Date();
    const cm  = now.getMonth();
    const cy  = now.getFullYear();
    const months = [
      { m: cm === 0 ? 11 : cm - 1, y: cm === 0 ? cy - 1 : cy },
      { m: cm, y: cy }
    ];
    const items = months.map(({ m, y }) => ({ value: (m+1)+'-'+y, label: BULAN[m]+' '+y }));
    cddPeriode._buildItems(items, 1);
    const def = items[items.length - 1];
    cddPeriode._setValue(def.value, def.label);
    currentPeriodeLabel = def.label;
    const [m, y] = def.value.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const elPeriode = document.getElementById('fill-periode');
    if (elPeriode) elPeriode.textContent = '1 s/d ' + lastDay + ' ' + BULAN[m-1] + ' ' + y;
    fillTanggal(m, y);
  }
  buildPeriode();

  const cddNama = createCDD('cdd-nama', (val) => {
    const btnEdit  = document.getElementById('btn-edit-data');
    const btnPdf   = document.getElementById('btn-pdf');
    const btnPrint = document.getElementById('btn-print');
    if (btnEdit)  { btnEdit.style.opacity  = '1'; btnEdit.style.pointerEvents  = 'auto'; }
    if (btnPdf)   { btnPdf.style.opacity   = '1'; btnPdf.style.pointerEvents   = 'auto'; }
    if (btnPrint) { btnPrint.style.opacity = '1'; btnPrint.style.pointerEvents = 'auto'; }
    fillTable();
  }, '— Pilih Nama —');

  const cddUnit = createCDD('cdd-unit', (val) => {
    resetTable();
    const elLokasi = document.getElementById('fill-lokasi');
    const noPrefix = ['KC MAGELANG', 'KCP SHOPPING'];
    if (elLokasi) elLokasi.textContent = noPrefix.includes(val) ? val : 'UNIT ' + val;

    const names = (STATIC_DATA[val] || []).slice().sort((a, b) => a.localeCompare(b, 'id'));
    cddNama._reset('— Pilih Nama —');
    cddNama.classList.add('cdd-disabled');
    if (names.length) {
      cddNama._buildItems(names.map(n => ({ value: n, label: n })), 2);
      cddNama.classList.remove('cdd-disabled');
    }
  }, '— Pilih Unit —');

  function buildUnitDropdown() {
    const units = Object.keys(STATIC_DATA).sort((a, b) => a.localeCompare(b, 'id'));
    cddUnit._buildItems(units.map(u => ({ value: u, label: u })), 3);
  }
  buildUnitDropdown();

  // =====================================================================
  // DATA PERSONIL
  // =====================================================================
  let personilData = [];

  async function loadPersonil() {
    try {
      const res   = await fetch(GAS_PERSONIL_URL);
      personilData = await res.json();
      console.log('[loadPersonil] Loaded:', personilData.length, 'records');
    } catch(e) {
      console.error('[loadPersonil] Error:', e);
    }
  }

  // =====================================================================
  // FORMAT TANGGAL
  // =====================================================================
  function formatTanggal(val) {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const tgl  = d.getDate();
    const bln  = BULAN[d.getMonth()];
    const yyyy = d.getFullYear();
    return tgl + ' ' + bln + ' ' + yyyy;
  }

  // =====================================================================
  // FILL TABLE
  // =====================================================================
  function fillTable() {
    const namaVal    = cddNama._getValue();
    const unitVal    = cddUnit._getValue();
    const periodeVal = cddPeriode._getValue();

    if (!namaVal) return;

    let p = personilData.find(d => (d['NAMA'] || '').trim() === namaVal);

    const fill = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || '';
    };

    fill('fill-proyek', 'BRI KANCA MAGELANG');
    fill('fill-nama',   singkatNama(namaVal));
    const _noPrefix = ['KC MAGELANG', 'KCP SHOPPING'];
    const _lokasiVal = p ? (p['UNIT KERJA'] || unitVal || '') : (unitVal || '');
    fill('fill-lokasi', _lokasiVal ? (_noPrefix.includes(_lokasiVal) ? _lokasiVal : 'UNIT ' + _lokasiVal) : '');

    const secEl = document.getElementById('fill-security-nama');
    if (secEl) {
      secEl.innerHTML = '<span style="color:#004B87;font-weight:bold;font-size:6pt;font-family:Arial;white-space:normal;line-height:1.2;">' + singkatNama(namaVal) + '</span>';
    }

    if (p) {
      fill('fill-noreg',    p['NO_REG']       || '');
      fill('fill-tglmasuk', formatTanggal(p['TGL_MASUK']));
      fill('fill-norek',    p['NO_REK']       || '');
      fill('fill-bank',     p['BANK']         || p['Bank'] || '');
      fill('fill-nohp',     p['NO. HP']       || '');
      fill('fill-email',    p['ALAMAT EMAIL'] || '');
    }

    if (periodeVal && unitVal) {
      loadJadwal(periodeVal, unitVal, namaVal);
    }
  }

  // =====================================================================
  // RESET TABLE
  // =====================================================================
  function resetTable() {
    const periodeVal = cddPeriode._getValue();
    const [m, y] = periodeVal ? periodeVal.split('-').map(Number) : [0, 0];

    for (let i = 1; i <= 31; i++) {
      const tglEl = document.getElementById('tgl-' + i);
      if (!tglEl) continue;
      const row   = tglEl.parentElement;
      const cells = row.querySelectorAll('td');
      if (cells.length < 13) continue;

      for (let c = 1; c <= 4; c++) {
        cells[c].textContent = '';
        cells[c].removeAttribute('style');
      }

      tglEl.removeAttribute('style');

      const ket = cells[12];
      ket.textContent = '';
      ket.className   = (i === 31) ? 's17' : 's15';

      if (m && y && i <= new Date(y, m, 0).getDate()) {
        const dow = new Date(y, m - 1, i).getDay();
        if (dow === 6) {
          ket.textContent = 'SABTU';
          ket.classList.add('keterangan-sabtu');
        } else if (dow === 0) {
          ket.textContent = 'MINGGU';
          ket.classList.add('keterangan-minggu');
        }
      }
    }

    const elHK = document.getElementById('fill-harikerja');
    if (elHK) elHK.textContent = '0';
  }

  // =====================================================================
  // LOAD JADWAL
  // =====================================================================
  async function loadJadwal(periodeVal, unitVal, namaVal) {
    resetTable();
    showLoading();
    const timeout = setTimeout(() => hideLoading(), 15000);
    try {
      const [m, y] = periodeVal.split('-').map(Number);
      const unitGas = UNIT_KEY_TO_GAS[unitVal] || unitVal;

      const url = GAS_JADWAL_URL +
        '?action=getJadwal&mode=PEN&bulan=' + m + '&tahun=' + y +
        '&unit=' + encodeURIComponent(unitGas);

      console.log('[loadJadwal] Fetching:', url);

      const res  = await fetch(url);
      const data = await res.json();

      console.log('[loadJadwal] Response:', data);

      if (!data || data.success === false) {
        console.warn('[loadJadwal] Error:', data && data.message);
        showAlert('Data jadwal tidak tersedia untuk periode ' + BULAN[m-1] + ' ' + y + '.');
        return;
      }

      if (!data.personil || !Array.isArray(data.personil)) {
        console.warn('[loadJadwal] Tidak ada array personil:', data);
        return;
      }

      const normalize = s => s.trim().toUpperCase().replace(/\s+/g, ' ');
      const personil = data.personil.find(p =>
        p.nama && normalize(p.nama) === normalize(namaVal)
      );

      if (!personil) {
        console.warn('[loadJadwal] Personil tidak ditemukan:', namaVal);
        console.warn('[loadJadwal] Tersedia:', data.personil.map(p => p.nama));
        return;
      }

      if (!Array.isArray(personil.jadwal)) {
        console.warn('[loadJadwal] Jadwal tidak valid:', personil);
        return;
      }

      fillAbsensiTable(personil.jadwal, m, y);

    } catch (err) {
      console.error('[loadJadwal] Error:', err);
    } finally {
      clearTimeout(timeout);
      hideLoading();
    }
  }

  // =====================================================================
  // FILL ABSENSI TABLE
  // =====================================================================
  function fillAbsensiTable(jadwalArray, bulan, tahun) {
    const lastDay = new Date(tahun, bulan, 0).getDate();

    for (let i = 1; i <= Math.min(31, lastDay); i++) {
      const tglEl = document.getElementById('tgl-' + i);
      if (!tglEl) continue;

      const row   = tglEl.parentElement;
      const cells = row.querySelectorAll('td');
      if (cells.length < 13) continue;

      const shiftCode = String(jadwalArray[i - 1] || '').trim().toUpperCase();
      const shiftData = SHIFT_MAPPING[shiftCode] || null;

      const jamKerjaMulai    = cells[1];
      const jamKerjaSelesai  = cells[2];
      const jamLemburMulai   = cells[3];
      const jamLemburSelesai = cells[4];
      const keteranganCell   = cells[12];

      jamKerjaMulai.textContent    = '';
      jamKerjaSelesai.textContent  = '';
      jamLemburMulai.textContent   = '';
      jamLemburSelesai.textContent = '';
      jamKerjaMulai.removeAttribute('style');
      jamKerjaSelesai.removeAttribute('style');
      jamLemburMulai.removeAttribute('style');
      jamLemburSelesai.removeAttribute('style');
      tglEl.removeAttribute('style');

      const dow       = new Date(tahun, bulan - 1, i).getDay();
      const isWeekend = (dow === 0 || dow === 6);
      const namaHari  = dow === 6 ? 'SABTU' : dow === 0 ? 'MINGGU' : '';

      keteranganCell.textContent = '';
      keteranganCell.className   = (i === 31) ? 's17' : 's15';

      if (!shiftData) {
        if (isWeekend) {
          keteranganCell.textContent = namaHari;
          keteranganCell.classList.add(dow === 6 ? 'keterangan-sabtu' : 'keterangan-minggu');
        }
        continue;
      }

      if (shiftCode === 'OFF' || shiftCode === 'CUTI') {
        jamKerjaMulai.textContent    = shiftData.mulai;
        jamKerjaSelesai.textContent  = shiftData.selesai;
        jamLemburMulai.textContent   = shiftData.mulai;
        jamLemburSelesai.textContent = shiftData.selesai;
        jamKerjaMulai.style.cssText    = shiftData.style;
        jamKerjaSelesai.style.cssText  = shiftData.style;
        jamLemburMulai.style.cssText   = shiftData.style;
        jamLemburSelesai.style.cssText = shiftData.style;
        tglEl.style.cssText = shiftData.style;

        if (isWeekend && shiftCode === 'CUTI') {
          keteranganCell.textContent = namaHari;
          keteranganCell.classList.add(dow === 6 ? 'keterangan-sabtu' : 'keterangan-minggu');
        }

      } else {
        jamKerjaMulai.textContent   = shiftData.mulai;
        jamKerjaSelesai.textContent = shiftData.selesai;
        if (shiftData.lemburMulai) {
          jamLemburMulai.textContent   = shiftData.lemburMulai;
          jamLemburSelesai.textContent = shiftData.lemburSelesai;
        }
        if (isWeekend) {
          const orangeStyle = 'color:#ff8800; font-weight:bold;';
          jamKerjaMulai.style.cssText   = orangeStyle;
          jamKerjaSelesai.style.cssText = orangeStyle;
          if (shiftData.lemburMulai) {
            jamLemburMulai.style.cssText   = orangeStyle;
            jamLemburSelesai.style.cssText = orangeStyle;
          }
          keteranganCell.textContent = namaHari;
          keteranganCell.classList.add(dow === 6 ? 'keterangan-sabtu' : 'keterangan-minggu');
        }
      }
    }

    for (let i = lastDay + 1; i <= 31; i++) {
      const tglEl = document.getElementById('tgl-' + i);
      if (!tglEl) continue;
      const row   = tglEl.parentElement;
      const cells = row.querySelectorAll('td');
      for (let c = 1; c <= 4; c++) {
        if (cells[c]) { cells[c].textContent = ''; cells[c].removeAttribute('style'); }
      }
      if (cells[12]) {
        cells[12].textContent = '';
        cells[12].className   = (i === 31) ? 's17' : 's15';
      }
    }

    let hariKerja = 0;
    for (let i = 1; i <= lastDay; i++) {
      const kode = String(jadwalArray[i - 1] || '').trim().toUpperCase();
      if (kode && kode !== 'OFF' && kode !== 'CUTI') hariKerja++;
    }
    const elHK = document.getElementById('fill-harikerja');
    if (elHK) elHK.textContent = hariKerja;
  }

  // =====================================================================
  // NAVIGASI
  // =====================================================================
  function kembali() {
    window.location.href = '/index.html';
  }

  // =====================================================================
  // ADMIN MODE
  // =====================================================================
  function _adminInputFocus(el, focused) {
    el.style.borderColor  = focused ? '#8e44ad' : '#445';
    el.style.boxShadow    = focused ? '0 0 0 3px rgba(142,68,173,0.25)' : 'none';
  }
  function _adminInputEffect(el) {
    const err = document.getElementById('admin-error');
    if (err) { err.style.display = 'none'; err.style.animation = 'none'; }
    el.style.borderColor = el.value ? '#8e44ad' : '#445';
  }

  function adminMode() {
    const inp = document.getElementById('admin-password-input');
    const err = document.getElementById('admin-error');
    const btn = document.getElementById('btn-masuk-admin');
    inp.value = '';
    inp.style.borderColor = '#445';
    inp.style.boxShadow   = 'none';
    if (err) { err.style.display = 'none'; }
    if (btn) { btn.textContent = 'MASUK'; btn.style.background = '#8e44ad'; btn.disabled = false; }
    document.getElementById('modal-admin').style.display = 'flex';
    setTimeout(() => inp.focus(), 150);
  }

  function closeAdminModal() {
    document.getElementById('modal-admin').style.display = 'none';
  }

  async function verifyAdminPassword() {
    const pw  = document.getElementById('admin-password-input').value.trim();
    const btn = document.getElementById('btn-masuk-admin');
    const err = document.getElementById('admin-error');
    const inp = document.getElementById('admin-password-input');
    if (!pw) {
      inp.style.borderColor = '#e74c3c';
      inp.style.boxShadow   = '0 0 0 3px rgba(231,76,60,0.25)';
      inp.focus();
      return;
    }
    if (btn) { btn.textContent = '⏳'; btn.disabled = true; btn.style.background = '#6c3483'; }
    try {
      const res  = await fetch(GAS_PERSONIL_URL + '?action=verifyAdmin&password=' + encodeURIComponent(pw));
      const data = await res.json();
      if (data.success) {
        if (btn) { btn.textContent = '✔'; btn.style.background = '#27ae60'; }
        inp.style.borderColor = '#27ae60';
        inp.style.boxShadow   = '0 0 0 3px rgba(39,174,96,0.25)';
        setTimeout(() => {
          closeAdminModal();
          const btnMenu = document.getElementById('btn-admin-menu');
          if (btnMenu) btnMenu.style.display = 'block';
          showAlert('✔ Selamat datang, Admin!');
          loadDaftarCetak();
        }, 500);
      } else {
        if (btn) { btn.textContent = 'MASUK'; btn.disabled = false; btn.style.background = '#8e44ad'; }
        inp.style.borderColor = '#e74c3c';
        inp.style.boxShadow   = '0 0 0 3px rgba(231,76,60,0.25)';
        inp.value = '';
        inp.focus();
        if (err) {
          err.style.display   = 'block';
          err.style.animation = 'none';
          void err.offsetWidth;
          err.style.animation = 'adminShake 0.4s ease';
        }
      }
    } catch (e) {
      if (btn) { btn.textContent = 'MASUK'; btn.disabled = false; btn.style.background = '#8e44ad'; }
      showAlert('\u2718 Gagal verifikasi. Cek koneksi.');
    }
  }

  // =====================================================================
  // ADMIN PANEL
  // =====================================================================
  let adminPanelOpen = false;
  let daftarTerpilih = [];

  // Hitung lebar & posisi panel menggunakan rumus skala yang sama dengan scalePage()
  function _positionAdminPanel() {
    const panel = document.getElementById('admin-panel');
    if (!panel) return;

    // Rumus sama persis dengan scalePage() dan positionPanel()
    const scale       = (window.innerHeight * 0.75) / 1123;
    const panelWidth  = 794 * scale;                                      // lebar .page setelah di-scale
    const marginLeft  = (window.innerWidth - panelWidth) / 2;             // margin kiri .page
    const rightEdge   = Math.max(0, window.innerWidth - (marginLeft + panelWidth)); // ruang di kanan .page

    panel.style.width = panelWidth + 'px';

    if (adminPanelOpen) {
      panel.style.right = rightEdge + 'px';     // panel sejajar tepi kanan .page
    } else {
      panel.style.right = (-panelWidth) + 'px'; // selalu tersembunyi penuh di luar layar kanan
    }
  }

  function toggleAdminPanel() {
    adminPanelOpen = !adminPanelOpen;
    _positionAdminPanel();
    if (adminPanelOpen) buildAdminUnitOptions();
  }

  function buildAdminUnitOptions() {
    const sel = document.getElementById('admin-unit-select');
    sel.innerHTML = '<option value="">— Pilih Unit —</option>';
    Object.keys(STATIC_DATA).sort().forEach(unit => {
      const opt = document.createElement('option');
      opt.value = unit;
      opt.textContent = unit;
      sel.appendChild(opt);
    });
  }

  function loadAdminNama() {
    const unit = document.getElementById('admin-unit-select').value;
    const container = document.getElementById('admin-nama-list');
    container.innerHTML = '';
    if (!unit || !STATIC_DATA[unit]) return;
    STATIC_DATA[unit].forEach(nama => {
      const sudahDipilih = daftarTerpilih.some(d => d.nama === nama && d.unit === unit);
      const div = document.createElement('div');
      div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:5px;background:' + (sudahDipilih ? '#2a3a2a' : '#111827') + ';cursor:pointer;border:1px solid ' + (sudahDipilih ? '#27ae60' : '#2a2a3e') + ';';
      div.innerHTML = '<input type="checkbox" ' + (sudahDipilih ? 'checked' : '') + ' style="accent-color:#8e44ad;cursor:pointer;" onchange="togglePilihNama(this,\'' + nama.replace(/'/g,"\\'") + '\',\'' + unit.replace(/'/g,"\\'") + '\')">'
        + '<span style="color:#fff;font-size:9pt;font-family:Arial;">' + nama + '</span>';
      container.appendChild(div);
    });
  }

  function togglePilihNama(cb, nama, unit) {
    if (cb.checked) {
      if (!daftarTerpilih.some(d => d.nama === nama && d.unit === unit)) {
        daftarTerpilih.push({ nama, unit });
      }
    } else {
      daftarTerpilih = daftarTerpilih.filter(d => !(d.nama === nama && d.unit === unit));
    }
    renderDaftarTerpilih();
    loadAdminNama();
  }

  function pilihSemuaNama() {
    const unit = document.getElementById('admin-unit-select').value;
    if (!unit || !STATIC_DATA[unit]) return;
    STATIC_DATA[unit].forEach(nama => {
      if (!daftarTerpilih.some(d => d.nama === nama && d.unit === unit)) {
        daftarTerpilih.push({ nama, unit });
      }
    });
    renderDaftarTerpilih();
    loadAdminNama();
  }

  function renderDaftarTerpilih() {
    const tags  = document.getElementById('admin-selected-tags');
    const count = document.getElementById('admin-count');
    count.textContent = daftarTerpilih.length;
    tags.innerHTML = '';
    daftarTerpilih.forEach((d, i) => {
      const tag = document.createElement('span');
      tag.style.cssText = 'background:#2c2c3e;border:1px solid #445;color:#fff;font-size:7pt;font-family:Arial;padding:2px 6px;border-radius:10px;display:flex;align-items:center;gap:4px;';
      tag.innerHTML = singkatNama(d.nama) + ' <span onclick="hapusDariDaftar(' + i + ')" style="color:#e74c3c;cursor:pointer;font-size:10px;">✕</span>';
      tags.appendChild(tag);
    });
  }

  function hapusDariDaftar(idx) {
    daftarTerpilih.splice(idx, 1);
    renderDaftarTerpilih();
    loadAdminNama();
  }

  async function loadDaftarCetak() {
    try {
      const res  = await fetch(GAS_PERSONIL_URL + '?action=getDaftarCetak');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        daftarTerpilih = data.data.map(s => {
          const [nama, unit] = s.split('|');
          return { nama: nama || s, unit: unit || '' };
        }).filter(d => d.nama);
        renderDaftarTerpilih();
      }
    } catch (err) {
      console.warn('Gagal load daftar cetak:', err);
    }
  }

  async function simpanDaftarCetak() {
    showLoading();
    try {
      const res  = await fetch(GAS_PERSONIL_URL, {
        method: 'POST',
        body: JSON.stringify({
          action : 'saveDaftarCetak',
          daftar : daftarTerpilih.map(d => d.nama + '|' + d.unit)
        })
      });
      const data = await res.json();
      hideLoading();
      showAlert(data.success ? '✔ Daftar tersimpan.' : '✘ Gagal menyimpan.');
    } catch (err) {
      hideLoading();
      showAlert('✘ Gagal menyimpan.');
    }
  }

  async function adminDownloadPDF() {
    if (!daftarTerpilih.length) { showAlert('Pilih nama terlebih dahulu.'); return; }
    await generateAdminPages('pdf');
  }

  async function adminCetak() {
    if (!daftarTerpilih.length) { showAlert('Pilih nama terlebih dahulu.'); return; }
    await generateAdminPages('print');
  }

  async function generateAdminPages(mode) {
    const periodeVal = cddPeriode._getValue();
    if (!periodeVal) { showAlert('Pilih periode terlebih dahulu.'); return; }
    const [bulan, tahun] = periodeVal.split('-').map(Number);

    showLoading();
    const container = document.createElement('div');

    for (let i = 0; i < daftarTerpilih.length; i++) {
      const { nama, unit } = daftarTerpilih[i];
      try {
        const pData   = personilData.find(d => (d['NAMA'] || '').trim().toUpperCase() === nama.toUpperCase());
        const unitGas = UNIT_KEY_TO_GAS[unit] || unit;
        const url     = GAS_JADWAL_URL + '?action=getJadwal&mode=PEN&bulan=' + bulan + '&tahun=' + tahun + '&unit=' + encodeURIComponent(unitGas);
        const res     = await fetch(url);
        const data    = await res.json();
        let jadwal    = [];
        if (data.success !== false && data.personil) {
          const normalize = s => s.trim().toUpperCase().replace(/\s+/g, ' ');
          const p = data.personil.find(p => p.nama && normalize(p.nama) === normalize(nama));
          if (p && Array.isArray(p.jadwal)) jadwal = p.jadwal;
        }

        const page = document.querySelector('.page').cloneNode(true);
        page.style.transform    = 'none';
        page.style.margin       = '0';
        page.style.pageBreakAfter = i < daftarTerpilih.length - 1 ? 'always' : 'auto';

        const setEl = (id, val) => { const el = page.querySelector('#' + id); if (el) el.textContent = val || ''; };
        setEl('fill-proyek', 'BRI KANCA MAGELANG');
        setEl('fill-nama',   singkatNama(nama));
        const noPrefix = ['KC MAGELANG', 'KCP SHOPPING'];
        setEl('fill-lokasi', noPrefix.includes(unit) ? unit : 'UNIT ' + unit);
        if (pData) {
          setEl('fill-noreg',    pData['NO_REG']       || '');
          setEl('fill-tglmasuk', formatTanggal(pData['TGL_MASUK']));
          setEl('fill-norek',    pData['NO_REK']       || '');
          setEl('fill-bank',     pData['BANK'] || pData['Bank'] || '');
          setEl('fill-nohp',     pData['NO. HP']       || '');
          setEl('fill-email',    pData['ALAMAT EMAIL'] || '');
        }

        const lastDay = new Date(tahun, bulan, 0).getDate();
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
            for (let c = 1; c <= 4; c++) { cells[c].textContent = shiftData.mulai; cells[c].style.cssText = shiftData.style; }
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
              cells[1].style.cssText = os; cells[2].style.cssText = os;
              if (shiftData.lemburMulai) { cells[3].style.cssText = os; cells[4].style.cssText = os; }
              cells[12].textContent = namaHari;
              cells[12].classList.add(dow === 6 ? 'keterangan-sabtu' : 'keterangan-minggu');
            }
          }
        }

        let hk = 0;
        for (let d = 1; d <= lastDay; d++) {
          const kode = String(jadwal[d - 1] || '').trim().toUpperCase();
          if (kode && kode !== 'OFF' && kode !== 'CUTI') hk++;
        }
        const elHK = page.querySelector('#fill-harikerja');
        if (elHK) elHK.textContent = hk;

        const elPeriode = page.querySelector('#fill-periode');
        if (elPeriode) elPeriode.textContent = '1 s/d ' + lastDay + ' ' + BULAN[bulan-1] + ' ' + tahun;

        container.appendChild(page);
      } catch (err) {
        console.error('Error generate page for', nama, err);
      }
    }

    hideLoading();

    if (mode === 'pdf') {
      const periodeLabel = document.getElementById('fill-periode').textContent || periodeVal;
      const opt = {
        margin      : 0,
        filename    : 'DAFTAR CETAK - ' + periodeLabel + '.pdf',
        image       : { type: 'jpeg', quality: 0.98 },
        html2canvas : { scale: 2, useCORS: true },
        jsPDF       : { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      showLoading();
      html2pdf().set(opt).from(container).save().then(() => hideLoading());
    } else {
      const win = window.open('', '_blank');
      win.document.write('<html><head><style>@page{margin:0;size:A4;}body{margin:0;}.page{width:794px;height:1123px;page-break-after:always;}</style><link rel="stylesheet" href="../css/timesheet.css"></head><body>');
      win.document.write(container.innerHTML);
      win.document.write('</body></html>');
      win.document.close();
      win.onload = () => { win.print(); };
    }
  }

  // Disable hardware back button
  history.pushState(null, '', window.location.href);
  window.addEventListener('popstate', () => {
    history.pushState(null, '', window.location.href);
  });

  // =====================================================================
  // MODAL EDIT DATA
  // =====================================================================
  function openEditModal() {
    document.getElementById('edit-noreg').value    = document.getElementById('fill-noreg').textContent    || '';
    document.getElementById('edit-tglmasuk').value = document.getElementById('fill-tglmasuk').textContent || '';
    document.getElementById('edit-norek').value    = document.getElementById('fill-norek').textContent    || '';
    document.getElementById('edit-bank').value     = document.getElementById('fill-bank').textContent     || '';
    document.getElementById('edit-nohp').value     = document.getElementById('fill-nohp').textContent     || '';
    document.getElementById('edit-email').value    = document.getElementById('fill-email').textContent    || '';
    document.getElementById('modal-overlay').style.display = 'flex';
  }

  function closeEditModal() {
    document.getElementById('modal-overlay').style.display = 'none';
  }

  function applyEditData() {
    const fill = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const noreg    = document.getElementById('edit-noreg').value;
    const tglmasuk = document.getElementById('edit-tglmasuk').value;
    const norek    = document.getElementById('edit-norek').value;
    const bank     = document.getElementById('edit-bank').value;
    const nohp     = document.getElementById('edit-nohp').value;
    const email    = document.getElementById('edit-email').value;

    fill('fill-noreg',    noreg);
    fill('fill-tglmasuk', tglmasuk);
    fill('fill-norek',    norek);
    fill('fill-bank',     bank);
    fill('fill-nohp',     nohp);
    fill('fill-email',    email);
    closeEditModal();

    const nama   = cddNama._getValue()  || '';
    const lokasi = document.getElementById('fill-lokasi').textContent || '';
    showLoading();
    fetch(GAS_PERSONIL_URL, {
      method: 'POST',
      body: JSON.stringify({
        action  : 'SAVE_TIMESHEET',
        nama    : nama,
        noreg   : noreg,
        lokasi  : lokasi,
        hp      : nohp,
        email   : email,
        tglMasuk: tglmasuk,
        norek   : norek,
        bank    : bank
      })
    })
    .then(r => r.json())
    .then(d => {
      hideLoading();
      showAlert(d.success ? '✔ Data berhasil disimpan.' : '✘ Gagal: ' + d.message);
    })
    .catch(err => {
      hideLoading();
      showAlert('✘ Gagal menyimpan data.');
      console.error(err);
    });
  }

  // =====================================================================
  // DOWNLOAD PDF
  // =====================================================================
  function downloadPDF() {
    showAlert('Memuat modul PDF...');
  }

  // =====================================================================
  // CETAK
  // =====================================================================
  function cetakForm() {
    window.print();
  }

  // =====================================================================
  // INIT
  // =====================================================================
  document.addEventListener('DOMContentLoaded', () => {
    scalePage();
    positionPanel();
    _positionAdminPanel();   // pastikan panel tersembunyi di posisi yang benar sejak awal
    loadPersonil();
    const elProyek = document.getElementById('fill-proyek');
    if (elProyek) elProyek.textContent = 'BRI KANCA MAGELANG';
  });

  window.addEventListener('resize', () => { scalePage(); positionPanel(); _positionAdminPanel(); });