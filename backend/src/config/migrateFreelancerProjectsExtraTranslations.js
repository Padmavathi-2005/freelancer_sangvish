import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for freelancer projects extra translation copy...");
  
  const translations = [
    // English (EN)
    { code: 'EN', key: 'back_to_projects_btn', value: 'Back to Projects' },
    { code: 'EN', key: 'open_chat_btn', value: 'Open Chat' },
    { code: 'EN', key: 'hourly_rate_label', value: 'Hourly Rate' },
    { code: 'EN', key: 'escrow_remaining_label', value: 'Escrow Remaining:' },
    { code: 'EN', key: 'progress_label', value: 'Progress' },
    { code: 'EN', key: 'client_partner_label', value: 'Client Partner' },
    { code: 'EN', key: 'contract_scope_desc_label', value: 'Contract Scope & Description' },

    // Arabic (AR)
    { code: 'AR', key: 'back_to_projects_btn', value: 'العودة إلى المشاريع' },
    { code: 'AR', key: 'open_chat_btn', value: 'فتح الدردشة' },
    { code: 'AR', key: 'hourly_rate_label', value: 'أجر الساعة' },
    { code: 'AR', key: 'escrow_remaining_label', value: 'الضمان المتبقي:' },
    { code: 'AR', key: 'progress_label', value: 'التقدم' },
    { code: 'AR', key: 'client_partner_label', value: 'العميل الشريك' },
    { code: 'AR', key: 'contract_scope_desc_label', value: 'نطاق العقد والوصف' },

    // French (FR)
    { code: 'FR', key: 'back_to_projects_btn', value: 'Retour aux projets' },
    { code: 'FR', key: 'open_chat_btn', value: 'Ouvrir le chat' },
    { code: 'FR', key: 'hourly_rate_label', value: 'Taux horaire' },
    { code: 'FR', key: 'escrow_remaining_label', value: 'Dépôt de garantie restant :' },
    { code: 'FR', key: 'progress_label', value: 'Progression' },
    { code: 'FR', key: 'client_partner_label', value: 'Client partenaire' },
    { code: 'FR', key: 'contract_scope_desc_label', value: 'Portée du contrat et description' },

    // German (DE)
    { code: 'DE', key: 'back_to_projects_btn', value: 'Zurück zu den Projekten' },
    { code: 'DE', key: 'open_chat_btn', value: 'Chat öffnen' },
    { code: 'DE', key: 'hourly_rate_label', value: 'Stundensatz' },
    { code: 'DE', key: 'escrow_remaining_label', value: 'Verbleibendes Treuhandguthaben:' },
    { code: 'DE', key: 'progress_label', value: 'Fortschritt' },
    { code: 'DE', key: 'client_partner_label', value: 'Kundenpartner' },
    { code: 'DE', key: 'contract_scope_desc_label', value: 'Vertragsumfang & Beschreibung' },

    // Spanish (ES)
    { code: 'ES', key: 'back_to_projects_btn', value: 'Volver a los proyectos' },
    { code: 'ES', key: 'open_chat_btn', value: 'Abrir chat' },
    { code: 'ES', key: 'hourly_rate_label', value: 'Tarifa por hora' },
    { code: 'ES', key: 'escrow_remaining_label', value: 'Garantía restante:' },
    { code: 'ES', key: 'progress_label', value: 'Progreso' },
    { code: 'ES', key: 'client_partner_label', value: 'Cliente socio' },
    { code: 'ES', key: 'contract_scope_desc_label', value: 'Alcance del contrato y descripción' }
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
    console.log("✅ Seeded/Updated Freelancer Projects extra translation keys successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
