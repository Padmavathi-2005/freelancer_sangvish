import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for Gig Applications/Orders translations...");

  const translations = [
    // === ENGLISH (EN) ===
    { code: 'EN', key: 'negotiated_from_label', value: 'Negotiated from' },
    { code: 'EN', key: 'pending_status', value: 'PENDING' },
    { code: 'EN', key: 'status_disputed', value: 'Disputed / Under Mediation' },
    { code: 'EN', key: 'status_completed', value: 'Completed' },
    { code: 'EN', key: 'status_under_review', value: 'Under Review' },
    { code: 'EN', key: 'status_declined', value: 'Declined' },
    { code: 'EN', key: 'status_cancelled', value: 'Cancelled' },
    { code: 'EN', key: 'status_work_started', value: 'Work Started' },
    { code: 'EN', key: 'status_accepted', value: 'Accepted' },
    { code: 'EN', key: 'service_order_id_label', value: 'Service Order ID: #{id}' },
    { code: 'EN', key: 'gig_label', value: 'Gig:' },
    { code: 'EN', key: 'client_label', value: 'Client:' },
    { code: 'EN', key: 'click_card_details_hint', value: 'Click card to view details & track milestones →' },
    { code: 'EN', key: 'decline_order_btn', value: 'Decline Order' },
    { code: 'EN', key: 'accept_order_btn', value: 'Accept Order' },
    { code: 'EN', key: 'accept_decline_order_header', value: 'Accept or Decline this Service Order' },
    { code: 'EN', key: 'accept_decline_order_desc', value: 'Accepting confirms you are available to complete this work. The client will be notified to fund the order.' },
    { code: 'EN', key: 'accept_start_order_btn', value: 'Accept & Start Order' },
    { code: 'EN', key: 'decline_order_confirm', value: 'Are you sure you want to decline this order?' },

    // === ARABIC (AR) ===
    { code: 'AR', key: 'negotiated_from_label', value: 'تم التفاوض عليه من' },
    { code: 'AR', key: 'pending_status', value: 'قيد الانتظار' },
    { code: 'AR', key: 'status_disputed', value: 'متنازع عليه / قيد الوساطة' },
    { code: 'AR', key: 'status_completed', value: 'مكتمل' },
    { code: 'AR', key: 'status_under_review', value: 'تحت المراجعة' },
    { code: 'AR', key: 'status_declined', value: 'مرفوض' },
    { code: 'AR', key: 'status_cancelled', value: 'ملغي' },
    { code: 'AR', key: 'status_work_started', value: 'بدء العمل' },
    { code: 'AR', key: 'status_accepted', value: 'مقبول' },
    { code: 'AR', key: 'service_order_id_label', value: 'معرف طلب الخدمة: #{id}' },
    { code: 'AR', key: 'gig_label', value: 'الخدمة:' },
    { code: 'AR', key: 'client_label', value: 'العميل:' },
    { code: 'AR', key: 'click_card_details_hint', value: '← انقر فوق البطاقة لعرض التفاصيل ومتابعة المراحل' },
    { code: 'AR', key: 'decline_order_btn', value: 'رفض الطلب' },
    { code: 'AR', key: 'accept_order_btn', value: 'قبول الطلب' },
    { code: 'AR', key: 'accept_decline_order_header', value: 'قبول أو رفض طلب الخدمة هذا' },
    { code: 'AR', key: 'accept_decline_order_desc', value: 'القبول يؤكد أنك متاح لإكمال هذا العمل. سيتم إخطار العميل بتمويل الطلب.' },
    { code: 'AR', key: 'accept_start_order_btn', value: 'قبول وبدء الطلب' },
    { code: 'AR', key: 'decline_order_confirm', value: 'هل أنت متأكد من رغبتك في رفض هذا الطلب؟' }
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

  console.log(`✅ Successfully seeded ${insertedCount} Gig Applications & Orders translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
