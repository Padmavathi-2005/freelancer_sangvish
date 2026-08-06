import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for notification translations...");
  
  const translations = [
    // English (EN)
    { code: 'EN', key: 'notifications_activity_log', value: 'Notifications & Activity Log' },
    { code: 'EN', key: 'notifications_subtitle', value: 'Stay updated on your proposal status, gig orders, and profile alerts.' },
    { code: 'EN', key: 'mark_all_as_read', value: 'Mark All as Read' },
    { code: 'EN', key: 'mark_read', value: 'Mark Read' },
    { code: 'EN', key: 'notifications_all_caught_up', value: 'All caught up!' },
    { code: 'EN', key: 'notifications_empty_desc', value: 'You have no new or past notifications at the moment.' },
    { code: 'EN', key: 'work submitted for milestone 🚀', value: 'Work Submitted for Milestone 🚀' },
    { code: 'EN', key: 'project cancelled by freelancer', value: 'Project Cancelled by Freelancer' },

    // Arabic (AR)
    { code: 'AR', key: 'notifications_activity_log', value: 'الإشعارات وسجل النشاط' },
    { code: 'AR', key: 'notifications_subtitle', value: 'ابق على اطلاع بحالة المقترح، وطلبات الخدمات، وتنبيهات الملف الشخصي.' },
    { code: 'AR', key: 'mark_all_as_read', value: 'تحديد الكل كمقروء' },
    { code: 'AR', key: 'mark_read', value: 'تحديد كمقروء' },
    { code: 'AR', key: 'notifications_all_caught_up', value: 'كل شيء جاهز!' },
    { code: 'AR', key: 'notifications_empty_desc', value: 'ليس لديك أي إشعارات جديدة أو سابقة في الوقت الحالي.' },
    { code: 'AR', key: 'work submitted for milestone 🚀', value: 'تم تقديم العمل للمرحلة 🚀' },
    { code: 'AR', key: 'project cancelled by freelancer', value: 'تم إلغاء المشروع من قبل المستقل' },

    // French (FR)
    { code: 'FR', key: 'notifications_activity_log', value: "Notifications et journal d'activité" },
    { code: 'FR', key: 'notifications_subtitle', value: 'Restez informé du statut de vos propositions, de vos commandes de services et des alertes de profil.' },
    { code: 'FR', key: 'mark_all_as_read', value: 'Tout marquer comme lu' },
    { code: 'FR', key: 'mark_read', value: 'Marquer comme lu' },
    { code: 'FR', key: 'notifications_all_caught_up', value: 'Tout est à jour !' },
    { code: 'FR', key: 'notifications_empty_desc', value: "Vous n'avez pas de nouvelles notifications ou de notifications passées pour le moment." },
    { code: 'FR', key: 'work submitted for milestone 🚀', value: 'Travail soumis pour le jalon 🚀' },
    { code: 'FR', key: 'project cancelled by freelancer', value: 'Projet annulé par le freelance' },

    // German (DE)
    { code: 'DE', key: 'notifications_activity_log', value: 'Benachrichtigungen & Aktivitätsprotokoll' },
    { code: 'DE', key: 'notifications_subtitle', value: 'Bleiben Sie über Ihren Angebotsstatus, Gig-Bestellungen und Profil-Benachrichtigungen auf dem Laufenden.' },
    { code: 'DE', key: 'mark_all_as_read', value: 'Alle als gelesen markieren' },
    { code: 'DE', key: 'mark_read', value: 'Als gelesen markieren' },
    { code: 'DE', key: 'notifications_all_caught_up', value: 'Alles erledigt!' },
    { code: 'DE', key: 'notifications_empty_desc', value: 'Sie haben derzeit keine neuen oder vergangenen Benachrichtigungen.' },
    { code: 'DE', key: 'work submitted for milestone 🚀', value: 'Arbeit für Meilenstein eingereicht 🚀' },
    { code: 'DE', key: 'project cancelled by freelancer', value: 'Projekt vom Freelancer abgebrochen' },

    // Spanish (ES)
    { code: 'ES', key: 'notifications_activity_log', value: 'Notificaciones y registro de actividad' },
    { code: 'ES', key: 'notifications_subtitle', value: 'Manténgase actualizado sobre el estado de su propuesta, pedidos de servicios y alertas de perfil.' },
    { code: 'ES', key: 'mark_all_as_read', value: 'Marcar todo como leído' },
    { code: 'ES', key: 'mark_read', value: 'Marcar como leído' },
    { code: 'ES', key: 'notifications_all_caught_up', value: '¡Todo al día!' },
    { code: 'ES', key: 'notifications_empty_desc', value: 'No tienes notificaciones nuevas o pasadas en este momento.' },
    { code: 'ES', key: 'work submitted for milestone 🚀', value: 'Trabajo enviado para el hito 🚀' },
    { code: 'ES', key: 'project cancelled by freelancer', value: 'Proyecto cancelado por el freelancer' }
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
    console.log("✅ Seeded/Updated Notifications translation keys successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
