import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for project group and inbox translations...");
  
  const translations = [
    // English (EN)
    { code: 'EN', key: 'project_group_prefix', value: 'Project Group' },
    { code: 'EN', key: 'project_group_chat', value: 'Project Group Chat' },
    { code: 'EN', key: 'conversations_sidebar_header', value: 'Conversations' },
    { code: 'EN', key: 'select_chat_room_title', value: 'Select a Chat Room' },
    { code: 'EN', key: 'select_chat_room_desc', value: 'Select a candidate conversation from the list to view deliverables and discuss project details.' },
    { code: 'EN', key: 'you_label', value: 'You' },

    // Arabic (AR)
    { code: 'AR', key: 'project_group_prefix', value: 'مجموعة المشروع' },
    { code: 'AR', key: 'project_group_chat', value: 'دردشة مجموعة المشروع' },
    { code: 'AR', key: 'conversations_sidebar_header', value: 'المحادثات' },
    { code: 'AR', key: 'select_chat_room_title', value: 'اختر غرفة دردشة' },
    { code: 'AR', key: 'select_chat_room_desc', value: 'اختر محادثة مرشحة من القائمة لعرض المخرجات ومناقشة تفاصيل المشروع.' },
    { code: 'AR', key: 'you_label', value: 'أنت' },

    // French (FR)
    { code: 'FR', key: 'project_group_prefix', value: 'Groupe de projet' },
    { code: 'FR', key: 'project_group_chat', value: 'Chat du groupe de projet' },
    { code: 'FR', key: 'conversations_sidebar_header', value: 'Conversations' },
    { code: 'FR', key: 'select_chat_room_title', value: 'Sélectionnez un salon de discussion' },
    { code: 'FR', key: 'select_chat_room_desc', value: 'Sélectionnez une conversation candidate dans la liste pour afficher les livrables et discuter des détails du projet.' },
    { code: 'FR', key: 'you_label', value: 'Vous' },

    // German (DE)
    { code: 'DE', key: 'project_group_prefix', value: 'Projektgruppe' },
    { code: 'DE', key: 'project_group_chat', value: 'Projektgruppen-Chat' },
    { code: 'DE', key: 'conversations_sidebar_header', value: 'Unterhaltungen' },
    { code: 'DE', key: 'select_chat_room_title', value: 'Wählen Sie einen Chatroom' },
    { code: 'DE', key: 'select_chat_room_desc', value: 'Wählen Sie eine Kandidatenkonversation aus der Liste aus, um Ergebnisse anzuzeigen und Projektdetails zu besprechen.' },
    { code: 'DE', key: 'you_label', value: 'Sie' },

    // Spanish (ES)
    { code: 'ES', key: 'project_group_prefix', value: 'Grupo de proyecto' },
    { code: 'ES', key: 'project_group_chat', value: 'Chat del grupo de proyecto' },
    { code: 'ES', key: 'conversations_sidebar_header', value: 'Conversaciones' },
    { code: 'ES', key: 'select_chat_room_title', value: 'Seleccione una sala de chat' },
    { code: 'ES', key: 'select_chat_room_desc', value: 'Seleccione una conversación de candidato de la lista para ver los entregables y discutir los detalles del proyecto.' },
    { code: 'ES', key: 'you_label', value: 'Tú' }
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
    console.log("✅ Seeded/Updated Project Group & Inbox translation keys successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
