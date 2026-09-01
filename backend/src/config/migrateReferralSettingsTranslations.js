import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for Admin Referral Settings translations...");

  const translations = [
    // English (EN)
    { code: 'EN', key: 'admin_ref_title', value: 'Refer & Earn Configuration' },
    { code: 'EN', key: 'admin_ref_subtitle', value: 'Configure sign-up rewards and tiered promoter bonuses based on referral volumes' },
    { code: 'EN', key: 'admin_ref_signup_title', value: 'Sign-up Bonus settings' },
    { code: 'EN', key: 'admin_ref_enable_signup', value: 'Enable Referred Sign-up Bonus' },
    { code: 'EN', key: 'admin_ref_referred_user_bonus', value: 'Referred User Sign-up Bonus ($)' },
    { code: 'EN', key: 'admin_ref_referred_user_bonus_desc', value: 'Amount credited to referred user\'s wallet after admin review and approval' },
    { code: 'EN', key: 'admin_ref_purchase_window', value: 'Referral Purchase Window (Days)' },
    { code: 'EN', key: 'admin_ref_days_from_reg', value: 'Days from Registration' },
    { code: 'EN', key: 'admin_ref_purchase_window_desc', value: 'Referred friends must complete their first project milestone or gig purchase within this number of days. If exceeded, the referral is marked unsuccessful and reward payout is forfeited.' },
    { code: 'EN', key: 'admin_ref_payout_requirements', value: 'Payout Approval Requirements & Auto-Credit Workflow' },
    { code: 'EN', key: 'admin_ref_payout_requirements_desc', value: 'Choose whether payouts require manual admin approval or get automatically credited into active wallet balances instantly.' },
    { code: 'EN', key: 'admin_ref_require_signup_approval', value: '🎁 Require Admin Approval for Sign-Up Bonus' },
    { code: 'EN', key: 'admin_ref_require_signup_approval_enabled', value: 'ENABLED: Sign-up bonuses ($2.00) are logged as Pending Admin Approval.' },
    { code: 'EN', key: 'admin_ref_require_signup_approval_disabled', value: 'DISABLED (AUTO-CREDIT): Sign-up bonuses ($2.00) are credited automatically to user active wallet balance immediately upon onboarding setup.' },
    { code: 'EN', key: 'admin_ref_require_rewards_approval', value: '💰 Require Admin Approval for Referral Rewards' },
    { code: 'EN', key: 'admin_ref_require_rewards_approval_enabled', value: 'ENABLED: Referral promoter rewards require admin approval before wallet release.' },
    { code: 'EN', key: 'admin_ref_require_rewards_approval_disabled', value: 'DISABLED (AUTO-CREDIT): Referral promoter rewards are credited automatically to referrer active wallet balance upon first completed order.' },
    { code: 'EN', key: 'admin_ref_require_aff_approval', value: '⚡ Require Admin Approval for Affiliate Commissions' },
    { code: 'EN', key: 'admin_ref_require_aff_approval_enabled', value: 'ENABLED: Affiliate commissions require admin approval before wallet release.' },
    { code: 'EN', key: 'admin_ref_require_aff_approval_disabled', value: 'DISABLED (AUTO-CREDIT): Affiliate commissions are credited automatically to affiliate active wallet balance immediately upon earning.' },
    { code: 'EN', key: 'admin_ref_promoter_payout_tiers', value: 'Referral Promoter Payout Tiers' },
    { code: 'EN', key: 'admin_ref_promoter_payout_tiers_desc', value: 'Determine how much referrers earn based on successful referral counts' },
    { code: 'EN', key: 'admin_ref_add_rule_btn', value: 'Add Referral Payout Rule' },
    { code: 'EN', key: 'admin_ref_th_min_referrals', value: 'Min Successful Referrals' },
    { code: 'EN', key: 'admin_ref_th_payout_amount', value: 'Referrer Payout Amount ($)' },
    { code: 'EN', key: 'admin_ref_actions', value: 'Actions' },
    { code: 'EN', key: 'admin_ref_no_tiers', value: 'No referral payout tiers configured. Promoters will fall back to a default payout of $10.00.' },
    { code: 'EN', key: 'admin_ref_aff_payout_tiers', value: 'Affiliate Promoter Payout Tiers' },
    { code: 'EN', key: 'admin_ref_aff_payout_tiers_desc', value: 'Determine the percentage (%) affiliates earn from the product / order price based on successful conversions' },
    { code: 'EN', key: 'admin_ref_add_aff_rule_btn', value: 'Add Affiliate Payout Rule' },
    { code: 'EN', key: 'admin_ref_th_min_conversions', value: 'Min Successful Conversions' },
    { code: 'EN', key: 'admin_ref_th_commission_rate', value: 'Affiliate Commission Rate (%)' },
    { code: 'EN', key: 'admin_ref_preview_title', value: '💡 Dynamic Product Price & Payout Preview' },
    { code: 'EN', key: 'admin_ref_preview_tier', value: 'Tier' },
    { code: 'EN', key: 'admin_ref_preview_sales', value: 'sales @' },
    { code: 'EN', key: 'admin_ref_preview_for_product', value: 'For a product/order price of' },
    { code: 'EN', key: 'admin_ref_preview_receives', value: ', affiliate receives' },
    { code: 'EN', key: 'admin_ref_preview_payout', value: 'payout.' },
    { code: 'EN', key: 'admin_ref_no_aff_tiers', value: 'No affiliate payout tiers configured. Affiliates will fall back to default payout percentage.' },
    { code: 'EN', key: 'admin_ref_save_btn', value: 'Save Referral Configurations' },
    { code: 'EN', key: 'admin_ref_saving', value: 'Saving Changes...' },

    // Arabic (AR)
    { code: 'AR', key: 'admin_ref_title', value: 'إعدادات الإحالة والكسب' },
    { code: 'AR', key: 'admin_ref_subtitle', value: 'تكوين مكافآت التسجيل ومكافآت الترويج المتدرجة بناءً على حجم الإحالات' },
    { code: 'AR', key: 'admin_ref_signup_title', value: 'إعدادات مكافأة التسجيل' },
    { code: 'AR', key: 'admin_ref_enable_signup', value: 'تفعيل مكافأة التسجيل للمستخدم المُحال' },
    { code: 'AR', key: 'admin_ref_referred_user_bonus', value: 'مكافأة تسجيل المستخدم المُحال ($)' },
    { code: 'AR', key: 'admin_ref_referred_user_bonus_desc', value: 'المبلغ المودع في محفظة المستخدم المُحال بعد مراجعة المسؤول وموافقته' },
    { code: 'AR', key: 'admin_ref_purchase_window', value: 'فترة الشراء للإحالة (بالأيام)' },
    { code: 'AR', key: 'admin_ref_days_from_reg', value: 'أيام من تاريخ التسجيل' },
    { code: 'AR', key: 'admin_ref_purchase_window_desc', value: 'يجب على الأصدقاء المُحالين إكمال أول مرحلة مشروع أو شراء خدمة خلال هذا العدد من الأيام. في حالة التجاوز، تُعتبر الإحالة غير ناجحة وتُصادر المكافأة.' },
    { code: 'AR', key: 'admin_ref_payout_requirements', value: 'متطلبات الموافقة على الدفع وسير عمل الإيداع التلقائي' },
    { code: 'AR', key: 'admin_ref_payout_requirements_desc', value: 'اختر ما إذا كانت عمليات الدفع تتطلب موافقة يدوية من المسؤول أو يتم إيداعها تلقائيًا في أرصدة المحفظة النشطة فورًا.' },
    { code: 'AR', key: 'admin_ref_require_signup_approval', value: '🎁 طلب موافقة المسؤول على مكافأة التسجيل' },
    { code: 'AR', key: 'admin_ref_require_signup_approval_enabled', value: 'مفعّل: يتم تسجيل مكافآت التسجيل ($2.00) كمعلقة بانتظار موافقة المسؤول.' },
    { code: 'AR', key: 'admin_ref_require_signup_approval_disabled', value: 'معطّل (إيداع تلقائي): يتم إيداع مكافآت التسجيل ($2.00) تلقائيًا في محفظة المستخدم النشطة فور التسجيل.' },
    { code: 'AR', key: 'admin_ref_require_rewards_approval', value: '💰 طلب موافقة المسؤول على مكافآت الإحالة' },
    { code: 'AR', key: 'admin_ref_require_rewards_approval_enabled', value: 'مفعّل: تتطلب مكافآت الإحالة موافقة المسؤول قبل إضافتها للمحفظة.' },
    { code: 'AR', key: 'admin_ref_require_rewards_approval_disabled', value: 'معطّل (إيداع تلقائي): يتم إيداع مكافآت الإحالة تلقائيًا في محفظة المُحيل النشطة عند إكمال أول طلب بنجاح.' },
    { code: 'AR', key: 'admin_ref_require_aff_approval', value: '⚡ طلب موافقة المسؤول على عمولات التسويق بالعمولة' },
    { code: 'AR', key: 'admin_ref_require_aff_approval_enabled', value: 'مفعّل: تتطلب عمولات التسويق بالعمولة موافقة المسؤول قبل إضافتها للمحفظة.' },
    { code: 'AR', key: 'admin_ref_require_aff_approval_disabled', value: 'معطّل (إيداع تلقائي): يتم إيداع عمولات التسويق بالعمولة تلقائيًا في محفظة المسوق النشطة فور كسبها.' },
    { code: 'AR', key: 'admin_ref_promoter_payout_tiers', value: 'مستويات دفع عمولة الإحالة' },
    { code: 'AR', key: 'admin_ref_promoter_payout_tiers_desc', value: 'تحديد مقدار ما يكسبه المروجون بناءً على عدد الإحالات الناجحة' },
    { code: 'AR', key: 'admin_ref_add_rule_btn', value: 'إضافة قاعدة دفع إحالة جديدة' },
    { code: 'AR', key: 'admin_ref_th_min_referrals', value: 'الحد الأدنى للإحالات الناجحة' },
    { code: 'AR', key: 'admin_ref_th_payout_amount', value: 'قيمة دفعة المُحيل ($)' },
    { code: 'AR', key: 'admin_ref_actions', value: 'الإجراءات' },
    { code: 'AR', key: 'admin_ref_no_tiers', value: 'لم يتم تكوين أي مستويات دفع إحالات. سيحصل المروجون تلقائيًا على دفعة افتراضية بقيمة $10.00.' },
    { code: 'AR', key: 'admin_ref_aff_payout_tiers', value: 'مستويات دفع عمولة التسويق بالعمولة' },
    { code: 'AR', key: 'admin_ref_aff_payout_tiers_desc', value: 'تحديد النسبة المئوية (%) التي يكسبها المسوقون من سعر المنتج / الطلب بناءً على التحويلات الناجحة' },
    { code: 'AR', key: 'admin_ref_add_aff_rule_btn', value: 'إضافة قاعدة دفع تسويق بالعمولة' },
    { code: 'AR', key: 'admin_ref_th_min_conversions', value: 'الحد الأدنى للتحويلات الناجحة' },
    { code: 'AR', key: 'admin_ref_th_commission_rate', value: 'نسبة عمولة التسويق بالعمولة (%)' },
    { code: 'AR', key: 'admin_ref_preview_title', value: '💡 معاينة ديناميكية لسعر المنتج والدفع' },
    { code: 'AR', key: 'admin_ref_preview_tier', value: 'المستوى' },
    { code: 'AR', key: 'admin_ref_preview_sales', value: 'مبيعات بنسبة' },
    { code: 'AR', key: 'admin_ref_preview_for_product', value: 'مقابل سعر منتج/طلب قدره' },
    { code: 'AR', key: 'admin_ref_preview_receives', value: '، يحصل المسوق على دفعة قدرها' },
    { code: 'AR', key: 'admin_ref_preview_payout', value: '.' },
    { code: 'AR', key: 'admin_ref_no_aff_tiers', value: 'لم يتم تكوين أي مستويات دفع عمولات تسويق بالعمولة. سيحصل المسوقون تلقائيًا على النسبة الافتراضية.' },
    { code: 'AR', key: 'admin_ref_save_btn', value: 'حفظ إعدادات الإحالة' },
    { code: 'AR', key: 'admin_ref_saving', value: 'جاري حفظ التغييرات...' }
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

  console.log(`✅ Successfully seeded ${insertedCount} Admin Referral Settings translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
