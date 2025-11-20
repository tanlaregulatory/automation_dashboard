class RevenueDashboard {
    constructor() {
        this.currentDate = new Date();
        this.currentYear = this.currentDate.getFullYear();
        this.lastYear = this.currentYear - 1;
        this.currentMonth = this.currentDate.getMonth();
        this.data = {
            vilPayments: [],
            entityData: [],
            tmData: [],
            tmeData: []
        };
        this.dashboardData = {};
        this.initialized = false;
    }

    async initializeDashboard() {
        const timeout = setTimeout(() => {
            this.showError('Process timeout - taking too long. Please try with smaller files.');
            this.showLoading(false);
        }, 30000);

        try {
            console.log('=== REVENUE DASHBOARD START ===');
            this.setupEventListeners();
            
            this.showLoading(true);
            
            console.log('Step 1: Loading files');
            await this.loadData();
            
            console.log('Step 2: Checking data');
            
            console.log('Data loaded:', {
                vilPayments: this.data.vilPayments.length,
                entityData: this.data.entityData.length,
                tmData: this.data.tmData.length,
                tmeData: this.data.tmeData.length
            });

            if (this.data.vilPayments.length === 0) {
                throw new Error('No data found in uploaded files. Please check file format and column names.');
            }
            
            console.log('Step 3: Processing data with VLOOKUP logic');
            await this.processData();
            
            console.log('Step 4: Calculating metrics');
            this.calculateLYTDComparison();
            this.calculateLMTDComparison();
            
            this.calculateRevenueReport();
            this.calculateDaywiseRevenue();
            
            console.log('Step 5: Rendering');
            this.renderDashboard();
            
            this.showLoading(false);
            this.initialized = true;
            
            console.log('=== REVENUE DASHBOARD COMPLETE ===');
            return Promise.resolve();
            
        } catch (error) {
            console.error('=== DASHBOARD ERROR ===', error);
            this.showLoading(false);
            this.showError('Failed to initialize: ' + error.message);
            return Promise.reject(error);
        } finally {
            clearTimeout(timeout);
        }
    }

    async loadData() {
        try {
            console.log('Loading revenue data from uploaded files...');
            
            const vilFile = document.getElementById('vilPaymentFileInput').files[0];
            const entityFile = document.getElementById('entitySheetFileInput').files[0];
            const tmFile = document.getElementById('tmSheetFileInput').files[0];
            const tmeFile = document.getElementById('tmeSheetFileInput').files[0];
            
            if (!vilFile) {
                throw new Error('VIL Payment sheet is required');
            }
            
            console.log('Files found:', {
                vilFile: vilFile ? vilFile.name : 'None',
                entityFile: entityFile ? entityFile.name : 'None',
                tmFile: tmFile ? tmFile.name : 'None',
                tmeFile: tmeFile ? tmeFile.name : 'None'
            });
            
            // Load files if they exist
            this.data.vilPayments = await this.readFile(vilFile);
            console.log('VIL Payments loaded:', this.data.vilPayments.length);
            
            if (this.data.vilPayments.length > 0) {
                console.log('VIL File Columns:', Object.keys(this.data.vilPayments[0]));
                console.log('First 3 VIL rows:', this.data.vilPayments.slice(0, 3));
            }
            
            if (entityFile) {
                this.data.entityData = await this.readFile(entityFile);
                console.log('Entity data loaded:', this.data.entityData.length);
                if (this.data.entityData.length > 0) {
                    console.log('Entity File Columns:', Object.keys(this.data.entityData[0]));
                }
            }
            
            if (tmFile) {
                this.data.tmData = await this.readFile(tmFile);
                console.log('TM data loaded:', this.data.tmData.length);
                if (this.data.tmData.length > 0) {
                    console.log('TM File Columns:', Object.keys(this.data.tmData[0]));
                }
            }
            
            if (tmeFile) {
                this.data.tmeData = await this.readFile(tmeFile);
                console.log('TME data loaded:', this.data.tmeData.length);
                if (this.data.tmeData.length > 0) {
                    console.log('TME File Columns:', Object.keys(this.data.tmeData[0]));
                }
            }
            
            if (this.data.vilPayments.length === 0) {
                throw new Error('No data found in VIL Payment sheet.');
            }
            
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const fileContent = e.target.result;
                    let jsonData = [];
                    
                    if (file.name.toLowerCase().endsWith('.csv')) {
                        const results = Papa.parse(fileContent, {
                            header: true,
                            skipEmptyLines: true,
                            dynamicTyping: false,
                            fastMode: false,
                            worker: false
                        });
                        
                        if (results.errors.length > 0) {
                            console.warn('CSV parsing warnings:', results.errors);
                        }
                        
                        jsonData = results.data;
                        console.log(`CSV file ${file.name} parsed:`, jsonData.length, 'rows');
                    } else {
                        throw new Error('Only CSV files are supported');
                    }
                    
                    // Filter out empty rows
                    jsonData = jsonData.filter(row => {
                        return Object.keys(row).some(key => 
                            row[key] !== null && 
                            row[key] !== undefined && 
                            row[key] !== '' &&
                            !(typeof row[key] === 'string' && row[key].trim() === '')
                        );
                    });
                    
                    resolve(jsonData);
                } catch (error) {
                    console.error('Error parsing file:', file.name, error);
                    reject(new Error(`Error reading file ${file.name}: ${error.message}`));
                }
            };
            
            reader.onerror = function(error) {
                console.error('File read error:', file.name, error);
                reject(new Error(`Error reading file ${file.name}`));
            };
            
            reader.readAsText(file);
        });
    }

    async processData() {
        console.log('Processing revenue data with VLOOKUP logic...');
        
        // Initialize dashboard data structure
        this.dashboardData = {
            lytd: { current: { new: 0, renewal: 0, total: 0 }, lastYear: { new: 0, renewal: 0, total: 0 }, percentages: { new: 0, renewal: 0, total: 0 } },
            lmtd: { current: { new: 0, renewal: 0, total: 0 }, lastMonth: { new: 0, renewal: 0, total: 0 }, percentages: { new: 0, renewal: 0, total: 0 } },
            revenueReport: { 
                details: {
                    Entity: { new: 0, renewal: 0, refunds: 0, newRev: 0, renewalRev: 0, deposit: 0, netRevenue: 0 },
                    TMS: { new: 0, renewal: 0, refunds: 0, newRev: 0, renewalRev: 0, deposit: 0, netRevenue: 0 },
                    'TM-D': { new: 0, renewal: 0, refunds: 0, newRev: 0, renewalRev: 0, deposit: 0, netRevenue: 0 },
                    'Fee Exemption': { new: 0, renewal: 0, refunds: 0, newRev: 0, renewalRev: 0, deposit: 0, netRevenue: 0 }
                },
                grandTotal: { new: 0, renewal: 0, newRev: 0, renewalRev: 0, deposit: 0, netRevenue: 0 }
            },
            daywiseRevenue: {}
        };
        
        // Process VIL payments with VLOOKUP logic
        await this.processVILPaymentsWithVLOOKUP();
        
        console.log('Data processing completed');
    }

    async processVILPaymentsWithVLOOKUP() {
        console.log('Processing VIL payments with VLOOKUP logic...');
        
        this.processedPayments = [];
        
        if (!this.data.vilPayments || this.data.vilPayments.length === 0) {
            console.error('No VIL payments data available');
            return;
        }
        
        // Get current month start date and day-1 (yesterday)
        const currentMonthStart = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const dayMinusOne = new Date(this.currentDate);
        dayMinusOne.setDate(dayMinusOne.getDate() - 1);
        
        console.log('=== PROCESSING DATE RANGE ===');
        console.log('Current date:', this.currentDate.toDateString());
        console.log('Processing from:', currentMonthStart.toDateString(), 'to:', dayMinusOne.toDateString());
        
        let processedCount = 0;
        let errorCount = 0;
        
        // Build lookup maps for VLOOKUP equivalent
        const entityLookupMap = this.buildEntityLookupMap();
        const tmLookupMap = this.buildTMLookupMap();
        
        // Process VIL payment rows
        for (let i = 0; i < this.data.vilPayments.length; i++) {
            try {
                const payment = this.data.vilPayments[i];
                
                // Get relevant columns
                const entityId = this.findColumnValue(payment, ['Entity ID', 'EntityID', 'Entity Id', 'entityId', 'entityid', 'ENTITYID']);
                const telemarketerId = this.findColumnValue(payment, ['Telemarketer ID', 'TelemarketerID', 'TM ID', 'TMID', 'TelemarketerId', 'telemarketerId']);
                const paidOn = this.findColumnValue(payment, ['Paid On', 'PaidOn', 'Paid Date', 'PaymentDate', 'Date', 'payment_date']);
                const amountPaid = this.findColumnValue(payment, ['Amount Paid', 'AmountPaid', 'Amount', 'Revenue', 'PaymentAmount', 'amount']);
                
                if (!paidOn) {
                    continue;
                }
                
                // Parse payment date
                const paidDate = this.parseCSVDate(paidOn);
                if (isNaN(paidDate.getTime())) {
                    continue;
                }
                
                const shortDate = this.formatDateForDaywise(paidDate);
                const amount = this.parseAmount(amountPaid);
                
                // Check if payment is within current month range (1st to day-1)
                const isInCurrentMonthRange = paidDate >= currentMonthStart && paidDate <= dayMinusOne;
                
                if (!isInCurrentMonthRange) {
                    continue;
                }
                
                // VLOOKUP LOGIC - ALWAYS MAP FIRST for ALL records
let applicationDate = null;
let functionType = null; // This should be here
let accountType = 'Entity';
let isFeeExemption = false;

// STEP 1: ALWAYS try to map via EntityID/TelemarketerID FIRST (for ALL records)
if (entityId && entityLookupMap[entityId]) {
    const entityData = entityLookupMap[entityId];
    applicationDate = entityData.applicationDate;
    accountType = 'Entity';
} else if (telemarketerId && tmLookupMap[telemarketerId]) {
    const tmData = tmLookupMap[telemarketerId];
    applicationDate = tmData.applicationDate;
    functionType = tmData.functionType; // This sets functionType
    
    if (functionType) {
        const funcTypeStr = String(functionType).toLowerCase();
        if (funcTypeStr.includes('delivery')) {
            accountType = 'TM-D';
        } else {
            accountType = 'TMS';
        }
    } else {
        accountType = 'TMS';
    }
}

// STEP 2: Now determine if it's fee exemption
if (amount === 0) {
    isFeeExemption = true;
    // Keep the accountType from mapping, but mark as Fee Exemption
    accountType = 'Fee Exemption';
}

                // Classification (New vs Renewal) based on application submission date
                let isNewAccount = false;
                
                if (isFeeExemption) {
                    // For fee exemption, check application date if available
                    if (applicationDate) {
                        if (applicationDate.getFullYear() === paidDate.getFullYear()) {
                            isNewAccount = true;
                        } else {
                            isNewAccount = false;
                        }
                    } else {
                        // If no application date, default to new
                        isNewAccount = true;
                    }
                } else if (applicationDate) {
                    if (applicationDate.getFullYear() === paidDate.getFullYear()) {
                        isNewAccount = true;
                    } else {
                        isNewAccount = false;
                    }
                } else {
                    isNewAccount = true;
                }
                
                const accountStatus = isNewAccount ? 'New' : 'Renewal';
                
                // Revenue Rules - EXCLUDE security deposit from net revenue
                let revenue = 0;
                let securityDeposit = 0;
                
                if (isFeeExemption) {
                    revenue = 0;
                    securityDeposit = 0;
                } else {
                    switch(accountType) {
                        case 'Entity':
                            revenue = 5900;
                            break;
                        case 'TMS':
                            revenue = 5900;
                            break;
                        case 'TM-D':
                            revenue = 5900;
                            securityDeposit = 50000;
                            break;
                    }
                }
                
                this.processedPayments.push({
                    entityId: entityId,
                    telemarketerId: telemarketerId,
                    paidDate: paidDate,
                    shortDate: shortDate,
                    accountType: accountType,
                    accountStatus: accountStatus,
                    revenue: revenue,
                    securityDeposit: securityDeposit,
                    amountPaid: amount,
                    paymentYear: paidDate.getFullYear(),
                    paymentMonth: paidDate.getMonth(),
                    applicationDate: applicationDate,
                    functionType: functionType,
                    isFeeExemption: isFeeExemption,
                    originalAmount: amount
                });
                
                processedCount++;
                
            } catch (error) {
                console.error('Error processing payment at index', i, ':', error);
                errorCount++;
            }
        }
        
        console.log(`VLOOKUP processing summary:
            Total processed: ${processedCount}
            Errors: ${errorCount}
            Final valid payments: ${this.processedPayments.length}
        `);
    }

    // Build lookup map for Entity data (PE and TM-E sheets)
    buildEntityLookupMap() {
        const lookupMap = {};
        
        // Process Entity data (PE sheet)
        this.data.entityData.forEach((entity, index) => {
            const entityId = this.findColumnValue(entity, [
                'Entity ID', 'EntityID', 'Entity Id', 'entityId', 'entityid', 'ENTITYID'
            ]);
            // First try Application Submitted Date
let appDateStr = this.findColumnValue(entity, [
    'ApplicationSubmittedDate', 'Application Submitted Date', 'SubmissionDate', 
    'ApplicationDate', 'application_date', 'SubmittedDate',
    'Application Submission Date', 'AppSubmissionDate', 'App Submitted Date'
]);

// If Application Submitted Date not found, try Requested Date as fallback
if (!appDateStr) {
    appDateStr = this.findColumnValue(entity, [
        'Requested Date', 'RequestedDate', 'RequestDate', 'RequestedOn',
        'RegistrationDate', 'Date'
    ]);
}
            
            if (entityId) {
                let appDate = null;
                if (appDateStr) {
                    appDate = this.parseCSVDate(appDateStr);
                    if (isNaN(appDate.getTime())) {
                        appDate = null;
                    }
                }
                
                lookupMap[entityId] = {
                    applicationDate: appDate,
                    source: 'PE'
                };
            }
        });
        
        // Process TM-E data
        this.data.tmeData.forEach((tme, index) => {
            const entityId = this.findColumnValue(tme, [
                'Entity ID', 'EntityID', 'Entity Id', 'entityId', 'entityid', 'ENTITYID'
            ]);
           // First try Application Submitted Date
let appDateStr = this.findColumnValue(tme, [
    'ApplicationSubmittedDate', 'Application Submitted Date', 'SubmissionDate', 
    'ApplicationDate', 'application_date', 'SubmittedDate',
    'Application Submission Date', 'AppSubmissionDate', 'App Submitted Date'
]);

// If Application Submitted Date not found, try Requested Date as fallback
if (!appDateStr) {
    appDateStr = this.findColumnValue(tme, [
        'Requested Date', 'RequestedDate', 'RequestDate', 'RequestedOn',
        'RegistrationDate', 'Date'
    ]);
}
            
            if (entityId) {
                let appDate = null;
                if (appDateStr) {
                    appDate = this.parseCSVDate(appDateStr);
                    if (isNaN(appDate.getTime())) {
                        appDate = null;
                    }
                }
                
                lookupMap[entityId] = {
                    applicationDate: appDate,
                    source: 'TM-E'
                };
            }
        });
        
        console.log('Entity lookup map built:', Object.keys(lookupMap).length, 'entities found');
        return lookupMap;
    }

    // Build lookup map for TM data (VIL_TM sheet)
buildTMLookupMap() {
    const lookupMap = {};
    
    // Process TM data (VIL_TM sheet)
    this.data.tmData.forEach((tm, index) => {
        const entityId = this.findColumnValue(tm, [
            'Entity ID', 'EntityID', 'Entity Id', 'entityId', 'entityid', 'ENTITYID'
        ]);
       // First try Application Submitted Date
        let appDateStr = this.findColumnValue(tm, [
            'ApplicationSubmittedDate', 'Application Submitted Date', 'SubmissionDate', 
            'ApplicationDate', 'application_date', 'SubmittedDate',
            'Application Submission Date', 'AppSubmissionDate', 'App Submitted Date'
        ]);

        // If Application Submitted Date not found, try Requested Date as fallback
        if (!appDateStr) {
            appDateStr = this.findColumnValue(tm, [
                'Requested Date', 'RequestedDate', 'RequestDate', 'RequestedOn',
                'RegistrationDate', 'Date'
            ]);
        }
        
        // Get functionType from TM data columns
        const functionType = this.findColumnValue(tm, [
            'Function', 'FunctionType', 'Type', 'Function Type', 'function', 'function_type'
        ]);
        
        if (entityId) {
            let appDate = null;
            if (appDateStr) {
                appDate = this.parseCSVDate(appDateStr);
                if (isNaN(appDate.getTime())) {
                    appDate = null;
                }
            }
            
            lookupMap[entityId] = {
                applicationDate: appDate,
                functionType: functionType,
                source: 'VIL_TM'
            };
        }
    });
    
    console.log('TM lookup map built:', Object.keys(lookupMap).length, 'TMs found');
    return lookupMap;
}
    calculateLYTDComparison() {
        console.log('Calculating LYTD comparison (day-1 only)...');
        
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const lastYear = currentYear - 1;
        
        // Current month payments (1st to day-1)
        const currentMonthStart = new Date(currentYear, currentMonth, 1);
        const dayMinusOne = new Date(currentDate);
        dayMinusOne.setDate(dayMinusOne.getDate() - 1);
        
        const currentMonthPayments = this.processedPayments.filter(payment => {
            const paymentDate = payment.paidDate;
            return paymentDate >= currentMonthStart && paymentDate <= dayMinusOne;
        });
        
        // Last year same period payments (1st to day-1 of same month)
        const lastYearStart = new Date(lastYear, currentMonth, 1);
        const lastYearEnd = new Date(lastYear, currentMonth, dayMinusOne.getDate());
        
        console.log('LYTD Date Range - Last Year:', lastYearStart.toDateString(), 'to', lastYearEnd.toDateString());
        
        // Process ALL payments to get historical data for last year
        const lastYearPayments = this.getAllProcessedPaymentsForYear(lastYear, currentMonth, dayMinusOne.getDate());
        
        // Calculate counts
        const currentNew = currentMonthPayments.filter(p => p.accountStatus === 'New').length;
        const currentRenewal = currentMonthPayments.filter(p => p.accountStatus === 'Renewal').length;
        const currentTotal = currentNew + currentRenewal;
        
        const lastYearNew = lastYearPayments.filter(p => p.accountStatus === 'New').length;
        const lastYearRenewal = lastYearPayments.filter(p => p.accountStatus === 'Renewal').length;
        const lastYearTotal = lastYearNew + lastYearRenewal;
        
        console.log('LYTD Counts - Current:', { new: currentNew, renewal: currentRenewal, total: currentTotal });
        console.log('LYTD Counts - Last Year:', { new: lastYearNew, renewal: lastYearRenewal, total: lastYearTotal });
        
        // Calculate percentages - single digit, no decimals
        const newPercent = lastYearNew !== 0 ? 
            Math.round(((currentNew - lastYearNew) / Math.abs(lastYearNew)) * 100) : 
            (currentNew > 0 ? 100 : 0);
            
        const renewalPercent = lastYearRenewal !== 0 ? 
            Math.round(((currentRenewal - lastYearRenewal) / Math.abs(lastYearRenewal)) * 100) : 
            (currentRenewal > 0 ? 100 : 0);
            
        const totalPercent = lastYearTotal !== 0 ? 
            Math.round(((currentTotal - lastYearTotal) / Math.abs(lastYearTotal)) * 100) : 
            (currentTotal > 0 ? 100 : 0);
        
        this.dashboardData.lytd = {
            current: { new: currentNew, renewal: currentRenewal, total: currentTotal },
            lastYear: { new: lastYearNew, renewal: lastYearRenewal, total: lastYearTotal },
            percentages: { new: newPercent, renewal: renewalPercent, total: totalPercent }
        };
    }

    // Get processed payments for specific year and month range
    getAllProcessedPaymentsForYear(targetYear, targetMonth, endDay) {
        console.log(`Getting historical payments for ${targetYear}-${targetMonth + 1} (day 1 to ${endDay})`);
        
        const historicalPayments = [];
        
        if (!this.data.vilPayments || this.data.vilPayments.length === 0) {
            return historicalPayments;
        }
        
        // Build lookup maps for VLOOKUP equivalent
        const entityLookupMap = this.buildEntityLookupMap();
        const tmLookupMap = this.buildTMLookupMap();
        
        // Date range for target period
        const targetStart = new Date(targetYear, targetMonth, 1);
        const targetEnd = new Date(targetYear, targetMonth, endDay);
        
        console.log(`Historical date range: ${targetStart.toDateString()} to ${targetEnd.toDateString()}`);
        
        // Process VIL payment rows for the target period
        for (let i = 0; i < this.data.vilPayments.length; i++) {
            try {
                const payment = this.data.vilPayments[i];
                
                // Get relevant columns
                const entityId = this.findColumnValue(payment, [
                    'Entity ID', 'EntityID', 'Entity Id', 'entityId', 'entityid', 'ENTITYID'
                ]);
                const telemarketerId = this.findColumnValue(payment, [
                    'Telemarketer ID', 'TelemarketerID', 'TM ID', 'TMID', 'TelemarketerId', 'telemarketerId'
                ]);
                const paidOn = this.findColumnValue(payment, [
                    'Paid On', 'PaidOn', 'Paid Date', 'PaymentDate', 'Date', 'payment_date'
                ]);
                const amountPaid = this.findColumnValue(payment, [
                    'Amount Paid', 'AmountPaid', 'Amount', 'Revenue', 'PaymentAmount', 'amount'
                ]);
                
                if (!paidOn) {
                    continue;
                }
                
                // Parse payment date
                const paidDate = this.parseCSVDate(paidOn);
                if (isNaN(paidDate.getTime())) {
                    continue;
                }
                
                // Check if payment is within target period
                if (paidDate < targetStart || paidDate > targetEnd) {
                    continue;
                }
                
                const shortDate = this.formatDateForDaywise(paidDate);
                const amount = this.parseAmount(amountPaid);
                
                // VLOOKUP LOGIC - ALWAYS MAP FIRST for ALL records
let applicationDate = null;
let functionType = null;
let accountType = 'Entity';
let isFeeExemption = false;

// STEP 1: ALWAYS try to map via EntityID/TelemarketerID FIRST (for ALL records)
if (entityId && entityLookupMap[entityId]) {
    const entityData = entityLookupMap[entityId];
    applicationDate = entityData.applicationDate;
    accountType = 'Entity';
} else if (telemarketerId && tmLookupMap[telemarketerId]) {
    const tmData = tmLookupMap[telemarketerId];
    applicationDate = tmData.applicationDate;
    functionType = tmData.functionType;
    
    if (functionType) {
        const funcTypeStr = String(functionType).toLowerCase();
        if (funcTypeStr.includes('delivery')) {
            accountType = 'TM-D';
        } else {
            accountType = 'TMS';
        }
    } else {
        accountType = 'TMS';
    }
}

// STEP 2: Now determine if it's fee exemption
if (amount === 0) {
    isFeeExemption = true;
    // Keep the accountType from mapping, but mark as Fee Exemption
    accountType = 'Fee Exemption';
}
                
                // Classification (New vs Renewal)
                let isNewAccount = false;
                
                if (isFeeExemption) {
                    if (applicationDate) {
                        if (applicationDate.getFullYear() === paidDate.getFullYear()) {
                            isNewAccount = true;
                        } else {
                            isNewAccount = false;
                        }
                    } else {
                        isNewAccount = true;
                    }
                } else if (applicationDate) {
                    if (applicationDate.getFullYear() === paidDate.getFullYear()) {
                        isNewAccount = true;
                    } else {
                        isNewAccount = false;
                    }
                } else {
                    isNewAccount = true;
                }
                
                const accountStatus = isNewAccount ? 'New' : 'Renewal';
                
                historicalPayments.push({
    entityId: entityId,
    telemarketerId: telemarketerId,
    paidDate: paidDate,
    shortDate: shortDate,
    accountType: accountType,
    accountStatus: accountStatus,
    paymentYear: paidDate.getFullYear(),
    paymentMonth: paidDate.getMonth(),
    applicationDate: applicationDate,
    functionType: functionType, // This was missing but now defined in VLOOKUP logic
    isFeeExemption: isFeeExemption
});
                
            } catch (error) {
                console.error('Error processing historical payment at index', i, ':', error);
            }
        }
        
        console.log(`Historical processing for ${targetYear} completed: ${historicalPayments.length} payments processed`);
        return historicalPayments;
    }

    calculateLMTDComparison() {
        console.log('Calculating LMTD comparison (day-1 only)...');
        
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        // Current month payments (1st to day-1)
        const currentMonthStart = new Date(currentYear, currentMonth, 1);
        const dayMinusOne = new Date(currentDate);
        dayMinusOne.setDate(dayMinusOne.getDate() - 1);
        
        const currentMonthPayments = this.processedPayments.filter(payment => {
            const paymentDate = payment.paidDate;
            return paymentDate >= currentMonthStart && paymentDate <= dayMinusOne;
        });
        
        // Last month same period payments (1st to day-1 of last month)
        const lastMonthStart = new Date(lastMonthYear, lastMonth, 1);
        const lastMonthEnd = new Date(lastMonthYear, lastMonth, dayMinusOne.getDate());
        
        console.log('LMTD Date Range - Last Month:', lastMonthStart.toDateString(), 'to', lastMonthEnd.toDateString());
        
        // Process payments for last month
        const lastMonthPayments = this.getAllProcessedPaymentsForYear(lastMonthYear, lastMonth, dayMinusOne.getDate());
        
        // Calculate counts
        const currentNew = currentMonthPayments.filter(p => p.accountStatus === 'New').length;
        const currentRenewal = currentMonthPayments.filter(p => p.accountStatus === 'Renewal').length;
        const currentTotal = currentNew + currentRenewal;
        
        const lastMonthNew = lastMonthPayments.filter(p => p.accountStatus === 'New').length;
        const lastMonthRenewal = lastMonthPayments.filter(p => p.accountStatus === 'Renewal').length;
        const lastMonthTotal = lastMonthNew + lastMonthRenewal;
        
        console.log('LMTD Counts - Current:', { new: currentNew, renewal: currentRenewal, total: currentTotal });
        console.log('LMTD Counts - Last Month:', { new: lastMonthNew, renewal: lastMonthRenewal, total: lastMonthTotal });
        
        // Calculate percentages - single digit, no decimals
        const newPercent = lastMonthNew !== 0 ? 
            Math.round(((currentNew - lastMonthNew) / Math.abs(lastMonthNew)) * 100) : 
            (currentNew > 0 ? 100 : 0);
            
        const renewalPercent = lastMonthRenewal !== 0 ? 
            Math.round(((currentRenewal - lastMonthRenewal) / Math.abs(lastMonthRenewal)) * 100) : 
            (currentRenewal > 0 ? 100 : 0);
            
        const totalPercent = lastMonthTotal !== 0 ? 
            Math.round(((currentTotal - lastMonthTotal) / Math.abs(lastMonthTotal)) * 100) : 
            (currentTotal > 0 ? 100 : 0);
        
        this.dashboardData.lmtd = {
            current: { new: currentNew, renewal: currentRenewal, total: currentTotal },
            lastMonth: { new: lastMonthNew, renewal: lastMonthRenewal, total: lastMonthTotal },
            percentages: { new: newPercent, renewal: renewalPercent, total: totalPercent }
        };
    }

    calculateRevenueReport() {
        console.log('Calculating revenue report (current month day-1 only)...');
        
        const currentDate = new Date();
        const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const dayMinusOne = new Date(currentDate);
        dayMinusOne.setDate(dayMinusOne.getDate() - 1);
        
        // Filter payments for current month only (1st to day-1)
        const currentMonthPayments = this.processedPayments.filter(payment => {
            const paymentDate = payment.paidDate;
            return paymentDate >= currentMonthStart && paymentDate <= dayMinusOne;
        });
        
        const revenueData = {
            Entity: { new: 0, renewal: 0, refunds: 0, newRev: 0, renewalRev: 0, deposit: 0, netRevenue: 0 },
            TMS: { new: 0, renewal: 0, refunds: 0, newRev: 0, renewalRev: 0, deposit: 0, netRevenue: 0 },
            'TM-D': { new: 0, renewal: 0, refunds: 0, newRev: 0, renewalRev: 0, deposit: 0, netRevenue: 0 },
            'Fee Exemption': { new: 0, renewal: 0, refunds: 0, newRev: 0, renewalRev: 0, deposit: 0, netRevenue: 0 }
        };
        
        currentMonthPayments.forEach(payment => {
            const type = payment.accountType;
            const isNew = payment.accountStatus === 'New';
            
            if (isNew) {
                revenueData[type].new++;
                revenueData[type].newRev += payment.revenue;
            } else {
                revenueData[type].renewal++;
                revenueData[type].renewalRev += payment.revenue;
            }
            
            revenueData[type].deposit += payment.securityDeposit;
            // NET REVENUE: Only newRev + renewalRev (EXCLUDE security deposit)
            revenueData[type].netRevenue = 
                revenueData[type].newRev + 
                revenueData[type].renewalRev;
        });
        
        // Calculate grand totals
        const grandTotal = {
            new: Object.values(revenueData).reduce((sum, type) => sum + type.new, 0),
            renewal: Object.values(revenueData).reduce((sum, type) => sum + type.renewal, 0),
            newRev: Object.values(revenueData).reduce((sum, type) => sum + type.newRev, 0),
            renewalRev: Object.values(revenueData).reduce((sum, type) => sum + type.renewalRev, 0),
            deposit: Object.values(revenueData).reduce((sum, type) => sum + type.deposit, 0),
            netRevenue: Object.values(revenueData).reduce((sum, type) => sum + type.netRevenue, 0)
        };
        
        this.dashboardData.revenueReport = {
            details: revenueData,
            grandTotal: grandTotal
        };
    }

    calculateDaywiseRevenue() {
        console.log('Calculating daywise revenue (LAST 5 DAYS only)...');
        
        const currentDate = new Date();
        const dayMinusOne = new Date(currentDate);
        dayMinusOne.setDate(dayMinusOne.getDate() - 1);
        
        // Get last 5 days (including day-1)
        const last5Days = [];
        for (let i = 4; i >= 0; i--) {
            const date = new Date(dayMinusOne);
            date.setDate(date.getDate() - i);
            last5Days.push(this.formatDateForDaywise(date));
        }
        
        console.log('Last 5 days to display:', last5Days);
        
        const daywiseData = {};
        
        // Initialize last 5 days
        last5Days.forEach(dateStr => {
            daywiseData[dateStr] = { 
                new: 0, 
                renewal: 0, 
                feeExemption: 0, 
                newRev: 0, 
                renewalRev: 0, 
                deposit: 0, 
                refunds: 0, 
                netRevenue: 0 
            };
        });
        
        // Populate with actual data from processedPayments
        this.processedPayments.forEach((payment, index) => {
            const dateStr = payment.shortDate;
            
            if (daywiseData[dateStr]) {
                const isNew = payment.accountStatus === 'New';
                const isFeeExemption = payment.accountType === 'Fee Exemption';
                
                if (isFeeExemption) {
                    daywiseData[dateStr].feeExemption++;
                } else if (isNew) {
                    daywiseData[dateStr].new++;
                    daywiseData[dateStr].newRev += payment.revenue;
                } else {
                    daywiseData[dateStr].renewal++;
                    daywiseData[dateStr].renewalRev += payment.revenue;
                }
                
                daywiseData[dateStr].deposit += payment.securityDeposit;
                // NET REVENUE: Only newRev + renewalRev (EXCLUDE security deposit)
                daywiseData[dateStr].netRevenue = 
                    daywiseData[dateStr].newRev + 
                    daywiseData[dateStr].renewalRev;
            }
        });
        
        this.dashboardData.daywiseRevenue = daywiseData;
        
        console.log('=== LAST 5 DAYS DATA ===');
        Object.keys(daywiseData).sort().forEach(date => {
            const data = daywiseData[date];
            console.log(`Date ${date}:`, {
                new: data.new,
                renewal: data.renewal,
                feeExemption: data.feeExemption,
                total: data.new + data.renewal + data.feeExemption,
                newRev: data.newRev,
                renewalRev: data.renewalRev,
                netRevenue: data.netRevenue
            });
        });
    }

    // Helper method for consistent daywise date formatting
    formatDateForDaywise(date) {
        try {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Error formatting date for daywise:', error);
            return '0000-00-00';
        }
    }

    renderDashboard() {
        try {
            console.log('Rendering dashboard...');
            const hasData = this.processedPayments && this.processedPayments.length > 0;
            
            this.toggleContentVisibility(hasData);
            
            if (hasData) {
                this.renderLYTDComparison();
                this.renderLMTDComparison();
                this.renderRevenueReport();
                this.renderDaywiseRevenue();
                this.setupCopyFunctionality();
                console.log('All dashboard components rendered');
            } else {
                this.showError('No valid data found for current month (day-1). Please check that your files have EntityID and PaidOn columns with valid dates.');
            }
            
        } catch (error) {
            console.error('Error rendering dashboard:', error);
            this.showError('Error rendering dashboard: ' + error.message);
        }
    }

    toggleContentVisibility(hasData) {
        try {
            const contentElement = document.getElementById('revenueContent');
            
            if (contentElement) {
                if (hasData) {
                    contentElement.style.display = 'block';
                } else {
                    contentElement.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error toggling content visibility:', error);
        }
    }

renderLYTDComparison() {
    try {
        const data = this.dashboardData.lytd;
        const container = document.getElementById('accountStatusTable');
        if (!container) return;
        
        const dayMinusOne = new Date(this.currentDate);
        dayMinusOne.setDate(dayMinusOne.getDate() - 1);
        
        // Get dynamic year displays
        const lastYearDisplay = `${this.lastYear}`;
        const currentYearDisplay = `${this.currentYear}`;
        const currentMonthName = this.currentDate.toLocaleDateString('en-US', { month: 'short' });
        
        const periodDisplay = `${currentMonthName}'${this.lastYear.toString().slice(-2)} vs ${currentMonthName}'${this.currentYear.toString().slice(-2)}`;
        
        container.innerHTML = `
            <h3>LAST YEAR TILL DATE</h3>
            <h4>${periodDisplay}</h4>
            <table class="revenue-table">
                <thead>
                    <tr>
                        <th rowspan="2">Period</th>
                        <th colspan="3">${this.lastYear}</th>
                        <th colspan="3">${this.currentYear}</th>
                        <th colspan="3">Growth %</th>
                    </tr>
                    <tr>
                        <th>New</th>
                        <th>Renewal</th>
                        <th>Total</th>
                        <th>New</th>
                        <th>Renewal</th>
                        <th>Total</th>
                        <th>New %</th>
                        <th>Renewal %</th>
                        <th>Overall %</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>${periodDisplay}</strong></td>
                        <td class="bold-number">${data.lastYear.new}</td>
                        <td class="bold-number">${data.lastYear.renewal}</td>
                        <td class="bold-number">${data.lastYear.total}</td>
                        <td class="bold-number">${data.current.new}</td>
                        <td class="bold-number">${data.current.renewal}</td>
                        <td class="bold-number">${data.current.total}</td>
                        <td class="${this.getPercentageClass(data.percentages.new)}">
                            ${this.getArrow(data.percentages.new)} ${data.percentages.new}%
                        </td>
                        <td class="${this.getPercentageClass(data.percentages.renewal)}">
                            ${this.getArrow(data.percentages.renewal)} ${data.percentages.renewal}%
                        </td>
                        <td class="${this.getPercentageClass(data.percentages.total)}">
                            ${this.getArrow(data.percentages.total)} ${data.percentages.total}%
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error rendering LYTD:', error);
    }
}

 renderLMTDComparison() {
    try {
        const data = this.dashboardData.lmtd;
        const container = document.getElementById('accountStatusTable');
        if (!container) return;
        
        const dayMinusOne = new Date(this.currentDate);
        dayMinusOne.setDate(dayMinusOne.getDate() - 1);
        
        // Get dynamic month names for current year
        const lastMonth = new Date(this.currentDate);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        const lastMonthName = lastMonth.toLocaleDateString('en-US', { month: 'short' });
        const currentMonthName = this.currentDate.toLocaleDateString('en-US', { month: 'short' });
        const year = this.currentDate.getFullYear().toString().slice(-2);
        
        const lastMonthDisplay = `${lastMonthName}'${year}`;
        const currentMonthDisplay = `${currentMonthName}'${year}`;
        
        const existingContent = container.innerHTML;
        container.innerHTML = existingContent + `
            <h3 style="margin-top: 20px;">LAST MONTH TILL DATE</h3>
            <h4>${lastMonthDisplay} vs ${currentMonthDisplay}</h4>
            <table class="revenue-table">
                <thead>
                    <tr>
                        <th rowspan="2">Period</th>
                        <th colspan="3">${lastMonthDisplay}</th>
                        <th colspan="3">${currentMonthDisplay}</th>
                        <th colspan="3">Growth %</th>
                    </tr>
                    <tr>
                        <th>New</th>
                        <th>Renewal</th>
                        <th>Total</th>
                        <th>New</th>
                        <th>Renewal</th>
                        <th>Total</th>
                        <th>New %</th>
                        <th>Renewal %</th>
                        <th>Overall %</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>${lastMonthDisplay} vs ${currentMonthDisplay}</strong></td>
                        <td class="bold-number">${data.lastMonth.new}</td>
                        <td class="bold-number">${data.lastMonth.renewal}</td>
                        <td class="bold-number">${data.lastMonth.total}</td>
                        <td class="bold-number">${data.current.new}</td>
                        <td class="bold-number">${data.current.renewal}</td>
                        <td class="bold-number">${data.current.total}</td>
                        <td class="${this.getPercentageClass(data.percentages.new)}">
                            ${this.getArrow(data.percentages.new)} ${data.percentages.new}%
                        </td>
                        <td class="${this.getPercentageClass(data.percentages.renewal)}">
                            ${this.getArrow(data.percentages.renewal)} ${data.percentages.renewal}%
                        </td>
                        <td class="${this.getPercentageClass(data.percentages.total)}">
                            ${this.getArrow(data.percentages.total)} ${data.percentages.total}%
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error rendering LMTD:', error);
    }
}
    renderRevenueReport() {
        try {
            const data = this.dashboardData.revenueReport;
            const container = document.getElementById('revenueTable');
            if (!container) return;
            
            let tableHTML = `
                <h3>REVENUE REPORT BY ACCOUNT WISE</h3>
                <table class="revenue-table">
                    <thead>
                        <tr>
                            <th>Account Type</th>
                            <th>New</th>
                            <th>Renewal</th>
                            <th>Total</th>
                            <th>New Revenue</th>
                            <th>Renewal Revenue</th>
                            <th>Total Revenue</th>
                            <th>Security Deposit</th>
                            <th>Net Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            Object.keys(data.details).forEach(type => {
                const row = data.details[type];
                const total = row.new + row.renewal;
                const totalRev = row.newRev + row.renewalRev;
                
                tableHTML += `
                    <tr>
                        <td><strong>${type}</strong></td>
                        <td class="bold-number">${row.new}</td>
                        <td class="bold-number">${row.renewal}</td>
                        <td class="bold-number">${total}</td>
                        <td class="bold-number">₹${this.formatNumber(row.newRev)}</td>
                        <td class="bold-number">₹${this.formatNumber(row.renewalRev)}</td>
                        <td class="bold-number">₹${this.formatNumber(totalRev)}</td>
                        <td class="bold-number">₹${this.formatNumber(row.deposit)}</td>
                        <td class="bold-number">₹${this.formatNumber(row.netRevenue)}</td>
                    </tr>
                `;
            });

            const grandTotal = data.grandTotal;
            const grandTotalCount = grandTotal.new + grandTotal.renewal;
            const grandTotalRev = grandTotal.newRev + grandTotal.renewalRev;

            tableHTML += `
                    <tr class="grand-total-row">
                        <td><strong>GRAND TOTAL</strong></td>
                        <td class="bold-number"><strong>${grandTotal.new}</strong></td>
                        <td class="bold-number"><strong>${grandTotal.renewal}</strong></td>
                        <td class="bold-number"><strong>${grandTotalCount}</strong></td>
                        <td class="bold-number"><strong>₹${this.formatNumber(grandTotal.newRev)}</strong></td>
                        <td class="bold-number"><strong>₹${this.formatNumber(grandTotal.renewalRev)}</strong></td>
                        <td class="bold-number"><strong>₹${this.formatNumber(grandTotalRev)}</strong></td>
                        <td class="bold-number"><strong>₹${this.formatNumber(grandTotal.deposit)}</strong></td>
                        <td class="bold-number"><strong>₹${this.formatNumber(grandTotal.netRevenue)}</strong></td>
                    </tr>
                </tbody>
            </table>
            `;

            container.innerHTML = tableHTML;
        } catch (error) {
            console.error('Error rendering revenue report:', error);
        }
    }

    renderDaywiseRevenue() {
        try {
            const data = this.dashboardData.daywiseRevenue;
            const container = document.getElementById('daywiseRevenue');
            if (!container) return;
            
            // Get ALL dates and sort them in descending order (newest first)
            const dates = Object.keys(data).sort().reverse();
            
            console.log('Rendering daywise revenue for dates:', dates);
            
            if (dates.length === 0) {
                container.innerHTML = `
                    <h3>DAILY REVENUE TREND</h3>
                    <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
                        No revenue data available for last 5 days
                    </div>
                `;
                return;
            }
            
            let html = `
                <h3>DAILY REVENUE TREND</h3>
                <table class="revenue-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>New</th>
                            <th>Renewal</th>
                            <th>Fee Exemption</th>
                            <th>Total</th>
                            <th>New Revenue</th>
                            <th>Renewal Revenue</th>
                            <th>Total Revenue</th>
                            <th>Security Deposit</th>
                            <th>Net Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            dates.forEach(date => {
                const dayData = data[date];
                const total = dayData.new + dayData.renewal + dayData.feeExemption;
                const totalRev = dayData.newRev + dayData.renewalRev;
                
                html += `
                    <tr>
                        <td><strong>${this.formatDisplayDate(date)}</strong></td>
                        <td class="bold-number">${dayData.new}</td>
                        <td class="bold-number">${dayData.renewal}</td>
                        <td class="bold-number">${dayData.feeExemption}</td>
                        <td class="bold-number">${total}</td>
                        <td class="bold-number">₹${this.formatNumber(dayData.newRev)}</td>
                        <td class="bold-number">₹${this.formatNumber(dayData.renewalRev)}</td>
                        <td class="bold-number">₹${this.formatNumber(totalRev)}</td>
                        <td class="bold-number">₹${this.formatNumber(dayData.deposit)}</td>
                        <td class="bold-number">₹${this.formatNumber(dayData.netRevenue)}</td>
                    </tr>
                `;
            });

            html += `</tbody></table>`;
            container.innerHTML = html;
            
            console.log('Daywise revenue rendered successfully for', dates.length, 'days');
        } catch (error) {
            console.error('Error rendering daywise revenue:', error);
        }
    }

    setupCopyFunctionality() {
        try {
            const copyBtn = document.getElementById('copyRevenueReportBtn');
            if (copyBtn) {
                copyBtn.onclick = () => this.copyCompleteReport();
            }
        } catch (error) {
            console.error('Error setting up copy functionality:', error);
        }
    }

    copyCompleteReport() {
        try {
            const content = document.getElementById('revenueContent');
            if (!content) {
                this.showError('No content available to copy');
                return;
            }

            // Create a temporary div to hold the content for copying
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.whiteSpace = 'pre';
            tempDiv.style.fontFamily = 'Arial, sans-serif';
            tempDiv.style.fontSize = '11px';

            // Get all table content
            let reportText = `Revenue Dashboard Report\n\n`;
            reportText += '='.repeat(100) + '\n\n';

            // LYTD & LMTD Comparison
            const accountStatusTable = document.getElementById('accountStatusTable');
            if (accountStatusTable) {
                reportText += 'LYTD & LMTD COMPARISON\n';
                reportText += '='.repeat(100) + '\n\n';
                const tables = accountStatusTable.getElementsByTagName('table');
                for (let table of tables) {
                    reportText += this.tableToText(table) + '\n';
                }
            }

            // Revenue Report
            const revenueTable = document.getElementById('revenueTable');
            if (revenueTable) {
                reportText += '\nREVENUE REPORT\n';
                reportText += '='.repeat(100) + '\n\n';
                const table = revenueTable.getElementsByTagName('table')[0];
                if (table) {
                    reportText += this.tableToText(table) + '\n';
                }
            }

            // Daywise Revenue
            const daywiseRevenue = document.getElementById('daywiseRevenue');
            if (daywiseRevenue) {
                reportText += '\nDAILY REVENUE TREND\n';
                reportText += '='.repeat(100) + '\n\n';
                const table = daywiseRevenue.getElementsByTagName('table')[0];
                if (table) {
                    reportText += this.tableToText(table) + '\n';
                }
            }

            reportText += '='.repeat(100) + '\n';
            reportText += `Generated on: ${new Date().toLocaleString()}\n`;

            tempDiv.textContent = reportText;
            document.body.appendChild(tempDiv);

            // Select and copy the text
            const range = document.createRange();
            range.selectNode(tempDiv);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand('copy');
            window.getSelection().removeAllRanges();

            document.body.removeChild(tempDiv);

            // Show success message
            const copyBtn = document.getElementById('copyRevenueReportBtn');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅ Copied!';
            copyBtn.style.background = '#2e7d32';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '';
            }, 2000);

            console.log('Revenue report copied to clipboard');
        } catch (error) {
            console.error('Error copying report:', error);
            this.showError('Failed to copy report: ' + error.message);
        }
    }

    tableToText(table) {
        let text = '';
        const rows = table.getElementsByTagName('tr');
        
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].getElementsByTagName('th');
            let rowText = '';
            for (let j = 0; j < cells.length; j++) {
                rowText += cells[j].textContent.trim() + '\t';
            }
            if (rowText.trim()) {
                text += rowText + '\n';
            }
        }
        
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].getElementsByTagName('td');
            let rowText = '';
            for (let j = 0; j < cells.length; j++) {
                rowText += cells[j].textContent.trim() + '\t';
            }
            if (rowText.trim()) {
                text += rowText + '\n';
            }
        }
        
        return text;
    }

    // Utility methods
    parseCSVDate(dateString) {
        if (!dateString) return new Date(NaN);
        
        if (dateString instanceof Date) {
            return isNaN(dateString.getTime()) ? new Date(NaN) : dateString;
        }
        
        const str = String(dateString).trim();
        
        // Handle ISO format dates (2024-11-04 00:00:00)
        if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
            const datePart = str.split(' ')[0];
            const [year, month, day] = datePart.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            date.setHours(0, 0, 0, 0); // Clear time to avoid timezone issues
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        
        const dateOnly = str.split(' ')[0];
        
        // Common CSV date formats
        const formats = [
            /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/,
            /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/,
            /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/
        ];
        
        for (let i = 0; i < formats.length; i++) {
            const match = dateOnly.match(formats[i]);
            if (match) {
                let day, month, year;
                
                if (i === 0) {
                    // DD/MM/YYYY
                    day = parseInt(match[1]);
                    month = parseInt(match[2]) - 1;
                    year = parseInt(match[3]);
                } else if (i === 1) {
                    const first = parseInt(match[1]);
                    const second = parseInt(match[2]);
                    
                    if (first > 12) {
                        day = first;
                        month = second - 1;
                    } else if (second > 12) {
                        month = first - 1;
                        day = second;
                    } else {
                        day = first;
                        month = second - 1;
                    }
                    year = parseInt(match[3]);
                } else {
                    year = parseInt(match[1]);
                    month = parseInt(match[2]) - 1;
                    day = parseInt(match[3]);
                }
                
                if (year >= 2000 && year <= 2100 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
                    const date = new Date(year, month, day);
                    date.setHours(0, 0, 0, 0); // Clear time to avoid timezone issues
                    if (!isNaN(date.getTime()) && date.getDate() === day) {
                        return date;
                    }
                }
            }
        }
        
        const standardDate = new Date(str);
        standardDate.setHours(0, 0, 0, 0); // Clear time to avoid timezone issues
        if (!isNaN(standardDate.getTime())) return standardDate;
        
        return new Date(NaN);
    }

    parseAmount(amount) {
        if (!amount) return 0;
        if (typeof amount === 'number') return amount;
        const str = String(amount).replace(/[₹$,]/g, '').trim();
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
    }

    findColumnValue(row, possibleColumnNames) {
        if (!row) return null;
        
        // First try exact match
        for (const colName of possibleColumnNames) {
            if (row[colName] !== undefined && row[colName] !== null && row[colName] !== '') {
                return row[colName];
            }
        }
        
        // Try case-insensitive match
        const rowKeys = Object.keys(row);
        for (const colName of possibleColumnNames) {
            const lowerColName = colName.toLowerCase();
            const matchingKey = rowKeys.find(k => k.toLowerCase() === lowerColName);
            if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null && row[matchingKey] !== '') {
                return row[matchingKey];
            }
        }
        
        return null;
    }

    getPercentageClass(percentage) {
        if (percentage > 0) return 'positive';
        if (percentage < 0) return 'negative';
        return 'neutral';
    }

    getArrow(percentage) {
        if (percentage > 0) return '↑';
        if (percentage < 0) return '↓';
        return '→';
    }

    formatNumber(num) {
        if (num === undefined || num === null) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    formatDate(date) {
        try {
            return date.toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
            }).replace(/\//g, '-');
        } catch (error) {
            return 'DD-MM-YYYY';
        }
    }

    formatDisplayDate(dateStr) {
        try {
            // If it's already in YYYY-MM-DD format, convert to DD-MM-YYYY
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [year, month, day] = dateStr.split('-');
                return `${day}-${month}-${year}`;
            }
            
            // Otherwise parse as date
            const date = new Date(dateStr);
            return this.formatDate(date);
        } catch (error) {
            return dateStr;
        }
    }

    getCurrentMonthYear() {
        return this.currentDate.toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
        }).replace("'", "’");
    }

    getLastYearMonthYear() {
        const lastYear = new Date(this.currentDate);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        return lastYear.toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
        }).replace("'", "’");
    }

    getLastMonthYear() {
        const lastMonth = new Date(this.currentDate);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return lastMonth.toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
        }).replace("'", "’");
    }

    showLoading(show) {
        const loadingElement = document.getElementById('revenueLoading');
        if (loadingElement) {
            if (show) {
                loadingElement.style.display = 'block';
            } else {
                loadingElement.style.display = 'none';
            }
        }
    }

    showError(message) {
        const errorElement = document.getElementById('revenueError');
        if (errorElement) {
            errorElement.style.display = 'block';
            errorElement.textContent = message;
        }
    }

    hideError() {
        const errorElement = document.getElementById('revenueError');
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
    }

    setupEventListeners() {
        console.log('Setting up Revenue Dashboard event listeners...');
        
        const uploadFromEmptyBtn = document.getElementById('uploadFromEmptyState');
        if (uploadFromEmptyBtn) {
            uploadFromEmptyBtn.addEventListener('click', () => {
                openRevenueUploadModal();
            });
        }
    }
}

// Global functions
function openRevenueUploadModal() {
    const modal = document.getElementById('revenueUploadModal');
    if (modal) modal.style.display = 'flex';
}

function closeRevenueUploadModal() {
    const modal = document.getElementById('revenueUploadModal');
    if (modal) modal.style.display = 'none';
}

function generateRevenueDashboard() {
    const loadingElement = document.getElementById('revenueLoading');
    const errorElement = document.getElementById('revenueError');
    
    if (loadingElement) loadingElement.style.display = 'block';
    if (errorElement) {
        errorElement.style.display = 'none';
        errorElement.textContent = '';
    }
    
    const vilFile = document.getElementById('vilPaymentFileInput').files[0];
    if (!vilFile) {
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) {
            errorElement.style.display = 'block';
            errorElement.textContent = 'Please upload VIL Payment sheet first';
        }
        return;
    }
    
    try {
        closeRevenueUploadModal();
        
        if (!window.revenueDashboardInstance) {
            window.revenueDashboardInstance = new RevenueDashboard();
        }
        
        window.revenueDashboardInstance.initializeDashboard().then(() => {
            if (loadingElement) loadingElement.style.display = 'none';
        }).catch(error => {
            if (loadingElement) loadingElement.style.display = 'none';
            if (errorElement) {
                errorElement.style.display = 'block';
                errorElement.textContent = 'Error: ' + error.message;
            }
        });
        
    } catch (error) {
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) {
            errorElement.style.display = 'block';
            errorElement.textContent = 'System error: ' + error.message;
        }
    }
}

function checkRevenueFilesUploaded() {
    try {
        const vilFile = document.getElementById('vilPaymentFileInput').files.length > 0;
        const entityFile = document.getElementById('entitySheetFileInput').files.length > 0;
        const tmFile = document.getElementById('tmSheetFileInput').files.length > 0;
        const tmeFile = document.getElementById('tmeSheetFileInput').files.length > 0;
        
        const generateBtn = document.getElementById('generateRevenueDashboardBtn');
        const instructions = document.getElementById('revenueUploadInstructions');
        
        if (generateBtn && instructions) {
            if (vilFile && (entityFile || tmFile || tmeFile)) {
                generateBtn.disabled = false;
                instructions.textContent = 'Ready to generate revenue dashboard';
                instructions.style.color = '#27ae60';
            } else {
                generateBtn.disabled = true;
                instructions.textContent = 'Upload VIL Payment sheet and at least one other sheet';
                instructions.style.color = '#e74c3c';
            }
        }
    } catch (error) {
        console.error('Error checking revenue files:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const uploadBtn = document.getElementById('openRevenueUploadModal');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', openRevenueUploadModal);
    }
    
    const fileInputs = [
        'vilPaymentFileInput',
        'entitySheetFileInput', 
        'tmSheetFileInput',
        'tmeSheetFileInput'
    ];
    
    fileInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', checkRevenueFilesUploaded);
        }
    });
});

// Make functions globally available
window.openRevenueUploadModal = openRevenueUploadModal;
window.closeRevenueUploadModal = closeRevenueUploadModal;
window.generateRevenueDashboard = generateRevenueDashboard;
window.checkRevenueFilesUploaded = checkRevenueFilesUploaded;