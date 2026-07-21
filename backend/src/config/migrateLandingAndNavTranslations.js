import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for sidebar navigation and landing translation copy...");
  
  const translations = [
    // English (EN)
    { code: 'EN', key: 'workspace_hub_menu', value: 'Workspace Hub' },
    { code: 'EN', key: 'my_wishlist_menu', value: 'My Wishlist' },
    { code: 'EN', key: 'search_browse_menu', value: 'Search & Browse' },
    { code: 'EN', key: 'hired_freelancers_menu', value: 'Hired Freelancers' },
    { code: 'EN', key: 'recommendations_menu', value: 'Recommendations' },
    { code: 'EN', key: 'my_posted_projects_menu', value: 'My Posted Projects' },
    { code: 'EN', key: 'explore_gigs_menu', value: 'Explore Gigs' },
    { code: 'EN', key: 'your_gig_orders_menu', value: 'Your Gig Orders' },
    { code: 'EN', key: 'notifications_menu', value: 'Notifications' },
    { code: 'EN', key: 'my_projects_menu', value: 'My Projects' },
    { code: 'EN', key: 'find_work_menu', value: 'Find Work' },
    { code: 'EN', key: 'my_proposals_menu', value: 'My Proposals' },
    { code: 'EN', key: 'active_workspace_role', value: 'Active Workspace Role' },
    { code: 'EN', key: 'active_workspace_indicator', value: 'Active Workspace:' },
    { code: 'EN', key: 'client_view_indicator', value: 'Client View' },
    { code: 'EN', key: 'freelancer_view_indicator', value: 'Freelancer View' },
    { code: 'EN', key: 'freelancer_role', value: 'Freelancer' },
    { code: 'EN', key: 'client_role', value: 'Client' },
    { code: 'EN', key: 'hire_freelancers_header', value: 'Hire Freelancers' },
    { code: 'EN', key: 'gig_orders_services_header', value: 'Gig Orders & Services' },
    { code: 'EN', key: 'communication_settings_header', value: 'Communication & Settings' },
    { code: 'EN', key: 'post_new_gig_btn', value: 'Post a New Gig' },
    { code: 'EN', key: 'post_new_project_btn', value: 'Post a New Project' },
    { code: 'EN', key: 'find_deliver_work_header', value: 'Find & Deliver Work' },
    { code: 'EN', key: 'my_gigs_menu', value: 'My Gigs' },
    { code: 'EN', key: 'gig_orders_menu', value: 'Gig Orders' },
    { code: 'EN', key: 'workspace_hub_locked_title', value: 'Workspace Hub Locked' },

    // Arabic (AR)
    { code: 'AR', key: 'workspace_hub_menu', value: 'مركز مساحة العمل' },
    { code: 'AR', key: 'my_wishlist_menu', value: 'قائمة رغباتي' },
    { code: 'AR', key: 'search_browse_menu', value: 'البحث والتصفح' },
    { code: 'AR', key: 'hired_freelancers_menu', value: 'المستقلون الموظفون' },
    { code: 'AR', key: 'recommendations_menu', value: 'التوصيات' },
    { code: 'AR', key: 'my_posted_projects_menu', value: 'مشاريعي المنشورة' },
    { code: 'AR', key: 'explore_gigs_menu', value: 'استكشاف الخدمات' },
    { code: 'AR', key: 'your_gig_orders_menu', value: 'طلبات خدماتك' },
    { code: 'AR', key: 'notifications_menu', value: 'الإشعارات' },
    { code: 'AR', key: 'my_projects_menu', value: 'مشاريعي' },
    { code: 'AR', key: 'find_work_menu', value: 'البحث عن عمل' },
    { code: 'AR', key: 'my_proposals_menu', value: 'عروضي' },
    { code: 'AR', key: 'active_workspace_role', value: 'دور مساحة العمل النشط' },
    { code: 'AR', key: 'active_workspace_indicator', value: 'مساحة العمل النشطة:' },
    { code: 'AR', key: 'client_view_indicator', value: 'عرض العميل' },
    { code: 'AR', key: 'freelancer_view_indicator', value: 'عرض المستقل' },
    { code: 'AR', key: 'freelancer_role', value: 'مستقل' },
    { code: 'AR', key: 'client_role', value: 'عميل' },
    { code: 'AR', key: 'hire_freelancers_header', value: 'توظيف المستقلين' },
    { code: 'AR', key: 'gig_orders_services_header', value: 'طلبات الخدمات والخدمات' },
    { code: 'AR', key: 'communication_settings_header', value: 'الاتصالات والإعدادات' },
    { code: 'AR', key: 'post_new_gig_btn', value: 'نشر خدمة جديدة' },
    { code: 'AR', key: 'post_new_project_btn', value: 'نشر مشروع جديد' },
    { code: 'AR', key: 'find_deliver_work_header', value: 'البحث عن العمل وتسليمه' },
    { code: 'AR', key: 'my_gigs_menu', value: 'خدماتي' },
    { code: 'AR', key: 'gig_orders_menu', value: 'طلبات الخدمات' },
    { code: 'AR', key: 'workspace_hub_locked_title', value: 'مركز مساحة العمل مغلق' },

    // French (FR)
    { code: 'FR', key: 'workspace_hub_menu', value: 'Espace de travail' },
    { code: 'FR', key: 'my_wishlist_menu', value: 'Ma liste d\'envies' },
    { code: 'FR', key: 'search_browse_menu', value: 'Rechercher et parcourir' },
    { code: 'FR', key: 'hired_freelancers_menu', value: 'Freelances embauchés' },
    { code: 'FR', key: 'recommendations_menu', value: 'Recommandations' },
    { code: 'FR', key: 'my_posted_projects_menu', value: 'Mes projets publiés' },
    { code: 'FR', key: 'explore_gigs_menu', value: 'Explorer les services' },
    { code: 'FR', key: 'your_gig_orders_menu', value: 'Vos commandes de services' },
    { code: 'FR', key: 'notifications_menu', value: 'Notifications' },
    { code: 'FR', key: 'my_projects_menu', value: 'Mes projets' },
    { code: 'FR', key: 'find_work_menu', value: 'Trouver du travail' },
    { code: 'FR', key: 'my_proposals_menu', value: 'Mes propositions' },
    { code: 'FR', key: 'active_workspace_role', value: 'Rôle de l\'espace de travail actif' },
    { code: 'FR', key: 'active_workspace_indicator', value: 'Espace de travail actif :' },
    { code: 'FR', key: 'client_view_indicator', value: 'Vue Client' },
    { code: 'FR', key: 'freelancer_view_indicator', value: 'Vue Freelance' },
    { code: 'FR', key: 'freelancer_role', value: 'Freelance' },
    { code: 'FR', key: 'client_role', value: 'Client' },
    { code: 'FR', key: 'hire_freelancers_header', value: 'Embaucher des freelances' },
    { code: 'FR', key: 'gig_orders_services_header', value: 'Commandes de services & services' },
    { code: 'FR', key: 'communication_settings_header', value: 'Communication & Paramètres' },
    { code: 'FR', key: 'post_new_gig_btn', value: 'Publier un nouveau service' },
    { code: 'FR', key: 'post_new_project_btn', value: 'Publier un nouveau projet' },
    { code: 'FR', key: 'find_deliver_work_header', value: 'Trouver & livrer du travail' },
    { code: 'FR', key: 'my_gigs_menu', value: 'Mes services' },
    { code: 'FR', key: 'gig_orders_menu', value: 'Commandes de services' },
    { code: 'FR', key: 'workspace_hub_locked_title', value: 'Espace de travail verrouillé' },

    // German (DE)
    { code: 'DE', key: 'workspace_hub_menu', value: 'Arbeitsbereich-Hub' },
    { code: 'DE', key: 'my_wishlist_menu', value: 'Meine Wunschliste' },
    { code: 'DE', key: 'search_browse_menu', value: 'Suchen & Durchsuchen' },
    { code: 'DE', key: 'hired_freelancers_menu', value: 'Eingestellte Freelancer' },
    { code: 'DE', key: 'recommendations_menu', value: 'Empfehlungen' },
    { code: 'DE', key: 'my_posted_projects_menu', value: 'Meine geposteten Projekte' },
    { code: 'DE', key: 'explore_gigs_menu', value: 'Gigs erkunden' },
    { code: 'DE', key: 'your_gig_orders_menu', value: 'Ihre Gig-Bestellungen' },
    { code: 'DE', key: 'notifications_menu', value: 'Benachrichtigungen' },
    { code: 'DE', key: 'my_projects_menu', value: 'Meine Projekte' },
    { code: 'DE', key: 'find_work_menu', value: 'Arbeit finden' },
    { code: 'DE', key: 'my_proposals_menu', value: 'Meine Vorschläge' },
    { code: 'DE', key: 'active_workspace_role', value: 'Aktive Arbeitsbereich-Rolle' },
    { code: 'DE', key: 'active_workspace_indicator', value: 'Aktiver Arbeitsbereich:' },
    { code: 'DE', key: 'client_view_indicator', value: 'Client-Ansicht' },
    { code: 'DE', key: 'freelancer_view_indicator', value: 'Freelancer-Ansicht' },
    { code: 'DE', key: 'freelancer_role', value: 'Freelancer' },
    { code: 'DE', key: 'client_role', value: 'Kunde' },
    { code: 'DE', key: 'hire_freelancers_header', value: 'Freelancer einstellen' },
    { code: 'DE', key: 'gig_orders_services_header', value: 'Gig-Bestellungen & Dienstleistungen' },
    { code: 'DE', key: 'communication_settings_header', value: 'Kommunikation & Einstellungen' },
    { code: 'DE', key: 'post_new_gig_btn', value: 'Einen neuen Gig posten' },
    { code: 'DE', key: 'post_new_project_btn', value: 'Ein neues Projekt posten' },
    { code: 'DE', key: 'find_deliver_work_header', value: 'Arbeit finden & liefern' },
    { code: 'DE', key: 'my_gigs_menu', value: 'Meine Gigs' },
    { code: 'DE', key: 'gig_orders_menu', value: 'Gig-Bestellungen' },
    { code: 'DE', key: 'workspace_hub_locked_title', value: 'Arbeitsbereich-Hub gesperrt' }
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
    console.log("✅ Seeded/Updated landing and navigation translation keys successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
