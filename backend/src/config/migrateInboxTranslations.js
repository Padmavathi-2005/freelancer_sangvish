import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for inbox translations copy...");
  
  const translations = [
    // English (EN)
    { code: 'EN', key: 'conversations_sidebar_header', value: 'Conversations' },
    { code: 'EN', key: 'syncing_chats_label', value: 'Syncing chats...' },
    { code: 'EN', key: 'no_active_chats_title', value: 'No active chats' },
    { code: 'EN', key: 'no_active_chats_desc', value: 'Your conversations start automatically when a proposal is accepted!' },
    { code: 'EN', key: 'select_chat_room_title', value: 'Select a Chat Room' },
    { code: 'EN', key: 'select_chat_room_desc', value: 'Select a candidate conversation from the list to view deliverables and discuss project details.' },
    { code: 'EN', key: 'dispute_system_update_msg', value: '⚠️ Dispute System Update' },
    { code: 'EN', key: 'custom_payment_offer_received_msg', value: '📩 Custom Payment Offer Received' },
    { code: 'EN', key: 'no_messages_yet_msg', value: 'No messages yet. Say hello!' },
    { code: 'EN', key: 'custom_payment_offer_label', value: 'Custom Payment Offer' },
    { code: 'EN', key: 'accept_offer_fund_escrow_btn', value: 'Accept Offer & Fund Escrow' },
    { code: 'EN', key: 'sent_waiting_client_approval_label', value: 'Sent & Waiting for Client approval' },
    { code: 'EN', key: 'offer_accepted_order_active_label', value: 'Offer Accepted & Order Active!' },
    { code: 'EN', key: 'platform_notification_header', value: 'Platform Notification' },
    { code: 'EN', key: 'system_notification_header', value: 'System Notification' },
    { code: 'EN', key: 'you_label', value: 'You' },
    { code: 'EN', key: 'user_role_label', value: 'User' },

    // Arabic (AR)
    { code: 'AR', key: 'conversations_sidebar_header', value: 'المحادثات' },
    { code: 'AR', key: 'syncing_chats_label', value: 'مزامنة المحادثات...' },
    { code: 'AR', key: 'no_active_chats_title', value: 'لا توجد محادثات نشطة' },
    { code: 'AR', key: 'no_active_chats_desc', value: 'تبدأ محادثاتك تلقائيًا عند قبول الاقتراح!' },
    { code: 'AR', key: 'select_chat_room_title', value: 'اختر غرفة دردشة' },
    { code: 'AR', key: 'select_chat_room_desc', value: 'اختر محادثة مرشحة من القائمة لعرض المخرجات ومناقشة تفاصيل المشروع.' },
    { code: 'AR', key: 'dispute_system_update_msg', value: '⚠️ تحديث نظام النزاع' },
    { code: 'AR', key: 'custom_payment_offer_received_msg', value: '📩 تم استلام عرض دفع مخصص' },
    { code: 'AR', key: 'no_messages_yet_msg', value: 'لا توجد رسائل بعد. قل مرحبًا!' },
    { code: 'AR', key: 'custom_payment_offer_label', value: 'عرض دفع مخصص' },
    { code: 'AR', key: 'accept_offer_fund_escrow_btn', value: 'قبول العرض وتمويل الضمان' },
    { code: 'AR', key: 'sent_waiting_client_approval_label', value: 'تم الإرسال وبانتظار موافقة العميل' },
    { code: 'AR', key: 'offer_accepted_order_active_label', value: 'تم قبول العرض والطلب نشط!' },
    { code: 'AR', key: 'platform_notification_header', value: 'إشعار المنصة' },
    { code: 'AR', key: 'system_notification_header', value: 'إشعار النظام' },
    { code: 'AR', key: 'you_label', value: 'أنت' },
    { code: 'AR', key: 'user_role_label', value: 'المستخدم' },

    // French (FR)
    { code: 'FR', key: 'conversations_sidebar_header', value: 'Conversations' },
    { code: 'FR', key: 'syncing_chats_label', value: 'Synchronisation des discussions...' },
    { code: 'FR', key: 'no_active_chats_title', value: 'Aucune discussion active' },
    { code: 'FR', key: 'no_active_chats_desc', value: 'Vos conversations commencent automatiquement lorsqu\'une proposition est acceptée !' },
    { code: 'FR', key: 'select_chat_room_title', value: 'Sélectionnez un salon de discussion' },
    { code: 'FR', key: 'select_chat_room_desc', value: 'Sélectionnez une conversation candidate dans la liste pour afficher les livrables et discuter des détails du projet.' },
    { code: 'FR', key: 'dispute_system_update_msg', value: '⚠️ Mise à jour du système de litige' },
    { code: 'FR', key: 'custom_payment_offer_received_msg', value: '📩 Offre de paiement personnalisée reçue' },
    { code: 'FR', key: 'no_messages_yet_msg', value: 'Aucun message pour l\'instant. Dites bonjour !' },
    { code: 'FR', key: 'custom_payment_offer_label', value: 'Offre de paiement personnalisée' },
    { code: 'FR', key: 'accept_offer_fund_escrow_btn', value: 'Accepter l\'offre et financer le dépôt de garantie' },
    { code: 'FR', key: 'sent_waiting_client_approval_label', value: 'Envoyé et en attente de l\'approbation du client' },
    { code: 'FR', key: 'offer_accepted_order_active_label', value: 'Offre acceptée et commande active !' },
    { code: 'FR', key: 'platform_notification_header', value: 'Notification de la plateforme' },
    { code: 'FR', key: 'system_notification_header', value: 'Notification du système' },
    { code: 'FR', key: 'you_label', value: 'Vous' },
    { code: 'FR', key: 'user_role_label', value: 'Utilisateur' },

    // German (DE)
    { code: 'DE', key: 'conversations_sidebar_header', value: 'Unterhaltungen' },
    { code: 'DE', key: 'syncing_chats_label', value: 'Chats werden synchronisiert...' },
    { code: 'DE', key: 'no_active_chats_title', value: 'Keine aktiven Chats' },
    { code: 'DE', key: 'no_active_chats_desc', value: 'Ihre Unterhaltungen beginnen automatisch, wenn ein Vorschlag angenommen wird!' },
    { code: 'DE', key: 'select_chat_room_title', value: 'Wählen Sie einen Chatroom' },
    { code: 'DE', key: 'select_chat_room_desc', value: 'Wählen Sie eine Kandidatenkonversation aus der Liste aus, um Ergebnisse anzuzeigen und Projektdetails zu besprechen.' },
    { code: 'DE', key: 'dispute_system_update_msg', value: '⚠️ Streitbeilegungssystem-Update' },
    { code: 'DE', key: 'custom_payment_offer_received_msg', value: '📩 Benutzerdefiniertes Zahlungsangebot erhalten' },
    { code: 'DE', key: 'no_messages_yet_msg', value: 'Noch keine Nachrichten. Sagen Sie Hallo!' },
    { code: 'DE', key: 'custom_payment_offer_label', value: 'Benutzerdefiniertes Zahlungsangebot' },
    { code: 'DE', key: 'accept_offer_fund_escrow_btn', value: 'Angebot annehmen & Treuhandkonto finanzieren' },
    { code: 'DE', key: 'sent_waiting_client_approval_label', value: 'Gesendet und warten auf Kundengenehmigung' },
    { code: 'DE', key: 'offer_accepted_order_active_label', value: 'Angebot angenommen & Bestellung aktiv!' },
    { code: 'DE', key: 'platform_notification_header', value: 'Plattform-Benachrichtigung' },
    { code: 'DE', key: 'system_notification_header', value: 'System-Benachrichtigung' },
    { code: 'DE', key: 'you_label', value: 'Sie' },
    { code: 'DE', key: 'user_role_label', value: 'Benutzer' },

    // Spanish (ES)
    { code: 'ES', key: 'conversations_sidebar_header', value: 'Conversaciones' },
    { code: 'ES', key: 'syncing_chats_label', value: 'Sincronizando chats...' },
    { code: 'ES', key: 'no_active_chats_title', value: 'No hay chats activos' },
    { code: 'ES', key: 'no_active_chats_desc', value: '¡Sus conversaciones comienzan automáticamente cuando se acepta una propuesta!' },
    { code: 'ES', key: 'select_chat_room_title', value: 'Seleccione una sala de chat' },
    { code: 'ES', key: 'select_chat_room_desc', value: 'Seleccione una conversación de candidato de la lista para ver los entregables y discutir los detalles del proyecto.' },
    { code: 'ES', key: 'dispute_system_update_msg', value: '⚠️ Actualización del sistema de disputas' },
    { code: 'ES', key: 'custom_payment_offer_received_msg', value: '📩 Oferta de pago personalizada recibida' },
    { code: 'ES', key: 'no_messages_yet_msg', value: 'Aún no hay mensajes. ¡Diga hola!' },
    { code: 'ES', key: 'custom_payment_offer_label', value: 'Oferta de pago personalizada' },
    { code: 'ES', key: 'accept_offer_fund_escrow_btn', value: 'Aceptar oferta y financiar garantía' },
    { code: 'ES', key: 'sent_waiting_client_approval_label', value: 'Enviado y esperando la aprobación del cliente' },
    { code: 'ES', key: 'offer_accepted_order_active_label', value: '¡Oferta aceptada y pedido activo!' },
    { code: 'ES', key: 'platform_notification_header', value: 'Notificación de la plataforma' },
    { code: 'ES', key: 'system_notification_header', value: 'Notificación del sistema' },
    { code: 'ES', key: 'you_label', value: 'Tú' },
    { code: 'ES', key: 'user_role_label', value: 'Usuario' }
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
    console.log("✅ Seeded/Updated Inbox translation keys successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
