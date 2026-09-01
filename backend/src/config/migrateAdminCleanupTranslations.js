import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for Admin Database Cleanup translations...");

  const translations = [
    // English (EN)
    { code: 'EN', key: 'admin_cleanup_title', value: 'Database Cleanup & Reset' },
    { code: 'EN', key: 'admin_cleanup_subtitle', value: 'Reset transaction and order data. The following database table records will be permanently deleted:' },
    { code: 'EN', key: 'admin_cleanup_affected_tables', value: 'Affected Tables' },
    { code: 'EN', key: 'admin_cleanup_gigs_skills', value: 'Gigs & Skills' },
    { code: 'EN', key: 'admin_cleanup_gigs_skills_desc', value: 'Deletes all listed freelancer services and skill associations.' },
    { code: 'EN', key: 'admin_cleanup_jobs_proposals', value: 'Jobs & Bid Proposals' },
    { code: 'EN', key: 'admin_cleanup_jobs_proposals_desc', value: 'Deletes all client-posted custom jobs and developer bid proposals.' },
    { code: 'EN', key: 'admin_cleanup_gig_apps_orders', value: 'Gig Applications & Orders' },
    { code: 'EN', key: 'admin_cleanup_gig_apps_orders_desc', value: 'Deletes all client applications and active/completed gig orders.' },
    { code: 'EN', key: 'admin_cleanup_contracts', value: 'Contracts' },
    { code: 'EN', key: 'admin_cleanup_contracts_desc', value: 'Deletes all escrow contracts, milestones progress, and project history.' },
    { code: 'EN', key: 'admin_cleanup_wallets_tx', value: 'Wallet Transactions & Withdrawals' },
    { code: 'EN', key: 'admin_cleanup_wallets_tx_desc', value: 'Deletes all transfer logs, deposit records, and withdrawal requests.' },
    { code: 'EN', key: 'admin_cleanup_wallets', value: 'User & Escrow Wallets' },
    { code: 'EN', key: 'admin_cleanup_wallets_desc', value: 'Resets all client, freelancer, and system wallets back to an initial balance of' },
    { code: 'EN', key: 'admin_cleanup_messages', value: 'Messages & Conversations' },
    { code: 'EN', key: 'admin_cleanup_messages_desc', value: 'Deletes all chat messages and workspace communication channels.' },
    { code: 'EN', key: 'admin_cleanup_cleaning', value: 'Cleaning Database...' },
    { code: 'EN', key: 'admin_cleanup_delete_btn', value: 'Delete All Orders & Transactions Data ✓' },
    { code: 'EN', key: 'admin_cleanup_confirm_msg', value: 'WARNING: This will permanently delete all Gig Orders, Contracts, and Wallet Transactions, and reset all wallet balances to $0.00. Are you sure you want to proceed?' },
    { code: 'EN', key: 'admin_cleanup_success_msg', value: 'Database cleaned successfully and all wallet balances reset to $0.00!' },
    { code: 'EN', key: 'admin_cleanup_fail_msg', value: 'Failed to clean database.' },
    { code: 'EN', key: 'admin_cleanup_network_error_msg', value: 'Network error cleaning database.' },

    // Arabic (AR)
    { code: 'AR', key: 'admin_cleanup_title', value: 'تنظيف وإعادة تعيين قاعدة البيانات' },
    { code: 'AR', key: 'admin_cleanup_subtitle', value: 'إعادة تعيين بيانات المعاملات والطلبات. سيتم حذف سجلات جداول قاعدة البيانات التالية بشكل نهائي:' },
    { code: 'AR', key: 'admin_cleanup_affected_tables', value: 'الجداول المتأثرة' },
    { code: 'AR', key: 'admin_cleanup_gigs_skills', value: 'الخدمات والمهارات' },
    { code: 'AR', key: 'admin_cleanup_gigs_skills_desc', value: 'يحذف جميع خدمات المستقلين المدرجة وارتباطات المهارات الخاصة بهم.' },
    { code: 'AR', key: 'admin_cleanup_jobs_proposals', value: 'الوظائف وعروض الأسعار' },
    { code: 'AR', key: 'admin_cleanup_jobs_proposals_desc', value: 'يحذف جميع الوظائف المخصصة المنشورة من قبل العملاء وعروض المستقلين المعلقة.' },
    { code: 'AR', key: 'admin_cleanup_gig_apps_orders', value: 'طلبات وتطبيقات الخدمات' },
    { code: 'AR', key: 'admin_cleanup_gig_apps_orders_desc', value: 'يحذف جميع تطبيقات العملاء وطلبات الخدمات النشطة أو المكتملة.' },
    { code: 'AR', key: 'admin_cleanup_contracts', value: 'العقود والمشاريع' },
    { code: 'AR', key: 'admin_cleanup_contracts_desc', value: 'يحذف جميع عقود الضمان، والتقدم في المراحل، وسجل المشروع بالكامل.' },
    { code: 'AR', key: 'admin_cleanup_wallets_tx', value: 'معاملات المحفظة والسحوبات' },
    { code: 'AR', key: 'admin_cleanup_wallets_tx_desc', value: 'يحذف جميع سجلات التحويل، والإيداع، وطلبات السحب المفتوحة.' },
    { code: 'AR', key: 'admin_cleanup_wallets', value: 'محافظ المستخدمين والضمان' },
    { code: 'AR', key: 'admin_cleanup_wallets_desc', value: 'يعيد تعيين جميع محافظ العملاء، والمستقلين، والنظام إلى الرصيد الافتراضي الأولي البالغ' },
    { code: 'AR', key: 'admin_cleanup_messages', value: 'الرسائل والمحادثات' },
    { code: 'AR', key: 'admin_cleanup_messages_desc', value: 'يحذف جميع رسائل الدردشة وقنوات الاتصال بين المستخدمين.' },
    { code: 'AR', key: 'admin_cleanup_cleaning', value: 'جاري تنظيف قاعدة البيانات...' },
    { code: 'AR', key: 'admin_cleanup_delete_btn', value: 'حذف جميع بيانات الطلبات والمعاملات ✓' },
    { code: 'AR', key: 'admin_cleanup_confirm_msg', value: 'تحذير: سيؤدي هذا إلى حذف جميع طلبات الخدمات، والعقود، ومعاملات المحفظة نهائياً، وإعادة تعيين جميع أرصدة المحافظ إلى 0.00$. هل أنت متأكد من رغبتك في الاستمرار؟' },
    { code: 'AR', key: 'admin_cleanup_success_msg', value: 'تم تنظيف قاعدة البيانات بنجاح وإعادة تعيين جميع أرصدة المحافظ إلى 0.00$!' },
    { code: 'AR', key: 'admin_cleanup_fail_msg', value: 'فشل تنظيف قاعدة البيانات.' },
    { code: 'AR', key: 'admin_cleanup_network_error_msg', value: 'خطأ في الشبكة أثناء تنظيف قاعدة البيانات.' }
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

  console.log(`✅ Successfully seeded ${insertedCount} Admin Database Cleanup translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
