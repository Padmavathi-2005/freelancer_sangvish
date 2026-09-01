import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for User Dashboard translations...");

  const translations = [
    // English (EN)
    { code: 'EN', key: 'verification_pending', value: 'Verification Pending' },
    { code: 'EN', key: 'verification_pending_desc', value: 'Your profile is currently under review by our administration team. You will be granted full access once your credentials have been approved.' },
    { code: 'EN', key: 'workspace_hub_locked', value: 'Workspace Hub Locked' },
    { code: 'EN', key: 'client_profile_locked_desc', value: 'You must complete your client profile to unlock active project milestones, cost calculators, messaging threads, and contractor stats.' },
    { code: 'EN', key: 'freelancer_profile_locked_desc', value: 'You must complete your freelancer profile to unlock active milestones, bidding simulators, messaging threads, and contract stats.' },
    { code: 'EN', key: 'complete_profile_wizard', value: 'Complete Profile Wizard' },
    { code: 'EN', key: 'project_milestone_escrow', value: 'Project Milestone & Escrow' },
    { code: 'EN', key: 'back_to_dashboard', value: 'Back to Dashboard' },
    { code: 'EN', key: 'gig_order_tracker', value: 'Gig Order Tracker' },
    { code: 'EN', key: 'awaiting_acceptance_toast', value: 'Awaiting Freelancer Acceptance' },
    { code: 'EN', key: 'awaiting_acceptance_toast_desc', value: 'Your order is waiting for freelancer approval. Payment options will unlock once the freelancer accepts your order application. No charges have been made yet.' },
    { code: 'EN', key: 'milestone_status_updated', value: 'Gig milestone status updated!' },
    { code: 'EN', key: 'submitted_deliverables', value: 'Submitted Deliverables' },
    { code: 'EN', key: 'view_deliverable', value: 'View Deliverable' },
    { code: 'EN', key: 'frozen_disputed', value: '🔒 Frozen - Under Dispute' },
    { code: 'EN', key: 'awaiting_acceptance_title', value: 'Awaiting Freelancer Acceptance - Click for info' },
    { code: 'EN', key: 'pay_milestone_title', value: 'Pay milestone' },
    { code: 'EN', key: 'under_review_status', value: '⏳ Under Review' },
    { code: 'EN', key: 'submit_work_btn', value: 'Submit Work' },
    { code: 'EN', key: 'approve_pay_btn', value: 'Approve & Pay' },
    { code: 'EN', key: 'request_revision_btn', value: 'Request Revision' },
    { code: 'EN', key: 'awaiting_work_status', value: '⏳ Awaiting Work' },
    { code: 'EN', key: 'describe_revision_requirements', value: 'Describe Revision Requirements *' },
    { code: 'EN', key: 'revision_requirements_placeholder', value: 'e.g. Please update the wireframe styling and align colors with branding...' },
    { code: 'EN', key: 'submit_request_btn', value: 'Submit Request' },
    { code: 'EN', key: 'submit_milestone_deliverables', value: 'Submit Milestone Deliverables' },
    { code: 'EN', key: 'milestone_details', value: 'Milestone details' },
    { code: 'EN', key: 'milestone_deliverable', value: 'Milestone Deliverable' },
    { code: 'EN', key: 'upload_files_deliverables', value: 'Upload Files / Deliverables' },
    { code: 'EN', key: 'add_deliverable_file_btn', value: 'Add Deliverable File' },
    { code: 'EN', key: 'uploading_files_indicator', value: 'Uploading file(s)...' },
    { code: 'EN', key: 'files_ready_to_submit', value: 'Files ready to submit ({count})' },
    { code: 'EN', key: 'remove_btn', value: 'Remove' },
    { code: 'EN', key: 'submitting_indicator', value: 'Submitting...' },
    { code: 'EN', key: 'submit_deliverable_btn', value: 'Submit Deliverable' },

    // Arabic (AR)
    { code: 'AR', key: 'verification_pending', value: 'جاري التحقق' },
    { code: 'AR', key: 'verification_pending_desc', value: 'ملفك الشخصي قيد المراجعة حاليًا من قبل فريق الإدارة لدينا. سيتم منحك حق الوصول الكامل بمجرد الموافقة على مستنداتك.' },
    { code: 'AR', key: 'workspace_hub_locked', value: 'مساحة العمل مقفلة' },
    { code: 'AR', key: 'client_profile_locked_desc', value: 'يجب عليك إكمال ملف العميل الخاص بك لفتح مراحل المشروع النشطة، وحاسبات التكلفة، ومحادثات الرسائل، وإحصائيات المقاولين.' },
    { code: 'AR', key: 'freelancer_profile_locked_desc', value: 'يجب عليك إكمال ملفك الشخصي كمستقل لفتح المراحل النشطة، ومحاكيات العروض، ومحادثات الرسائل، وإحصائيات العقد.' },
    { code: 'AR', key: 'complete_profile_wizard', value: 'إكمال معالج الملف الشخصي' },
    { code: 'AR', key: 'project_milestone_escrow', value: 'مراحل المشروع والضمان المالي' },
    { code: 'AR', key: 'back_to_dashboard', value: 'العودة إلى لوحة التحكم' },
    { code: 'AR', key: 'gig_order_tracker', value: 'متابع طلبات الخدمة' },
    { code: 'AR', key: 'awaiting_acceptance_toast', value: 'في انتظار قبول المستقل' },
    { code: 'AR', key: 'awaiting_acceptance_toast_desc', value: 'طلبك قيد الانتظار لموافقة المستقل. سيتم فتح خيارات الدفع بمجرد قبول المستقل لطلب الخدمة الخاص بك. لم يتم تحصيل أي مبالغ بعد.' },
    { code: 'AR', key: 'milestone_status_updated', value: 'تم تحديث حالة مرحلة الخدمة بنجاح!' },
    { code: 'AR', key: 'submitted_deliverables', value: 'الملفات والحلول المقدمة' },
    { code: 'AR', key: 'view_deliverable', value: 'عرض الملف المقدم' },
    { code: 'AR', key: 'frozen_disputed', value: '🔒 مجمد - قيد النزاع' },
    { code: 'AR', key: 'awaiting_acceptance_title', value: 'في انتظار قبول المستقل - انقر للمعلومات' },
    { code: 'AR', key: 'pay_milestone_title', value: 'دفع قيمة المرحلة' },
    { code: 'AR', key: 'under_review_status', value: '⏳ قيد المراجعة' },
    { code: 'AR', key: 'submit_work_btn', value: 'تقديم العمل والملفات' },
    { code: 'AR', key: 'approve_pay_btn', value: 'مواقفة ودفع' },
    { code: 'AR', key: 'request_revision_btn', value: 'طلب تعديل ومراجعة' },
    { code: 'AR', key: 'awaiting_work_status', value: '⏳ في انتظار العمل' },
    { code: 'AR', key: 'describe_revision_requirements', value: 'وصف متطلبات المراجعة والتعديل *' },
    { code: 'AR', key: 'revision_requirements_placeholder', value: 'مثال: يرجى تحديث نمط الإطار السلكي ومحاذاة الألوان مع العلامة التجارية...' },
    { code: 'AR', key: 'submit_request_btn', value: 'إرسال طلب التعديل' },
    { code: 'AR', key: 'submit_milestone_deliverables', value: 'تقديم ملفات وتسليمات المرحلة' },
    { code: 'AR', key: 'milestone_details', value: 'تفاصيل مرحلة المشروع' },
    { code: 'AR', key: 'milestone_deliverable', value: 'تسليمات المرحلة' },
    { code: 'AR', key: 'upload_files_deliverables', value: 'رفع الملفات / التسليمات' },
    { code: 'AR', key: 'add_deliverable_file_btn', value: 'إضافة ملف تسليم' },
    { code: 'AR', key: 'uploading_files_indicator', value: 'جاري رفع الملفات...' },
    { code: 'AR', key: 'files_ready_to_submit', value: 'الملفات الجاهزة للتقديم ({count})' },
    { code: 'AR', key: 'remove_btn', value: 'إزالة' },
    { code: 'AR', key: 'submitting_indicator', value: 'جاري التقديم...' },
    { code: 'AR', key: 'submit_deliverable_btn', value: 'تقديم التسليم' }
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

  console.log(`✅ Successfully seeded ${insertedCount} User Dashboard translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
