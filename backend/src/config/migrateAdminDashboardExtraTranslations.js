import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for Admin Dashboard extra translations...");

  const translations = [
    // English (EN)
    { code: 'EN', key: 'admin_active_talent_pool', value: 'Active Talent Pool' },
    { code: 'EN', key: 'admin_registered_contractors', value: 'Registered Contractors' },
    { code: 'EN', key: 'admin_vetting_applications', value: 'Vetting Applications' },
    { code: 'EN', key: 'admin_in_review_queue', value: 'in review queue' },
    { code: 'EN', key: 'admin_total_user_accounts', value: 'Total User Accounts' },
    { code: 'EN', key: 'admin_registered_members', value: 'registered members' },
    { code: 'EN', key: 'admin_dispute_cases', value: 'Dispute Cases' },
    { code: 'EN', key: 'admin_requires_resolution', value: 'requires resolution' },
    { code: 'EN', key: 'admin_clear_slate', value: 'clear slate' },

    // Arabic (AR)
    { code: 'AR', key: 'admin_active_talent_pool', value: 'قاعدة المواهب النشطة' },
    { code: 'AR', key: 'admin_registered_contractors', value: 'المستقلون المسجلون' },
    { code: 'AR', key: 'admin_vetting_applications', value: 'طلبات التدقيق' },
    { code: 'AR', key: 'admin_in_review_queue', value: 'في قائمة الانتظار للمراجعة' },
    { code: 'AR', key: 'admin_total_user_accounts', value: 'إجمالي حسابات المستخدمين' },
    { code: 'AR', key: 'admin_registered_members', value: 'الأعضاء المسجلون' },
    { code: 'AR', key: 'admin_dispute_cases', value: 'حالات النزاع' },
    { code: 'AR', key: 'admin_requires_resolution', value: 'تتطلب حلاً' },
    { code: 'AR', key: 'admin_clear_slate', value: 'سجل خالٍ من النزاعات' }
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

  console.log(`✅ Successfully seeded ${insertedCount} Admin Dashboard extra translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
