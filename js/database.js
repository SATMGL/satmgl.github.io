const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwOnFO2TxMuqSsZqcFBBwDQCl-vih098DzGi54XyToJzht5RmgO3PApEyFtTP5cSBGNQA/exec';

// ADMIN MODE
const ADMIN_PASSWORD = 'admin123'; // Ganti password di sini
let isAdminMode = false;

let allData = [];
let currentPersonilData = null; // For request ID card
let oldPhotoModal = null; // Store old photo when modal opens
let newPhotoModal = null; // Store new photo selection

// Load data dari spreadsheet
async function loadData() {
  try {
    const response = await fetch(APPS_SCRIPT_URL);
    const data = await response.json();
    allData = data;
    return data;
  } catch (error) {
    console.error('Error loading data:', error);
    return [];
  }
}

// Convert Google Drive link to thumbnail
function convertGoogleDriveLink(url) {
  if (!url || url === '-' || url.trim() === '') {
    return '';
  }
  
  // Cek apakah ini link Google Drive
  if (url.includes('drive.google.com')) {
    let fileId = '';
    
    // Pattern 1: /d/FILE_ID/
    const match1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match1) {
      fileId = match1[1];
    }
    
    // Pattern 2: ?id=FILE_ID
    const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2) {
      fileId = match2[1];
    }
    
    if (fileId) {
      // Return thumbnail URL
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
    }
  }
  
  // Kalau bukan Google Drive, return as is
  return url;
}

// Show Toast Notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastIcon = document.getElementById('toastIcon');
  const toastMessage = document.getElementById('toastMessage');
  
  // Set icon based on type
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠'
  };
  
  toastIcon.textContent = icons[type] || icons.success;
  toastMessage.textContent = message;
  
  // Remove old classes
  toast.classList.remove('success', 'error', 'warning');
  toast.classList.add(type);
  toast.classList.add('show');
  
  // Auto hide - warning gets longer duration
  const duration = type === 'warning' ? 7000 : 4000;
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// Open Confirmation Modal
function openRequestIdCardModal(personData) {
  currentPersonilData = personData;
  
  const modal = document.getElementById('confirmModal');
  const nameEl = document.getElementById('confirmPersonilName');
  const unitEl = document.getElementById('confirmPersonilUnit');
  
  nameEl.textContent = personData['NAMA'] || '-';
  unitEl.textContent = personData['UNIT KERJA'] || '-';
  
  modal.style.display = 'block';
}

// CEK apakah sudah pernah request dan tampilkan foto request
async function checkAndRequestIdCard(personData) {
  // Cek dulu apakah sudah pernah request
  const checkData = {
    action: 'CHECK_REQUEST',
    nama: (personData['NAMA'] || '').trim(),
    unit: (personData['UNIT KERJA'] || '').trim()
  };
  
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(checkData)
    });
    
    const result = await response.json();
    
    if (result.hasRequest) {
      // Sudah pernah request - tampilkan foto yang di-request
      showRequestedPhotoModal(personData, result.requestData);
    } else {
      // Belum pernah request - langsung ke konfirmasi
      openRequestIdCardModal(personData);
    }
  } catch (error) {
    console.error('Error checking request:', error);
    // Kalau error, tetap bisa request
    openRequestIdCardModal(personData);
  }
}

// Tampilkan modal foto yang sudah di-request
function showRequestedPhotoModal(personData, requestData) {
  const fotoSekarang = convertGoogleDriveLink(personData['LINK FOTO']);
  const fotoRequest = convertGoogleDriveLink(requestData.fotoReq);
  
  const modal = document.getElementById('infoModal');
  const modalTitle = document.getElementById('infoModalTitle');
  const modalMessage = document.getElementById('infoModalMessage');
  const modalIcon = document.getElementById('infoModalIcon');
  const modalHeader = document.getElementById('infoModalHeader');
  
  modalTitle.textContent = '📸 Sudah Pernah Request';
  modalMessage.textContent = `${personData['NAMA']} sudah pernah di-request pada ${requestData.timestamp}.\n\nStatus: ${requestData.status}`;
  modalIcon.textContent = '⚠️';
  modalHeader.style.background = 'linear-gradient(120deg, #ff9800, #ffa726)';
  
  // Hapus konten lama
  const modalBody = modal.querySelector('.confirm-modal-body');
  const existingPreview = modalBody.querySelector('.foto-preview-container');
  if (existingPreview) existingPreview.remove();
  const existingButtons = modalBody.querySelector('.update-buttons');
  if (existingButtons) existingButtons.remove();
  
  // Tambahkan preview foto
  const previewHTML = `
    <div class="foto-preview-container" style="margin: 15px 0; text-align: center;">
      <div style="margin-bottom: 10px;">
        <p style="font-size: 13px; font-weight: 600; color: #666; margin-bottom: 8px;">Foto yang sudah di-request:</p>
        <img src="${fotoRequest}" style="max-width: 200px; max-height: 200px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);" onerror="this.src=''; this.alt='Foto tidak dapat dimuat'">
      </div>
    </div>
    <div class="update-buttons" style="margin-top: 20px; display: flex; gap: 10px;">
      <button class="btn-confirm btn-confirm-no" onclick="closeInfoModal()" style="flex: 1;">Batal</button>
      <button class="btn-confirm btn-confirm-yes" onclick='updateRequest(${JSON.stringify(personData).replace(/'/g, "&#39;")})' style="flex: 1; background: linear-gradient(120deg, #2196f3, #42a5f5);">🔄 Ganti Foto Request</button>
    </div>
  `;
  
  const messageEl = document.getElementById('infoModalMessage');
  messageEl.insertAdjacentHTML('afterend', previewHTML);
  
  modal.style.display = 'block';
}

// Handle foto selection (show comparison before upload)
function handleFotoSelect(input) {
  const file = input.files[0];
  if (!file) return;
  
  if (file.size > 10 * 1024 * 1024) {
    showToast('Ukuran file maksimal 10MB', 'error');
    input.value = '';
    return;
  }
  
  const personData = window.currentPersonData;
  if (!personData) {
    alert('Data personil tidak ditemukan');
    return;
  }
  
  // Read file as base64
  const reader = new FileReader();
  reader.onload = function(e) {
    newPhotoModal = e.target.result;
    
    // Check if we have old photo
    if (oldPhotoModal && oldPhotoModal !== '-' && oldPhotoModal.trim() !== '') {
      // Show comparison modal
      document.getElementById('photoOldModal').src = oldPhotoModal;
      document.getElementById('photoNewModal').src = newPhotoModal;
      document.getElementById('photoComparisonModal').style.display = 'flex';
      // TAMBAHAN: Disable semua elemen lain
      document.body.classList.add('photo-comparison-open');
    } else {
      // No old photo, directly upload
      confirmPhotoChangeModal();
    }
  };
  reader.readAsDataURL(file);
}

// Cancel photo change in modal
function cancelPhotoChangeModal() {
  newPhotoModal = null;
  document.getElementById('uploadFotoPersonil').value = '';
  document.getElementById('photoComparisonModal').style.display = 'none';
  // TAMBAHAN: Re-enable semua elemen
  document.body.classList.remove('photo-comparison-open');
  showToast('Perubahan foto dibatalkan', 'warning');
}

// Close photo comparison modal
function closePhotoComparisonModal() {
  cancelPhotoChangeModal();
}

// Confirm photo change and upload
async function confirmPhotoChangeModal() {
  if (!newPhotoModal) return;
  
  const personData = window.currentPersonData;
  if (!personData) {
    showToast('Data personil tidak ditemukan', 'error');
    return;
  }
  
  // Hide comparison, prepare for upload
  document.getElementById('photoComparisonModal').style.display = 'none';
  // TAMBAHAN: Re-enable semua elemen
  document.body.classList.remove('photo-comparison-open');
  
  try {
    const updateData = {
      action: 'UPDATE_FOTO',
      id: personData['ID'],
      nama: (personData['NAMA'] || '').trim(),
      unit: (personData['UNIT KERJA'] || '').trim(),
      jabatan: (personData['JABATAN'] || '').trim(),
      foto: newPhotoModal
    };
    
    // Disable semua interaksi
    document.body.classList.add('uploading');
    
    showInfoModal(
      '⏳ Uploading...',
      'Sedang mengupload foto, mohon tunggu...',
      '⏳',
      'linear-gradient(120deg, #2196f3, #42a5f5)',
      true
    );
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(updateData)
    });
    
    const result = await response.json();
    
    // Enable kembali
    document.body.classList.remove('uploading');
    
    if (result.success) {
      // Update preview with new photo
      const preview = document.getElementById('previewFotoPersonil');
      if (preview) {
        preview.src = newPhotoModal;
      }
      
      // Update oldPhotoModal for next change
      oldPhotoModal = newPhotoModal;
      newPhotoModal = null;
      
      // Show photo container again
      document.getElementById('photoContainerModal').style.display = 'block';
      
      const infoModal = document.getElementById('infoModal');
      infoModal.classList.add('success-upload');
      
      showInfoModal(
        '✅ Foto Berhasil Diupdate!',
        'Foto telah diupdate di database dan Google Drive.',
        '🎉',
        'linear-gradient(120deg, #4caf50, #66bb6a)'
      );
    } else {
      // Show photo container again on error
      document.getElementById('photoContainerModal').style.display = 'block';
      
      showInfoModal(
        '❌ Upload Gagal',
        result.message || 'Terjadi kesalahan saat upload foto',
        '❌',
        'linear-gradient(120deg, #ff6b6b, #ff8787)'
      );
    }
  } catch (error) {
    document.body.classList.remove('uploading');
    document.getElementById('photoContainerModal').style.display = 'block';
    
    console.error('Error uploading photo:', error);
    showInfoModal(
      '❌ Upload Gagal',
      'Terjadi kesalahan saat upload foto: ' + error.message,
      '❌',
      'linear-gradient(120deg, #ff6b6b, #ff8787)'
    );
  }
}

// Handle update foto personil (OLD FUNCTION - kept for backward compatibility)
async function handleFotoUpdate(input) {
  const file = input.files[0];
  if (!file) return;
  
  const personData = window.currentPersonData;
  if (!personData) {
    alert('Data personil tidak ditemukan');
    return;
  }
  
  // Preview foto
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('previewFotoPersonil');
    if (preview) {
      preview.src = e.target.result;
    }
  };
  reader.readAsDataURL(file);
  
  // Convert ke base64 dan upload
  const readerBase64 = new FileReader();
  readerBase64.onload = async function(e) {
    const base64Foto = e.target.result;
    
    try {
      const updateData = {
        action: 'UPDATE_FOTO',
        id: personData['ID'],
        nama: (personData['NAMA'] || '').trim(),
        unit: (personData['UNIT KERJA'] || '').trim(),
        jabatan: (personData['JABATAN'] || '').trim(),
        foto: base64Foto
      };
      
      // Disable semua interaksi
      document.body.classList.add('uploading');
      
      showInfoModal(
        '⏳ Uploading...',
        'Sedang mengupload foto, mohon tunggu...',
        '⏳',
        'linear-gradient(120deg, #2196f3, #42a5f5)',
        true
      );
      
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(updateData)
      });
      
      const result = await response.json();
      
      // Enable kembali
      document.body.classList.remove('uploading');
      
      if (result.success) {
        // Update foto di modal yang sedang terbuka
        const preview = document.getElementById('previewFotoPersonil');
        if (preview) {
          preview.src = e.target.result;
        }
        
        const infoModal = document.getElementById('infoModal');
        infoModal.classList.add('success-upload');
        
        showInfoModal(
          '✅ Foto Berhasil Diupdate!',
          'Foto telah diupdate di database dan Google Drive.',
          '🎉',
          'linear-gradient(120deg, #4caf50, #66bb6a)'
        );
      } else {
        showInfoModal(
          '❌ Upload Gagal',
          result.message || 'Terjadi kesalahan saat upload foto',
          '❌',
          'linear-gradient(120deg, #ff6b6b, #ff8787)'
        );
      }
    } catch (error) {
      console.error('Error:', error);
      document.body.classList.remove('uploading');
      showInfoModal(
        '❌ Kesalahan Sistem',
        'Terjadi kesalahan saat upload: ' + error.message,
        '❌',
        'linear-gradient(120deg, #ff6b6b, #ff8787)'
      );
    }
  };
  readerBase64.readAsDataURL(file);
}

// Fungsi untuk update request dengan foto terbaru
async function updateRequest(personData) {
  const confirmBtn = document.querySelector('.update-buttons .btn-confirm-yes');
  const originalText = confirmBtn.textContent;
  
  confirmBtn.disabled = true;
  confirmBtn.textContent = '⏳ Memproses...';
  
  try {
    const requestData = {
      action: 'UPDATE_REQUEST',
      nama: (personData['NAMA'] || '').trim(),
      unit: (personData['UNIT KERJA'] || '').trim(),
      jabatan: (personData['JABATAN'] || '').trim(),
      fotoLink: personData['LINK FOTO']
    };
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(requestData)
    });
    
    const result = await response.json();
    
    closeInfoModal();
    
    if (result.success === true) {
      showInfoModal(
        '✅ Update Berhasil!',
        `Request untuk ${personData['NAMA']} telah diupdate dengan foto terbaru.`,
        '🎉',
        'linear-gradient(120deg, #4caf50, #66bb6a)'
      );
    } else {
      showInfoModal(
        '❌ Update Gagal',
        result.message || 'Terjadi kesalahan saat update request',
        '❌',
        'linear-gradient(120deg, #ff6b6b, #ff8787)'
      );
    }
    
  } catch (error) {
    console.error('Error:', error);
    closeInfoModal();
    showInfoModal(
      '❌ Kesalahan Sistem',
      'Terjadi kesalahan saat update request: ' + error.message,
      '❌',
      'linear-gradient(120deg, #ff6b6b, #ff8787)'
    );
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = originalText;
  }
}

// Close Confirmation Modal
function closeConfirmModal() {
  document.getElementById('confirmModal').style.display = 'none';
  currentPersonilData = null;
}

// Show Info Modal (for warnings/info)
function showInfoModal(title, message, icon = '⚠️', headerColor = 'linear-gradient(120deg, #ff9800, #ffa726)', hideButton = false) {
  const modal = document.getElementById('infoModal');
  const modalTitle = document.getElementById('infoModalTitle');
  const modalMessage = document.getElementById('infoModalMessage');
  const modalIcon = document.getElementById('infoModalIcon');
  const modalHeader = document.getElementById('infoModalHeader');
  
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modalIcon.textContent = icon;
  modalHeader.style.background = headerColor;
  
  // Tambah/hapus class uploading untuk animasi
  if (hideButton) {
    modalIcon.classList.add('uploading');
  } else {
    modalIcon.classList.remove('uploading');
  }
  
  // Sembunyikan atau tampilkan tombol OK
  const okButton = modal.querySelector('.btn-confirm-yes');
  if (okButton) {
    okButton.style.display = hideButton ? 'none' : 'block';
  }
  
  modal.style.display = 'block';
}

// Close Info Modal
function closeInfoModal() {
  const infoModal = document.getElementById('infoModal');
  infoModal.style.display = 'none';
  infoModal.classList.remove('success-upload');
}

// Confirm Request ID Card
async function confirmRequestIdCard() {
  if (!currentPersonilData) return;
  
  const confirmBtn = document.querySelector('.btn-confirm-yes');
  const originalText = confirmBtn.textContent;
  
  confirmBtn.disabled = true;
  confirmBtn.textContent = '⏳ Memproses...';
  
  // PERBAIKAN: Simpan nama dulu sebelum currentPersonilData di-null
  const personilNama = currentPersonilData['NAMA'];
  
  try {
    const requestData = {
      action: 'REQUEST_ID_CARD',
      id: currentPersonilData['ID'],
      nama: (currentPersonilData['NAMA'] || '').trim(),
      unit: (currentPersonilData['UNIT KERJA'] || '').trim(),
      jabatan: (currentPersonilData['JABATAN'] || '').trim(),
      nohp: currentPersonilData['NO. HP'],
      email: currentPersonilData['ALAMAT EMAIL'],
      fotoLink: currentPersonilData['LINK FOTO']
    };
    
    console.log('=== REQUEST DATA ===');
    console.log('Full requestData:', requestData);
    console.log('nama:', requestData.nama);
    console.log('unit:', requestData.unit);
    console.log('jabatan:', requestData.jabatan);
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(requestData)
    });
    
    // PERBAIKAN: Cek status response
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // PERBAIKAN: Parse response dengan error handling
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text:', responseText);
      throw new Error('Invalid JSON response from server');
    }
    
    // Close modal setelah dapat response
    closeConfirmModal();
    
    console.log('Result:', result);
    console.log('result.success:', result.success);
    console.log('result.duplicate:', result.duplicate);
    
    // PERBAIKAN: Gunakan personilNama yang sudah disimpan
    if (result.success === true) {
      console.log('Showing success modal...');
      // Tampilkan modal sukses yang menarik
      showInfoModal(
        '✅ Request Berhasil Dikirim!',
        `Request cetak ID Card untuk ${personilNama} telah berhasil disimpan dan akan segera diproses.\n\nFoto telah di-copy ke folder REQ_CETAK.`,
        '🎉',
        'linear-gradient(120deg, #4caf50, #66bb6a)'
      );
    } else if (result.duplicate === true) {
      console.log('Showing duplicate modal...');
      
      // CEK apakah foto sudah berubah
      if (result.fotoChanged === true) {
        // Tampilkan modal khusus untuk update foto
        showInfoModal(
          '📸 Foto Sudah Diupdate!',
          result.message,
          '🔄',
          'linear-gradient(120deg, #2196f3, #42a5f5)'
        );
      } else {
        // Tampilkan modal duplikat biasa
        showInfoModal(
          '⚠️ Request Sudah Ada',
          result.message,
          '⚠️',
          'linear-gradient(120deg, #ff9800, #ffa726)'
        );
      }
    } else {
      console.log('Showing error modal...');
      showInfoModal(
        '❌ Gagal Mengirim Request',
        result.message || 'Terjadi kesalahan saat mengirim request',
        '❌',
        'linear-gradient(120deg, #ff6b6b, #ff8787)'
      );
    }
    
  } catch (error) {
    console.error('Error:', error);
    closeConfirmModal();
    showInfoModal(
      'Kesalahan Sistem',
      'Terjadi kesalahan saat mengirim request: ' + error.message,
      '❌',
      'linear-gradient(120deg, #ff6b6b, #ff8787)'
    );
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = originalText;
  }
}

// Fungsi untuk menampilkan detail personil
function showPersonilDetail(personData) {
  const modal = document.getElementById('detailModal');
  const modalBody = document.getElementById('modalBody');
  
  // Ambil data sesuai nama kolom di Google Sheets
  const nama = personData['NAMA'] || '-';
  const unit = personData['UNIT KERJA'] || '-';
  const jabatan = personData['JABATAN'] || '-';
  const nohp = personData['NO. HP'] || '-';
  const email = personData['ALAMAT EMAIL'] || '-';
  const alamatLengkap = personData['ALAMAT LENGKAP'] || '-';
  const fotoOriginal = personData['LINK FOTO'] || '';
  
  // Konversi Google Drive link ke direct link
  const foto = convertGoogleDriveLink(fotoOriginal);
  
  // Simpan personData dan oldPhoto untuk digunakan saat upload foto
  window.currentPersonData = personData;
  oldPhotoModal = foto; // Store old photo
  newPhotoModal = null; // Reset new photo
  
  // Layout 2 kolom
  let html = '<div class="modal-two-column">';
  
  // KOLOM KIRI: Foto + Button
  html += '<div class="modal-column-left">';
  
  if (foto && foto !== '-' && foto.trim() !== '') {
    html += `
      <div id="photoContainerModal" class="photo-container-compact">
        <img id="previewFotoPersonil" src="${foto}" alt="Foto ${nama}" onerror="this.parentElement.innerHTML='<p style=color:#ff6b6b;font-size:12px;>❌ Foto gagal dimuat</p>'">
      </div>
      <input type="file" id="uploadFotoPersonil" accept="image/*" style="display: none;" onchange="handleFotoSelect(this)">
      <button onclick="document.getElementById('uploadFotoPersonil').click()" class="btn-photo-update">
        📷 Ganti Foto Profil
      </button>
    `;
  } else {
    html += `
      <div id="photoContainerModal" class="photo-container-compact">
        <p style="color: #999; font-size: 12px;">⚠️ Tidak ada foto</p>
      </div>
      <input type="file" id="uploadFotoPersonil" accept="image/*" style="display: none;" onchange="handleFotoSelect(this)">
      <button onclick="document.getElementById('uploadFotoPersonil').click()" class="btn-photo-update">
        📷 Upload Foto
      </button>
    `;
  }
  
  
  
  html += `
    <button class="btn-request-idcard-compact" onclick='checkAndRequestIdCard(${JSON.stringify(personData).replace(/'/g, "&#39;")})' ${isAdminMode ? '' : 'disabled'}>
      📸 Request ID Card
    </button>
    ${isAdminMode ? '' : '<small style="display: block; text-align: center; color: #999; font-size: 10px; margin-top: 5px;">⚠️ Fitur sedang ditutup</small>'}
  `;
  
  html += '</div>'; // End kolom kiri
  
  // KOLOM KANAN: Data
  html += '<div class="modal-column-right">';
  
  html += `
    <div class="detail-row-compact">
      <div class="detail-label-compact">Nama Lengkap</div>
      <div class="detail-value-compact">${nama}</div>
    </div>
    <div class="detail-row-compact">
      <div class="detail-label-compact">Unit Kerja</div>
      <div class="detail-value-compact">${unit}</div>
    </div>
    <div class="detail-row-compact">
      <div class="detail-label-compact">Jabatan</div>
      <div class="detail-value-compact">${jabatan}</div>
    </div>
    <div class="detail-row-compact">
      <div class="detail-label-compact">No. HP</div>
      <div class="detail-value-compact ${nohp === '-' ? 'empty' : ''}">
        ${nohp !== '-' ? `<a href="tel:${nohp}">${nohp}</a>` : nohp}
      </div>
    </div>
    <div class="detail-row-compact">
      <div class="detail-label-compact">Email</div>
      <div class="detail-value-compact ${email === '-' ? 'empty' : ''}">
        ${email !== '-' ? `<a href="mailto:${email}">${email}</a>` : email}
      </div>
    </div>
    <div class="detail-row-compact">
      <div class="detail-label-compact">Alamat</div>
      <div class="detail-value-compact ${alamatLengkap === '-' ? 'empty' : ''}">${alamatLengkap}</div>
    </div>
  `;
  
  html += '</div>'; // End kolom kanan
  html += '</div>'; // End two-column
  
  modalBody.innerHTML = html;
  modal.style.display = 'block';
  document.body.classList.add('modal-open');
  
  setTimeout(() => {
    modalBody.scrollTop = 0;
  }, 0);
}

// Fungsi untuk menutup modal
function closeModal() {
  const modal = document.getElementById('detailModal');
  modal.style.display = 'none';
  document.body.classList.remove('modal-open');
}

// Close modal when clicking outside of it
window.onclick = function(event) {
  const confirmModal = document.getElementById('confirmModal');
  const infoModal = document.getElementById('infoModal');
  
  if (event.target == confirmModal) {
    closeConfirmModal();
  }
  // Tidak close infoModal saat klik luar jika sedang uploading atau ada class success-upload
  if (event.target == infoModal && !document.body.classList.contains('uploading') && !infoModal.classList.contains('success-upload')) {
    closeInfoModal();
  }
}

// Tampilkan semua unit dalam grid 3x3
async function showAllUnits() {
  const contentArea = document.getElementById('contentArea');
  contentArea.innerHTML = '<div class="loading-spinner"></div>';
  
  const data = await loadData();
  
  if (!data || data.length === 0) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <svg fill="#ccc" viewBox="0 0 24 24" width="80" height="80">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
        <p>Belum ada data personil</p>
      </div>
    `;
    return;
  }
  
  // Kelompokkan data berdasarkan unit
  const groupedData = {};
  data.forEach(person => {
    const unit = person['UNIT KERJA'] || person['Unit Kerja'] || 'LAINNYA';
    if (!groupedData[unit]) {
      groupedData[unit] = [];
    }
    groupedData[unit].push(person);
  });
  
  // Urutkan unit secara alfabetis
  const sortedUnits = Object.keys(groupedData).sort();
  
  // Buat grid - Tampilkan semua unit
  let html = '<div class="grid-container">';
  
  sortedUnits.forEach(unit => {
    const personils = groupedData[unit];
    
    // Urutkan personil berdasarkan jabatan
    const sortedPersonils = personils.sort((a, b) => {
      const jabatanA = (a['JABATAN'] || a['Jabatan'] || '').toUpperCase();
      const jabatanB = (b['JABATAN'] || b['Jabatan'] || '').toUpperCase();
      
      const order = { 'DEFINITIF': 1, 'PGS UNIT': 2, 'PGS TERAS': 3 };
      const rankA = order[jabatanA] || 999;
      const rankB = order[jabatanB] || 999;
      
      return rankA - rankB;
    });
    
    html += `
      <div class="unit-card">
        <div class="unit-card-header">
          ${unit}
          <span class="info-badge">${personils.length}</span>
        </div>
        <div class="unit-card-body compact">
    `;
    
    sortedPersonils.forEach(person => {
      const nama = person['NAMA'] || person['Nama'] || 'Nama tidak tersedia';
      const personDataStr = JSON.stringify(person).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      html += `
        <div class="personil-item">
          <span class="personil-name" onclick='showPersonilDetail(${personDataStr})'>${nama}</span>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  contentArea.innerHTML = html;
}

// Filter berdasarkan unit yang dipilih
async function filterByUnit() {
  const unitFilter = document.getElementById('unitFilter');
  const selectedUnit = unitFilter.value;
  
  if (!selectedUnit) {
    resetView();
    return;
  }
  
  const contentArea = document.getElementById('contentArea');
  contentArea.innerHTML = '<div class="loading-spinner"></div>';
  
  const data = await loadData();
  const filteredData = data.filter(person => {
    const unitKerja = person['UNIT KERJA'] || person['Unit Kerja'];
    return unitKerja === selectedUnit;
  });
  
  if (filteredData.length === 0) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <svg fill="#ccc" viewBox="0 0 24 24" width="80" height="80">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
        <p>Tidak ada personil di unit <strong>${selectedUnit}</strong></p>
      </div>
    `;
    return;
  }
  
  // Urutkan berdasarkan jabatan
  const sortedFilteredData = filteredData.sort((a, b) => {
    const jabatanA = (a['JABATAN'] || a['Jabatan'] || '').toUpperCase();
    const jabatanB = (b['JABATAN'] || b['Jabatan'] || '').toUpperCase();
    
    const order = { 'DEFINITIF': 1, 'PGS UNIT': 2, 'PGS TERAS': 3 };
    const rankA = order[jabatanA] || 999;
    const rankB = order[jabatanB] || 999;
    
    return rankA - rankB;
  });
  
  // Tampilkan dalam card besar (single column)
  let html = '<div class="single-unit-container">';
  html += `
    <div class="unit-card-large">
      <div class="unit-card-header">
        ${selectedUnit}
        <span class="info-badge">${sortedFilteredData.length} Personil</span>
      </div>
      <div class="unit-card-body">
  `;
  
  sortedFilteredData.forEach(person => {
    const nama = person['NAMA'] || person['Nama'] || 'Nama tidak tersedia';
    const personDataStr = JSON.stringify(person).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    html += `
      <div class="personil-item">
        <span class="personil-name" onclick='showPersonilDetail(${personDataStr})'>${nama}</span>
      </div>
    `;
  });
  
  html += `
      </div>
    </div>
  </div>
  `;
  
  contentArea.innerHTML = html;
}

// Reset ke tampilan awal
function resetView() {
  const contentArea = document.getElementById('contentArea');
  const unitFilter = document.getElementById('unitFilter');
  unitFilter.value = '';
  
  contentArea.innerHTML = `
    <div class="empty-state">
      <svg fill="#ccc" viewBox="0 0 24 24" width="80" height="80">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
      </svg>
      <p>Silakan pilih opsi di atas untuk melihat data personil</p>
    </div>
  `;
}

// Panggil showAllUnits setelah DOM dan script siap
showAllUnits();

// Toggle Admin Mode
function toggleAdminMode() {
  const btn = document.getElementById('adminToggle');
  
  if (isAdminMode) {
    // Logout
    isAdminMode = false;
    btn.classList.remove('admin-active');
    btn.innerHTML = '🔒';
    showToast('Admin mode OFF', 'warning');
  } else {
    // Login - minta password
    const password = prompt('🔐 Masukkan password admin:');
    if (password === ADMIN_PASSWORD) {
      isAdminMode = true;
      btn.classList.add('admin-active');
      btn.innerHTML = '🔓';
      showToast('Admin mode ON', 'success');
    } else if (password !== null) {
      showToast('Password salah!', 'error');
    }
  }
}