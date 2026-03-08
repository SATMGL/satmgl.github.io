# DOKUMENTASI CODE.GS
## Jadwal Kerja Satpam — Google Apps Script

---

## KONSTANTA

### `MODE`
```javascript
const MODE = {
  PEL: 'PEL',  // Pelaksanaan Kerja
  PEN: 'PEN'   // Pengiriman Absensi
}
```
Selalu gunakan `MODE.PEL` atau `MODE.PEN`, jangan tulis string langsung `'PEL'` atau `'PEN'`.

---

### `UNIT_MAPPING`
```javascript
const UNIT_MAPPING = {
  'NGABLAK': 'A142:AI148',
  // dst...
}
```
Peta nama unit ke range baris di sheet jadwal. Digunakan oleh hampir semua fungsi.

---

## STRUKTUR SHEET

### Sheet Jadwal (PEL03-26 / PEN03-26)
```
startRow + 0  → kosong (padding atas)
startRow + 1  → nama unit + header hari (MIN, SEN, SEL, dst)
startRow + 2  → header kolom: NO | NAMA | TANGGAL | 1 | 2 | 3 ...
startRow + 3  → personil ke-1  ← pIdx = 0
startRow + 4  → personil ke-2  ← pIdx = 1
startRow + 5  → personil ke-3  ← pIdx = 2
...dst
```

### Struktur Kolom
```
Kolom A (1) = NO
Kolom B (2) = NAMA
Kolom C (3) = TANGGAL (header label)
Kolom D (4) = tanggal 1  ← jIdx = 0
Kolom E (5) = tanggal 2  ← jIdx = 1
...dst sampai tanggal 31
```

---

## KONVENSI PENTING

### pIdx (index personil)
- `pIdx` = index array **0-based**
- personil ke-1 di frontend → kirim `pIdx = 0`
- personil ke-2 di frontend → kirim `pIdx = 1`
- Rumus row di sheet: `row = startRow + 3 + pIdx`

### jIdx (index tanggal)
- `jIdx` = tanggal - 1
- tanggal 1 → `jIdx = 0` → kolom D
- tanggal 2 → `jIdx = 1` → kolom E
- Rumus kolom di sheet: `col = 4 + jIdx`

---

## FUNGSI

---

### 1. `getSheetName(mode, bulan, tahun)`
**Tujuan:** Menghasilkan nama sheet dari kombinasi mode, bulan, tahun.

| Parameter | Tipe | Contoh |
|-----------|------|--------|
| mode | String | `MODE.PEL` atau `MODE.PEN` |
| bulan | Number | `3` |
| tahun | Number/String | `2026` |

**Return:** `String` — nama sheet

**Contoh:**
```javascript
getSheetName(MODE.PEL, 3, 2026)  // → 'PEL03-26'
getSheetName(MODE.PEN, 3, 2026)  // → 'PEN03-26'
getSheetName(MODE.PEL, 12, 2026) // → 'PEL12-26'
```

---

### 2. `getDaysInMonth(bulan, tahun)`
**Tujuan:** Menghitung jumlah hari dalam bulan tertentu, termasuk tahun kabisat.

| Parameter | Tipe | Contoh |
|-----------|------|--------|
| bulan | Number | `3` |
| tahun | Number/String | `2026` |

**Return:** `Number` — jumlah hari

**Contoh:**
```javascript
getDaysInMonth(3, 2026)  // → 31
getDaysInMonth(2, 2026)  // → 28
getDaysInMonth(2, 2024)  // → 29 (kabisat)
getDaysInMonth(4, 2026)  // → 30
```

---

### 3. `getStartRow(range)`
**Tujuan:** Mengambil nomor baris awal dari string range UNIT_MAPPING.

| Parameter | Tipe | Contoh |
|-----------|------|--------|
| range | String | `'A142:AI148'` |

**Return:** `Number` — nomor baris awal

**Contoh:**
```javascript
getStartRow('A2:AI9')      // → 2
getStartRow('A11:AI17')    // → 11
getStartRow('A142:AI148')  // → 142
```

---

### 4. `getUnits()`
**Tujuan:** Mengembalikan daftar semua nama unit dari UNIT_MAPPING.

**Parameter:** tidak ada

**Return:** `Array<String>` — daftar nama unit

**Contoh:**
```javascript
getUnits()
// → ['AKMIL', 'BANDONGAN', 'BOROBUDUR', ..., 'WINDUSARI']
// Total: 26 unit
```

---

### 5. `getAvailableMonths(mode)`
**Tujuan:** Mengembalikan daftar bulan yang tersedia berdasarkan nama sheet di spreadsheet.

| Parameter | Tipe | Contoh |
|-----------|------|--------|
| mode | String | `MODE.PEL` atau `MODE.PEN` |

**Return:** `Array<Object>` — diurutkan dari bulan terlama ke terbaru

**Struktur return:**
```javascript
[
  { value: 2, tahun: '2026', sheet: 'PEL02-26' },
  { value: 3, tahun: '2026', sheet: 'PEL03-26' }
]
```

**Contoh:**
```javascript
getAvailableMonths(MODE.PEL)
// → [{ value: 2, tahun: '2026', sheet: 'PEL02-26' }, ...]

getAvailableMonths(MODE.PEN)
// → [{ value: 2, tahun: '2026', sheet: 'PEN02-26' }, ...]
```

---

### 6. `getJadwal(mode, bulan, tahun, unit)`
**Tujuan:** Membaca data jadwal satu unit dari sheet dan mengembalikan ke frontend.

| Parameter | Tipe | Contoh |
|-----------|------|--------|
| mode | String | `MODE.PEL` |
| bulan | Number | `3` |
| tahun | Number/String | `2026` |
| unit | String | `'NGABLAK'` |

**Return:** `Object`

**Struktur return (sukses):**
```javascript
{
  success: true,
  unitName: 'NGABLAK',
  headerHari: ['MIN', 'SEN', 'SEL', ...],   // 31 elemen
  headerTanggal: [1, 2, 3, ...],             // 31 elemen
  personil: [
    {
      no: 1,
      nama: 'HARDI SANTOSO',
      jadwal: ['M12', 'OFF', 'P', ...]       // 31 elemen, index = tanggal - 1
    },
    // dst...
  ],
  startRow: 142,
  lastDateCol: 33
}
```

**Struktur return (gagal):**
```javascript
{ success: false, message: 'Sheet PEL03-26 tidak ditemukan' }
```

**Contoh:**
```javascript
getJadwal(MODE.PEL, 3, 2026, 'NGABLAK')
```

---

### 7. `saveSingleCell(mode, bulan, tahun, unit, pIdx, jIdx, value)`
**Tujuan:** Menyimpan satu nilai jadwal ke cell tertentu di sheet.

| Parameter | Tipe | Keterangan |
|-----------|------|------------|
| mode | String | `MODE.PEL` atau `MODE.PEN` |
| bulan | Number | `3` |
| tahun | Number/String | `2026` |
| unit | String | `'NGABLAK'` |
| pIdx | Number | index personil **0-based** |
| jIdx | Number | index tanggal = tanggal - 1 |
| value | String | nilai jadwal, misal `'P'`, `'M12'`, `'OFF'` |

**Return:** `Object`
```javascript
{ success: true, message: 'Cell berhasil disimpan' }
// atau
{ success: false, message: '...' }
```

**Contoh:**
```javascript
// Simpan 'P' ke personil ke-1, tanggal 1
saveSingleCell(MODE.PEL, 3, 2026, 'NGABLAK', 0, 0, 'P')

// Simpan 'OFF' ke personil ke-2, tanggal 15
saveSingleCell(MODE.PEL, 3, 2026, 'NGABLAK', 1, 14, 'OFF')
```

⚠️ **pIdx = 0 untuk personil pertama** (berbeda dari kode lama yang pakai +1)

---

### 8. `saveJadwalBatch(mode, bulan, tahun, unit, changes)`
**Tujuan:** Menyimpan banyak cell sekaligus dalam satu operasi (lebih efisien dari saveSingleCell berulang).

| Parameter | Tipe | Keterangan |
|-----------|------|------------|
| mode | String | `MODE.PEL` atau `MODE.PEN` |
| bulan | Number | `3` |
| tahun | Number/String | `2026` |
| unit | String | `'NGABLAK'` |
| changes | Array | array objek `{ pIdx, jIdx, value }` |

**Struktur `changes`:**
```javascript
[
  { pIdx: 0, jIdx: 0, value: 'P' },   // personil ke-1, tanggal 1
  { pIdx: 1, jIdx: 0, value: 'OFF' }, // personil ke-2, tanggal 1
  { pIdx: 2, jIdx: 14, value: 'M12' } // personil ke-3, tanggal 15
]
```

**Return:** `Object`
```javascript
{ success: true, message: '3 cell berhasil disimpan' }
// atau
{ success: false, message: '...' }
```

**Contoh:**
```javascript
saveJadwalBatch(MODE.PEL, 3, 2026, 'NGABLAK', [
  { pIdx: 0, jIdx: 0, value: 'P' },
  { pIdx: 1, jIdx: 0, value: 'OFF' }
])
```

⚠️ **Konvensi pIdx dan jIdx sama dengan `saveSingleCell`**

---

### 9. `saveJadwal(mode, bulan, tahun, unit, jadwalData)`
**Tujuan:** Menyimpan seluruh jadwal satu unit sekaligus (full overwrite semua personil).

| Parameter | Tipe | Keterangan |
|-----------|------|------------|
| mode | String | `MODE.PEL` atau `MODE.PEN` |
| bulan | Number | `3` |
| tahun | Number/String | `2026` |
| unit | String | `'NGABLAK'` |
| jadwalData | Array | array objek `{ jadwal: [...] }` per personil |

**Struktur `jadwalData`:**
```javascript
[
  { jadwal: ['M12', 'OFF', 'P', ...] }, // personil ke-1, 31 elemen
  { jadwal: ['P', 'SM', 'OFF', ...] },  // personil ke-2, 31 elemen
  { jadwal: ['OFF', 'P', 'M12', ...] }  // personil ke-3, 31 elemen
]
```

**Return:** `Object`
```javascript
{ success: true, message: 'Jadwal berhasil disimpan' }
// atau
{ success: false, message: '...' }
```

**Contoh:**
```javascript
// Biasanya dipanggil setelah getJadwal, modifikasi, lalu simpan
const data = await getJadwal(MODE.PEL, 3, 2026, 'NGABLAK');
// ... modifikasi data.personil ...
saveJadwal(MODE.PEL, 3, 2026, 'NGABLAK', data.personil);
```

⚠️ **Full overwrite** — semua data jadwal unit akan ditimpa. Gunakan `saveSingleCell` atau `saveJadwalBatch` untuk perubahan sebagian.

---

## RINGKASAN PEMANGGILAN DARI HTML (fetch)

```javascript
const GS_URL = 'https://script.google.com/macros/s/XXXX/exec';

// GET — mengambil data
const res = await fetch(`${GS_URL}?action=getJadwal&mode=PEL&bulan=3&tahun=2026&unit=NGABLAK`);
const data = await res.json();

// POST — menyimpan data
const res = await fetch(GS_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'saveSingleCell',
    mode: 'PEL',
    bulan: 3,
    tahun: 2026,
    unit: 'NGABLAK',
    pIdx: 0,
    jIdx: 0,
    value: 'P'
  })
});
const data = await res.json();
```

---

*Dokumen ini akan diperbarui seiring penambahan fungsi baru.*