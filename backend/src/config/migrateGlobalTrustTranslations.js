import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for Global Trust Section translations...");
  
  const translations = [
    // English (EN)
    { code: 'EN', key: 'global_trust_eyebrow', value: 'We’re expanding day by day' },
    { code: 'EN', key: 'global_trust_title', value: 'Global Trust of 1 Million Businesses and Counting' },
    { code: 'EN', key: 'global_trust_desc', value: 'Connect with skilled professionals, streamline collaboration, and unlock success. Join now and redefine your work experience!.' },
    { code: 'EN', key: 'global_trust_check_1', value: 'Connect with pros collaborate better succeed faster' },
    { code: 'EN', key: 'global_trust_check_2', value: 'Redefine work Join now for a better experience' },
    { code: 'EN', key: 'global_trust_check_3', value: 'Streamline collaboration unlock success' },
    { code: 'EN', key: 'global_trust_check_4', value: 'Join us redefine your work experience' },
    { code: 'EN', key: 'view_profile_btn', value: 'View Profile' },

    // Arabic (AR)
    { code: 'AR', key: 'global_trust_eyebrow', value: 'نحن نتوسع يومًا بعد يوم' },
    { code: 'AR', key: 'global_trust_title', value: 'الثقة العالمية لمليون شركة والعدد في ازدياد' },
    { code: 'AR', key: 'global_trust_desc', value: 'تواصل مع مهنيين مهرة، وسهّل التعاون، وافتح أبواب النجاح. انضم الآن وأعد تعريف تجربة عملك!' },
    { code: 'AR', key: 'global_trust_check_1', value: 'تواصل مع المحترفين، وتعاون بشكل أفضل، وانجح بشكل أسرع' },
    { code: 'AR', key: 'global_trust_check_2', value: 'أعد تعريف العمل، وانضم الآن للحصول على تجربة أفضل' },
    { code: 'AR', key: 'global_trust_check_3', value: 'سهّل التعاون وافتح أبواب النجاح' },
    { code: 'AR', key: 'global_trust_check_4', value: 'انضم إلينا وأعد تعريف تجربة عملك' },
    { code: 'AR', key: 'view_profile_btn', value: 'عرض الملف الشخصي' },

    // French (FR)
    { code: 'FR', key: 'global_trust_eyebrow', value: 'Nous nous développons de jour en jour' },
    { code: 'FR', key: 'global_trust_title', value: 'Confiance mondiale d\'un million d\'entreprises et ce n\'est pas fini' },
    { code: 'FR', key: 'global_trust_desc', value: 'Connectez-vous avec des professionnels qualifiés, simplifiez la collaboration et débloquez le succès. Rejoignez-nous maintenant et redéfinissez votre expérience de travail !' },
    { code: 'FR', key: 'global_trust_check_1', value: 'Connectez-vous avec des pros, collaborez mieux, réussissez plus vite' },
    { code: 'FR', key: 'global_trust_check_2', value: 'Redéfinissez le travail, inscrivez-vous maintenant pour une meilleure expérience' },
    { code: 'FR', key: 'global_trust_check_3', value: 'Simplifiez la collaboration, débloquez le succès' },
    { code: 'FR', key: 'global_trust_check_4', value: 'Rejoignez-nous, redéfinissez votre expérience de travail' },
    { code: 'FR', key: 'view_profile_btn', value: 'Voir le profil' },

    // German (DE)
    { code: 'DE', key: 'global_trust_eyebrow', value: 'Wir wachsen von Tag zu Tag' },
    { code: 'DE', key: 'global_trust_title', value: 'Globales Vertrauen von 1 Million Unternehmen und es werden mehr' },
    { code: 'DE', key: 'global_trust_desc', value: 'Verbinden Sie sich mit qualifizierten Fachkräften, optimieren Sie die Zusammenarbeit und schalten Sie den Erfolg frei. Melden Sie sich jetzt an und definieren Sie Ihre Arbeitserfahrung neu!' },
    { code: 'DE', key: 'global_trust_check_1', value: 'Verbinden Sie sich mit Profis, arbeiten Sie besser zusammen, haben Sie schneller Erfolg' },
    { code: 'DE', key: 'global_trust_check_2', value: 'Definieren Sie Arbeit neu, melden Sie sich jetzt an für eine bessere Erfahrung' },
    { code: 'DE', key: 'global_trust_check_3', value: 'Optimieren Sie die Zusammenarbeit, schalten Sie den Erfolg frei' },
    { code: 'DE', key: 'global_trust_check_4', value: 'Machen Sie mit, definieren Sie Ihre Arbeitserfahrung neu' },
    { code: 'DE', key: 'view_profile_btn', value: 'Profil anzeigen' },

    // Spanish (ES)
    { code: 'ES', key: 'global_trust_eyebrow', value: 'Nos expandimos día a día' },
    { code: 'ES', key: 'global_trust_title', value: 'Confianza global de 1 millón de empresas y contando' },
    { code: 'ES', key: 'global_trust_desc', value: 'Conéctese con profesionales capacitados, optimice la colaboración y libere el éxito. ¡Únase ahora y redefina su experiencia laboral!' },
    { code: 'ES', key: 'global_trust_check_1', value: 'Conéctese con profesionales, colabore mejor, tenga éxito más rápido' },
    { code: 'ES', key: 'global_trust_check_2', value: 'Redefina el trabajo, únase ahora para una mejor experiencia' },
    { code: 'ES', key: 'global_trust_check_3', value: 'Optimice la colaboración, libere el éxito' },
    { code: 'ES', key: 'global_trust_check_4', value: 'Únase a nosotros, redefina su experiencia laboral' },
    { code: 'ES', key: 'view_profile_btn', value: 'Ver perfil' }
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
    console.log("✅ Seeded/Updated Global Trust Section translation keys successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
