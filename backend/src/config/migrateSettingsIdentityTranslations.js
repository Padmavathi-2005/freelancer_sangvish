import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for Settings Identity translations...");

  const translations = [
    // === ENGLISH (EN) ===
    { code: 'EN', key: 'change_photo_tooltip', value: 'Change photo' },
    { code: 'EN', key: 'profile_avatar_label', value: 'Profile Avatar' },
    { code: 'EN', key: 'account_identity_header', value: 'Account Identity' },
    { code: 'EN', key: 'first_name_label', value: 'First Name' },
    { code: 'EN', key: 'first_name_placeholder', value: 'e.g. David' },
    { code: 'EN', key: 'last_name_label', value: 'Last Name' },
    { code: 'EN', key: 'last_name_placeholder', value: 'e.g. Miller' },
    { code: 'EN', key: 'display_name_label', value: 'Display Name' },
    { code: 'EN', key: 'display_name_placeholder', value: 'e.g. David Miller' },
    { code: 'EN', key: 'saving_label', value: 'Saving...' },
    { code: 'EN', key: 'save_name_details_btn', value: 'Save Name Details' },

    // === ARABIC (AR) ===
    { code: 'AR', key: 'change_photo_tooltip', value: 'تغيير الصورة' },
    { code: 'AR', key: 'profile_avatar_label', value: 'الصورة الشخصية' },
    { code: 'AR', key: 'account_identity_header', value: 'هوية الحساب' },
    { code: 'AR', key: 'first_name_label', value: 'الاسم الأول' },
    { code: 'AR', key: 'first_name_placeholder', value: 'مثال: ديفيد' },
    { code: 'AR', key: 'last_name_label', value: 'اسم العائلة' },
    { code: 'AR', key: 'last_name_placeholder', value: 'مثال: ميلر' },
    { code: 'AR', key: 'display_name_label', value: 'اسم العرض' },
    { code: 'AR', key: 'display_name_placeholder', value: 'مثال: ديفيد ميلر' },
    { code: 'AR', key: 'saving_label', value: 'جاري الحفظ...' },
    { code: 'AR', key: 'save_name_details_btn', value: 'حفظ تفاصيل الاسم' }
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

  console.log(`✅ Successfully seeded ${insertedCount} Settings Identity translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
