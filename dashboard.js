// Global data storage
let exactDashboardData = {
    entities: [],
    tmEntities: [], 
    tms: [],
    refunds: []
};

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

// Process files with APPROVED ON DATE logic
function processExactFile(file, type) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                let workbook, jsonData;
                
                if (file.name.endsWith('.csv')) {
                    const csvData = e.target.result;
                    workbook = XLSX.read(csvData, { type: 'string' });
                } else {
                    const data = new Uint8Array(e.target.result);
                    workbook = XLSX.read(data, { type: 'array' });
                }
                
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                jsonData = XLSX.utils.sheet_to_json(sheet);
                
                console.log(`📁 ${type}: ${jsonData.length} raw records loaded`);
                
                // Process with APPROVED ON DATE logic
                const processedData = processApprovedOnDateData(jsonData, type);
                console.log(`✅ ${type}: ${processedData.length} records processed`);
                
                resolve({ type, data: processedData });
                
            } catch (error) {
                reject(new Error(`Error processing ${type}: ${error.message}`));
            }
        };
        
        reader.onerror = () => reject(new Error(`Failed to read ${type} file`));
        
        if (file.name.endsWith('.csv')) {
            reader.readAsText(file, 'utf-8');
        } else {
            reader.readAsArrayBuffer(file);
        }
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

// Calculate statistics with APPROVED ON DATE logic
function calculateExactStatistics() {
    console.log('🔢 Calculating statistics with APPROVED ON DATE logic...');
    
    const stats = {
        monthlyStats: new Map(),
        approvalsByMonth: new Map(), // NEW: Approvals by Approved On Date
        grandTotals: {
            entities: { received: 0, within24hrs: 0, after24hrs: 0, pending: 0, approvedBySubmission: 0, approvedByApproval: 0 },
            tmEntities: { received: 0, within24hrs: 0, after24hrs: 0, pending: 0, approvedBySubmission: 0, approvedByApproval: 0 },
            tms: { received: 0, within24hrs: 0, after24hrs: 0, pending: 0, approvedBySubmission: 0, approvedByApproval: 0 }
        },
        refundsByMonth: new Map(),
        totalRefunds: 0
    };

    // Process entities, TM-entities, TMS with APPROVED ON DATE logic
    ['entities', 'tmEntities', 'tms'].forEach(entityType => {
        const data = exactDashboardData[entityType] || [];
        console.log(`📊 Processing ${entityType}: ${data.length} records`);
        
        data.forEach(record => {
            // COUNT BY SUBMISSION DATE (for Recv, W24h, A24h, Pend columns)
            if (record.submissionMonthKey) {
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
            
            // COUNT BY APPROVAL DATE (for Total Appr columns) - NEW LOGIC
            if (record.approvalMonthKey && record.isCurrentlyApproved) {
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

    // Process refunds with Refund Initiated Date
    const refundsData = exactDashboardData.refunds || [];
    console.log(`💰 Processing refunds: ${refundsData.length} records`);
    
    refundsData.forEach(refund => {
        if (refund.monthKey) {
            const count = stats.refundsByMonth.get(refund.monthKey) || 0;
            stats.refundsByMonth.set(refund.monthKey, count + 1);
            stats.totalRefunds++;
        }
    });

    return stats;
}

// Generate exact summary function
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
                <div class="summary-number">${totalReceived}</div>
                <div class="summary-label">Total Reg</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${totalApprovedByApproval}</div>
                <div class="summary-label">Total Appr</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${totalPending}</div>
                <div class="summary-label">Total Pend</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${stats.totalRefunds}</div>
                <div class="summary-label">Refunded</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${approvalRate}%</div>
                <div class="summary-label">Approval Rate</div>
            </div>
        </div>`;   
}

// Generate exact table function with Tanla colors
function generateExactTable(stats) {
    return `
        <div style="overflow-x: auto;">
            <h3 style="text-align: center; color: black; margin: 4px 0; padding: 8px; background: #7fdad2; border-radius: 6px; font-size: 14px;">
                📊 EKYC Dashboard Report - Monthly Summary
            </h3>
            <table id="exactTable" class="dashboard-table">
                <thead>
                    <tr>
                        <th rowspan="2" style="padding: 4px 6px;">Month</th>
                        <th colspan="5" style="padding: 4px 6px;">Entities</th>
                        <th colspan="5" style="padding: 4px 6px;">TM-Entities</th>
                        <th colspan="5" style="padding: 4px 6px;">TMS</th>
                        <th rowspan="2" style="padding: 4px 6px;">Total Reg</th>
                        <th rowspan="2" style="padding: 4px 6px;">Total Pend</th>
                        <th rowspan="2" style="padding: 4px 6px;">Refunded</th>
                        <th rowspan="2" style="padding: 4px 6px;">Total Appr</th>
                    </tr>
                    <tr>
                        ${Array(3).fill().map(() => 
                            `<th style="padding: 2px 4px; font-size: 0.5rem;">Recv</th>
                            <th style="padding: 2px 4px; font-size: 0.5rem;">W24h</th>
                            <th style="padding: 2px 4px; font-size: 0.5rem;">A24h</th>
                            <th style="padding: 2px 4px; font-size: 0.5rem;">Pend</th>
                            <th style="padding: 2px 4px; font-size: 0.5rem;">Total Appr</th>`
                        ).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${generateExactTableBody(stats)}
                </tbody>
            </table>
        </div>`;
}

// Generate exact table body function with APPROVED ON DATE logic
function generateExactTableBody(stats) {
    let html = '';
    
    // Get months sorted
    const sortedMonths = Array.from(stats.monthlyStats.keys()).sort();
    
    // Generate monthly summaries
    sortedMonths.forEach((monthKey, index) => {
        const monthData = stats.monthlyStats.get(monthKey);
        const approvalData = stats.approvalsByMonth.get(monthKey) || { entities: 0, tmEntities: 0, tms: 0 };
        const monthName = formatExactMonth(monthKey);
        
        // Get refunds for this month
        const refunds = stats.refundsByMonth.get(monthKey) || 0;
        
        const entities = monthData.entities;
        const tmEntities = monthData.tmEntities; 
        const tms = monthData.tms;
        
        const totalReceived = entities.received + tmEntities.received + tms.received;
        const totalPending = entities.pending + tmEntities.pending + tms.pending;
        const totalApprovedByApproval = approvalData.entities + approvalData.tmEntities + approvalData.tms;

        // Alternate between grey and white for rows
        const rowColor = index % 2 === 0 ? '#f8f8f8' : '#ffffff';
        
        html += `
            <tr style="background: ${rowColor};">
                <td style="padding: 3px 4px; text-align: center; font-weight: 600;">${monthName}</td>
                
                <td style="padding: 2px 3px; text-align: center; font-weight: 700;">${entities.received}</td>
                <td style="padding: 2px 3px; text-align: center; font-weight: 700;">${entities.within24hrs}</td>
                <td style="padding: 2px 3px; text-align: center; font-weight: 700;">${entities.after24hrs}</td>
                <td style="padding: 2px 3px; text-align: center; font-weight: 700;">${entities.pending}</td>
                <td style="padding: 2px 3px; text-align: center; font-weight: 700;">${approvalData.entities}</td>
                
                <td style="padding: 2px 3px; text-align: center; font-weight: 700;">${tmEntities.received}</td>
                <td style="padding: 2px 3px; text-align: center; font-weight: 700;">${tmEntities.within24hrs}</td>
                <td style="padding: 2px 3px; text-align: center; font-weight: 700;">${tmEntities.after24hrs}</td>
                <td style="padding: 2px 3px; text-align: center; font-weight: 700;">${tmEntities.pending}</td>
                <td style="padding: 2px 3px; text-align: center; font-weight: 700;">${approvalData.tmEntities}</td>
                
                <td style="padding: 2px 3px; text-align: center; font-weight: 700;">${tms.received}</td>
                <td style="padding: 2px 3px; text-align: center; font-weight: 700;">${tms.within24hrs}</td>
                <td style="padding: 2px 3px; text-align: center; font-weight: 700;">${tms.after24hrs}</td>
                <td style="padding: 2px 3px; text-align: center; font-weight: 700;">${tms.pending}</td>
                <td style="padding: 2px 3px; text-align: center; font-weight: 700;">${approvalData.tms}</td>
                
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${totalReceived}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${totalPending}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${refunds}</td>
                <td style="padding: 3px 4px; text-align: center; font-weight: 700;">${totalApprovedByApproval}</td>
            </tr>`;
    });
    
    // Grand total row
    const grandTotalReceived = stats.grandTotals.entities.received + stats.grandTotals.tmEntities.received + stats.grandTotals.tms.received;
    const grandTotalPending = stats.grandTotals.entities.pending + stats.grandTotals.tmEntities.pending + stats.grandTotals.tms.pending;
    const grandTotalApprovedByApproval = stats.grandTotals.entities.approvedByApproval + stats.grandTotals.tmEntities.approvedByApproval + stats.grandTotals.tms.approvedByApproval;
    
    html += `
        <tr style="background: #b8e8e4; font-weight: bold;">
            <td style="padding: 3px 4px; text-align: center;">Grand Total</td>
            
            <td style="padding: 2px 3px; text-align: center;">${stats.grandTotals.entities.received}</td>
            <td style="padding: 2px 3px; text-align: center;">${stats.grandTotals.entities.within24hrs}</td>
            <td style="padding: 2px 3px; text-align: center;">${stats.grandTotals.entities.after24hrs}</td>
            <td style="padding: 2px 3px; text-align: center;">${stats.grandTotals.entities.pending}</td>
            <td style="padding: 2px 3px; text-align: center;">${stats.grandTotals.entities.approvedByApproval}</td>
            
            <td style="padding: 2px 3px; text-align: center;">${stats.grandTotals.tmEntities.received}</td>
            <td style="padding: 2px 3px; text-align: center;">${stats.grandTotals.tmEntities.within24hrs}</td>
            <td style="padding: 2px 3px; text-align: center;">${stats.grandTotals.tmEntities.after24hrs}</td>
            <td style="padding: 2px 3px; text-align: center;">${stats.grandTotals.tmEntities.pending}</td>
            <td style="padding: 2px 3px; text-align: center;">${stats.grandTotals.tmEntities.approvedByApproval}</td>
            
            <td style="padding: 2px 3px; text-align: center;">${stats.grandTotals.tms.received}</td>
            <td style="padding: 2px 3px; text-align: center;">${stats.grandTotals.tms.within24hrs}</td>
            <td style="padding: 2px 3px; text-align: center;">${stats.grandTotals.tms.after24hrs}</td>
            <td style="padding: 2px 3px; text-align: center;">${stats.grandTotals.tms.pending}</td>
            <td style="padding: 2px 3px; text-align: center;">${stats.grandTotals.tms.approvedByApproval}</td>
            
            <td style="padding: 3px 4px; text-align: center;">${grandTotalReceived}</td>
            <td style="padding: 3px 4px; text-align: center;">${grandTotalPending}</td>
            <td style="padding: 3px 4px; text-align: center;">${stats.totalRefunds}</td>
            <td style="padding: 3px 4px; text-align: center;">${grandTotalApprovedByApproval}</td>
        </tr>`;
    
    return html;
}

// Utility function for month formatting
function formatExactMonth(monthKey) {
    const [year, month] = monthKey.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]}'${year.substring(2)}`;
}

// DAILY BREAKDOWN with APPROVED ON DATE logic
function calculateDailyStatistics() {
    console.log('📅 Calculating daily breakdown with APPROVED ON DATE logic...');

    const currentMonth = getCurrentMonthFromData();
    console.log('📊 Current month from data:', currentMonth);

    const dailyStats = {
        entities: new Map(),
        tmEntities: new Map(),
        tms: new Map(),
        approvalsByDay: new Map() // NEW: Approvals by Approved On Date
    };

    // Process each entity type for daily counts
    ['entities', 'tmEntities', 'tms'].forEach(entityType => {
        const data = exactDashboardData[entityType] || [];

        data.forEach(record => {
            // COUNT BY SUBMISSION DATE (for Recv, W24h, A24h, Pend columns)
            if (record.submissionDateKey && record.submissionMonthKey === currentMonth) {
                const dateKey = record.submissionDateKey;

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

            // COUNT BY APPROVAL DATE (for Total Appr columns) - NEW LOGIC
            if (record.approvalDateKey && record.approvalMonthKey === currentMonth && record.isCurrentlyApproved) {
                const approvalDateKey = record.approvalDateKey;

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
        });
    });

    // Determine max day for current month
    const daysInData = [];
    ['entities','tmEntities','tms'].forEach(type => {
        dailyStats[type].forEach((v, dateKey) => {
            if (dateKey && dateKey.startsWith(currentMonth)) {
                const dayNum = parseInt(dateKey.split('-')[2], 10);
                if (!isNaN(dayNum)) daysInData.push(dayNum);
            }
        });
    });

    const latestDayInData = daysInData.length ? Math.max(...daysInData) : 0;
    const now = new Date();
    const systemMonthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const yesterday = now.getDate() - 1;

    let maxDay;
    if (currentMonth === systemMonthKey) {
        maxDay = Math.min(latestDayInData, yesterday);
        if (maxDay === 0) maxDay = yesterday;
    } else {
        maxDay = latestDayInData;
    }

    // Ensure day entries exist for all days 1..maxDay
    for (let d = 1; d <= maxDay; d++) {
        const dd = String(d).padStart(2,'0');
        const dateKey = `${currentMonth}-${dd}`;
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

    console.log('✅ Daily breakdown calculated with APPROVED ON DATE logic');
    return { dailyStats, currentMonth };
}

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
            No daily data available for current month (${formatExactMonth(currentMonth)}).
        </div>`;
    }

     let html = `
<div style="overflow-x: auto; margin-top: 8px;">
    <h3 style="text-align: center; color: black; margin: 4px 0; padding: 6px; background: #7fdad2; border-radius: 6px; font-size: 12px;">
        📊 Daily Breakdown - ${formatExactMonth(currentMonth)}
    </h3>
    <table class="dashboard-table">
        <thead>
            <tr>
                <th rowspan="2" style="padding: 3px 4px;">Date</th>
                <th colspan="5" style="padding: 3px 4px;">Entities</th>
                <th colspan="5" style="padding: 3px 4px;">TM-Entities</th>
                <th colspan="5" style="padding: 3px 4px;">TMS</th>
                <th rowspan="2" style="padding: 3px 4px;">Total Reg</th>
                <th rowspan="2" style="padding: 3px 4px;">Total Pend</th>
                <th rowspan="2" style="padding: 3px 4px;">Refunded</th>
                <th rowspan="2" style="padding: 3px 4px;">Total Appr</th>
            </tr>
            <tr>
                ${Array(3).fill().map(() => 
                    `<th style="padding: 1px 2px; font-size: 0.5rem;">Recv</th>
                     <th style="padding: 1px 2px; font-size: 0.5rem;">W24h</th>
                     <th style="padding: 1px 2px; font-size: 0.5rem;">A24h</th>
                     <th style="padding: 1px 2px; font-size: 0.5rem;">Pend</th>
                     <th style="padding: 1px 2px; font-size: 0.5rem;">Total Appr</th>`).join('')}
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
    const rowColor = index % 2 === 0 ? '#f8f8f8' : '#ffffff';

    html += `
        <tr style="background: ${rowColor};">
            <td style="padding: 2px 3px; text-align: center; font-weight: 600;">${formattedDate}</td>

            <td style="padding: 1px 2px; text-align: center; font-weight: 700;">${entitiesData.received}</td>
            <td style="padding: 1px 2px; text-align: center; font-weight: 700;">${entitiesData.within24hrs}</td>
            <td style="padding: 1px 2px; text-align: center; font-weight: 700;">${entitiesData.after24hrs}</td>
            <td style="padding: 1px 2px; text-align: center; font-weight: 700;">${entitiesData.pending}</td>
            <td style="padding: 1px 2px; text-align: center; font-weight: 700;">${approvalData.entities}</td>

            <td style="padding: 1px 2px; text-align: center; font-weight: 700;">${tmEntitiesData.received}</td>
            <td style="padding: 1px 2px; text-align: center; font-weight: 700;">${tmEntitiesData.within24hrs}</td>
            <td style="padding: 1px 2px; text-align: center; font-weight: 700;">${tmEntitiesData.after24hrs}</td>
            <td style="padding: 1px 2px; text-align: center; font-weight: 700;">${tmEntitiesData.pending}</td>
            <td style="padding: 1px 2px; text-align: center; font-weight: 700;">${approvalData.tmEntities}</td>

            <td style="padding: 1px 2px; text-align: center; font-weight: 700;">${tmsData.received}</td>
            <td style="padding: 1px 2px; text-align: center; font-weight: 700;">${tmsData.within24hrs}</td>
            <td style="padding: 1px 2px; text-align: center; font-weight: 700;">${tmsData.after24hrs}</td>
            <td style="padding: 1px 2px; text-align: center; font-weight: 700;">${tmsData.pending}</td>
            <td style="padding: 1px 2px; text-align: center; font-weight: 700;">${approvalData.tms}</td>

            <td style="padding: 2px 3px; text-align: center; font-weight: 700;">${totalReceived}</td>
            <td style="padding: 2px 3px; text-align: center; font-weight: 700;">${totalPending}</td>
            <td style="padding: 2px 3px; text-align: center; font-weight: 700;">0</td>
            <td style="padding: 2px 3px; text-align: center; font-weight: 700;">${totalApprovedByApproval}</td>
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
    
    // Show the external controls
    document.getElementById('dashboardControls').style.display = 'block';
   
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
    
    html2canvas(dashboardElement).then(canvas => {
        canvas.toBlob(blob => {
            const item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item]).then(() => {
                alert('✅ Dashboard copied to clipboard! You can now paste it directly into PowerPoint or other applications.');
            }).catch(err => {
                console.error('Copy failed:', err);
                alert('❌ Failed to copy dashboard. Please try again or take a screenshot manually.');
            });
        });
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
        const monthName = formatExactMonth(monthKey);
        
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
    data.push(['Month:', formatExactMonth(currentMonth)]);
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

