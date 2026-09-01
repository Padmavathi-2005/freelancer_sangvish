import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for SEO Preview tab translations...");

  const translations = [
    // English (EN)
    { code: 'EN', key: 'admin_seo_loading_routes', value: 'Loading route details...' },
    { code: 'EN', key: 'admin_seo_target_route', value: 'Target Page Route' },
    { code: 'EN', key: 'admin_seo_home_page', value: 'Home Page' },
    { code: 'EN', key: 'admin_seo_customizer', value: 'SEO Metadata Customizer' },
    { code: 'EN', key: 'admin_seo_customizer_desc', value: 'Control search tags and indexing titles sent to search engine crawlers.' },
    { code: 'EN', key: 'admin_seo_save_success', value: 'SEO settings updated successfully! Changes are now live.' },
    { code: 'EN', key: 'admin_seo_meta_title', value: 'Meta Title Tag' },
    { code: 'EN', key: 'admin_seo_chars_suffix', value: '/60 chars' },
    { code: 'EN', key: 'admin_seo_meta_title_placeholder', value: 'e.g. Buy2Lancer - Professional Freelance Services Marketplace' },
    { code: 'EN', key: 'admin_seo_meta_desc', value: 'Meta Description Tag' },
    { code: 'EN', key: 'admin_seo_desc_chars_suffix', value: '/160 chars' },
    { code: 'EN', key: 'admin_seo_meta_desc_placeholder', value: 'Provide a high-converting call-to-action summary to increase organic Google click-through rates...' },
    { code: 'EN', key: 'admin_seo_meta_keywords', value: 'Meta Keywords (Comma separated)' },
    { code: 'EN', key: 'admin_seo_meta_keywords_placeholder', value: 'e.g. freelance, developer, outsource projects, hire expert' },
    { code: 'EN', key: 'admin_seo_og_settings', value: 'OpenGraph Settings (Social Overrides)' },
    { code: 'EN', key: 'admin_seo_og_title', value: 'OG Title Override' },
    { code: 'EN', key: 'admin_seo_og_title_placeholder', value: 'Defaults to Meta Title' },
    { code: 'EN', key: 'admin_seo_og_image', value: 'Custom Sharing Image' },
    { code: 'EN', key: 'admin_seo_uploading', value: 'Uploading...' },
    { code: 'EN', key: 'admin_seo_change_image', value: 'Change Image' },
    { code: 'EN', key: 'admin_seo_upload_image', value: 'Upload Image' },
    { code: 'EN', key: 'admin_seo_image_dimensions_hint', value: 'Min 300x200px • Large images auto-resized to 1200x630px' },
    { code: 'EN', key: 'admin_seo_og_desc', value: 'OG Description Override' },
    { code: 'EN', key: 'admin_seo_og_desc_placeholder', value: 'Defaults to Meta Description if left empty' },
    { code: 'EN', key: 'admin_seo_saving', value: 'Saving Metadata...' },
    { code: 'EN', key: 'admin_seo_save_btn', value: 'Save Route SEO settings' },
    { code: 'EN', key: 'admin_seo_google_preview', value: 'Google Search Snippet Preview' },
    { code: 'EN', key: 'admin_seo_specify_title', value: 'Please specify a Meta Title' },
    { code: 'EN', key: 'admin_seo_specify_desc', value: 'Please specify a description. Google search crawlers will generate a fallback snippet based on random page texts if left empty.' },
    { code: 'EN', key: 'admin_seo_social_preview', value: 'Social Share Cards Preview' },
    { code: 'EN', key: 'admin_seo_card_preview_badge', value: 'Card Preview' },
    { code: 'EN', key: 'admin_seo_card_title_display', value: 'Card Title Display' },
    { code: 'EN', key: 'admin_seo_shared_link_desc', value: 'Shared link description summary text...' },

    // Arabic (AR)
    { code: 'AR', key: 'admin_seo_loading_routes', value: 'جاري تحميل تفاصيل المسار...' },
    { code: 'AR', key: 'admin_seo_target_route', value: 'مسار الصفحة المستهدفة' },
    { code: 'AR', key: 'admin_seo_home_page', value: 'الصفحة الرئيسية' },
    { code: 'AR', key: 'admin_seo_customizer', value: 'مخصص البيانات الوصفية لتحسين محركات البحث' },
    { code: 'AR', key: 'admin_seo_customizer_desc', value: 'التحكم في علامات البحث وعناوين الفهرسة المرسلة إلى زواحف محرك البحث.' },
    { code: 'AR', key: 'admin_seo_save_success', value: 'تم تحديث إعدادات تحسين محركات البحث بنجاح! التغييرات مفعلة الآن.' },
    { code: 'AR', key: 'admin_seo_meta_title', value: 'علامة العنوان الوصفي (Meta Title)' },
    { code: 'AR', key: 'admin_seo_chars_suffix', value: ' / ٦٠ حرفاً' },
    { code: 'AR', key: 'admin_seo_meta_title_placeholder', value: 'مثال: Buy2Lancer - سوق خدمات المستقلين المحترفة' },
    { code: 'AR', key: 'admin_seo_meta_desc', value: 'علامة الوصف الوصفي (Meta Description)' },
    { code: 'AR', key: 'admin_seo_desc_chars_suffix', value: ' / ١٦٠ حرفاً' },
    { code: 'AR', key: 'admin_seo_meta_desc_placeholder', value: 'قدم ملخصاً يحفز على اتخاذ إجراء لزيادة معدلات النقر العضوية في جوجل...' },
    { code: 'AR', key: 'admin_seo_meta_keywords', value: 'الكلمات المفتاحية الوصفية (مفصولة بفواصل)' },
    { code: 'AR', key: 'admin_seo_meta_keywords_placeholder', value: 'مثال: مستقل، مطور، مشاريع، توظيف خبير' },
    { code: 'AR', key: 'admin_seo_og_settings', value: 'إعدادات بروتوكول OpenGraph (تجاوزات اجتماعية)' },
    { code: 'AR', key: 'admin_seo_og_title', value: 'تجاوز عنوان OG' },
    { code: 'AR', key: 'admin_seo_og_title_placeholder', value: 'افتراضي إلى العنوان الوصفي (Meta Title)' },
    { code: 'AR', key: 'admin_seo_og_image', value: 'صورة مشاركة مخصصة' },
    { code: 'AR', key: 'admin_seo_uploading', value: 'جاري الرفع...' },
    { code: 'AR', key: 'admin_seo_change_image', value: 'تغيير الصورة' },
    { code: 'AR', key: 'admin_seo_upload_image', value: 'رفع صورة' },
    { code: 'AR', key: 'admin_seo_image_dimensions_hint', value: 'الحد الأدنى ٣٠٠ × ٢٠٠ بكسل • يتم تغيير حجم الصور الكبيرة تلقائياً إلى ١٢٠٠ × ٦٣٠ بكسل' },
    { code: 'AR', key: 'admin_seo_og_desc', value: 'تجاوز وصف OG' },
    { code: 'AR', key: 'admin_seo_og_desc_placeholder', value: 'يتحول افتراضياً إلى الوصف الوصفي (Meta Description) إذا ترك فارغاً' },
    { code: 'AR', key: 'admin_seo_saving', value: 'جاري حفظ البيانات الوصفية...' },
    { code: 'AR', key: 'admin_seo_save_btn', value: 'حفظ إعدادات تحسين محركات البحث للمسار' },
    { code: 'AR', key: 'admin_seo_google_preview', value: 'معاينة مقتطف بحث جوجل' },
    { code: 'AR', key: 'admin_seo_specify_title', value: 'يرجى تحديد عنوان وصفي' },
    { code: 'AR', key: 'admin_seo_specify_desc', value: 'يرجى تحديد وصف. ستنشئ زواحف بحث جوجل مقتطفاً تلقائياً بناءً على نصوص عشوائية من الصفحة إذا ترك فارغاً.' },
    { code: 'AR', key: 'admin_seo_social_preview', value: 'معاينة بطاقات المشاركة الاجتماعية' },
    { code: 'AR', key: 'admin_seo_card_preview_badge', value: 'معاينة البطاقة' },
    { code: 'AR', key: 'admin_seo_card_title_display', value: 'عرض عنوان البطاقة' },
    { code: 'AR', key: 'admin_seo_shared_link_desc', value: 'ملخص نص وصف الرابط المشترك...' }
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

  console.log(`✅ Successfully seeded ${insertedCount} SEO Preview Tab translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
