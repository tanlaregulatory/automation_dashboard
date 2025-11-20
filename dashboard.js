// Global data storage
let exactDashboardData = {
    entities: [],
    tmEntities: [],
    tms: [],
    refunds: []
};

// ===== FINANCIAL YEAR LOGIC (From EKYC Summary) =====
function getFinancialYear(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    
    if (month >= 4) { // April to March
        return `${year}-${year + 1}`;
    } else {
        return `${year - 1}-${year}`;
    }
}

function getMonthName(date) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[date.getMonth()];
}

// ADDED: Format month key to display name
function formatExactMonth(monthKey) {
    if (!monthKey) return 'Unknown Month';
    
    try {
        const [year, month] = monthKey.split('-');
        const monthNum = parseInt(month, 10);
        
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        if (monthNum >= 1 && monthNum <= 12) {
            return `${monthNames[monthNum - 1]} ${year}`;
        } else {
            return `${monthKey}`;
        }
    } catch (error) {
        console.error('Error formatting month:', error);
        return `${monthKey}`;
    }
}

function getCurrentFinancialYearMonths() {
    const currentDate = new Date();
    const currentFY = getFinancialYear(currentDate);
    
    // Get months from April to March for current financial year
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const currentMonthIndex = currentDate.getMonth(); // 0-11
    
    // Determine which months to show based on current date
    let monthsToShow = [];
    if (currentDate.getMonth() >= 3) { // April or later
        // Show from April to current month
        monthsToShow = months.slice(0, currentMonthIndex - 2); 
    } else {
        // Show from April to March (full year)
        monthsToShow = months;
    }
    
    return monthsToShow;
}

// Function to show error popup
function showErrorPopup(message, duration = 5000) {
    // Remove existing error popups
    const existingPopups = document.querySelectorAll('.error-popup');
    existingPopups.forEach(popup => popup.remove());
    
    // Create error popup
    const errorPopup = document.createElement('div');
    errorPopup.className = 'error-popup';
    errorPopup.innerHTML = `
        <div class="error-content">
            <span class="error-icon">⚠️</span>
            <span class="error-message">${message}</span>
            <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(errorPopup);
    
    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (errorPopup.parentElement) {
                errorPopup.classList.add('fade-out');
                setTimeout(() => {
                    if (errorPopup.parentElement) {
                        errorPopup.remove();
                    }
                }, 300);
            }
        }, duration);
    }
    
    return errorPopup;
}

// ===== FILE VALIDATION =====
function validateUploadedFiles() {
    const fileInputs = [
        { id: 'entitiesFileInput', name: 'Entities' },
        { id: 'tmEntitiesFileInput', name: 'TM-Entities' },
        { id: 'tmsFileInput', name: 'TMS' },
        { id: 'refundsFileInput', name: 'Refunds' }
    ];

    let hasErrors = false;

    fileInputs.forEach(fileInput => {
        const input = document.getElementById(fileInput.id);
        const status = document.getElementById(fileInput.id.replace('FileInput', 'Status'));

        if (input && input.files.length > 0) {
            const file = input.files[0];
            const fileName = file.name.toLowerCase();

            // Allowed extensions
            const validExtensions = ['.xlsx', '.xls', '.csv'];
            const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

            if (!validExtensions.includes(fileExtension)) {
                showErrorPopup(`❌ Invalid file type for ${fileInput.name}. Please upload XLSX, XLS, or CSV.`);
                input.value = '';
                status.innerHTML = '❌ Invalid file type';
                status.style.color = '#e74c3c';
                hasErrors = true;
                return;
            }

            if (file.size === 0) {
                showErrorPopup(`❌ Empty file detected for ${fileInput.name}. Please upload a valid file.`);
                input.value = '';
                status.innerHTML = '❌ Empty file';
                status.style.color = '#e74c3c';
                hasErrors = true;
                return;
            }

            // If valid
            status.innerHTML = `✅ ${file.name}`;
            status.style.color = '#27ae60';
        } else if (status) {
            status.innerHTML = 'No file selected';
            status.style.color = '#666';
        }
    });

    // ✅ Control generate button here
    const generateBtn = document.getElementById('generateDashboardBtn');
    const instructions = document.getElementById('uploadInstructions');

    if (hasErrors) {
        generateBtn.disabled = true;
        generateBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        instructions.innerHTML = '❌ Fix file errors before generating dashboard';
        instructions.style.color = '#e74c3c';
        return false;
    } else {
        checkFilesUploaded(); // only if no errors
        return true;
    }
}

// ===== SETUP FILE LISTENERS =====
function setupFileUploadListeners() {
    const fileInputs = ['entitiesFileInput', 'tmEntitiesFileInput', 'tmsFileInput', 'refundsFileInput'];
    const statusDivs = ['entitiesStatus', 'tmEntitiesStatus', 'tmsStatus', 'refundsStatus'];
    
    fileInputs.forEach((inputId, index) => {
        const input = document.getElementById(inputId);
        const status = document.getElementById(statusDivs[index]);
        
        if (input && status) {
            input.addEventListener('change', function() {
                if (this.files.length > 0) {
                    // Validate the file
                    validateUploadedFiles();
                } else {
                    status.innerHTML = 'No file selected';
                    status.style.color = '#666';
                }
                
                checkFilesUploaded();
            });
        }
    });
}

// Enhanced file processing with error handling
function processExactFile(file, type) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                let workbook, jsonData;
                
                if (file.name.endsWith('.csv')) {
                    const csvData = e.target.result;
                    // Basic CSV validation
                    if (!csvData || csvData.trim().length === 0) {
                        throw new Error('CSV file appears to be empty or invalid');
                    }
                    
                    workbook = XLSX.read(csvData, { type: 'string' });
                } else {
                    const data = new Uint8Array(e.target.result);
                    workbook = XLSX.read(data, { type: 'array' });
                }
                
                // Check if workbook has sheets
                if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                    throw new Error('No sheets found in the Excel file');
                }
                
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                jsonData = XLSX.utils.sheet_to_json(sheet);
                
                // Check if data is empty
                if (jsonData.length === 0) {
                    throw new Error('No data found in the first sheet');
                }
                
                console.log(`📁 ${type}: ${jsonData.length} raw records loaded`);
                
                // Process with APPROVED ON DATE logic
                const processedData = processApprovedOnDateData(jsonData, type);
                console.log(`✅ ${type}: ${processedData.length} records processed`);
                
                resolve({ type, data: processedData });
                
            } catch (error) {
                // Show error popup for file processing errors
                showErrorPopup(`❌ Error processing ${type} file: ${error.message}`);
                reject(new Error(`Error processing ${type}: ${error.message}`));
            }
        };
        
        reader.onerror = () => {
            showErrorPopup(`❌ Failed to read ${type} file. The file may be corrupted.`);
            reject(new Error(`Failed to read ${type} file`));
        };
        
        // Set timeout for file reading
        const timeout = setTimeout(() => {
            showErrorPopup(`❌ Timeout reading ${type} file. The file may be too large or corrupted.`);
            reject(new Error(`Timeout reading ${type} file`));
        }, 30000); // 30 second timeout
        
        reader.onloadend = () => clearTimeout(timeout);
        
        if (file.name.endsWith('.csv')) {
            reader.readAsText(file, 'utf-8');
        } else {
            reader.readAsArrayBuffer(file);
        }
    });
}

// Main dashboard function with APPROVED ON DATE logic
function generateAccurateDashboard() {
    console.log('🚀 Generating dashboard with APPROVED ON DATE logic...');
    
    const output = document.getElementById('dashboardOutput');
    const entitiesFile = document.getElementById('entitiesFileInput')?.files[0];
    const tmEntitiesFile = document.getElementById('tmEntitiesFileInput')?.files[0]; 
    const tmsFile = document.getElementById('tmsFileInput')?.files[0];
    const refundsFile = document.getElementById('refundsFileInput')?.files[0];

    if (!entitiesFile && !tmEntitiesFile && !tmsFile) {
        output.innerHTML = `
            <div style="padding: 10px; background: #ffebee; color: #c62828; border-radius: 4px; margin: 10px 0; text-align: center; font-size: 0.6rem;">
                ⚠️ Please upload your CSV files to generate the dashboard!
            </div>`;
        return;
    }

    // Show SIMPLE loading text (no spinner)
    output.innerHTML = `
        <div class="simple-loading">
            Generating Dashboard...
        </div>`;

    // Close the modal when generate button is clicked
    closeKycUploadModal();

    const filePromises = [];

    // Process files with APPROVED ON DATE logic
    if (entitiesFile) filePromises.push(processExactFile(entitiesFile, 'entities'));
    if (tmEntitiesFile) filePromises.push(processExactFile(tmEntitiesFile, 'tmEntities'));
    if (tmsFile) filePromises.push(processExactFile(tmsFile, 'tms'));
    if (refundsFile) filePromises.push(processExactFile(refundsFile, 'refunds'));

    Promise.all(filePromises)
        .then(results => {
            // Store data
            exactDashboardData = { entities: [], tmEntities: [], tms: [], refunds: [] };
            
            results.forEach(result => {
                exactDashboardData[result.type] = result.data;
                console.log(`✅ ${result.type}: ${result.data.length} records`);
            });

            // Generate dashboard with APPROVED ON DATE logic
            generateExactDashboard(output);
        })
        .catch(error => {
            output.innerHTML = `
                <div style="padding: 10px; background: #ffebee; color: #c62828; border-radius: 4px; margin: 10px 0; text-align: center; font-size: 0.6rem;">
                    ❌ Error: ${error.message}
                </div>`;
            console.error('Error:', error);
        });
}

// Process data with APPROVED ON DATE logic
function processApprovedOnDateData(rawData, entityType) {
    console.log(`🔧 Processing ${entityType} with APPROVED ON DATE logic...`);
    
    const processedRecords = [];
    const seenIds = new Set();
    const currentYear = (new Date()).getFullYear();
    
    rawData.forEach((row, index) => {
        try {
            if (!row || Object.keys(row).length === 0) return;
            
            // Extract Registration ID with proper cleaning
            let registrationId = row['Registration ID'] || row['Temp ID'] || row['TempID'];
            if (!registrationId) return;
            
            // Clean Registration ID
            registrationId = registrationId.toString().replace(/['"]/g, '');
            if (registrationId.includes('e+')) {
                registrationId = parseFloat(registrationId).toFixed(0);
            }
            
            // Skip duplicates
            if (seenIds.has(registrationId)) {
                return;
            }
            seenIds.add(registrationId);
            
            let record = {
                registrationId: registrationId,
                rawData: row
            };
            
            if (entityType === 'refunds') {
                // REFUND LOGIC with Refund Initiated Date
                const refundDateStr = row['Refund Initiated Date'];
                if (refundDateStr) {
                    const refundDate = parseExactDate(refundDateStr);
                    if (refundDate && refundDate.getFullYear() === currentYear) {
                        record.refundDate = refundDate;
                        record.month = refundDate.getMonth() + 1;
                        record.monthKey = `${currentYear}-${String(record.month).padStart(2, '0')}`;
                        record.dateKey = formatDateKey(refundDate);
                        processedRecords.push(record);
                    }
                }
            } else {
                // For entities/TM/TMS: APPROVED ON DATE logic
                const submissionDateStr = row['Application Submitted Date'];
                const approvalDateStr = row['Approved On'];
                const status = row['Status'] ? row['Status'].toString().trim() : '';
                
                // SUBMISSION DATE processing (for Recv, Pend columns)
                if (submissionDateStr) {
                    const submissionDate = parseExactDate(submissionDateStr);
                    if (submissionDate && submissionDate.getFullYear() === currentYear) {
                        record.submissionDate = submissionDate;
                        record.submissionMonth = submissionDate.getMonth() + 1;
                        record.submissionMonthKey = `${currentYear}-${String(record.submissionMonth).padStart(2, '0')}`;
                        record.submissionDateKey = formatDateKey(submissionDate);
                    }
                }
                
                // APPROVAL DATE processing (for Total Appr columns)
                if (approvalDateStr) {
                    const approvalDate = parseExactDate(approvalDateStr);
                    if (approvalDate && approvalDate.getFullYear() === currentYear) {
                        record.approvalDate = approvalDate;
                        record.approvalMonth = approvalDate.getMonth() + 1;
                        record.approvalMonthKey = `${currentYear}-${String(record.approvalMonth).padStart(2, '0')}`;
                        record.approvalDateKey = formatDateKey(approvalDate);
                        
                        // Calculate 24-hour timing only if we have both dates
                        if (record.submissionDate) {
                            const timeDiffMs = approvalDate.getTime() - record.submissionDate.getTime();
                            record.hoursDiff = timeDiffMs / (1000 * 60 * 60);
                            record.within24hrs = record.hoursDiff <= 24;
                            record.after24hrs = record.hoursDiff > 24;
                        }
                    }
                }
                
                record.status = status;
                
                // STATUS CLASSIFICATION
                if (status === 'Approved') {
                    record.isCurrentlyApproved = true;
                    record.isCurrentlyPending = false;
                } else if (status === 'Approval Pending' || status === 'Resubmitted') {
                    record.isCurrentlyApproved = false;
                    record.isCurrentlyPending = true;
                } else {
                    record.isCurrentlyApproved = false;
                    record.isCurrentlyPending = false;
                }
                
                processedRecords.push(record);
            }
            
        } catch (error) {
            console.warn(`⚠️ Error processing row ${index}: ${error.message}`);
        }
    });
    
    console.log(`✅ ${entityType}: ${processedRecords.length} records processed`);
    return processedRecords;
}

// Parse dates correctly
function parseExactDate(dateStr) {
    if (!dateStr) return null;
    
    if (dateStr instanceof Date) return dateStr;
    
    // Handle Excel serial numbers
    if (typeof dateStr === 'number' && dateStr > 25000 && dateStr < 50000) {
        const excelEpoch = new Date(1900, 0, 1);
        return new Date(excelEpoch.getTime() + (dateStr - 2) * 24 * 60 * 60 * 1000);
    }
    
    const str = dateStr.toString().trim();
    if (!str) return null;
    
    // Try parsing methods
    const attempts = [
        // DD-MM-YYYY HH:MM format
        () => {
            const match = str.match(/(\d{1,2})-(\d{1,2})-(\d{4})\s*(\d{1,2}):(\d{1,2})/);
            if (match) {
                return new Date(match[3], match[2] - 1, match[1], match[4], match[5]);
            }
            return null;
        },
        // DD-MM-YYYY format
        () => {
            const match = str.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
            if (match) {
                return new Date(match[3], match[2] - 1, match[1]);
            }
            return null;
        },
        // Direct parsing
        () => new Date(str)
    ];
    
    for (const attempt of attempts) {
        try {
            const date = attempt();
            if (date && !isNaN(date.getTime()) && date.getFullYear() > 1900) {
                return date;
            }
        } catch (e) {
            continue;
        }
    }
    
    return null;
}

// Format date as YYYY-MM-DD
function formatDateKey(date) {
    if (!date || !(date instanceof Date)) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Format date as DD-MM-YYYY for display
function formatDateDDMMYYYY(date) {
    if (!date || !(date instanceof Date)) return '';
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
}

// ===== UPDATED STATISTICS CALCULATION WITH FINANCIAL YEAR =====
function calculateExactStatistics() {
    console.log('🔢 Calculating statistics with FINANCIAL YEAR logic...');
    
    const currentFY = getFinancialYear(new Date());
    const stats = {
        monthlyStats: new Map(),
        approvalsByMonth: new Map(),
        grandTotals: {
            entities: { received: 0, within24hrs: 0, after24hrs: 0, pending: 0, approvedBySubmission: 0, approvedByApproval: 0 },
            tmEntities: { received: 0, within24hrs: 0, after24hrs: 0, pending: 0, approvedBySubmission: 0, approvedByApproval: 0 },
            tms: { received: 0, within24hrs: 0, after24hrs: 0, pending: 0, approvedBySubmission: 0, approvedByApproval: 0 }
        },
        refundsByMonth: new Map(),
        totalRefunds: 0
    };

    // Process entities, TM-entities, TMS with FINANCIAL YEAR logic
    ['entities', 'tmEntities', 'tms'].forEach(entityType => {
        const data = exactDashboardData[entityType] || [];
        console.log(`📊 Processing ${entityType}: ${data.length} records`);
        
        data.forEach(record => {
            // Only process records from current financial year
            if (record.submissionDate && getFinancialYear(record.submissionDate) === currentFY) {
                const monthKey = record.submissionMonthKey;
                
                // Initialize month entry
                if (!stats.monthlyStats.has(monthKey)) {
                    stats.monthlyStats.set(monthKey, {
                        entities: { received: 0, within24hrs: 0, after24hrs: 0, pending: 0, approvedBySubmission: 0, approvedByApproval: 0 },
                        tmEntities: { received: 0, within24hrs: 0, after24hrs: 0, pending: 0, approvedBySubmission: 0, approvedByApproval: 0 },
                        tms: { received: 0, within24hrs: 0, after24hrs: 0, pending: 0, approvedBySubmission: 0, approvedByApproval: 0 }
                    });
                }
                
                // Count received (by submission month) - ALWAYS count this
                stats.monthlyStats.get(monthKey)[entityType].received++;
                stats.grandTotals[entityType].received++;
                
                // Count pending (by submission date)
                if (record.isCurrentlyPending) {
                    stats.monthlyStats.get(monthKey)[entityType].pending++;
                    stats.grandTotals[entityType].pending++;
                }
                
                // Count 24-hour timing (by submission date)
                if (record.isCurrentlyApproved) {
                    if (record.within24hrs) {
                        stats.monthlyStats.get(monthKey)[entityType].within24hrs++;
                        stats.grandTotals[entityType].within24hrs++;
                    }
                    if (record.after24hrs) {
                        stats.monthlyStats.get(monthKey)[entityType].after24hrs++;
                        stats.grandTotals[entityType].after24hrs++;
                    }
                    
                    // Count approved by submission date (old logic)
                    stats.monthlyStats.get(monthKey)[entityType].approvedBySubmission++;
                    stats.grandTotals[entityType].approvedBySubmission++;
                }
            }
            
            // COUNT BY APPROVAL DATE (for Total Appr columns)
            if (record.approvalMonthKey && record.approvalDate && 
                getFinancialYear(record.approvalDate) === currentFY && 
                record.isCurrentlyApproved) {
                const approvalMonthKey = record.approvalMonthKey;
                
                // Initialize approval month entry
                if (!stats.approvalsByMonth.has(approvalMonthKey)) {
                    stats.approvalsByMonth.set(approvalMonthKey, {
                        entities: 0,
                        tmEntities: 0,
                        tms: 0
                    });
                }
                
                // Count approved by approval date
                stats.approvalsByMonth.get(approvalMonthKey)[entityType]++;
                stats.grandTotals[entityType].approvedByApproval++;
            }
        });
    });

    // Process refunds with Refund Initiated Date (Current FY only)
    const refundsData = exactDashboardData.refunds || [];
    console.log(`💰 Processing refunds: ${refundsData.length} records`);
    
    refundsData.forEach(refund => {
        if (refund.monthKey && refund.refundDate && getFinancialYear(refund.refundDate) === currentFY) {
            const count = stats.refundsByMonth.get(refund.monthKey) || 0;
            stats.refundsByMonth.set(refund.monthKey, count + 1);
            stats.totalRefunds++;
        }
    });

    return stats;
}

// Helper function to format zero as dash
function formatZeroAsDash(value) {
    return value === 0 ? '-' : value.toString();
}

// ===== UPDATED SUMMARY GENERATION =====
function generateExactSummary(stats) {
    const totalReceived = stats.grandTotals.entities.received + 
                         stats.grandTotals.tmEntities.received + 
                         stats.grandTotals.tms.received;
    
    const totalApprovedByApproval = stats.grandTotals.entities.approvedByApproval + 
                                   stats.grandTotals.tmEntities.approvedByApproval + 
                                   stats.grandTotals.tms.approvedByApproval;
    
    const totalPending = stats.grandTotals.entities.pending + 
                        stats.grandTotals.tmEntities.pending + 
                        stats.grandTotals.tms.pending;
    
    const approvalRate = totalReceived > 0 ? ((totalApprovedByApproval / totalReceived) * 100).toFixed(1) : '0.0';
    
    return `
        <div class="summary-box">
            <div class="summary-card">
                <div class="summary-number">${formatZeroAsDash(totalReceived)}</div>
                <div class="summary-label" style="font-weight: 800 !important;">Total Reg</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${formatZeroAsDash(totalApprovedByApproval)}</div>
                <div class="summary-label" style="font-weight: 800 !important;">Total Appr</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${formatZeroAsDash(totalPending)}</div>
                <div class="summary-label" style="font-weight: 800 !important;">Total Pend</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${formatZeroAsDash(stats.totalRefunds)}</div>
                <div class="summary-label" style="font-weight: 800 !important;">Refunded</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${approvalRate}%</div>
                <div class="summary-label">Approval Rate</div>
            </div>
        </div>`;   
}

// ===== UPDATED TABLE GENERATION WITH FINANCIAL YEAR =====
function generateExactTable(stats) {
    const currentFY = getFinancialYear(new Date());
    
    return `
        <div class="dashboard-table-container">
            <h3 style="text-align: center; color: black; margin: 4px 0; padding: 12px; background: #7fdad2; border-radius: 8px; font-size: 1.3rem; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #6bc9c1;">
                📊 EKYC Dashboard Report- Financial Year status
            </h3>
            <table id="exactTable" class="dashboard-table">
                <thead>
                    <tr>
                        <th rowspan="2" style="padding: 4px 6px; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important;">Month</th>
                        <th colspan="5" style="padding: 4px 6px; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important;">Entities</th>
                        <th colspan="5" style="padding: 4px 6px; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important;">TM-Entities</th>
                        <th colspan="5" style="padding: 4px 6px; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important;">TMS</th>
                        <th rowspan="2" style="padding: 4px 6px; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important; font-weight: 800 !important;">Total Reg</th>
                        <th rowspan="2" style="padding: 4px 6px; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important; font-weight: 800 !important;">Total Pend</th>
                        <th rowspan="2" style="padding: 4px 6px; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important; font-weight: 800 !important;">Refunded</th>
                        <th rowspan="2" style="padding: 4px 6px; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important; font-weight: 800 !important;">Total Appr</th>
                    </tr>
                    <tr>
                        ${Array(3).fill().map(() => 
                            `<th style="padding: 3px 4px; font-size: 0.65rem; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important;">Recv</th>
                            <th style="padding: 3px 4px; font-size: 0.65rem; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important;">W24h</th>
                            <th style="padding: 3px 4px; font-size: 0.65rem; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important;">A24h</th>
                            <th style="padding: 3px 4px; font-size: 0.65rem; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important;">Pend</th>
                            <th style="padding: 3px 4px; font-size: 0.65rem; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important;" class="total-cell">Total Appr</th>`
                        ).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${generateExactTableBody(stats)}
                </tbody>
            </table>
        </div>`;
}

// ===== UPDATED TABLE BODY WITH FINANCIAL YEAR MONTHS =====
function generateExactTableBody(stats) {
    let html = '';
    
    // Get financial year months in order (Apr to Mar)
    const fyMonths = getCurrentFinancialYearMonths();
    const currentFY = getFinancialYear(new Date());
    
    // Generate monthly summaries for FY months only
    fyMonths.forEach((monthName, index) => {
        // Convert month name to month key (e.g., "Apr" -> "2024-04")
        const monthNum = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthName) + 1;
        let year = currentFY.split('-')[0];
        if (monthNum >= 4) {
            year = currentFY.split('-')[0]; // Apr-Dec use first year
        } else {
            year = currentFY.split('-')[1]; // Jan-Mar use second year
        }
        const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`;
        
        const monthData = stats.monthlyStats.get(monthKey) || {
            entities: { received: 0, within24hrs: 0, after24hrs: 0, pending: 0, approvedBySubmission: 0, approvedByApproval: 0 },
            tmEntities: { received: 0, within24hrs: 0, after24hrs: 0, pending: 0, approvedBySubmission: 0, approvedByApproval: 0 },
            tms: { received: 0, within24hrs: 0, after24hrs: 0, pending: 0, approvedBySubmission: 0, approvedByApproval: 0 }
        };
        
        const approvalData = stats.approvalsByMonth.get(monthKey) || { entities: 0, tmEntities: 0, tms: 0 };
        const refunds = stats.refundsByMonth.get(monthKey) || 0;
        
        const entities = monthData.entities;
        const tmEntities = monthData.tmEntities; 
        const tms = monthData.tms;
        
        const totalReceived = entities.received + tmEntities.received + tms.received;
        const totalPending = entities.pending + tmEntities.pending + tms.pending;
        const totalApprovedByApproval = approvalData.entities + approvalData.tmEntities + approvalData.tms;

        // Alternate row colors like EKYC summary
        const rowColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
        
        html += `
            <tr style="background: ${rowColor};">
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${monthName}</td>
                
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(entities.received)}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(entities.within24hrs)}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(entities.after24hrs)}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(entities.pending)}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 800; background: #f8f9fa;" class="total-cell">${formatZeroAsDash(approvalData.entities)}</td>
                
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(tmEntities.received)}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(tmEntities.within24hrs)}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(tmEntities.after24hrs)}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(tmEntities.pending)}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 800; background: #f8f9fa;" class="total-cell">${formatZeroAsDash(approvalData.tmEntities)}</td>
                
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(tms.received)}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(tms.within24hrs)}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(tms.after24hrs)}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(tms.pending)}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 800; background: #f8f9fa;" class="total-cell">${formatZeroAsDash(approvalData.tms)}</td>
                
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(totalReceived)}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(totalPending)}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(refunds)}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 800; background: #f8f9fa;" class="total-cell">${formatZeroAsDash(totalApprovedByApproval)}</td>
            </tr>`;
    });
    
    // Grand total row - MATCHING EKYC SUMMARY STYLE
    const grandTotalReceived = stats.grandTotals.entities.received + stats.grandTotals.tmEntities.received + stats.grandTotals.tms.received;
    const grandTotalPending = stats.grandTotals.entities.pending + stats.grandTotals.tmEntities.pending + stats.grandTotals.tms.pending;
    const grandTotalApprovedByApproval = stats.grandTotals.entities.approvedByApproval + stats.grandTotals.tmEntities.approvedByApproval + stats.grandTotals.tms.approvedByApproval;
    
    html += `
        <tr class="total-row">
            <td style="padding: 3px 4px; text-align: center; font-weight: 800;">Total</td>
            
            <td style="padding: 3px 4px; text-align: center; font-weight: 800;">${formatZeroAsDash(stats.grandTotals.entities.received)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 800;">${formatZeroAsDash(stats.grandTotals.entities.within24hrs)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 800;">${formatZeroAsDash(stats.grandTotals.entities.after24hrs)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 800;">${formatZeroAsDash(stats.grandTotals.entities.pending)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 800; background: #f8f9fa;" class="total-cell">${formatZeroAsDash(stats.grandTotals.entities.approvedByApproval)}</td>
            
            <td style="padding: 3px 4px; text-align: center; font-weight: 800;">${formatZeroAsDash(stats.grandTotals.tmEntities.received)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 800;">${formatZeroAsDash(stats.grandTotals.tmEntities.within24hrs)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 800;">${formatZeroAsDash(stats.grandTotals.tmEntities.after24hrs)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 800;">${formatZeroAsDash(stats.grandTotals.tmEntities.pending)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 800; background: #f8f9fa;" class="total-cell">${formatZeroAsDash(stats.grandTotals.tmEntities.approvedByApproval)}</td>
            
            <td style="padding: 3px 4px; text-align: center; font-weight: 800;">${formatZeroAsDash(stats.grandTotals.tms.received)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 800;">${formatZeroAsDash(stats.grandTotals.tms.within24hrs)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 800;">${formatZeroAsDash(stats.grandTotals.tms.after24hrs)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 800;">${formatZeroAsDash(stats.grandTotals.tms.pending)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 800; background: #f8f9fa;" class="total-cell">${formatZeroAsDash(stats.grandTotals.tms.approvedByApproval)}</td>
            
            <td style="padding: 3px 4px; text-align: center; font-weight: 800;">${formatZeroAsDash(grandTotalReceived)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 800;">${formatZeroAsDash(grandTotalPending)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 800;">${formatZeroAsDash(stats.totalRefunds)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 800; background: #f8f9fa;" class="total-cell">${formatZeroAsDash(grandTotalApprovedByApproval)}</td>
        </tr>`;
    
    return html;
}

// ===== UPDATED DAILY BREAKDOWN WITH CURRENT MONTH ONLY =====
function calculateDailyStatistics() {
    console.log('📅 Calculating daily breakdown for CURRENT MONTH only...');

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const currentDay = currentDate.getDate();
    
    // Only show current month (no future dates)
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    const dailyStats = {
        entities: new Map(),
        tmEntities: new Map(),
        tms: new Map(),
        approvalsByDay: new Map()
    };

    // Process each entity type for daily counts (CURRENT MONTH ONLY)
    ['entities', 'tmEntities', 'tms'].forEach(entityType => {
        const data = exactDashboardData[entityType] || [];

        data.forEach(record => {
            // Only process records from current month
            if (record.submissionDateKey && record.submissionMonthKey === currentMonthKey) {
                const dateKey = record.submissionDateKey;
                const dayNum = parseInt(dateKey.split('-')[2], 10);
                
                // Only include past days, no current or future dates (day-1)
                if (dayNum < currentDay) {
                    // Initialize day entry if not exists
                    if (!dailyStats[entityType].has(dateKey)) {
                        dailyStats[entityType].set(dateKey, {
                            received: 0,
                            within24hrs: 0,
                            after24hrs: 0,
                            pending: 0
                        });
                    }

                    const dayData = dailyStats[entityType].get(dateKey);

                    // Count received (by submission date)
                    dayData.received++;

                    // Count pending (by submission date)
                    if (record.isCurrentlyPending) {
                        dayData.pending++;
                    }

                    // Count 24-hour timing (by submission date)
                    if (record.isCurrentlyApproved) {
                        if (record.within24hrs) dayData.within24hrs++;
                        if (record.after24hrs) dayData.after24hrs++;
                    }
                }
            }

            // COUNT BY APPROVAL DATE (for Total Appr columns) - CURRENT MONTH ONLY
            if (record.approvalDateKey && record.approvalMonthKey === currentMonthKey && 
                record.isCurrentlyApproved) {
                const approvalDateKey = record.approvalDateKey;
                const dayNum = parseInt(approvalDateKey.split('-')[2], 10);
                
                // Only include past days, no current or future dates (day-1)
                if (dayNum < currentDay) {
                    // Initialize approval day entry if not exists
                    if (!dailyStats.approvalsByDay.has(approvalDateKey)) {
                        dailyStats.approvalsByDay.set(approvalDateKey, {
                            entities: 0,
                            tmEntities: 0,
                            tms: 0
                        });
                    }

                    // Count approved by approval date
                    dailyStats.approvalsByDay.get(approvalDateKey)[entityType]++;
                }
            }
        });
    });

    // Create entries for all days up to day-1 (even if no data)
    for (let d = 1; d < currentDay; d++) {
        const dd = String(d).padStart(2, '0');
        const dateKey = `${currentMonthKey}-${dd}`;
        
        ['entities','tmEntities','tms'].forEach(type => {
            if (!dailyStats[type].has(dateKey)) {
                dailyStats[type].set(dateKey, {
                    received: 0,
                    within24hrs: 0,
                    after24hrs: 0,
                    pending: 0
                });
            }
        });
        
        // Ensure approval entries exist
        if (!dailyStats.approvalsByDay.has(dateKey)) {
            dailyStats.approvalsByDay.set(dateKey, {
                entities: 0,
                tmEntities: 0,
                tms: 0
            });
        }
    }

    console.log('✅ Daily breakdown calculated for current month only (day-1 data)');
    return { dailyStats, currentMonth: currentMonthKey };
}

// Updated daily breakdown to show "-" for zeros
function generateDailyBreakdown(stats) {
    const { dailyStats, currentMonth } = calculateDailyStatistics();

    const allDates = new Set();
    ['entities','tmEntities','tms'].forEach(type => {
        dailyStats[type].forEach((v,dateKey) => {
            if (dateKey && dateKey.startsWith(currentMonth)) allDates.add(dateKey);
        });
    });

    const sortedDates = Array.from(allDates).sort((a,b) => new Date(a) - new Date(b));

   if (sortedDates.length === 0) {
        return `<div style="margin: 8px 0; padding: 8px; background: #fff3cd; border-radius: 4px; border: 1px solid #ffeaa7; font-size: 0.6rem;">
            No daily data available for current month (${getMonthName(new Date())}).
        </div>`;
    }

     let html = `
<div class="dashboard-table-container" style="margin-top: 8px;">
    <h3 style="text-align: center; color: black; margin: 4px 0; padding: 12px; background: #7fdad2; border-radius: 8px; font-size: 1.3rem; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #6bc9c1;">
        📊 Daily Breakdown - ${formatExactMonth(currentMonth)}
    </h3>
    <table class="dashboard-table">
                <thead>
            <tr>
                <th rowspan="2" style="padding: 4px 6px; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important;">Date</th>
                <th colspan="5" style="padding: 4px 6px; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important;">Entities</th>
                <th colspan="5" style="padding: 4px 6px; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important;">TM-Entities</th>
                <th colspan="5" style="padding: 4px 6px; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important;">TMS</th>
                <th rowspan="2" style="padding: 4px 6px; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important; font-weight: 800 !important;">Total Reg</th>
                <th rowspan="2" style="padding: 4px 6px; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important; font-weight: 800 !important;">Total Pend</th>
                <th rowspan="2" style="padding: 4px 6px; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important; font-weight: 800 !important;">Refunded</th>
                <th rowspan="2" style="padding: 4px 6px; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important; font-weight: 800 !important;">Total Appr</th>
            </tr>
            <tr>
                ${Array(3).fill().map(() => 
                    `<th style="padding: 3px 4px; font-size: 0.65rem; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important;">Recv</th>
                     <th style="padding: 3px 4px; font-size: 0.65rem; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important;">W24h</th>
                     <th style="padding: 3px 4px; font-size: 0.65rem; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important;">A24h</th>
                     <th style="padding: 3px 4px; font-size: 0.65rem; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important;">Pend</th>
                     <th style="padding: 3px 4px; font-size: 0.65rem; background: #7fdad2 !important; color: #000000 !important; border: 1px solid #6bc9c1 !important;" class="total-cell">Total Appr</th>`).join('')}
            </tr>
        </thead>
        <tbody>`;

sortedDates.forEach((date, index) => {
    const entitiesData = dailyStats.entities.get(date) || { received: 0, within24hrs: 0, after24hrs: 0, pending: 0 };
    const tmEntitiesData = dailyStats.tmEntities.get(date) || { received: 0, within24hrs: 0, after24hrs: 0, pending: 0 };
    const tmsData = dailyStats.tms.get(date) || { received: 0, within24hrs: 0, after24hrs: 0, pending: 0 };
    const approvalData = dailyStats.approvalsByDay.get(date) || { entities: 0, tmEntities: 0, tms: 0 };

    const totalReceived = entitiesData.received + tmEntitiesData.received + tmsData.received;
    const totalPending = entitiesData.pending + tmEntitiesData.pending + tmsData.pending;
    const totalApprovedByApproval = approvalData.entities + approvalData.tmEntities + approvalData.tms;

    const dateObj = new Date(date);
    const formattedDate = formatDateDDMMYYYY(dateObj);

    // Alternate between grey and white for rows
    const rowColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';

    html += `
        <tr style="background: ${rowColor};">
            <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formattedDate}</td>

            <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(entitiesData.received)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(entitiesData.within24hrs)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(entitiesData.after24hrs)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(entitiesData.pending)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 800; background: #f8f9fa;" class="total-cell">${formatZeroAsDash(approvalData.entities)}</td>

            <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(tmEntitiesData.received)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(tmEntitiesData.within24hrs)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(tmEntitiesData.after24hrs)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(tmEntitiesData.pending)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 800; background: #f8f9fa;" class="total-cell">${formatZeroAsDash(approvalData.tmEntities)}</td>

            <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(tmsData.received)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(tmsData.within24hrs)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(tmsData.after24hrs)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(tmsData.pending)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 800; background: #f8f9fa;" class="total-cell">${formatZeroAsDash(approvalData.tms)}</td>

            <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(totalReceived)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${formatZeroAsDash(totalPending)}</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 700;">-</td>
            <td style="padding: 3px 4px; text-align: center; font-weight: 800; background: #f8f9fa;" class="total-cell">${formatZeroAsDash(totalApprovedByApproval)}</td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    return html;
}

// Generate dashboard with APPROVED ON DATE logic
function generateExactDashboard(output) {
    const stats = calculateExactStatistics();
    
    const dashboardHTML = `
        <div style="margin-top: 20px;">
            ${generateExactSummary(stats)}
            ${generateExactTable(stats)}
            ${generateDailyBreakdown(stats)}
        </div>`;
    
    output.innerHTML = dashboardHTML;

    // Store for export
    window.exactDashboardStats = stats;
    
    // Show the external controls with centered layout
    showDashboardControls();
}

// Get current month from data
function getCurrentMonthFromData() {
    const stats = calculateExactStatistics();
    let allMonths = Array.from(stats.monthlyStats.keys()).sort();

    if (allMonths.length === 0) {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    }

    const now = new Date();
    const systemMonthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    allMonths = allMonths.filter(mk => mk <= systemMonthKey);

    if (allMonths.length === 0) {
        const origMonths = Array.from(stats.monthlyStats.keys()).sort();
        return origMonths[origMonths.length - 1] || systemMonthKey;
    }

    return allMonths[allMonths.length - 1];
}

// Copy dashboard to clipboard
function copyDashboardToClipboard() {
    const dashboardElement = document.getElementById('dashboardOutput');
    
    // Use higher scale and quality settings
    html2canvas(dashboardElement, {
        scale: 4, // Higher scale for better quality
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: dashboardElement.scrollWidth,
        height: dashboardElement.scrollHeight,
        windowWidth: dashboardElement.scrollWidth,
        windowHeight: dashboardElement.scrollHeight,
        onclone: function(clonedDoc) {
            // Ensure all styles are applied in the clone
            const clonedElement = clonedDoc.getElementById('dashboardOutput');
            if (clonedElement) {
                clonedElement.style.width = '100%';
                clonedElement.style.height = 'auto';
            }
        }
    }).then(canvas => {
        // Convert to blob with high quality
        canvas.toBlob(blob => {
            const item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item]).then(() => {
                alert('✅ Copied to clipboard!');
            }).catch(err => {
                console.error('Copy failed:', err);
                alert('❌ Failed to copy dashboard. Please try again or take a screenshot manually.');
            });
        }, 'image/png', 1.0); // Maximum quality
    });
}

// Enhanced export function with multiple sheets
function exportExactDashboard() {
    if (!window.exactDashboardStats) {
        alert('Please generate the dashboard first!');
        return;
    }
    
    try {
        const stats = window.exactDashboardStats;
        const currentYear = (new Date()).getFullYear();
        
        // Create a new workbook
        const wb = XLSX.utils.book_new();
        
        // SHEET 1: DASHBOARD SUMMARY
        const dashboardData = generateDashboardSummaryData(stats);
        const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData);
        
        // Set column widths for dashboard sheet
        const dashboardColWidths = [
            { wch: 15 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 12 },
            { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 12 },
            { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 12 },
            { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }
        ];
        wsDashboard['!cols'] = dashboardColWidths;
        
        XLSX.utils.book_append_sheet(wb, wsDashboard, "Dashboard Summary");
        
        // SHEET 2: DAILY BREAKDOWN
        const dailyData = generateDailyBreakdownData();
        const wsDaily = XLSX.utils.aoa_to_sheet(dailyData);
        
        // Set column widths for daily sheet
        const dailyColWidths = [
            { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 12 },
            { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 12 },
            { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 12 },
            { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }
        ];
        wsDaily['!cols'] = dailyColWidths;
        
        XLSX.utils.book_append_sheet(wb, wsDaily, "Daily Breakdown");
        
        // SHEET 3: ENTITIES (Current Year Only)
        const entitiesData = extractCurrentYearData(exactDashboardData.entities, 'entities');
        if (entitiesData.length > 0) {
            const wsEntities = XLSX.utils.json_to_sheet(entitiesData);
            XLSX.utils.book_append_sheet(wb, wsEntities, "Entities");
        }
        
        // SHEET 4: TM-ENTITIES (Current Year Only)
        const tmEntitiesData = extractCurrentYearData(exactDashboardData.tmEntities, 'tmEntities');
        if (tmEntitiesData.length > 0) {
            const wsTmEntities = XLSX.utils.json_to_sheet(tmEntitiesData);
            XLSX.utils.book_append_sheet(wb, wsTmEntities, "TM-Entities");
        }
        
        // SHEET 5: TMS (Current Year Only)
        const tmsData = extractCurrentYearData(exactDashboardData.tms, 'tms');
        if (tmsData.length > 0) {
            const wsTms = XLSX.utils.json_to_sheet(tmsData);
            XLSX.utils.book_append_sheet(wb, wsTms, "TMS");
        }
        
        // SHEET 6: REFUNDS (Current Year Only)
        const refundsData = extractCurrentYearData(exactDashboardData.refunds, 'refunds');
        if (refundsData.length > 0) {
            const wsRefunds = XLSX.utils.json_to_sheet(refundsData);
            XLSX.utils.book_append_sheet(wb, wsRefunds, "Refunds");
        }
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
        const filename = `EKYCDashboard_Export_${timestamp}.xlsx`;
        
        // Export the workbook
        XLSX.writeFile(wb, filename);
        
        alert(`✅ Dashboard exported successfully!`);
        
    } catch (error) {
        console.error('Export error:', error);
        alert('❌ Error exporting dashboard: ' + error.message);
    }
}

// Generate dashboard summary data for Excel
function generateDashboardSummaryData(stats) {
    const data = [];
    
    // Title
    data.push(['EKYCDashboard - Monthly Summary Report']);
    data.push(['Generated on:', new Date().toLocaleString()]);
    data.push([]);
    
    // Headers
    data.push([
        'Month', 'Date', 
        'Entities Recv', 'Entities W24h', 'Entities A24h', 'Entities Pend', 'Entities Total Appr',
        'TM-Entities Recv', 'TM-Entities W24h', 'TM-Entities A24h', 'TM-Entities Pend', 'TM-Entities Total Appr',
        'TMS Recv', 'TMS W24h', 'TMS A24h', 'TMS Pend', 'TMS Total Appr',
        'Total Reg', 'Total Pend', 'Refunded', 'Total Appr (old)'
    ]);
    
    // Get months sorted
    const sortedMonths = Array.from(stats.monthlyStats.keys()).sort();
    
    // Monthly data
    sortedMonths.forEach((monthKey, index) => {
        const monthData = stats.monthlyStats.get(monthKey);
        const approvalData = stats.approvalsByMonth.get(monthKey) || { entities: 0, tmEntities: 0, tms: 0 };
        const refunds = stats.refundsByMonth.get(monthKey) || 0;
        const monthName = getMonthName(new Date(monthKey + '-01'));
        
        const entities = monthData.entities;
        const tmEntities = monthData.tmEntities;
        const tms = monthData.tms;
        
        const totalReceived = entities.received + tmEntities.received + tms.received;
        const totalPending = entities.pending + tmEntities.pending + tms.pending;
        const totalApprovedByApproval = approvalData.entities + approvalData.tmEntities + approvalData.tms;
        
        data.push([
            monthName, 'Summary',
            entities.received, entities.within24hrs, entities.after24hrs, entities.pending, approvalData.entities,
            tmEntities.received, tmEntities.within24hrs, tmEntities.after24hrs, tmEntities.pending, approvalData.tmEntities,
            tms.received, tms.within24hrs, tms.after24hrs, tms.pending, approvalData.tms,
            totalReceived, totalPending, refunds, totalApprovedByApproval
        ]);
    });
    
    // Grand Total row
    data.push([]);
    data.push([
        'GRAND TOTAL', '',
        stats.grandTotals.entities.received, stats.grandTotals.entities.within24hrs, stats.grandTotals.entities.after24hrs, 
        stats.grandTotals.entities.pending, stats.grandTotals.entities.approvedByApproval,
        stats.grandTotals.tmEntities.received, stats.grandTotals.tmEntities.within24hrs, stats.grandTotals.tmEntities.after24hrs,
        stats.grandTotals.tmEntities.pending, stats.grandTotals.tmEntities.approvedByApproval,
        stats.grandTotals.tms.received, stats.grandTotals.tms.within24hrs, stats.grandTotals.tms.after24hrs,
        stats.grandTotals.tms.pending, stats.grandTotals.tms.approvedByApproval,
        stats.grandTotals.entities.received + stats.grandTotals.tmEntities.received + stats.grandTotals.tms.received,
        stats.grandTotals.entities.pending + stats.grandTotals.tmEntities.pending + stats.grandTotals.tms.pending,
        stats.totalRefunds,
        stats.grandTotals.entities.approvedByApproval + stats.grandTotals.tmEntities.approvedByApproval + stats.grandTotals.tms.approvedByApproval
    ]);
    
    return data;
}

// Generate daily breakdown data for Excel
function generateDailyBreakdownData() {
    const { dailyStats, currentMonth } = calculateDailyStatistics();
    const data = [];
    
    // Title
    data.push(['EKYCDashboard - Daily Breakdown Report']);
    data.push(['Month:', getMonthName(new Date(currentMonth + '-01'))]);
    data.push(['Generated on:', new Date().toLocaleString()]);
    data.push([]);
    
    // Headers
    data.push([
        'Date', 
        'Entities Recv', 'Entities W24h', 'Entities A24h', 'Entities Pend', 'Entities Total Appr',
        'TM-Entities Recv', 'TM-Entities W24h', 'TM-Entities A24h', 'TM-Entities Pend', 'TM-Entities Total Appr',
        'TMS Recv', 'TMS W24h', 'TMS A24h', 'TMS Pend', 'TMS Total Appr',
        'Total Reg', 'Total Pend', 'Refunded', 'Total Appr (old)'
    ]);
    
    // Get dates sorted
    const allDates = new Set();
    ['entities','tmEntities','tms'].forEach(type => {
        dailyStats[type].forEach((v, dateKey) => {
            if (dateKey && dateKey.startsWith(currentMonth)) allDates.add(dateKey);
        });
    });
    
    const sortedDates = Array.from(allDates).sort((a,b) => new Date(a) - new Date(b));
    
    // Daily data
    sortedDates.forEach((date, index) => {
        const entitiesData = dailyStats.entities.get(date) || { received: 0, within24hrs: 0, after24hrs: 0, pending: 0 };
        const tmEntitiesData = dailyStats.tmEntities.get(date) || { received: 0, within24hrs: 0, after24hrs: 0, pending: 0 };
        const tmsData = dailyStats.tms.get(date) || { received: 0, within24hrs: 0, after24hrs: 0, pending: 0 };
        const approvalData = dailyStats.approvalsByDay.get(date) || { entities: 0, tmEntities: 0, tms: 0 };
        
        const totalReceived = entitiesData.received + tmEntitiesData.received + tmsData.received;
        const totalPending = entitiesData.pending + tmEntitiesData.pending + tmsData.pending;
        const totalApprovedByApproval = approvalData.entities + approvalData.tmEntities + approvalData.tms;
        
        const dateObj = new Date(date);
        const formattedDate = formatDateDDMMYYYY(dateObj);
        
        data.push([
            formattedDate,
            entitiesData.received, entitiesData.within24hrs, entitiesData.after24hrs, entitiesData.pending, approvalData.entities,
            tmEntitiesData.received, tmEntitiesData.within24hrs, tmEntitiesData.after24hrs, tmEntitiesData.pending, approvalData.tmEntities,
            tmsData.received, tmsData.within24hrs, tmsData.after24hrs, tmsData.pending, approvalData.tms,
            totalReceived, totalPending, 0, totalApprovedByApproval
        ]);
    });
    
    return data;
}

// Extract current year data only for raw data sheets
function extractCurrentYearData(rawData, dataType) {
    const currentYear = (new Date()).getFullYear();
    const currentYearData = [];
    
    if (!rawData || rawData.length === 0) return currentYearData;
    
    rawData.forEach(record => {
        try {
            // For refunds, check refund date
            if (dataType === 'refunds') {
                if (record.refundDate && record.refundDate.getFullYear() === currentYear) {
                    currentYearData.push(record.rawData);
                }
            } 
            // For other types, check submission date
            else {
                if (record.submissionDate && record.submissionDate.getFullYear() === currentYear) {
                    currentYearData.push(record.rawData);
                }
            }
        } catch (error) {
            console.warn(`Error processing record for ${dataType}:`, error);
        }
    });
    
    console.log(`📊 ${dataType}: ${currentYearData.length} records for ${currentYear}`);
    return currentYearData;
}

// Check files uploaded function
function checkFilesUploaded() {
    const entitiesFile = document.getElementById('entitiesFileInput')?.files.length > 0;
    const tmEntitiesFile = document.getElementById('tmEntitiesFileInput')?.files.length > 0;
    const tmsFile = document.getElementById('tmsFileInput')?.files.length > 0;
    
    const generateBtn = document.getElementById('generateDashboardBtn');
    const instructions = document.getElementById('uploadInstructions');
    
    if (entitiesFile && tmEntitiesFile && tmsFile) {
        generateBtn.disabled = false;
        generateBtn.style.background = '#27ae60';
        instructions.innerHTML = 'All required files uploaded';
        instructions.style.color = '#27ae60';
    } else {
        generateBtn.disabled = true;
        generateBtn.style.background = '#95a5a6';
        instructions.innerHTML = 'Upload Entities, TM-Entities, and TMS files to generate dashboard';
        instructions.style.color = '#666';
    }
}

// Close modal function
function closeKycUploadModal() {
    const modal = document.getElementById('kycUploadModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Function to show dashboard controls with centered buttons
function showDashboardControls() {
    const controls = document.getElementById('dashboardControls');
    if (controls) {
        controls.style.display = 'flex'; // Use flex for centering
        controls.style.justifyContent = 'center';
        controls.style.alignItems = 'center';
        controls.style.gap = '20px';
        controls.style.flexWrap = 'wrap';
    }
}
