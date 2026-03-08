const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwOnFO2TxMuqSsZqcFBBwDQCl-vih098DzGi54XyToJzht5RmgO3PApEyFtTP5cSBGNQA/exec';
const API_BASE = 'https://www.emsifa.com/api-wilayah-indonesia/api';

let selectedPhoto = null;
let oldPhoto = null; // Store old photo when editing
let allPersonilData = [];
let pendingFormData = null;
let currentMode = 'new';
let selectedPersonData = null;
let duplicateInOtherUnit = null;
let isDataLoading = true; // Track loading state

// Convert Google Drive link to thumbnail
function convertGoogleDriveLink(url) {
  if (!url || url === '-' || url.trim() === '') return '';
  
  if (url.includes('drive.google.com')) {
    let fileId = '';
    const match1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match1) fileId = match1[1];
    const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2) fileId = match2[1];
    
    if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  }
  return url;
}

// Load data personil dari spreadsheet
async function loadAllPersonilData() {
  isDataLoading = true;
  showLoadingBanner();
  
  try {
    const response = await fetch(APPS_SCRIPT_URL);
    const data = await response.json();
    allPersonilData = data || [];
    console.log('Loaded personil data:', allPersonilData.length, 'records');
    isDataLoading = false;
    hideLoadingBanner();
    return true;
  } catch (error) {
    console.error('Error loading personil data:', error);
    allPersonilData = [];
    isDataLoading = false;
    hideLoadingBanner();
    showAlert('⚠️ Gagal memuat data dari server. Silakan refresh halaman.', 'error');
    return false;
  }
}

function showLoadingBanner() {
  const banner = document.getElementById('loadingBanner');
  if (banner) banner.classList.add('show');
}

function hideLoadingBanner() {
  const banner = document.getElementById('loadingBanner');
  if (banner) banner.classList.remove('show');
}

// Update mode indicator - FIXED: Show Pindah Unit button
function updateModeIndicator(mode, personName = '') {
  const submitBtn = document.getElementById('submitBtn');
  const unitInfoContainer = document.getElementById('unitInfoContainer');
  const currentUnitText = document.getElementById('currentUnitText');
  const btnPindahUnit = document.getElementById('btnPindahUnit');
  
  if (mode === 'edit') {
    currentMode = 'edit';
    submitBtn.textContent = '✓ Update Data Personil';
    
    if (selectedPersonData) {
      const unit = selectedPersonData['Unit Kerja'] || selectedPersonData['UNIT KERJA'] || selectedPersonData['unit'] || '-';
      currentUnitText.textContent = unit;
      unitInfoContainer.classList.add('show');
      btnPindahUnit.classList.add('show'); // FIXED: Show button
    }
  } else {
    currentMode = 'new';
    submitBtn.textContent = '✓ Simpan Data Personil';
    unitInfoContainer.classList.remove('show');
    btnPindahUnit.classList.remove('show'); // FIXED: Hide button
  }
}

// Open pindah unit modal
function openPindahUnitModal() {
  if (!selectedPersonData) return;
  
  const modal = document.getElementById('pindahUnitModal');
  const namaText = document.getElementById('pindahNamaText');
  const unitLamaText = document.getElementById('pindahUnitLamaText');
  const unitSelect = document.getElementById('pindahUnitSelect');
  
  const nama = selectedPersonData['Nama'] || selectedPersonData['NAMA'] || selectedPersonData['nama'] || '';
  const unitLama = selectedPersonData['Unit Kerja'] || selectedPersonData['UNIT KERJA'] || selectedPersonData['unit'] || '';
  
  namaText.textContent = nama;
  unitLamaText.textContent = unitLama;
  unitSelect.value = '';
  
  for (let option of unitSelect.options) {
    if (option.value === unitLama) {
      option.disabled = true;
      option.textContent = option.value + ' (Unit Saat Ini)';
    } else {
      option.disabled = false;
      option.textContent = option.value;
    }
  }
  
  modal.style.display = 'flex';
}

function closePindahUnitModal() {
  document.getElementById('pindahUnitModal').style.display = 'none';
}

function confirmPindahUnit() {
  const unitBaru = document.getElementById('pindahUnitSelect').value;
  
  if (!unitBaru) {
    showAlert('Silakan pilih unit tujuan', 'error');
    return;
  }
  
  document.getElementById('unit').value = unitBaru;
  document.getElementById('currentUnitText').textContent = unitBaru;
  
  closePindahUnitModal();
  showAlert(`Unit akan dipindah ke ${unitBaru}. Silakan klik "Update Data Personil" untuk menyimpan.`, 'warning');
  
  selectedPersonData.isPindahUnit = true;
}

// Populate nama dropdown
async function populateNamaDropdown(selectedUnit) {
  const namaSelect = document.getElementById('namaSelect');
  const namaSelectGroup = document.getElementById('namaSelectGroup');
  const namaInput = document.getElementById('nama');
  const loadingIndicator = document.getElementById('namaLoadingIndicator');
  
  namaSelectGroup.classList.remove('hidden');
  loadingIndicator.style.display = 'flex';
  namaSelect.disabled = true;
  
  // Jika data masih loading, tunggu sampai selesai
  if (isDataLoading) {
    loadingIndicator.querySelector('span').textContent = 'Memuat data dari server...';
    
    // Tunggu sampai data selesai di-load
    const checkInterval = setInterval(() => {
      if (!isDataLoading) {
        clearInterval(checkInterval);
        populateDropdownWithData(selectedUnit, namaSelect, loadingIndicator, namaInput);
      }
    }, 100);
    
    // Timeout setelah 30 detik
    setTimeout(() => {
      if (isDataLoading) {
        clearInterval(checkInterval);
        loadingIndicator.style.display = 'none';
        showAlert('⚠️ Gagal memuat data. Silakan refresh halaman.', 'error');
      }
    }, 30000);
  } else {
    // Data sudah ready, langsung populate
    setTimeout(() => {
      populateDropdownWithData(selectedUnit, namaSelect, loadingIndicator, namaInput);
    }, 300);
  }
}

// Helper function untuk populate dropdown dengan data
function populateDropdownWithData(selectedUnit, namaSelect, loadingIndicator, namaInput) {
  namaSelect.innerHTML = '<option value="">-- Pilih Nama (opsional) --</option>';
  
  console.log('All personil data:', allPersonilData);
  console.log('Selected unit:', selectedUnit);
  
  const personilInUnit = allPersonilData.filter(p => {
    // Check multiple possible header variations
    const unit = p['Unit Kerja'] || p['UNIT KERJA'] || p['unit'] || p['Unit'];
    console.log('Checking person:', p, 'Unit:', unit);
    return unit === selectedUnit;
  });
  
  console.log('Personil in unit:', personilInUnit.length);
  
  personilInUnit.sort((a, b) => {
    const namaA = (a['Nama'] || a['NAMA'] || a['nama'] || '').toUpperCase();
    const namaB = (b['Nama'] || b['NAMA'] || b['nama'] || '').toUpperCase();
    return namaA.localeCompare(namaB);
  });
  
  personilInUnit.forEach(person => {
    const nama = person['Nama'] || person['NAMA'] || person['nama'];
    if (nama) {
      const option = document.createElement('option');
      option.value = nama;
      option.textContent = nama;
      option.setAttribute('data-person', JSON.stringify(person));
      namaSelect.appendChild(option);
    }
  });
  
  // Add "TAMBAH PERSONIL" option at the end
  const addOption = document.createElement('option');
  addOption.value = '__ADD_NEW__';
  addOption.textContent = '➕ TAMBAH PERSONIL BARU';
  addOption.style.fontWeight = 'bold';
  addOption.style.color = '#ff9800';
  addOption.style.backgroundColor = '#fff3e0';
  namaSelect.appendChild(addOption);
  
  loadingIndicator.style.display = 'none';
  loadingIndicator.querySelector('span').textContent = 'Memuat daftar nama...';
  namaSelect.disabled = false;
  namaInput.disabled = false;
  namaInput.placeholder = 'Masukkan nama lengkap';
}

// Handle unit selection
document.getElementById('unit').addEventListener('change', function() {
  const selectedUnit = this.value;
  const namaInput = document.getElementById('nama');
  
  if (selectedUnit) {
    populateNamaDropdown(selectedUnit);
    resetFormToNew();
    // Hide data personil section until user selects a name
    document.getElementById('dataPersonilSection').classList.add('hidden');
    document.getElementById('submitSection').classList.add('hidden');
  } else {
    document.getElementById('namaSelectGroup').classList.add('hidden');
    namaInput.disabled = true;
    namaInput.placeholder = 'Pilih unit terlebih dahulu...';
    resetFormToNew();
    // Hide data personil section
    document.getElementById('dataPersonilSection').classList.add('hidden');
    document.getElementById('submitSection').classList.add('hidden');
  }
});

// Handle nama selection
document.getElementById('namaSelect').addEventListener('change', function() {
  const selectedValue = this.value;
  
  if (selectedValue === '__ADD_NEW__') {
    // User selected "TAMBAH PERSONIL" option
    addNewPersonil();
    // Show data personil section
    document.getElementById('dataPersonilSection').classList.remove('hidden');
    document.getElementById('submitSection').classList.remove('hidden');
  } else if (selectedValue) {
    // User selected an existing person
    const selectedOption = this.options[this.selectedIndex];
    const personData = JSON.parse(selectedOption.getAttribute('data-person'));
    fillFormWithPersonData(personData);
    updateModeIndicator('edit', personData['NAMA']);
    // Show data personil section
    document.getElementById('dataPersonilSection').classList.remove('hidden');
    document.getElementById('submitSection').classList.remove('hidden');
  } else {
    // User selected default option (-- Pilih Nama --)
    resetFormToNew();
    // Hide data personil section
    document.getElementById('dataPersonilSection').classList.add('hidden');
    document.getElementById('submitSection').classList.add('hidden');
  }
});

// Fill form with person data
async function fillFormWithPersonData(personData) {
  selectedPersonData = personData;
  
  // Support various header formats from Google Sheets
  document.getElementById('nama').value = personData['Nama'] || personData['NAMA'] || personData['nama'] || '';
  document.getElementById('jabatan').value = personData['Jabatan'] || personData['JABATAN'] || personData['jabatan'] || '';
  document.getElementById('nohp').value = personData['No HP'] || personData['NO. HP'] || personData['No. HP'] || personData['NO HP'] || personData['nohp'] || '';
  document.getElementById('email').value = personData['Email'] || personData['ALAMAT EMAIL'] || personData['Alamat Email'] || personData['email'] || '';
  document.getElementById('dusun').value = personData['Dusun'] || personData['DUSUN'] || personData['dusun'] || '';
  document.getElementById('rt').value = personData['RT'] || personData['rt'] || '';
  document.getElementById('rw').value = personData['RW'] || personData['rw'] || '';
  
  const provinsi = personData['Provinsi'] || personData['PROVINSI'] || personData['provinsi'] || '';
  const kabkota = personData['Kota/Kab'] || personData['KOTA/KAB'] || personData['Kabupaten'] || personData['kota'] || '';
  const kecamatan = personData['Kecamatan'] || personData['KECAMATAN'] || personData['kecamatan'] || '';
  const kelurahan = personData['Kelurahan'] || personData['KELURAHAN'] || personData['kelurahan'] || personData['Desa'] || personData['desa'] || '';
  
  if (provinsi) {
    const provinsiSelect = document.getElementById('provinsi');
    for (let option of provinsiSelect.options) {
      if (option.getAttribute('data-name') === provinsi) {
        provinsiSelect.value = option.value;
        
        await new Promise(resolve => {
          const checkKabkota = setInterval(() => {
            const kabkotaSelect = document.getElementById('kabkota');
            if (!kabkotaSelect.disabled && kabkotaSelect.options.length > 1) {
              clearInterval(checkKabkota);
              for (let opt of kabkotaSelect.options) {
                if (opt.getAttribute('data-name') === kabkota) {
                  kabkotaSelect.value = opt.value;
                  kabkotaSelect.dispatchEvent(new Event('change'));
                  break;
                }
              }
              resolve();
            }
          }, 100);
          provinsiSelect.dispatchEvent(new Event('change'));
        });
        
        await new Promise(resolve => {
          const checkKecamatan = setInterval(() => {
            const kecamatanSelect = document.getElementById('kecamatan');
            if (!kecamatanSelect.disabled && kecamatanSelect.options.length > 1) {
              clearInterval(checkKecamatan);
              for (let opt of kecamatanSelect.options) {
                if (opt.getAttribute('data-name') === kecamatan) {
                  kecamatanSelect.value = opt.value;
                  kecamatanSelect.dispatchEvent(new Event('change'));
                  break;
                }
              }
              resolve();
            }
          }, 100);
        });
        
        await new Promise(resolve => {
          const checkKelurahan = setInterval(() => {
            const kelurahanSelect = document.getElementById('kelurahan');
            if (!kelurahanSelect.disabled && kelurahanSelect.options.length > 1) {
              clearInterval(checkKelurahan);
              for (let opt of kelurahanSelect.options) {
                if (opt.getAttribute('data-name') === kelurahan) {
                  kelurahanSelect.value = opt.value;
                  break;
                }
              }
              resolve();
            }
          }, 100);
        });
        break;
      }
    }
  }
  
  const fotoUrl = personData['Link Foto'] || personData['LINK FOTO'] || personData['link foto'] || personData['Foto'] || personData['foto'] || '';
  if (fotoUrl && fotoUrl !== '-' && fotoUrl.trim() !== '') {
    const convertedUrl = convertGoogleDriveLink(fotoUrl);
    selectedPhoto = convertedUrl;
    oldPhoto = convertedUrl; // Store old photo
    document.getElementById('photoPreview').src = convertedUrl;
    document.querySelector('.photo-upload').style.display = 'none'; // Hide upload area
    document.getElementById('uploadText').style.display = 'none';
    document.getElementById('photoPreviewContainer').style.display = 'block';
    document.getElementById('photoComparisonContainer').style.display = 'none'; // Hide comparison initially
    document.getElementById('photoExampleContainer').style.display = 'none';
    document.getElementById('foto').required = false;
    // Show "Lihat Foto Database" button in edit mode
    document.getElementById('btnViewOldPhoto').style.display = 'none'; // Don't show yet, only after user changes photo
    document.getElementById('btnViewDatabasePhotoStatic').style.display = 'none';
  } else {
    // No photo in database
    selectedPhoto = null;
    oldPhoto = null;
    document.querySelector('.photo-upload').style.display = 'block'; // Show upload area
    document.getElementById('uploadText').style.display = 'block';
    document.getElementById('photoPreviewContainer').style.display = 'none';
    document.getElementById('photoComparisonContainer').style.display = 'none';
    document.getElementById('photoExampleContainer').style.display = 'block';
    document.getElementById('foto').required = true;
    document.getElementById('btnViewOldPhoto').style.display = 'none';
    document.getElementById('btnViewDatabasePhotoStatic').style.display = 'none';
    
    // Show alert to inform user
    showAlert('ℹ️ Personil ini belum memiliki foto di database. Silakan upload foto baru.', 'warning');
  }
}

// Reset form to new mode
function resetFormToNew() {
  selectedPersonData = null;
  oldPhoto = null; // Reset old photo
  selectedPhoto = null; // Reset selected photo
  updateModeIndicator('new');
  
  const unit = document.getElementById('unit').value;
  const namaSelectValue = document.getElementById('namaSelect').value;
  
  document.getElementById('personilForm').reset();
  document.getElementById('unit').value = unit;
  document.getElementById('namaSelect').value = namaSelectValue;
  
  // Clear foto input
  document.getElementById('foto').value = '';
  
  // Clear all preview images
  document.getElementById('photoPreview').src = '';
  document.getElementById('photoOld').src = '';
  document.getElementById('photoNew').src = '';
  
  // Show upload area, hide previews
  document.querySelector('.photo-upload').style.display = 'block';
  document.getElementById('uploadText').style.display = 'block';
  document.getElementById('photoPreviewContainer').style.display = 'none';
  document.getElementById('photoComparisonContainer').style.display = 'none';
  document.getElementById('photoExampleContainer').style.display = 'block';
  document.getElementById('btnViewOldPhoto').style.display = 'none';
  document.getElementById('btnViewDatabasePhotoStatic').style.display = 'none';
  
  document.getElementById('kabkota').disabled = true;
  document.getElementById('kecamatan').disabled = true;
  document.getElementById('kelurahan').disabled = true;
  document.getElementById('foto').required = true;
}

// Add new personil - reset nama select and enable form for new entry
function addNewPersonil() {
  const namaSelect = document.getElementById('namaSelect');
  const namaInput = document.getElementById('nama');
  const unit = document.getElementById('unit').value;
  
  // Reset nama dropdown to default
  namaSelect.value = '';
  
  // Clear all form fields except unit
  document.getElementById('personilForm').reset();
  document.getElementById('unit').value = unit;
  
  // CRITICAL: Clear all photo cache completely
  selectedPhoto = null;
  oldPhoto = null;
  document.getElementById('foto').value = '';
  
  // Show upload area, hide all previews
  document.querySelector('.photo-upload').style.display = 'block';
  document.getElementById('uploadText').style.display = 'block';
  document.getElementById('photoPreviewContainer').style.display = 'none';
  document.getElementById('photoComparisonContainer').style.display = 'none';
  document.getElementById('photoExampleContainer').style.display = 'block';
  document.getElementById('btnViewOldPhoto').style.display = 'none';
  document.getElementById('btnViewDatabasePhotoStatic').style.display = 'none';
  
  // Clear preview image src to prevent cache
  document.getElementById('photoPreview').src = '';
  document.getElementById('photoOld').src = '';
  document.getElementById('photoNew').src = '';
  
  // Enable nama input for new entry
  namaInput.disabled = false;
  namaInput.placeholder = 'Masukkan nama lengkap';
  namaInput.value = '';
  namaInput.focus();
  
  // Reset form to new mode
  selectedPersonData = null;
  updateModeIndicator('new');
  
  // Disable address fields until filled
  document.getElementById('kabkota').disabled = true;
  document.getElementById('kecamatan').disabled = true;
  document.getElementById('kelurahan').disabled = true;
  document.getElementById('foto').required = true;
  
  // Show success message
  showAlert('✏️ Siap menambahkan personil baru! Silakan isi form.', 'warning');
}

// Refresh nama dropdown in current unit
async function refreshNamaDropdown() {
  const unit = document.getElementById('unit').value;
  if (unit) {
    await loadAllPersonilData(); // Reload data from server
    populateNamaDropdown(unit); // Repopulate dropdown
  }
}

// Check for duplicate name in other units
function checkDuplicateNameInOtherUnits(nama, currentUnit) {
  return allPersonilData.find(p => {
    const pNama = (p['NAMA'] || p['Nama'] || '').toUpperCase();
    const pUnit = p['UNIT KERJA'] || p['Unit Kerja'];
    return pNama === nama.toUpperCase() && pUnit !== currentUnit;
  });
}

// Show duplicate name modal
function showDuplicateNameModal(duplicate, currentFoto) {
  duplicateInOtherUnit = duplicate;
  
  const modal = document.getElementById('duplicateNameModal');
  const dupNameText = document.getElementById('dupNameText');
  const photoComparison = document.getElementById('photoComparison');
  
  const nama = duplicate['Nama'] || duplicate['NAMA'] || duplicate['nama'] || '';
  const unit = duplicate['Unit Kerja'] || duplicate['UNIT KERJA'] || duplicate['unit'] || '';
  const fotoUrl = convertGoogleDriveLink(duplicate['Link Foto'] || duplicate['LINK FOTO'] || duplicate['link foto'] || '');
  
  dupNameText.textContent = nama;
  
  photoComparison.innerHTML = `
    <div class="photo-compare-item">
      <div class="photo-compare-label">Unit Lain</div>
      <div class="photo-compare-unit">${unit}</div>
      <img src="${fotoUrl}" alt="${nama}">
    </div>
    <div class="photo-compare-item">
      <div class="photo-compare-label">Unit Saat Ini</div>
      <div class="photo-compare-unit">${document.getElementById('unit').value}</div>
      <img src="${currentFoto}" alt="Foto Baru">
    </div>
  `;
  
  modal.style.display = 'flex';
}

function closeDuplicateNameModal() {
  document.getElementById('duplicateNameModal').style.display = 'none';
  duplicateInOtherUnit = null;
}

function confirmSamePerson() {
  closeDuplicateNameModal();
  submitData(true, true);
}

function confirmDifferentPerson() {
  closeDuplicateNameModal();
  submitData(false);
}

// Load Provinsi
async function loadProvinsi() {
  try {
    const response = await fetch(`${API_BASE}/provinces.json`);
    const data = await response.json();
    const select = document.getElementById('provinsi');
    
    data.sort((a, b) => a.name.localeCompare(b.name));
    
    data.forEach(prov => {
      const option = document.createElement('option');
      option.value = prov.id;
      option.textContent = prov.name;
      option.setAttribute('data-name', prov.name);
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading provinsi:', error);
    showAlert('Gagal memuat data provinsi. Silakan refresh halaman.', 'error');
  }
}

// Load Kabupaten/Kota
document.getElementById('provinsi').addEventListener('change', async function() {
  const provId = this.value;
  const kabkotaSelect = document.getElementById('kabkota');
  const kecamatanSelect = document.getElementById('kecamatan');
  const kelurahanSelect = document.getElementById('kelurahan');
  
  kabkotaSelect.innerHTML = '<option value="">-- Pilih Kota/Kabupaten --</option>';
  kecamatanSelect.innerHTML = '<option value="">-- Pilih Kecamatan --</option>';
  kelurahanSelect.innerHTML = '<option value="">-- Pilih Kelurahan/Desa --</option>';
  kabkotaSelect.disabled = true;
  kecamatanSelect.disabled = true;
  kelurahanSelect.disabled = true;
  
  if (!provId) return;
  
  try {
    const response = await fetch(`${API_BASE}/regencies/${provId}.json`);
    const data = await response.json();
    
    data.sort((a, b) => a.name.localeCompare(b.name));
    
    data.forEach(kab => {
      const option = document.createElement('option');
      option.value = kab.id;
      option.textContent = kab.name;
      option.setAttribute('data-name', kab.name);
      kabkotaSelect.appendChild(option);
    });
    
    kabkotaSelect.disabled = false;
  } catch (error) {
    console.error('Error loading kabupaten:', error);
    showAlert('Gagal memuat data kabupaten/kota.', 'error');
  }
});

// Load Kecamatan
document.getElementById('kabkota').addEventListener('change', async function() {
  const kabId = this.value;
  const kecamatanSelect = document.getElementById('kecamatan');
  const kelurahanSelect = document.getElementById('kelurahan');
  
  kecamatanSelect.innerHTML = '<option value="">-- Pilih Kecamatan --</option>';
  kelurahanSelect.innerHTML = '<option value="">-- Pilih Kelurahan/Desa --</option>';
  kecamatanSelect.disabled = true;
  kelurahanSelect.disabled = true;
  
  if (!kabId) return;
  
  try {
    const response = await fetch(`${API_BASE}/districts/${kabId}.json`);
    const data = await response.json();
    
    data.sort((a, b) => a.name.localeCompare(b.name));
    
    data.forEach(kec => {
      const option = document.createElement('option');
      option.value = kec.id;
      option.textContent = kec.name;
      option.setAttribute('data-name', kec.name);
      kecamatanSelect.appendChild(option);
    });
    
    kecamatanSelect.disabled = false;
  } catch (error) {
    console.error('Error loading kecamatan:', error);
    showAlert('Gagal memuat data kecamatan.', 'error');
  }
});

// Load Kelurahan
document.getElementById('kecamatan').addEventListener('change', async function() {
  const kecId = this.value;
  const kelurahanSelect = document.getElementById('kelurahan');
  
  kelurahanSelect.innerHTML = '<option value="">-- Pilih Kelurahan/Desa --</option>';
  kelurahanSelect.disabled = true;
  
  if (!kecId) return;
  
  try {
    const response = await fetch(`${API_BASE}/villages/${kecId}.json`);
    const data = await response.json();
    
    data.sort((a, b) => a.name.localeCompare(b.name));
    
    data.forEach(kel => {
      const option = document.createElement('option');
      option.value = kel.id;
      option.textContent = kel.name;
      option.setAttribute('data-name', kel.name);
      kelurahanSelect.appendChild(option);
    });
    
    kelurahanSelect.disabled = false;
  } catch (error) {
    console.error('Error loading kelurahan:', error);
    showAlert('Gagal memuat data kelurahan/desa.', 'error');
  }
});

// Validasi Email
document.getElementById('email').addEventListener('input', function() {
  const email = this.value;
  const emailError = document.getElementById('emailError');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (email && !emailRegex.test(email)) {
    emailError.style.display = 'block';
    this.style.borderColor = '#ff4757';
  } else {
    emailError.style.display = 'none';
    this.style.borderColor = '#bbdefb';
  }
});

// Auto uppercase
const textInputs = ['nama', 'dusun'];
textInputs.forEach(id => {
  const input = document.getElementById(id);
  if (input) {
    input.addEventListener('input', function() {
      this.value = this.value.toUpperCase();
    });
  }
});

// Preview foto
document.getElementById('foto').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      showAlert('Ukuran file maksimal 10MB', 'error');
      this.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const newPhotoData = e.target.result;
      
      // Check if we're in edit mode and have old photo
      if (currentMode === 'edit' && oldPhoto && oldPhoto !== '-' && oldPhoto.trim() !== '') {
        // Show comparison
        document.getElementById('photoOld').src = oldPhoto;
        document.getElementById('photoNew').src = newPhotoData;
        document.querySelector('.photo-upload').style.display = 'none'; // Hide upload area
        document.getElementById('uploadText').style.display = 'none';
        document.getElementById('photoPreviewContainer').style.display = 'none';
        document.getElementById('photoComparisonContainer').style.display = 'block';
        document.getElementById('photoExampleContainer').style.display = 'none';
        document.getElementById('btnViewDatabasePhotoStatic').style.display = 'none';
        
        // Store new photo temporarily (not committed yet)
        selectedPhoto = newPhotoData;
      } else {
        // New data mode or no old photo - just show preview
        selectedPhoto = newPhotoData;
        document.getElementById('photoPreview').src = selectedPhoto;
        document.querySelector('.photo-upload').style.display = 'none'; // Hide upload area
        document.getElementById('uploadText').style.display = 'none';
        document.getElementById('photoPreviewContainer').style.display = 'block';
        document.getElementById('photoComparisonContainer').style.display = 'none';
        document.getElementById('photoExampleContainer').style.display = 'none';
        document.getElementById('btnViewDatabasePhotoStatic').style.display = 'none';
      }
    };
    reader.readAsDataURL(file);
  }
});

function removePhoto() {
  // If in edit mode and have old photo, show option to view database photo
  if (currentMode === 'edit' && oldPhoto && oldPhoto !== '-' && oldPhoto.trim() !== '') {
    selectedPhoto = null;
    document.getElementById('foto').value = '';
    document.querySelector('.photo-upload').style.display = 'block'; // Show upload area again
    document.getElementById('uploadText').style.display = 'block';
    document.getElementById('photoPreviewContainer').style.display = 'none';
    document.getElementById('photoComparisonContainer').style.display = 'none';
    document.getElementById('photoExampleContainer').style.display = 'none';
    document.getElementById('btnViewOldPhoto').style.display = 'none';
    
    // Show static button outside upload area
    document.getElementById('btnViewDatabasePhotoStatic').style.display = 'block';
    
    showAlert('⚠️ Foto dihapus. Klik tombol "👁️ Lihat Foto Database" untuk melihat foto lama, atau upload foto baru.', 'warning');
  } else {
    // New mode or no old photo - just clear everything
    selectedPhoto = null;
    oldPhoto = null;
    document.getElementById('foto').value = '';
    document.querySelector('.photo-upload').style.display = 'block'; // Show upload area
    document.getElementById('uploadText').style.display = 'block';
    document.getElementById('photoPreviewContainer').style.display = 'none';
    document.getElementById('photoComparisonContainer').style.display = 'none';
    document.getElementById('photoExampleContainer').style.display = 'block';
    document.getElementById('btnViewOldPhoto').style.display = 'none';
    document.getElementById('btnViewDatabasePhotoStatic').style.display = 'none';
    
    if (currentMode === 'edit') {
      showAlert('⚠️ Foto dihapus. Silakan upload foto baru.', 'warning');
    }
  }
}

// View database photo (old photo)
function viewDatabasePhoto() {
  if (oldPhoto && oldPhoto !== '-' && oldPhoto.trim() !== '') {
    selectedPhoto = oldPhoto;
    document.getElementById('photoPreview').src = oldPhoto;
    document.querySelector('.photo-upload').style.display = 'none'; // Hide upload area
    document.getElementById('uploadText').style.display = 'none';
    document.getElementById('photoPreviewContainer').style.display = 'block';
    document.getElementById('photoComparisonContainer').style.display = 'none';
    document.getElementById('photoExampleContainer').style.display = 'none';
    document.getElementById('foto').required = false;
    document.getElementById('btnViewOldPhoto').style.display = 'none';
    document.getElementById('btnViewDatabasePhotoStatic').style.display = 'none';
    
    showAlert('✓ Menampilkan foto dari database.', 'success');
  } else {
    // No old photo available
    showAlert('❌ Tidak ada foto di database untuk personil ini.', 'error');
  }
}

// Cancel photo change - revert to old photo
function cancelPhotoChange() {
  if (oldPhoto) {
    selectedPhoto = oldPhoto; // Revert to old photo
    document.getElementById('photoPreview').src = oldPhoto;
    document.querySelector('.photo-upload').style.display = 'none'; // Keep upload area hidden
    document.getElementById('uploadText').style.display = 'none';
    document.getElementById('photoPreviewContainer').style.display = 'block';
    document.getElementById('photoComparisonContainer').style.display = 'none';
    document.getElementById('photoExampleContainer').style.display = 'none';
    document.getElementById('foto').value = ''; // Clear file input
    document.getElementById('foto').required = false;
    document.getElementById('btnViewDatabasePhotoStatic').style.display = 'none';
    showAlert('✓ Perubahan foto dibatalkan. Foto lama akan tetap digunakan.', 'success');
  }
}

// Keep photo change - commit to new photo
function keepPhotoChange() {
  // selectedPhoto already set to new photo
  // Just hide comparison and show confirmation
  document.getElementById('photoComparisonContainer').style.display = 'none';
  document.getElementById('photoPreview').src = selectedPhoto;
  document.querySelector('.photo-upload').style.display = 'none'; // Keep upload area hidden
  document.getElementById('photoPreviewContainer').style.display = 'block';
  
  // Show "Lihat Foto Database" button if in edit mode
  if (currentMode === 'edit' && oldPhoto) {
    document.getElementById('btnViewOldPhoto').style.display = 'block';
  }
  
  showAlert('✓ Foto baru akan digunakan. Klik "Update Data Personil" untuk menyimpan.', 'success');
}

// Submit form
document.getElementById('personilForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    showAlert('Format email tidak valid. Contoh: nama@email.com', 'error');
    document.getElementById('email').focus();
    return;
  }
  
  if (!selectedPhoto && currentMode === 'new') {
    showAlert('Silakan upload foto terlebih dahulu', 'error');
    return;
  }
  
  const nama = document.getElementById('nama').value.toUpperCase();
  const unit = document.getElementById('unit').value;
  
  if (currentMode === 'new') {
    const duplicateInSameUnit = allPersonilData.find(p => {
      const pNama = (p['NAMA'] || p['Nama'] || '').toUpperCase();
      const pUnit = (p['UNIT KERJA'] || p['Unit Kerja'] || '');
      return pNama === nama && pUnit === unit;
    });
    
    if (duplicateInSameUnit) {
      pendingFormData = { email, nama, unit };
      document.getElementById('duplicateName').textContent = nama;
      document.getElementById('duplicateUnit').textContent = unit;
      document.getElementById('confirmEmail').value = '';
      document.getElementById('emailMismatchError').style.display = 'none';
      document.getElementById('confirmEmail').classList.remove('modal-input-error');
      showDuplicateModal();
      return;
    }
    
    const duplicateInOther = checkDuplicateNameInOtherUnits(nama, unit);
    if (duplicateInOther) {
      showDuplicateNameModal(duplicateInOther, selectedPhoto);
      return;
    }
  }
  
  await submitData(currentMode === 'edit', false);
});

async function submitData(isUpdate = false, isPindahUnit = false) {
  const submitBtn = document.getElementById('submitBtn');
  const progressContainer = document.getElementById('progressContainer');
  const progressFill = document.getElementById('progressFill');
  
  if (isUpdate && selectedPersonData && selectedPersonData.isPindahUnit) {
    isPindahUnit = true;
  }
  
  submitBtn.disabled = true;
  submitBtn.textContent = isUpdate ? '⏳ Mengupdate data...' : '⏳ Menyimpan data...';
  progressContainer.style.display = 'block';
  
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += 10;
    if (progress <= 90) {
      progressFill.style.width = progress + '%';
      progressFill.textContent = progress + '%';
    }
  }, 200);
  
  try {
    const provSelect = document.getElementById('provinsi');
    const kabSelect = document.getElementById('kabkota');
    const kecSelect = document.getElementById('kecamatan');
    const kelSelect = document.getElementById('kelurahan');
    
    const provinsi = provSelect.options[provSelect.selectedIndex].getAttribute('data-name');
    const kabkota = kabSelect.options[kabSelect.selectedIndex].getAttribute('data-name');
    const kecamatan = kecSelect.options[kecSelect.selectedIndex].getAttribute('data-name');
    const kelurahan = kelSelect.options[kelSelect.selectedIndex].getAttribute('data-name');
    const dusun = document.getElementById('dusun').value;
    const rt = document.getElementById('rt').value;
    const rw = document.getElementById('rw').value;
    
    let alamatLengkap = '';
    if (dusun) alamatLengkap += `Dusun ${dusun}, `;
    alamatLengkap += `RT ${rt}/RW ${rw}, ${kelurahan}, ${kecamatan}, ${kabkota}, ${provinsi}`;
    
    let dataId = Date.now();
    if (isUpdate && selectedPersonData) {
      dataId = selectedPersonData['ID'] || selectedPersonData['Id'] || selectedPersonData['id'] || Date.now();
    } else if (isPindahUnit && duplicateInOtherUnit) {
      dataId = duplicateInOtherUnit['ID'] || duplicateInOtherUnit['Id'] || duplicateInOtherUnit['id'] || Date.now();
    }
    
    console.log('Submit data - isPindahUnit:', isPindahUnit, 'dataId:', dataId, 'selectedPersonData:', selectedPersonData);
    
    const personilData = {
      id: dataId,
      tanggal: new Date().toLocaleDateString('id-ID'),
      unit: document.getElementById('unit').value,
      nama: document.getElementById('nama').value,
      jabatan: document.getElementById('jabatan').value,
      nohp: document.getElementById('nohp').value,
      email: document.getElementById('email').value,
      provinsi, kabkota, kecamatan, kelurahan, dusun, rt, rw,
      alamatLengkap,
      foto: selectedPhoto,
      isUpdate: isUpdate || isPindahUnit,
      isPindahUnit
    };
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(personilData)
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    let result;
    try {
      const text = await response.text();
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('Parse error:', parseError);
      throw new Error('Gagal membaca response dari server');
    }
    
    clearInterval(progressInterval);
    progressFill.style.width = '100%';
    progressFill.textContent = '100%';
    
    setTimeout(() => {
      if (result && result.success) {
        let message = '✓ Data personil berhasil ';
        if (isPindahUnit) message += 'dipindahkan ke unit baru!';
        else if (isUpdate) message += 'diupdate!';
        else message += 'disimpan!';
        showAlert(message, 'success');
        showSuccessModal();
      } else {
        showAlert('⚠️ Data mungkin tersimpan, tapi ada peringatan: ' + (result?.message || 'Unknown'), 'error');
      }
      
      // Save current unit before reset
      const currentUnit = document.getElementById('unit').value;
      
      document.getElementById('personilForm').reset();
      removePhoto();
      updateModeIndicator('new');
      
      // Restore unit and show nama dropdown again
      document.getElementById('unit').value = currentUnit;
      document.getElementById('namaSelectGroup').classList.remove('hidden');
      
      // Hide data personil section after submit - user must choose again
      document.getElementById('dataPersonilSection').classList.add('hidden');
      document.getElementById('submitSection').classList.add('hidden');
      
      document.getElementById('kabkota').disabled = true;
      document.getElementById('kecamatan').disabled = true;
      document.getElementById('kelurahan').disabled = true;
      
      submitBtn.disabled = false;
      submitBtn.textContent = '✓ Simpan Data Personil';
      progressContainer.style.display = 'none';
      progressFill.style.width = '0%';
      
      // Reload data dan refresh dropdown
      loadAllPersonilData().then(() => {
        if (currentUnit) {
          populateNamaDropdown(currentUnit);
        }
      });
    }, 500);
    
  } catch (error) {
    clearInterval(progressInterval);
    console.error('Error:', error);
    showAlert('❌ Gagal menyimpan data. Silakan coba lagi.', 'error');
    
    submitBtn.disabled = false;
    submitBtn.textContent = '✓ Simpan Data Personil';
    progressContainer.style.display = 'none';
    progressFill.style.width = '0%';
  }
}

function showDuplicateModal() {
  document.getElementById('duplicateModal').style.display = 'flex';
}

function closeDuplicateModal() {
  document.getElementById('duplicateModal').style.display = 'none';
  pendingFormData = null;
}

function confirmUpdate() {
  const confirmEmail = document.getElementById('confirmEmail').value;
  const emailError = document.getElementById('emailMismatchError');
  const emailInput = document.getElementById('confirmEmail');
  
  if (!confirmEmail) {
    emailInput.classList.add('modal-input-error');
    emailError.textContent = 'Email harus diisi!';
    emailError.style.display = 'block';
    return;
  }
  
  if (confirmEmail !== pendingFormData.email) {
    emailInput.classList.add('modal-input-error');
    emailError.textContent = 'Email tidak sesuai dengan data form!';
    emailError.style.display = 'block';
    return;
  }
  
  closeDuplicateModal();
  submitData(true, false);
}

function showSuccessModal() {
  document.getElementById('successModal').style.display = 'flex';
}

function closeSuccessModal() {
  document.getElementById('successModal').style.display = 'none';
}

function showAlert(message, type) {
  const alertContainer = document.getElementById('alertContainer');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  alertContainer.appendChild(alert);
  setTimeout(() => alert.remove(), 5000);
}

// Init
loadProvinsi();
loadAllPersonilData();