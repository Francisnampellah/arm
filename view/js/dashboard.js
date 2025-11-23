// Dashboard page functionality
import { requireAuth, checkAuth, logout } from './auth.js';
import { t, setLanguage, getCurrentLanguage } from './i18n/translations.js';

const STRAPI_URL = 'http://localhost:1337';
const API_URL = 'http://localhost:3001';

let authToken = null;
let user = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const auth = checkAuth();
    if (!auth) {
        window.location.href = '/login';
        return;
    }
    
    authToken = auth.token;
    user = auth.user;
    
    // Display user info
    document.getElementById('userName').textContent = user.username || user.email || 'User';
    
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Tab switching
    initTabs();
    
    // Initialize forms
    initCreateMarkerForm();
    initCSVUpload();
    initEditModal();
    initLanguageSwitcher();
});

// Tab switching logic
function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Update active tab
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}Tab`).classList.add('active');
            
            // Load markers when switching to markers tab
            if (tabName === 'markers') {
                loadMarkers();
            }
        });
    });
}

// Language switcher logic
function initLanguageSwitcher() {
    const langSwitcher = document.getElementById('languageSwitcher');
    if (!langSwitcher) return; // If element doesn't exist yet, skip
    
    // Set current language in dropdown
    langSwitcher.value = getCurrentLanguage();
    
    // Handle language change
    langSwitcher.addEventListener('change', (e) => {
        setLanguage(e.target.value);
        updatePageText(); // Refresh all text
        
        // Reload markers list if on markers tab to update text
        if (document.getElementById('markersTab').classList.contains('active')) {
            loadMarkers();
        }
    });
    
    // Initial text update
    updatePageText();
}

// Update all page text based on current language
function updatePageText() {
    // Header
    document.querySelector('.header h1').textContent = t('dashboard');
    document.getElementById('logoutBtn').textContent = t('logout');
    
    // Tabs
    document.querySelector('[data-tab="create"]').textContent = t('createMarker');
    document.querySelector('[data-tab="upload"]').textContent = t('uploadCSV');
    document.querySelector('[data-tab="markers"]').textContent = t('myMarkers');
    
    // Create Marker Tab
    document.querySelector('#createTab h2').textContent = t('createNewMarker');
    document.querySelector('label[for="markerName"]').innerHTML = `${t('name')} <span class="required">*</span>`;
    document.querySelector('label[for="markerUrl3D"]').innerHTML = `${t('modelUrl')} <span class="required">*</span>`;
    document.querySelector('label[for="markerBarcode"]').textContent = t('barcode');
    document.getElementById('createBtn').textContent = t('createMarker');
    
    // Upload CSV Tab
    document.querySelector('#uploadTab h2').textContent = t('uploadCSV');
    document.querySelector('.file-upload-hint').textContent = t('dragDropCSV');
    document.querySelector('.file-upload-hint').textContent = t('csvFileHint');
    document.getElementById('uploadBtn').textContent = t('uploadCSV');
    
    // My Markers Tab
    document.querySelector('#markersTab h2').textContent = t('myMarkers');
    document.getElementById('markersLoading').textContent = t('loading');
    document.getElementById('markersEmpty').textContent = t('noMarkers');
    
    // Edit Modal
    document.querySelector('#editModal h2').textContent = t('editMarker');
    document.querySelector('label[for="editMarkerName"]').innerHTML = `${t('name')} <span class="required">*</span>`;
    document.querySelector('label[for="editMarkerUrl3D"]').innerHTML = `${t('modelUrl')} <span class="required">*</span>`;
    document.querySelector('label[for="editMarkerBarcode"]').textContent = t('barcode');
    document.getElementById('updateBtn').textContent = t('updateMarker');
    document.getElementById('cancelEdit').textContent = t('cancel');
}

// Create Marker Form
function initCreateMarkerForm() {
    document.getElementById('createMarkerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const errorDiv = document.getElementById('createError');
        const successDiv = document.getElementById('createSuccess');
        const submitBtn = document.getElementById('createBtn');
        
        errorDiv.classList.remove('show');
        successDiv.classList.remove('show');
        
        const name = document.getElementById('markerName').value.trim();
        const url3D = document.getElementById('markerUrl3D').value.trim();
        const barcode = document.getElementById('markerBarcode').value;
        
        if (!name || !url3D) {
            errorDiv.textContent = t('nameAndUrlRequired');
            errorDiv.classList.add('show');
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = t('creating');
        
        try {
            const strapiData = {
                name,
                url3D,
                userId: user.id,
            };
            
            if (barcode) {
                strapiData.barcode = parseInt(barcode);
            }
            
            const response = await fetch(`${STRAPI_URL}/api/markers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({ data: strapiData }),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error?.message || t('failedToCreateMarker'));
            }
            
            successDiv.textContent = t('markerCreated');
            successDiv.classList.add('show');
            
            // Reset form
            document.getElementById('createMarkerForm').reset();
            
            // Reload markers if on markers tab
            if (document.getElementById('markersTab').classList.contains('active')) {
                loadMarkers();
            }
            
        } catch (error) {
            errorDiv.textContent = error.message || t('errorOccurred');
            errorDiv.classList.add('show');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = t('createMarker');
        }
    });
}

// CSV Upload functionality
function initCSVUpload() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    const csvFileInput = document.getElementById('csvFile');
    const uploadBtn = document.getElementById('uploadBtn');
    
    fileUploadArea.addEventListener('click', () => {
        csvFileInput.click();
    });
    
    csvFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            uploadBtn.style.display = 'block';
            uploadBtn.disabled = false;
        }
    });
    
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });
    
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            csvFileInput.files = e.dataTransfer.files;
            uploadBtn.style.display = 'block';
            uploadBtn.disabled = false;
        }
    });
    
    uploadBtn.addEventListener('click', handleCSVUpload);
}

async function handleCSVUpload() {
    const csvFileInput = document.getElementById('csvFile');
    const uploadBtn = document.getElementById('uploadBtn');
    const file = csvFileInput.files[0];
    
    if (!file) return;
    
    const errorDiv = document.getElementById('uploadError');
    const successDiv = document.getElementById('uploadSuccess');
    const resultDiv = document.getElementById('csvResult');
    
    errorDiv.classList.remove('show');
    successDiv.classList.remove('show');
    resultDiv.style.display = 'none';
    
    uploadBtn.disabled = true;
    uploadBtn.textContent = t('uploading');
    
    try {
        const formData = new FormData();
        formData.append('csv', file);
        
        const response = await fetch(`${API_URL}/api/admin/markers/bulk`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
            body: formData,
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || t('uploadFailed'));
        }
        
       // Display results
resultDiv.style.display = 'block';
resultDiv.innerHTML = `
    <h3>${t('uploadResults')}</h3>
    <p><strong>${t('total')}:</strong> ${data.summary.total} | 
    <strong>${t('successful')}:</strong> ${data.summary.successful} | 
    <strong>${t('failed')}:</strong> ${data.summary.failed}</p>
    ${data.success.length > 0 ? `
        <h4>${t('successful')}:</h4>
        ${data.success.map(item => `
            <div class="csv-result-item success">
                ${t('row')} ${item.row}: ${item.data.name} (${t('markerId')}: ${item.markerId || 'N/A'})
            </div>
        `).join('')}
    ` : ''}
    ${data.failed.length > 0 ? `
        <h4>${t('failed')}:</h4>
        ${data.failed.map(item => `
            <div class="csv-result-item failed">
                ${t('row')} ${item.row}: ${item.error}
            </div>
        `).join('')}
    ` : ''}
`;
        
        if (data.summary.successful > 0) {
            successDiv.textContent = t('uploadSuccess', { count: data.summary.successful });
            successDiv.classList.add('show');
        }
        
        // Reset file input
        csvFileInput.value = '';
        uploadBtn.style.display = 'none';
        
        // Reload markers
        if (document.getElementById('markersTab').classList.contains('active')) {
            loadMarkers();
        }
        
    } catch (error) {
        errorDiv.textContent = error.message || t('uploadFailed');
        errorDiv.classList.add('show');
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = t('uploadCSV');
    }
}

// Initialize Edit Modal
function initEditModal() {
    const modal = document.getElementById('editModal');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelEdit');
    
    // Close modal on close button click
    closeBtn.addEventListener('click', closeEditModal);
    cancelBtn.addEventListener('click', closeEditModal);
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeEditModal();
        }
    });
    
    // Handle form submission
    document.getElementById('editMarkerForm').addEventListener('submit', handleEditSubmit);
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    modal.classList.remove('show');
    document.getElementById('editMarkerForm').reset();
    document.getElementById('editError').classList.remove('show');
    document.getElementById('editSuccess').classList.remove('show');
}

// Edit Marker - Open modal with data
window.dashboardEditMarker = function(markerId, name, url3D, barcode) {
    const modal = document.getElementById('editModal');
    
    // Populate form with current data
    document.getElementById('editMarkerId').value = markerId;
    document.getElementById('editMarkerName').value = name || '';
    document.getElementById('editMarkerUrl3D').value = url3D || '';
    document.getElementById('editMarkerBarcode').value = barcode !== 'null' && barcode !== null ? barcode : '';
    
    // Show modal
    modal.classList.add('show');
};

// Handle edit form submission
async function handleEditSubmit(e) {
    e.preventDefault();
    
    const errorDiv = document.getElementById('editError');
    const successDiv = document.getElementById('editSuccess');
    const updateBtn = document.getElementById('updateBtn');
    
    errorDiv.classList.remove('show');
    successDiv.classList.remove('show');
    
    const markerId = document.getElementById('editMarkerId').value;
    const name = document.getElementById('editMarkerName').value.trim();
    const url3D = document.getElementById('editMarkerUrl3D').value.trim();
    const barcode = document.getElementById('editMarkerBarcode').value;
    
    if (!name || !url3D) {
        errorDiv.textContent = t('nameAndUrlRequired');
        errorDiv.classList.add('show');
        return;
    }
    
    updateBtn.disabled = true;
    updateBtn.textContent = t('updating');
    
    try {
        const strapiData = {
            name,
            url3D,
            userId: user.id,
        };
        
        if (barcode) {
            strapiData.barcode = parseInt(barcode);
        }
        
        const response = await fetch(`${STRAPI_URL}/api/markers/${markerId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ data: strapiData }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || t('failedToUpdateMarker'));
        }
        
        successDiv.textContent = t('markerUpdated');
        successDiv.classList.add('show');
        
        // Reload markers after short delay
        setTimeout(() => {
            closeEditModal();
            loadMarkers();
        }, 1500);
        
    } catch (error) {
        errorDiv.textContent = error.message || t('errorOccurred');
        errorDiv.classList.add('show');
    } finally {
        updateBtn.disabled = false;
        updateBtn.textContent = t('updateMarker');
    }
}

// Load Markers
async function loadMarkers() {
    const loadingDiv = document.getElementById('markersLoading');
    const listDiv = document.getElementById('markersList');
    const emptyDiv = document.getElementById('markersEmpty');
    
    loadingDiv.style.display = 'block';
    listDiv.style.display = 'none';
    emptyDiv.style.display = 'none';
    
    try {
        const userId = user.id;
        const response = await fetch(`${STRAPI_URL}/api/markers?filters[userId][$eq]=${userId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        
        const data = await response.json();
        
        loadingDiv.style.display = 'none';
        
        if (data.data && data.data.length > 0) {
            listDiv.innerHTML = data.data.map(marker => {
                // Strapi v5: properties are directly on marker object
                const markerId = marker.documentId; // Use documentId for API operations
                const name = marker.name || t('unnamed');
                const url3D = marker.url3D || 'N/A';
                const barcode = marker.barcode;
                
                // Escape single quotes to prevent breaking onclick
                const escapedName = name.replace(/'/g, "\\'");
                const escapedUrl = url3D.replace(/'/g, "\\'");
                
                return `
                    <div class="marker-item">
                        <div class="marker-info">
                            <h3>${name}</h3>
                            <p>${t('barcode')}: ${barcode || 'N/A'} | URL: ${url3D}</p>
                        </div>
                        <div class="marker-actions">
                            <button class="btn-small btn-edit" onclick="window.dashboardEditMarker('${markerId}', '${escapedName}', '${escapedUrl}', ${barcode || 'null'})">${t('edit')}</button>
                            <button class="btn-small btn-danger" onclick="window.dashboardDeleteMarker('${markerId}')">${t('delete')}</button>
                        </div>
                    </div>
                `;
            }).join('');
            listDiv.style.display = 'grid';
        } else {
            emptyDiv.style.display = 'block';
        }
    } catch (error) {
        loadingDiv.textContent = t('errorLoadingMarkers');
        console.error(error);
    }
}

// Delete Marker (exposed to global scope for onclick handler)
window.dashboardDeleteMarker = async function(markerId) {
    if (!confirm(t('deleteConfirm'))) return;
    
    try {
        const response = await fetch(`${STRAPI_URL}/api/markers/${markerId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        
        if (response.ok) {
            loadMarkers();
        } else {
            alert(t('failedToDelete'));
        }
    } catch (error) {
        alert(t('errorDeletingMarker'));
        console.error(error);
    }
};