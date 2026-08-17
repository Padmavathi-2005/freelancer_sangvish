import pool from "./db.js";

async function updateChatbotAvatar() {
  try {
    const avatarPath = "/public/chatbot-avatar.png";
    const res = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'site_settings'");
    
    let currentSettings = {};
    if (res.rows.length > 0) {
      let val = res.rows[0].setting_value;
      if (typeof val === "string") {
        try { val = JSON.parse(val); } catch (e) {}
      }
      if (val && typeof val === "object") {
        currentSettings = val;
      }
    }

    currentSettings.site_chatbot_avatar = avatarPath;
    currentSettings.chatbot_avatar = avatarPath;

    if (res.rows.length > 0) {
      await pool.query(
        "UPDATE settings SET setting_value = $1 WHERE setting_key = 'site_settings'",
        [JSON.stringify(currentSettings)]
      );
      console.log("✅ Updated site_settings with new chatbot avatar path:", avatarPath);
    } else {
      await pool.query(
        "INSERT INTO settings (category, setting_key, setting_value) VALUES ('site_settings', 'site_settings', $1)",
        [JSON.stringify(currentSettings)]
      );
      console.log("✅ Inserted site_settings with new chatbot avatar path:", avatarPath);
    }
  } catch (err) {
    console.error("❌ Error updating chatbot avatar setting:", err);
  } finally {
    process.exit(0);
  }
}

updateChatbotAvatar();
