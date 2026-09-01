import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for Admin Dashboard translations...");

  const translations = [
    // English (EN)
    { code: 'EN', key: 'admin_welcome_back', value: 'Welcome back' },
    { code: 'EN', key: 'admin_session_status', value: 'Session Status' },
    { code: 'EN', key: 'admin_security_active', value: 'Vetted Security Active' },
    { code: 'EN', key: 'admin_net_revenue', value: 'Net Revenue Profit' },
    { code: 'EN', key: 'admin_fee_rate_enabled', value: 'fee rate enabled' },
    { code: 'EN', key: 'admin_escrow_holdings', value: 'Escrow Holdings' },
    { code: 'EN', key: 'admin_held_securely', value: 'Held securely in active project escrows' },
    { code: 'EN', key: 'admin_ongoing_projects', value: 'Ongoing Projects' },
    { code: 'EN', key: 'admin_active_contracts_gigs', value: 'Active contracts & gigs' },
    { code: 'EN', key: 'admin_active_disputes', value: 'Active Disputes' },
    { code: 'EN', key: 'admin_under_mediation', value: 'Under platform mediation' },
    { code: 'EN', key: 'admin_vetting_warning', value: 'Freelancer onboarding reviews require attention' },
    { code: 'EN', key: 'admin_vetting_warning_desc_1', value: 'There are' },
    { code: 'EN', key: 'admin_vetting_warning_desc_2', value: 'contractor(s) awaiting onboarding vetting approval.' },
    { code: 'EN', key: 'admin_manage_onboarding', value: 'Manage Onboarding' },
    { code: 'EN', key: 'admin_revenue_stream', value: 'Platform Revenue Stream' },
    { code: 'EN', key: 'admin_revenue_stream_desc', value: 'Total commissions collected from contract payouts (Last 6 Months)' },
    { code: 'EN', key: 'admin_commissions_usd', value: 'Commissions (USD)' },
    { code: 'EN', key: 'admin_user_demographic', value: 'User Demographic' },
    { code: 'EN', key: 'admin_demographic_desc', value: 'Registration ratios & directory distribution' },
    { code: 'EN', key: 'admin_total_accounts', value: 'Total Accounts' },
    { code: 'EN', key: 'admin_unique_user_profiles', value: 'Unique user profiles' },
    { code: 'EN', key: 'admin_dual_role', value: 'dual-role' },
    { code: 'EN', key: 'admin_activity_ledger', value: 'System Activity Ledger' },
    { code: 'EN', key: 'admin_activity_ledger_desc', value: 'Live updates gathered from active platform entries' },
    { code: 'EN', key: 'admin_live_sync', value: 'Live Sync' },

    // Arabic (AR)
    { code: 'AR', key: 'admin_welcome_back', value: 'مرحباً بعودتك' },
    { code: 'AR', key: 'admin_session_status', value: 'حالة الجلسة' },
    { code: 'AR', key: 'admin_security_active', value: 'الأمان المفحوص نشط' },
    { code: 'AR', key: 'admin_net_revenue', value: 'صافي أرباح الإيرادات' },
    { code: 'AR', key: 'admin_fee_rate_enabled', value: 'معدل الرسوم مفعل' },
    { code: 'AR', key: 'admin_escrow_holdings', value: 'أرصدة الضمان المحتجزة' },
    { code: 'AR', key: 'admin_held_securely', value: 'محتجزة بأمان في حسابات ضمان المشاريع النشطة' },
    { code: 'AR', key: 'admin_ongoing_projects', value: 'المشاريع الجارية' },
    { code: 'AR', key: 'admin_active_contracts_gigs', value: 'العقود والخدمات النشطة' },
    { code: 'AR', key: 'admin_active_disputes', value: 'النزاعات النشطة' },
    { code: 'AR', key: 'admin_under_mediation', value: 'تحت وساطة المنصة' },
    { code: 'AR', key: 'admin_vetting_warning', value: 'مراجعات انضمام المستقلين تتطلب اهتماماً' },
    { code: 'AR', key: 'admin_vetting_warning_desc_1', value: 'هناك' },
    { code: 'AR', key: 'admin_vetting_warning_desc_2', value: 'مستقل (مستقلين) في انتظار موافقة تدقيق الانضمام.' },
    { code: 'AR', key: 'admin_manage_onboarding', value: 'إدارة عمليات التأهيل' },
    { code: 'AR', key: 'admin_revenue_stream', value: 'تدفق إيرادات المنصة' },
    { code: 'AR', key: 'admin_revenue_stream_desc', value: 'إجمالي العمولات المحصلة من دفعات العقود (آخر 6 أشهر)' },
    { code: 'AR', key: 'admin_commissions_usd', value: 'العمولات (بالدولار الأمريكي)' },
    { code: 'AR', key: 'admin_user_demographic', value: 'التركيبة السكانية للمستخدمين' },
    { code: 'AR', key: 'admin_demographic_desc', value: 'نسب التسجيل وتوزيع الدليل' },
    { code: 'AR', key: 'admin_total_accounts', value: 'إجمالي الحسابات' },
    { code: 'AR', key: 'admin_unique_user_profiles', value: 'ملفات تعريف مستخدم فريدة' },
    { code: 'AR', key: 'admin_dual_role', value: 'مزدوج الدور' },
    { code: 'AR', key: 'admin_activity_ledger', value: 'سجل أنشطة النظام' },
    { code: 'AR', key: 'admin_activity_ledger_desc', value: 'تحديثات مباشرة مجمعة من مدخلات المنصة النشطة' },
    { code: 'AR', key: 'admin_live_sync', value: 'مزامنة مباشرة' }
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

  console.log(`✅ Successfully seeded ${insertedCount} Admin Dashboard translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
