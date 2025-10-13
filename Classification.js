// Global variables
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const numPeopleInput = document.getElementById('numPeople');
const peopleList = document.getElementById('peopleList');
let peopleCount = 2;
let uploadedFileName = '';
let originalData = [];

// Enhanced Classification Rules with Comprehensive Patterns
const ENHANCED_CLASSIFICATION_RULES = {
    'Transactional': {
        primary: [
            'OTP', 'One Time Password', 'One-Time Password', 'verification code',
            'verify', 'verification', 'authenticate', 'authentication', 'otp for',
            'your otp', 'this otp', 'the otp', 'otp is', 'enter otp',
            'PIN', 'password', 'secure code', 'security code', 'access code',
            'login', 'log in', 'sign in', 'signin', 'log into', 'sign into',
            'transaction', 'payment', 'debit', 'credit', 'debited', 'credited',
            'withdraw', 'withdrawal', 'deposit', 'balance', 'account balance',
            'fund transfer', 'transfer', 'NEFT', 'RTGS', 'IMPS', 'UPI',
            'bank', 'banking', 'ATM', 'card', 'debit card', 'credit card',
            'card ending', 'account ending', 'card number',
            'authorize', 'authorization', 'confirm', 'confirmation',
            'approved', 'approval', 'declined', 'failed', 'successful',
            'statement', 'chequebook', 'cheque book', 'passbook',
            'account opening', 'account activation', 'card activation',
            'mobile verification', 'number verification', 'KYC verification',
            'mandate', 'auto debit', 'standing instruction',
            'internet banking', 'mobile banking', 'whatsapp banking',
            'net banking', 'online banking', 'digital banking',
            'verification code', 'transaction alert', 'payment failed', 'transaction declined',
            'loan journey', 'loan limit', 'account number', 'authorized transaction',
            'security alert', 'account blocked', 'card expired', 'temporarily blocked due to',
            'otp confirmation', 'transaction successful', 'transaction completed',
            'account updated', 'profile updated','payment alert', 'payment confirmation', 'payment processed', 
            'payment received','transaction notification', 'debit notification', 'credit notification',
            'balance notification', 'fund credited', 'fund debited', 'amount credited',
            'amount debited', 'payment debited', 'payment credited', 'transaction ref',
            'transaction reference', 'payment reference', 'reference number',
            'EMI plan', 'credit cancelled', 'transaction amount', 'current outstanding',
            'processing fee', 'loan amount', 'credit limit', 'card xx', 'get loan',
            'biz power', 'regalia credit','passcode','receipt', 'receipt number', 'premium amount', 'policy renewal',
            'renewal due', 'make a payment','authorization code',
        ],
        secondary: [
            'valid for', 'expires', 'expiry', 'minutes', 'mins', 'seconds',
            'do not share', 'don\'t share', 'never share', 'not share',
            'with anyone', 'to anyone', 'confidential', 'secret',
            'customer', 'registered', 'activated', 'account', 'service',
            'security reasons', 'protect', 'safe', 'secure',
            'transaction in process', 'payment received', 'balance updated', 'account activity',
            'debit alert', 'credit alert', 'transaction notification', 'statement available',
            // REMOVED DUPLICATE: 'cancelled as per', 'added to your', 'survoday sfb', 'hdfc bank',
            'dear parent', 'against invoice', 'has been received', 'thank you'
        ],
        patterns: [
            /\b\d{4,6}\b.*(?:OTP|otp|code|PIN|pin|password)/gi,
            /(?:OTP|otp|code|PIN|pin|password).*\b\d{4,6}\b/gi,
            /(?:OTP|otp|verification).*(?:valid|expires).*(?:\d+.*(?:minutes?|mins?|seconds?))/gi,
            /(?:not share|don'?t share|never share).*(?:OTP|otp|code|PIN|pin|password)/gi,
            /transaction.*(?:successful|failed|declined|approved|completed)/gi,
            /(?:debit|credit).*(?:card|account).*(?:ending|number|xxxx)/gi,
            /(?:login|sign in).*(?:OTP|otp|code|password)/gi,
            /balance.*(?:INR|Rs|₹|\$|\d+)/gi,
            /card ending.*\d{4}/gi,
            /account.*\d{6,}/gi,
            /{#var#} is your passcode/i,
            /passcode.*valid for {#var#} minutes/i,
            /one time password/i,
            /authorization code/i,
            /(?:authorize|confirm).*(?:transaction|payment|request)/gi,
            /<#>.*(?:OTP|otp|verification)/gi,
            /#.*(?:OTP|otp|verification)/gi,
            /\{#var#\}.*(?:is|for).*(?:OTP|otp|verification|login|password)/gi,
            /transaction\s+(alert|failed|completed|declined|successful)/gi,
            /loan\s+(journey|limit|application)/gi,
            /account\s+(blocked|expired|updated|verification)/gi,
            /otp\s+(confirmation|verified)/gi,
            /balance\s+(updated|available|alert)/gi,
            // ADDED: Payment and transaction patterns from Excel data
            /payment\s+(alert|confirmation|processed|received|failed|successful)/gi,
            /(?:amount|fund|payment).*(?:credited|debited)/gi,
            /(?:transaction|payment).*(?:reference|ref|id).*\w+/gi,
            /EMI\s+plan.*(?:cancelled|transaction)/gi,
            /credit.*(?:cancelled|card|limit)/gi,
            /(?:hdfc|sfb).*(?:bank|credit)/gi,/(?:invoice|receipt)\s+(?:no|number).*\d+/gi,
            /premium\s+amount.*Rs/gi,
            /passcode.*(?:for|getting|policy)/gi,
            /kindly\s+make\s+a\s+payment/gi

        ],
        weight: 5,
        confidence_boost: 18
    },

    'Service-Implicit': {
        primary: [
            'application', 'application received', 'application processed',
            'application approved', 'application rejected', 'application status',
            'has been', 'have been', 'status', 'update', 'updated',
            'renewal', 'renewed', 'renewal due', 'renewal reminder',
            'reminder', 'notification', 'alert', 'notice', 'intimation',
            'confirmed', 'booked', 'scheduled', 'rescheduled', 'cancelled',
            'delivered', 'shipped', 'dispatched', 'pickup', 'delivery',
            'out for delivery', 'delivered successfully',
            'installation', 'maintenance', 'service request', 'complaint',
            'resolved', 'activated', 'deactivated', 'suspended', 'blocked',
            'expired', 'expiry', 'due date', 'bill generated', 'invoice generated',
            'statement generated', 'usage alert', 'limit exceeded',
            'quota exceeded', 'threshold crossed',
            'policy', 'policy issued', 'policy renewal', 'premium due',
            'claim', 'claim processed', 'maturity', 'benefit', 'settlement',
            'policy document', 'certificate', 'coverage',
            'pradhan mantri', 'bima yojana', 'jeevan jyoti', 'suraksha bima',
            'ayushman bharat', 'jan aushadhi', 'government scheme',
            'dear customer', 'dear sir', 'dear madam', 'greetings',
            'thank you', 'regards', 'team', 'visit branch',
            'customer service', 'helpdesk', 'support team',
            'account statement', 'monthly statement', 'account summary',
            'service activated', 'service deactivated', 'plan changed',
            'tariff change', 'rate revision', 'terms updated',
            'quality check', 'cannot processed', 'cannot be processed',
            'complaint filed', 'issue resolved', 'service request', 'plan renewed',
            'account suspended', 'case closed', 'application rejected',
            'feedback received', 'maintenance scheduled',
            'rate us', 'rating', 'feedback', 'experience', 'interaction',
            'melento', 'click', 'document', 'documents', 'kindly', 'kotak',
            'life', 'arbitration', 'reference letter', 'overdue', 'unpaid amount',
            'credit bureaus', 'credit score', 'legal notice', 'settlement',
            'missed call', 'urgent attention', 'IT integration', 'services',
            'temporary', 'discontinued', 'outstanding amount', 'payment due',
            'dispute', 'avoid', 'authorized', 'representative', 'request',
            'unable to reach', 'medical assessment', 'provide', 'preferred date',
            'absent', 'query', 'regards', 'team', 'complaint regarding',
            'declined', 'duplicate complaint', 'visit branch', 'settlement',
            'gold loan service', 'event will take place', 'presence', 'cooperation',
            'annual general meeting', 'attendance', 'request', 'symptom generated',
            'equipment', 'resolved remotely', 'assistance', 'contact',
            'please note', 'change in', 'fund', 'effective', 'website',
            'breakdown','observability', 'down alert', 'up alert',
            'downtime', 'system', 'monitoring', 'base receipt', 'created successfully',
            'zepto gift card', 'balance', 'updated', 'support', 'help',
            'billing cycle', 'unchanged', 'ignore', 'technical glitch',
            'regret', 'inconvenience', 'disbursed', 'emi amount', 'starting',
            'payable', 'download', 'fair practice code',
            'information booklet', 'active', 'bus ticket',
         'thanks for visiting', 'host again','Service Update','Service Update!',
         'for queries related to','customer care','EMI card','personal loan','health insurance',
         'card protection plan','thank you for choosing','queries in account opening',
         'call us on','token of appreciation','complimentary','Thank you for shopping',
         'next purchase','Next time purchase','Validity',
         'invoice no', 'invoice number','power supply errors',
         'created successfully','warehouse service provider','base receipt','alert',
         'thanks for registering', 'trials are on', 'pachaiyappas college ground', // REMOVED DUPLICATE: 'thanks for registering',
         'ott subscription','monthly subscription', 'special offer', 'is now active',
        'signing up','We will get in touch with you soon','Current Account application',
        'Call out',
        ],
        secondary: [
            'your order', 'your booking', 'your service', 'your plan',
            'your policy', 'your account', 'your application', 'your request',
            'appointment', 'visit', 'technician', 'executive', 'representative',
            'agent', 'branch', 'office', 'contact', 'call', 'details',
            'information', 'update', 'change', 'modification',
            'customer support', 'visit branch', 'agent assigned', 'appointment scheduled',
            'details updated', 'plan changed', 'rate revision', 'helpdesk',
            'would love', 'hear about', 'recent', 'please rate', 'apply',
            'contact','please contact','queries','related to','voucher value',
            'regards','verify',

            
        ],
        patterns: [
            /(?:order|booking|service|plan|policy).*(?:confirmed|scheduled|updated|renewed)/gi,
            /(?:bill|invoice|statement).*(?:generated|available|due|ready)/gi,
            /(?:installation|maintenance|visit).*(?:scheduled|completed|pending)/gi,
            /(?:renewal|payment).*(?:due|reminder|scheduled)/gi,
            /(?:application|request).*(?:received|processed|approved|rejected)/gi,
            /(?:dear customer|dear sir|dear madam).*(?:your|has been)/gi,
            /usage.*(?:alert|limit|quota|exceeded|threshold)/gi,
            /policy.*(?:issued|renewal|maturity|due|expiry)/gi,
            /ott monthly subscription/i, /special offer/i, /is now active/i,
            /visit.*(?:branch|office|website|portal)/gi,
            /thanks for registering/i, /trials are on/i, /\bcollege ground\b/i,
            /base receipt ending \\d+/i, /created successfully/i,
            /power supply errors/i, /prompt action/i, /verify the elevator/i, /revert to toc/i,
            /account.*(?:statement|summary|balance|activated|closed)/gi,
            /service.*(?:activated|deactivated|suspended|restored)/gi,
            /service\s+(activated|deactivated|suspended|restored)/gi,
            /application\s+(received|approved|rejected|processed)/gi,
            /maintenance\s+(scheduled|completed)/gi,
            /complaint\s+(filed|resolved)/gi,
            /Service\s*Update[!]?/i,
            /thank you for choosing/i,
            /queries in account opening/i,
            /call us on/i,
            /sip instalment.*reversed due to/i, /consecutive reversals/i, /contact us at \\d{10}/i,
            /thank you for shopping/i,
            /token of appreciation/i,
            /complimentary [^ ]+/i,
            /(promo code|voucher value|validity|T&C)/i,
            /For\s+queries\s+related\s+to/i,
            /(EMI|Personal\s+Loan|Health\s+Insurance|Card\s+Protection\s+Plan)/i,
            /please\s+contact\s+[A-Za-z\s]+Customer\s+Care/i,
            /we would love.*(?:hear|feedback|rate)/gi,
            /(?:arbitration|legal|overdue|settlement).*(?:reference|notice|letter)/gi,
            /missed.*call.*(?:urgent|attention)/gi,
            /IT.*integration.*services.*(?:not available|unavailable)/gi,
            /(?:annual|general|meeting).*(?:attendance|request|presence)/gi,
            /(?:symptom|alert).*(?:generated|resolved|equipment)/gi,
            /(?:solarwinds|observability).*(?:down|up|alert)/gi,
            /(?:system|equipment).*(?:down|up|since|again)/gi,
            /(?:change in|effective|please note).*(?:fund|rate|ter)/gi,
            /(?:zepto|gift card).*(?:balance|updated|payment|successful)/gi,
            /(?:billing cycle|technical glitch|ignore|regret)/gi,
            /(?:loan|disbursed|emi).*(?:amount|starting|payable)/gi,
            
        ],
    
        weight: 3,
        confidence_boost: 12
    },

    'Service-Explicit': {
        primary: [
            'offer', 'offers', 'special offer', 'mega offer', 'best offer', 'live offer',
            'discount', 'discounts', 'promotion', 'promotional', 'sale', 'sales',
            'deal', 'deals', 'mega deal', 'best deal', 'flash sale', 'super sale',
            'great deal', 'amazing offer', 'incredible offer', 'unbeatable offer',
            'cashback', 'get cashback', 'earn cashback', 'instant cashback',
            'reward', 'rewards', 'earn rewards', 'bonus', 'bonus points',
            'savings', 'save upto', 'save up to', 'earn upto', 'earn up to',
            'flat discount', 'flat cashback', 'extra cashback',
            'prize', 'prizes', 'win', 'winner', 'contest', 'competition',
            'lucky draw', 'scratch card', 'lottery', 'bumper prize',
            'lucky winner', 'congratulations', 'you won', 'you win',
            'voucher', 'vouchers', 'coupon', 'coupons', 'gift voucher',
            'shopping voucher', 'brand voucher', 'discount coupon',
            'free', 'complimentary', 'gift', 'gifts', 'surprise gift',
            'free gift', 'free delivery', 'free installation', 'free trial',
            'no charges', 'zero cost', 'at no cost',
            'limited time', 'limited period', 'limited offer', 'hurry', 'hurry up',
            'grab now', 'shop now', 'buy now', 'book now', 'apply now',
            'grab', 'order now', 'call now', 'visit now', 'download now',
            'don\'t miss', 'last chance', 'ending soon', 'expires today',
            'only today', 'today only', 'while stocks last',
            'exclusive', 'exclusive offer', 'special invitation', 'vip offer',
            'premium', 'elite', 'select customers', 'chosen customers',
            'get up to', 'register now', 'join now', 'subscribe now',
            'explore', 'explore new', 'discover', 'experience',
            'enjoy', 'exciting', 'amazing', 'incredible', 'unbelievable',
            'biggest', 'largest', 'best', 'top', 'number one',
            'pre-book', 'pre-order', 'advance booking', 'early bird',
            'easy emi', 'zero down payment', 'no cost emi', 'instant approval',
            'pre-approved','eligible for','eligible','qualify for','approved loan', // REMOVED DUPLICATE: 'pre-approved'
            'loan offer', 'credit offer', 'finance offer', 'card offer',
            'instant loan', 'quick loan', 'personal loan offer','limited time',
            'festival', 'celebration', 'festive offer', 'holiday special',
            'independence day', 'republic day', 'diwali', 'dussehra',
            'holi', 'new year', 'christmas', 'birthday special',
            'anniversary', 'monsoon offer', 'summer sale',
            'new launch', 'newly launched', 'introducing', 'presenting',
            'unveiling', 'coming soon', 'now available', 'just arrived',
            'latest', 'newest', 'brand new', 'fresh arrival',
            'click here', 'tap here', 'visit website', 'download app',
            'call us', 'contact us', 'reach us', 'get in touch',
            'find out more', 'learn more', 'know more', 'details inside',
            'bogo', 'buy one get one', 'buy 1 get 1', 'early access', 'sitewide',
            'flash', 'till stock lasts', 'valid till', 'avail', 'boost',
            'Get expert', 'Get your guide here', 'check out', 'flash sale',
            'limited time offer', 'exclusive deal', 'special promotion',
            'instant cashback', 'free shipping', 'summer sale', 'monsoon sale',
            'holiday special', 'festival offer', 'discount coupon', 'voucher code',
            'prize draw', 'win big', 'lucky winner', 'early bird', 'vip offer',
            'birthday special', 'anniversary offer', 'new launch', 'pre-order',
            'cash coupon', 'bogo', 'buy 1 get 1', 'free gift', 'complimentary trial',
            'zero down payment', 'easy emi', 'personal loan offer',
            'credit card offer', 'loan approval', 'approved loan',
            'seasonal discount', 'seasonal sale', 'celebrate', 'join now',
            'register today', 'subscribe today', 'shop now', 'call now',
            'click here', 'tap here', 'download now', 'grab yours', 'while stocks last',
            'experience the best', 'own', 'redefined', 'thrilled', 'on board',
            'register for', 'loyalty program', 'activate', 'unlock', 'trading',
            'buying power', 'trade smart', 'derivative privileges', 'futures',
            'options', 'inaugural offer', 'discount up to', 'flat off',
            'international holidays', 'send money abroad', 'zero charges',
            'curated', 'mtf picks', 'margin calculator', 'just one step left',
            'unlock f&o trading', 'new address', 'avail', 'limited period',
            'get discount', 'many more', 'smartbuy', 'infinia', 'diners club',
            'regalia', 'biz black', 'biz power', 'business regalia',
            'wide-leg denim', 'iconic fit', 'styled your way', 'in-store',
            'online', 'heartfelt greetings', 'gold loan', 'additional',
            'special opportunity', 'higher loan amount', 'immediately contact',
            'utilize this special offer','Gear up now','hunting',
            'grab iphone', 'smartbuy', 'hdfc bank regalia', 'biz power',
            'alert 50% off', 'processing fee', 'get loan up to', 'lowest rates',
            'attractive lending', 'level up your', 'ottplay experience',
            'tired of delivery', 'amazon prime', 'annual membership',
            'enjoy & free', 'pvr movie', 'lifetime free', 'kotak credit',
            'jaha manage', 'gaya falgu', 'collection shuru','with your', 'on track', 'order now on', 
            'install our', 'don\'t let','real-time view', 'collection shuru', 'karein', 'click report',
            'inquiry via', 'dialhire', 'budget', 'saal baad', 'aya hai', 'absa yog',
            'thalu pakah', 'anvasya', 'surya grahan', 'hari', 'shivjayanti',
            'house call', 'night', 'gaya falgu', 'seva', 'sevasetu','level up', 'ottplay experience', 
            'install our app', 'smoother streaming','personalised picks', 'asia cup', 'team ottplay', 
            'complete your vkyc','hero fincorp', 'loan is waiting', 'delays hold', 'finish application',
            'medicine refill','refill date', 'refill today', 'has passed',
            'stay on track', 'treatment', 'order now', 'zeno health',
            'walk-in drive', 'mega walk-in drive', 'customer service',
            'days working', 'shifts', 'rotational off', 'salary up to',
            'walk in at', 'mention', 'resume', 'contact',
            'selected with care', 'special emi plans', 'repay stress-free',
            'saddle up', 'royal enfield', 'down payment', 'emi starting',
            'calculate now', 'continental gt', 'shotgun',
            'withdraw funds', 'savings account', 'use them whenever',
            'get funds now', 'indusind bank',
            'we chose you', 'second loan', 'unlocked', 'hdfc bank credit card',
            'limited time', 'don\'t miss out','low as', 'at just', 'get up to', 'free pvr', 'movie tickets',
            'working shifts', 'salary', 'employment', 'job opportunity',
            'biggest sale', 'sale of the year', 'flat off', 'wastage charges',
            'making charges', 'showrooms', 'visit your nearest',
            'jewellery sale', 'enjoy flat', 'across all', 'showroom today',
            't&c apply', 'puja essence', 'subho mahalaya', 'get upto',
            'off on gold', 'off on dia', 'off on diamond', 'mc', 'value',
            'senco', 'joyalukkas', 'gold jewelry', 'diamond jewelry',
            'festival sale', 'navratri', 'dussehra', 'diwali sale',
            'mahalaya offer', 'gold discount', 'jewelry discount',
            'keep playing', 'start playing', 'play now', 'win more',
             'multiply your winnings', 'gaming account', 'bonus credited',
             'unlock rewards', 'mega contest', 'cashback',
            'dream11', 'mpl', 'rummy', 'poker', 'casino',
            'health checkup','package','full-body','visit','call',
            'Enroll Now','awaits','Happy Birthday!','Happy Birthday','Wishing'
    
        ],
        secondary: [
            'marketing', 'advertise', 'advertisement', 'campaign', 'brand',
            'product', 'launch', 'new arrival', 'trending', 'popular',
            'bestseller', 'featured', 'recommended', 'celebrate', 'join us',
            'be part of', 'community', 'family', 'membership',
            'marketing campaign', 'advertisement', 'membership benefits',
            'reward points', 'bonus offer', 'special invitation',
            'family and friends', 'community exclusive',
            'purchase', 'buying', 'shopping', 'collection',
            'low as', 'at just', 'get up to', 'free pvr', 'movie tickets',
              'sale', 'discount', 'offer', 'showroom', 'visit', 'today',
            'limited time', 'festival', 'celebration', 'special'
        ],
        patterns: [
            /(?:get|claim|avail|grab|win|earn).*(?:discount|cashback|offer|voucher|reward)/gi,
            /(?:upto|up to|\d+%).*(?:off|discount|cashback|savings)/gi,
            /(?:limited time|hurry|grab now|shop now|buy now|apply now)/gi,
            /(?:free|complimentary).*(?:gift|voucher|delivery|installation|trial)/gi,
            /(?:win|winner|prize).*(?:contest|draw|competition|lottery)/gi,
            /(?:sale|offer).*(?:ends|valid till|limited period|expires)/gi,
            /(?:easy emi|zero down payment|no cost emi|instant approval)/gi,
            /(?:visit|shop|buy|book|apply|call|download).*(?:now|today|immediately)/gi,
            /(?:flat|upto|up to).*(?:\d+%|rs\.?\s*\d+|₹\s*\d+)/gi,
            /(?:save|earn|get).*(?:upto|up to).*(?:\d+%|rs\.?\s*\d+|₹\s*\d+)/gi,
            /(?:offer|deal|discount).*(?:live|active|available|valid)/gi,
            /(?:pre-approved|eligible|qualify).*(?:loan|credit|offer)/gi,
            /(?:festival|festive|celebration|special).*(?:offer|sale|discount)/gi,
            /buy\s+one\s+get\s+one/gi,
            /(?:biggest|jewellery|jewelry).*(?:sale|discount|off)/gi,
            /(?:flat|upto).*(?:\d+%|off).*(?:wastage|making|charges)/gi,
            /(?:visit|showroom|showrooms).*(?:today|nearest)/gi,
            /(?:puja|mahalaya|navratri|dussehra|festival).*(?:essence|offer|sale)/gi,
            /(?:gold|diamond|dia).*(?:off|discount|mc|value)/gi,
            /(?:joyalukkas|senco).*(?:sale|offer)/gi,
            /t&c.*apply/gi,
            /bogo/gi,
            /\\bhealth checkup package\\b/i, /diagnostic centre/i, /call \\d{10}/i,
            /we\s+chose\s+you[^!]*!\s+a\s+second\s+loan/i,
            /is unlocked on your/i,
            /apply:?\s*/i,
            /early access/gi,
            /sitewide/gi,
            /till stock lasts/gi,
            /(?:Rs\.?\s?\d+[*]?\s?off|save\s?\d+%?|discount|offer|deal(s)?|free\s?\d*|cashback|voucher|coupon|BOGO|flat\s?\d+)/gi,
            /(?:shop(ping)?|buy|order|deal(s)?|essentials|mobile(s)?|laptop(s)?|instamart|electronics|fashion|grocery|appliance(s)?)/gi,
            /(?:valid\s?till\s?\d{1,2}\w{3,9}'?\d{2,4}|limited\s?time|today\s?only|expires|expiry|hurry|exclusive|last\s?day|don't\s?miss)/gi,
            /(?:credit\s?card|debit\s?card|AU\s?Bank|bank\s?offer|EMI|no\s?cost\s?EMI|UPI\s?cashback|netbanking|prepaid\s?card)/gi,
            /(?:shubh\s?muhurat|festive|celebration|festival\s?offer|special\s?offer|deal\s?of\s?the\s?day|big\s?sale|mega\s?sale)/gi,
            /(?:buy one get one|bogo|free gift|complimentary trial)/gi,
            /(?:flash sale|limited time|holiday|festival|seasonal|special promotion)/gi,
            /(?:cashback|discount|voucher|coupon|prize|winner|lucky|bonus)/gi,
            /(?:easy emi|zero down payment|instant approval|approved loan)/gi,
            /(?:register|subscribe|join).*(?:now|today)/gi,
            /(?:click|tap|download).*(?:now|today)/gi,
            /(?:experience|get|own|grab).*(?:iphone|exclusive|just|best)/gi,
            /(?:activate|unlock|curated|mtf|trading|buying power)/gi,
            /(?:new address|inaugural offer|discount up to|flat off)/gi,
            /(?:smartbuy|infinia|diners club|regalia|biz black)/gi,
            /(?:gold loan|additional|special opportunity|higher loan)/gi,
            /grab\s+iphone.*(?:\d+|gb).*(?:just|rs|smartbuy)/gi,
            /(?:hdfc|bank).*(?:regalia|biz|power|credit)/gi,
            /(?:alert|get).*(?:\d+%|off|loan|processing)/gi,
            /(?:amazon|prime|pvr|movie|tickets).*(?:free|membership)/gi,
            /medicine.*(?:refill|reminder)/gi,
            /refill.*(?:date|today|reminder)/gi,
            /(?:stay|track).*(?:treatment|health)/gi,
            /order.*(?:now|today).*(?:health|zeno)/gi,
            // ADDED: App and service patterns
            /(?:level up|install|complete).*(?:experience|app|vkyc)/gi,
            /(?:hero|loan).*(?:fincorp|waiting|application)/gi,
            /inquiry.*via.*(?:dial|hire|budget)/gi,
            /(?:inauguration|launch|event).*(?:take place|scheduled|invite)/gi,
            /(?:walk-in|mega).*(?:drive|customer service|shifts)/gi,
            /(?:salary|days working|rotational off).*(?:up to|shifts)/gi,
            /(?:selected|special emi|repay|stress-free)/gi,
            /(?:saddle up|royal enfield|down payment|emi starting)/gi,
            /(?:calculate|continental|shotgun).*(?:now|gt|650)/gi,
            /(?:withdraw|funds|savings|get funds)/gi,
            /(?:chose you|second loan|unlocked|credit card)/gi,
            /(?:deposited|credited|added).*(?:amount|rs|₹).*(?:keep|start|continue).*(?:play|gaming|win)/gi,
            /(?:congratulations|congrats).*(?:bonus|amount).*(?:credited|added).*(?:play|game)/gi,
            /(?:balance|wallet).*(?:active|updated).*(?:play|win|multiply)/gi,
            /(?:use|utilize).*(?:amount|money|balance).*(?:play|win|multiply)/gi,
            
        ],
        weight: 4,
        confidence_boost: 16
    }
};

// Enhanced classification function with contextual analysis
function classifyTemplateWithConfidence(content) {
    if (!content || typeof content !== 'string') {
        return { type: 'Service-Implicit (Review)', confidence: 30 };
    }
    
    const text = content.toLowerCase().trim();
    
    // ✅ NEW: Detect random/unrecognizable text first
    if (isRandomText(text)) {
        return { 
            type: 'Service-Implicit (Review)', 
            confidence: 25,
            details: ['Random text detected - manual review required']
        };
    }
    
    const scores = { 'Transactional': 0, 'Service-Implicit': 0, 'Service-Explicit': 0 };
    const details = { 'Transactional': [], 'Service-Implicit': [], 'Service-Explicit': [] };
    
    // Calculate scores for each category
    for (const [category, rules] of Object.entries(ENHANCED_CLASSIFICATION_RULES)) {
        let categoryScore = 0;
        
        // Check primary keywords (higher weight)
        rules.primary.forEach(keyword => {
            if (text.includes(keyword.toLowerCase())) {
                const weight = rules.weight;
                categoryScore += weight;
                details[category].push(`Primary: ${keyword} (+${weight})`);
            }
        });
        
        // Check secondary keywords (lower weight)
        rules.secondary.forEach(keyword => {
            if (text.includes(keyword.toLowerCase())) {
                const weight = rules.weight * 0.5;
                categoryScore += weight;
                details[category].push(`Secondary: ${keyword} (+${weight})`);
            }
        });
        
        // Check contextual patterns (bonus points)
        rules.patterns.forEach(pattern => {
            if (pattern.test(content)) {
                const bonus = rules.weight * 1.5;
                categoryScore += bonus;
                details[category].push(`Pattern match (+${bonus})`);
            }
        });
        
        scores[category] = categoryScore;
    }
    
    // Find the category with highest score
    let maxCategory = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    let maxScore = scores[maxCategory];
    
    // If no clear winner or very low scores, default to Service-Implicit (Review)
    if (maxScore === 0 || maxScore <= 2) {
        return { 
            type: 'Service-Implicit (Review)', 
            confidence: 30,
            details: ['Low confidence classification - manual review recommended']
        };
    }
    
    // Calculate confidence based on score difference and absolute score
    const sortedScores = Object.values(scores).sort((a, b) => b - a);
    const scoreDifference = sortedScores[0] - sortedScores[1];
    const absoluteScore = maxScore;
    
    // Advanced confidence calculation
    let confidence = Math.min(95, Math.max(30, 
        (absoluteScore * 15) + (scoreDifference * 10) + 25
    ));
    
    // Boost confidence for strong indicators
    if (absoluteScore > 5) confidence = Math.min(95, confidence + 10);
    if (scoreDifference > 3) confidence = Math.min(95, confidence + 10);
    
    // Contextual adjustments
    if (maxCategory === 'Transactional') {
        // High confidence for clear transactional patterns
        if (/\b\d{4,6}\b/g.test(content) && /(?:OTP|code|PIN)/i.test(content)) {
            confidence = Math.max(confidence, 85);
        }
        if (/(?:transaction|payment|debit|credit).*(?:successful|failed)/i.test(content)) {
            confidence = Math.max(confidence, 80);
        }
    }
    
    if (maxCategory === 'Service-Explicit') {
        // High confidence for promotional language
        if (/(?:limited time|hurry|grab|don't miss|exclusive)/i.test(content)) {
            confidence = Math.max(confidence, 75);
        }
        if (/(?:free|discount|cashback|offer).*(?:\d+%|upto|up to)/i.test(content)) {
            confidence = Math.max(confidence, 80);
        }
    }
    
    // ✅ NEW: Force review for low confidence classifications
    if (confidence < 70) {
        maxCategory += ' (Review)';
    }
    
    confidence = Math.round(confidence);
    
    return { 
        type: maxCategory, 
        confidence: confidence,
        details: details[maxCategory.replace(' (Review)', '')] || []
    };
}

// ✅ NEW: Function to detect random/unrecognizable text
function isRandomText(text) {
    if (text.length < 10) return false; // Too short to judge
    
    const words = text.split(/\s+/).filter(word => word.length > 2);
    if (words.length < 3) return false; // Not enough words
    
    // Check if text lacks meaningful keywords from any category
    const allKeywords = [
        ...ENHANCED_CLASSIFICATION_RULES.Transactional.primary,
        ...ENHANCED_CLASSIFICATION_RULES.Transactional.secondary,
        ...ENHANCED_CLASSIFICATION_RULES['Service-Implicit'].primary,
        ...ENHANCED_CLASSIFICATION_RULES['Service-Implicit'].secondary,
        ...ENHANCED_CLASSIFICATION_RULES['Service-Explicit'].primary,
        ...ENHANCED_CLASSIFICATION_RULES['Service-Explicit'].secondary
    ].map(kw => kw.toLowerCase());
    
    let meaningfulWordCount = 0;
    words.forEach(word => {
        if (allKeywords.some(keyword => 
            keyword.includes(word) || word.includes(keyword) || 
            keyword.toLowerCase().includes(word) || 
            text.includes(keyword.toLowerCase())
        )) {
            meaningfulWordCount++;
        }
    });
    
    // If less than 20% of words are meaningful, consider it random
    const meaningfulRatio = meaningfulWordCount / words.length;
    return meaningfulRatio < 0.2;
}

// COMPLETELY UPDATED - Enhanced variable format checking with FIXED logic
function checkVariableFormat(content) {
    if (!content || typeof content !== 'string') {
        return 'OK';
    }

    const incorrectPatterns = [];
    
    // List of coupon codes and valid business terms to exclude
    const validCouponCodes = ['GOFREE', 'B329', 'OFFER400', 'SAVE20', 'FREE50', 'DEAL100'];
    const validBusinessTerms = ['YES', 'NO', 'APPROVED', 'DECLINED', 'PENDING', 'ACTIVE'];
    
    // UNIVERSAL CORRECT FORMAT: {#var#} - case insensitive, can be {#VAR#}, {#Var#}, etc.
    const correctVarPattern = /^{#var#}$/i;
    
    // Function to check if a pattern contains valid {#var#} format
    function containsValidVar(text) {
        // Check for {#var#} in any case variation
        const varMatch = text.match(/{#var#}/i);
        return varMatch && correctVarPattern.test(varMatch[0]);
    }
    
    // 1. DETECT ALL CURLY BRACE PATTERNS {...}
    const curlyPatterns = content.match(/\{[^}]*\}/g) || [];
    curlyPatterns.forEach(pattern => {
        // Allow only {#var#} in any case (case-insensitive)
        if (!correctVarPattern.test(pattern)) {
            incorrectPatterns.push(pattern);
        }
    });
    
    // 2. DETECT ALL SQUARE BRACKET PATTERNS [...]
    const squarePatterns = content.match(/\[[^\]]*\]/g) || [];
    squarePatterns.forEach(pattern => {
        // Allow {#var#} inside square brackets like [{#var#}]
        if (containsValidVar(pattern)) {
            return; // Valid - contains {#var#}
        }
        incorrectPatterns.push(pattern);
    });
    
  // 3. DETECT ALL ANGLE BRACKET PATTERNS <...>
const anglePatterns = content.match(/<[^>]*>/g) || [];

// List of real HTML tags to skip
const htmlTagList = [
  'br','img','a','div','span','p','strong','em','b','i','u',
  'ul','li','ol','table','tr','td','th','h1','h2','h3','h4','h5','h6',
  'meta','link','script','style','header','footer','section','article',
  'nav','main','form','label','input','button','select','option','textarea'
];

anglePatterns.forEach(pattern => {
  // Check if it looks like a real HTML tag
  const tagMatch = pattern.match(/^<\/?\s*([a-zA-Z0-9-:]+)/);
  if (tagMatch) {
    const tagName = tagMatch[1].toLowerCase();
    if (htmlTagList.includes(tagName)) {
      return; // Skip valid HTML tags
    }
  }

  // Skip URLs
  if (pattern.includes('http') || pattern.includes('www.')) {
    return;
  }

  // Allow <{#var#}>
  if (containsValidVar(pattern)) {
    return;
  }

  // Otherwise, mark as incorrect format
  incorrectPatterns.push(pattern);
});

  // 4. DETECT DOUBLE CURLY BRACE PATTERNS (or any number of braces)
const doubleCurlyPatterns = content.match(/\{+[^}]*\}/g) || [];

doubleCurlyPatterns.forEach(pattern => {
    // Only push to incorrectPatterns if #var# is NOT present
    if (!pattern.includes("#var#")) {
        incorrectPatterns.push(pattern);
    } else {
        console.log("Valid placeholder detected:", pattern);
    }
});

    // 5. DETECT QUOTED CONTENT (excluding coupon codes and valid business terms)
    const quotedPatterns = content.match(/"[^"]*"/g) || [];
    quotedPatterns.forEach(pattern => {
        const innerText = pattern.slice(1, -1); // Remove quotes
        
        // Skip coupon codes (case-insensitive)
        if (validCouponCodes.some(code => code.toLowerCase() === innerText.toLowerCase())) {
            return;
        }
        
        // Skip valid business terms (case-insensitive)
        if (validBusinessTerms.some(term => term.toLowerCase() === innerText.toLowerCase())) {
            return;
        }
        
        // Skip if it contains valid {#var#}
        if (containsValidVar(innerText)) {
            return;
        }
        
        // Flag specific patterns that look like variables
        if (innerText.includes('#') || 
            innerText.includes('var') || 
            innerText.includes('VAR') ||
            innerText.includes('OTP') ||
            innerText.includes('relationship_manager') ||
            /^[A-Z_]+$/.test(innerText) ||
            innerText.length <= 3 ||
            /^\s*$/.test(innerText)) { // Empty or whitespace-only
            incorrectPatterns.push(pattern);
        }
    });
    
    // 6. DETECT SINGLE QUOTE PATTERNS '...'
    const singleQuotedPatterns = content.match(/'[^']*'/g) || [];
    singleQuotedPatterns.forEach(pattern => {
        const innerText = pattern.slice(1, -1); // Remove quotes
        
        // Skip if it contains valid {#var#}
        if (containsValidVar(innerText)) {
            return;
        }
        
        // Flag if it looks like a variable placeholder
        if (innerText.includes('var') || 
            innerText.includes('VAR') ||
            innerText.includes('#') ||
            /^[A-Z_]+$/.test(innerText)) {
            incorrectPatterns.push(pattern);
        }
    });
    
    // 7. DETECT PATTERNS LIKE <VAR>, <SPACE>, etc.
    const specialAnglePatterns = content.match(/<[A-Z_\-\s]+>/g) || [];
    specialAnglePatterns.forEach(pattern => {
        // Skip HTML tags
        if (pattern.match(/^<\/?[a-z][a-z0-9]*[^<>]*>$/i)) {
            return;
        }
        
        // Skip if it contains valid {#var#}
        if (containsValidVar(pattern)) {
            return;
        }
        
        incorrectPatterns.push(pattern);
    });
    
    // Return the first incorrect pattern found, or OK if none
    return incorrectPatterns.length > 0 ? incorrectPatterns[0] : 'OK';
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updateAgentFields();
});

function setupEventListeners() {
    // File upload events
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
        fileInput.addEventListener('change', handleFile);
    }
    
    // Number input event
    if (numPeopleInput) {
        numPeopleInput.addEventListener('input', updateAgentFields);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave() {
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        handleFile();
    }
}

function updateAgentFields() {
    if (!peopleList) return;
    
    const count = parseInt(numPeopleInput.value, 10) || 1;
    peopleList.innerHTML = '';
    
    for (let i = 1; i <= count; i++) {
        const div = document.createElement('div');
        div.className = 'person-input';
        div.innerHTML = `
            <label for="person${i}">Agent ${i}:</label>
            <input type="text" id="person${i}" placeholder="Enter agent name" />
        `;
        peopleList.appendChild(div);
    }
    
    peopleCount = count;
}

function addPerson() {
    peopleCount++;
    numPeopleInput.value = peopleCount;
    updateAgentFields();
}

function assignAgentByEntity(entityName, agents) {
    if (!entityName || !agents.length) return 'Unassigned';
    
    const entity = entityName.toString().trim();
    const brandName = entity.includes(' - ') ? entity.split(' - ')[1] : entity;
    
    // Create a consistent hash based on entity name
    let hash = 0;
    for (let i = 0; i < brandName.length; i++) {
        const char = brandName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    return agents[Math.abs(hash) % agents.length] || 'Unassigned';
}

function handleFile() {
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file!');
        return;
    }
    
    uploadedFileName = file.name;
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            let workbook, json;
            
            if (file.name.endsWith('.csv')) {
                const csvData = e.target.result;
                workbook = XLSX.read(csvData, { type: 'string' });
            } else {
                const data = new Uint8Array(e.target.result);
                workbook = XLSX.read(data, { type: 'array' });
            }
            
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            json = XLSX.utils.sheet_to_json(sheet);
            
            if (json.length === 0) {
                alert('The file appears to be empty or invalid!');
                return;
            }
            
            // Store original data with all columns preserved
            originalData = json;
            sessionStorage.setItem('templatesData', JSON.stringify(json));
            
            // Update upload area to show success with delete option
            uploadArea.innerHTML = `
                <div class="success">✓ File Loaded: ${file.name}</div>
                <div>${json.length} templates ready for intelligent processing</div>
                <button type="button" onclick="deleteUploadedFile()" style="background: #f44336; margin-top: 10px; width: auto; padding: 5px 15px;">Delete & Re-upload</button>
            `;
            
            alert(`File loaded successfully: ${json.length} templates found and ready for AI/NLP classification`);
            
        } catch (error) {
            alert('Error reading file: ' + error.message);
            console.error('File processing error:', error);
        }
    };
    
    reader.onerror = function() {
        alert('Error reading file!');
    };
    
    // Read file based on type
    if (file.name.endsWith('.csv')) {
        reader.readAsText(file, 'utf-8');
    } else {
        reader.readAsArrayBuffer(file);
    }
}

function deleteUploadedFile() {
    // Clear the file input and data
    fileInput.value = '';
    originalData = [];
    uploadedFileName = '';
    sessionStorage.removeItem('templatesData');
    
    // Reset upload area
    uploadArea.innerHTML = `
        <span>🤖 Upload File for AI Classification</span><br>
        Drag or Choose File (XLSX/CSV)
    `;
    
    // Clear output
    document.getElementById('output').innerHTML = '';
    
    alert('File deleted successfully. Upload a new file for intelligent classification.');
}

function getAgentNames() {
    const agents = [];
    for (let i = 1; i <= peopleCount; i++) {
        const agentInput = document.getElementById(`person${i}`);
        if (agentInput && agentInput.value.trim()) {
            agents.push(agentInput.value.trim());
        }
    }
    
    // Fallback to default agents if none provided
    if (agents.length === 0) {
        return ['Agent1', 'Agent2', 'Agent3', 'Agent4'];
    }
    
    return agents;
}

// Process single template classification
function processSingle() {
    console.log('Processing single template...');
    
    const message = document.getElementById('singleMessage').value.trim();
    const templateTypeElement = document.getElementById('templateType');
    const confidenceScoreElement = document.getElementById('confidenceScore');
    const variableFormatElement = document.getElementById('variableFormat');
    
    if (!message) {
        alert('Please enter a template message to analyze!');
        return;
    }
    
    // Show loading state
    templateTypeElement.textContent = 'Analyzing...';
    confidenceScoreElement.textContent = 'Calculating...';
    variableFormatElement.textContent = 'Checking...';
    
    // Simulate AI processing delay
    setTimeout(() => {
        try {
            // Perform AI classification
            const classification = classifyTemplateWithConfidence(message);
            const variableFormat = checkVariableFormat(message);
            
            // Update results - ONLY 3 OUTPUTS
            templateTypeElement.textContent = classification.type;
            confidenceScoreElement.textContent = classification.confidence + '%';
            variableFormatElement.textContent = variableFormat;
            
            // Highlight results based on confidence
            if (classification.confidence >= 80) {
                confidenceScoreElement.style.color = '#28a745';
            } else if (classification.confidence >= 70) {
                confidenceScoreElement.style.color = '#ffc107';
            } else {
                confidenceScoreElement.style.color = '#dc3545';
            }
            
            // Highlight variable format
            if (variableFormat === 'OK') {
                variableFormatElement.style.color = '#28a745';
            } else {
                variableFormatElement.style.color = '#dc3545';
            }
            
            console.log('Single template analysis completed:', {
                type: classification.type,
                confidence: classification.confidence,
                variableFormat: variableFormat
            });
            
        } catch (error) {
            console.error('Error in single template processing:', error);
            templateTypeElement.textContent = 'Error';
            confidenceScoreElement.textContent = 'Error';
            variableFormatElement.textContent = 'Error';
        }
    }, 1000); // 1 second delay to simulate AI processing
}

// Reset single template form
function resetSingle() {
    document.getElementById('singleMessage').value = '';
    document.getElementById('templateType').textContent = '-';
    document.getElementById('confidenceScore').textContent = '-';
    document.getElementById('variableFormat').textContent = '-';
    
    // Reset colors
    document.getElementById('confidenceScore').style.color = '';
    document.getElementById('variableFormat').style.color = '';
    
    console.log('Single template form reset');
}

function processBulk() {
    const dataStr = sessionStorage.getItem('templatesData');
    if (!dataStr) {
        alert('Please upload a file first!');
        return;
    }
    
    try {
        const data = JSON.parse(dataStr);
        const agents = getAgentNames();
        
        if (agents.length === 0) {
            alert('Please add at least one agent name!');
            return;
        }
        
        const output = [];
        let processedCount = 0;
        let reviewCount = 0;
        const classificationDate = new Date().toISOString().split('T')[0];
        
        // Show processing indicator
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.textContent = 'Processing with AI...';
            submitBtn.disabled = true;
        }
        
        data.forEach((row, index) => {
            // Find the template message column
            const messageColumnNames = ['TEMPLATE MESSAGE', 'Template_Content', 'MESSAGE', 'template_message', 'Content', 'Template Message'];
            let templateMessage = '';
            
            for (const colName of messageColumnNames) {
                if (row[colName]) {
                    templateMessage = row[colName].toString().trim();
                    break;
                }
            }
            
            // Find entity column
            const entityColumnNames = ['ENTITY', 'Entity_Name', 'BRAND', 'entity', 'Entity Name'];
            let entityName = '';
            
            for (const colName of entityColumnNames) {
                if (row[colName]) {
                    entityName = row[colName].toString().trim();
                    break;
                }
            }
            
            if (templateMessage) {
                // AI/NLP Classification
                const classification = classifyTemplateWithConfidence(templateMessage);
                let templateType = classification.type;
                
                // Flag for manual review if confidence < 70%
                if (classification.confidence < 70) {
                    templateType += ' (Review)';
                    reviewCount++;
                }
                
                // Create new row with ALL original columns preserved
                const processedRow = { ...row }; // Spread all original columns
                
                // Add the 5 required new columns
                processedRow['Template_Type'] = templateType;
                processedRow['Confidence'] = classification.confidence + '%';
                processedRow['Variable_Format'] = checkVariableFormat(templateMessage);
                processedRow['Agent_Name'] = assignAgentByEntity(entityName || `Entity_${index + 1}`, agents);
                processedRow['Classification_Date'] = classificationDate;
                
                output.push(processedRow);
                processedCount++;
            }
        });
        
        // Reset button
        if (submitBtn) {
            submitBtn.textContent = 'Process Templates';
            submitBtn.disabled = false;
        }
        
        if (output.length === 0) {
            alert('No valid templates found! Please check your file format.');
            return;
        }
        
        // Generate Excel file with all columns
        const ws = XLSX.utils.json_to_sheet(output);
        const wb = XLSX.utils.book_new();
        
        // Auto-fit column widths
        const colWidths = [];
        const headers = Object.keys(output[0]);
        
        headers.forEach(header => {
            const maxLength = Math.max(
                header.length,
                ...output.slice(0, 100).map(row => 
                    row[header] ? row[header].toString().length : 0
                )
            );
            colWidths.push({ wch: Math.min(maxLength + 2, 50) });
        });
        
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, 'AI_Classification');
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
        const filename = `AI_Classified_${timestamp}.xlsx`;
        
        XLSX.writeFile(wb, filename);
        
        alert(`🤖 AI Classification Complete!\n${processedCount} templates processed\n${reviewCount} flagged for manual review\nDownloaded: ${filename}`);
        
        // Display enhanced summary
        displayEnhancedSummary(output, agents, reviewCount);
        
    } catch (error) {
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.textContent = 'Process Templates';
            submitBtn.disabled = false;
        }
        alert('Error processing data: ' + error.message);
        console.error('Processing error:', error);
    }
}

function displayEnhancedSummary(output, agents, reviewCount) {
    // ✅ ENHANCED: Check if classification page is visible
    const classificationPage = document.getElementById('classificationPage');
    const dashboardPage = document.getElementById('dashboardPage');
    
    // More reliable check using computed style
    const isClassificationVisible = classificationPage && 
        window.getComputedStyle(classificationPage).display !== 'none';
    const isDashboardVisible = dashboardPage && 
        window.getComputedStyle(dashboardPage).display !== 'none';
    
    console.log('🔍 Page Visibility Check:');
    console.log('- Classification page visible:', isClassificationVisible);
    console.log('- Dashboard page visible:', isDashboardVisible);
    
    // Only show results if classification page is visible AND dashboard is NOT visible
    if (!isClassificationVisible || isDashboardVisible) {
        console.log('🚫 Classification results hidden - dashboard is active');
        return;
    }
    
    console.log('✅ Showing classification results - classification page is active');

    const summary = {
        total: output.length,
        transactional: output.filter(row => row.Template_Type.includes('Transactional')).length,
        serviceImplicit: output.filter(row => row.Template_Type.includes('Service-Implicit')).length,
        serviceExplicit: output.filter(row => row.Template_Type.includes('Service-Explicit')).length,
        validFormat: output.filter(row => row.Variable_Format === 'OK').length,
        invalidFormat: output.filter(row => row.Variable_Format !== 'OK').length,
        needsReview: reviewCount
    };
    
    // Calculate confidence statistics
    const confidenceValues = output.map(row => parseInt(row.Confidence.replace('%', '')));
    const avgConfidence = Math.round(confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length);
    const highConfidence = confidenceValues.filter(c => c >= 80).length;
    const mediumConfidence = confidenceValues.filter(c => c >= 70 && c < 80).length;
    const lowConfidence = confidenceValues.filter(c => c < 70).length;
    
    // Agent distribution
    const agentDistribution = {};
    agents.forEach(agent => {
        agentDistribution[agent] = output.filter(row => row.Agent_Name === agent).length;
    });
    
    const outputDiv = document.getElementById('output');
    if (!outputDiv) return;
    
    outputDiv.innerHTML = `
        <div class="dashboard-results">
            <div class="dashboard-header">
                <div class="dashboard-title">
                    <span>🤖 AI Classification Dashboard</span>
                    <span class="dashboard-badge">v2.0</span>
                </div>
                <div style="color: rgba(255,255,255,0.8); font-size: var(--font-size-sm);">
                    ${new Date().toLocaleDateString()} • ${output.length} Templates
                </div>
            </div>
            
            <div class="dashboard-content">
                <!-- Stats Overview -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${summary.total}</div>
                        <div class="stat-label">Total Templates</div>
                        <div class="stat-percentage">100% Processed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${summary.serviceImplicit + summary.serviceExplicit}</div>
                        <div class="stat-label">Service Templates</div>
                        <div class="stat-percentage">${(((summary.serviceImplicit + summary.serviceExplicit)/summary.total)*100).toFixed(1)}%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${summary.transactional}</div>
                        <div class="stat-label">Transactional</div>
                        <div class="stat-percentage">${((summary.transactional/summary.total)*100).toFixed(1)}%</div>
                    </div>
                    <div class="stat-card ${summary.needsReview > 0 ? 'warning' : ''}">
                        <div class="stat-number">${summary.needsReview}</div>
                        <div class="stat-label">Manual Review</div>
                        <div class="stat-percentage">${((summary.needsReview/summary.total)*100).toFixed(1)}%</div>
                    </div>
                </div>

                <!-- Classification Summary -->
                <div class="summary-card">
                    <h4>📊 Classification Breakdown</h4>
                    <table class="dashboard-table">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Count</th>
                                <th>Percentage</th>
                                <th>Distribution</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Transactional</td>
                                <td>${summary.transactional}</td>
                                <td class="status-high">${((summary.transactional/summary.total)*100).toFixed(1)}%</td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${((summary.transactional/summary.total)*100)}%"></div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>Service-Implicit</td>
                                <td>${summary.serviceImplicit}</td>
                                <td class="status-medium">${((summary.serviceImplicit/summary.total)*100).toFixed(1)}%</td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${((summary.serviceImplicit/summary.total)*100)}%"></div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>Service-Explicit</td>
                                <td>${summary.serviceExplicit}</td>
                                <td class="status-medium">${((summary.serviceExplicit/summary.total)*100).toFixed(1)}%</td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${((summary.serviceExplicit/summary.total)*100)}%"></div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Manual Review</strong></td>
                                <td><strong>${summary.needsReview}</strong></td>
                                <td class="status-warning"><strong>${((summary.needsReview/summary.total)*100).toFixed(1)}%</strong></td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${((summary.needsReview/summary.total)*100)}%; background: var(--tanla-coral);"></div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Confidence & Format Analysis -->
                <div class="summary-cards">
                    <div class="summary-card">
                        <h4>🎯 Confidence Analysis</h4>
                        <table class="dashboard-table">
                            <tbody>
                                <tr>
                                    <td>Average Confidence</td>
                                    <td class="status-high">${avgConfidence}%</td>
                                </tr>
                                <tr>
                                    <td>High (≥80%)</td>
                                    <td class="status-high">${highConfidence} (${((highConfidence/summary.total)*100).toFixed(1)}%)</td>
                                </tr>
                                <tr>
                                    <td>Medium (70-79%)</td>
                                    <td class="status-medium">${mediumConfidence} (${((mediumConfidence/summary.total)*100).toFixed(1)}%)</td>
                                </tr>
                                <tr>
                                    <td>Low (<70%)</td>
                                    <td class="status-low">${lowConfidence} (${((lowConfidence/summary.total)*100).toFixed(1)}%)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="summary-card">
                        <h4>✅ Variable Format</h4>
                        <table class="dashboard-table">
                            <tbody>
                                <tr>
                                    <td>Valid Format</td>
                                    <td class="status-ok">${summary.validFormat} (${((summary.validFormat/summary.total)*100).toFixed(1)}%)</td>
                                </tr>
                                <tr>
                                    <td>Invalid Format</td>
                                    <td class="status-warning">${summary.invalidFormat} (${((summary.invalidFormat/summary.total)*100).toFixed(1)}%)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Agent Assignment -->
                <div class="summary-card">
                    <h4>👥 Agent Assignment</h4>
                    <div class="agent-distribution">
                        ${Object.entries(agentDistribution).map(([agent, count]) => 
                            `<div class="agent-tag">
                                ${agent}
                                <span class="agent-count">${count}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>

                <!-- Processing Details -->
                <div class="processing-info">
                    <p><strong>📋 Processing Details</strong></p>
                    <p>• Classification Date: ${output[0]?.Classification_Date || 'N/A'}</p>
                    <p>• Original File: ${uploadedFileName || 'N/A'}</p>
                    <p>• AI Engine: Enhanced NLP with contextual analysis</p>
                    <p>• All original columns preserved + 5 new columns added</p>
                    ${summary.needsReview > 0 ? 
                        `<p style="color: var(--tanla-coral); margin-top: 8px;">
                            ⚠️ ${summary.needsReview} templates flagged for manual review (confidence < 70%)
                        </p>` : 
                        '<p style="color: #28a745; margin-top: 8px;">✅ All templates processed with high confidence</p>'
                    }
                </div>
            </div>
        </div>
    `;
    
    // ✅ ENABLE NORMAL PAGE SCROLLING
    setTimeout(() => {
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.overflowY = 'auto';
            mainContent.style.height = 'calc(100vh - 60px)';
        }
    }, 100);
}

// Make functions globally available
window.processSingle = processSingle;
window.resetSingle = resetSingle;
window.processBulk = processBulk;
window.classifyTemplateWithConfidence = classifyTemplateWithConfidence;
window.checkVariableFormat = checkVariableFormat;
window.getAgentNames = getAgentNames;
window.addPerson = addPerson;
window.deleteUploadedFile = deleteUploadedFile;