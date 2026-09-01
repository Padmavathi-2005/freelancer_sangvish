import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for API Integrations tab translations...");

  const translations = [
    // English (EN)
    { code: 'EN', key: 'admin_api_gemini_title', value: 'Gemini API Integration' },
    { code: 'EN', key: 'admin_api_gemini_desc', value: 'Power AI-based features like talent matching, summaries, and smart search using Google Gemini.' },
    { code: 'EN', key: 'admin_api_enabled', value: 'Enabled' },
    { code: 'EN', key: 'admin_api_disabled', value: 'Disabled' },
    { code: 'EN', key: 'admin_api_saving', value: 'Saving…' },
    { code: 'EN', key: 'admin_api_save_gemini', value: 'Save Gemini' },
    { code: 'EN', key: 'admin_api_gemini_key', value: 'Gemini API Key' },
    { code: 'EN', key: 'admin_api_gemini_key_hint', value: 'Obtain from Google AI Studio → API Keys. Keep this secret.' },
    { code: 'EN', key: 'admin_api_model', value: 'Model' },
    { code: 'EN', key: 'admin_api_model_hint', value: 'Choose the model based on speed vs. capability needs.' },
    { code: 'EN', key: 'admin_api_get_gemini_key', value: 'How to get your Gemini API Key' },
    { code: 'EN', key: 'admin_api_visit', value: 'Visit' },
    { code: 'EN', key: 'admin_api_gemini_instructions', value: '→ Sign in with Google → Click "Create API Key" → Copy and paste above.' },
    
    { code: 'EN', key: 'admin_api_twilio_title', value: 'Twilio SMS Integration' },
    { code: 'EN', key: 'admin_api_twilio_desc', value: 'Send OTP, verification, and notification SMS to users worldwide via Twilio.' },
    { code: 'EN', key: 'admin_api_save_twilio', value: 'Save Twilio' },
    { code: 'EN', key: 'admin_api_twilio_sid', value: 'Account SID' },
    { code: 'EN', key: 'admin_api_twilio_sid_hint', value: 'Found on your Twilio Console Dashboard.' },
    { code: 'EN', key: 'admin_api_twilio_token', value: 'Auth Token' },
    { code: 'EN', key: 'admin_api_twilio_token_hint', value: 'Secret auth token — never share this publicly.' },
    { code: 'EN', key: 'admin_api_twilio_from', value: 'From Phone Number' },
    { code: 'EN', key: 'admin_api_twilio_from_hint', value: 'Include country code. e.g. +14155552671' },
    { code: 'EN', key: 'admin_api_twilio_msg_sid', value: 'Messaging Service SID (Optional)' },
    { code: 'EN', key: 'admin_api_twilio_msg_sid_hint', value: 'Use a Messaging Service instead of a phone number for better deliverability.' },
    { code: 'EN', key: 'admin_api_get_twilio', value: 'How to get Twilio credentials' },
    { code: 'EN', key: 'admin_api_twilio_instructions', value: '→ Log in → Your Account SID and Auth Token appear on the Dashboard homepage. Buy a phone number under Phone Numbers → Manage → Buy a number.' },

    { code: 'EN', key: 'admin_api_gemini_saved_title', value: 'Gemini API Saved' },
    { code: 'EN', key: 'admin_api_gemini_saved_desc', value: 'Gemini API configuration updated successfully.' },
    { code: 'EN', key: 'admin_api_save_failed_title', value: 'Save Failed' },
    { code: 'EN', key: 'admin_api_gemini_failed_desc', value: 'Could not save Gemini API settings. Try again.' },
    { code: 'EN', key: 'admin_api_twilio_saved_title', value: 'Twilio Saved' },
    { code: 'EN', key: 'admin_api_twilio_saved_desc', value: 'Twilio SMS configuration updated successfully.' },
    { code: 'EN', key: 'admin_api_twilio_failed_desc', value: 'Could not save Twilio settings. Try again.' },

    // Arabic (AR)
    { code: 'AR', key: 'admin_api_gemini_title', value: 'تكامل واجهة برمجة تطبيقات Gemini' },
    { code: 'AR', key: 'admin_api_gemini_desc', value: 'تشغيل الميزات المعتمدة على الذكاء الاصطناعي مثل مطابقة المواهب والملخصات والبحث الذكي باستخدام Google Gemini.' },
    { code: 'AR', key: 'admin_api_enabled', value: 'مفعّل' },
    { code: 'AR', key: 'admin_api_disabled', value: 'معطّل' },
    { code: 'AR', key: 'admin_api_saving', value: 'جاري الحفظ…' },
    { code: 'AR', key: 'admin_api_save_gemini', value: 'حفظ إعدادات Gemini' },
    { code: 'AR', key: 'admin_api_gemini_key', value: 'مفتاح واجهة برمجة تطبيقات Gemini' },
    { code: 'AR', key: 'admin_api_gemini_key_hint', value: 'احصل عليه من Google AI Studio ← مفاتيح واجهة برمجة التطبيقات. حافظ على سرية هذا المفتاح.' },
    { code: 'AR', key: 'admin_api_model', value: 'النموذج' },
    { code: 'AR', key: 'admin_api_model_hint', value: 'اختر النموذج بناءً على السرعة مقابل احتياجات القدرة الكفاءية.' },
    { code: 'AR', key: 'admin_api_get_gemini_key', value: 'كيفية الحصول على مفتاح واجهة برمجة تطبيقات Gemini الخاص بك' },
    { code: 'AR', key: 'admin_api_visit', value: 'قم بزيارة' },
    { code: 'AR', key: 'admin_api_gemini_instructions', value: '← تسجيل الدخول باستخدام Google ← انقر فوق "إنشاء مفتاح واجهة برمجة التطبيقات" ← انسخه والصقه أعلاه.' },

    { code: 'AR', key: 'admin_api_twilio_title', value: 'تكامل خدمة Twilio للرسائل النصية' },
    { code: 'AR', key: 'admin_api_twilio_desc', value: 'إرسال رموز التحقق لمرة واحدة OTP ورسائل التحقق والإشعارات النصية للمستخدمين في جميع أنحاء العالم عبر Twilio.' },
    { code: 'AR', key: 'admin_api_save_twilio', value: 'حفظ إعدادات Twilio' },
    { code: 'AR', key: 'admin_api_twilio_sid', value: 'معرف الحساب (Account SID)' },
    { code: 'AR', key: 'admin_api_twilio_sid_hint', value: 'يمكن العثور عليه في لوحة تحم Twilio Console الخاصة بك.' },
    { code: 'AR', key: 'admin_api_twilio_token', value: 'رمز المصادقة (Auth Token)' },
    { code: 'AR', key: 'admin_api_twilio_token_hint', value: 'رمز مصادقة سري — لا تشاركه علناً أبداً.' },
    { code: 'AR', key: 'admin_api_twilio_from', value: 'من رقم الهاتف' },
    { code: 'AR', key: 'admin_api_twilio_from_hint', value: 'تضمين رمز البلد. مثال: +14155552671' },
    { code: 'AR', key: 'admin_api_twilio_msg_sid', value: 'معرف خدمة الرسائل (اختياري)' },
    { code: 'AR', key: 'admin_api_twilio_msg_sid_hint', value: 'استخدم خدمة الرسائل بدلاً من رقم هاتف واحد لضمان تسليم أفضل ورسائل موثوقة.' },
    { code: 'AR', key: 'admin_api_get_twilio', value: 'كيفية الحصول على بيانات اعتماد Twilio' },
    { code: 'AR', key: 'admin_api_twilio_instructions', value: '← تسجيل الدخول ← يظهر معرف الحساب (Account SID) ورمز المصادقة (Auth Token) على الصفحة الرئيسية للوحة التحكم. اشترِ رقم هاتف ضمن أرقام الهواتف ← إدارة ← شراء رقم.' },

    { code: 'AR', key: 'admin_api_gemini_saved_title', value: 'تم حفظ إعدادات Gemini' },
    { code: 'AR', key: 'admin_api_gemini_saved_desc', value: 'تم تحديث تكوين واجهة برمجة تطبيقات Gemini بنجاح.' },
    { code: 'AR', key: 'admin_api_save_failed_title', value: 'فشل الحفظ' },
    { code: 'AR', key: 'admin_api_gemini_failed_desc', value: 'تعذر حفظ إعدادات واجهة برمجة تطبيقات Gemini. أعد المحاولة.' },
    { code: 'AR', key: 'admin_api_twilio_saved_title', value: 'تم حفظ إعدادات Twilio' },
    { code: 'AR', key: 'admin_api_twilio_saved_desc', value: 'تم تحديث تكوين رسائل Twilio بنجاح.' },
    { code: 'AR', key: 'admin_api_twilio_failed_desc', value: 'تعذر حفظ إعدادات Twilio. أعد المحاولة.' }
  ];

  let insertedCount = 0;
  for (const item of translations) {
    await pool.query(
      `INSERT INTO translations (language_code, key, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (language_code, key)
       DO UPDATE SET value = EXCLUDED.value`,
      [item.code, item.key, item.value]
    );
    insertedCount++;
  }

  console.log(`✅ Successfully seeded ${insertedCount} API Integrations translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
