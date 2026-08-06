import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for contract statuses and detailed dashboard translations...");
  
  const translations = [
    // English (EN)
    { code: 'EN', key: 'under review', value: 'Under Review' },
    { code: 'EN', key: 'under_review', value: 'Under Review' },
    { code: 'EN', key: 'work started', value: 'Work Started' },
    { code: 'EN', key: 'work_started', value: 'Work Started' },
    { code: 'EN', key: 'in progress', value: 'In Progress' },
    { code: 'EN', key: 'in_progress', value: 'In Progress' },
    { code: 'EN', key: 'hired', value: 'Hired' },
    { code: 'EN', key: 'work completed', value: 'Work Completed' },
    { code: 'EN', key: 'work_completed', value: 'Work Completed' },
    { code: 'EN', key: 'disputed', value: 'Disputed' },
    { code: 'EN', key: 'project_milestone_delivery_title', value: 'Project Milestone & Delivery' },
    { code: 'EN', key: 'gig_order_delivery_title', value: 'Gig Order Delivery' },
    { code: 'EN', key: 'btn_back_to_dashboard', value: 'Back to Dashboard' },

    // Arabic (AR)
    { code: 'AR', key: 'under review', value: 'قيد المراجعة' },
    { code: 'AR', key: 'under_review', value: 'قيد المراجعة' },
    { code: 'AR', key: 'work started', value: 'بدأ العمل' },
    { code: 'AR', key: 'work_started', value: 'بدأ العمل' },
    { code: 'AR', key: 'in progress', value: 'قيد التنفيذ' },
    { code: 'AR', key: 'in_progress', value: 'قيد التنفيذ' },
    { code: 'AR', key: 'hired', value: 'تم التوظيف' },
    { code: 'AR', key: 'work completed', value: 'تم إكمال العمل' },
    { code: 'AR', key: 'work_completed', value: 'تم إكمال العمل' },
    { code: 'AR', key: 'disputed', value: 'متنازع عليه' },
    { code: 'AR', key: 'project_milestone_delivery_title', value: 'معلم المشروع والتسليم' },
    { code: 'AR', key: 'gig_order_delivery_title', value: 'تسليم طلب الخدمة' },
    { code: 'AR', key: 'btn_back_to_dashboard', value: 'العودة إلى لوحة التحكم' },

    // French (FR)
    { code: 'FR', key: 'under review', value: 'En cours de révision' },
    { code: 'FR', key: 'under_review', value: 'En cours de révision' },
    { code: 'FR', key: 'work started', value: 'Travail commencé' },
    { code: 'FR', key: 'work_started', value: 'Travail commencé' },
    { code: 'FR', key: 'in progress', value: 'En cours' },
    { code: 'FR', key: 'in_progress', value: 'En cours' },
    { code: 'FR', key: 'hired', value: 'Embauché' },
    { code: 'FR', key: 'work completed', value: 'Travail terminé' },
    { code: 'FR', key: 'work_completed', value: 'Travail terminé' },
    { code: 'FR', key: 'disputed', value: 'Contesté' },
    { code: 'FR', key: 'project_milestone_delivery_title', value: 'Étape et livraison du projet' },
    { code: 'FR', key: 'gig_order_delivery_title', value: 'Livraison de la commande de service' },
    { code: 'FR', key: 'btn_back_to_dashboard', value: 'Retour au tableau de bord' },

    // German (DE)
    { code: 'DE', key: 'under review', value: 'Unter Überprüfung' },
    { code: 'DE', key: 'under_review', value: 'Unter Überprüfung' },
    { code: 'DE', key: 'work started', value: 'Arbeit begonnen' },
    { code: 'DE', key: 'work_started', value: 'Arbeit begonnen' },
    { code: 'DE', key: 'in progress', value: 'In Bearbeitung' },
    { code: 'DE', key: 'in_progress', value: 'In Bearbeitung' },
    { code: 'DE', key: 'hired', value: 'Eingestellt' },
    { code: 'DE', key: 'work completed', value: 'Arbeit abgeschlossen' },
    { code: 'DE', key: 'work_completed', value: 'Arbeit abgeschlossen' },
    { code: 'DE', key: 'disputed', value: 'Umstritten' },
    { code: 'DE', key: 'project_milestone_delivery_title', value: 'Projekt-Meilenstein & Lieferung' },
    { code: 'DE', key: 'gig_order_delivery_title', value: 'Gig-Bestelllieferung' },
    { code: 'DE', key: 'btn_back_to_dashboard', value: 'Zurück zum Dashboard' },

    // Spanish (ES)
    { code: 'ES', key: 'under review', value: 'En revisión' },
    { code: 'ES', key: 'under_review', value: 'En revisión' },
    { code: 'ES', key: 'work started', value: 'Trabajo iniciado' },
    { code: 'ES', key: 'work_started', value: 'Trabajo iniciado' },
    { code: 'ES', key: 'in progress', value: 'En progreso' },
    { code: 'ES', key: 'in_progress', value: 'En progreso' },
    { code: 'ES', key: 'hired', value: 'Contratado' },
    { code: 'ES', key: 'work completed', value: 'Trabajo completado' },
    { code: 'ES', key: 'work_completed', value: 'Trabajo completado' },
    { code: 'ES', key: 'disputed', value: 'En disputa' },
    { code: 'ES', key: 'project_milestone_delivery_title', value: 'Hito y entrega del proyecto' },
    { code: 'ES', key: 'gig_order_delivery_title', value: 'Entrega del pedido de servicio' },
    { code: 'ES', key: 'btn_back_to_dashboard', value: 'Volver al panel de control' }
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
    console.log("✅ Seeded/Updated contract status translation keys successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
