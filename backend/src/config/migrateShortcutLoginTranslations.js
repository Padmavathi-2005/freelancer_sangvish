import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for Shortcut Login translations...");

  const translations = [
    // === ENGLISH (EN) ===
    { code: 'EN', key: 'shortcut_login_header', value: 'Shortcut Login' },
    { code: 'EN', key: 'signin_continue_title', value: 'Sign In to Continue' },
    { code: 'EN', key: 'shortcut_login_desc', value: 'Log in directly from this screen to unlock actions without leaving the page.' },
    { code: 'EN', key: 'email_address_label', value: 'Email Address' },
    { code: 'EN', key: 'password_label', value: 'Password' },
    { code: 'EN', key: 'signing_in_status', value: 'Signing in...' },
    { code: 'EN', key: 'login_continue_btn', value: 'Log In & Continue' },
    { code: 'EN', key: 'or_continue_with_label', value: 'Or Continue With' },
    { code: 'EN', key: 'google_label', value: 'Google' },
    { code: 'EN', key: 'facebook_label', value: 'Facebook' },
    { code: 'EN', key: 'dont_have_account_msg', value: "Don't have an account?" },
    { code: 'EN', key: 'register_now_btn', value: 'Register Now' },

    // === ARABIC (AR) ===
    { code: 'AR', key: 'shortcut_login_header', value: 'تسجيل دخول سريع' },
    { code: 'AR', key: 'signin_continue_title', value: 'سجل الدخول للمتابعة' },
    { code: 'AR', key: 'shortcut_login_desc', value: 'سجل دخولك مباشرة من هذه الشاشة لفتح الإجراءات دون مغادرة الصفحة.' },
    { code: 'AR', key: 'email_address_label', value: 'عنوان البريد الإلكتروني' },
    { code: 'AR', key: 'password_label', value: 'كلمة المرور' },
    { code: 'AR', key: 'signing_in_status', value: 'جاري تسجيل الدخول...' },
    { code: 'AR', key: 'login_continue_btn', value: 'سجل الدخول والمتابعة' },
    { code: 'AR', key: 'or_continue_with_label', value: 'أو تابع باستخدام' },
    { code: 'AR', key: 'google_label', value: 'جوجل' },
    { code: 'AR', key: 'facebook_label', value: 'فيسبوك' },
    { code: 'AR', key: 'dont_have_account_msg', value: 'ليس لديك حساب؟' },
    { code: 'AR', key: 'register_now_btn', value: 'سجل الآن' }
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

  console.log(`✅ Successfully seeded ${insertedCount} Shortcut Login translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
