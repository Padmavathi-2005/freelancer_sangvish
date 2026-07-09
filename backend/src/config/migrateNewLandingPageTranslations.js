import pool from "./db.js";

async function run() {
  console.log("🚀 Starting database migration for new translatable landing page section copy...");
  
  const translations = [
    // 🏢 Trusted Companies
    { code: 'EN', key: 'trusted_title', value: 'Trusted by Innovative Companies Worldwide' },
    { code: 'AR', key: 'trusted_title', value: 'محل ثقة من الشركات المبتكرة عالمياً' },
    { code: 'FR', key: 'trusted_title', value: 'Recommandé par des entreprises innovantes du monde entier' },
    { code: 'DE', key: 'trusted_title', value: 'Weltweit von innovativen Unternehmen empfohlen' },

    // 🗂️ Categories Title
    { code: 'EN', key: 'categories_title', value: 'Browse Popular Categories' },
    { code: 'AR', key: 'categories_title', value: 'تصفح الفئات الشائعة' },
    { code: 'FR', key: 'categories_title', value: 'Parcourir les catégories populaires' },
    { code: 'DE', key: 'categories_title', value: 'Beliebte Kategorien durchsuchen' },

    // 🌟 Featured Freelancers Section
    { code: 'EN', key: 'featured_title', value: 'Featured Freelancers' },
    { code: 'AR', key: 'featured_title', value: 'مستقلون مميزون' },
    { code: 'FR', key: 'featured_title', value: 'Freelances vedettes' },
    { code: 'DE', key: 'featured_title', value: 'Vorgestellte Freelancer' },

    { code: 'EN', key: 'featured_subtitle', value: 'Top-rated professionals ready to start immediately.' },
    { code: 'AR', key: 'featured_subtitle', value: 'محترفون ذوو تقييم عالٍ مستعدون للبدء فوراً.' },
    { code: 'FR', key: 'featured_subtitle', value: 'Des professionnels hautement qualifiés prêts à démarrer immédiatement.' },
    { code: 'DE', key: 'featured_subtitle', value: 'Erstklassige Profis, die sofort einsatzbereit sind.' },

    { code: 'EN', key: 'featured_btn', value: 'See all' },
    { code: 'AR', key: 'featured_btn', value: 'عرض الكل' },
    { code: 'FR', key: 'featured_btn', value: 'Voir tout' },
    { code: 'DE', key: 'featured_btn', value: 'Alle ansehen' },

    // 🛠️ Popular Services
    { code: 'EN', key: 'popular_services_title', value: 'Popular Services' },
    { code: 'AR', key: 'popular_services_title', value: 'الخدمات الشائعة' },
    { code: 'FR', key: 'popular_services_title', value: 'Services populaires' },
    { code: 'DE', key: 'popular_services_title', value: 'Beliebte Dienstleistungen' },

    // 💡 Why Choose Section
    { code: 'EN', key: 'why_choose_title', value: 'Why Choose Freelancer?' },
    { code: 'AR', key: 'why_choose_title', value: 'لماذا تختار منصة المستقل؟' },
    { code: 'FR', key: 'why_choose_title', value: 'Pourquoi choisir Freelancer?' },
    { code: 'DE', key: 'why_choose_title', value: 'Warum Freelancer wählen?' },

    { code: 'EN', key: 'why_choose_subtitle', value: 'We provide a seamless experience to find, hire, and manage top freelance talent globally.' },
    { code: 'AR', key: 'why_choose_subtitle', value: 'نحن نقدم تجربة سلسة للعثور على أفضل المواهب المستقلة وتوظيفها وإدارتها عالميًا.' },
    { code: 'FR', key: 'why_choose_subtitle', value: 'Nous offrons une expérience fluide pour trouver, embaucher et gérer les meilleurs talents indépendants à l\'échelle mondiale.' },
    { code: 'DE', key: 'why_choose_subtitle', value: 'Wir bieten eine nahtlose Erfahrung, um weltweit erstklassige freiberufliche Talente zu finden, einzustellen und zu verwalten.' },

    // Why Choose Features
    { code: 'EN', key: 'why_choose_feat1_title', value: 'Verified Talent' },
    { code: 'AR', key: 'why_choose_feat1_title', value: 'مواهب موثقة' },
    { code: 'FR', key: 'why_choose_feat1_title', value: 'Talents vérifiés' },
    { code: 'DE', key: 'why_choose_feat1_title', value: 'Geprüfte Talente' },

    { code: 'EN', key: 'why_choose_feat1_desc', value: 'Every freelancer undergoes a rigorous vetting process to ensure top quality.' },
    { code: 'AR', key: 'why_choose_feat1_desc', value: 'يخضع كل مستقل لعملية فحص صارمة لضمان الجودة العالية.' },
    { code: 'FR', key: 'why_choose_feat1_desc', value: 'Chaque freelance est soumis à un processus de sélection rigoureux pour garantir une qualité optimale.' },
    { code: 'DE', key: 'why_choose_feat1_desc', value: 'Jeder Freelancer durchläuft einen strengen Überprüfungsprozess, um erstklassige Qualität zu gewährleisten.' },

    { code: 'EN', key: 'why_choose_feat2_title', value: 'AI Matching' },
    { code: 'AR', key: 'why_choose_feat2_title', value: 'مطابقة بالذكاء الاصطناعي' },
    { code: 'FR', key: 'why_choose_feat2_title', value: 'Correspondance IA' },
    { code: 'DE', key: 'why_choose_feat2_title', value: 'KI-Matching' },

    { code: 'EN', key: 'why_choose_feat2_desc', value: 'Our smart algorithms connect you with the perfect fit for your specific project needs.' },
    { code: 'AR', key: 'why_choose_feat2_desc', value: 'تربطك خوارزمياتنا الذكية بالشخص المناسب تماماً لاحتياجات مشروعك المحددة.' },
    { code: 'FR', key: 'why_choose_feat2_desc', value: 'Nos algorithmes intelligents vous connectent avec le profil parfait pour les besoins spécifiques de votre projet.' },
    { code: 'DE', key: 'why_choose_feat2_desc', value: 'Unsere intelligenten Algorithmen verbinden Sie mit der perfekten Besetzung für Ihre spezifischen Projektanforderungen.' },

    { code: 'EN', key: 'why_choose_feat3_title', value: 'Secure Payments' },
    { code: 'AR', key: 'why_choose_feat3_title', value: 'مدفوعات آمنة' },
    { code: 'FR', key: 'why_choose_feat3_title', value: 'Paiements sécurisés' },
    { code: 'DE', key: 'why_choose_feat3_title', value: 'Sichere Zahlungen' },

    { code: 'EN', key: 'why_choose_feat3_desc', value: 'Funds are held in escrow and only released when you are 100% satisfied.' },
    { code: 'AR', key: 'why_choose_feat3_desc', value: 'يتم حفظ الأموال في حساب الضمان ولا يتم إصدارها إلا عندما تكون راضيًا بنسبة 100%.' },
    { code: 'FR', key: 'why_choose_feat3_desc', value: 'Les fonds sont conservés sous séquestre et ne sont libérés que lorsque vous êtes satisfait à 100%.' },
    { code: 'DE', key: 'why_choose_feat3_desc', value: 'Gelder werden auf einem Treuhandkonto verwahrt und erst freigegeben, wenn Sie zu 100 % zufrieden sind.' },

    { code: 'EN', key: 'why_choose_feat4_title', value: '24/7 Support' },
    { code: 'AR', key: 'why_choose_feat4_title', value: 'دعم على مدار الساعة' },
    { code: 'FR', key: 'why_choose_feat4_title', value: 'Support 24/7' },
    { code: 'DE', key: 'why_choose_feat4_title', value: 'Support rund um die Uhr' },

    { code: 'EN', key: 'why_choose_feat4_desc', value: 'Our dedicated team is always available to help you with any questions or issues.' },
    { code: 'AR', key: 'why_choose_feat4_desc', value: 'فريقنا المخصص متاح دائماً لمساعدتك في أي أسئلة أو مشكلات.' },
    { code: 'FR', key: 'why_choose_feat4_desc', value: 'Notre équipe dédiée est toujours disponible pour vous aider pour toute question ou problème.' },
    { code: 'DE', key: 'why_choose_feat4_desc', value: 'Unser engagiertes Team steht Ihnen bei Fragen oder Problemen jederzeit zur Verfügung.' },

    { code: 'EN', key: 'why_choose_feat5_title', value: 'Fast Hiring' },
    { code: 'AR', key: 'why_choose_feat5_title', value: 'توظيف سريع' },
    { code: 'FR', key: 'why_choose_feat5_title', value: 'Embauche rapide' },
    { code: 'DE', key: 'why_choose_feat5_title', value: 'Schnelle Einstellung' },

    { code: 'EN', key: 'why_choose_feat5_desc', value: 'Hire a professional and start working on your project within hours, not weeks.' },
    { code: 'AR', key: 'why_choose_feat5_desc', value: 'يتم توظيف محترف والبدء في العمل بمشروعك خلال ساعات وليس أسابيع.' },
    { code: 'FR', key: 'why_choose_feat5_desc', value: 'Embauchez un professionnel et commencez à travailler sur votre projet en quelques heures, pas en quelques semaines.' },
    { code: 'DE', key: 'why_choose_feat5_desc', value: 'Stellen Sie einen Fachmann ein und beginnen Sie innerhalb von Stunden mit der Arbeit an Ihrem Projekt.' },

    { code: 'EN', key: 'why_choose_feat6_title', value: 'Seamless Collaboration' },
    { code: 'AR', key: 'why_choose_feat6_title', value: 'تعاون سلس' },
    { code: 'FR', key: 'why_choose_feat6_title', value: 'Collaboration fluide' },
    { code: 'DE', key: 'why_choose_feat6_title', value: 'Nahtlose Zusammenarbeit' },

    { code: 'EN', key: 'why_choose_feat6_desc', value: 'Built-in workspace tools for easy communication and file sharing.' },
    { code: 'AR', key: 'why_choose_feat6_desc', value: 'أدوات مساحة عمل مدمجة لسهولة التواصل ومشاركة الملفات.' },
    { code: 'FR', key: 'why_choose_feat6_desc', value: 'Outils d\'espace de travail intégrés pour une communication et un partage de fichiers faciles.' },
    { code: 'DE', key: 'why_choose_feat6_desc', value: 'Integrierte Workspace-Tools für einfache Kommunikation und Dateifreigabe.' },

    // ⚙️ How it Works
    { code: 'EN', key: 'how_it_works_title', value: 'How It Works' },
    { code: 'AR', key: 'how_it_works_title', value: 'كيف يعمل' },
    { code: 'FR', key: 'how_it_works_title', value: 'Comment ça marche' },
    { code: 'DE', key: 'how_it_works_title', value: 'Wie es funktioniert' },

    { code: 'EN', key: 'how_it_works_step1_title', value: 'Post a Job' },
    { code: 'AR', key: 'how_it_works_step1_title', value: 'نشر وظيفة' },
    { code: 'FR', key: 'how_it_works_step1_title', value: 'Publier un emploi' },
    { code: 'DE', key: 'how_it_works_step1_title', value: 'Einen Job posten' },

    { code: 'EN', key: 'how_it_works_step1_desc', value: 'Describe your project.' },
    { code: 'AR', key: 'how_it_works_step1_desc', value: 'صف مشروعك الخاص.' },
    { code: 'FR', key: 'how_it_works_step1_desc', value: 'Décrivez votre projet.' },
    { code: 'DE', key: 'how_it_works_step1_desc', value: 'Beschreiben Sie Ihr Projekt.' },

    { code: 'EN', key: 'how_it_works_step2_title', value: 'Get Matched' },
    { code: 'AR', key: 'how_it_works_step2_title', value: 'الحصول على مطابقة' },
    { code: 'FR', key: 'how_it_works_step2_title', value: 'Trouver un match' },
    { code: 'DE', key: 'how_it_works_step2_title', value: 'Passende Talente finden' },

    { code: 'EN', key: 'how_it_works_step2_desc', value: 'AI finds the best talent.' },
    { code: 'AR', key: 'how_it_works_step2_desc', value: 'الذكاء الاصطناعي يجد أفضل المواهب.' },
    { code: 'FR', key: 'how_it_works_step2_desc', value: 'L\'IA trouve les meilleurs talents.' },
    { code: 'DE', key: 'how_it_works_step2_desc', value: 'KI findet die besten Talente.' },

    { code: 'EN', key: 'how_it_works_step3_title', value: 'Compare' },
    { code: 'AR', key: 'how_it_works_step3_title', value: 'مقارنة' },
    { code: 'FR', key: 'how_it_works_step3_title', value: 'Comparer' },
    { code: 'DE', key: 'how_it_works_step3_title', value: 'Vergleichen' },

    { code: 'EN', key: 'how_it_works_step3_desc', value: 'Review profiles & proposals.' },
    { code: 'AR', key: 'how_it_works_step3_desc', value: 'مراجعة الملفات الشخصية والعروض.' },
    { code: 'FR', key: 'how_it_works_step3_desc', value: 'Examinez les profils et les propositions.' },
    { code: 'DE', key: 'how_it_works_step3_desc', value: 'Profile und Angebote prüfen.' },

    { code: 'EN', key: 'how_it_works_step4_title', value: 'Hire' },
    { code: 'AR', key: 'how_it_works_step4_title', value: 'توظيف' },
    { code: 'FR', key: 'how_it_works_step4_title', value: 'Embaucher' },
    { code: 'DE', key: 'how_it_works_step4_title', value: 'Einstellen' },

    { code: 'EN', key: 'how_it_works_step4_desc', value: 'Choose the right fit.' },
    { code: 'AR', key: 'how_it_works_step4_desc', value: 'اختر الشخص المناسب.' },
    { code: 'FR', key: 'how_it_works_step4_desc', value: 'Choisissez le bon candidat.' },
    { code: 'DE', key: 'how_it_works_step4_desc', value: 'Wählen Sie die passende Besetzung.' },

    { code: 'EN', key: 'how_it_works_step5_title', value: 'Collaborate' },
    { code: 'AR', key: 'how_it_works_step5_title', value: 'تعاون' },
    { code: 'FR', key: 'how_it_works_step5_title', value: 'Collaborer' },
    { code: 'DE', key: 'how_it_works_step5_title', value: 'Zusammenarbeiten' },

    { code: 'EN', key: 'how_it_works_step5_desc', value: 'Work and pay securely.' },
    { code: 'AR', key: 'how_it_works_step5_desc', value: 'العمل والدفع بشكل آمن.' },
    { code: 'FR', key: 'how_it_works_step5_desc', value: 'Travaillez et payez en toute sécurité.' },
    { code: 'DE', key: 'how_it_works_step5_desc', value: 'Sicher arbeiten und bezahlen.' }
  ];

  try {
    for (const t of translations) {
      await pool.query(
        `INSERT INTO translations (language_code, key, value) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (language_code, key) 
         DO UPDATE SET value = EXCLUDED.value`,
        [t.code, t.key, t.value]
      );
    }
    console.log("✅ Seeded/Updated translatable landing page sections successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
