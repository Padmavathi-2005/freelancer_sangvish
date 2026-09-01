import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for Wallet Promo translations...");

  const translations = [
    { code: 'EN', key: 'signup_bonus_requested_title', value: 'Sign-Up Bonus Requested:' },
    { code: 'AR', key: 'signup_bonus_requested_title', value: 'طلب مكافأة التسجيل:' },

    { code: 'EN', key: 'awaiting_admin_approval_badge', value: 'Awaiting Admin Approval' },
    { code: 'AR', key: 'awaiting_admin_approval_badge', value: 'في انتظار موافقة الإدارة' },

    { code: 'EN', key: 'signup_bonus_desc_prefix', value: 'Your ' },
    { code: 'AR', key: 'signup_bonus_desc_prefix', value: 'لقد تم طلب ' },

    { code: 'EN', key: 'signup_bonus_desc_highlight', value: 'Sign-up Bonus' },
    { code: 'AR', key: 'signup_bonus_desc_highlight', value: 'مكافأة التسجيل الخاصة بك' },

    { code: 'EN', key: 'signup_bonus_desc_suffix', value: ' has been requested upon profile setup. Once reviewed and approved by Admin, it will be credited to your active balance!' },
    { code: 'AR', key: 'signup_bonus_desc_suffix', value: ' عند إعداد الحساب. بمجرد مراجعتها والموافقة عليها من قبل الإدارة، سيتم إضافتها إلى رصيدك النشط!' },

    { code: 'EN', key: 'pending_admin_release_badge', value: 'Pending Admin Release {amount}' },
    { code: 'AR', key: 'pending_admin_release_badge', value: 'في انتظار تحرير الإدارة لـ {amount}' }
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

  console.log(`✅ Successfully seeded ${insertedCount} Wallet Promo translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
