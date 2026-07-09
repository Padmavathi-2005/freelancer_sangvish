import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for missing home page copywriting translations...");
  
  const translations = [
    // English (EN)
    { code: 'EN', key: 'hero_badge', value: 'The Top 3% Global Freelancers' },
    { code: 'EN', key: 'hero_title', value: 'Hire Expert Freelancers For Your Next Big Project' },
    { code: 'EN', key: 'hero_subtitle', value: 'Connect with top-tier professionals. Execute faster with vetted talent tailored to your enterprise needs.' },
    { code: 'EN', key: 'hero_search_placeholder', value: 'What skill are you looking for?' },
    { code: 'EN', key: 'hero_search_btn', value: 'Search Talent' },
    { code: 'EN', key: 'hero_popular_label', value: 'Popular: UI Design, React, AI Automation, SEO' },
    { code: 'EN', key: 'faq_header_title', value: 'Frequently Asked Questions' },
    { code: 'EN', key: 'recent_projects_title', value: 'Latest Projects' },
    { code: 'EN', key: 'search', value: 'Search' },

    // Arabic (AR)
    { code: 'AR', key: 'hero_badge', value: 'أفضل 3٪ من المستقلين العالميين' },
    { code: 'AR', key: 'hero_title', value: 'وظف مستقلين خبراء لمشروعك الكبير القادم' },
    { code: 'AR', key: 'hero_subtitle', value: 'تواصل مع محترفين من الدرجة الأولى. نفذ مشاريعك بشكل أسرع مع مواهب موثوقة ومخصصة لاحتياجات شركتك.' },
    { code: 'AR', key: 'hero_search_placeholder', value: 'ما هي المهارة التي تبحث عنها؟' },
    { code: 'AR', key: 'hero_search_btn', value: 'ابحث عن المواهب' },
    { code: 'AR', key: 'hero_popular_label', value: 'شائع: تصميم واجهة المستخدم، ريأكت، أتمتة الذكاء الاصطناعي، تحسين محركات البحث' },
    { code: 'AR', key: 'faq_header_title', value: 'الأسئلة الشائعة' },
    { code: 'AR', key: 'recent_projects_title', value: 'أحدث المشاريع' },
    { code: 'AR', key: 'search', value: 'بحث' },

    // French (FR)
    { code: 'FR', key: 'hero_badge', value: 'Le top 3 % des freelances mondiaux' },
    { code: 'FR', key: 'hero_title', value: 'Engagez des freelances experts pour votre prochain grand projet' },
    { code: 'FR', key: 'hero_subtitle', value: 'Connectez-vous avec des professionnels de premier plan. Exécutez plus rapidement grâce à des talents vérifiés et adaptés aux besoins de votre entreprise.' },
    { code: 'FR', key: 'hero_search_placeholder', value: 'Quelle compétence recherchez-vous ?' },
    { code: 'FR', key: 'hero_search_btn', value: 'Rechercher des talents' },
    { code: 'FR', key: 'hero_popular_label', value: 'Populaire : Design UI, React, Automatisation IA, SEO' },
    { code: 'FR', key: 'faq_header_title', value: 'Foire aux questions' },
    { code: 'FR', key: 'recent_projects_title', value: 'Derniers projets' },
    { code: 'FR', key: 'search', value: 'Rechercher' },

    // German (DE)
    { code: 'DE', key: 'hero_badge', value: 'Die besten 3 % der globalen Freelancer' },
    { code: 'DE', key: 'hero_title', value: 'Stellen Sie kompetente Freelancer für Ihr nächstes großes Projekt ein' },
    { code: 'DE', key: 'hero_subtitle', value: 'Verbinden Sie sich mit erstklassigen Profis. Setzen Sie Projekte schneller um mit geprüften Talenten, die auf Ihre Unternehmensanforderungen zugeschnitten sind.' },
    { code: 'DE', key: 'hero_search_placeholder', value: 'Nach welcher Fähigkeit suchen Sie?' },
    { code: 'DE', key: 'hero_search_btn', value: 'Talente suchen' },
    { code: 'DE', key: 'hero_popular_label', value: 'Beliebt: UI-Design, React, KI-Automatisierung, SEO' },
    { code: 'DE', key: 'faq_header_title', value: 'Häufig gestellte Fragen' },
    { code: 'DE', key: 'recent_projects_title', value: 'Neueste Projekte' },
    { code: 'DE', key: 'search', value: 'Suchen' }
  ];

  try {
    for (const t of translations) {
      await pool.query(
        `INSERT INTO translations (language_code, key, value) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (language_code, key) 
         DO UPDATE SET value = EXCLUDED.value`,
        [t.code.toUpperCase(), t.key.toLowerCase(), t.value]
      );
    }
    console.log("✅ Seeded/Updated missing homepage translation keys successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
