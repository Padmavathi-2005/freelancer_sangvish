import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for gig applications translation copy...");
  
  const translations = [
    // English (EN)
    { code: 'EN', key: 'service_orders_header', value: 'Service Orders' },
    { code: 'EN', key: 'service_orders_desc', value: 'Review custom project requirements and accept or reject orders sent by clients.' },
    { code: 'EN', key: 'all_orders_tab', value: 'All Orders' },
    { code: 'EN', key: 'pending_filter_label', value: 'Pending' },
    { code: 'EN', key: 'active_filter_label', value: 'Active' },
    { code: 'EN', key: 'completed_filter_label', value: 'Completed' },
    { code: 'EN', key: 'no_all_orders_found', value: 'No orders found' },
    { code: 'EN', key: 'no_pending_orders_found', value: 'No pending orders found' },
    { code: 'EN', key: 'no_active_orders_found', value: 'No active orders found' },
    { code: 'EN', key: 'no_completed_orders_found', value: 'No completed orders found' },
    { code: 'EN', key: 'no_orders_matching_category_desc', value: "You don't have any orders matching this category currently." },

    // Arabic (AR)
    { code: 'AR', key: 'service_orders_header', value: 'طلبات الخدمات' },
    { code: 'AR', key: 'service_orders_desc', value: 'مراجعة متطلبات المشروع المخصصة وقبول أو رفض الطلبات المرسلة من قبل العملاء.' },
    { code: 'AR', key: 'all_orders_tab', value: 'كل الطلبات' },
    { code: 'AR', key: 'pending_filter_label', value: 'قيد الانتظار' },
    { code: 'AR', key: 'active_filter_label', value: 'نشط' },
    { code: 'AR', key: 'completed_filter_label', value: 'مكتمل' },
    { code: 'AR', key: 'no_all_orders_found', value: 'لم يتم العثور على طلبات' },
    { code: 'AR', key: 'no_pending_orders_found', value: 'لم يتم العثور على طلبات معلقة' },
    { code: 'AR', key: 'no_active_orders_found', value: 'لم يتم العثور على طلبات نشطة' },
    { code: 'AR', key: 'no_completed_orders_found', value: 'لم يتم العثور على طلبات مكتملة' },
    { code: 'AR', key: 'no_orders_matching_category_desc', value: 'ليس لديك أي طلبات تطابق هذه الفئة حاليًا.' },

    // French (FR)
    { code: 'FR', key: 'service_orders_header', value: 'Commandes de service' },
    { code: 'FR', key: 'service_orders_desc', value: 'Examinez les exigences de projet personnalisées et acceptez ou rejetez les commandes envoyées par les clients.' },
    { code: 'FR', key: 'all_orders_tab', value: 'Toutes les commandes' },
    { code: 'FR', key: 'pending_filter_label', value: 'En attente' },
    { code: 'FR', key: 'active_filter_label', value: 'Actif' },
    { code: 'FR', key: 'completed_filter_label', value: 'Terminé' },
    { code: 'FR', key: 'no_all_orders_found', value: 'Aucune commande trouvée' },
    { code: 'FR', key: 'no_pending_orders_found', value: 'Aucune commande en attente' },
    { code: 'FR', key: 'no_active_orders_found', value: 'Aucune commande active' },
    { code: 'FR', key: 'no_completed_orders_found', value: 'Aucune commande terminée' },
    { code: 'FR', key: 'no_orders_matching_category_desc', value: "Vous n'avez aucune commande correspondant à cette catégorie actuellement." },

    // German (DE)
    { code: 'DE', key: 'service_orders_header', value: 'Service-Bestellungen' },
    { code: 'DE', key: 'service_orders_desc', value: 'Überprüfen Sie benutzerdefinierte Projektanforderungen und akzeptieren oder lehnen Sie von Kunden gesendete Bestellungen ab.' },
    { code: 'DE', key: 'all_orders_tab', value: 'Alle Bestellungen' },
    { code: 'DE', key: 'pending_filter_label', value: 'Ausstehend' },
    { code: 'DE', key: 'active_filter_label', value: 'Aktiv' },
    { code: 'DE', key: 'completed_filter_label', value: 'Abgeschlossen' },
    { code: 'DE', key: 'no_all_orders_found', value: 'Keine Bestellungen gefunden' },
    { code: 'DE', key: 'no_pending_orders_found', value: 'Keine ausstehenden Bestellungen gefunden' },
    { code: 'DE', key: 'no_active_orders_found', value: 'Keine aktiven Bestellungen gefunden' },
    { code: 'DE', key: 'no_completed_orders_found', value: 'Keine abgeschlossenen Bestellungen gefunden' },
    { code: 'DE', key: 'no_orders_matching_category_desc', value: 'Sie haben derzeit keine Bestellungen, die dieser Kategorie entsprechen.' },

    // Spanish (ES)
    { code: 'ES', key: 'service_orders_header', value: 'Pedidos de servicio' },
    { code: 'ES', key: 'service_orders_desc', value: 'Revise los requisitos del proyecto personalizados y acepte o rechace los pedidos enviados por los clientes.' },
    { code: 'ES', key: 'all_orders_tab', value: 'Todos los pedidos' },
    { code: 'ES', key: 'pending_filter_label', value: 'Pendiente' },
    { code: 'ES', key: 'active_filter_label', value: 'Activo' },
    { code: 'ES', key: 'completed_filter_label', value: 'Completado' },
    { code: 'ES', key: 'no_all_orders_found', value: 'No se encontraron pedidos' },
    { code: 'ES', key: 'no_pending_orders_found', value: 'No se encontraron pedidos pendientes' },
    { code: 'ES', key: 'no_active_orders_found', value: 'No se encontraron pedidos activos' },
    { code: 'ES', key: 'no_completed_orders_found', value: 'No se encontraron pedidos completados' },
    { code: 'ES', key: 'no_orders_matching_category_desc', value: 'No tiene ningún pedido que coincida con esta categoría actualmente.' }
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
    console.log("✅ Seeded/Updated Gig Applications translation keys successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
