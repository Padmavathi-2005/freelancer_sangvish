import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for all language landing & recent projects translations...");

  const translations = [
    // English (EN)
    { code: 'EN', key: 'active_marketplace_needs', value: 'Active Marketplace Needs' },
    { code: 'EN', key: 'recent_projects_title', value: 'Latest Projects' },
    { code: 'EN', key: 'browse_all', value: 'Browse All' },
    { code: 'EN', key: 'budget_label', value: 'Budget' },
    { code: 'EN', key: 'per_hr', value: '/hr' },
    { code: 'EN', key: 'posted_by', value: 'Posted by' },
    { code: 'EN', key: 'fixed', value: 'Fixed' },
    { code: 'EN', key: 'hourly', value: 'Hourly' },
    { code: 'EN', key: 'remote', value: 'Remote' },
    { code: 'EN', key: '1-3 months', value: '1-3 months' },
    { code: 'EN', key: 'less than 1 month', value: 'Less than 1 month' },
    { code: 'EN', key: '3-6 months', value: '3-6 months' },

    // EN Sample Project Titles & Descriptions
    { code: 'EN', key: 'software engineer (hourly rate)', value: 'Software Engineer (Hourly Rate)' },
    { code: 'EN', key: 'customer support team (multiple freelancers - hourly)', value: 'Customer Support Team (Multiple Freelancers - Hourly)' },
    { code: 'EN', key: 'mobile app beta testers (multiple freelancers - milestone)', value: 'Mobile App Beta Testers (Multiple Freelancers - Milestone)' },
    { code: 'EN', key: 'enterprise saas react dashboard & graphql integration', value: 'Enterprise SaaS React Dashboard & GraphQL Integration' },
    { code: 'EN', key: 'brand identity, typography system & figma landing page design', value: 'Brand Identity, Typography System & Figma Landing Page Design' },
    { code: 'EN', key: 'python data pipeline for ai chatbot analytics platform', value: 'Python Data Pipeline for AI Chatbot Analytics Platform' },
    { code: 'EN', key: 'mobile app development for e-commerce marketplace', value: 'Mobile App Development for E-Commerce Marketplace' },

    { code: 'EN', key: 'we are looking for a software engineer to join our team on an hourly basis to develop new features', value: 'We are looking for a software engineer to join our team on an hourly basis to develop new features' },
    { code: 'EN', key: 'we need customer support agents to handle chat support across multiple shifts on an hourly basis', value: 'We need customer support agents to handle chat support across multiple shifts on an hourly basis' },
    { code: 'EN', key: 'looking for beta testers to test our mobile app and submit bug reports. bounties released in milestones', value: 'Looking for beta testers to test our mobile app and submit bug reports. Bounties released in milestones' },
    { code: 'EN', key: 'looking for an expert next.js and graphql engineer to refactor our dashboard, optimize render cycles, and connect to a schema-first backend.', value: 'Looking for an expert Next.js and GraphQL engineer to refactor our dashboard, optimize render cycles, and connect to a schema-first backend.' },
    { code: 'EN', key: 'need a professional ui/ux designer to craft a high-converting homepage design in figma, along with a complete branding guide and component library.', value: 'Need a professional UI/UX designer to craft a high-converting homepage design in Figma, along with a complete branding guide and component library.' },
    { code: 'EN', key: 'we are seeking a senior python developer to build robust data ingestion pipelines from multiple apis, clean raw inputs, and store telemetry in postgres.', value: 'We are seeking a senior Python developer to build robust data ingestion pipelines from multiple APIs, clean raw inputs, and store telemetry in Postgres.' },
    { code: 'EN', key: 'looking for a react native developer to build a cross-platform mobile app with payment integration, push notifications, and real-time inventory updates.', value: 'Looking for a React Native developer to build a cross-platform mobile app with payment integration, push notifications, and real-time inventory updates.' },

    // Arabic (AR)
    { code: 'AR', key: 'active_marketplace_needs', value: 'احتياجات السوق النشطة' },
    { code: 'AR', key: 'recent_projects_title', value: 'أحدث المشاريع' },
    { code: 'AR', key: 'browse_all', value: 'تصفح الكل' },
    { code: 'AR', key: 'budget_label', value: 'الميزانية' },
    { code: 'AR', key: 'per_hr', value: '/ساعة' },
    { code: 'AR', key: 'posted_by', value: 'نُشر بواسطة' },
    { code: 'AR', key: 'fixed', value: 'مبلغ ثابت' },
    { code: 'AR', key: 'hourly', value: 'ساعي' },
    { code: 'AR', key: 'remote', value: 'عن بُعد' },
    { code: 'AR', key: '1-3 months', value: '1-3 أشهر' },
    { code: 'AR', key: 'less than 1 month', value: 'أقل من شهر' },
    { code: 'AR', key: '3-6 months', value: '3-6 أشهر' },

    // AR Sample Project Titles & Descriptions
    { code: 'AR', key: 'software engineer (hourly rate)', value: 'مهندس برمجيات (سعر بالساعة)' },
    { code: 'AR', key: 'customer support team (multiple freelancers - hourly)', value: 'فريق دعم العملاء (مستقلون متعددون - بالساعة)' },
    { code: 'AR', key: 'mobile app beta testers (multiple freelancers - milestone)', value: 'مختبرو النسخة التجريبية لتطبيق الهاتف (مستقلون متعددون - مراحل)' },
    { code: 'AR', key: 'enterprise saas react dashboard & graphql integration', value: 'لوحة تحكم SaaS React للمؤسسات وتكامل GraphQL' },
    { code: 'AR', key: 'brand identity, typography system & figma landing page design', value: 'هوية العلامة التجارية ونظام الخطوط وتصميم صفحة الهبوط في Figma' },
    { code: 'AR', key: 'python data pipeline for ai chatbot analytics platform', value: 'أنبوب بيانات بلغة بايثون لمنصة تحليلات روبوت الدردشة بالذكاء الاصطناعي' },
    { code: 'AR', key: 'mobile app development for e-commerce marketplace', value: 'تطوير تطبيق الهاتف لسوق التجارة الإلكترونية' },

    { code: 'AR', key: 'we are looking for a software engineer to join our team on an hourly basis to develop new features', value: 'نحن نطلب مهندس برمجيات للانضمام إلى فريقنا بالساعة لتطوير ميزات جديدة.' },
    { code: 'AR', key: 'we need customer support agents to handle chat support across multiple shifts on an hourly basis', value: 'نحتاج لعملاء دعم فني للتعامل مع الدعم عبر الدردشة عبر نوبات متعددة بالساعة.' },
    { code: 'AR', key: 'looking for beta testers to test our mobile app and submit bug reports. bounties released in milestones', value: 'نبحث عن مختبرين لاختبار تطبيقنا وتسليم تقارير الأخطاء. يتم تحرير المكافآت على مراحل.' },
    { code: 'AR', key: 'looking for an expert next.js and graphql engineer to refactor our dashboard, optimize render cycles, and connect to a schema-first backend.', value: 'نبحث عن مهندس خبير في Next.js و GraphQL لإعادة صياغة لوحة التحكم وتحسين الأداء.' },
    { code: 'AR', key: 'need a professional ui/ux designer to craft a high-converting homepage design in figma, along with a complete branding guide and component library.', value: 'نحتاج لمصمم UI/UX محترف لإنشاء تصميم صفحة رئيسية عالية التحويل في Figma مع دليل الهوية.' },
    { code: 'AR', key: 'we are seeking a senior python developer to build robust data ingestion pipelines from multiple apis, clean raw inputs, and store telemetry in postgres.', value: 'نبحث عن مطور بايثون محترف لبناء أنابيب معالجة البيانات من واجهات برمجة متعددة وحفظها في Postgres.' },
    { code: 'AR', key: 'looking for a react native developer to build a cross-platform mobile app with payment integration, push notifications, and real-time inventory updates.', value: 'نبحث عن مطور React Native لبناء تطبيق هاتف متعدد المنصات مع تكامل الدفع والإشعارات.' },

    // French (FR)
    { code: 'FR', key: 'active_marketplace_needs', value: 'Besoins actifs du marché' },
    { code: 'FR', key: 'recent_projects_title', value: 'Derniers Projets' },
    { code: 'FR', key: 'browse_all', value: 'Tout parcourir' },
    { code: 'FR', key: 'budget_label', value: 'Budget' },
    { code: 'FR', key: 'per_hr', value: '/h' },
    { code: 'FR', key: 'posted_by', value: 'Publié par' },
    { code: 'FR', key: 'fixed', value: 'Fixe' },
    { code: 'FR', key: 'hourly', value: 'Horaire' },
    { code: 'FR', key: 'remote', value: 'À distance' },
    { code: 'FR', key: '1-3 months', value: '1 à 3 mois' },
    { code: 'FR', key: 'less than 1 month', value: 'Moins d\'un mois' },
    { code: 'FR', key: '3-6 months', value: '3 à 6 mois' },

    // German (DE)
    { code: 'DE', key: 'active_marketplace_needs', value: 'Aktive Marktplatz-Anforderungen' },
    { code: 'DE', key: 'recent_projects_title', value: 'Neueste Projekte' },
    { code: 'DE', key: 'browse_all', value: 'Alle durchsuchen' },
    { code: 'DE', key: 'budget_label', value: 'Budget' },
    { code: 'DE', key: 'per_hr', value: '/Std.' },
    { code: 'DE', key: 'posted_by', value: 'Veröffentlicht von' },
    { code: 'DE', key: 'fixed', value: 'Festpreis' },
    { code: 'DE', key: 'hourly', value: 'Stündlich' },
    { code: 'DE', key: 'remote', value: 'Remote' },
    { code: 'DE', key: '1-3 months', value: '1-3 Monate' },
    { code: 'DE', key: 'less than 1 month', value: 'Weniger als 1 Monat' },
    { code: 'DE', key: '3-6 months', value: '3-6 Monate' }
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
    console.log("✅ Seeded/Updated all language landing & recent projects translation keys successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
