const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectBtn');
const fileInfo = document.getElementById('fileInfo');
const statusMessage = document.getElementById('statusMessage');
const splitResults = document.getElementById('splitResults');

let selectedFile = null;
let splitFiles = [];

// Format bytes to human readable format
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show status message
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
}

// Hide status message
function hideStatus() {
    statusMessage.style.display = 'none';
}

// Display file information
function displayFileInfo(file) {
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatBytes(file.size);
    document.getElementById('fileType').textContent = file.type || '不明';
    fileInfo.style.display = 'block';
}

// Find MP3 frame boundary near the target position
async function findFrameBoundary(file, targetPosition, searchRange = 1024 * 100) {
    // For MP3 files, look for frame sync pattern (0xFF 0xE*)
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'mp3') {
        // For non-MP3 files, just use the target position
        return targetPosition;
    }
    
    const startSearch = Math.max(0, targetPosition - searchRange);
    const endSearch = Math.min(file.size, targetPosition + searchRange);
    
    // Read a chunk around the target position to find frame boundary
    const chunk = file.slice(startSearch, endSearch);
    const buffer = await chunk.arrayBuffer();
    const view = new Uint8Array(buffer);
    
    // Look for MP3 frame sync pattern (0xFF followed by 0xE0-0xFF)
    // MP3 frames start with 0xFF and the next byte's upper 4 bits are 1111
    let bestPosition = targetPosition;
    
    for (let i = Math.floor(view.length / 2); i < view.length - 1; i++) {
        if (view[i] === 0xFF && (view[i + 1] & 0xE0) === 0xE0) {
            bestPosition = startSearch + i;
            break;
        }
    }
    
    // If not found, search backwards
    if (bestPosition === targetPosition) {
        for (let i = Math.floor(view.length / 2) - 1; i >= 1; i--) {
            if (view[i] === 0xFF && (view[i + 1] & 0xE0) === 0xE0) {
                bestPosition = startSearch + i;
                break;
            }
        }
    }
    
    return Math.min(bestPosition, file.size);
}

// Split audio file into chunks at good boundaries
async function splitAudioFile(file) {
    const fileSize = file.size;
    
    if (fileSize <= MAX_FILE_SIZE) {
        showStatus('ファイルサイズが100MB以下です。分割の必要はありません。', 'info');
        return;
    }

    splitFiles = [];
    // Use 95MB as target size to leave some margin and find good boundaries
    const TARGET_CHUNK_SIZE = 95 * 1024 * 1024; // 95MB
    
    showStatus('ファイルを分割しています...', 'info');
    
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const extension = file.name.split('.').pop();
    
    let currentPosition = 0;
    let partNumber = 1;
    
    while (currentPosition < fileSize) {
        let targetEnd = currentPosition + TARGET_CHUNK_SIZE;
        
        // If this is the last chunk, use the end of file
        if (targetEnd >= fileSize) {
            targetEnd = fileSize;
        } else {
            // Try to find a good frame boundary near the target position
            targetEnd = await findFrameBoundary(file, targetEnd);
        }
        
        const chunk = file.slice(currentPosition, targetEnd);
        const chunkBlob = new Blob([chunk], { type: file.type });
        
        const chunkFileName = `${baseName}_part${partNumber}.${extension}`;
        
        splitFiles.push({
            name: chunkFileName,
            blob: chunkBlob,
            size: chunkBlob.size
        });
        
        currentPosition = targetEnd;
        partNumber++;
    }
    
    displaySplitResults();
}

// Display no split needed popup
function displayNoSplitNeeded(file) {
    // Update popup file info
    document.getElementById('popupFileName').textContent = file.name;
    document.getElementById('popupFileSize').textContent = formatBytes(file.size);
    document.getElementById('popupFileType').textContent = file.type || '不明';
    
    const popupOverlay = document.getElementById('popupOverlay');
    popupOverlay.style.display = 'flex';
    hideStatus();
}

// Display split results
function displaySplitResults() {
    if (splitFiles.length === 0) return;
    
    document.getElementById('popupOverlay').style.display = 'none';
    
    // Update popup file info
    document.getElementById('splitPopupFileName').textContent = selectedFile.name;
    document.getElementById('splitPopupFileSize').textContent = formatBytes(selectedFile.size);
    document.getElementById('splitPopupFileType').textContent = selectedFile.type || '不明';
    
    const resultMessage = document.getElementById('resultMessage');
    resultMessage.textContent = `${splitFiles.length}個のファイルに分割されました。各ファイルは100MB未満です。`;
    
    const tableBody = document.getElementById('resultsTableBody');
    tableBody.innerHTML = '';
    
    splitFiles.forEach((file, index) => {
        const row = document.createElement('tr');
        
        const numberCell = document.createElement('td');
        numberCell.textContent = index + 1;
        
        const nameCell = document.createElement('td');
        nameCell.textContent = file.name;
        
        const sizeCell = document.createElement('td');
        sizeCell.textContent = formatBytes(file.size);
        
        row.appendChild(numberCell);
        row.appendChild(nameCell);
        row.appendChild(sizeCell);
        
        tableBody.appendChild(row);
    });
    
    const splitCompleteOverlay = document.getElementById('splitCompleteOverlay');
    splitCompleteOverlay.style.display = 'flex';
    hideStatus();
}

// Download file
function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Download all files at once (no confirmation)
function downloadAllFiles() {
    if (splitFiles.length === 0) return;
    
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    downloadAllBtn.disabled = true;
    downloadAllBtn.textContent = 'ダウンロード中...';
    
    // Create all download links first (within user gesture context)
    const downloadLinks = splitFiles.map((file) => {
        const url = URL.createObjectURL(file.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.style.display = 'none';
        document.body.appendChild(a);
        return { element: a, url: url };
    });
    
    // Trigger downloads sequentially with minimal delay
    // This keeps them within the user gesture context
    let index = 0;
    function triggerNextDownload() {
        if (index < downloadLinks.length) {
            downloadLinks[index].element.click();
            index++;
            
            if (index < downloadLinks.length) {
                // Use requestAnimationFrame to maintain gesture context
                requestAnimationFrame(() => {
                    setTimeout(triggerNextDownload, 100);
                });
            } else {
                // Clean up after all downloads are triggered
                setTimeout(() => {
                    downloadLinks.forEach(link => {
                        document.body.removeChild(link.element);
                        URL.revokeObjectURL(link.url);
                    });
                    downloadAllBtn.disabled = false;
                    downloadAllBtn.textContent = 'ダウンロード';
                }, 500);
            }
        }
    }
    
    // Start the download sequence immediately
    triggerNextDownload();
}

// Handle file selection
function handleFile(file) {
    if (!file.type.startsWith('audio/')) {
        showStatus('音声ファイルを選択してください。', 'error');
        return;
    }
    
    selectedFile = file;
    displayFileInfo(file);
    hideStatus();
    
    // Hide previous results
    document.getElementById('splitCompleteOverlay').style.display = 'none';
    document.getElementById('popupOverlay').style.display = 'none';
    splitFiles = [];
    
    // Auto split if file is larger than 100MB
    if (file.size > MAX_FILE_SIZE) {
        splitAudioFile(file);
    } else {
        displayNoSplitNeeded(file);
    }
}

// Drag and drop handlers
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

dropZone.addEventListener('click', () => {
    fileInput.click();
});

// File input change handler
fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// Select button click handler
selectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

// Popup close button click handler
document.getElementById('popupCloseBtn').addEventListener('click', () => {
    document.getElementById('popupOverlay').style.display = 'none';
    resetForNewFile();
});

// Close popup when clicking overlay
document.getElementById('popupOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'popupOverlay') {
        document.getElementById('popupOverlay').style.display = 'none';
        resetForNewFile();
    }
});

// Reset state for new file selection
function resetForNewFile() {
    selectedFile = null;
    splitFiles = [];
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('fileInput').value = '';
    hideStatus();
}

// Close split complete popup
function closeSplitCompletePopup() {
    document.getElementById('splitCompleteOverlay').style.display = 'none';
    resetForNewFile();
}

// Close split complete popup button
document.getElementById('splitCompleteCloseBtn').addEventListener('click', closeSplitCompletePopup);

// Close split complete popup when clicking overlay
document.getElementById('splitCompleteOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'splitCompleteOverlay') {
        closeSplitCompletePopup();
    }
});

// Download all button click handler
document.getElementById('downloadAllBtn').addEventListener('click', downloadAllFiles);

