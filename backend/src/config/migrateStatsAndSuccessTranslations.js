import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for stats bar and success stories copywriting...");
  
  const translations = [
    // Success Stories
    { code: 'EN', key: 'success_stories_title', value: 'Success Stories' },
    { code: 'AR', key: 'success_stories_title', value: 'قصص النجاح' },
    { code: 'FR', key: 'success_stories_title', value: 'Histoires de réussite' },
    { code: 'DE', key: 'success_stories_title', value: 'Erfolgsgeschichten' },

    // Stats 1
    { code: 'EN', key: 'stats_val_1', value: '25K+' },
    { code: 'AR', key: 'stats_val_1', value: '٢٥ ألف+' },
    { code: 'FR', key: 'stats_val_1', value: '25K+' },
    { code: 'DE', key: 'stats_val_1', value: '25K+' },

    { code: 'EN', key: 'stats_label_1', value: 'Freelancers' },
    { code: 'AR', key: 'stats_label_1', value: 'مستقلون' },
    { code: 'FR', key: 'stats_label_1', value: 'Freelances' },
    { code: 'DE', key: 'stats_label_1', value: 'Freelancer' },

    // Stats 2
    { code: 'EN', key: 'stats_val_2', value: '100K+' },
    { code: 'AR', key: 'stats_val_2', value: '١٠٠ ألف+' },
    { code: 'FR', key: 'stats_val_2', value: '100K+' },
    { code: 'DE', key: 'stats_val_2', value: '100K+' },

    { code: 'EN', key: 'stats_label_2', value: 'Jobs Completed' },
    { code: 'AR', key: 'stats_label_2', value: 'وظائف مكتملة' },
    { code: 'FR', key: 'stats_label_2', value: 'Missions complétées' },
    { code: 'DE', key: 'stats_label_2', value: 'Abgeschlossene Jobs' },

    // Stats 3
    { code: 'EN', key: 'stats_val_3', value: '₹50Cr+' },
    { code: 'AR', key: 'stats_val_3', value: '٥٠ كرور روبية+' },
    { code: 'FR', key: 'stats_val_3', value: '₹50Cr+' },
    { code: 'DE', key: 'stats_val_3', value: '₹50Cr+' },

    { code: 'EN', key: 'stats_label_3', value: 'Paid to Talent' },
    { code: 'AR', key: 'stats_label_3', value: 'مدفوع للمواهب' },
    { code: 'FR', key: 'stats_label_3', value: 'Payé aux talents' },
    { code: 'DE', key: 'stats_label_3', value: 'An Talente gezahlt' },

    // Stats 4
    { code: 'EN', key: 'stats_val_4', value: '4.9/5' },
    { code: 'AR', key: 'stats_val_4', value: '٤.٩/٥' },
    { code: 'FR', key: 'stats_val_4', value: '4.9/5' },
    { code: 'DE', key: 'stats_val_4', value: '4.9/5' },

    { code: 'EN', key: 'stats_label_4', value: 'Average Rating' },
    { code: 'AR', key: 'stats_label_4', value: 'متوسط التقييم' },
    { code: 'FR', key: 'stats_label_4', value: 'Évaluation moyenne' },
    { code: 'DE', key: 'stats_label_4', value: 'Durchschnittliche Bewertung' }
  ];

  try {
    for (const t of translations) {
      await pool.query(
        `INSERT INTO translations (language_code, key, value) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (language_code, key) 
         DO UPDATE SET value = EXCLUDED.value`,
        [t.code, t.key, t.value]
      );
    }
    console.log("✅ Seeded/Updated stats & success translatable sections successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
