import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for proposals translation copy...");
  
  const translations = [
    // English (EN)
    { code: 'EN', key: 'my_submitted_proposals_header', value: 'My Submitted Proposals' },
    { code: 'EN', key: 'my_submitted_proposals_desc', value: 'Track and manage the status of your bids on active client projects.' },
    { code: 'EN', key: 'find_projects_btn_label', value: 'Find Projects' },
    { code: 'EN', key: 'total_submitted_metric', value: 'Total Submitted' },
    { code: 'EN', key: 'accepted_offers_metric', value: 'Accepted Offers' },
    { code: 'EN', key: 'pending_review_metric', value: 'Pending Review' },
    { code: 'EN', key: 'declined_metric', value: 'Declined' },
    { code: 'EN', key: 'all_proposals_filter', value: 'All Proposals' },
    { code: 'EN', key: 'pending_review_filter', value: 'Pending Review' },
    { code: 'EN', key: 'accepted_hired_filter', value: 'Accepted & Hired' },
    { code: 'EN', key: 'declined_cancelled_filter', value: 'Declined & Cancelled' },
    { code: 'EN', key: 'search_proposals_placeholder', value: 'Search proposals...' },
    { code: 'EN', key: 'direct_hire_offer', value: 'Direct Hire Offer' },
    { code: 'EN', key: 'offer_invitation_msg', value: 'Offer Invitation Message' },
    { code: 'EN', key: 'cover_letter_label', value: 'Cover Letter' },
    { code: 'EN', key: 'offer_budget_label', value: 'Offer Budget:' },
    { code: 'EN', key: 'delivery_time_label', value: 'Delivery Time:' },
    { code: 'EN', key: 'accept_offer_btn', value: 'Accept Offer' },
    { code: 'EN', key: 'decline_btn', value: 'Decline' },
    { code: 'EN', key: 'view_details_btn', value: 'View Details' },
    { code: 'EN', key: 'proposals_label_pagination', value: 'proposals' },
    { code: 'EN', key: 'awaiting payment', value: 'Awaiting Payment' },

    // Arabic (AR)
    { code: 'AR', key: 'my_submitted_proposals_header', value: 'مقترحاتي المقدمة' },
    { code: 'AR', key: 'my_submitted_proposals_desc', value: 'تتبع وإدارة حالة عروض الأسعار الخاصة بك في مشاريع العملاء النشطة.' },
    { code: 'AR', key: 'find_projects_btn_label', value: 'البحث عن مشاريع' },
    { code: 'AR', key: 'total_submitted_metric', value: 'إجمالي المقدمة' },
    { code: 'AR', key: 'accepted_offers_metric', value: 'العروض المقبولة' },
    { code: 'AR', key: 'pending_review_metric', value: 'قيد المراجعة' },
    { code: 'AR', key: 'declined_metric', value: 'مرفوض' },
    { code: 'AR', key: 'all_proposals_filter', value: 'كل المقترحات' },
    { code: 'AR', key: 'pending_review_filter', value: 'قيد المراجعة' },
    { code: 'AR', key: 'accepted_hired_filter', value: 'مقبول وموظف' },
    { code: 'AR', key: 'declined_cancelled_filter', value: 'مرفوض وملغي' },
    { code: 'AR', key: 'search_proposals_placeholder', value: 'البحث عن المقترحات...' },
    { code: 'AR', key: 'direct_hire_offer', value: 'عرض توظيف مباشر' },
    { code: 'AR', key: 'offer_invitation_msg', value: 'رسالة دعوة العرض' },
    { code: 'AR', key: 'cover_letter_label', value: 'رسالة التغطية' },
    { code: 'AR', key: 'offer_budget_label', value: 'ميزانية العرض:' },
    { code: 'AR', key: 'delivery_time_label', value: 'وقت التسليم:' },
    { code: 'AR', key: 'accept_offer_btn', value: 'قبول العرض' },
    { code: 'AR', key: 'decline_btn', value: 'رفض' },
    { code: 'AR', key: 'view_details_btn', value: 'عرض التفاصيل' },
    { code: 'AR', key: 'proposals_label_pagination', value: 'مقترحات' },
    { code: 'AR', key: 'awaiting payment', value: 'في انتظار الدفع' },

    // French (FR)
    { code: 'FR', key: 'my_submitted_proposals_header', value: 'Mes propositions soumises' },
    { code: 'FR', key: 'my_submitted_proposals_desc', value: 'Suivez et gérez le statut de vos offres sur les projets clients actifs.' },
    { code: 'FR', key: 'find_projects_btn_label', value: 'Trouver des projets' },
    { code: 'FR', key: 'total_submitted_metric', value: 'Total soumis' },
    { code: 'FR', key: 'accepted_offers_metric', value: 'Offres acceptées' },
    { code: 'FR', key: 'pending_review_metric', value: 'En attente de révision' },
    { code: 'FR', key: 'declined_metric', value: 'Refusé' },
    { code: 'FR', key: 'all_proposals_filter', value: 'Toutes les propositions' },
    { code: 'FR', key: 'pending_review_filter', value: 'En attente de révision' },
    { code: 'FR', key: 'accepted_hired_filter', value: 'Accepté et embauché' },
    { code: 'FR', key: 'declined_cancelled_filter', value: 'Refusé et annulé' },
    { code: 'FR', key: 'search_proposals_placeholder', value: 'Rechercher des propositions...' },
    { code: 'FR', key: 'direct_hire_offer', value: 'Offre d\'embauche directe' },
    { code: 'FR', key: 'offer_invitation_msg', value: 'Message d\'invitation à l\'offre' },
    { code: 'FR', key: 'cover_letter_label', value: 'Lettre de motivation' },
    { code: 'FR', key: 'offer_budget_label', value: 'Budget de l\'offre :' },
    { code: 'FR', key: 'delivery_time_label', value: 'Délai de livraison :' },
    { code: 'FR', key: 'accept_offer_btn', value: 'Accepter l\'offre' },
    { code: 'FR', key: 'decline_btn', value: 'Décliner' },
    { code: 'FR', key: 'view_details_btn', value: 'Voir les détails' },
    { code: 'FR', key: 'proposals_label_pagination', value: 'propositions' },
    { code: 'FR', key: 'awaiting payment', value: 'En attente de paiement' },

    // German (DE)
    { code: 'DE', key: 'my_submitted_proposals_header', value: 'Meine eingereichten Vorschläge' },
    { code: 'DE', key: 'my_submitted_proposals_desc', value: 'Verfolgen und verwalten Sie den Status Ihrer Gebote für aktive Kundenprojekte.' },
    { code: 'DE', key: 'find_projects_btn_label', value: 'Projekte finden' },
    { code: 'DE', key: 'total_submitted_metric', value: 'Insgesamt eingereicht' },
    { code: 'DE', key: 'accepted_offers_metric', value: 'Angenommene Angebote' },
    { code: 'DE', key: 'pending_review_metric', value: 'Unter Überprüfung' },
    { code: 'DE', key: 'declined_metric', value: 'Abgelehnt' },
    { code: 'DE', key: 'all_proposals_filter', value: 'Alle Vorschläge' },
    { code: 'DE', key: 'pending_review_filter', value: 'Unter Überprüfung' },
    { code: 'DE', key: 'accepted_hired_filter', value: 'Akzeptiert & Eingestellt' },
    { code: 'DE', key: 'declined_cancelled_filter', value: 'Abgelehnt & Storniert' },
    { code: 'DE', key: 'search_proposals_placeholder', value: 'Vorschläge suchen...' },
    { code: 'DE', key: 'direct_hire_offer', value: 'Direktes Einstellungsangebot' },
    { code: 'DE', key: 'offer_invitation_msg', value: 'Angebots-Einladungsnachricht' },
    { code: 'DE', key: 'cover_letter_label', value: 'Anschreiben' },
    { code: 'DE', key: 'offer_budget_label', value: 'Angebotsbudget:' },
    { code: 'DE', key: 'delivery_time_label', value: 'Lieferzeit:' },
    { code: 'DE', key: 'accept_offer_btn', value: 'Angebot annehmen' },
    { code: 'DE', key: 'decline_btn', value: 'Ablehnen' },
    { code: 'DE', key: 'view_details_btn', value: 'Details anzeigen' },
    { code: 'DE', key: 'proposals_label_pagination', value: 'Vorschläge' },
    { code: 'DE', key: 'awaiting payment', value: 'Warten auf Zahlung' },

    // Spanish (ES)
    { code: 'ES', key: 'my_submitted_proposals_header', value: 'Mis propuestas enviadas' },
    { code: 'ES', key: 'my_submitted_proposals_desc', value: 'Realice un seguimiento y gestione el estado de sus ofertas en proyectos de clientes activos.' },
    { code: 'ES', key: 'find_projects_btn_label', value: 'Buscar proyectos' },
    { code: 'ES', key: 'total_submitted_metric', value: 'Total enviado' },
    { code: 'ES', key: 'accepted_offers_metric', value: 'Ofertas aceptadas' },
    { code: 'ES', key: 'pending_review_metric', value: 'En revisión' },
    { code: 'ES', key: 'declined_metric', value: 'Rechazado' },
    { code: 'ES', key: 'all_proposals_filter', value: 'Todas las propuestas' },
    { code: 'ES', key: 'pending_review_filter', value: 'En revisión' },
    { code: 'ES', key: 'accepted_hired_filter', value: 'Aceptado y contratado' },
    { code: 'ES', key: 'declined_cancelled_filter', value: 'Rechazado y cancelado' },
    { code: 'ES', key: 'search_proposals_placeholder', value: 'Buscar propuestas...' },
    { code: 'ES', key: 'direct_hire_offer', value: 'Oferta de contratación directa' },
    { code: 'ES', key: 'offer_invitation_msg', value: 'Mensaje de invitación a la oferta' },
    { code: 'ES', key: 'cover_letter_label', value: 'Carta de presentación' },
    { code: 'ES', key: 'offer_budget_label', value: 'Presupuesto de la oferta:' },
    { code: 'ES', key: 'delivery_time_label', value: 'Plazo de entrega:' },
    { code: 'ES', key: 'accept_offer_btn', value: 'Aceptar oferta' },
    { code: 'ES', key: 'decline_btn', value: 'Rechazar' },
    { code: 'ES', key: 'view_details_btn', value: 'Ver detalles' },
    { code: 'ES', key: 'proposals_label_pagination', value: 'propuestas' },
    { code: 'ES', key: 'awaiting payment', value: 'Esperando pago' }
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
    console.log("✅ Seeded/Updated Proposals translation keys successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
