import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for Notifications translations...");

  const translations = [
    // === ENGLISH (EN) ===
    { code: 'EN', key: 'recent_notifications_header', value: 'Recent Notifications' },
    { code: 'EN', key: 'mark_all_as_read_btn', value: 'Mark all as read' },
    { code: 'EN', key: 'no_notifications_msg', value: 'No notifications yet' },
    { code: 'EN', key: 'no_notifications_desc', value: 'Updates on projects, orders and inbox will appear here.' },
    { code: 'EN', key: 'view_all_notifications_btn', value: 'View all notifications' },
    { code: 'EN', key: 'sign_up_bonus_pending_admin_approval', value: 'Sign-up Bonus Pending Admin Approval' },
    { code: 'EN', key: 'onboarding_approved', value: 'Onboarding Approved' },
    { code: 'EN', key: 'your_200_sign_up_bonus_has_been_requested_upon_profile_setup_completion_and_is_currently_pending_admin_review', value: 'Your $2.00 Sign-up Bonus has been requested upon profile setup completion and is currently pending admin review.' },
    { code: 'EN', key: 'congratulations_your_contractor_profile_has_been_approved_by_admin_you_now_have_full_dashboard_access', value: 'Congratulations! Your contractor profile has been approved by admin. You now have full dashboard access.' },

    // === ARABIC (AR) ===
    { code: 'AR', key: 'recent_notifications_header', value: 'الإشعارات الأخيرة' },
    { code: 'AR', key: 'mark_all_as_read_btn', value: 'تحديد الكل كمقروء' },
    { code: 'AR', key: 'no_notifications_msg', value: 'لا توجد إشعارات بعد' },
    { code: 'AR', key: 'no_notifications_desc', value: 'ستظهر هنا التحديثات الخاصة بالمشاريع والطلبات والبريد الوارد.' },
    { code: 'AR', key: 'view_all_notifications_btn', value: 'عرض جميع الإشعارات' },
    { code: 'AR', key: 'sign_up_bonus_pending_admin_approval', value: 'مكافأة التسجيل في انتظار موافقة المسؤول' },
    { code: 'AR', key: 'onboarding_approved', value: 'تمت الموافقة على تهيئة الحساب' },
    { code: 'AR', key: 'your_200_sign_up_bonus_has_been_requested_upon_profile_setup_completion_and_is_currently_pending_admin_review', value: 'تم طلب مكافأة التسجيل بقيمة 2.00 دولار عند إكمال إعداد الملف الشخصي وهي قيد مراجعة المسؤول حالياً.' },
    { code: 'AR', key: 'congratulations_your_contractor_profile_has_been_approved_by_admin_you_now_have_full_dashboard_access', value: 'تهانينا! تمت الموافقة على ملفك الشخصي كمقاول من قبل المسؤول. لديك الآن وصول كامل إلى لوحة التحكم.' }
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

  console.log(`✅ Successfully seeded ${insertedCount} Notifications translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
