// EKYC Summary - Financial Year, Month-wise and Day-wise Dashboards
class EKYCManager {
    constructor() {
        this.ekycEntitiesData = [];
        this.ekycTMData = [];
        this.ekycTMEntitiesData = [];
        
        this.statusCategories = {
            tm: ['Approved', 'Blacklisted', 'De-Registered', 'Inactive', 'Pending', 'Suspended'],
            pe: ['Approved', 'Blacklisted', 'Inactive', 'Pending', 'Suspended'],
            tme: ['Approved', 'Blacklisted', 'Inactive', 'Pending', 'Suspended']
        };
        
        this.init();
    }

    init() {
        console.log('🔄 EKYC Manager Initializing...');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Open EKYC Modal
        const openEkycBtn = document.getElementById('openEkycUploadModal');
        if (openEkycBtn) {
            openEkycBtn.addEventListener('click', () => this.openEkycUploadModal());
        }

        // File input changes
        const fileInputs = [
            { id: 'ekycEntitiesFileInput', statusId: 'ekycEntitiesStatus' },
            { id: 'ekycTmFileInput', statusId: 'ekycTmStatus' },
            { id: 'ekycTmEntitiesFileInput', statusId: 'ekycTmEntitiesStatus' }
        ];

        fileInputs.forEach(config => {
            const input = document.getElementById(config.id);
            const status = document.getElementById(config.statusId);
            
            if (input && status) {
                input.addEventListener('change', (e) => this.handleFileChange(e, status));
            }
        });

        // Generate EKYC Report Button
        const generateBtn = document.getElementById('generateEKYCReportBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateEKYCReport());
        }

        console.log('✅ EKYC Event listeners setup complete');
    }

    openEkycUploadModal() {
        console.log('📁 Opening EKYC upload modal');
        const modal = document.getElementById('ekycUploadModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
            
            // Clear previous results
            const outputDiv = document.getElementById('ekycReportOutput');
            if (outputDiv) outputDiv.innerHTML = '';
            
            const statsContainer = document.getElementById('ekycStatsContainer');
            if (statsContainer) statsContainer.style.display = 'none';
        }
    }

    closeEkycUploadModal() {
        console.log('❌ Closing EKYC upload modal');
        const modal = document.getElementById('ekycUploadModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
        // REMOVE THIS LINE that clears the files:
        // this.clearEkycFileInputs();
    }

    handleFileChange(event, statusElement) {
        const file = event.target.files[0];
        if (file) {
            console.log('📄 File selected:', file.name);
            statusElement.textContent = file.name;
            statusElement.style.color = '#27ae60';
            statusElement.classList.add('ready');
        } else {
            statusElement.textContent = 'No file chosen';
            statusElement.style.color = '#666';
            statusElement.classList.remove('ready');
        }
        this.checkEKYCReportFilesUploaded();
    }

    checkEKYCReportFilesUploaded() {
        const entitiesFile = document.getElementById('ekycEntitiesFileInput').files.length > 0;
        const tmFile = document.getElementById('ekycTmFileInput').files.length > 0;
        const tmEntitiesFile = document.getElementById('ekycTmEntitiesFileInput').files.length > 0;
        
        const generateBtn = document.getElementById('generateEKYCReportBtn');
        const instructions = document.getElementById('ekycUploadInstructions');
        
        console.log('🔍 Files check:', { entitiesFile, tmFile, tmEntitiesFile });

        if (entitiesFile && tmFile && tmEntitiesFile) {
            generateBtn.disabled = false;
            generateBtn.style.background = '#27ae60';
            instructions.textContent = 'All files ready';
            instructions.style.color = '#27ae60';
            instructions.classList.add('ready');
            console.log('✅ All files ready - generate button enabled');
        } else {
            generateBtn.disabled = true;
            generateBtn.style.background = '#95a5a6';
            instructions.textContent = 'Upload all three files to generate EKYC report';
            instructions.style.color = '#666';
            instructions.classList.remove('ready');
        }
    }

    clearEkycFileInputs() {
        document.getElementById('ekycEntitiesFileInput').value = '';
        document.getElementById('ekycTmFileInput').value = '';
        document.getElementById('ekycTmEntitiesFileInput').value = '';
        
        document.getElementById('ekycEntitiesStatus').textContent = 'No file chosen';
        document.getElementById('ekycTmStatus').textContent = 'No file chosen';
        document.getElementById('ekycTmEntitiesStatus').textContent = 'No file chosen';
        
        document.getElementById('generateEKYCReportBtn').disabled = true;
        document.getElementById('ekycUploadInstructions').textContent = 'Upload all three files to generate EKYC report';
        document.getElementById('ekycUploadInstructions').style.color = '#666';
    }

    async generateEKYCReport() {
        console.log('🚀 Starting EKYC report generation...');
        
        const entitiesFile = document.getElementById('ekycEntitiesFileInput').files[0];
        const tmFile = document.getElementById('ekycTmFileInput').files[0];
        const tmEntitiesFile = document.getElementById('ekycTmEntitiesFileInput').files[0];

        // Close modal immediately
        this.closeEkycUploadModal();
        
       // Show loading
    const outputDiv = document.getElementById('ekycReportOutput');
    if (outputDiv) {
        outputDiv.innerHTML = `
            <div class="simple-loading">
                Generating Dashboard...
            </div>
        `;
    }

        try {
            console.log('📊 Parsing files...');
            const [entitiesData, tmData, tmeData] = await Promise.all([
                this.parseCSV(entitiesFile),
                this.parseCSV(tmFile),
                this.parseCSV(tmEntitiesFile)
            ]);

            console.log('✅ Files parsed successfully:', {
                entities: entitiesData?.length,
                tm: tmData?.length,
                tme: tmeData?.length
            });

            this.ekycEntitiesData = entitiesData || [];
            this.ekycTMData = tmData || [];
            this.ekycTMEntitiesData = tmeData || [];

            // Filter out inprogress records from all sheets and process dates
            const filteredEntities = this.processData(this.filterInProgress(this.ekycEntitiesData));
            const filteredTM = this.processData(this.filterInProgress(this.ekycTMData));
            const filteredTME = this.processData(this.filterInProgress(this.ekycTMEntitiesData));

            console.log('✅ Data processed after removing InProgress:', {
                entities: filteredEntities.length,
                tm: filteredTM.length,
                tme: filteredTME.length
            });

            // Update stats
            this.updateEkycStats(filteredEntities, filteredTM, filteredTME);
            
            // Render all three dashboards
            this.renderAllDashboards(filteredEntities, filteredTM, filteredTME);
            
            console.log('🎉 EKYC dashboards rendered successfully');

        } catch (error) {
            console.error('❌ Error generating EKYC report:', error);
            if (outputDiv) {
                outputDiv.innerHTML = `
                    <div style="color: #e74c3c; text-align: center; padding: 20px;">
                        <div style="font-size: 24px; margin-bottom: 10px;">❌</div>
                        <div>Error processing EKYC files</div>
                        <div style="font-size: 12px; margin-top: 10px;">${error.message || 'Unknown error'}</div>
                    </div>
                `;
            }
        }
    }

    parseCSV(file) {
        return new Promise((resolve, reject) => {
            if (!file) return resolve([]);
            
            const fileName = file.name.toLowerCase();
            console.log(`📖 Parsing file: ${file.name}`);
            
            if (fileName.endsWith('.csv')) {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        console.log(`✅ CSV parsed: ${results.data?.length} rows`);
                        resolve(results.data || []);
                    },
                    error: (error) => {
                        console.error('❌ CSV parse error:', error);
                        reject(error);
                    }
                });
            } else {
                // Handle Excel files
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
                        console.log(`✅ Excel parsed: ${jsonData.length} rows`);
                        resolve(jsonData);
                    } catch (error) {
                        console.error('❌ Excel parse error:', error);
                        reject(error);
                    }
                };
                reader.onerror = (error) => {
                    console.error('❌ File read error:', error);
                    reject(error);
                };
                reader.readAsArrayBuffer(file);
            }
        });
    }

    filterInProgress(data) {
        return (data || []).filter(item => {
            const status = (item.Status || item.status || item.STATUS || '').toString().trim().toLowerCase();
            return status !== 'inprogress';
        });
    }

    processData(data) {
        return (data || []).map(item => {
            // Find application submitted date field, if not found use requested date
            let dateField = this.findDateField(item, 'Application Submitted Date');
            if (!dateField || !item[dateField]) {
                dateField = this.findDateField(item, 'Requested Date');
            }
            
            if (dateField && item[dateField]) {
                try {
                    const originalDate = item[dateField];
                    let processedDate = null;
                    
                    // Handle different date formats
                    if (typeof originalDate === 'number') {
                        // Excel serial date
                        processedDate = this.excelDateToJSDate(originalDate);
                    } else if (typeof originalDate === 'string') {
                        // String date - try to parse
                        processedDate = new Date(originalDate);
                        if (isNaN(processedDate.getTime())) {
                            // Try different formats
                            processedDate = this.parseDateString(originalDate);
                        }
                    }
                    
                    if (processedDate && !isNaN(processedDate.getTime())) {
                        item.processedDate = processedDate;
                        item.financialYear = this.getFinancialYear(processedDate);
                        item.monthYear = this.getMonthYear(processedDate);
                        item.day = processedDate.getDate();
                        item.month = processedDate.getMonth() + 1; // 1-12
                        item.year = processedDate.getFullYear();
                    }
                } catch (error) {
                    console.warn('Date parsing error:', error);
                }
            }
            
            // Handle pending status (Resubmitted + Approval pending)
            const status = (item.Status || item.status || item.STATUS || '').toString().trim();
            const lowerStatus = status.toLowerCase();
            if (lowerStatus === 'resubmitted' || lowerStatus.includes('approval pending') || lowerStatus.includes('pending')) {
                item.processedStatus = 'Pending';
            } else {
                item.processedStatus = status;
            }
            
            return item;
        });
    }

    findDateField(item, preferredField) {
        const dateFields = [preferredField, 'Application Submitted Date', 'application submitted date', 'Submitted Date', 
                           'submitted date', 'Requested Date', 'requested date', 'Date', 'date', 'ApplicationDate', 'applicationDate'];
        return dateFields.find(field => item[field] !== undefined && item[field] !== '');
    }

    excelDateToJSDate(serial) {
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
    }

    parseDateString(dateString) {
        // Try different date formats
        const formats = [
            /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/, // DD-MM-YYYY or DD/MM/YYYY
            /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/, // YYYY-MM-DD or YYYY/MM/DD
        ];
        
        for (const format of formats) {
            const match = dateString.match(format);
            if (match) {
                if (match[3] && match[3].length === 4) {
                    // DD-MM-YYYY format
                    return new Date(match[3], match[2] - 1, match[1]);
                } else if (match[1] && match[1].length === 4) {
                    // YYYY-MM-DD format
                    return new Date(match[1], match[2] - 1, match[3]);
                }
            }
        }
        
        return new Date(dateString);
    }

    getFinancialYear(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-12
        
        if (month >= 4) { // April to March
            return `${year}-${year + 1}`;
        } else {
            return `${year - 1}-${year}`;
        }
    }

    getMonthYear(date) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]}-${date.getFullYear()}`;
    }

    updateEkycStats(pe, tm, tme) {
        const statsContainer = document.getElementById('ekycStatsContainer');
        if (statsContainer) {
            statsContainer.style.display = 'grid';
            
        document.getElementById('totalPE').textContent = this.formatNumber(pe.length);
        document.getElementById('totalTM').textContent = this.formatNumber(tm.length);
        document.getElementById('totalTME').textContent = this.formatNumber(tme.length);
            
            const totalApproved = this.countByStatus(tm, 'Approved') + 
                                this.countByStatus(pe, 'Approved') + 
                                this.countByStatus(tme, 'Approved');
            document.getElementById('totalApprovedEkyc').textContent = this.formatNumber(totalApproved);
            
            console.log('📈 Stats updated');
        }
    }

    renderAllDashboards(pe, tm, tme) {
        console.log('🎨 Rendering all dashboards...');
        
        const financialYearHTML = this.buildFinancialYearWiseHTML(pe, tm, tme);
        const currentFYMonthHTML = this.buildCurrentFYMonthwiseHTML(pe, tm, tme);
        const currentMonthDayHTML = this.buildCurrentMonthDaywiseHTML(pe, tm, tme);

        const outputDiv = document.getElementById('ekycReportOutput');
        if (outputDiv) {
            outputDiv.innerHTML = `
                <div class="ekyc-dashboard-container">
                    <div class="ekyc-dashboard-header">
                      <h2>EKYC Summary - Financial Year Report</h2>
                    </div>
                    <div class="ekyc-dashboards-content">
                        ${financialYearHTML}
                        ${currentFYMonthHTML}
                        ${currentMonthDayHTML}
                    </div>
                </div>
                <div class="ekyc-dashboard-actions">
                    <button id="copyEKYCReportBtn" class="copy-report-btn">📋 Copy Report</button>
                </div>
            `;

            // Add event listener for copy button
            const copyBtn = document.getElementById('copyEKYCReportBtn');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => this.copyEKYCReport());
            }
        }
        
        console.log('✅ All dashboards rendered');
    }



    buildFinancialYearWiseHTML(pe, tm, tme) {
    // Group data by financial year based on application submission date
    const financialYears = {};
    
    // Collect all financial years from processed dates
    [...pe, ...tm, ...tme].forEach(item => {
        if (item.financialYear) {
            if (!financialYears[item.financialYear]) {
                financialYears[item.financialYear] = { pe: [], tm: [], tme: [] };
            }
        }
    });
    
    // Categorize data by financial year and type
    pe.forEach(item => {
        if (item.financialYear && financialYears[item.financialYear]) {
            financialYears[item.financialYear].pe.push(item);
        }
    });
    
    tm.forEach(item => {
        if (item.financialYear && financialYears[item.financialYear]) {
            financialYears[item.financialYear].tm.push(item);
        }
    });
    
    tme.forEach(item => {
        if (item.financialYear && financialYears[item.financialYear]) {
            financialYears[item.financialYear].tme.push(item);
        }
    });
    
    // Sort financial years
    const sortedFYs = Object.keys(financialYears).sort();
    
    let tableRows = '';
    let peTotals = { Approved: 0, Blacklisted: 0, Inactive: 0, Pending: 0, Suspended: 0, Total: 0 };
    let tmTotals = { Approved: 0, Blacklisted: 0, DeRegistered: 0, Inactive: 0, Pending: 0, Suspended: 0, Total: 0 };
    let tmeTotals = { Approved: 0, Blacklisted: 0, Inactive: 0, Pending: 0, Suspended: 0, Total: 0 };
    
    sortedFYs.forEach(fy => {
        const data = financialYears[fy];
        
        const peApproved = this.countByStatus(data.pe, 'Approved');
        const peBlacklisted = this.countByStatus(data.pe, 'Blacklisted');
        const peInactive = this.countByStatus(data.pe, 'Inactive');
        const pePending = this.countByStatus(data.pe, 'Pending');
        const peSuspended = this.countByStatus(data.pe, 'Suspended');
        const peTotal = data.pe.length;
        
        const tmApproved = this.countByStatus(data.tm, 'Approved');
        const tmBlacklisted = this.countByStatus(data.tm, 'Blacklisted');
        const tmDeRegistered = this.countByStatus(data.tm, 'De-Registered');
        const tmInactive = this.countByStatus(data.tm, 'Inactive');
        const tmPending = this.countByStatus(data.tm, 'Pending');
        const tmSuspended = this.countByStatus(data.tm, 'Suspended');
        const tmTotal = data.tm.length;
        
        const tmeApproved = this.countByStatus(data.tme, 'Approved');
        const tmeBlacklisted = this.countByStatus(data.tme, 'Blacklisted');
        const tmeInactive = this.countByStatus(data.tme, 'Inactive');
        const tmePending = this.countByStatus(data.tme, 'Pending');
        const tmeSuspended = this.countByStatus(data.tme, 'Suspended');
        const tmeTotal = data.tme.length;
        
        // Accumulate totals
        peTotals.Approved += peApproved;
        peTotals.Blacklisted += peBlacklisted;
        peTotals.Inactive += peInactive;
        peTotals.Pending += pePending;
        peTotals.Suspended += peSuspended;
        peTotals.Total += peTotal;
        
        tmTotals.Approved += tmApproved;
        tmTotals.Blacklisted += tmBlacklisted;
        tmTotals.DeRegistered += tmDeRegistered;
        tmTotals.Inactive += tmInactive;
        tmTotals.Pending += tmPending;
        tmTotals.Suspended += tmSuspended;
        tmTotals.Total += tmTotal;
        
        tmeTotals.Approved += tmeApproved;
        tmeTotals.Blacklisted += tmeBlacklisted;
        tmeTotals.Inactive += tmeInactive;
        tmeTotals.Pending += tmePending;
        tmeTotals.Suspended += tmeSuspended;
        tmeTotals.Total += tmeTotal;
        
        tableRows += `
            <tr>
                <td><strong>${fy}</strong></td>
                <!-- PE data FIRST -->
                <td>${this.formatDisplayNumber(peApproved)}</td>
                <td>${this.formatDisplayNumber(peBlacklisted)}</td>
                <td>${this.formatDisplayNumber(peInactive)}</td>
                <td>${this.formatDisplayNumber(pePending)}</td>
                <td>${this.formatDisplayNumber(peSuspended)}</td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(peTotal)}</strong></td>
                
                <!-- TM data SECOND -->
                <td>${this.formatDisplayNumber(tmApproved)}</td>
                <td>${this.formatDisplayNumber(tmBlacklisted)}</td>
                <td>${this.formatDisplayNumber(tmDeRegistered)}</td>
                <td>${this.formatDisplayNumber(tmInactive)}</td>
                <td>${this.formatDisplayNumber(tmPending)}</td>
                <td>${this.formatDisplayNumber(tmSuspended)}</td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotal)}</strong></td>
                
                <!-- TME data THIRD -->
                <td>${this.formatDisplayNumber(tmeApproved)}</td>
                <td>${this.formatDisplayNumber(tmeBlacklisted)}</td>
                <td>${this.formatDisplayNumber(tmeInactive)}</td>
                <td>${this.formatDisplayNumber(tmePending)}</td>
                <td>${this.formatDisplayNumber(tmeSuspended)}</td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotal)}</strong></td>
            </tr>
        `;
    });

    // Add total row
    tableRows += `
        <tr class="total-row">
            <td><strong>Total</strong></td>
            <!-- PE totals -->
            <td class="total-cell"><strong>${this.formatDisplayNumber(peTotals.Approved)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(peTotals.Blacklisted)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(peTotals.Inactive)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(peTotals.Pending)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(peTotals.Suspended)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(peTotals.Total)}</strong></td>
            
            <!-- TM totals -->
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.Approved)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.Blacklisted)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.DeRegistered)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.Inactive)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.Pending)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.Suspended)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.Total)}</strong></td>
            
            <!-- TME totals -->
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotals.Approved)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotals.Blacklisted)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotals.Inactive)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotals.Pending)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotals.Suspended)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotals.Total)}</strong></td>
        </tr>
    `;

    return `
    <div class="ekyc-table-section">
        <h3>Financial Year Wise Status</h3>
        <table class="ekyc-summary-table financial-year-table">
            <thead>
                <tr>
                    <th rowspan="2">FY</th>
                    <th colspan="6">PE</th>
                    <th colspan="7">TM</th>
                    <th colspan="6">TME</th>
                </tr>
                <tr>
                    <!-- PE Sub Headers FIRST -->
                    <th>Approved</th>
                    <th>Blacklisted</th>
                    <th>Inactive</th>
                    <th>Pending</th>
                    <th>Suspended</th>
                    <th>Total</th>
                    
                    <!-- TM Sub Headers SECOND -->
                    <th>Approved</th>
                    <th>Blacklisted</th>
                    <th>De-Registered</th>
                    <th>Inactive</th>
                    <th>Pending</th>
                    <th>Suspended</th>
                    <th>Total</th>
                    
                    <!-- TME Sub Headers THIRD -->
                    <th>Approved</th>
                    <th>Blacklisted</th>
                    <th>Inactive</th>
                    <th>Pending</th>
                    <th>Suspended</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    </div>
    `;
}

buildCurrentFYMonthwiseHTML(pe, tm, tme) {
    const currentDate = new Date();
    const currentFY = this.getFinancialYear(currentDate);
    
    // Get months from April to current month for current financial year
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const currentMonthIndex = currentDate.getMonth(); // 0-11
    
    // Determine which months to show based on current date
    let monthsToShow = [];
    if (currentDate.getMonth() >= 3) { // April or later
        // Show from April to current month
        monthsToShow = months.slice(0, currentMonthIndex - 2); // Apr to current month
    } else {
        // Show from April to March (full year)
        monthsToShow = months;
    }
    
    let tableRows = '';
    let peTotals = { Approved: 0, Blacklisted: 0, Inactive: 0, Pending: 0, Suspended: 0, Total: 0 };
    let tmTotals = { Approved: 0, Blacklisted: 0, DeRegistered: 0, Inactive: 0, Pending: 0, Suspended: 0, Total: 0 };
    let tmeTotals = { Approved: 0, Blacklisted: 0, Inactive: 0, Pending: 0, Suspended: 0, Total: 0 };
    
    monthsToShow.forEach(month => {
        // Filter data for current FY and specific month
        const monthPE = pe.filter(item => 
            item.financialYear === currentFY && 
            this.getMonthName(item.processedDate) === month
        );
        const monthTM = tm.filter(item => 
            item.financialYear === currentFY && 
            this.getMonthName(item.processedDate) === month
        );
        const monthTME = tme.filter(item => 
            item.financialYear === currentFY && 
            this.getMonthName(item.processedDate) === month
        );
        
        const peApproved = this.countByStatus(monthPE, 'Approved');
        const peBlacklisted = this.countByStatus(monthPE, 'Blacklisted');
        const peInactive = this.countByStatus(monthPE, 'Inactive');
        const pePending = this.countByStatus(monthPE, 'Pending');
        const peSuspended = this.countByStatus(monthPE, 'Suspended');
        const peTotal = monthPE.length;
        
        const tmApproved = this.countByStatus(monthTM, 'Approved');
        const tmBlacklisted = this.countByStatus(monthTM, 'Blacklisted');
        const tmDeRegistered = this.countByStatus(monthTM, 'De-Registered');
        const tmInactive = this.countByStatus(monthTM, 'Inactive');
        const tmPending = this.countByStatus(monthTM, 'Pending');
        const tmSuspended = this.countByStatus(monthTM, 'Suspended');
        const tmTotal = monthTM.length;
        
        const tmeApproved = this.countByStatus(monthTME, 'Approved');
        const tmeBlacklisted = this.countByStatus(monthTME, 'Blacklisted');
        const tmeInactive = this.countByStatus(monthTME, 'Inactive');
        const tmePending = this.countByStatus(monthTME, 'Pending');
        const tmeSuspended = this.countByStatus(monthTME, 'Suspended');
        const tmeTotal = monthTME.length;
        
        // Accumulate totals
        peTotals.Approved += peApproved;
        peTotals.Blacklisted += peBlacklisted;
        peTotals.Inactive += peInactive;
        peTotals.Pending += pePending;
        peTotals.Suspended += peSuspended;
        peTotals.Total += peTotal;
        
        tmTotals.Approved += tmApproved;
        tmTotals.Blacklisted += tmBlacklisted;
        tmTotals.DeRegistered += tmDeRegistered;
        tmTotals.Inactive += tmInactive;
        tmTotals.Pending += tmPending;
        tmTotals.Suspended += tmSuspended;
        tmTotals.Total += tmTotal;
        
        tmeTotals.Approved += tmeApproved;
        tmeTotals.Blacklisted += tmeBlacklisted;
        tmeTotals.Inactive += tmeInactive;
        tmeTotals.Pending += tmePending;
        tmeTotals.Suspended += tmeSuspended;
        tmeTotals.Total += tmeTotal;
        
        tableRows += `
            <tr>
                <td><strong>${month}</strong></td>
                <!-- PE data FIRST -->
                <td>${this.formatDisplayNumber(peApproved)}</td>
                <td>${this.formatDisplayNumber(peBlacklisted)}</td>
                <td>${this.formatDisplayNumber(peInactive)}</td>
                <td>${this.formatDisplayNumber(pePending)}</td>
                <td>${this.formatDisplayNumber(peSuspended)}</td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(peTotal)}</strong></td>
                
                <!-- TM data SECOND -->
                <td>${this.formatDisplayNumber(tmApproved)}</td>
                <td>${this.formatDisplayNumber(tmBlacklisted)}</td>
                <td>${this.formatDisplayNumber(tmDeRegistered)}</td>
                <td>${this.formatDisplayNumber(tmInactive)}</td>
                <td>${this.formatDisplayNumber(tmPending)}</td>
                <td>${this.formatDisplayNumber(tmSuspended)}</td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotal)}</strong></td>
                
                <!-- TME data THIRD -->
                <td>${this.formatDisplayNumber(tmeApproved)}</td>
                <td>${this.formatDisplayNumber(tmeBlacklisted)}</td>
                <td>${this.formatDisplayNumber(tmeInactive)}</td>
                <td>${this.formatDisplayNumber(tmePending)}</td>
                <td>${this.formatDisplayNumber(tmeSuspended)}</td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotal)}</strong></td>
            </tr>
        `;
    });

    // Add total row
    tableRows += `
        <tr class="total-row">
            <td><strong>Total</strong></td>
            <!-- PE totals -->
            <td class="total-cell"><strong>${this.formatDisplayNumber(peTotals.Approved)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(peTotals.Blacklisted)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(peTotals.Inactive)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(peTotals.Pending)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(peTotals.Suspended)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(peTotals.Total)}</strong></td>
            
            <!-- TM totals -->
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.Approved)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.Blacklisted)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.DeRegistered)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.Inactive)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.Pending)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.Suspended)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.Total)}</strong></td>
            
            <!-- TME totals -->
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotals.Approved)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotals.Blacklisted)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotals.Inactive)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotals.Pending)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotals.Suspended)}</strong></td>
            <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotals.Total)}</strong></td>
        </tr>
    `;

    return `
    <div class="ekyc-table-section">
        <h3>Monthly Status</h3>
        <table class="ekyc-summary-table month-wise-table">
            <thead>
                <tr>
                    <th rowspan="2">Month</th>
                    <th colspan="6">PE</th>
                    <th colspan="7">TM</th>
                    <th colspan="6">TME</th>
                </tr>
                <tr>
                    <!-- PE Sub Headers FIRST -->
                    <th>Approved</th>
                    <th>Blacklisted</th>
                    <th>Inactive</th>
                    <th>Pending</th>
                    <th>Suspended</th>
                    <th>Total</th>
                    
                    <!-- TM Sub Headers SECOND -->
                    <th>Approved</th>
                    <th>Blacklisted</th>
                    <th>De-Registered</th>
                    <th>Inactive</th>
                    <th>Pending</th>
                    <th>Suspended</th>
                    <th>Total</th>
                    
                    <!-- TME Sub Headers THIRD -->
                    <th>Approved</th>
                    <th>Blacklisted</th>
                    <th>Inactive</th>
                    <th>Pending</th>
                    <th>Suspended</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    </div>
    `;
}

buildCurrentMonthDaywiseHTML(pe, tm, tme) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const currentDay = currentDate.getDate();
    
    let tableRows = '';
    let peTotals = { Approved: 0, Blacklisted: 0, Inactive: 0, Pending: 0, Suspended: 0, Total: 0 };
    let tmTotals = { Approved: 0, Blacklisted: 0, DeRegistered: 0, Inactive: 0, Pending: 0, Suspended: 0, Total: 0 };
    let tmeTotals = { Approved: 0, Blacklisted: 0, Inactive: 0, Pending: 0, Suspended: 0, Total: 0 };
    let hasData = false;
    
    for (let day = 1; day <= currentDay; day++) {
        // Filter data for current month and specific day
        const dayPE = pe.filter(item => 
            item.processedDate && 
            item.processedDate.getMonth() + 1 === currentMonth &&
            item.processedDate.getFullYear() === currentYear &&
            item.processedDate.getDate() === day
        );
        const dayTM = tm.filter(item => 
            item.processedDate && 
            item.processedDate.getMonth() + 1 === currentMonth &&
            item.processedDate.getFullYear() === currentYear &&
            item.processedDate.getDate() === day
        );
        const dayTME = tme.filter(item => 
            item.processedDate && 
            item.processedDate.getMonth() + 1 === currentMonth &&
            item.processedDate.getFullYear() === currentYear &&
            item.processedDate.getDate() === day
        );
        
        // Only show rows with data
        if (dayPE.length > 0 || dayTM.length > 0 || dayTME.length > 0) {
            hasData = true;
            const dateStr = `${day.toString().padStart(2, '0')}-${currentMonth.toString().padStart(2, '0')}-${currentYear}`;
            
            const peApproved = this.countByStatus(dayPE, 'Approved');
            const peBlacklisted = this.countByStatus(dayPE, 'Blacklisted');
            const peInactive = this.countByStatus(dayPE, 'Inactive');
            const pePending = this.countByStatus(dayPE, 'Pending');
            const peSuspended = this.countByStatus(dayPE, 'Suspended');
            const peTotal = dayPE.length;
            
            const tmApproved = this.countByStatus(dayTM, 'Approved');
            const tmBlacklisted = this.countByStatus(dayTM, 'Blacklisted');
            const tmDeRegistered = this.countByStatus(dayTM, 'De-Registered');
            const tmInactive = this.countByStatus(dayTM, 'Inactive');
            const tmPending = this.countByStatus(dayTM, 'Pending');
            const tmSuspended = this.countByStatus(dayTM, 'Suspended');
            const tmTotal = dayTM.length;
            
            const tmeApproved = this.countByStatus(dayTME, 'Approved');
            const tmeBlacklisted = this.countByStatus(dayTME, 'Blacklisted');
            const tmeInactive = this.countByStatus(dayTME, 'Inactive');
            const tmePending = this.countByStatus(dayTME, 'Pending');
            const tmeSuspended = this.countByStatus(dayTME, 'Suspended');
            const tmeTotal = dayTME.length;
            
            // Accumulate totals
            peTotals.Approved += peApproved;
            peTotals.Blacklisted += peBlacklisted;
            peTotals.Inactive += peInactive;
            peTotals.Pending += pePending;
            peTotals.Suspended += peSuspended;
            peTotals.Total += peTotal;
            
            tmTotals.Approved += tmApproved;
            tmTotals.Blacklisted += tmBlacklisted;
            tmTotals.DeRegistered += tmDeRegistered;
            tmTotals.Inactive += tmInactive;
            tmTotals.Pending += tmPending;
            tmTotals.Suspended += tmSuspended;
            tmTotals.Total += tmTotal;
            
            tmeTotals.Approved += tmeApproved;
            tmeTotals.Blacklisted += tmeBlacklisted;
            tmeTotals.Inactive += tmeInactive;
            tmeTotals.Pending += tmePending;
            tmeTotals.Suspended += tmeSuspended;
            tmeTotals.Total += tmeTotal;
            
            tableRows += `
                <tr>
                    <td><strong>${dateStr}</strong></td>
                    <!-- PE data FIRST -->
                    <td>${this.formatDisplayNumber(peApproved)}</td>
                    <td>${this.formatDisplayNumber(peBlacklisted)}</td>
                    <td>${this.formatDisplayNumber(peInactive)}</td>
                    <td>${this.formatDisplayNumber(pePending)}</td>
                    <td>${this.formatDisplayNumber(peSuspended)}</td>
                    <td class="total-cell"><strong>${this.formatDisplayNumber(peTotal)}</strong></td>
                    
                    <!-- TM data SECOND -->
                    <td>${this.formatDisplayNumber(tmApproved)}</td>
                    <td>${this.formatDisplayNumber(tmBlacklisted)}</td>
                    <td>${this.formatDisplayNumber(tmDeRegistered)}</td>
                    <td>${this.formatDisplayNumber(tmInactive)}</td>
                    <td>${this.formatDisplayNumber(tmPending)}</td>
                    <td>${this.formatDisplayNumber(tmSuspended)}</td>
                    <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotal)}</strong></td>
                    
                    <!-- TME data THIRD -->
                    <td>${this.formatDisplayNumber(tmeApproved)}</td>
                    <td>${this.formatDisplayNumber(tmeBlacklisted)}</td>
                    <td>${this.formatDisplayNumber(tmeInactive)}</td>
                    <td>${this.formatDisplayNumber(tmePending)}</td>
                    <td>${this.formatDisplayNumber(tmeSuspended)}</td>
                    <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotal)}</strong></td>
                </tr>
            `;
        }
    }

    // Add total row if there's data
    if (hasData) {
        tableRows += `
            <tr class="total-row">
                <td><strong>Total</strong></td>
                <!-- PE totals -->
                <td class="total-cell"><strong>${this.formatDisplayNumber(peTotals.Approved)}</strong></td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(peTotals.Blacklisted)}</strong></td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(peTotals.Inactive)}</strong></td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(peTotals.Pending)}</strong></td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(peTotals.Suspended)}</strong></td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(peTotals.Total)}</strong></td>
                
                <!-- TM totals -->
                <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.Approved)}</strong></td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.Blacklisted)}</strong></td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.DeRegistered)}</strong></td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.Inactive)}</strong></td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.Pending)}</strong></td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.Suspended)}</strong></td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(tmTotals.Total)}</strong></td>
                
                <!-- TME totals -->
                <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotals.Approved)}</strong></td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotals.Blacklisted)}</strong></td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotals.Inactive)}</strong></td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotals.Pending)}</strong></td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotals.Suspended)}</strong></td>
                <td class="total-cell"><strong>${this.formatDisplayNumber(tmeTotals.Total)}</strong></td>
            </tr>
        `;
    }

    return `
    <div class="ekyc-table-section">
        <h3>Day-wise Status</h3>
        <table class="ekyc-summary-table day-wise-table">
            <thead>
                <tr>
                    <th rowspan="2">Date</th>
                    <th colspan="6">PE</th>
                    <th colspan="7">TM</th>
                    <th colspan="6">TME</th>
                </tr>
                <tr>
                    <!-- PE Sub Headers FIRST -->
                    <th>Approved</th>
                    <th>Blacklisted</th>
                    <th>Inactive</th>
                    <th>Pending</th>
                    <th>Suspended</th>
                    <th>Total</th>
                    
                    <!-- TM Sub Headers SECOND -->
                    <th>Approved</th>
                    <th>Blacklisted</th>
                    <th>De-Registered</th>
                    <th>Inactive</th>
                    <th>Pending</th>
                    <th>Suspended</th>
                    <th>Total</th>
                    
                    <!-- TME Sub Headers THIRD -->
                    <th>Approved</th>
                    <th>Blacklisted</th>
                    <th>Inactive</th>
                    <th>Pending</th>
                    <th>Suspended</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows || '<tr><td colspan="20" style="text-align: center; padding: 20px;">No data available for current month</td></tr>'}
            </tbody>
        </table>
    </div>
    `;
}

    getMonthName(date) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return monthNames[date.getMonth()];
    }

    countByStatus(data, status) {
        return (data || []).filter(item => {
            const itemStatus = item.processedStatus || (item.Status || item.status || item.STATUS || '').toString();
            const normTarget = this.normalizeKey(status);
            const normItem = this.normalizeKey(itemStatus);
            return normItem === normTarget;
        }).length;
    }

    formatDisplayNumber(num) {
        if (!num || num === 0) return '-';
        // Remove commas from numbers
        return num.toString();
    }

    normalizeKey(s) {
        if (!s && s !== 0) return '';
        return s.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    formatNumber(num) {
        // Remove commas from numbers
        return num.toString();
    }

    copyEKYCReport() {
        const dashboardContainer = document.querySelector('.ekyc-dashboard-container');
        if (!dashboardContainer) return;

        // Use html2canvas to capture the dashboard as an image
        html2canvas(dashboardContainer, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            // Convert canvas to blob
            canvas.toBlob(blob => {
                // Create clipboard item
                const item = new ClipboardItem({ 'image/png': blob });
                navigator.clipboard.write([item]).then(() => {
                    alert('Copied to clipboard!');
                }).catch(err => {
                    console.error('Failed to copy image: ', err);
                    alert('Failed to copy dashboard. Please try again or take a screenshot.');
                });
            });
        }).catch(err => {
            console.error('Failed to capture dashboard: ', err);
            alert('Failed to capture dashboard. Please try again.');
        });
    }
}

// Initialize EKYC Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏁 DOM loaded - initializing EKYC Manager');
    window.ekycManager = new EKYCManager();
});

// Make functions globally available
window.generateEKYCReport = function() {
    if (window.ekycManager) {
        window.ekycManager.generateEKYCReport();
    }
};

window.closeEkycUploadModal = function() {
    if (window.ekycManager) {
        window.ekycManager.closeEkycUploadModal();
    }
};