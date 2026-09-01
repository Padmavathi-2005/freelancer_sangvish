import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for Newsletter Layout translations...");

  const translations = [
    { code: 'EN', key: 'stay_informed_badge', value: 'Stay Informed' },
    { code: 'AR', key: 'stay_informed_badge', value: 'كن على اطلاع' },

    { code: 'EN', key: 'Newsletter Portal', value: 'Newsletter Portal' },
    { code: 'AR', key: 'Newsletter Portal', value: 'بوابة النشرة الإخبارية' },

    { code: 'EN', key: 'Subscribe to stay updated with latest insights, remote jobs, and marketplace stats.', value: 'Subscribe to stay updated with latest insights, remote jobs, and marketplace stats.' },
    { code: 'AR', key: 'Subscribe to stay updated with latest insights, remote jobs, and marketplace stats.', value: 'اشترك لتبقى على اطلاع دائم بآخر الرؤى، والوظائف عن بعد، وإحصائيات السوق.' },

    { code: 'EN', key: 'subscribers_privileges_badge', value: 'Subscribers Privileges' },
    { code: 'AR', key: 'subscribers_privileges_badge', value: 'امتيازات المشتركين' },

    { code: 'EN', key: 'exclusive_weekly_insights_title', value: 'Exclusive Weekly Insights' },
    { code: 'AR', key: 'exclusive_weekly_insights_title', value: 'رؤى أسبوعية حصرية' },

    { code: 'EN', key: 'curated_job_lists_title', value: 'Curated Job Lists' },
    { code: 'AR', key: 'curated_job_lists_title', value: 'قوائم وظائف منسقة' },

    { code: 'EN', key: 'curated_job_lists_desc', value: 'Get premium, hand-picked remote opportunities matching your skills directly in your inbox.' },
    { code: 'AR', key: 'curated_job_lists_desc', value: 'احصل على فرص عمل عن بعد متميزة ومختارة بعناية لتناسب مهاراتك مباشرة في صندوق الوارد الخاص بك.' },

    { code: 'EN', key: 'guides_tips_title', value: 'Guides & Tips' },
    { code: 'AR', key: 'guides_tips_title', value: 'أدلة ونصائح' },

    { code: 'EN', key: 'guides_tips_desc', value: 'Learn interviewing success strategies, contract best practices, and rate negotiation tips.' },
    { code: 'AR', key: 'guides_tips_desc', value: 'تعلم استراتيجيات النجاح في المقابلات، وأفضل ممارسات العقود، ونصائح للتفاوض على الأسعار.' },

    { code: 'EN', key: 'marketplace_insights_title', value: 'Marketplace Insights' },
    { code: 'AR', key: 'marketplace_insights_title', value: 'رؤى واتجاهات السوق' },

    { code: 'EN', key: 'marketplace_insights_desc', value: 'Stay updated on the latest hiring trends, average contract values, and in-demand skills.' },
    { code: 'AR', key: 'marketplace_insights_desc', value: 'ابق على اطلاع دائم بأحدث اتجاهات التوظيف، ومتوسط قيم العقود، والمهارات الأكثر طلبًا.' }
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

  console.log(`✅ Successfully seeded ${insertedCount} Newsletter Layout translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
