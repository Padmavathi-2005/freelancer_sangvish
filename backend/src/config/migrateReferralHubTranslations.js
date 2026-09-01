import pool from "./db.js";

async function run() {
  console.log("🚀 Running database migration for Referral Hub translations...");

  const translations = [
    { code: 'EN', key: 'refer_and_earn_header', value: 'Refer & Earn' },
    { code: 'AR', key: 'refer_and_earn_header', value: 'شارك واكسب' },

    { code: 'EN', key: 'refer_and_earn_desc', value: 'Invite friends and earn wallet credits' },
    { code: 'AR', key: 'refer_and_earn_desc', value: 'دعوة الأصدقاء واكسب أرصدة المحفظة' },

    { code: 'EN', key: 'referral_program_badge', value: 'Referral Program' },
    { code: 'AR', key: 'referral_program_badge', value: 'برنامج الإحالة' },

    { code: 'EN', key: 'signup_bonus_reward_label', value: 'SIGN-UP BONUS' },
    { code: 'AR', key: 'signup_bonus_reward_label', value: 'مكافأة التسجيل' },

    { code: 'EN', key: 'referral_reward_label', value: 'REFERRAL REWARD' },
    { code: 'AR', key: 'referral_reward_label', value: 'مكافأة الإحالة' },

    { code: 'EN', key: 'up_to_reward', value: 'Up to {amount}' },
    { code: 'AR', key: 'up_to_reward', value: 'ما يصل إلى {amount}' },

    { code: 'EN', key: 'reward_method_label', value: 'REWARD METHOD' },
    { code: 'AR', key: 'reward_method_label', value: 'طريقة المكافأة' },

    { code: 'EN', key: 'wallet_credits_label', value: 'Wallet Credits' },
    { code: 'AR', key: 'wallet_credits_label', value: 'أرصدة المحفظة' },

    { code: 'EN', key: 'promoter_status_level_1', value: 'PROMOTER STATUS: LEVEL 1' },
    { code: 'AR', key: 'promoter_status_level_1', value: 'حالة المروج: المستوى 1' },

    { code: 'EN', key: 'successful_referrals_count', value: '{count} / 5 SUCCESSFUL REFERRALS' },
    { code: 'AR', key: 'successful_referrals_count', value: '{count} / 5 إحالات ناجحة' },

    { code: 'EN', key: 'promoter_instruction_note', value: 'Invite friends to start earning instant promoter bonus payouts directly to your wallet!' },
    { code: 'AR', key: 'promoter_instruction_note', value: 'ادعُ أصدقاءك للبدء في كسب مدفوعات مكافآت ترويجية فورية مباشرة إلى محفظتك!' },

    { code: 'EN', key: 'powered_by_site', value: 'POWERED BY {{siteName}}' },
    { code: 'AR', key: 'powered_by_site', value: 'مشغل بواسطة {{siteName}}' },

    { code: 'EN', key: 'active_rewards_label', value: 'ACTIVE REWARDS' },
    { code: 'AR', key: 'active_rewards_label', value: 'المكافآت النشطة' },

    { code: 'EN', key: 'start_inviting_badge', value: 'Start Inviting' },
    { code: 'AR', key: 'start_inviting_badge', value: 'ابدأ الدعوة' },

    { code: 'EN', key: 'active_link_status', value: 'Active Link' },
    { code: 'AR', key: 'active_link_status', value: 'رابط نشط' },

    { code: 'EN', key: 'your_referral_hub_title', value: 'Your Referral Hub' },
    { code: 'AR', key: 'your_referral_hub_title', value: 'مركز الإحالة الخاص بك' },

    { code: 'EN', key: 'your_referral_hub_desc', value: 'Copy your referral code, share your direct link, or send quick invites to start earning.' },
    { code: 'AR', key: 'your_referral_hub_desc', value: 'انسخ كود الإحالة الخاص بك، أو شارك رابطك المباشر، أو أرسل دعوات سريعة للبدء في الكسب.' },

    { code: 'EN', key: 'your_referral_code_label', value: 'Your Referral Code' },
    { code: 'AR', key: 'your_referral_code_label', value: 'كود الإحالة الخاص بك' },

    { code: 'EN', key: 'copied_btn_state', value: 'Copied' },
    { code: 'AR', key: 'copied_btn_state', value: 'تم النسخ' },

    { code: 'EN', key: 'copy_code_btn', value: 'Copy Code' },
    { code: 'AR', key: 'copy_code_btn', value: 'نسخ الكود' },

    { code: 'EN', key: 'direct_referral_link_label', value: 'Direct Referral Link' },
    { code: 'AR', key: 'direct_referral_link_label', value: 'رابط الإحالة المباشر' },

    { code: 'EN', key: 'copy_link_title', value: 'Copy link' },
    { code: 'AR', key: 'copy_link_title', value: 'نسخ الرابط' },

    { code: 'EN', key: 'copy_btn', value: 'Copy' },
    { code: 'AR', key: 'copy_btn', value: 'نسخ' },

    { code: 'EN', key: 'quick_share_label', value: 'Quick Share' },
    { code: 'AR', key: 'quick_share_label', value: 'مشاركة سريعة' },

    { code: 'EN', key: 'share_whatsapp_title', value: 'Share via WhatsApp' },
    { code: 'AR', key: 'share_whatsapp_title', value: 'المشاركة عبر واتساب' },

    { code: 'EN', key: 'share_x_title', value: 'Share via X / Twitter' },
    { code: 'AR', key: 'share_x_title', value: 'المشاركة عبر إكس / تويتر' },

    { code: 'EN', key: 'share_linkedin_title', value: 'Share via LinkedIn' },
    { code: 'AR', key: 'share_linkedin_title', value: 'المشاركة عبر لينكد إن' },

    { code: 'EN', key: 'share_facebook_title', value: 'Share via Facebook' },
    { code: 'AR', key: 'share_facebook_title', value: 'المشاركة عبر فيسبوك' },

    { code: 'EN', key: 'share_email_title', value: 'Share via Email' },
    { code: 'AR', key: 'share_email_title', value: 'المشاركة عبر البريد' },

    { code: 'EN', key: 'referral_tracker_title', value: 'Referral Tracker & Status Activity' },
    { code: 'AR', key: 'referral_tracker_title', value: 'متتبع الإحالات ونشاط الحالة' },

    { code: 'EN', key: 'registered_waiting_setup', value: '{count} Registered (Waiting for Setup)' },
    { code: 'AR', key: 'registered_waiting_setup', value: '{count} مسجلين (في انتظار إعداد الحساب)' },

    { code: 'EN', key: 'payouts_unlocked_label', value: '{count} Payouts Unlocked' },
    { code: 'AR', key: 'payouts_unlocked_label', value: 'تم فتح {count} من المدفوعات' },

    { code: 'EN', key: 'invited_friends_count_msg', value: 'You have {count} friend(s) registered using your referral link!' },
    { code: 'AR', key: 'invited_friends_count_msg', value: 'لديك {count} صديق مسجل باستخدام رابط الإحالة الخاص بك!' },

    { code: 'EN', key: 'invited_friends_pending_msg', value: '{count} friend(s) signed in and waiting to complete their first project milestone or gig purchase to clear your {reward} wallet reward.' },
    { code: 'AR', key: 'invited_friends_pending_msg', value: '{count} صديق قاموا بالتسجيل وبانتظار إكمال أول مرحلة مشروع أو شراء خدمة لتحرير مكافأة محفظتك البالغة {reward}.' },

    { code: 'EN', key: 'all_friends_completed_msg', value: 'All registered friends have completed setup & unlocked wallet payouts!' },
    { code: 'AR', key: 'all_friends_completed_msg', value: 'أكمل جميع الأصدقاء المسجلين إعداد حساباتهم وفتحوا مدفوعات المحفظة!' },

    { code: 'EN', key: 'how_tracking_works_msg', value: 'When a friend registers with your link, they immediately appear in your Invited Friends list as \'Signed Up (Pending Setup)\'. Once they complete their first transaction, your {reward} payout is automatically sent to your wallet!' },
    { code: 'AR', key: 'how_tracking_works_msg', value: 'عندما يسجل صديق برابطك، يظهر على الفور في قائمة الأصدقاء المدعوين كـ "تم التسجيل (في انتظار إعداد الحساب)". وبمجرد إكمال معاملتهم الأولى، يتم إرسال مكافأة {reward} تلقائيًا إلى محفظتك!' },

    { code: 'EN', key: 'total_invited_label', value: 'Total Invited' },
    { code: 'AR', key: 'total_invited_label', value: 'إجمالي المدعوين' },

    { code: 'EN', key: 'active_referrals_label', value: 'Active Referrals' },
    { code: 'AR', key: 'active_referrals_label', value: 'الإحالات النشطة' },

    { code: 'EN', key: 'pending_transaction_count', value: '{count} pending first transaction' },
    { code: 'AR', key: 'pending_transaction_count', value: '{count} في انتظار المعاملة الأولى' },

    { code: 'EN', key: 'total_earned_label', value: 'Total Earned' },
    { code: 'AR', key: 'total_earned_label', value: 'إجمالي الأرباح' },

    { code: 'EN', key: 'how_referral_program_works_title', value: 'How the referral program works' },
    { code: 'AR', key: 'how_referral_program_works_title', value: 'كيف يعمل برنامج الإحالة' },

    { code: 'EN', key: 'referral_step_1', value: 'Copy your referral link above and share it with your professional network.' },
    { code: 'AR', key: 'referral_step_1', value: 'انسخ رابط الإحالة الخاص بك أعلاه وشاركه مع شبكتك المهنية.' },

    { code: 'EN', key: 'referral_step_2', value: 'Your friends use the link to register a new account on our platform.' },
    { code: 'AR', key: 'referral_step_2', value: 'يستخدم أصدقاؤك الرابط لتسجيل حساب جديد على منصتنا.' },

    { code: 'EN', key: 'referral_step_3_bonus', value: 'Upon registering, they receive a {bonus} signup bonus (pending admin verification & approval) directly into their wallet.' },
    { code: 'AR', key: 'referral_step_3_bonus', value: 'عند التسجيل، يتلقون مكافأة تسجيل بقيمة {bonus} (في انتظار تحقق وموافقة الإدارة) مباشرة في محفظتهم.' },

    { code: 'EN', key: 'referral_step_3_no_bonus', value: 'Upon registering, their account is instantly activated and linked to your referral promoter account.' },
    { code: 'AR', key: 'referral_step_3_no_bonus', value: 'عند التسجيل، يتم تنشيط حسابهم على الفور وربطه بحساب مروج الإحالة الخاص بك.' },

    { code: 'EN', key: 'referral_step_4', value: 'When they fund their first job milestone, pay for a gig, or clear a contract, you instantly receive a promoter payout reward in your wallet.' },
    { code: 'AR', key: 'referral_step_4', value: 'عندما يقومون بتمويل أول مرحلة عمل، أو الدفع مقابل خدمة، أو تسوية عقد، فإنك تتلقى على الفور مكافأة دفع المروج في محفظتك.' },

    { code: 'EN', key: 'invited_friends_title', value: 'Invited Friends' },
    { code: 'AR', key: 'invited_friends_title', value: 'الأصدقاء المدعوون' },

    { code: 'EN', key: 'invited_friends_desc', value: 'Track registration and transaction status' },
    { code: 'AR', key: 'invited_friends_desc', value: 'تتبع حالة التسجيل والمعاملات المالية' },

    { code: 'EN', key: 'table_header_name', value: 'Name' },
    { code: 'AR', key: 'table_header_name', value: 'الاسم' },

    { code: 'EN', key: 'table_header_date', value: 'Registration Date' },
    { code: 'AR', key: 'table_header_date', value: 'تاريخ التسجيل' },

    { code: 'EN', key: 'table_header_status', value: 'Status' },
    { code: 'AR', key: 'table_header_status', value: 'الحالة' },

    { code: 'EN', key: 'account_registered_tooltip', value: 'Account Registered' },
    { code: 'AR', key: 'account_registered_tooltip', value: 'تم تسجيل الحساب' },

    { code: 'EN', key: 'status_signed_up', value: 'Signed Up' },
    { code: 'AR', key: 'status_signed_up', value: 'تم التسجيل' },

    { code: 'EN', key: 'profile_onboarding_completed_tooltip', value: 'Profile Onboarding Completed' },
    { code: 'AR', key: 'profile_onboarding_completed_tooltip', value: 'اكتمل إعداد الملف الشخصي' },

    { code: 'EN', key: 'pending_profile_onboarding_tooltip', value: 'Pending Profile Onboarding' },
    { code: 'AR', key: 'pending_profile_onboarding_tooltip', value: 'في انتظار إعداد الملف الشخصي' },

    { code: 'EN', key: 'status_onboarded', value: 'Onboarded' },
    { code: 'AR', key: 'status_onboarded', value: 'جاهز ومليء البيانات' },

    { code: 'EN', key: 'purchase_complete_tooltip', value: 'First purchase completed! Bonus paid.' },
    { code: 'AR', key: 'purchase_complete_tooltip', value: 'اكتملت أول عملية شراء! تم دفع المكافأة.' },

    { code: 'EN', key: 'purchase_expired_tooltip', value: 'Purchase window expired ({days} days passed)' },
    { code: 'AR', key: 'purchase_expired_tooltip', value: 'انتهت صلاحية نافذة الشراء (مرور {days} يوم)' },

    { code: 'EN', key: 'waiting_first_purchase_tooltip', value: 'Waiting for first purchase' },
    { code: 'AR', key: 'waiting_first_purchase_tooltip', value: 'في انتظار أول عملية شراء' },

    { code: 'EN', key: 'status_purchased', value: 'Purchased' },
    { code: 'AR', key: 'status_purchased', value: 'تم الشراء' },

    { code: 'EN', key: 'status_expired', value: 'Expired' },
    { code: 'AR', key: 'status_expired', value: 'منتهي الصلاحية' },

    { code: 'EN', key: 'no_referrals_title', value: 'No Referrals Yet' },
    { code: 'AR', key: 'no_referrals_title', value: 'لا توجد إحالات بعد' },

    { code: 'EN', key: 'no_referrals_desc', value: "You haven't referred anyone yet. Copy your unique link above and share it with your network to start earning!" },
    { code: 'AR', key: 'no_referrals_desc', value: 'لم تقم بإحالة أي شخص بعد. انسخ رابطك الفريد أعلاه وشاركه مع شبكتك للبدء في الكسب!' }
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

  console.log(`✅ Successfully seeded ${insertedCount} Referral Hub translations across EN and AR.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
