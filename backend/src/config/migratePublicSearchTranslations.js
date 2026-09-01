import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for Public Search translations (Talent & Gigs)...");

  const translations = [
    // === ENGLISH (EN) ===
    { code: 'EN', key: 'search_category', value: 'Search Category' },
    { code: 'EN', key: 'refine_search', value: 'Refine Search' },
    { code: 'EN', key: 'reset', value: 'Reset' },
    { code: 'EN', key: 'category', value: 'Specialty Category' },
    { code: 'EN', key: 'subcategory', value: 'Subcategory' },
    { code: 'EN', key: 'all_categories', value: 'All Categories' },
    { code: 'EN', key: 'all_subcategories', value: 'All Subcategories' },
    { code: 'EN', key: 'hourly_rate_range', value: 'Hourly Rate Range ($)' },
    { code: 'EN', key: 'min', value: 'Min' },
    { code: 'EN', key: 'max', value: 'Max' },
    { code: 'EN', key: 'experience_level', value: 'Experience Level' },
    { code: 'EN', key: 'any_level', value: 'Any Level' },
    { code: 'EN', key: 'entry_level', value: 'Entry Level' },
    { code: 'EN', key: 'intermediate', value: 'Intermediate' },
    { code: 'EN', key: 'expert', value: 'Expert' },
    { code: 'EN', key: 'filter_by_skill', value: 'Filter by Skill' },
    { code: 'EN', key: 'filter_by_skill_placeholder', value: 'e.g. React, Figma...' },
    { code: 'EN', key: 'vetted_contractors_only', value: 'Vetted Contractors Only' },
    { code: 'EN', key: 'search_freelancers_placeholder', value: 'Search for freelancers...' },
    { code: 'EN', key: 'search_gigs_placeholder', value: 'Search for service gigs...' },
    { code: 'EN', key: 'showing', value: 'Showing' },
    { code: 'EN', key: 'professionals', value: 'professionals' },
    { code: 'EN', key: 'active_gigs', value: 'active gigs' },
    { code: 'EN', key: 'sort_by', value: 'Sort By' },
    { code: 'EN', key: 'sort_recommended', value: 'Recommended' },
    { code: 'EN', key: 'sort_popular', value: 'Recommended / Popular' },
    { code: 'EN', key: 'sort_rating', value: 'Top Rated Status' },
    { code: 'EN', key: 'price_low_high', value: 'Price: Low to High' },
    { code: 'EN', key: 'price_high_low', value: 'Price: High to Low' },
    { code: 'EN', key: 'sort_rate_high_low', value: 'Hourly Rate: High to Low' },
    { code: 'EN', key: 'sort_rate_low_high', value: 'Hourly Rate: Low to High' },
    { code: 'EN', key: 'no_bio_provided', value: 'No professional overview bio provided yet by this freelancer partner.' },
    { code: 'EN', key: 'freelancer_partner', value: 'Freelancer Partner' },
    { code: 'EN', key: 'site_choice', value: "{site_name}'s Choice" },
    { code: 'EN', key: 'no_talent_found', value: 'No talent found' },
    { code: 'EN', key: 'no_talent_found_desc', value: 'Try checking for other categories, adjusting hourly rate limits, or resetting filters.' },
    { code: 'EN', key: 'reset_all_filters', value: 'Reset All Filters' },
    { code: 'EN', key: 'loading_freelancers', value: 'Loading freelancers...' },
    { code: 'EN', key: 'budget_usd', value: 'Budget (USD)' },
    { code: 'EN', key: 'delivery_speed', value: 'Delivery Speed' },
    { code: 'EN', key: 'any_time_duration', value: 'Any time duration' },
    { code: 'EN', key: 'up_to_24_hours', value: 'Up to 24 hours' },
    { code: 'EN', key: 'up_to_3_days', value: 'Up to 3 days' },
    { code: 'EN', key: 'up_to_7_days', value: 'Up to 7 days' },
    { code: 'EN', key: 'up_to_14_days', value: 'Up to 14 days' },
    { code: 'EN', key: 'minimum_rating', value: 'Minimum Rating' },
    { code: 'EN', key: 'any_rating', value: 'Any Rating' },
    { code: 'EN', key: 'stars_and_up_45', value: '4.5 Stars & Up' },
    { code: 'EN', key: 'stars_and_up_40', value: '4.0 Stars & Up' },
    { code: 'EN', key: 'stars_and_up_35', value: '3.5 Stars & Up' },
    { code: 'EN', key: 'contractor_level', value: 'Contractor Level' },
    { code: 'EN', key: 'loading_gigs', value: 'Loading service gigs...' },
    { code: 'EN', key: 'no_gigs_found', value: 'No service gigs found' },
    { code: 'EN', key: 'no_gigs_desc', value: 'Try adjusting your price range, delivery speed, rating filter, or searching for other keywords.' },
    { code: 'EN', key: 'clear_filters', value: 'Clear All Filters' },
    { code: 'EN', key: 'saves', value: 'saves' },
    { code: 'EN', key: 'by', value: 'By' },
    { code: 'EN', key: 'delivery', value: 'delivery' },
    { code: 'EN', key: 'starting_at', value: 'Starting At' },
    { code: 'EN', key: 'btn_previous', value: 'Previous' },
    { code: 'EN', key: 'btn_next', value: 'Next' },
    { code: 'EN', key: 'of', value: 'of' },
    { code: 'EN', key: 'select_category_first', value: 'Select Category First' },

    // === ARABIC (AR) ===
    { code: 'AR', key: 'search_category', value: 'فئة البحث' },
    { code: 'AR', key: 'refine_search', value: 'تصفية البحث' },
    { code: 'AR', key: 'reset', value: 'إعادة تعيين' },
    { code: 'AR', key: 'category', value: 'الفئة التخصصية' },
    { code: 'AR', key: 'subcategory', value: 'الفئة الفرعية' },
    { code: 'AR', key: 'all_categories', value: 'جميع الفئات' },
    { code: 'AR', key: 'all_subcategories', value: 'جميع الفئات الفرعية' },
    { code: 'AR', key: 'hourly_rate_range', value: 'نطاق سعر الساعة ($)' },
    { code: 'AR', key: 'min', value: 'الحد الأدنى' },
    { code: 'AR', key: 'max', value: 'الحد الأقصى' },
    { code: 'AR', key: 'experience_level', value: 'مستوى الخبرة' },
    { code: 'AR', key: 'any_level', value: 'أي مستوى' },
    { code: 'AR', key: 'entry_level', value: 'مبتدئ' },
    { code: 'AR', key: 'intermediate', value: 'متوسط' },
    { code: 'AR', key: 'expert', value: 'خبير' },
    { code: 'AR', key: 'filter_by_skill', value: 'تصفية حسب المهارة' },
    { code: 'AR', key: 'filter_by_skill_placeholder', value: 'مثل React، Figma...' },
    { code: 'AR', key: 'vetted_contractors_only', value: 'المستقلين المعتمدين فقط' },
    { code: 'AR', key: 'search_freelancers_placeholder', value: 'البحث عن مستقلين...' },
    { code: 'AR', key: 'search_gigs_placeholder', value: 'البحث عن خدمات...' },
    { code: 'AR', key: 'showing', value: 'عرض' },
    { code: 'AR', key: 'professionals', value: 'محترفين' },
    { code: 'AR', key: 'active_gigs', value: 'خدمات نشطة' },
    { code: 'AR', key: 'sort_by', value: 'ترتيب حسب' },
    { code: 'AR', key: 'sort_recommended', value: 'موصى به' },
    { code: 'AR', key: 'sort_popular', value: 'موصى به / شائع' },
    { code: 'AR', key: 'sort_rating', value: 'الأعلى تقييمًا' },
    { code: 'AR', key: 'price_low_high', value: 'السعر: من الأقل للأعلى' },
    { code: 'AR', key: 'price_high_low', value: 'السعر: من الأعلى للأقل' },
    { code: 'AR', key: 'sort_rate_high_low', value: 'سعر الساعة: من الأعلى للأقل' },
    { code: 'AR', key: 'sort_rate_low_high', value: 'سعر الساعة: من الأقل للأعلى' },
    { code: 'AR', key: 'no_bio_provided', value: 'لم يتم تقديم سيرة تخصصية من قبل هذا المستقل حتى الآن.' },
    { code: 'AR', key: 'freelancer_partner', value: 'شريك العمل الحر' },
    { code: 'AR', key: 'site_choice', value: 'اختيار {site_name}' },
    { code: 'AR', key: 'no_talent_found', value: 'لم يتم العثور على مواهب' },
    { code: 'AR', key: 'no_talent_found_desc', value: 'حاول التحقق من الفئات الأخرى، أو ضبط حدود سعر الساعة، أو إعادة تعيين عوامل التصفية.' },
    { code: 'AR', key: 'reset_all_filters', value: 'إعادة تعيين كافة عوامل التصفية' },
    { code: 'AR', key: 'loading_freelancers', value: 'جاري تحميل المستقلين...' },
    { code: 'AR', key: 'budget_usd', value: 'الميزانية (دولار)' },
    { code: 'AR', key: 'delivery_speed', value: 'سرعة التسليم' },
    { code: 'AR', key: 'any_time_duration', value: 'أي مدة زمنية' },
    { code: 'AR', key: 'up_to_24_hours', value: 'حتى ٢٤ ساعة' },
    { code: 'AR', key: 'up_to_3_days', value: 'حتى ٣ أيام' },
    { code: 'AR', key: 'up_to_7_days', value: 'حتى ٧ أيام' },
    { code: 'AR', key: 'up_to_14_days', value: 'حتى ١٤ يومًا' },
    { code: 'AR', key: 'minimum_rating', value: 'الحد الأدنى للتقييم' },
    { code: 'AR', key: 'any_rating', value: 'أي تقييم' },
    { code: 'AR', key: 'stars_and_up_45', value: '٤.٥ نجوم فما فوق' },
    { code: 'AR', key: 'stars_and_up_40', value: '٤.٠ نجوم فما فوق' },
    { code: 'AR', key: 'stars_and_up_35', value: '٣.٥ نجوم فما فوق' },
    { code: 'AR', key: 'contractor_level', value: 'مستوى المقاول' },
    { code: 'AR', key: 'loading_gigs', value: 'جاري تحميل الخدمات...' },
    { code: 'AR', key: 'no_gigs_found', value: 'لم يتم العثور على خدمات' },
    { code: 'AR', key: 'no_gigs_desc', value: 'حاول تعديل نطاق الأسعار، أو سرعة التسليم، أو تصفية التقييم، أو البحث عن كلمات رئيسية أخرى.' },
    { code: 'AR', key: 'clear_filters', value: 'إزالة كافة عوامل التصفية' },
    { code: 'AR', key: 'saves', value: 'حفظ' },
    { code: 'AR', key: 'by', value: 'بواسطة' },
    { code: 'AR', key: 'delivery', value: 'تسليم' },
    { code: 'AR', key: 'starting_at', value: 'يبدأ من' },
    { code: 'AR', key: 'btn_previous', value: 'السابق' },
    { code: 'AR', key: 'btn_next', value: 'التالي' },
    { code: 'AR', key: 'of', value: 'من' },
    { code: 'AR', key: 'select_category_first', value: 'اختر الفئة أولاً' }
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

  console.log(`✅ Successfully seeded ${insertedCount} Public Search (Talent & Gigs) translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
