// EKYC Summary - Completely Fixed Version
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

        // Close EKYC Modal
        const closeEkycBtn = document.getElementById('closeEkycModal');
        if (closeEkycBtn) {
            closeEkycBtn.addEventListener('click', () => this.closeEkycUploadModal());
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
        this.clearEkycFileInputs();
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
            generateBtn.style.background = 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)';
            instructions.textContent = 'All files ready';
            instructions.style.color = '#27ae60';
            instructions.classList.add('ready');
            console.log('✅ All files ready - generate button enabled');
        } else {
            generateBtn.disabled = true;
            generateBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            instructions.textContent = 'Drop or select CSV';
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
        document.getElementById('ekycUploadInstructions').textContent = 'Drop or select CSV';
        document.getElementById('ekycUploadInstructions').style.color = '#666';
    }

    async generateEKYCReport() {
        console.log('🚀 Starting EKYC report generation...');
        
        const entitiesFile = document.getElementById('ekycEntitiesFileInput').files[0];
        const tmFile = document.getElementById('ekycTmFileInput').files[0];
        const tmEntitiesFile = document.getElementById('ekycTmEntitiesFileInput').files[0];

        if (!entitiesFile || !tmFile || !tmEntitiesFile) {
            alert('Please upload all three EKYC files.');
            return;
        }

        // Close modal immediately
        this.closeEkycUploadModal();
        
        // Show loading
        const outputDiv = document.getElementById('ekycReportOutput');
        if (outputDiv) {
            outputDiv.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
                    <div>Processing EKYC files...</div>
                    <div style="font-size: 12px; margin-top: 10px;">This may take a few seconds</div>
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

            // Filter out inprogress records
            const filteredEntities = this.filterInProgress(this.ekycEntitiesData);
            const filteredTM = this.filterInProgress(this.ekycTMData);
            const filteredTME = this.filterInProgress(this.ekycTMEntitiesData);

            console.log('✅ Data filtered:', {
                entities: filteredEntities.length,
                tm: filteredTM.length,
                tme: filteredTME.length
            });

            // Update stats
            this.updateEkycStats(filteredEntities, filteredTM, filteredTME);
            
            // Render dashboard
            this.renderCompactDashboard(filteredEntities, filteredTM, filteredTME);
            
            console.log('🎉 EKYC dashboard rendered successfully');

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

    updateEkycStats(pe, tm, tme) {
        const statsContainer = document.getElementById('ekycStatsContainer');
        if (statsContainer) {
            statsContainer.style.display = 'grid';
            
            document.getElementById('totalTM').textContent = this.formatNumber(tm.length);
            document.getElementById('totalPE').textContent = this.formatNumber(pe.length);
            document.getElementById('totalTME').textContent = this.formatNumber(tme.length);
            
            const totalApproved = this.countByStatus(tm, 'Approved') + 
                                this.countByStatus(pe, 'Approved') + 
                                this.countByStatus(tme, 'Approved');
            document.getElementById('totalApprovedEkyc').textContent = this.formatNumber(totalApproved);
            
            console.log('📈 Stats updated');
        }
    }

    renderCompactDashboard(pe, tm, tme) {
        console.log('🎨 Rendering dashboard...');
        
        const overviewHTML = this.buildOverviewHTML(pe, tm, tme);
        const fyHTML = this.buildFinancialYearHTML(pe, tm, tme);
        const monthHTML = this.buildCurrentFYMonthwiseHTML(pe, tm, tme);
        const dayHTML = this.buildCurrentMonthDaywiseHTML(pe, tm, tme);

        const outputDiv = document.getElementById('ekycReportOutput');
        if (outputDiv) {
            outputDiv.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    ${overviewHTML}
                    ${fyHTML}
                    ${monthHTML}
                    ${dayHTML}
                </div>
            `;
        }
        
        console.log('✅ Dashboard rendered');
    }

    // Add your existing table building functions here...
    buildOverviewHTML(pe, tm, tme) {
        const peTotal = pe.length;
        const tmTotal = tm.length;
        const tmeTotal = tme.length;

        return `
        <div class="table-section">
            <h3>Overview</h3>
            <table class="compact-table">
                <thead>
                    <tr>
                        <th>Category</th><th>Total</th><th>Approved</th><th>Pending</th>
                        <th>Suspended</th><th>Blacklisted</th><th>Inactive</th><th>De-Registered</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>PE</strong></td>
                        <td>${peTotal}</td>
                        <td>${this.countByStatus(pe, 'Approved')}</td>
                        <td>${this.countByStatus(pe, 'Pending')}</td>
                        <td>${this.countByStatus(pe, 'Suspended')}</td>
                        <td>${this.countByStatus(pe, 'Blacklisted')}</td>
                        <td>${this.countByStatus(pe, 'Inactive')}</td>
                        <td>-</td>
                    </tr>
                    <tr>
                        <td><strong>TM</strong></td>
                        <td>${tmTotal}</td>
                        <td>${this.countByStatus(tm, 'Approved')}</td>
                        <td>${this.countByStatus(tm, 'Pending')}</td>
                        <td>${this.countByStatus(tm, 'Suspended')}</td>
                        <td>${this.countByStatus(tm, 'Blacklisted')}</td>
                        <td>${this.countByStatus(tm, 'Inactive')}</td>
                        <td>${this.countByStatus(tm, 'De-Registered')}</td>
                    </tr>
                    <tr>
                        <td><strong>TME</strong></td>
                        <td>${tmeTotal}</td>
                        <td>${this.countByStatus(tme, 'Approved')}</td>
                        <td>${this.countByStatus(tme, 'Pending')}</td>
                        <td>${this.countByStatus(tme, 'Suspended')}</td>
                        <td>${this.countByStatus(tme, 'Blacklisted')}</td>
                        <td>${this.countByStatus(tme, 'Inactive')}</td>
                        <td>-</td>
                    </tr>
                </tbody>
            </table>
        </div>
        `;
    }

    buildFinancialYearHTML(pe, tm, tme) {
        // Add your existing financial year table logic here
        return `<div class="table-section">
            <h3>Financial Year Status</h3>
            <div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 6px;">
                Financial Year table will be displayed here
            </div>
        </div>`;
    }

    buildCurrentFYMonthwiseHTML(pe, tm, tme) {
        // Add your existing month-wise table logic here
        return `<div class="table-section">
            <h3>Current FY Month-wise</h3>
            <div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 6px;">
                Month-wise table will be displayed here
            </div>
        </div>`;
    }

    buildCurrentMonthDaywiseHTML(pe, tm, tme) {
        // Add your existing day-wise table logic here
        return `<div class="table-section">
            <h3>Current Month Day-wise</h3>
            <div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 6px;">
                Day-wise table will be displayed here
            </div>
        </div>`;
    }

    // Utility methods
    normalizeKey(s) {
        if (!s && s !== 0) return '';
        return s.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    countByStatus(data, status) {
        return (data || []).filter(item => {
            const itemStatus = (item.Status || item.status || item.STATUS || '').toString();
            const normTarget = this.normalizeKey(status);
            const normItem = this.normalizeKey(itemStatus);
            return normItem === normTarget;
        }).length;
    }

    formatNumber(num) {
        return num.toLocaleString();
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
