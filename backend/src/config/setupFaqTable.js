import pool from "./db.js";

async function run() {
  console.log("🚀 Creating faq_items table and seeding default FAQ translations...");
  try {
    // 1. Create faq_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS faq_items (
        faq_id SERIAL PRIMARY KEY,
        key_suffix VARCHAR(50) UNIQUE NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'faq_items' table created successfully.");

    // 2. Check if already seeded
    const countCheck = await pool.query("SELECT COUNT(*) FROM faq_items");
    if (parseInt(countCheck.rows[0].count) === 0) {
      // Insert default items
      await pool.query(`
        INSERT INTO faq_items (key_suffix, sort_order) VALUES
        ('1', 1),
        ('2', 2),
        ('3', 3),
        ('4', 4)
      `);

      const faqsSeed = [
        // FAQ 1
        { code: 'EN', key: 'faq_q_1', value: 'How do you vet freelancers?' },
        { code: 'EN', key: 'faq_a_1', value: 'We conduct a rigorous multi-stage screening process including identity checks, detailed portfolio verification, technical tests, and soft skills assessments. Only the top 3% of professionals who apply are admitted to ensure elite execution quality on Freelancer.' },
        { code: 'AR', key: 'faq_q_1', value: 'كيف تقوم بفحص وتدقيق المستقلين؟' },
        { code: 'AR', key: 'faq_a_1', value: 'نقوم بعملية فحص صارمة متعددة المراحل تشمل التحقق من الهوية، والتحقق المفصل من محفظة الأعمال، والاختبارات الفنية، وتقييمات المهارات الشخصية. يتم قبول أفضل 3٪ فقط من المهنيين الذين يتقدمون بطلبات لضمان جودة النخبة على المنصة.' },
        { code: 'FR', key: 'faq_q_1', value: 'Comment évaluez-vous les freelances ?' },
        { code: 'FR', key: 'faq_a_1', value: 'Nous menons un processus de sélection rigoureux en plusieurs étapes comprenant des vérifications d\'identité, une vérification détaillée du portefeuille, des tests techniques et des évaluations de compétences générales. Seuls les 3 % supérieurs des professionnels qui postulent sont admis pour garantir une exécution de qualité.' },
        { code: 'DE', key: 'faq_q_1', value: 'Wie überprüfen Sie Freelancer?' },
        { code: 'DE', key: 'faq_a_1', value: 'Wir führen einen strengen mehrstufigen Screening-Prozess durch, der Identitätsprüfungen, detaillierte Portfolio-Verifizierungen, technische Tests und Bewertungen der Soft Skills umfasst. Nur die besten 3 % der Profis, die sich bewerben, werden zugelassen.' },

        // FAQ 2
        { code: 'EN', key: 'faq_q_2', value: 'How does the escrow system work?' },
        { code: 'EN', key: 'faq_a_2', value: 'When you start a project milestone, the payment is deposited securely into our system escrow account. The funds are held safely by Freelancer and are only released to the developer once you review and approve the completed milestone deliverables.' },
        { code: 'AR', key: 'faq_q_2', value: 'كيف يعمل نظام الضمان (الضمان المالي)؟' },
        { code: 'AR', key: 'faq_a_2', value: 'عندما تبدأ مرحلة من مراحل المشروع، يتم إيداع المبلغ بأمان في حساب الضمان الخاص بنا. يتم الاحتفاظ بالأموال بأمان بواسطة المنصة ولا يتم تحريرها للمطور إلا بمجرد مراجعة وتأكيد تسليمات المرحلة والموافقة عليها.' },
        { code: 'FR', key: 'faq_q_2', value: 'Comment fonctionne le système de séquestre ?' },
        { code: 'FR', key: 'faq_a_2', value: 'Lorsque vous démarrez un jalon de projet, le paiement est déposé en toute sécurité sur notre compte de séquestre. Les fonds sont conservés en toute sécurité par Freelancer et ne sont versés au développeur qu\'une fois que vous avez examiné et approuvé les livrables.' },
        { code: 'DE', key: 'faq_q_2', value: 'Wie funktioniert das Treuhand-System?' },
        { code: 'DE', key: 'faq_a_2', value: 'Wenn Sie einen Projektmeilenstein starten, wird die Zahlung sicher auf unserem Treuhandkonto hinterlegt. Die Gelder werden von Freelancer sicher verwahrt und erst an den Entwickler freigegeben, wenn Sie die Meilensteinergebnisse überprüft haben.' },

        // FAQ 3
        { code: 'EN', key: 'faq_q_3', value: 'Can I cancel a project?' },
        { code: 'EN', key: 'faq_a_3', value: 'Yes, you can cancel a contract at any point before work begins or if milestones are not met. Funds still held in escrow are returned to the client according to our cancellation policies and dispute resolution framework.' },
        { code: 'AR', key: 'faq_q_3', value: 'هل يمكنني إلغاء المشروع؟' },
        { code: 'AR', key: 'faq_a_3', value: 'نعم، يمكنك إلغاء العقد في أي وقت قبل بدء العمل أو إذا لم يتم تلبية شروط المراحل. يتم إرجاع الأموال التي لا تزال محتجزة في الضمان إلى العميل وفقًا لسياسات الإلغاء وإطار حل النزاعات الخاص بنا.' },
        { code: 'FR', key: 'faq_q_3', value: 'Puis-je annuler un projet ?' },
        { code: 'FR', key: 'faq_a_3', value: 'Oui, vous pouvez annuler un contrat à tout moment avant le début des travaux ou si les jalons ne sont pas atteints. Les fonds encore bloqués sur le compte séquestre sont restitués au client conformément à nos politiques d\'annulation.' },
        { code: 'DE', key: 'faq_q_3', value: 'Kann ich ein Projekt stornieren?' },
        { code: 'DE', key: 'faq_a_3', value: 'Ja, Sie können einen Vertrag jederzeit kündigen, bevor die Arbeit beginnt oder wenn Meilensteine nicht erreicht werden. Noch auf dem Treuhandkonto befindliche Gelder werden gemäß unseren Richtlinien an den Kunden zurückgezahlt.' },

        // FAQ 4
        { code: 'EN', key: 'faq_q_4', value: 'What if I\'m not satisfied with the work?' },
        { code: 'EN', key: 'faq_a_4', value: 'Freelancer provides dedicated dispute resolution support. If any deliverable does not match the agreed-upon contract specifications, you can raise a dispute, and our review team will step in to mediate, issue refunds, or arrange revisions as appropriate.' },
        { code: 'AR', key: 'faq_q_4', value: 'ماذا لو لم أكن راضيًا عن العمل؟' },
        { code: 'AR', key: 'faq_a_4', value: 'توفر المنصة دعمًا مخصصًا لحل النزاعات. إذا كان أي تسليم لا يطابق مواصفات العقد المتفق عليها، يمكنك رفع نزاع، وسيتدخل فريق المراجعة لدينا للتوسط أو إصدار المبالغ المستردة أو الترتيب للمراجعات حسب الاقتضاء.' },
        { code: 'FR', key: 'faq_q_4', value: 'Et si je ne suis pas satisfait du travail ?' },
        { code: 'FR', key: 'faq_a_4', value: 'Freelancer fournit un support dédié à la résolution des litiges. Si un livrable ne correspond pas aux spécifications du contrat convenu, vous pouvez soumettre un litige et notre équipe interviendra pour arbitrer ou effectuer des remboursements.' },
        { code: 'DE', key: 'faq_q_4', value: 'Was passiert, wenn ich mit der Arbeit nicht zufrieden bin?' },
        { code: 'DE', key: 'faq_a_4', value: 'Freelancer bietet eine engagierte Unterstützung bei der Konfliktlösung. Wenn ein Ergebnis nicht den vereinbarten Vertragsspezifikationen entspricht, können Sie einen Streitfall eröffnen. Unser Team wird dann vermitteln.' }
      ];

      for (const t of faqsSeed) {
        await pool.query(
          `INSERT INTO translations (language_code, key, value) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (language_code, key) 
           DO UPDATE SET value = EXCLUDED.value`,
          [t.code, t.key, t.value]
        );
      }
      console.log("🌱 Seeded 4 default FAQ items and translations.");
    }
  } catch (err) {
    console.error("❌ FAQ table setup failed:", err);
  } finally {
    pool.end();
  }
}

run();
