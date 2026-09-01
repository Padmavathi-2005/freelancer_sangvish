import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for CMS Page translations...");

  const translations = [
    // English (EN)
    { code: 'EN', key: 'information_portal_badge', value: 'Information Portal' },

    // Arabic (AR)
    { code: 'AR', key: 'information_portal_badge', value: 'بوابة المعلومات للمحتوى' },

    { code: 'AR', key: 'About Us', value: 'معلومات عنا' },
    { code: 'AR', key: 'FAQ', value: 'الأسئلة الشائعة' },
    { code: 'AR', key: 'Careers', value: 'الوظائف' },
    { code: 'AR', key: 'Contact', value: 'اتصل بنا' },
    { code: 'AR', key: 'Terms and Conditions', value: 'الشروط والأحكام' },
    { code: 'AR', key: 'Affiliate Terms and Conditions', value: 'شروط وأحكام نظام التسويق بالعمولة' },
    { code: 'AR', key: 'Newsletter Subscription', value: 'الاشتراك بالنشرة الإخبارية' },

    // About Us Page
    { code: 'AR', key: 'About Buy2Lancer', value: 'حول Buy2Lancer' },
    { code: 'AR', key: 'Connecting global talent with software challenges since 2026.', value: 'ربط المواهب العالمية بالتحديات البرمجية منذ عام 2026.' },
    { code: 'AR', key: "<p>Welcome to Buy2Lancer, the world's leading premium freelance developer marketplace. We bridge the gap between visionary clients and elite engineering talent globally.</p><p>We believe that top-tier software production shouldn't be gated by geographical borders or complex contracting overheads. By building transparent milestone escrows and vetted qualification criteria, we ensure a secure environment for product execution.</p>", value: "<p>مرحبًا بك في Buy2Lancer، منصة التوظيف المتميزة للمطورين المستقلين الرائدة عالميًا. نحن نجسر الفجوة بين العملاء ذوي الرؤى والمواهب الهندسية النخبوية على مستوى العالم.</p><p>نحن نؤمن بأن إنتاج البرمجيات من الدرجة الأولى لا ينبغي أن يكون مقيدًا بالحدود الجغرافية أو تكاليف التعاقد المعقدة. من خلال بناء ضمانات مالية شفافة للمراحل ومعايير تأهيل مدققة، فإننا نضمن بيئة آمنة لتنفيذ المنتجات.</p>" },
    { code: 'AR', key: 'Our Core Values', value: 'قيمنا الأساسية' },
    { code: 'AR', key: 'The principles that drive our community everyday.', value: 'المبادئ التي تقود مجتمعنا كل يوم.' },
    { code: 'AR', key: 'Commitment to Excellence', value: 'الالتزام بالتميز' },
    { code: 'AR', key: 'We vet our freelancers thoroughly to deliver state-of-the-art results.', value: 'نحن نفحص مستقلينا بدقة لتقديم أحدث النتائج وأفضلها.' },
    { code: 'AR', key: 'Transparency First', value: 'الشفافية أولاً' },
    { code: 'AR', key: 'Milestones and payment structures are explicitly tracked and secured.', value: 'يتم تتبع وتأمين المراحل وهياكل الدفع بشكل صريح.' },
    { code: 'AR', key: 'Absolute Security', value: 'أمان مطلق' },
    { code: 'AR', key: 'Your IP and funds are protected at all stages by robust escrow vaults.', value: 'الملكية الفكرية وأموالك محمية في جميع المراحل بواسطة خزائن الضمان المالي القوية.' },

    // FAQ Page
    { code: 'AR', key: 'Frequently Asked Questions', value: 'الأسئلة الشائعة' },
    { code: 'AR', key: 'Answers to common inquiries about workspace operations, payments, and safety.', value: 'أجوبة على الاستفسارات الشائعة حول عمليات مساحة العمل والمدفوعات والسلامة.' },
    { code: 'AR', key: 'General Queries', value: 'استفسارات عامة' },
    { code: 'AR', key: 'How does milestone escrow work?', value: 'كيف يعمل نظام الضمان المالي للمراحل؟' },
    { code: 'AR', key: 'When a project is created, the client deposits project funds into our escrow vault. The funds are securely held and automatically released to the freelancer only after the client reviews and approves the submitted deliverable.', value: 'عند إنشاء مشروع، يودع العميل أموال المشروع في خزينة الضمان المالي الخاصة بنا. يتم الاحتفاظ بالأموال بشكل آمن ويتم تحريرها تلقائيًا للمستقل فقط بعد مراجعة العميل للتسليم المقدم والموافقة عليه.' },
    { code: 'AR', key: 'What is the vetting process for freelancers?', value: 'ما هي عملية الفحص والتدقيق للمستقلين؟' },
    { code: 'AR', key: 'Every freelancer undergoes a background assessment, portfolio review, and optional vetting interviews by our admin team before they can bid on high-tier projects.', value: 'يخضع كل مستقل لتقييم الخلفية، ومراجعة معرض الأعمال، ومقابلات فحص اختيارية من قبل فريق الإدارة لدينا قبل أن يتمكن من تقديم عروض على المشاريع رفيعة المستوى.' },
    { code: 'AR', key: 'How are disputes resolved?', value: 'كيف يتم حل النزاعات؟' },
    { code: 'AR', key: 'If a conflict arises regarding milestone completeness, either party can file a dispute. Our neutral admin mediation team reviews submissions and decides on a fair disbursement.', value: 'إذا نشأ نزاع بشأن اكتمال مرحلة معينة، يمكن لأي من الطرفين رفع نزاع. يقوم فريق وساطة الإدارة المحايد لدينا بمراجعة الطلبات والتقرير بشأن الصرف العادل.' },
    { code: 'AR', key: 'Still have questions?', value: 'لا يزال لديك أسئلة؟' },
    { code: 'AR', key: 'Our friendly customer success agents are available 24/7 to resolve complex cases.', value: 'وكلاء نجاح العملاء الودودون لدينا متاحون على مدار الساعة طوال أيام الأسبوع لحل الحالات المعقدة.' },
    { code: 'AR', key: 'Contact Support', value: 'الاتصال بالدعم' },

    // Careers Page
    { code: 'AR', key: 'Careers at Buy2Lancer', value: 'الوظائف في Buy2Lancer' },
    { code: 'AR', key: 'Shape the future of global online collaboration.', value: 'ساهم في تشكيل مستقبل التعاون العالمي عبر الإنترنت.' },
    { code: 'AR', key: '<p>We are a distributed remote team of developers, designers, and customer success heroes. We build the infrastructure that empowers millions of freelancers around the globe to support their households.</p><p>We value ownership, open communication, and high-agency execution. If you thrive under autonomy and enjoy solving scale challenges, we would love to have you on board.</p>', value: '<p>نحن فريق عمل موزع عن بُعد يضم مطورين ومصممين وأبطال نجاح عملاء. نقوم ببناء البنية التحتية التي تمكن ملايين المستقلين حول العالم من دعم عائلاتهم.</p><p>نحن نقدر روح المبادرة والملكية، والتواصل المفتوح، والتنفيذ عالي الجودة. إذا كنت تزدهر في ظل الاستقلالية وتستمتع بحل تحديات التوسع البرمجي، فنحن نحب انضمامك إلينا.</p>' },
    { code: 'AR', key: 'Perks & Benefits', value: 'المزايا والفوائد' },
    { code: 'AR', key: 'Why you will love working here.', value: 'لماذا ستحب العمل معنا.' },
    { code: 'AR', key: '100% Remote Work', value: 'عمل عن بُعد 100%' },
    { code: 'AR', key: 'Work from anywhere in the world. Set your own flexible schedule.', value: 'اعمل من أي مكان في العالم. حدد جدولك المرن الخاص بك.' },
    { code: 'AR', key: 'Competitive Equity', value: 'مزايا أسهم تنافسية' },
    { code: 'AR', key: 'We offer stock options and salary packages matching Silicon Valley standards.', value: 'نحن نقدم خيارات الأسهم وحزم الرواتب التي تطابق معايير وادي السيليكون.' },
    { code: 'AR', key: 'Learning Budgets', value: 'ميزانيات التعليم والتدريب' },
    { code: 'AR', key: 'Get up to $2,000 annually for courses, bootcamps, and professional books.', value: 'احصل على ما يصل إلى 2000 دولار سنويًا للدورات التدريبية والمعسكرات التقنية والكتب المهنية.' },
    { code: 'AR', key: 'Want to build with us?', value: 'هل تريد البناء معنا؟' },
    { code: 'AR', key: 'Send your portfolio and cv to our recruitment division directly.', value: 'أرسل ملف أعمالك وسيرتك الذاتية إلى قسم التوظيف لدينا مباشرة.' },
    { code: 'AR', key: 'Email CV', value: 'إرسال السيرة الذاتية عبر البريد' },

    // Contact Page
    { code: 'AR', key: 'Contact Us', value: 'اتصل بنا' },
    { code: 'AR', key: 'Have an inquiry? We would love to hear from you.', value: 'هل لديك استفسار؟ يسعدنا التواصل معك.' },
    { code: 'AR', key: '<p>Our global operations team is dedicated to providing high-quality assistance around the clock.</p><p><strong>Customer Support:</strong> support@buy2lancer.com<br/><strong>Business Partnerships:</strong> partners@buy2lancer.com<br/><strong>HQ Office:</strong> 100 Pine Street, San Francisco, CA 94111, USA</p><p>Expected email response times are under 4 hours for standard accounts.</p>', value: '<p>فريق العمليات العالمي لدينا مخصص لتقديم المساعدة عالية الجودة على مدار الساعة.</p><p><strong>دعم العملاء:</strong> support@buy2lancer.com<br/><strong>شراكات الأعمال:</strong> partners@buy2lancer.com<br/><strong>المكتب الرئيسي:</strong> 100 Pine Street, San Francisco, CA 94111, USA</p><p>أوقات الاستجابة المتوقعة للبريد الإلكتروني أقل من 4 ساعات للحسابات العادية.</p>' },

    // Terms Page
    { code: 'AR', key: 'Last revised: June 2026', value: 'آخر مراجعة: يونيو 2026' },
    { code: 'AR', key: '<h3>1. Platform Registration</h3><p>By registering a client or freelancer account on Buy2Lancer, you agree to supply authentic details and keep your access credentials secure.</p><h3>2. Payments & Milestone Escrow</h3><p>Clients are required to fund milestone escrows before work starts. Freelancers deliver products on-platform. Releasing escrows constitutes confirmation that deliverables conform to terms.</p><h3>3. Platform Fees</h3><p>We deduct a nominal platform service fee from successful milestone disbursements to cover dispute resolution mechanisms and payment processing fees.</p>', value: '<h3>1. التسجيل بالمنصة</h3><p>من خلال تسجيل حساب عميل أو مستقل على منصة Buy2Lancer، فإنك توافق على تقديم تفاصيل موثوقة والحفاظ على أمان بيانات اعتماد الوصول الخاصة بك.</p><h3>2. المدفوعات والضمان المالي للمراحل</h3><p>يُطلب من العملاء تمويل حسابات الضمان للمراحل قبل بدء العمل. يقدم المستقلون المنتجات على المنصة. يشكل تحرير الضمانات تأكيدًا بأن التسليمات مطابقة للشروط المتفق عليها.</p><h3>3. رسوم المنصة</h3><p>نخصم رسوم خدمة منصة رمزية من مدفوعات المراحل الناجحة لتغطية آليات حل النزاعات ورسوم معالجة الدفع.</p>' },

    // Affiliate Terms Page
    { code: 'AR', key: 'Affiliate Agreement & Terms', value: 'اتفاقية وشروط التسويق بالعمولة' },
    { code: 'AR', key: 'Last revised: July 2026', value: 'آخر مراجعة: يوليو 2026' },
    { code: 'AR', key: '<p>Welcome to the LancerFlow Affiliate Program. Please review our official terms and conditions below before joining.</p><h4>1. Commission Model</h4><p>You will earn exactly 10% of the platform service fees collected by LancerFlow from transactions completed by users who sign up via your general referral link or any specific project/gig links.</p><h4>2. Payment Terms</h4><p>Commissions are tracked in a pending state until transactions are fully completed and cleared of disputes. Approved commissions will be credited directly to your main wallet balance.</p><h4>3. Specific Link Sharing</h4><p>As an affiliate, you are authorized to share individual gig cards and project cards. These custom shared links will store referral tokens in visitor sessions for up to 30 days.</p><h4>4. Spam and Compliance</h4><p>Any form of malicious link spamming, self-referral, fake registrations, or deceptive marketing practices is strictly prohibited and will result in immediate termination of your affiliate account and forfeiture of any earnings.</p>', value: '<p>مرحبًا بك في برنامج التسويق بالعمولة لمنصة Buy2Lancer. يرجى مراجعة الشروط والأحكام الرسمية أدناه قبل الانضمام.</p><h4>1. نموذج العمولات</h4><p>ستكسب 10٪ بالضبط من رسوم خدمة المنصة التي يتم جمعها بواسطة Buy2Lancer من المعاملات التي يكملها المستخدمون الذين يسجلون عبر رابط الإحالة العام الخاص بك أو أي روابط مشاريع/خدمات محددة.</p><h4>2. شروط الدفع</h4><p>يتم تتبع العمولات في حالة معلقة حتى تكتمل المعاملات بالكامل وتُسوى النزاعات. سيتم قيد العمولات المعتمدة مباشرة في رصيد محفظتك الرئيسية.</p><h4>3. مشاركة الروابط الخاصة</h4><p>بصفتك مسوقًا بالعمولة، يحق لك مشاركة بطاقات الخدمات والمشاريع الفردية. ستقوم هذه الروابط المشتركة المخصصة بتخزين رموز الإحالة في جلسات الزوار لمدة تصل إلى 30 يومًا.</p><h4>4. البريد المزعج والامتثال</h4><p>يحظر تمامًا أي شكل من أشكال إرسال الروابط المزعجة الخبيثة، أو الإحالة الذاتية، أو التسجيلات المزيفة، أو ممارسات التسويق المخادعة، وسيؤدي ذلك إلى إنهاء حساب الشريك على الرغم من ذلك ومصادرة جميع الأرباح.</p>' }
  ];

  let insertedCount = 0;
  for (const item of translations) {
    await pool.query(
      `INSERT INTO translations (language_code, key, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (language_code, key)
       DO UPDATE SET value = EXCLUDED.value`,
      [item.code, item.key, item.value]
    );
    insertedCount++;
  }

  console.log(`✅ Successfully seeded ${insertedCount} CMS translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
