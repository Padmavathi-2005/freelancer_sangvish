import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for Admin Sidebar and Login translations...");

  const translations = [
    // English (EN)
    { code: 'EN', key: 'admin_verifying_access', value: 'Verifying administration access session...' },
    { code: 'EN', key: 'admin', value: 'Admin' },
    { code: 'EN', key: 'admin_administrator', value: 'Administrator' },
    { code: 'EN', key: 'active', value: 'Active' },
    { code: 'EN', key: 'admin_core_overview', value: 'Core Overview' },
    { code: 'EN', key: 'admin_my_profile', value: 'My profile' },
    { code: 'EN', key: 'admin_user_management', value: 'User Management' },
    { code: 'EN', key: 'admin_onboarding_directory', value: 'Onboarding directory' },
    { code: 'EN', key: 'admin_marketplace', value: 'Marketplace' },
    { code: 'EN', key: 'admin_project_management', value: 'Project management' },
    { code: 'EN', key: 'admin_project_listings', value: 'Project listings' },
    { code: 'EN', key: 'admin_project_proposals', value: 'Project proposals' },
    { code: 'EN', key: 'admin_form_config', value: 'Form Config' },
    { code: 'EN', key: 'admin_project_contracts', value: 'Project contracts' },
    { code: 'EN', key: 'admin_gig_management', value: 'Gig management' },
    { code: 'EN', key: 'admin_gig_listings', value: 'Gig listings' },
    { code: 'EN', key: 'admin_gig_contracts', value: 'Gig contracts' },
    { code: 'EN', key: 'admin_categories_skills', value: 'Categories & Skills' },
    { code: 'EN', key: 'admin_subscription_plans', value: 'Subscription Plans' },
    { code: 'EN', key: 'admin_finance_mediation', value: 'Finance & Mediation' },
    { code: 'EN', key: 'admin_transaction_payments', value: 'Transaction & payments' },
    { code: 'EN', key: 'admin_disputes_alerts', value: 'Disputes & Alerts' },
    { code: 'EN', key: 'admin_payouts_wallets', value: 'Payouts & Wallets' },
    { code: 'EN', key: 'admin_referral_payouts', value: 'Referral Payouts' },
    { code: 'EN', key: 'admin_affiliate_payouts', value: 'Affiliate Payouts' },
    { code: 'EN', key: 'admin_contact_inquiries', value: 'Contact Inquiries' },
    { code: 'EN', key: 'admin_newsletter_subscribers', value: 'Newsletter Subscribers' },
    { code: 'EN', key: 'admin_career_applications', value: 'Career Applications' },
    { code: 'EN', key: 'admin_marketing_seo', value: 'Marketing & SEO' },
    { code: 'EN', key: 'admin_search_analytics', value: 'Search Analytics' },
    { code: 'EN', key: 'admin_seo_preview', value: 'SEO & Meta Preview' },
    { code: 'EN', key: 'admin_content_settings', value: 'Content & Settings' },
    { code: 'EN', key: 'admin_cms_pages', value: 'CMS Pages' },
    { code: 'EN', key: 'admin_manage_blogs', value: 'Manage Blogs' },
    { code: 'EN', key: 'admin_system_settings', value: 'System Settings' },
    { code: 'EN', key: 'admin_system_maintenance', value: 'System & Maintenance' },
    { code: 'EN', key: 'admin_languages_currencies', value: 'Languages & Currencies' },
    { code: 'EN', key: 'admin_db_cleanup', value: 'Database Cleanup' },
    { code: 'EN', key: 'admin_db_backups', value: 'DB Backups' },
    { code: 'EN', key: 'admin_logout', value: 'Logout' },
    { code: 'EN', key: 'admin_control_terminal', value: 'Control Terminal' },

    { code: 'EN', key: 'admin_login_verifying_access', value: 'Verifying Admin Access...' },
    { code: 'EN', key: 'admin_login_err_fill_all', value: 'Please fill in all security fields.' },
    { code: 'EN', key: 'admin_login_err_network', value: 'Cannot reach the server. Please check your internet connection or try again later.' },
    { code: 'EN', key: 'admin_login_err_server', value: 'Server returned an unexpected response. The backend may be down or unreachable.' },
    { code: 'EN', key: 'admin_login_err_credentials', value: 'Invalid credentials. Please check your email and password.' },
    { code: 'EN', key: 'admin_login_err_connect', value: 'Failed to connect to the administration service.' },
    { code: 'EN', key: 'admin_login_secure_terminal', value: '⚠️ SECURE TERMINAL - AUTHORIZED ONLY' },
    { code: 'EN', key: 'admin_login_title', value: 'Admin Login' },
    { code: 'EN', key: 'admin_login_subtitle', value: 'Provide authorization key and security credentials' },
    { code: 'EN', key: 'admin_login_username_label', value: 'Admin Username' },
    { code: 'EN', key: 'admin_login_password_label', value: 'Access Password' },
    { code: 'EN', key: 'admin_login_initializing', value: 'Initializing Admin Session...' },
    { code: 'EN', key: 'admin_login_verify_btn', value: 'Verify Security Credentials' },
    { code: 'EN', key: 'admin_login_not_admin', value: 'Not an administrator?' },
    { code: 'EN', key: 'admin_login_return_home', value: 'Return to Homepage' },

    // Arabic (AR)
    { code: 'AR', key: 'admin_verifying_access', value: 'جاري التحقق من جلسة صلاحية الوصول للوحة الإشراف...' },
    { code: 'AR', key: 'admin', value: 'لوحة التحكم' },
    { code: 'AR', key: 'admin_administrator', value: 'المدير العام' },
    { code: 'AR', key: 'active', value: 'نشط' },
    { code: 'AR', key: 'admin_core_overview', value: 'نظرة عامة رئيسية' },
    { code: 'AR', key: 'admin_my_profile', value: 'ملفي الشخصي' },
    { code: 'AR', key: 'admin_user_management', value: 'إدارة المستخدمين' },
    { code: 'AR', key: 'admin_onboarding_directory', value: 'دليل التسجيل والتهيئة' },
    { code: 'AR', key: 'admin_marketplace', value: 'السوق والخدمات' },
    { code: 'AR', key: 'admin_project_management', value: 'إدارة المشاريع' },
    { code: 'AR', key: 'admin_project_listings', value: 'قوائم المشاريع' },
    { code: 'AR', key: 'admin_project_proposals', value: 'عروض المشاريع' },
    { code: 'AR', key: 'admin_form_config', value: 'تكوين النماذج' },
    { code: 'AR', key: 'admin_project_contracts', value: 'عقود المشاريع' },
    { code: 'AR', key: 'admin_gig_management', value: 'إدارة الخدمات المصغرة' },
    { code: 'AR', key: 'admin_gig_listings', value: 'قوائم الخدمات' },
    { code: 'AR', key: 'admin_gig_contracts', value: 'عقود الخدمات' },
    { code: 'AR', key: 'admin_categories_skills', value: 'الأقسام والمهارات' },
    { code: 'AR', key: 'admin_subscription_plans', value: 'باقات الاشتراك' },
    { code: 'AR', key: 'admin_finance_mediation', value: 'المالية والوساطة' },
    { code: 'AR', key: 'admin_transaction_payments', value: 'المعاملات والمدفوعات' },
    { code: 'AR', key: 'admin_disputes_alerts', value: 'النزاعات والتنبيهات' },
    { code: 'AR', key: 'admin_payouts_wallets', value: 'المدفوعات والمحافظ' },
    { code: 'AR', key: 'admin_referral_payouts', value: 'أرباح الإحالة' },
    { code: 'AR', key: 'admin_affiliate_payouts', value: 'أرباح التسويق بالعمولة' },
    { code: 'AR', key: 'admin_contact_inquiries', value: 'استفسارات الاتصال' },
    { code: 'AR', key: 'admin_newsletter_subscribers', value: 'مشتركو النشرة البريدية' },
    { code: 'AR', key: 'admin_career_applications', value: 'طلبات التوظيف' },
    { code: 'AR', key: 'admin_marketing_seo', value: 'التسويق وتحسين محركات البحث' },
    { code: 'AR', key: 'admin_search_analytics', value: 'تحليلات البحث' },
    { code: 'AR', key: 'admin_seo_preview', value: 'معاينة محركات البحث والميتا' },
    { code: 'AR', key: 'admin_content_settings', value: 'المحتوى والإعدادات' },
    { code: 'AR', key: 'admin_cms_pages', value: 'صفحات CMS للمحتوى' },
    { code: 'AR', key: 'admin_manage_blogs', value: 'إدارة المدونات' },
    { code: 'AR', key: 'admin_system_settings', value: 'إعدادات النظام' },
    { code: 'AR', key: 'admin_system_maintenance', value: 'النظام والصيانة' },
    { code: 'AR', key: 'admin_languages_currencies', value: 'اللغات والعملات' },
    { code: 'AR', key: 'admin_db_cleanup', value: 'تنظيف قاعدة البيانات' },
    { code: 'AR', key: 'admin_db_backups', value: 'النسخ الاحتياطي' },
    { code: 'AR', key: 'admin_logout', value: 'تسجيل الخروج' },
    { code: 'AR', key: 'admin_control_terminal', value: 'لوحة التحكم والتحكم' },

    { code: 'AR', key: 'admin_login_verifying_access', value: 'جاري التحقق من صلاحية وصول المشرف...' },
    { code: 'AR', key: 'admin_login_err_fill_all', value: 'يرجى ملء جميع حقول الأمان.' },
    { code: 'AR', key: 'admin_login_err_network', value: 'لا يمكن الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت الخاص بك أو المحاولة لاحقاً.' },
    { code: 'AR', key: 'admin_login_err_server', value: 'أرجع الخادم استجابة غير متوقعة. قد يكون النظام معطلاً أو غير قابل للوصول.' },
    { code: 'AR', key: 'admin_login_err_credentials', value: 'بيانات الاعتماد غير صالحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.' },
    { code: 'AR', key: 'admin_login_err_connect', value: 'فشل الاتصال بخدمة الإدارة والتحكم.' },
    { code: 'AR', key: 'admin_login_secure_terminal', value: '⚠️ محطة آمنة - للمصرح لهم فقط' },
    { code: 'AR', key: 'admin_login_title', value: 'تسجيل دخول المشرف' },
    { code: 'AR', key: 'admin_login_subtitle', value: 'تقديم مفتاح المصادقة وبيانات الاعتماد الأمنية' },
    { code: 'AR', key: 'admin_login_username_label', value: 'اسم المستخدم للمشرف' },
    { code: 'AR', key: 'admin_login_password_label', value: 'كلمة مرور الوصول' },
    { code: 'AR', key: 'admin_login_initializing', value: 'جاري بدء جلسة المشرف...' },
    { code: 'AR', key: 'admin_login_verify_btn', value: 'التحقق من بيانات الاعتماد الأمنية' },
    { code: 'AR', key: 'admin_login_not_admin', value: 'لست مشرفاً؟' },
    { code: 'AR', key: 'admin_login_return_home', value: 'العودة إلى الصفحة الرئيسية' }
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

  console.log(`✅ Successfully seeded ${insertedCount} Admin Sidebar and Login translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
