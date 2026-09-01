import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for RTL & Profile page translations...");

  const translations = [
    // === ENGLISH (EN) ===
    { code: 'EN', key: 'profile_settings_menu', value: 'Profile Settings' },
    { code: 'EN', key: 'share_this_profile', value: 'Share Profile' },
    { code: 'EN', key: 'about_client', value: 'About Client' },
    { code: 'EN', key: 'client_name', value: 'Client Name' },
    { code: 'EN', key: 'industry', value: 'Industry' },
    { code: 'EN', key: 'member_since', value: 'Member Since' },
    { code: 'EN', key: 'owner_of_project_posting', value: 'You are the owner of this project posting.' },
    { code: 'EN', key: 'proposal_submitted', value: 'Proposal Submitted' },
    { code: 'EN', key: 'affiliate_project_share_desc', value: 'Share this project link. If a user registers and books/completes this project, you will earn a recurring 10% commission on the platform service fee!' },
    { code: 'EN', key: 'quick_social_share', value: 'Quick Social Share:' },

    // === ARABIC (AR) ===
    { code: 'AR', key: 'profile_settings_menu', value: 'إعدادات الملف الشخصي' },
    { code: 'AR', key: 'share_this_profile', value: 'مشاركة الملف الشخصي' },
    { code: 'AR', key: 'about_client', value: 'عن العميل' },
    { code: 'AR', key: 'client_name', value: 'اسم العميل' },
    { code: 'AR', key: 'industry', value: 'المجال' },
    { code: 'AR', key: 'member_since', value: 'عضو منذ' },
    { code: 'AR', key: 'owner_of_project_posting', value: 'أنت صاحب هذا المشروع.' },
    { code: 'AR', key: 'proposal_submitted', value: 'تم تقديم العرض' },
    { code: 'AR', key: 'affiliate_project_share_desc', value: 'شارك رابط هذا المشروع. إذا قام مستخدم بالتسجيل وحجز/إكمال هذا المشروع، فستكسب عمولة متكررة بنسبة 10% على رسوم خدمة المنصة!' },
    { code: 'AR', key: 'quick_social_share', value: 'مشاركة اجتماعية سريعة:' }
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

  console.log(`✅ Successfully seeded ${insertedCount} RTL & Profile translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
