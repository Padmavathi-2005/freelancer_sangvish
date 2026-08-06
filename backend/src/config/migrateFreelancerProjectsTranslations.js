import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for freelancer projects translation copy...");
  
  const translations = [
    // English (EN)
    { code: 'EN', key: 'my_projects_contracts_header', value: 'My Projects & Contracts' },
    { code: 'EN', key: 'my_projects_contracts_desc', value: 'Manage your active freelancer assignments, track completion milestones, and view client history.' },
    { code: 'EN', key: 'ongoing_projects_filter', value: 'Ongoing Projects' },
    { code: 'EN', key: 'completed_projects_filter', value: 'Completed Projects' },
    { code: 'EN', key: 'cancelled_projects_filter', value: 'Cancelled Projects' },
    { code: 'EN', key: 'all_projects_filter', value: 'All Projects' },
    { code: 'EN', key: 'awaiting_approval_status', value: 'Awaiting Approval' },
    { code: 'EN', key: 'milestone_progress_label', value: 'Milestone Progress' },
    { code: 'EN', key: 'start_work_btn', value: 'Start Work' },
    { code: 'EN', key: 'submit_completed_work_btn', value: 'Submit Completed Work' },
    { code: 'EN', key: 'work_submitted_awaiting_approval_status', value: 'Work Submitted / Awaiting Approval' },
    { code: 'EN', key: 'hired_date_prefix', value: 'Hired:' },
    { code: 'EN', key: 'my_clients_tab', value: 'My Clients' },
    { code: 'EN', key: 'recommended_clients_tab', value: 'Recommended Clients' },
    { code: 'EN', key: 'no_client_history_yet', value: 'No client history yet' },
    { code: 'EN', key: 'no_client_history_desc', value: 'Complete your active contracts to start building client list history.' },
    { code: 'EN', key: 'message_client_btn', value: 'Message Client' },
    { code: 'EN', key: 'no_client_recommendations', value: 'No client recommendations' },
    { code: 'EN', key: 'no_client_recommendations_desc', value: 'No active hiring clients found that fit recommendations right now.' },
    { code: 'EN', key: 'direct_hiring_client_label', value: 'Direct Hiring Client' },
    { code: 'EN', key: 'view_client_profile_btn', value: 'View Client Profile' },

    // Arabic (AR)
    { code: 'AR', key: 'my_projects_contracts_header', value: 'مشاريعي وعقودي' },
    { code: 'AR', key: 'my_projects_contracts_desc', value: 'إدارة مهام العمل الحر النشطة، وتتبع معالم الإنجاز، وعرض سجل العملاء.' },
    { code: 'AR', key: 'ongoing_projects_filter', value: 'المشاريع الجارية' },
    { code: 'AR', key: 'completed_projects_filter', value: 'المشاريع المكتملة' },
    { code: 'AR', key: 'cancelled_projects_filter', value: 'المشاريع الملغاة' },
    { code: 'AR', key: 'all_projects_filter', value: 'كل المشاريع' },
    { code: 'AR', key: 'awaiting_approval_status', value: 'بانتظار الموافقة' },
    { code: 'AR', key: 'milestone_progress_label', value: 'تقدم المعالم' },
    { code: 'AR', key: 'start_work_btn', value: 'بدء العمل' },
    { code: 'AR', key: 'submit_completed_work_btn', value: 'تقديم العمل المكتمل' },
    { code: 'AR', key: 'work_submitted_awaiting_approval_status', value: 'تم تقديم العمل / بانتظار الموافقة' },
    { code: 'AR', key: 'hired_date_prefix', value: 'تم التوظيف:' },
    { code: 'AR', key: 'my_clients_tab', value: 'عملائي' },
    { code: 'AR', key: 'recommended_clients_tab', value: 'العملاء الموصى بهم' },
    { code: 'AR', key: 'no_client_history_yet', value: 'لا يوجد سجل للعملاء بعد' },
    { code: 'AR', key: 'no_client_history_desc', value: 'أكمل عقودك النشطة لبدء بناء سجل قائمة العملاء.' },
    { code: 'AR', key: 'message_client_btn', value: 'مراسلة العميل' },
    { code: 'AR', key: 'no_client_recommendations', value: 'لا توجد توصيات للعملاء' },
    { code: 'AR', key: 'no_client_recommendations_desc', value: 'لم يتم العثور على عملاء توظيف نشطين يناسبون التوصيات في الوقت الحالي.' },
    { code: 'AR', key: 'direct_hiring_client_label', value: 'عميل توظيف مباشر' },
    { code: 'AR', key: 'view_client_profile_btn', value: 'عرض ملف العميل' },

    // French (FR)
    { code: 'FR', key: 'my_projects_contracts_header', value: 'Mes projets et contrats' },
    { code: 'FR', key: 'my_projects_contracts_desc', value: 'Gerez vos missions de freelance actives, suivez les etapes de realisation et consultez l\'historique des clients.' },
    { code: 'FR', key: 'ongoing_projects_filter', value: 'Projets en cours' },
    { code: 'FR', key: 'completed_projects_filter', value: 'Projets terminés' },
    { code: 'FR', key: 'cancelled_projects_filter', value: 'Projets annulés' },
    { code: 'FR', key: 'all_projects_filter', value: 'Tous les projets' },
    { code: 'FR', key: 'awaiting_approval_status', value: 'En attente d\'approbation' },
    { code: 'FR', key: 'milestone_progress_label', value: 'Progression des jalons' },
    { code: 'FR', key: 'start_work_btn', value: 'Commencer le travail' },
    { code: 'FR', key: 'submit_completed_work_btn', value: 'Soumettre le travail terminé' },
    { code: 'FR', key: 'work_submitted_awaiting_approval_status', value: 'Travail soumis / En attente d\'approbation' },
    { code: 'FR', key: 'hired_date_prefix', value: 'Embauché :' },
    { code: 'FR', key: 'my_clients_tab', value: 'Mes clients' },
    { code: 'FR', key: 'recommended_clients_tab', value: 'Clients recommandés' },
    { code: 'FR', key: 'no_client_history_yet', value: 'Aucun historique client pour le moment' },
    { code: 'FR', key: 'no_client_history_desc', value: 'Terminez vos contrats actifs pour commencer à établir l\'historique de votre liste de clients.' },
    { code: 'FR', key: 'message_client_btn', value: 'Contacter le client' },
    { code: 'FR', key: 'no_client_recommendations', value: 'Aucune recommandation client' },
    { code: 'FR', key: 'no_client_recommendations_desc', value: 'Aucun client recruteur actif correspondant aux recommandations pour le moment.' },
    { code: 'FR', key: 'direct_hiring_client_label', value: 'Client recruteur direct' },
    { code: 'FR', key: 'view_client_profile_btn', value: 'Voir le profil du client' },

    // German (DE)
    { code: 'DE', key: 'my_projects_contracts_header', value: 'Meine Projekte & Verträge' },
    { code: 'DE', key: 'my_projects_contracts_desc', value: 'Verwalter Sie Ihre aktiven Freelancer-Aufträge, verfolgen Sie Fertigstellungsmeilensteine und zeigen Sie den Kundenverlauf an.' },
    { code: 'DE', key: 'ongoing_projects_filter', value: 'Laufende Projekte' },
    { code: 'DE', key: 'completed_projects_filter', value: 'Abgeschlossene Projekte' },
    { code: 'DE', key: 'cancelled_projects_filter', value: 'Stornierte Projekte' },
    { code: 'DE', key: 'all_projects_filter', value: 'Alle Projekte' },
    { code: 'DE', key: 'awaiting_approval_status', value: 'Warten auf Genehmigung' },
    { code: 'DE', key: 'milestone_progress_label', value: 'Meilensteinfortschritt' },
    { code: 'DE', key: 'start_work_btn', value: 'Arbeit starten' },
    { code: 'DE', key: 'submit_completed_work_btn', value: 'Abgeschlossene Arbeit einreichen' },
    { code: 'DE', key: 'work_submitted_awaiting_approval_status', value: 'Arbeit eingereicht / Wartet auf Genehmigung' },
    { code: 'DE', key: 'hired_date_prefix', value: 'Eingestellt:' },
    { code: 'DE', key: 'my_clients_tab', value: 'Meine Kunden' },
    { code: 'DE', key: 'recommended_clients_tab', value: 'Empfohlene Kunden' },
    { code: 'DE', key: 'no_client_history_yet', value: 'Noch kein Kundenverlauf' },
    { code: 'DE', key: 'no_client_history_desc', value: 'Schließen Sie Ihre aktiven Verträge ab, um eine Kundenliste aufzubauen.' },
    { code: 'DE', key: 'message_client_btn', value: 'Kunden anschreiben' },
    { code: 'DE', key: 'no_client_recommendations', value: 'Keine Kundenempfehlungen' },
    { code: 'DE', key: 'no_client_recommendations_desc', value: 'Derzeit wurden keine aktiven einstellenden Kunden gefunden, die zu den Empfehlungen passen.' },
    { code: 'DE', key: 'direct_hiring_client_label', value: 'Direkt einstellender Kunde' },
    { code: 'DE', key: 'view_client_profile_btn', value: 'Kundenprofil anzeigen' },

    // Spanish (ES)
    { code: 'ES', key: 'my_projects_contracts_header', value: 'Mis proyectos y contratos' },
    { code: 'ES', key: 'my_projects_contracts_desc', value: 'Gestione sus asignaciones activas de freelancer, realice un seguimiento de los hitos de finalización y vea el historial de clientes.' },
    { code: 'ES', key: 'ongoing_projects_filter', value: 'Proyectos en curso' },
    { code: 'ES', key: 'completed_projects_filter', value: 'Proyectos completados' },
    { code: 'ES', key: 'cancelled_projects_filter', value: 'Proyectos cancelados' },
    { code: 'ES', key: 'all_projects_filter', value: 'Todos los proyectos' },
    { code: 'ES', key: 'awaiting_approval_status', value: 'Esperando aprobación' },
    { code: 'ES', key: 'milestone_progress_label', value: 'Progreso de hitos' },
    { code: 'ES', key: 'start_work_btn', value: 'Comenzar trabajo' },
    { code: 'ES', key: 'submit_completed_work_btn', value: 'Presentar trabajo completado' },
    { code: 'ES', key: 'work_submitted_awaiting_approval_status', value: 'Trabajo presentado / Esperando aprobación' },
    { code: 'ES', key: 'hired_date_prefix', value: 'Contratado:' },
    { code: 'ES', key: 'my_clients_tab', value: 'Mis clientes' },
    { code: 'ES', key: 'recommended_clients_tab', value: 'Clientes recomendados' },
    { code: 'ES', key: 'no_client_history_yet', value: 'Aún no hay historial de clientes' },
    { code: 'ES', key: 'no_client_history_desc', value: 'Complete sus contratos activos para comenzar a crear el historial de la lista de clientes.' },
    { code: 'ES', key: 'message_client_btn', value: 'Enviar mensaje al cliente' },
    { code: 'ES', key: 'no_client_recommendations', value: 'No hay recomendaciones de clientes' },
    { code: 'ES', key: 'no_client_recommendations_desc', value: 'No se encontraron clientes contratantes activos que se ajusten a las recomendaciones en este momento.' },
    { code: 'ES', key: 'direct_hiring_client_label', value: 'Cliente de contratación directa' },
    { code: 'ES', key: 'view_client_profile_btn', value: 'Ver perfil del cliente' }
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
    console.log("✅ Seeded/Updated Freelancer Projects translation keys successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
