import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for Referral Banner setting keys...");

  const translations = [
    { code: 'EN', key: 'Invite Friends & Earn', value: 'Invite Friends & Earn' },
    { code: 'AR', key: 'Invite Friends & Earn', value: 'ادعُ الأصدقاء واكسب' },

    { code: 'EN', key: '...Share your referral link with friends', value: '...Share your referral link with friends' },
    { code: 'AR', key: '...Share your referral link with friends', value: '...شارك رابط الإحالة الخاص بك مع الأصدقاء' },

    { code: 'EN', key: 'Share your referral link with friends. They get a bonus on sign-up, and you get paid when they complete transactions!', value: 'Share your referral link with friends. They get a bonus on sign-up, and you get paid when they complete transactions!' },
    { code: 'AR', key: 'Share your referral link with friends. They get a bonus on sign-up, and you get paid when they complete transactions!', value: 'شارك رابط الإحالة الخاص بك مع الأصدقاء. يحصلون على مكافأة عند التسجيل، وتتقاضى أنت أجرًا عندما يكملون المعاملات!' }
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

  console.log(`✅ Successfully seeded ${insertedCount} Referral Banner translations.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
