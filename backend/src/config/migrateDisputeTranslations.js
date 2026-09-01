import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for Dispute Reasons translations...");

  const translations = [
    // English (EN)
    { code: 'EN', key: 'admin_dispute_reasons_title', value: 'Dispute Reasons Settings' },
    { code: 'EN', key: 'admin_dispute_reasons_desc', value: 'Configure different dispute reason options displayed when clients file cases vs. when freelancers file cases.' },
    { code: 'EN', key: 'admin_dispute_for_clients', value: 'For Clients (Buyers)' },
    { code: 'EN', key: 'admin_dispute_escrow_refund', value: 'Escrow Refund Disputes' },
    { code: 'EN', key: 'admin_dispute_client_placeholder', value: 'e.g. Deliverable was not matching requirements' },
    { code: 'EN', key: 'admin_dispute_no_reasons', value: 'No reasons configured.' },
    { code: 'EN', key: 'admin_dispute_saving_client', value: 'Saving client settings...' },
    { code: 'EN', key: 'admin_dispute_save_client', value: 'Save Client dispute reasons' },
    { code: 'EN', key: 'admin_dispute_for_freelancers', value: 'For Freelancers (Sellers)' },
    { code: 'EN', key: 'admin_dispute_escrow_payout', value: 'Escrow Payout Disputes' },
    { code: 'EN', key: 'admin_dispute_freelancer_placeholder', value: 'e.g. Client is unresponsive to deliverable approvals' },
    { code: 'EN', key: 'admin_dispute_saving_freelancer', value: 'Saving freelancer settings...' },
    { code: 'EN', key: 'admin_dispute_save_freelancer', value: 'Save Freelancer dispute reasons' },
    { code: 'EN', key: 'admin_dispute_already_exists_client', value: 'This dispute reason already exists for clients.' },
    { code: 'EN', key: 'admin_dispute_already_exists_freelancer', value: 'This dispute reason already exists for freelancers.' },
    { code: 'EN', key: 'admin_dispute_at_least_one_client', value: 'You must have at least one client dispute reason configured.' },
    { code: 'EN', key: 'admin_dispute_at_least_one_freelancer', value: 'You must have at least one freelancer dispute reason configured.' },
    { code: 'EN', key: 'admin_dispute_save_success_client', value: 'Client dispute reasons updated successfully.' },
    { code: 'EN', key: 'admin_dispute_save_error_client', value: 'Failed to save client dispute reasons.' },
    { code: 'EN', key: 'admin_dispute_save_success_freelancer', value: 'Freelancer dispute reasons updated successfully.' },
    { code: 'EN', key: 'admin_dispute_save_error_freelancer', value: 'Failed to save freelancer dispute reasons.' },

    // English Dynamic Dispute Reasons
    { code: 'EN', key: 'dispute_reason_client_is_unresponsive', value: 'Client is unresponsive' },
    { code: 'EN', key: 'dispute_reason_client_refuses_to_release_milestone_payment', value: 'Client refuses to release milestone payment' },
    { code: 'EN', key: 'dispute_reason_client_is_requesting_out_of_scope_work', value: 'Client is requesting out-of-scope work' },
    { code: 'EN', key: 'dispute_reason_milestone_requirements_met_but_not_approved', value: 'Milestone requirements met but not approved' },
    { code: 'EN', key: 'dispute_reason_other', value: 'Other' },
    { code: 'EN', key: 'dispute_reason_work_not_delivered', value: 'Work not delivered' },
    { code: 'EN', key: 'dispute_reason_work_quality_is_poor', value: 'Work quality is poor' },
    { code: 'EN', key: 'dispute_reason_requirements_not_followed', value: 'Requirements not followed' },
    { code: 'EN', key: 'dispute_reason_freelancer_is_unresponsive', value: 'Freelancer is unresponsive' },
    { code: 'EN', key: 'dispute_reason_delivery_is_incomplete', value: 'Delivery is incomplete' },

    // Arabic (AR)
    { code: 'AR', key: 'admin_dispute_reasons_title', value: 'إعدادات أسباب النزاع' },
    { code: 'AR', key: 'admin_dispute_reasons_desc', value: 'تكوين خيارات مختلفة لأسباب النزاع المعروضة عند رفع العملاء للقضايا مقابل رفع المستقلين لها.' },
    { code: 'AR', key: 'admin_dispute_for_clients', value: 'للعملاء (المشترين)' },
    { code: 'AR', key: 'admin_dispute_escrow_refund', value: 'نزاعات استرداد أموال الضمان' },
    { code: 'AR', key: 'admin_dispute_client_placeholder', value: 'مثال: التسليم لم يكن مطابقاً للمتطلبات' },
    { code: 'AR', key: 'admin_dispute_no_reasons', value: 'لم يتم تكوين أي أسباب.' },
    { code: 'AR', key: 'admin_dispute_saving_client', value: 'جاري حفظ إعدادات العميل...' },
    { code: 'AR', key: 'admin_dispute_save_client', value: 'حفظ أسباب نزاع العميل' },
    { code: 'AR', key: 'admin_dispute_for_freelancers', value: 'للمستقلين (البائعين)' },
    { code: 'AR', key: 'admin_dispute_escrow_payout', value: 'نزاعات صرف أموال الضمان' },
    { code: 'AR', key: 'admin_dispute_freelancer_placeholder', value: 'مثال: العميل لا يستجيب للموافقات على التسليمات' },
    { code: 'AR', key: 'admin_dispute_saving_freelancer', value: 'جاري حفظ إعدادات المستقل...' },
    { code: 'AR', key: 'admin_dispute_save_freelancer', value: 'حفظ أسباب نزاع المستقل' },
    { code: 'AR', key: 'admin_dispute_already_exists_client', value: 'سبب النزاع هذا موجود بالفعل للعملاء.' },
    { code: 'AR', key: 'admin_dispute_already_exists_freelancer', value: 'سبب النزاع هذا موجود بالفعل للمستقلين.' },
    { code: 'AR', key: 'admin_dispute_at_least_one_client', value: 'يجب تكوين سبب نزاع عميل واحد على الأقل.' },
    { code: 'AR', key: 'admin_dispute_at_least_one_freelancer', value: 'يجب تكوين سبب نزاع مستقل واحد على الأقل.' },
    { code: 'AR', key: 'admin_dispute_save_success_client', value: 'تم تحديث أسباب نزاع العميل بنجاح.' },
    { code: 'AR', key: 'admin_dispute_save_error_client', value: 'فشل حفظ أسباب نزاع العميل.' },
    { code: 'AR', key: 'admin_dispute_save_success_freelancer', value: 'تم تحديث أسباب نزاع المستقل بنجاح.' },
    { code: 'AR', key: 'admin_dispute_save_error_freelancer', value: 'فشل حفظ أسباب نزاع المستقل.' },

    // Arabic Dynamic Dispute Reasons
    { code: 'AR', key: 'dispute_reason_client_is_unresponsive', value: 'العميل لا يستجيب' },
    { code: 'AR', key: 'dispute_reason_client_refuses_to_release_milestone_payment', value: 'العميل يرفض تحرير دفعة المرحلة' },
    { code: 'AR', key: 'dispute_reason_client_is_requesting_out_of_scope_work', value: 'العميل يطلب عملاً خارج نطاق المشروع' },
    { code: 'AR', key: 'dispute_reason_milestone_requirements_met_but_not_approved', value: 'تم تلبية متطلبات المرحلة ولكن لم تتم الموافقة عليها' },
    { code: 'AR', key: 'dispute_reason_other', value: 'غير ذلك' },
    { code: 'AR', key: 'dispute_reason_work_not_delivered', value: 'لم يتم تسليم العمل' },
    { code: 'AR', key: 'dispute_reason_work_quality_is_poor', value: 'جودة العمل رديئة' },
    { code: 'AR', key: 'dispute_reason_requirements_not_followed', value: 'لم يتم اتباع المتطلبات' },
    { code: 'AR', key: 'dispute_reason_freelancer_is_unresponsive', value: 'المستقل لا يستجيب' },
    { code: 'AR', key: 'dispute_reason_delivery_is_incomplete', value: 'التسليم غير مكتمل' }
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

  console.log(`✅ Successfully seeded ${insertedCount} Dispute Reasons translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
