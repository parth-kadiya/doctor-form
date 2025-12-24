// --- Variables ---
const API_BASE_URL = 'http://localhost:5000/api';
let cropper;
let croppedImageBase64 = null;
let generatedImageUrl = null;

// --- Elements (Updated with New IDs) ---
const inputs = {
    employeeName: document.getElementById('employeeName'),
    employeeHQ: document.getElementById('employeeHQ'),
    employeeID: document.getElementById('employeeID'),
    doctorName: document.getElementById('doctorName'),
    specialty: document.getElementById('specialty')
};

const errors = {
    employeeName: document.getElementById('err-employeeName'),
    employeeHQ: document.getElementById('err-employeeHQ'),
    employeeID: document.getElementById('err-employeeID'),
    doctorName: document.getElementById('err-doctorName'),
    specialty: document.getElementById('err-specialty')
};

const fileInput = document.getElementById('fileInput');
const fileText = document.getElementById('fileText');

// Modal & Crop Elements
const cropModal = document.getElementById('cropModal');
const imageToCrop = document.getElementById('imageToCrop');
const closeModalBtn = document.getElementById('closeModalBtn');
const saveCropBtn = document.getElementById('saveCropBtn');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');

// Buttons
const generateBtn = document.getElementById('generateBtn');
const successActions = document.getElementById('successActions');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

const resultOverlay = document.getElementById('resultOverlay');
const finalGeneratedImage = document.getElementById('finalGeneratedImage');
const closeResultBtn = document.getElementById('closeResultBtn');

// --- Helper: Clear Errors ---
function clearError(key) {
    if(errors[key]) {
        errors[key].style.display = 'none';
    }
}

// --- Input Handling ---
Object.keys(inputs).forEach(key => {
    inputs[key].addEventListener('input', () => {
        if(inputs[key].value.trim() !== '') clearError(key);
    });
});

// --- File & Cropper Handling ---
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Update text
        let fileName = file.name;
        if (fileName.length > 25) fileName = fileName.substring(0, 25) + "...";
        fileText.innerText = fileName;

        // Load image for modal
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            imageToCrop.src = readerEvent.target.result;
            cropModal.style.display = 'flex'; // Show modal
            
            // Initialize Cropper
            if (cropper) cropper.destroy();
            cropper = new Cropper(imageToCrop, {
                aspectRatio: 1,
                viewMode: 1,
                background: false
            });
        };
        reader.readAsDataURL(file);
    }
    fileInput.value = ''; // Reset input
});

function closeCropModal() {
    cropModal.style.display = 'none';
    if (cropper) cropper.destroy();
    cropper = null;
    if (!croppedImageBase64) fileText.innerText = 'No photo chosen';
}

closeModalBtn.addEventListener('click', closeCropModal);

saveCropBtn.addEventListener('click', () => {
    if (cropper) {
        const canvas = cropper.getCroppedCanvas({
            width: 512, height: 512
        });
        croppedImageBase64 = canvas.toDataURL('image/png');
        
        // Show Preview
        previewImage.src = croppedImageBase64;
        previewContainer.style.display = 'flex';
        
        // Hide Modal
        cropModal.style.display = 'none';
        if (cropper) cropper.destroy();
        cropper = null;
    }
});

// --- Validation Logic (Updated for New Fields) ---
function validateForm() {
    let isValid = true;
    
    // Employee Name
    if (!inputs.employeeName.value.trim()) {
        errors.employeeName.style.display = 'block';
        isValid = false;
    }

    // Employee HQ
    if (!inputs.employeeHQ.value.trim()) {
        errors.employeeHQ.style.display = 'block';
        isValid = false;
    }

    // Employee ID
    if (!inputs.employeeID.value.trim()) {
        errors.employeeID.style.display = 'block';
        isValid = false;
    }

    // Doctor Name
    if (!inputs.doctorName.value.trim()) {
        errors.doctorName.style.display = 'block';
        isValid = false;
    }

    // Specialty
    if (!inputs.specialty.value) {
        errors.specialty.style.display = 'block';
        isValid = false;
    }

    return isValid;
}

// --- Generate & API ---
generateBtn.addEventListener('click', async () => {
    if (!croppedImageBase64) {
        alert('Please upload and crop the doctor photo first!');
        return;
    }

    if (!validateForm()) return;

    // Start Loading
    const originalBtnText = generateBtn.innerHTML;
    generateBtn.innerHTML = `<span class="loader"></span> <span>Creating Profile...</span>`;
    generateBtn.disabled = true;

    // Construct Payload with New Fields
    const formData = {
        employeeName: inputs.employeeName.value,
        employeeHQ: inputs.employeeHQ.value,
        employeeID: inputs.employeeID.value,
        doctorName: inputs.doctorName.value,
        specialty: inputs.specialty.value,
        image: croppedImageBase64,
        userAgent: navigator.userAgent,
        userIp: 'user-' + Date.now()
    };

    try {
        const response = await fetch(`${API_BASE_URL}/images/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            generatedImageUrl = data.imageUrl;
            finalGeneratedImage.src = generatedImageUrl;
            
            // Show Result Overlay
            resultOverlay.style.display = 'flex';
            
            // Switch Main Button to Success Actions
            generateBtn.style.display = 'none';
            successActions.style.display = 'flex';
        } else {
            alert('Error: ' + data.message);
        }

    } catch (error) {
        console.error('Generation error:', error);
        alert('Failed to generate. Request recorded.');
    } finally {
        // Reset Button State
        generateBtn.innerHTML = "Generate Profile";
        generateBtn.disabled = false;
    }
});

// --- Result Actions ---
closeResultBtn.addEventListener('click', () => {
    resultOverlay.style.display = 'none';
});

downloadBtn.addEventListener('click', () => {
    if (generatedImageUrl) {
        const link = document.createElement('a');
        link.href = generatedImageUrl;
        // Using Employee Name for filename
        const safeName = inputs.employeeName.value.replace(/\s+/g, '_') || 'Profile';
        link.download = `Doctor_Profile_${safeName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});

// --- Reset All ---
resetBtn.addEventListener('click', () => {
    // Inputs
    Object.values(inputs).forEach(input => input.value = '');
    Object.values(errors).forEach(err => err.style.display = 'none');
    
    // Files
    fileText.innerText = 'No photo chosen';
    fileInput.value = '';
    croppedImageBase64 = null;
    generatedImageUrl = null;
    previewContainer.style.display = 'none';
    previewImage.src = '';
    
    // UI
    successActions.style.display = 'none';
    generateBtn.style.display = 'flex';
    resultOverlay.style.display = 'none';
});