import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for projects search page translation copy...");
  
  const translations = [
    // English (EN)
    { code: 'EN', key: 'proposal_submitted_btn', value: 'Proposal Submitted' },
    { code: 'EN', key: 'share_earn_btn', value: 'Share & Earn' },
    { code: 'EN', key: 'ai_matches_btn', value: 'AI Matches' },
    { code: 'EN', key: 'best_match_label', value: 'Best Match' },
    { code: 'EN', key: 'match_score_label', value: 'Match' },
    { code: 'EN', key: 'view_project_btn', value: 'View Project →' },
    { code: 'EN', key: 'analysing_profile_status', value: 'Analysing your profile...' },
    { code: 'EN', key: 'ai_matching_skills_status', value: 'AI is matching your skills to the best open projects' },
    { code: 'EN', key: 'no_strong_matches_found', value: 'No strong matches found' },
    { code: 'EN', key: 'no_strong_matches_desc', value: 'Try completing more of your freelancer profile so the AI can better understand your expertise.' },

    // Arabic (AR)
    { code: 'AR', key: 'proposal_submitted_btn', value: 'تم تقديم المقترح' },
    { code: 'AR', key: 'share_earn_btn', value: 'شارك واربح' },
    { code: 'AR', key: 'ai_matches_btn', value: 'مطابقات الذكاء الاصطناعي' },
    { code: 'AR', key: 'best_match_label', value: 'أفضل تطابق' },
    { code: 'AR', key: 'match_score_label', value: 'تطابق' },
    { code: 'AR', key: 'view_project_btn', value: 'عرض المشروع ←' },
    { code: 'AR', key: 'analysing_profile_status', value: 'جاري تحليل ملفك الشخصي...' },
    { code: 'AR', key: 'ai_matching_skills_status', value: 'يقوم الذكاء الاصطناعي بمطابقة مهاراتك مع أفضل المشاريع المفتوحة' },
    { code: 'AR', key: 'no_strong_matches_found', value: 'لم يتم العثور على مطابقات قوية' },
    { code: 'AR', key: 'no_strong_matches_desc', value: 'حاول إكمال المزيد من ملفك الشخصي كمستقل حتى يتمكن الذكاء الاصطناعي من فهم خبرتك بشكل أفضل.' },

    // French (FR)
    { code: 'FR', key: 'proposal_submitted_btn', value: 'Proposition soumise' },
    { code: 'FR', key: 'share_earn_btn', value: 'Partager et gagner' },
    { code: 'FR', key: 'ai_matches_btn', value: 'Correspondances IA' },
    { code: 'FR', key: 'best_match_label', value: 'Meilleure correspondance' },
    { code: 'FR', key: 'match_score_label', value: 'Match' },
    { code: 'FR', key: 'view_project_btn', value: 'Voir le projet →' },
    { code: 'FR', key: 'analysing_profile_status', value: 'Analyse de votre profil...' },
    { code: 'FR', key: 'ai_matching_skills_status', value: 'L\'IA associe vos compétences aux meilleurs projets ouverts' },
    { code: 'FR', key: 'no_strong_matches_found', value: 'Aucune correspondance solide trouvée' },
    { code: 'FR', key: 'no_strong_matches_desc', value: 'Essayez de compléter davantage votre profil de freelance afin que l\'IA puisse mieux comprendre votre expertise.' },

    // German (DE)
    { code: 'DE', key: 'proposal_submitted_btn', value: 'Vorschlag eingereicht' },
    { code: 'DE', key: 'share_earn_btn', value: 'Teilen & Verdienen' },
    { code: 'DE', key: 'ai_matches_btn', value: 'KI-Übereinstimmungen' },
    { code: 'DE', key: 'best_match_label', value: 'Beste Übereinstimmung' },
    { code: 'DE', key: 'match_score_label', value: 'Übereinstimmung' },
    { code: 'DE', key: 'view_project_btn', value: 'Projekt anzeigen →' },
    { code: 'DE', key: 'analysing_profile_status', value: 'Profil wird analysiert...' },
    { code: 'DE', key: 'ai_matching_skills_status', value: 'KI gleicht Ihre Fähigkeiten mit den besten offenen Projekten ab' },
    { code: 'DE', key: 'no_strong_matches_found', value: 'Keine starken Übereinstimmungen gefunden' },
    { code: 'DE', key: 'no_strong_matches_desc', value: 'Versuchen Sie, Ihr Freelancer-Profil weiter auszufüllen, damit die KI Ihre Expertise besser verstehen kann.' },

    // Spanish (ES)
    { code: 'ES', key: 'proposal_submitted_btn', value: 'Propuesta presentada' },
    { code: 'ES', key: 'share_earn_btn', value: 'Compartir y ganar' },
    { code: 'ES', key: 'ai_matches_btn', value: 'Coincidencias de IA' },
    { code: 'ES', key: 'best_match_label', value: 'Mejor coincidencia' },
    { code: 'ES', key: 'match_score_label', value: 'Coincidencia' },
    { code: 'ES', key: 'view_project_btn', value: 'Ver proyecto →' },
    { code: 'ES', key: 'analysing_profile_status', value: 'Analizando su perfil...' },
    { code: 'ES', key: 'ai_matching_skills_status', value: 'La IA está emparejando sus habilidades con los mejores proyectos abiertos' },
    { code: 'ES', key: 'no_strong_matches_found', value: 'No se encontraron coincidencias sólidas' },
    { code: 'ES', key: 'no_strong_matches_desc', value: 'Intente completar más su perfil de freelancer para que la IA pueda comprender mejor su experiencia.' }
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
    console.log("✅ Seeded/Updated Projects Search page translation keys successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
