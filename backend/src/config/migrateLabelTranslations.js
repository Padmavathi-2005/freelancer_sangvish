import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration to clean Landing Page Editor label translations...");

  const translations = [
    // English (EN)
    { code: 'EN', key: 'admin_label_hero_badge_text', value: 'Hero Badge Text' },
    { code: 'EN', key: 'admin_label_search_button_text', value: 'Search Button Text' },
    { code: 'EN', key: 'admin_label_mobile_search_label', value: 'Mobile Search Label' },
    { code: 'EN', key: 'admin_label_hero_heading_title', value: 'Hero Heading Title' },
    { code: 'EN', key: 'admin_label_hero_subtitle_paragraph', value: 'Hero Subtitle Paragraph' },
    { code: 'EN', key: 'admin_label_search_input_placeholder', value: 'Search Input Placeholder' },
    { code: 'EN', key: 'admin_label_popular_tags_label', value: 'Popular Tags Label' },
    { code: 'EN', key: 'admin_label_title_prefix', value: 'Title Prefix' },
    { code: 'EN', key: 'admin_label_title_highlighted_text', value: 'Title Highlighted Text' },
    { code: 'EN', key: 'admin_label_title_suffix', value: 'Title Suffix' },
    { code: 'EN', key: 'admin_label_hero_subtitle', value: 'Hero Subtitle' },
    { code: 'EN', key: 'admin_label_search_filter_label', value: 'Search Filter Label' },
    { code: 'EN', key: 'admin_label_popular_label', value: 'Popular Label' },
    { code: 'EN', key: 'admin_label_popular_category_chips_comma_separated', value: 'Popular Category Chips (Comma Separated)' },
    { code: 'EN', key: 'admin_header_home_2_featured_banner_section', value: 'Home 2 Featured Banner Section' },
    { code: 'EN', key: 'admin_label_banner_badge', value: 'Banner Badge' },
    { code: 'EN', key: 'admin_label_banner_title', value: 'Banner Title' },
    { code: 'EN', key: 'admin_label_banner_button_text', value: 'Banner Button Text' },
    { code: 'EN', key: 'admin_label_banner_image_url_relative_path', value: 'Banner Image URL / Relative Path' },
    { code: 'EN', key: 'admin_label_categories_section_title', value: 'Categories Section Title' },
    { code: 'EN', key: 'admin_label_categories_section_subtitle', value: 'Categories Section Subtitle' },
    { code: 'EN', key: 'admin_label_explore_box_title', value: 'Explore Box Title' },
    { code: 'EN', key: 'admin_label_explore_box_subtitle', value: 'Explore Box Subtitle' },
    { code: 'EN', key: 'admin_label_features_section_badge', value: 'Features Section Badge' },
    { code: 'EN', key: 'admin_label_features_section_title', value: 'Features Section Title' },
    { code: 'EN', key: 'admin_label_features_section_subtitle', value: 'Features Section Subtitle' },
    { code: 'EN', key: 'admin_header_add_new_feature_to_pool', value: 'Add New Feature to Pool' },
    { code: 'EN', key: 'admin_header_features_pool', value: 'Features Pool' },

    // Arabic (AR) - CLEANED from trailing parentheses
    { code: 'AR', key: 'admin_label_hero_badge_text', value: 'نص شارة البطل' },
    { code: 'AR', key: 'admin_label_search_button_text', value: 'نص زر البحث' },
    { code: 'AR', key: 'admin_label_mobile_search_label', value: 'تسمية البحث للهاتف المحمول' },
    { code: 'AR', key: 'admin_label_hero_heading_title', value: 'عنوان ترويسة البطل' },
    { code: 'AR', key: 'admin_label_hero_subtitle_paragraph', value: 'فقرة العنوان الفرعي للبطل' },
    { code: 'AR', key: 'admin_label_search_input_placeholder', value: 'العلامة النائبة لإدخال البحث' },
    { code: 'AR', key: 'admin_label_popular_tags_label', value: 'تسمية الكلمات الدلالية الشائعة' },
    { code: 'AR', key: 'admin_label_title_prefix', value: 'بادئة العنوان' },
    { code: 'AR', key: 'admin_label_title_highlighted_text', value: 'النص المظلل في العنوان' },
    { code: 'AR', key: 'admin_label_title_suffix', value: 'لاحقة العنوان' },
    { code: 'AR', key: 'admin_label_hero_subtitle', value: 'العنوان الفرعي للبطل' },
    { code: 'AR', key: 'admin_label_search_filter_label', value: 'تسمية تصفية البحث' },
    { code: 'AR', key: 'admin_label_popular_label', value: 'التسمية الشائعة' },
    { code: 'AR', key: 'admin_label_popular_category_chips_comma_separated', value: 'رقاقات الفئات الشائعة' },
    { code: 'AR', key: 'admin_header_home_2_featured_banner_section', value: 'قسم لافتة الترويج المميزة 2' },
    { code: 'AR', key: 'admin_label_banner_badge', value: 'شارة اللافتة' },
    { code: 'AR', key: 'admin_label_banner_title', value: 'عنوان اللافتة' },
    { code: 'AR', key: 'admin_label_banner_button_text', value: 'نص زر اللافتة' },
    { code: 'AR', key: 'admin_label_banner_image_url_relative_path', value: 'رابط صورة اللافتة' },
    { code: 'AR', key: 'admin_label_categories_section_title', value: 'عنوان قسم الفئات' },
    { code: 'AR', key: 'admin_label_categories_section_subtitle', value: 'العنوان الفرعي لقسم الفئات' },
    { code: 'AR', key: 'admin_label_explore_box_title', value: 'عنوان صندوق الاستكشاف' },
    { code: 'AR', key: 'admin_label_explore_box_subtitle', value: 'العنوان الفرعي لصندوق الاستكشاف' },
    { code: 'AR', key: 'admin_label_features_section_badge', value: 'شارة قسم الميزات' },
    { code: 'AR', key: 'admin_label_features_section_title', value: 'عنوان قسم الميزات' },
    { code: 'AR', key: 'admin_label_features_section_subtitle', value: 'العنوان الفرعي لقسم الميزات' },
    { code: 'AR', key: 'admin_header_add_new_feature_to_pool', value: 'إضافة ميزة جديدة إلى المجمع' },
    { code: 'AR', key: 'admin_header_features_pool', value: 'مجمع الميزات' }
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

  console.log(`✅ Successfully updated ${insertedCount} Landing Page Editor labels to clean translations.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
