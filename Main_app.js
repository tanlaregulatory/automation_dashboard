// app.js - Main Application Controller
// KYC Classification System

// VALID USERS WITH EMAIL AND MOBILE
const validUsers = [
    { email: 'dinesh.andaluri@tanla.com', name: 'Dinesh Andaluri', mobile: '9000834234' },
    { email: 'rajender.rayapuram@tanla.com', name: 'Rajender Rayapuram', mobile: '9000540482' },
    { email: 'wasim.ahmed@tanla.com', name: 'Wasim Ahmed MD', mobile: '8722830305' },
    { email: 'saikiran.maddi@tanla.com', name: 'Sai Kiran Maddi', mobile: '8885577280' },
    { email: 'sampath.lingannagari@tanla.com', name: 'Sampath Reddy Linganna Gari', mobile: '8185932916' },
    { email: 'srikanth.polampalli@tanla.com', name: 'Srikanth Polampalli', mobile: '8143678971' },
    { email: 'chetan.chavan@tanla.com', name: 'Chetan Chavan', mobile: '9573941230' },
    { email: 'shaik.sayeed@tanla.com', name: 'Shaik Mohammed Sayeed', mobile: '8801826590' },
    { email: 'surya.ankith@tanla.com', name: 'Surya Ankith', mobile: '9966188138' },
    { email: 'ravikumar.madatha@tanla.com', name: 'Ravikumar Madatha', mobile: '8686073095' }
];

const validPassword = 'password123';
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing application');
    initializeApplication();
});

// Update initialization to set proper CSS on load
function initializeApplication() {
    console.log('Initializing application...');
    
    // Initialize date/time display
    updateCurrentDateTime();
    setInterval(updateCurrentDateTime, 1000);
    
    // Setup event listeners
    setupLoginHandlers();
    setupNavigationHandlers();
    setupProfileHandlers();
    setupFileUploadHandlers();
    setupClassificationHandlers();
    setupProfileDropdown();
    setupKycModalHandlers();
    
    // Ensure proper CSS is enabled on startup
    document.getElementById('classification-css').disabled = false;
    document.getElementById('dashboard-css').disabled = true;
    document.getElementById('ekyc-summary-css').disabled = true;
    
    console.log('Application initialized successfully');
}

// LOGIN & AUTHENTICATION
function setupLoginHandlers() {
    console.log('Setting up login handlers...');
    
    const loginBtn = document.getElementById('loginBtn');
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
        console.log('Login button event listener added');
    } else {
        console.error('Login button not found!');
    }
    
    if (usernameInput) {
        usernameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                console.log('Enter pressed in username');
                handleEnterKeyLogin('username');
            }
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                console.log('Enter pressed in password');
                handleEnterKeyLogin('password');
            }
        });
    }
    
    document.getElementById('forgotPasswordLink').addEventListener('click', showResetForm);
    document.getElementById('backToLoginLink').addEventListener('click', showLoginForm);
    document.getElementById('resetBtn').addEventListener('click', handlePasswordReset);
}

function showLoginForm() {
    document.getElementById('loginFormContainer').style.display = 'block';
    document.getElementById('resetFormContainer').style.display = 'none';
    clearResetForm();
    hideError('loginError');
    
    // Update header text for login
    updateLoginHeader('WELCOME', 'Login to your account', 'TRAI COMPLIANCE | NLP ENGINE V2.0');
}

function showResetForm(e) {
    if (e) e.preventDefault();
    document.getElementById('loginFormContainer').style.display = 'none';
    document.getElementById('resetFormContainer').style.display = 'block';
    hideError('resetError');
    
    // Update header text for reset
    updateLoginHeader('WELCOME', 'Reset your password', 'TRAI COMPLIANCE | NLP ENGINE V2.0');
}

function updateLoginHeader(title, subtitle, platformInfo) {
    const welcomeHeader = document.querySelector('.login-welcome-header');
    if (welcomeHeader) {
        welcomeHeader.innerHTML = `
            <h1>${title}</h1>
            <p class="login-subtitle">${subtitle}</p>
            <p class="platform-info">${platformInfo}</p>
        `;
    }
}

function handleLogin() {
    console.log('=== LOGIN ATTEMPT STARTED ===');
    
    const email = document.getElementById('loginUsername').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const errorElement = document.getElementById('loginError');
    
    console.log('Email entered:', email);
    console.log('Password entered:', password);
    console.log('Valid users:', validUsers);
    console.log('Valid password:', validPassword);
    
    // Check if error element exists
    if (!errorElement) {
        console.error('Login error element not found!');
        alert('System error: Please refresh the page');
        return;
    }
    
    // Hide error initially
    hideError('loginError');
    
    // Validation checks
    if (!email || !password) {
        console.log('Empty email or password');
        showError(errorElement, "Please enter both email and password");
        return;
    }
    
    if (email.length < 2 || password.length < 2) {
        console.log('Email or password too short');
        showError(errorElement, "Please enter a valid email and password");
        return;
    }
    
    // Check credentials - Email based authentication
    const user = validUsers.find(u => u.email.toLowerCase() === email);
    const isValidPassword = password === validPassword;
    
    console.log('Validation results - User found:', user, 'Password valid:', isValidPassword);
    
    if (!user) {
        console.log('Invalid email');
        showError(errorElement, "Invalid email address");
        return;
    }
    
    if (!isValidPassword) {
        console.log('Invalid password');
        showError(errorElement, "Invalid password");
        return;
    }
    
    console.log('=== LOGIN SUCCESSFUL ===');
    currentUser = user;
    hideLoginOverlay();
    showMainApplication(user);
    clearError(errorElement);
}

function handleEnterKeyLogin(field) {
    const email = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if ((field === 'username' && !password) || (field === 'password' && !email)) {
        return;
    }
    
    document.getElementById('loginBtn').click();
}

function handlePasswordReset() {
    const email = document.getElementById('resetUsername').value.trim().toLowerCase();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const resetError = document.getElementById('resetError');
    
    // Hide error initially
    hideError('resetError');
    
    if (!email) {
        showError(resetError, "Please enter email");
        return;
    }
    
    // Check if email exists
    const user = validUsers.find(u => u.email.toLowerCase() === email);
    if (!user) {
        showError(resetError, "Email not found in system");
        return;
    }
    
    if (newPassword.length < 4) {
        showError(resetError, "Password must be at least 4 characters");
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showError(resetError, "Passwords do not match");
        return;
    }
    
    showSuccess(resetError, "Password reset successfully!");
    
    setTimeout(() => {
        showLoginForm();
        clearResetForm();
        clearError(resetError);
    }, 2000);
}

// ERROR HANDLING FUNCTIONS
function showError(errorElement, message) {
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.color = '#e74c3c';
        errorElement.style.display = 'block';
        console.error('Error shown:', message);
    }
}

function hideError(errorElementId) {
    const errorElement = document.getElementById(errorElementId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

function showSuccess(errorElement, message) {
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.color = '#27ae60';
        errorElement.style.display = 'block';
    }
}

function clearError(errorElement) {
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

// IMPROVED NAVIGATION - CONSTANT HEADER
function setupNavigationHandlers() {
    // Classification navigation
    const classificationNav = document.getElementById('classificationNav');
    if (classificationNav) {
        classificationNav.addEventListener('click', function(e) {
            e.preventDefault();
            showClassificationPage();
        });
    }
    
    // Dashboard navigation
    const dashboardNav = document.getElementById('dashboardNav');
    if (dashboardNav) {
        dashboardNav.addEventListener('click', function(e) {
            e.preventDefault();
            showDashboardPage();
        });
    }
    
    // EKYC Report navigation
    const ekycReportNav = document.getElementById('ekycReportNav');
    if (ekycReportNav) {
        ekycReportNav.addEventListener('click', function(e) {
            e.preventDefault();
            showEKYCReportPage();
        });
    }
    
    const openKycUploadModal = document.getElementById('openKycUploadModal');
    if (openKycUploadModal) {
        openKycUploadModal.addEventListener('click', function() {
            document.getElementById('kycUploadModal').style.display = 'flex';
            document.getElementById('dashboardOutput').innerHTML = '';
            document.getElementById('kycStatsContainer').style.display = 'none';
        });
    }

    const openEkycUploadModal = document.getElementById('openEkycUploadModal');
    if (openEkycUploadModal) {
        openEkycUploadModal.addEventListener('click', function() {
            document.getElementById('ekycUploadModal').style.display = 'flex';
            document.getElementById('ekycReportOutput').innerHTML = '';
            document.getElementById('ekycStatsContainer').style.display = 'none';
        });
    }
    
    console.log('Navigation handlers setup completed');
}

// Update the page switching functions to properly handle CSS
function showClassificationPage() {
    // Enable classification CSS, disable others
    document.getElementById('classification-css').disabled = false;
    document.getElementById('dashboard-css').disabled = true;
    document.getElementById('ekyc-summary-css').disabled = true;
    
    // Hide all pages first
    hideAllPages();
    
    // Show classification page
    document.getElementById('classificationPage').style.display = 'block';
    
    // Set active navigation
    setActiveNav('classificationNav');
    
    // Clear any previous results
    clearClassificationResults();
    
    console.log('Switched to Classification page');
}

function showDashboardPage() {
    // Enable dashboard CSS, disable others
    document.getElementById('classification-css').disabled = true;
    document.getElementById('dashboard-css').disabled = false;
    document.getElementById('ekyc-summary-css').disabled = true;
    
    // Hide all pages first
    hideAllPages();
    
    // Show dashboard page
    document.getElementById('dashboardPage').style.display = 'block';
    
    // Set active navigation
    setActiveNav('dashboardNav');
    
    // Clear any previous results
    clearClassificationResults();
    
    console.log('Switched to Dashboard page');
}

function showEKYCReportPage() {
    // Enable dashboard CSS (for base styles) and EKYC summary CSS
    document.getElementById('classification-css').disabled = true;
    document.getElementById('dashboard-css').disabled = false;
    document.getElementById('ekyc-summary-css').disabled = false;
    
    // Hide all pages first
    hideAllPages();
    
    // Show EKYC report page
    document.getElementById('ekycReportPage').style.display = 'block';
    
    // Set active navigation
    setActiveNav('ekycReportNav');
    
    // Clear any previous results
    clearClassificationResults();
    
    console.log('Switched to EKYC Report page');
}

function hideAllPages() {
    const pages = ['classificationPage', 'dashboardPage', 'ekycReportPage'];
    pages.forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page) {
            page.style.display = 'none';
        }
    });
}

function setActiveNav(activeId) {
    // Remove active class from all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to clicked menu item
    const activeElement = document.getElementById(activeId);
    if (activeElement) {
        activeElement.classList.add('active');
    }
}

// CLASSIFICATION HANDLERS
function setupClassificationHandlers() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.backgroundColor = '#f0f8ff';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.backgroundColor = '';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.backgroundColor = '';
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                updateUploadAreaStatus();
            }
        });
        
        fileInput.addEventListener('change', updateUploadAreaStatus);
    }
    
    const addAgentBtn = document.getElementById('addAgentBtn');
    const numPeopleInput = document.getElementById('numPeople');
    
    if (addAgentBtn) {
        addAgentBtn.addEventListener('click', addAgent);
    }
    
    if (numPeopleInput) {
        numPeopleInput.addEventListener('change', updateAgentsFromNumber);
    }
    
    updateAgentsFromNumber();
    
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', handleBulkClassification);
    }
    
    const resetSingleBtn = document.getElementById('resetSingleBtn');
    const processSingleBtn = document.getElementById('processSingleBtn');
    
    if (resetSingleBtn) {
        resetSingleBtn.addEventListener('click', resetSingleTemplate);
    }
    
    if (processSingleBtn) {
        processSingleBtn.addEventListener('click', handleSingleClassification);
    }
}

function updateUploadAreaStatus() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    if (fileInput.files.length > 0) {
        uploadArea.innerHTML = `✅ ${fileInput.files[0].name}<br><small>File ready for processing</small>`;
        uploadArea.style.borderColor = '#27ae60';
        uploadArea.style.backgroundColor = '#f0f8ff';
    } else {
        uploadArea.innerHTML = `📁 Upload File for AI Classification<br><small>Drag or Choose File (XLSX/CSV)</small>`;
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.backgroundColor = '';
    }
}

function updateAgentsFromNumber() {
    const numPeopleInput = document.getElementById('numPeople');
    const peopleList = document.getElementById('peopleList');
    
    if (!numPeopleInput || !peopleList) return;
    
    const numPeople = parseInt(numPeopleInput.value) || 1;
    peopleList.innerHTML = '';
    
    for (let i = 1; i <= numPeople; i++) {
        const agentDiv = document.createElement('div');
        agentDiv.className = 'person-input';
        agentDiv.innerHTML = `
            <label for="person${i}">Agent ${i}:</label>
            <input type="text" id="person${i}" placeholder="Enter agent name" />
        `;
        peopleList.appendChild(agentDiv);
    }
}

function addAgent() {
    const numPeopleInput = document.getElementById('numPeople');
    if (numPeopleInput) {
        const currentValue = parseInt(numPeopleInput.value) || 1;
        if (currentValue < 10) {
            numPeopleInput.value = currentValue + 1;
            updateAgentsFromNumber();
        }
    }
}

function handleBulkClassification() {
    const fileInput = document.getElementById('fileInput');
    
    if (!fileInput.files.length) {
        alert('Please select a file first!');
        return;
    }
    
    // Use the processBulk function from Classification.js
    if (typeof processBulk === 'function') {
        processBulk();
    } else {
        alert('Classification functions not loaded properly');
    }
}

function handleSingleClassification() {
    const singleMessage = document.getElementById('singleMessage');
    
    if (!singleMessage.value.trim()) {
        alert('Please enter a template message to analyze!');
        return;
    }
    
    // Use the processSingle function from Classification.js
    if (typeof processSingle === 'function') {
        processSingle();
    } else {
        alert('Classification functions not loaded properly');
    }
}

function resetSingleTemplate() {
    const singleMessage = document.getElementById('singleMessage');
    if (singleMessage) singleMessage.value = '';
    
    // Use the resetSingle function from Classification.js
    if (typeof resetSingle === 'function') {
        resetSingle();
    }
}

function getAgentNames() {
    const agents = [];
    for (let i = 1; i <= 10; i++) {
        const agentInput = document.getElementById(`person${i}`);
        if (agentInput && agentInput.value.trim()) {
            agents.push(agentInput.value.trim());
        }
    }
    
    if (agents.length === 0) {
        return ['Agent1', 'Agent2', 'Agent3', 'Agent4'];
    }
    
    return agents;
}

// FILE UPLOAD HANDLERS
function setupFileUploadHandlers() {
    setupKYCFileUploads();
    setupEKYCFileUploads();
}

function setupKYCFileUploads() {
    const kycFileConfig = [
        { inputId: 'entitiesFileInput', statusId: 'entitiesStatus' },
        { inputId: 'tmEntitiesFileInput', statusId: 'tmEntitiesStatus' },
        { inputId: 'tmsFileInput', statusId: 'tmsStatus' },
        { inputId: 'refundsFileInput', statusId: 'refundsStatus' }
    ];
    
    kycFileConfig.forEach(config => {
        const input = document.getElementById(config.inputId);
        const status = document.getElementById(config.statusId);
        
        if (input && status) {
            input.addEventListener('change', function() {
                updateFileStatus(this, status);
                checkKYCFilesUploaded();
            });
        }
    });
}

function setupEKYCFileUploads() {
    const ekycFileConfig = [
        { inputId: 'ekycEntitiesFileInput', statusId: 'ekycEntitiesStatus' },
        { inputId: 'ekycTmFileInput', statusId: 'ekycTmStatus' },
        { inputId: 'ekycTmEntitiesFileInput', statusId: 'ekycTmEntitiesStatus' }
    ];
    
    ekycFileConfig.forEach(config => {
        const input = document.getElementById(config.inputId);
        const status = document.getElementById(config.statusId);
        
        if (input && status) {
            input.addEventListener('change', function() {
                updateFileStatus(this, status);
                checkEKYCReportFilesUploaded();
            });
        }
    });
}

function updateFileStatus(fileInput, statusElement) {
    if (fileInput.files.length > 0) {
        statusElement.innerHTML = `✅ ${fileInput.files[0].name}`;
        statusElement.style.color = '#27ae60';
    } else {
        statusElement.innerHTML = 'No file selected';
        statusElement.style.color = '#666';
    }
}

function checkKYCFilesUploaded() {
    const requiredFiles = ['entitiesFileInput', 'tmEntitiesFileInput', 'tmsFileInput', 'refundsFileInput'];
    
    const filesUploaded = requiredFiles.some(fileId => {
        const input = document.getElementById(fileId);
        return input && input.files.length > 0;
    });
    
    const generateBtn = document.getElementById('generateDashboardBtn');
    const instructions = document.getElementById('uploadInstructions');
    
    updateGenerateButtonState(generateBtn, instructions, filesUploaded, 
        'Please upload at least one file to generate dashboard',
        '✅ Files ready. Click to generate dashboard.');
}

function checkEKYCReportFilesUploaded() {
    const requiredFiles = ['ekycEntitiesFileInput', 'ekycTmFileInput', 'ekycTmEntitiesFileInput'];
    
    const allFilesUploaded = requiredFiles.every(fileId => {
        const input = document.getElementById(fileId);
        return input && input.files.length > 0;
    });
    
    const generateBtn = document.getElementById('generateEKYCReportBtn');
    const instructions = document.getElementById('ekycUploadInstructions');
    
    updateGenerateButtonState(generateBtn, instructions, allFilesUploaded,
        'Please upload all three files to generate EKYC report',
        '✅ All files ready. Click to generate EKYC report.');
}

function updateGenerateButtonState(button, instructions, isEnabled, disabledMessage, enabledMessage) {
    if (!button || !instructions) return;
    
    if (isEnabled) {
        button.disabled = false;
        button.style.background = 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)';
        instructions.innerHTML = enabledMessage;
        instructions.style.color = '#27ae60';
    } else {
        button.disabled = true;
        button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        instructions.innerHTML = disabledMessage;
        instructions.style.color = '#666';
    }
}

// PROFILE HANDLERS
function setupProfileHandlers() {
    const profilePhoto = document.getElementById('headerProfilePhoto');
    const settingsBtn = document.getElementById('settingsBtn');
    const uploadPhotoInput = document.getElementById('uploadPhotoInput');
    
    if (profilePhoto) profilePhoto.addEventListener('click', toggleSettingsDropdown);
    if (settingsBtn) settingsBtn.addEventListener('click', toggleSettingsDropdown);
    if (uploadPhotoInput) uploadPhotoInput.addEventListener('change', handlePhotoUpload);
    
    document.addEventListener('click', closeSettingsDropdown);
}

function setupProfileDropdown() {
    const settingsBtn = document.getElementById('settingsBtn');
    const profilePhoto = document.getElementById('headerProfilePhoto');
    
    if (settingsBtn) settingsBtn.addEventListener('click', toggleSettingsDropdown);
    if (profilePhoto) profilePhoto.addEventListener('click', toggleSettingsDropdown);
    
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('settingsDropdown');
        const settingsBtn = document.getElementById('settingsBtn');
        const profilePhoto = document.getElementById('headerProfilePhoto');
        
        if (dropdown && dropdown.style.display === 'block' &&
            !dropdown.contains(e.target) && 
            !settingsBtn.contains(e.target) && 
            !profilePhoto.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

function toggleSettingsDropdown(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('settingsDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

function closeSettingsDropdown() {
    const dropdown = document.getElementById('settingsDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

// PROFILE POPUP FUNCTIONS
function openProfilePopup() {
    if (currentUser) {
        document.getElementById('profileUsername').textContent = currentUser.name;
        document.getElementById('profileEmail').textContent = currentUser.email;
        document.getElementById('profileMobile').textContent = currentUser.mobile;
        document.getElementById('profileLastLogin').textContent = new Date().toLocaleString();
    }
    document.getElementById('profilePopup').style.display = 'flex';
    closeSettingsDropdown();
}

function closeProfilePopup() {
    document.getElementById('profilePopup').style.display = 'none';
}

function openChangePasswordPopup() {
    document.getElementById('changePasswordPopup').style.display = 'flex';
    closeSettingsDropdown();
}

function closeChangePasswordPopup() {
    document.getElementById('changePasswordPopup').style.display = 'none';
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPasswordChange').value = '';
    document.getElementById('confirmNewPassword').value = '';
    document.getElementById('passwordError').textContent = '';
}

function openChangeProfilePicPopup() {
    document.getElementById('changeProfilePicPopup').style.display = 'flex';
    closeSettingsDropdown();
}

function closeChangeProfilePicPopup() {
    document.getElementById('changeProfilePicPopup').style.display = 'none';
}

function updatePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPasswordChange').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    const errorDiv = document.getElementById('passwordError');
    
    if (!currentPassword) {
        errorDiv.textContent = 'Please enter your current password';
        return;
    }
    
    if (!newPassword || !confirmPassword) {
        errorDiv.textContent = 'Please enter and confirm your new password';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        errorDiv.textContent = 'New passwords do not match';
        return;
    }
    
    if (newPassword.length < 4) {
        errorDiv.textContent = 'Password must be at least 4 characters';
        return;
    }
    
    errorDiv.textContent = 'Password updated successfully!';
    errorDiv.style.color = '#27ae60';
    
    setTimeout(() => {
        closeChangePasswordPopup();
    }, 1500);
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        alert('Please select an image file');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const headerPhoto = document.getElementById('headerProfilePhoto');
        const profilePhotoLarge = document.getElementById('profilePhotoLarge');
        
        if (headerPhoto) headerPhoto.src = e.target.result;
        if (profilePhotoLarge) profilePhotoLarge.src = e.target.result;
        
        closeChangeProfilePicPopup();
        alert('Profile photo updated successfully!');
    };
    
    reader.readAsDataURL(file);
}

function deleteProfilePhoto() {
    const defaultPhoto = 'https://via.placeholder.com/120?text=User';
    
    const headerPhoto = document.getElementById('headerProfilePhoto');
    const profilePhotoLarge = document.getElementById('profilePhotoLarge');
    
    if (headerPhoto) headerPhoto.src = defaultPhoto;
    if (profilePhotoLarge) profilePhotoLarge.src = defaultPhoto;
    
    alert('Profile photo deleted successfully!');
}

function handleLogout() {
    hideMainApplication();
    showLoginOverlay();
    clearUserSession();
}

// KYC MODAL HANDLERS
function setupKycModalHandlers() {
    setupKycFileHandlers();
}

function setupKycFileHandlers() {
    const fileInputs = [
        { id: 'entitiesFileInput', statusId: 'entitiesStatus' },
        { id: 'tmEntitiesFileInput', statusId: 'tmEntitiesStatus' },
        { id: 'tmsFileInput', statusId: 'tmsStatus' },
        { id: 'refundsFileInput', statusId: 'refundsStatus' }
    ];

    fileInputs.forEach(config => {
        const input = document.getElementById(config.id);
        const status = document.getElementById(config.statusId);
        
        if (input && status) {
            input.addEventListener('change', function() {
                updateKycFileStatus(this, status);
                checkKYCFilesUploaded();
            });
        }
    });
}

function updateKycFileStatus(fileInput, statusElement) {
    if (fileInput.files.length > 0) {
        statusElement.textContent = fileInput.files[0].name;
        statusElement.style.color = '#27ae60';
    } else {
        statusElement.textContent = 'No file selected';
        statusElement.style.color = '#666';
    }
}

function closeKycUploadModal() {
    document.getElementById('kycUploadModal').style.display = 'none';
    clearKycFileInputs();
}

function clearKycFileInputs() {
    document.getElementById('entitiesFileInput').value = '';
    document.getElementById('tmEntitiesFileInput').value = '';
    document.getElementById('tmsFileInput').value = '';
    document.getElementById('refundsFileInput').value = '';
    
    document.getElementById('entitiesStatus').textContent = 'No file selected';
    document.getElementById('tmEntitiesStatus').textContent = 'No file selected';
    document.getElementById('tmsStatus').textContent = 'No file selected';
    document.getElementById('refundsStatus').textContent = 'No file selected';
    
    document.getElementById('generateDashboardBtn').disabled = true;
    document.getElementById('uploadInstructions').textContent = 'Upload at least one file to generate dashboard';
    document.getElementById('uploadInstructions').style.color = '#666';
}

function closeEkycUploadModal() {
    document.getElementById('ekycUploadModal').style.display = 'none';
    clearEkycFileInputs();
}

function clearEkycFileInputs() {
    document.getElementById('ekycEntitiesFileInput').value = '';
    document.getElementById('ekycTmFileInput').value = '';
    document.getElementById('ekycTmEntitiesFileInput').value = '';
    
    document.getElementById('ekycEntitiesStatus').textContent = 'No file selected';
    document.getElementById('ekycTmStatus').textContent = 'No file selected';
    document.getElementById('ekycTmEntitiesStatus').textContent = 'No file selected';
    
    document.getElementById('generateEKYCReportBtn').disabled = true;
    document.getElementById('ekycUploadInstructions').textContent = 'Upload all three files to generate EKYC report';
    document.getElementById('ekycUploadInstructions').style.color = '#666';
}

// UI STATE MANAGEMENT
function showMainApplication(user) {
    // Show main application components
    document.getElementById('sidebar').style.display = 'block';
    document.getElementById('mainHeader').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'block';
    
    // Update welcome message
    const welcomeElement = document.getElementById('welcomeUser');
    if (welcomeElement && user) {
        welcomeElement.textContent = `Welcome ${user.name}`;
    }
    
    // Ensure header is properly initialized
    updateCurrentDateTime();

      // Call auto-adjust only ONCE on load, not every second
    autoAdjustDateTimeSize();
    
    // Start with classification page
    showClassificationPage();
    
    console.log('Main application shown for user:', user.name);
}

function hideMainApplication() {
    document.getElementById('sidebar').style.display = 'none';
    document.getElementById('mainHeader').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
}

function showLoginOverlay() {
    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) loginOverlay.style.display = 'flex';
    showLoginForm();
}

function hideLoginOverlay() {
    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) loginOverlay.style.display = 'none';
}

function showLoginForm() {
    document.getElementById('loginFormContainer').style.display = 'block';
    document.getElementById('resetFormContainer').style.display = 'none';
    clearResetForm();
    hideError('loginError');
}

function showResetForm(e) {
    if (e) e.preventDefault();
    document.getElementById('loginFormContainer').style.display = 'none';
    document.getElementById('resetFormContainer').style.display = 'block';
    hideError('resetError');
}

// IMPROVED UTILITY FUNCTIONS
function updateCurrentDateTime() {
    const now = new Date();
    
    // Format date: DD/MM/YYYY
    const dateStr = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    
    // Format time: HH:MM:SS (24-hour format)
    const timeStr = now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    // Clean format without duplicate "Date:" text
    const dateTimeStr = `${dateStr} ${timeStr}`;
    const dateTimeElement = document.getElementById('currentDateTime');
    
    if (dateTimeElement) {
        dateTimeElement.textContent = dateTimeStr;
        // REMOVE the auto-adjust call to prevent ticking
        // autoAdjustDateTimeSize(); // Commented out to fix ticking issue
    }
}

// SIMPLIFIED auto-adjust function - only called when needed
function autoAdjustDateTimeSize() {
    const dateTimeElement = document.getElementById('currentDateTime');
    const welcomeUser = document.getElementById('welcomeUser');
    const headerRight = document.querySelector('.header-right');
    
    if (dateTimeElement && headerRight) {
        const headerRightWidth = headerRight.offsetWidth;
        const dateTimeWidth = dateTimeElement.scrollWidth;
        const welcomeWidth = welcomeUser ? welcomeUser.scrollWidth : 0;
        
        const totalWidth = dateTimeWidth + welcomeWidth + 100; // Add padding for other elements
        
        // Only adjust if absolutely necessary (content overflowing)
        if (totalWidth > headerRightWidth * 0.95) { // Increased threshold to 95%
            dateTimeElement.style.fontSize = 'var(--font-size-sm)';
            if (welcomeUser) welcomeUser.style.fontSize = 'var(--font-size-sm)';
        } else {
            // Set consistent font sizes
            dateTimeElement.style.fontSize = 'var(--font-size-lg)';
            if (welcomeUser) welcomeUser.style.fontSize = 'var(--font-size-lg)';
        }
    }
}

function clearClassificationResults() {
    const outputDiv = document.getElementById('output');
    if (outputDiv) {
        outputDiv.innerHTML = '';
    }
}

function clearUserSession() {
    currentUser = null;
    const welcomeElement = document.getElementById('welcomeUser');
    if (welcomeElement) welcomeElement.textContent = '';
    
    clearAllFileInputs();
    
    const dropdown = document.getElementById('settingsDropdown');
    if (dropdown) dropdown.style.display = 'none';
}

function clearAllFileInputs() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.value = '';
    });
    
    const statusElements = document.querySelectorAll('[id$="Status"]');
    statusElements.forEach(element => {
        element.innerHTML = 'No file selected';
        element.style.color = '#666';
    });
}

function clearResetForm() {
    document.getElementById('resetUsername').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

// Add this function to Main_app.js to close modal on generate
function generateDashboardAndCloseModal() {
    generateAccurateDashboard();
    closeKycUploadModal();
}


// Make functions globally available
window.closeKycUploadModal = closeKycUploadModal;
window.closeEkycUploadModal = closeEkycUploadModal;
window.openProfilePopup = openProfilePopup;
window.closeProfilePopup = closeProfilePopup;
window.openChangePasswordPopup = openChangePasswordPopup;
window.closeChangePasswordPopup = closeChangePasswordPopup;
window.openChangeProfilePicPopup = openChangeProfilePicPopup;
window.closeChangeProfilePicPopup = closeChangeProfilePicPopup;
window.updatePassword = updatePassword;
window.handlePhotoUpload = handlePhotoUpload;
window.deleteProfilePhoto = deleteProfilePhoto;
window.handleLogout = handleLogout;
window.toggleSidebar = toggleSidebar;
window.autoAdjustDateTimeSize = autoAdjustDateTimeSize;