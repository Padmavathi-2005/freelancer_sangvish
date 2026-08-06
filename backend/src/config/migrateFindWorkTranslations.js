import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for find work translation copy...");
  
  const translations = [
    // English (EN)
    { code: 'EN', key: 'find_projects_header', value: 'Find Projects & Bids' },
    { code: 'EN', key: 'find_projects_desc', value: 'Browse active projects posted by clients and submit your proposals.' },
    { code: 'EN', key: 'search_jobs_placeholder', value: 'Search jobs, categories...' },
    { code: 'EN', key: 'show_all_btn', value: 'Show All' },
    { code: 'EN', key: 'ai_matches_btn', value: 'AI Matches' },
    { code: 'EN', key: 'proposal_submitted_badge', value: 'Proposal Submitted' },
    { code: 'EN', key: 'subcategory_label', value: 'Subcategory:' },
    { code: 'EN', key: 'experience_required_label', value: 'Experience Required:' },
    { code: 'EN', key: 'budget_label', value: 'Budget:' },
    { code: 'EN', key: 'duration_label', value: 'Duration:' },
    { code: 'EN', key: 'freelancers_label', value: 'Freelancers:' },
    { code: 'EN', key: 'submit_proposal_btn', value: 'Submit Proposal' },
    { code: 'EN', key: 'hours_limit_label', value: 'Hours Limit:' },
    { code: 'EN', key: 'payout_label', value: 'Payout:' },
    { code: 'EN', key: 'checking_btn', value: 'Checking...' },

    // Arabic (AR)
    { code: 'AR', key: 'find_projects_header', value: 'البحث عن المشاريع والعروض' },
    { code: 'AR', key: 'find_projects_desc', value: 'تصفح المشاريع النشطة التي نشرها العملاء وقدم مقترحاتك.' },
    { code: 'AR', key: 'search_jobs_placeholder', value: 'البحث عن وظائف، فئات...' },
    { code: 'AR', key: 'show_all_btn', value: 'عرض الكل' },
    { code: 'AR', key: 'ai_matches_btn', value: 'مطابقات الذكاء الاصطناعي' },
    { code: 'AR', key: 'proposal_submitted_badge', value: 'تم تقديم المقترح' },
    { code: 'AR', key: 'subcategory_label', value: 'الفئة الفرعية:' },
    { code: 'AR', key: 'experience_required_label', value: 'الخبرة المطلوبة:' },
    { code: 'AR', key: 'budget_label', value: 'الميزانية:' },
    { code: 'AR', key: 'duration_label', value: 'المدة:' },
    { code: 'AR', key: 'freelancers_label', value: 'المستقلين:' },
    { code: 'AR', key: 'submit_proposal_btn', value: 'تقديم مقترح' },
    { code: 'AR', key: 'hours_limit_label', value: 'حد الساعات:' },
    { code: 'AR', key: 'payout_label', value: 'الدفع:' },
    { code: 'AR', key: 'checking_btn', value: 'جاري التحقق...' },

    // French (FR)
    { code: 'FR', key: 'find_projects_header', value: 'Trouver des projets et des offres' },
    { code: 'FR', key: 'find_projects_desc', value: 'Parcourez les projets actifs publiés par les clients et soumettez vos propositions.' },
    { code: 'FR', key: 'search_jobs_placeholder', value: 'Rechercher des emplois, des catégories...' },
    { code: 'FR', key: 'show_all_btn', value: 'Afficher tout' },
    { code: 'FR', key: 'ai_matches_btn', value: 'Correspondances IA' },
    { code: 'FR', key: 'proposal_submitted_badge', value: 'Proposition soumise' },
    { code: 'FR', key: 'subcategory_label', value: 'Sous-catégorie :' },
    { code: 'FR', key: 'experience_required_label', value: 'Expérience requise :' },
    { code: 'FR', key: 'budget_label', value: 'Budget :' },
    { code: 'FR', key: 'duration_label', value: 'Durée :' },
    { code: 'FR', key: 'freelancers_label', value: 'Freelances :' },
    { code: 'FR', key: 'submit_proposal_btn', value: 'Soumettre une proposition' },
    { code: 'FR', key: 'hours_limit_label', value: 'Limite d\'heures :' },
    { code: 'FR', key: 'payout_label', value: 'Paiement :' },
    { code: 'FR', key: 'checking_btn', value: 'Vérification...' },

    // German (DE)
    { code: 'DE', key: 'find_projects_header', value: 'Projekte & Angebote finden' },
    { code: 'DE', key: 'find_projects_desc', value: 'Durchsuchen Sie aktive Projekte von Kunden und senden Sie Ihre Angebote.' },
    { code: 'DE', key: 'search_jobs_placeholder', value: 'Jobs, Kategorien suchen...' },
    { code: 'DE', key: 'show_all_btn', value: 'Alle anzeigen' },
    { code: 'DE', key: 'ai_matches_btn', value: 'KI-Treffer' },
    { code: 'DE', key: 'proposal_submitted_badge', value: 'Vorschlag eingereicht' },
    { code: 'DE', key: 'subcategory_label', value: 'Unterkategorie:' },
    { code: 'DE', key: 'experience_required_label', value: 'Erforderliche Erfahrung:' },
    { code: 'DE', key: 'budget_label', value: 'Budget:' },
    { code: 'DE', key: 'duration_label', value: 'Dauer:' },
    { code: 'DE', key: 'freelancers_label', value: 'Freelancer:' },
    { code: 'DE', key: 'submit_proposal_btn', value: 'Vorschlag einreichen' },
    { code: 'DE', key: 'hours_limit_label', value: 'Stundenlimit:' },
    { code: 'DE', key: 'payout_label', value: 'Auszahlung:' },
    { code: 'DE', key: 'checking_btn', value: 'Überprüfung...' },

    // Spanish (ES)
    { code: 'ES', key: 'find_projects_header', value: 'Buscar proyectos y ofertas' },
    { code: 'ES', key: 'find_projects_desc', value: 'Explore proyectos activos publicados por clientes y envíe sus propuestas.' },
    { code: 'ES', key: 'search_jobs_placeholder', value: 'Buscar trabajos, categorías...' },
    { code: 'ES', key: 'show_all_btn', value: 'Mostrar todo' },
    { code: 'ES', key: 'ai_matches_btn', value: 'Coincidencias de IA' },
    { code: 'ES', key: 'proposal_submitted_badge', value: 'Propuesta enviada' },
    { code: 'ES', key: 'subcategory_label', value: 'Subcategoría:' },
    { code: 'ES', key: 'experience_required_label', value: 'Experiencia requerida:' },
    { code: 'ES', key: 'budget_label', value: 'Presupuesto:' },
    { code: 'ES', key: 'duration_label', value: 'Duración:' },
    { code: 'ES', key: 'freelancers_label', value: 'Freelancers:' },
    { code: 'ES', key: 'submit_proposal_btn', value: 'Presentar propuesta' },
    { code: 'ES', key: 'hours_limit_label', value: 'Límite de horas:' },
    { code: 'ES', key: 'payout_label', value: 'Pago:' },
    { code: 'ES', key: 'checking_btn', value: 'Comprobando...' }
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
    console.log("✅ Seeded/Updated Find Work translation keys successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
