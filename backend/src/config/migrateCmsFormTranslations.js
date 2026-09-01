import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for CMS Form translations...");

  const translations = [
    { code: 'EN', key: 'application_submitted_title', value: 'Application Submitted!' },
    { code: 'AR', key: 'application_submitted_title', value: 'تم تقديم الطلب بنجاح!' },

    { code: 'EN', key: 'application_submitted_desc', value: 'Thank you for expressing interest in joining Buy2Lancer. Our HR team will review your resume and profile shortly.' },
    { code: 'AR', key: 'application_submitted_desc', value: 'شكرًا لك على إبداء الاهتمام بالانضمام إلى Buy2Lancer. سيقوم فريق الموارد البشرية لدينا بمراجعة سيرتك الذاتية وملفك الشخصي قريبًا.' },

    { code: 'EN', key: 'close_window_btn', value: 'Close Window' },
    { code: 'AR', key: 'close_window_btn', value: 'إغلاق النافذة' },

    { code: 'EN', key: 'career_opportunities_badge', value: 'Career Opportunities' },
    { code: 'AR', key: 'career_opportunities_badge', value: 'فرص العمل والوظائف' },

    { code: 'EN', key: 'submit_cv_resume_title', value: 'Submit Your CV / Resume' },
    { code: 'AR', key: 'submit_cv_resume_title', value: 'تقديم سيرتك الذاتية' },

    { code: 'EN', key: 'full_name_required', value: 'Full Name *' },
    { code: 'AR', key: 'full_name_required', value: 'الاسم الكامل *' },

    { code: 'EN', key: 'full_name_placeholder', value: 'e.g. Alex Morgan' },
    { code: 'AR', key: 'full_name_placeholder', value: 'مثال: أحمد محمد' },

    { code: 'EN', key: 'email_address_required', value: 'Email Address *' },
    { code: 'AR', key: 'email_address_required', value: 'البريد الإلكتروني *' },

    { code: 'EN', key: 'email_placeholder', value: 'john@example.com' },
    { code: 'AR', key: 'email_placeholder', value: 'john@example.com' },

    { code: 'EN', key: 'phone_number_required', value: 'Phone Number *' },
    { code: 'AR', key: 'phone_number_required', value: 'رقم الهاتف *' },

    { code: 'EN', key: 'phone_placeholder', value: 'e.g. 5550000000' },
    { code: 'AR', key: 'phone_placeholder', value: 'مثال: 5550000000' },

    { code: 'EN', key: 'target_position_role', value: 'Target Position / Role' },
    { code: 'AR', key: 'target_position_role', value: 'الوظيفة / الدور المستهدف' },

    { code: 'EN', key: 'full_stack_developer_option', value: 'Full Stack Developer' },
    { code: 'AR', key: 'full_stack_developer_option', value: 'مطور ويب متكامل' },

    { code: 'EN', key: 'senior_frontend_engineer_option', value: 'Senior Frontend Engineer' },
    { code: 'AR', key: 'senior_frontend_engineer_option', value: 'مهندس واجهات أمامية أول' },

    { code: 'EN', key: 'backend_systems_architect_option', value: 'Backend / Systems Architect' },
    { code: 'AR', key: 'backend_systems_architect_option', value: 'مهندس نظم وقواعد بيانات' },

    { code: 'EN', key: 'ui_ux_product_designer_option', value: 'UI/UX Product Designer' },
    { code: 'AR', key: 'ui_ux_product_designer_option', value: 'مصمم واجهات وتجربة مستخدم' },

    { code: 'EN', key: 'mobile_app_developer_option', value: 'Mobile App Developer' },
    { code: 'AR', key: 'mobile_app_developer_option', value: 'مطور تطبيقات هواتف' },

    { code: 'EN', key: 'devops_cloud_engineer_option', value: 'DevOps / Cloud Engineer' },
    { code: 'AR', key: 'devops_cloud_engineer_option', value: 'مهندس سحابي وعميات DevOps' },

    { code: 'EN', key: 'general_candidate_option', value: 'General Candidate' },
    { code: 'AR', key: 'general_candidate_option', value: 'متقدم عام' },

    { code: 'EN', key: 'select_position_role_placeholder', value: 'Select Position / Role' },
    { code: 'AR', key: 'select_position_role_placeholder', value: 'اختر الوظيفة / الدور' },

    { code: 'EN', key: 'cover_letter_message', value: 'Cover Letter / Message' },
    { code: 'AR', key: 'cover_letter_message', value: 'خطاب التقديم / الرسالة' },

    { code: 'EN', key: 'cover_letter_placeholder', value: 'Briefly introduce your background, key projects, and expertise...' },
    { code: 'AR', key: 'cover_letter_placeholder', value: 'قدم مقدمة موجزة عن خلفيتك المهنية، ومشاريعك الرئيسية، وخبرتك...' },

    { code: 'EN', key: 'attach_cv_resume_label', value: 'Attach CV / Resume (PDF or DOC)' },
    { code: 'AR', key: 'attach_cv_resume_label', value: 'إرفاق السيرة الذاتية (PDF أو DOC)' },

    { code: 'EN', key: 'click_upload_cv_resume', value: 'Click to upload CV / Resume' },
    { code: 'AR', key: 'click_upload_cv_resume', value: 'انقر لرفع سيرتك الذاتية' },

    { code: 'EN', key: 'uploading_file_indicator', value: 'Uploading file...' },
    { code: 'AR', key: 'uploading_file_indicator', value: 'جاري رفع الملف...' },

    { code: 'EN', key: 'uploaded_attached_indicator', value: '✓ Uploaded & Attached' },
    { code: 'AR', key: 'uploaded_attached_indicator', value: '✓ تم الرفع والإرفاق بنجاح' },

    { code: 'EN', key: 'resume_support_formats_desc', value: 'Supports PDF, DOC, DOCX up to 10MB' },
    { code: 'AR', key: 'resume_support_formats_desc', value: 'يدعم صيغ PDF، DOC، DOCX حتى حجم 10 ميجابايت' },

    { code: 'EN', key: 'uploading_btn_state', value: 'Uploading...' },
    { code: 'AR', key: 'uploading_btn_state', value: 'جاري الرفع...' },

    { code: 'EN', key: 'change_file_btn', value: 'Change File' },
    { code: 'AR', key: 'change_file_btn', value: 'تغيير الملف' },

    { code: 'EN', key: 'browse_file_btn', value: 'Browse File' },
    { code: 'AR', key: 'browse_file_btn', value: 'تصفح الملفات' },

    { code: 'EN', key: 'submit_cv_application_btn', value: 'Submit CV Application' },
    { code: 'AR', key: 'submit_cv_application_btn', value: 'إرسال طلب التوظيف' },

    { code: 'EN', key: 'email_msg_required', value: 'Email and message are required fields.' },
    { code: 'AR', key: 'email_msg_required', value: 'البريد الإلكتروني والرسالة حقول مطلوبة.' },

    { code: 'EN', key: 'inquiry_success_msg', value: 'Thank you! Your inquiry has been submitted successfully.' },
    { code: 'AR', key: 'inquiry_success_msg', value: 'شكرًا لك! تم إرسال استفسارك بنجاح.' },

    { code: 'EN', key: 'network_error_msg', value: 'Network error. Please check your connection and try again.' },
    { code: 'AR', key: 'network_error_msg', value: 'خطأ في الشبكة. يرجى التحقق من اتصالك والمحاولة مرة أخرى.' },

    { code: 'EN', key: 'send_message_title', value: 'Send Message' },
    { code: 'AR', key: 'send_message_title', value: 'إرسال رسالة' },

    { code: 'EN', key: 'team_respond_back_desc', value: 'Our team will respond back shortly' },
    { code: 'AR', key: 'team_respond_back_desc', value: 'سيرد فريقنا عليك في أقرب وقت ممكن' },

    { code: 'EN', key: 'full_name_label', value: 'Full Name' },
    { code: 'AR', key: 'full_name_label', value: 'الاسم الكامل' },

    { code: 'EN', key: 'john_doe_placeholder', value: 'John Doe' },
    { code: 'AR', key: 'john_doe_placeholder', value: 'أحمد محمد' },

    { code: 'EN', key: 'subject_label', value: 'Subject' },
    { code: 'AR', key: 'subject_label', value: 'الموضوع' },

    { code: 'EN', key: 'subject_placeholder', value: 'Business Inquiry / Partnership' },
    { code: 'AR', key: 'subject_placeholder', value: 'استفسار تجاري / شراكة' },

    { code: 'EN', key: 'your_message_required', value: 'Your Message *' },
    { code: 'AR', key: 'your_message_required', value: 'رسالتك *' },

    { code: 'EN', key: 'message_placeholder', value: 'Write your inquiry details here...' },
    { code: 'AR', key: 'message_placeholder', value: 'اكتب تفاصيل استفسارك هنا...' },

    { code: 'EN', key: 'sending_inquiry_indicator', value: 'Sending Inquiry...' },
    { code: 'AR', key: 'sending_inquiry_indicator', value: 'جاري إرسال الاستفسار...' },

    { code: 'EN', key: 'submit_inquiry_btn', value: 'Submit Inquiry' },
    { code: 'AR', key: 'submit_inquiry_btn', value: 'إرسال الاستفسار' },

    { code: 'EN', key: 'email_required', value: 'Email address is required.' },
    { code: 'AR', key: 'email_required', value: 'البريد الإلكتروني مطلوب.' },

    { code: 'EN', key: 'newsletter_success_msg', value: 'Successfully subscribed to our newsletter!' },
    { code: 'AR', key: 'newsletter_success_msg', value: 'تم الاشتراك في نشرتنا الإخبارية بنجاح!' },

    { code: 'EN', key: 'subscribe_title', value: 'Subscribe' },
    { code: 'AR', key: 'subscribe_title', value: 'اشترك الآن' },

    { code: 'EN', key: 'subscribe_subtitle', value: 'Get remote jobs & marketplace trends' },
    { code: 'AR', key: 'subscribe_subtitle', value: 'احصل على وظائف عن بعد واتجاهات السوق' },

    { code: 'EN', key: 'email_placeholder_your', value: 'your.email@example.com' },
    { code: 'AR', key: 'email_placeholder_your', value: 'your.email@example.com' },

    { code: 'EN', key: 'subscribing_indicator', value: 'Subscribing...' },
    { code: 'AR', key: 'subscribing_indicator', value: 'جاري الاشتراك...' },

    { code: 'EN', key: 'subscribe_now_btn', value: 'Subscribe Now' },
    { code: 'AR', key: 'subscribe_now_btn', value: 'اشترك الآن' }
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

  console.log(`✅ Successfully seeded ${insertedCount} CMS Form translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
