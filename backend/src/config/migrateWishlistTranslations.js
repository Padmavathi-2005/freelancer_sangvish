import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for wishlist translation copy...");
  
  const translations = [
    // English (EN)
    { code: 'EN', key: 'wishlist_saved_items', value: 'Saved Items' },
    { code: 'EN', key: 'wishlist_desc', value: 'Keep track of services, projects, and freelancers you want to hire, collaborate with, or bid on in the future.' },
    { code: 'EN', key: 'services_tab', value: 'Services' },
    { code: 'EN', key: 'projects_tab', value: 'Projects' },
    { code: 'EN', key: 'freelancers_tab', value: 'Freelancers' },
    { code: 'EN', key: 'view_gig_btn', value: 'View Gig' },
    { code: 'EN', key: 'no_saved_services', value: 'No Saved Services' },
    { code: 'EN', key: 'no_saved_services_desc', value: 'Browse through our wide variety of expert services and click the heart icon to save them here.' },
    { code: 'EN', key: 'start_exploring_btn', value: 'Start Exploring' },
    { code: 'EN', key: 'no_saved_projects', value: 'No Saved Projects' },
    { code: 'EN', key: 'no_saved_projects_desc', value: 'Browse through our open project briefs and click the heart icon to save them here.' },
    { code: 'EN', key: 'no_saved_freelancers', value: 'No Saved Freelancers' },
    { code: 'EN', key: 'no_saved_freelancers_desc', value: 'Find elite developers or designers and click the heart icon to save them here.' },
    { code: 'EN', key: 'vetted_badge', value: 'Vetted' },

    // Arabic (AR)
    { code: 'AR', key: 'wishlist_saved_items', value: 'العناصر المحفوظة' },
    { code: 'AR', key: 'wishlist_desc', value: 'تتبع الخدمات والمشاريع والمستقلين الذين ترغب في توظيفهم أو التعاون معهم أو تقديم عروض أسعار لهم في المستقبل.' },
    { code: 'AR', key: 'services_tab', value: 'الخدمات' },
    { code: 'AR', key: 'projects_tab', value: 'المشاريع' },
    { code: 'AR', key: 'freelancers_tab', value: 'المستقلين' },
    { code: 'AR', key: 'view_gig_btn', value: 'عرض الخدمة' },
    { code: 'AR', key: 'no_saved_services', value: 'لا توجد خدمات محفوظة' },
    { code: 'AR', key: 'no_saved_services_desc', value: 'تصفح مجموعتنا الواسعة من الخدمات المتخصصة وانقر على أيقونة القلب لحفظها هنا.' },
    { code: 'AR', key: 'start_exploring_btn', value: 'ابدأ الاستكشاف' },
    { code: 'AR', key: 'no_saved_projects', value: 'لا توجد مشاريع محفوظة' },
    { code: 'AR', key: 'no_saved_projects_desc', value: 'تصفح موجزات المشاريع المفتوحة لدينا وانقر على أيقونة القلب لحفظها هنا.' },
    { code: 'AR', key: 'no_saved_freelancers', value: 'لا يوجد مستقلون محفوظون' },
    { code: 'AR', key: 'no_saved_freelancers_desc', value: 'ابحث عن المطورين أو المصممين النخبة وانقر على أيقونة القلب لحفظهم هنا.' },
    { code: 'AR', key: 'vetted_badge', value: 'موثق' },

    // French (FR)
    { code: 'FR', key: 'wishlist_saved_items', value: 'Éléments enregistrés' },
    { code: 'FR', key: 'wishlist_desc', value: 'Gardez une trace des services, des projets et des freelances que vous souhaitez embaucher, avec lesquels vous souhaitez collaborer ou sur lesquels vous souhaitez soumissionner à l\'avenir.' },
    { code: 'FR', key: 'services_tab', value: 'Services' },
    { code: 'FR', key: 'projects_tab', value: 'Projets' },
    { code: 'FR', key: 'freelancers_tab', value: 'Freelances' },
    { code: 'FR', key: 'view_gig_btn', value: 'Voir le service' },
    { code: 'FR', key: 'no_saved_services', value: 'Aucun service enregistré' },
    { code: 'FR', key: 'no_saved_services_desc', value: 'Parcurrez notre large variété de services d\'experts et cliquez sur l\'icône de cœur pour les enregistrer ici.' },
    { code: 'FR', key: 'start_exploring_btn', value: 'Commencer à explorer' },
    { code: 'FR', key: 'no_saved_projects', value: 'Aucun projet enregistré' },
    { code: 'FR', key: 'no_saved_projects_desc', value: 'Parcourez nos briefs de projets ouverts et cliquez sur l\'icône de cœur pour les enregistrer ici.' },
    { code: 'FR', key: 'no_saved_freelancers', value: 'Aucun freelance enregistré' },
    { code: 'FR', key: 'no_saved_freelancers_desc', value: 'Trouvez des développeurs ou des designers d\'élite et cliquez sur l\'icône de cœur pour les enregistrer ici.' },
    { code: 'FR', key: 'vetted_badge', value: 'Vérifié' },

    // German (DE)
    { code: 'DE', key: 'wishlist_saved_items', value: 'Gespeicherte Elemente' },
    { code: 'DE', key: 'wishlist_desc', value: 'Behalten Sie den Überblick über Dienstleistungen, Projekte und Freelancer, die Sie in Zukunft einstellen, mit denen Sie zusammenarbeiten oder auf die Sie bieten möchten.' },
    { code: 'DE', key: 'services_tab', value: 'Services' },
    { code: 'DE', key: 'projects_tab', value: 'Projekte' },
    { code: 'DE', key: 'freelancers_tab', value: 'Freelancer' },
    { code: 'DE', key: 'view_gig_btn', value: 'Gig anzeigen' },
    { code: 'DE', key: 'no_saved_services', value: 'Keine gespeicherten Gigs' },
    { code: 'DE', key: 'no_saved_services_desc', value: 'Durchsuchen Sie unsere große Auswahl an Experten-Gigs und klicken Sie auf das Herz-Symbol, um sie hier zu speichern.' },
    { code: 'DE', key: 'start_exploring_btn', value: 'Erkundung starten' },
    { code: 'DE', key: 'no_saved_projects', value: 'Keine gespeicherten Projekte' },
    { code: 'DE', key: 'no_saved_projects_desc', value: 'Durchsuchen Sie unsere offenen Projektbeschreibungen und klicken Sie auf das Herz-Symbol, um sie hier zu speichern.' },
    { code: 'DE', key: 'no_saved_freelancers', value: 'Keine gespeicherten Freelancer' },
    { code: 'DE', key: 'no_saved_freelancers_desc', value: 'Finden Sie Elite-Entwickler oder -Designer und klicken Sie auf das Herz-Symbol, um sie hier zu speichern.' },
    { code: 'DE', key: 'vetted_badge', value: 'Geprüft' },

    // Spanish (ES)
    { code: 'ES', key: 'wishlist_saved_items', value: 'Artículos guardados' },
    { code: 'ES', key: 'wishlist_desc', value: 'Realice un seguimiento de los servicios, proyectos y freelancers que desea contratar, con los que desea colaborar o por los que desea ofertar en el futuro.' },
    { code: 'ES', key: 'services_tab', value: 'Servicios' },
    { code: 'ES', key: 'projects_tab', value: 'Proyectos' },
    { code: 'ES', key: 'freelancers_tab', value: 'Freelancers' },
    { code: 'ES', key: 'view_gig_btn', value: 'Ver servicio' },
    { code: 'ES', key: 'no_saved_services', value: 'No hay servicios guardados' },
    { code: 'ES', key: 'no_saved_services_desc', value: 'Explore nuestra amplia variedad de servicios de expertos y haga clic en el icono del corazón para guardarlos aquí.' },
    { code: 'ES', key: 'start_exploring_btn', value: 'Comenzar a explorar' },
    { code: 'ES', key: 'no_saved_projects', value: 'No hay proyectos guardados' },
    { code: 'ES', key: 'no_saved_projects_desc', value: 'Explore nuestros resúmenes de proyectos abiertos y haga clic en el icono del corazón para guardarlos aquí.' },
    { code: 'ES', key: 'no_saved_freelancers', value: 'No hay freelancers guardados' },
    { code: 'ES', key: 'no_saved_freelancers_desc', value: 'Encuentre desarrolladores o diseñadores de élite y haga clic en el icono del corazón para guardarlos aquí.' },
    { code: 'ES', key: 'vetted_badge', value: 'Verificado' }
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
    console.log("✅ Seeded/Updated wishlist translation keys successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
