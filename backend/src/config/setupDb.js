import pool from "./db.js";

async function setupTables() {
  try {
    console.log("⏳ Initializing database tables...");

    // Create currencies table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS currencies (
        currency_id SERIAL PRIMARY KEY,
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        symbol VARCHAR(10) NOT NULL,
        rate DOUBLE PRECISION DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'currencies' table ready.");

    // Seed currencies if table is empty
    const currCheck = await pool.query("SELECT COUNT(*) FROM currencies");
    if (parseInt(currCheck.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO currencies (code, name, symbol, rate) VALUES
        ('USD', 'US Dollar', '$', 1.0),
        ('INR', 'Indian Rupee', '₹', 83.5),
        ('EUR', 'Euro', '€', 0.92),
        ('GBP', 'British Pound', '£', 0.78)
      `);
      console.log("🌱 Seeded default currencies (USD, INR, EUR, GBP) with rates.");
    }

    // Create gigs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gigs (
        gig_id SERIAL PRIMARY KEY,
        freelancer_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
        sub_category_id INTEGER REFERENCES sub_categories(sub_category_id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price NUMERIC NOT NULL,
        currency_id INTEGER REFERENCES currencies(currency_id) ON DELETE SET NULL,
        delivery_days INTEGER NOT NULL DEFAULT 3,
        revisions INTEGER DEFAULT 3,
        images JSONB,
        video_url TEXT,
        documents JSONB,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'gigs' table ready.");

    // Create gig_skills junction table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gig_skills (
        gig_id INTEGER NOT NULL REFERENCES gigs(gig_id) ON DELETE CASCADE,
        skill_id INTEGER NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
        PRIMARY KEY (gig_id, skill_id)
      )
    `);
    console.log("✅ 'gig_skills' table ready.");

    // Create jobs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        job_id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
        sub_category_id INTEGER REFERENCES sub_categories(sub_category_id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        budget NUMERIC NOT NULL,
        experience_level VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Open',
        project_type VARCHAR(50) DEFAULT 'Fixed',
        milestone_type VARCHAR(50) DEFAULT 'Fixed',
        min_budget NUMERIC,
        max_budget NUMERIC,
        duration VARCHAR(100),
        location VARCHAR(100) DEFAULT 'Remote',
        num_freelancers VARCHAR(50),
        skills JSONB,
        languages JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'jobs' table ready.");

    // Run migrations to alter existing jobs table with new columns if they do not exist
    await pool.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'Fixed',
      ADD COLUMN IF NOT EXISTS milestone_type VARCHAR(50) DEFAULT 'Fixed',
      ADD COLUMN IF NOT EXISTS min_budget NUMERIC,
      ADD COLUMN IF NOT EXISTS max_budget NUMERIC,
      ADD COLUMN IF NOT EXISTS duration VARCHAR(100),
      ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT 'Remote',
      ADD COLUMN IF NOT EXISTS num_freelancers VARCHAR(50),
      ADD COLUMN IF NOT EXISTS skills JSONB,
      ADD COLUMN IF NOT EXISTS languages JSONB,
      ADD COLUMN IF NOT EXISTS max_hours INTEGER,
      ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(50)
    `);
    console.log("✅ 'jobs' table columns migrated successfully.");

    // Create contracts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contracts (
        contract_id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        freelancer_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        job_id INTEGER REFERENCES jobs(job_id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        budget NUMERIC NOT NULL,
        status VARCHAR(50) DEFAULT 'Hired',
        progress INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        work_started_at TIMESTAMP NULL,
        submitted_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        disputed_at TIMESTAMP NULL,
        cancelled_at TIMESTAMP NULL,
        submitted_files TEXT NULL
      )
    `);
    console.log("✅ 'contracts' table ready.");

    // Create gig_applications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gig_applications (
        application_id SERIAL PRIMARY KEY,
        gig_id INTEGER NOT NULL REFERENCES gigs(gig_id) ON DELETE CASCADE,
        client_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        requirements TEXT NOT NULL,
        price NUMERIC NOT NULL,
        currency_id INTEGER REFERENCES currencies(currency_id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'gig_applications' table ready.");

    // Create proposals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS proposals (
        proposal_id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
        freelancer_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        cover_letter TEXT NOT NULL,
        bid_amount NUMERIC NOT NULL,
        delivery_days INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (job_id, freelancer_id)
      )
    `);
    console.log("✅ 'proposals' table ready.");

    // Run migrations to alter existing proposals table with new columns if they do not exist
    await pool.query(`
      ALTER TABLE proposals 
      ADD COLUMN IF NOT EXISTS milestones JSONB,
      ADD COLUMN IF NOT EXISTS initiated_by VARCHAR(50) DEFAULT 'freelancer'
    `);
    console.log("✅ 'proposals' table columns migrated successfully.");

    // Create conversations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        conversation_id SERIAL PRIMARY KEY,
        user_one_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        user_two_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_chat UNIQUE (user_one_id, user_two_id)
      )
    `);
    console.log("✅ 'conversations' table ready.");

    // Create messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        message_id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        message_text TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'messages' table ready.");

    // Create notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'system',
        reference_id VARCHAR(100),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'notifications' table ready.");

    // Create wallets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        wallet_id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
        is_system BOOLEAN DEFAULT FALSE,
        balance NUMERIC NOT NULL DEFAULT 0.00,
        currency VARCHAR(10) DEFAULT 'USD',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'wallets' table ready.");

    // Seed system wallet
    const systemWalletCheck = await pool.query("SELECT COUNT(*) FROM wallets WHERE is_system = TRUE");
    if (parseInt(systemWalletCheck.rows[0].count) === 0) {
      await pool.query("INSERT INTO wallets (user_id, is_system, balance, currency) VALUES (NULL, TRUE, 0.00, 'USD')");
      console.log("🌱 Seeded platform escrow wallet.");
    }

    // Create wallet_transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        transaction_id SERIAL PRIMARY KEY,
        sender_wallet_id INTEGER REFERENCES wallets(wallet_id) ON DELETE SET NULL,
        receiver_wallet_id INTEGER REFERENCES wallets(wallet_id) ON DELETE SET NULL,
        amount NUMERIC NOT NULL,
        commission_amount NUMERIC DEFAULT 0.00,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'Completed',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'wallet_transactions' table ready.");

    // Create withdrawal_requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS withdrawal_requests (
        request_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        wallet_id INTEGER NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
        amount NUMERIC NOT NULL,
        payment_method VARCHAR(100) NOT NULL,
        account_details TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'withdrawal_requests' table ready.");
    // Add vetting_status, bio, and seo columns to freelancer_profiles if not exists
    await pool.query(`
      ALTER TABLE freelancer_profiles
      ADD COLUMN IF NOT EXISTS vetting_status VARCHAR(50) DEFAULT 'Pending',
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS seo JSONB DEFAULT NULL
    `);
    console.log("✅ 'freelancer_profiles.vetting_status', 'bio', and 'seo' columns ready.");

    // Create cms_pages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cms_pages (
        page_id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'Draft',
        content_type VARCHAR(50) DEFAULT 'Builder',
        content TEXT NOT NULL,
        seo JSONB DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'cms_pages' table ready.");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS languages (
        language_id SERIAL PRIMARY KEY,
        language_name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      ALTER TABLE languages 
      ADD COLUMN IF NOT EXISTS code VARCHAR(10) UNIQUE,
      ADD COLUMN IF NOT EXISTS direction VARCHAR(10) DEFAULT 'LTR',
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active',
      ADD COLUMN IF NOT EXISTS is_site_lang BOOLEAN DEFAULT FALSE
    `);
    console.log("✅ 'languages' table columns migrated successfully.");

    // Create translations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS translations (
        translation_id SERIAL PRIMARY KEY,
        language_code VARCHAR(10) NOT NULL,
        key VARCHAR(255) NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_lang_key UNIQUE (language_code, key)
      )
    `);
    console.log("✅ 'translations' table ready.");

    // Create subscription_plans table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        plan_id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        period VARCHAR(50),
        features JSONB NOT NULL,
        button_text VARCHAR(50) NOT NULL,
        is_popular BOOLEAN DEFAULT FALSE,
        is_current BOOLEAN DEFAULT FALSE,
        plan_role VARCHAR(50) DEFAULT 'seller',
        plan_type VARCHAR(50) DEFAULT 'Day(s)',
        plan_duration INTEGER DEFAULT 30,
        credits INTEGER DEFAULT 10,
        profile_featured_duration INTEGER DEFAULT 0,
        featured_project_limit INTEGER DEFAULT 0,
        featured_project_duration INTEGER DEFAULT 0,
        badge_image TEXT,
        is_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT subscription_plans_name_role_key UNIQUE (name, plan_role)
      )
    `);
    console.log("✅ 'subscription_plans' table ready.");

    // Create faq_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS faq_items (
        faq_id SERIAL PRIMARY KEY,
        key_suffix VARCHAR(50) UNIQUE NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'faq_items' table ready.");

    // Create why_choose_features table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS why_choose_features (
        feature_id SERIAL PRIMARY KEY,
        key_suffix VARCHAR(50) UNIQUE NOT NULL,
        sort_order INT DEFAULT 0,
        icon_name VARCHAR(100) DEFAULT 'Shield',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'why_choose_features' table ready.");

    // Create how_it_works_steps table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS how_it_works_steps (
        step_id SERIAL PRIMARY KEY,
        key_suffix VARCHAR(50) UNIQUE NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'how_it_works_steps' table ready.");

    // Create user_languages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_languages (
        user_language_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        language_id INTEGER NOT NULL REFERENCES languages(language_id) ON DELETE CASCADE,
        proficiency VARCHAR(50) DEFAULT 'Basic',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, language_id)
      )
    `);
    await pool.query(`
      ALTER TABLE user_languages
      ADD COLUMN IF NOT EXISTS proficiency VARCHAR(50) DEFAULT 'Basic'
    `);
    console.log("✅ 'user_languages' table and 'proficiency' column ready.");

     // Create gig_application_milestones table
     await pool.query(`
       CREATE TABLE IF NOT EXISTS gig_application_milestones (
         id SERIAL PRIMARY KEY,
         application_id INTEGER NOT NULL REFERENCES gig_applications(application_id) ON DELETE CASCADE,
         title VARCHAR(255) NOT NULL,
         description TEXT,
         amount NUMERIC(15, 2) NOT NULL,
         start_date DATE,
         end_date DATE,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
       )
     `);
     console.log("✅ 'gig_application_milestones' table ready.");
 
     // Create contract_milestones table
     await pool.query(`
       CREATE TABLE IF NOT EXISTS contract_milestones (
         milestone_id SERIAL PRIMARY KEY,
         contract_id INTEGER NOT NULL REFERENCES contracts(contract_id) ON DELETE CASCADE,
         title VARCHAR(255) NOT NULL,
         description TEXT,
         amount NUMERIC(15, 2) NOT NULL,
         start_date DATE,
         end_date DATE,
         status VARCHAR(50) DEFAULT 'Pending',
         payment_status VARCHAR(50) DEFAULT 'Pending',
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
       )
     `);
     console.log("✅ 'contract_milestones' table ready.");

     // Migration: Ensure description columns exist for both tables
     await pool.query(`
       ALTER TABLE gig_application_milestones ADD COLUMN IF NOT EXISTS description TEXT;
     `);
      await pool.query(`
        ALTER TABLE contract_milestones ADD COLUMN IF NOT EXISTS description TEXT;
      `);
      await pool.query(`
        ALTER TABLE contract_milestones ADD COLUMN IF NOT EXISTS submitted_files TEXT;
      `);
      await pool.query(`
        ALTER TABLE contract_milestones ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0;
      `);
      console.log("✅ Milestone description, submitted_files, and revision_count columns migrated successfully.");

    // Alter contracts table to add application_id link
    await pool.query(`
      ALTER TABLE contracts
      ADD COLUMN IF NOT EXISTS application_id INTEGER REFERENCES gig_applications(application_id) ON DELETE SET NULL
    `);
    console.log("✅ 'contracts.application_id' column ready.");

    // Alter conversations to support admin mediation
    await pool.query(`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS admin_id INTEGER REFERENCES users(user_id) DEFAULT NULL
    `);
    console.log("✅ 'conversations.admin_id' column ready.");

    // Create disputes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS disputes (
        dispute_id SERIAL PRIMARY KEY,
        contract_id INTEGER NOT NULL REFERENCES contracts(contract_id) ON DELETE CASCADE,
        client_id INTEGER NOT NULL REFERENCES users(user_id),
        freelancer_id INTEGER NOT NULL REFERENCES users(user_id),
        conversation_id INTEGER NOT NULL REFERENCES conversations(conversation_id),
        status VARCHAR(50) NOT NULL DEFAULT 'Open',
        reason VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        escalated_at TIMESTAMP,
        resolved_at TIMESTAMP,
        resolution_type VARCHAR(50),
        resolution_details TEXT,
        buyer_refund_percentage NUMERIC(5,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'disputes' table ready.");

    // Alter disputes to support raised_by column
    await pool.query(`
      ALTER TABLE disputes ADD COLUMN IF NOT EXISTS raised_by VARCHAR(50) DEFAULT 'client';
    `);
    console.log("✅ 'disputes.raised_by' column ready.");

    // Seed default languages mapping
    await pool.query(`
      INSERT INTO languages (language_name, code, direction, status, is_site_lang) VALUES
      ('English', 'EN', 'LTR', 'Active', TRUE) ON CONFLICT (language_name) DO UPDATE SET code = 'EN', direction = 'LTR', status = 'Active', is_site_lang = TRUE
    `);
    await pool.query(`
      INSERT INTO languages (language_name, code, direction, status, is_site_lang) VALUES
      ('Arabic', 'AR', 'RTL', 'Active', TRUE) ON CONFLICT (language_name) DO UPDATE SET code = 'AR', direction = 'RTL', status = 'Active', is_site_lang = TRUE
    `);
    await pool.query(`
      INSERT INTO languages (language_name, code, direction, status, is_site_lang) VALUES
      ('French', 'FR', 'LTR', 'Active', TRUE) ON CONFLICT (language_name) DO UPDATE SET code = 'FR', direction = 'LTR', status = 'Active', is_site_lang = TRUE
    `);
    await pool.query(`
      INSERT INTO languages (language_name, code, direction, status, is_site_lang) VALUES
      ('German', 'DE', 'LTR', 'Active', TRUE) ON CONFLICT (language_name) DO UPDATE SET code = 'DE', direction = 'LTR', status = 'Active', is_site_lang = TRUE
    `);
    console.log("🌱 Seeded default languages (EN, AR, FR, DE).");

    // Seed translations if empty
    const transCount = await pool.query("SELECT COUNT(*) FROM translations");
    if (parseInt(transCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO translations (language_code, key, value) VALUES
        ('EN', 'home', 'Home'),
        ('EN', 'about_us', 'About Us'),
        ('EN', 'faq', 'FAQ'),
        ('EN', 'terms_conditions', 'Terms & Conditions'),
        ('EN', 'sign_in', 'Sign in'),
        ('EN', 'get_started', 'Get Started'),
        ('EN', 'dashboard', 'Dashboard'),
        ('EN', 'search_placeholder', 'Search jobs, freelancers, services...'),
        
        ('AR', 'home', 'الرئيسية'),
        ('AR', 'about_us', 'معلومات عنا'),
        ('AR', 'faq', 'الأسئلة الشائعة'),
        ('AR', 'terms_conditions', 'الشروط والأحكام'),
        ('AR', 'sign_in', 'تسجيل الدخول'),
        ('AR', 'get_started', 'ابدأ الآن'),
        ('AR', 'dashboard', 'لوحة التحكم'),
        ('AR', 'search_placeholder', 'ابحث عن وظائف، مستقلين، خدمات...'),
        
        ('FR', 'home', 'Accueil'),
        ('FR', 'about_us', 'À propos de nous'),
        ('FR', 'faq', 'FAQ'),
        ('FR', 'terms_conditions', 'Termes et Conditions'),
        ('FR', 'sign_in', 'Se connecter'),
        ('FR', 'get_started', 'Commencer'),
        ('FR', 'dashboard', 'Tableau de bord'),
        ('FR', 'search_placeholder', 'Rechercher des emplois, des freelances...'),
        
        ('DE', 'home', 'Startseite'),
        ('DE', 'about_us', 'Über uns'),
        ('DE', 'faq', 'Häufig gestellte Fragen'),
        ('DE', 'terms_conditions', 'Allgemeine Geschäftsbedingungen'),
        ('DE', 'sign_in', 'Einloggen'),
        ('DE', 'get_started', 'Loslegen'),
        ('DE', 'dashboard', 'Dashboard'),
        ('DE', 'search_placeholder', 'Suche nach Jobs, Freelancern, Dienstleistungen...'),

        ('EN', 'hero_badge', 'The Top 3% Global Freelancers'),
        ('EN', 'hero_title', 'Hire Expert Freelancers For Your Next Big Project'),
        ('EN', 'hero_subtitle', 'Connect with top-tier professionals. Execute faster with vetted talent tailored to your enterprise needs.'),
        ('EN', 'hero_search_placeholder', 'What skill are you looking for?'),
        ('EN', 'hero_search_btn', 'Search Talent'),
        ('EN', 'hero_popular_label', 'Popular: UI Design, React, AI Automation, SEO')
        ON CONFLICT DO NOTHING
      `);
      console.log("🌱 Seeded translation values for EN, AR, FR, DE.");
    }

    // Seed standard CMS pages
    const seedPages = [
      {
        title: "About Us",
        slug: "about-us",
        status: "Published",
        content_type: "Builder",
        content: JSON.stringify([
          {
            id: "about-t1",
            type: "Title",
            data: {
              title: "About Buy2Lancer",
              subtitle: "Connecting global talent with software challenges since 2026."
            }
          },
          {
            id: "about-r1",
            type: "RichText",
            data: {
              content: "<p>Welcome to Buy2Lancer, the world's leading premium freelance developer marketplace. We bridge the gap between visionary clients and elite engineering talent globally.</p><p>We believe that top-tier software production shouldn't be gated by geographical borders or complex contracting overheads. By building transparent milestone escrows and vetted qualification criteria, we ensure a secure environment for product execution.</p>"
            }
          },
          {
            id: "about-f1",
            type: "FeaturesGrid",
            data: {
              title: "Our Core Values",
              subtitle: "The principles that drive our community everyday.",
              features: [
                { title: "Commitment to Excellence", description: "We vet our freelancers thoroughly to deliver state-of-the-art results." },
                { title: "Transparency First", description: "Milestones and payment structures are explicitly tracked and secured." },
                { title: "Absolute Security", description: "Your IP and funds are protected at all stages by robust escrow vaults." }
              ]
            }
          }
        ])
      },
      {
        title: "FAQ",
        slug: "faq",
        status: "Published",
        content_type: "Builder",
        content: JSON.stringify([
          {
            id: "faq-t1",
            type: "Title",
            data: {
              title: "Frequently Asked Questions",
              subtitle: "Answers to common inquiries about workspace operations, payments, and safety."
            }
          },
          {
            id: "faq-f1",
            type: "FAQ",
            data: {
              title: "General Queries",
              items: [
                { q: "How does milestone escrow work?", a: "When a project is created, the client deposits project funds into our escrow vault. The funds are securely held and automatically released to the freelancer only after the client reviews and approves the submitted deliverable." },
                { q: "What is the vetting process for freelancers?", a: "Every freelancer undergoes a background assessment, portfolio review, and optional vetting interviews by our admin team before they can bid on high-tier projects." },
                { q: "How are disputes resolved?", a: "If a conflict arises regarding milestone completeness, either party can file a dispute. Our neutral admin mediation team reviews submissions and decides on a fair disbursement." }
              ]
            }
          },
          {
            id: "faq-c1",
            type: "CTA",
            data: {
              title: "Still have questions?",
              description: "Our friendly customer success agents are available 24/7 to resolve complex cases.",
              buttonText: "Contact Support",
              buttonLink: "/contact"
            }
          }
        ])
      },
      {
        title: "Careers",
        slug: "careers",
        status: "Published",
        content_type: "Builder",
        content: JSON.stringify([
          {
            id: "car-t1",
            type: "Title",
            data: {
              title: "Careers at Buy2Lancer",
              subtitle: "Shape the future of global online collaboration."
            }
          },
          {
            id: "car-r1",
            type: "RichText",
            data: {
              content: "<p>We are a distributed remote team of developers, designers, and customer success heroes. We build the infrastructure that empowers millions of freelancers around the globe to support their households.</p><p>We value ownership, open communication, and high-agency execution. If you thrive under autonomy and enjoy solving scale challenges, we would love to have you on board.</p>"
            }
          },
          {
            id: "car-f1",
            type: "FeaturesGrid",
            data: {
              title: "Perks & Benefits",
              subtitle: "Why you will love working here.",
              features: [
                { title: "100% Remote Work", description: "Work from anywhere in the world. Set your own flexible schedule." },
                { title: "Competitive Equity", description: "We offer stock options and salary packages matching Silicon Valley standards." },
                { title: "Learning Budgets", description: "Get up to $2,000 annually for courses, bootcamps, and professional books." }
              ]
            }
          },
          {
            id: "car-c1",
            type: "CTA",
            data: {
              title: "Want to build with us?",
              description: "Send your portfolio and cv to our recruitment division directly.",
              buttonText: "Email CV",
              buttonLink: "mailto:careers@buy2lancer.com"
            }
          }
        ])
      },
      {
        title: "Contact",
        slug: "contact",
        status: "Published",
        content_type: "Builder",
        content: JSON.stringify([
          {
            id: "con-t1",
            type: "Title",
            data: {
              title: "Contact Us",
              subtitle: "Have an inquiry? We would love to hear from you."
            }
          },
          {
            id: "con-r1",
            type: "RichText",
            data: {
              content: "<p>Our global operations team is dedicated to providing high-quality assistance around the clock.</p><p><strong>Customer Support:</strong> support@buy2lancer.com<br/><strong>Business Partnerships:</strong> partners@buy2lancer.com<br/><strong>HQ Office:</strong> 100 Pine Street, San Francisco, CA 94111, USA</p><p>Expected email response times are under 4 hours for standard accounts.</p>"
            }
          }
        ])
      },
      {
        title: "Terms and Conditions",
        slug: "terms-conditions",
        status: "Published",
        content_type: "Builder",
        content: JSON.stringify([
          {
            id: "trm-t1",
            type: "Title",
            data: {
              title: "Terms and Conditions",
              subtitle: "Last revised: June 2026"
            }
          },
          {
            id: "trm-r1",
            type: "RichText",
            data: {
              content: "<h3>1. Platform Registration</h3><p>By registering a client or freelancer account on Buy2Lancer, you agree to supply authentic details and keep your access credentials secure.</p><h3>2. Payments & Milestone Escrow</h3><p>Clients are required to fund milestone escrows before work starts. Freelancers deliver products on-platform. Releasing escrows constitutes confirmation that deliverables conform to terms.</p><h3>3. Platform Fees</h3><p>We deduct a nominal platform service fee from successful milestone disbursements to cover dispute resolution mechanisms and payment processing fees.</p>"
            }
          }
        ])
      }
    ];

    for (const page of seedPages) {
      await pool.query(`
        INSERT INTO cms_pages (title, slug, status, content_type, content)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (slug) DO UPDATE
        SET title = $1, status = $3, content_type = $4, content = $5
      `, [page.title, page.slug, page.status, page.content_type, page.content]);
    }
    console.log("✅ Seed CMS pages inserted/updated successfully.");

    // Seed default currency and language settings
    const checkCurr = await pool.query("SELECT 1 FROM settings WHERE setting_key = 'default_currency'");
    if (checkCurr.rows.length === 0) {
      await pool.query("INSERT INTO settings (category, setting_key, setting_value) VALUES ('site_settings', 'default_currency', '{\"code\": \"USD\"}')");
    }
    const checkLang = await pool.query("SELECT 1 FROM settings WHERE setting_key = 'default_language'");
    if (checkLang.rows.length === 0) {
      await pool.query("INSERT INTO settings (category, setting_key, setting_value) VALUES ('site_settings', 'default_language', '{\"code\": \"EN\"}')");
    }
    const checkLimit = await pool.query("SELECT 1 FROM settings WHERE setting_key = 'pagination_limit'");
    if (checkLimit.rows.length === 0) {
      await pool.query("INSERT INTO settings (category, setting_key, setting_value) VALUES ('site_settings', 'pagination_limit', '{\"limit\": 10}')");
    }
    const checkProposalVetting = await pool.query("SELECT 1 FROM settings WHERE setting_key = 'enable_proposal_vetting'");
    if (checkProposalVetting.rows.length === 0) {
      await pool.query("INSERT INTO settings (category, setting_key, setting_value) VALUES ('site_settings', 'enable_proposal_vetting', '{\"enabled\": false}')");
    }
    const checkHero = await pool.query("SELECT 1 FROM settings WHERE setting_key = 'frontend_hero_content'");
    if (checkHero.rows.length === 0) {
      const defaultValue = {
        hero_badge: "The Top 3% Global Freelancers",
        hero_title: "Hire Expert Freelancers For Your Next Big Project",
        hero_subtitle: "Connect with top-tier professionals. Execute faster with vetted talent tailored to your enterprise needs.",
        hero_search_placeholder: "What skill are you looking for?",
        hero_search_btn: "Search Talent",
        hero_popular_label: "Popular: UI Design, React, AI Automation, SEO"
      };
      await pool.query(
        "INSERT INTO settings (category, setting_key, setting_value) VALUES ('frontend', 'frontend_hero_content', $1)",
        [JSON.stringify(defaultValue)]
      );
    }
    console.log("✅ Default currency, language, pagination, and hero content settings seeded.");

    // Seed default Stripe keys settings
    const checkStripe = await pool.query("SELECT 1 FROM settings WHERE setting_key = 'stripe_keys'");
    if (checkStripe.rows.length === 0) {
      const stripeDefaults = {
        public_key: "your_stripe_public_key",
        secret_key: "your_stripe_secret_key"
      };
      await pool.query(
        "INSERT INTO settings (category, setting_key, setting_value) VALUES ('payment', 'stripe_keys', $1)",
        [JSON.stringify(stripeDefaults)]
      );
    }

    // Seed default PayPal keys settings (overwrite or insert if not exists)
    const checkPaypal = await pool.query("SELECT 1 FROM settings WHERE setting_key = 'paypal_keys'");
    if (checkPaypal.rows.length === 0) {
      const paypalDefaults = {
        client_id: "your_paypal_client_id",
        secret_key: "your_paypal_secret_key"
      };
      await pool.query(
        "INSERT INTO settings (category, setting_key, setting_value) VALUES ('payment', 'paypal_keys', $1)",
        [JSON.stringify(paypalDefaults)]
      );
    } else {
      const paypalDefaults = {
        client_id: "your_paypal_client_id",
        secret_key: "your_paypal_secret_key"
      };
      await pool.query(
        "UPDATE settings SET setting_value = $1 WHERE setting_key = 'paypal_keys'",
        [JSON.stringify(paypalDefaults)]
      );
    }

    // Seed default site settings
    const checkSite = await pool.query("SELECT category FROM settings WHERE setting_key = 'site_settings'");
    if (checkSite.rows.length === 0) {
      const siteDefaults = {
        site_name: "Buy2Lancer",
        site_logo: "/public/logo.png"
      };
      await pool.query(
        "INSERT INTO settings (category, setting_key, setting_value) VALUES ('site_settings', 'site_settings', $1)",
        [JSON.stringify(siteDefaults)]
      );
    } else if (checkSite.rows[0].category !== "site_settings") {
      await pool.query("UPDATE settings SET category = 'site_settings' WHERE setting_key = 'site_settings'");
      console.log("♻️ Updated existing 'site_settings' category to 'site_settings'.");
    }

    // Seed default email settings
    const checkEmail = await pool.query("SELECT category FROM settings WHERE setting_key = 'email_settings'");
    if (checkEmail.rows.length === 0) {
      const emailDefaults = {
        email_id: "noreply@buy2lancer.com",
        smtp_host: "smtp",
        smtp_port: 2525,
        smtp_user: "test_user",
        smtp_pass: "test_pass"
      };
      await pool.query(
        "INSERT INTO settings (category, setting_key, setting_value) VALUES ('email_settings', 'email_settings', $1)",
        [JSON.stringify(emailDefaults)]
      );
    } else if (checkEmail.rows[0].category !== "email_settings") {
      await pool.query("UPDATE settings SET category = 'email_settings' WHERE setting_key = 'email_settings'");
      console.log("♻️ Updated existing 'email_settings' category to 'email_settings'.");
    }

    // Seed default dispute reasons settings
    const checkDisputesSetting = await pool.query("SELECT category FROM settings WHERE setting_key = 'dispute_reasons'");
    if (checkDisputesSetting.rows.length === 0) {
      const defaultReasons = [
        "Work not delivered",
        "Work quality is poor",
        "Requirements not followed",
        "Freelancer is unresponsive",
        "Delivery is incomplete",
        "Suspected fraud",
        "Other"
      ];
      await pool.query(
        "INSERT INTO settings (category, setting_key, setting_value) VALUES ('general', 'dispute_reasons', $1)",
        [JSON.stringify(defaultReasons)]
      );
    }

    const checkClientDisputes = await pool.query("SELECT category FROM settings WHERE setting_key = 'client_dispute_reasons'");
    if (checkClientDisputes.rows.length === 0) {
      const defaultClientReasons = [
        "Work not delivered",
        "Work quality is poor",
        "Requirements not followed",
        "Freelancer is unresponsive",
        "Delivery is incomplete",
        "Suspected fraud",
        "Other"
      ];
      await pool.query(
        "INSERT INTO settings (category, setting_key, setting_value) VALUES ('general', 'client_dispute_reasons', $1)",
        [JSON.stringify(defaultClientReasons)]
      );
    }

    const checkFreelancerDisputes = await pool.query("SELECT category FROM settings WHERE setting_key = 'freelancer_dispute_reasons'");
    if (checkFreelancerDisputes.rows.length === 0) {
      const defaultFreelancerReasons = [
        "Client is unresponsive",
        "Client refuses to release milestone payment",
        "Client is requesting out-of-scope work",
        "Milestone requirements met but not approved",
        "Other"
      ];
      await pool.query(
        "INSERT INTO settings (category, setting_key, setting_value) VALUES ('general', 'freelancer_dispute_reasons', $1)",
        [JSON.stringify(defaultFreelancerReasons)]
      );
    }

    // Seed default subscription plans if empty
    const checkPlans = await pool.query("SELECT COUNT(*) FROM subscription_plans");
    if (parseInt(checkPlans.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO subscription_plans (name, description, price, period, features, button_text, is_popular, is_current, plan_role, proposal_limit, job_posting_limit, featured_job_allowance, gig_discount_percent, credits, plan_type, plan_duration)
        VALUES 
        -- Freelancer Plans
        ('Starter', 'For individuals and small teams.', 0.00, '', '["Basic talent search", "Standard support", "5% transaction fee"]', 'Current Plan', FALSE, TRUE, 'seller', 5, 3, FALSE, 0, 5, 'Day(s)', 30),
        ('Professional', 'For growing businesses needing top talent.', 99.00, '/month', '["Advanced AI matching", "Priority 24/7 support", "2% transaction fee", "Dedicated account manager"]', 'Upgrade Now', TRUE, FALSE, 'seller', 20, 15, TRUE, 10, 50, 'Day(s)', 30),
        ('Enterprise', 'Custom solutions for large organizations.', 999.00, '/month', '["Unlimited talent search", "Dedicated success team", "0% transaction fee", "Custom API integration"]', 'Contact Sales', FALSE, FALSE, 'seller', 99999, 99999, TRUE, 20, 99999, 'Day(s)', 30),
        
        -- Client (Buyer) Plans
        ('Starter', 'For individuals and small business owners.', 0.00, '', '["3 Job Listings / month", "Standard Job Listings Visibility"]', 'Active Plan', FALSE, TRUE, 'buyer', 0, 3, FALSE, 0, 5, 'Day(s)', 30),
        ('Professional', 'For growing teams needing elite top talent.', 99.00, '/month', '["15 Job Listings / month", "Highlight & Feature Job Listings", "Priority Support"]', 'Upgrade Now', TRUE, FALSE, 'buyer', 0, 15, TRUE, 10, 50, 'Day(s)', 30),
        ('Enterprise', 'Dedicated recruitment solutions for large businesses.', 999.00, '/month', '["Unlimited Job Listings", "Highlight & Feature Job Listings", "Dedicated Success Manager"]', 'Contact Sales', FALSE, FALSE, 'buyer', 0, 99999, TRUE, 20, 99999, 'Day(s)', 30)
      `);
      console.log("🌱 Seeded default subscription plans (both Seller and Buyer tiers).");
    }

    // Add slug column to gigs
    await pool.query(`
      ALTER TABLE gigs ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
    `);
    console.log("✅ 'gigs.slug' column ready.");

    // Add plans column to gigs
    await pool.query(`
      ALTER TABLE gigs ADD COLUMN IF NOT EXISTS plans JSONB;
    `);
    console.log("✅ 'gigs.plans' column ready.");

    // Add slug column to users
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
    `);
    console.log("✅ 'users.slug' column ready.");

    // Create search_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS search_logs (
        log_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
        query_text VARCHAR(255) NOT NULL,
        search_type VARCHAR(50) NOT NULL,
        results_count INTEGER NOT NULL DEFAULT 0,
        device_type VARCHAR(50) DEFAULT 'Desktop',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'search_logs' table ready.");

    // Create seo_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seo_settings (
        seo_id SERIAL PRIMARY KEY,
        route_path VARCHAR(255) UNIQUE NOT NULL,
        meta_title VARCHAR(150) NOT NULL,
        meta_description VARCHAR(255) NOT NULL,
        meta_keywords VARCHAR(255),
        og_title VARCHAR(150),
        og_description VARCHAR(255),
        og_image VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'seo_settings' table ready.");

    // Seed default seo_settings
    const defaultSeoRoutes = [
      {
        path: '/',
        title: 'Buy2Lancer - Premium Freelance Services Marketplace',
        desc: 'Find and hire elite professional freelancers for your project. Buy custom services in Programming, AI, Copywriting, Design, and Marketing.',
        keywords: 'freelancer, freelance, contract development, custom software, graphics design',
        og_title: 'Buy2Lancer - The Freelance Service Marketplace',
        og_desc: 'Find and hire elite professional freelancers for your project.'
      },
      {
        path: '/gigs',
        title: 'Explore Custom Freelancer Gigs & Services | Buy2Lancer',
        desc: 'Browse thousands of premade custom gigs offered by expert freelancers. Order services in Web Design, Writing, Video Editing, and more.',
        keywords: 'buy services, buy gigs, order design, remote worker services',
        og_title: 'Explore Custom Freelancer Gigs | Buy2Lancer',
        og_desc: 'Browse thousands of premade custom gigs offered by expert freelancers.'
      },
      {
        path: '/projects',
        title: 'Find Custom Developer Projects & Client Jobs | Buy2Lancer',
        desc: 'Post your custom project or bid on available jobs posted by clients globally. Connect with active projects needing developer talent.',
        keywords: 'developer jobs, post projects, contract jobs, freelancer biddings',
        og_title: 'Find Developer Projects & Client Jobs | Buy2Lancer',
        og_desc: 'Post your custom project or bid on available jobs posted by clients.'
      },
      {
        path: '/blogs',
        title: 'Latest Freelance & Marketplace Industry Blogs | Buy2Lancer',
        desc: 'Stay informed with standard freelance tips, industry trends, client advice, and marketplace growth insights.',
        keywords: 'freelance blogs, marketing tips, freelancer advice, coding blogs',
        og_title: 'Latest Freelance & Marketplace Blogs | Buy2Lancer',
        og_desc: 'Stay informed with standard freelance tips and industry trends.'
      },
      {
        path: '/wishlist',
        title: 'Your Saved Freelance Gigs & Job Projects | Buy2Lancer',
        desc: 'Keep track of the custom freelance services, gigs, and project listings that you have wishlisted or saved for later.',
        keywords: 'wishlist, saved gigs, wishlisted projects, freelance jobs, saved services',
        og_title: 'Saved Gigs & Projects | Buy2Lancer',
        og_desc: 'View your wishlisted custom services and project listings.'
      },
      {
        path: '/dashboard',
        title: 'Client & Freelancer Workspace Dashboard | Buy2Lancer',
        desc: 'Access your projects workspace, manage milestone payments, submit proposals, track current contracts, and message clients.',
        keywords: 'user dashboard, project management, track payments, proposal submissions',
        og_title: 'Workspace Dashboard | Buy2Lancer',
        og_desc: 'Manage your active projects, milestone payments, and messages.'
      },
      {
        path: '/about',
        title: 'About Us - Elite Freelance Service Marketplace | Buy2Lancer',
        desc: 'Learn about Buy2Lancer - the leading platform connecting business clients with professional tech, creative, and copywriting freelancers.',
        keywords: 'about freelancer platform, freelance company info, hire experts, remote agency',
        og_title: 'About Our Platform | Buy2Lancer',
        og_desc: 'Connecting clients with elite freelance talent worldwide.'
      },
      {
        path: '/contact',
        title: 'Contact Us - Customer Support & Help Desk | Buy2Lancer',
        desc: 'Need support? Get in touch with our customer assistance team regarding payments, disputes, vetting, or general account inquiries.',
        keywords: 'contact support, customer help, dispute center, contact email',
        og_title: 'Contact Us Support | Buy2Lancer',
        og_desc: 'Get in touch with customer service for help with your projects.'
      },
      {
        path: '/faq',
        title: 'Frequently Asked Questions & Support FAQs | Buy2Lancer',
        desc: 'Browse our list of frequently asked questions regarding buyer protection, dispute resolutions, secure escrow payments, and vetting.',
        keywords: 'faq, help center, buyer protection, escrow terms, payout questions',
        og_title: 'Frequently Asked Questions | Buy2Lancer',
        og_desc: 'Help center and platform guidelines for buyers and sellers.'
      },
      {
        path: '/subscription-plans',
        title: 'Premium Membership & Bidding Credits | Buy2Lancer',
        desc: 'Upgrade your freelancer profile to unlock premium badges, submit unlimited project proposals, and highlight your featured portfolio.',
        keywords: 'membership subscription, freelancer credits, premium badges, proposal limit',
        og_title: 'Freelancer Subscription Plans | Buy2Lancer',
        og_desc: 'Upgrade your membership plan to unlock more proposals and benefits.'
      }
    ];

    for (const r of defaultSeoRoutes) {
      const check = await pool.query("SELECT 1 FROM seo_settings WHERE route_path = $1", [r.path]);
      if (check.rows.length === 0) {
        await pool.query(`
          INSERT INTO seo_settings (route_path, meta_title, meta_description, meta_keywords, og_title, og_description, og_image)
          VALUES ($1, $2, $3, $4, $5, $6, NULL)
        `, [r.path, r.title, r.desc, r.keywords, r.og_title, r.og_desc]);
        console.log(`🌱 Seeded default SEO metadata for route: ${r.path}`);
      }
    }

    // Helper to generate a URL-friendly slug
    const makeSlug = (text) => {
      if (!text) return '';
      return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    // Backfill slugs for gigs
    const emptyGigSlugs = await pool.query("SELECT gig_id, title FROM gigs WHERE slug IS NULL OR slug = ''");
    for (const gig of emptyGigSlugs.rows) {
      let baseSlug = makeSlug(gig.title) || `gig-${gig.gig_id}`;
      let finalSlug = baseSlug;
      let counter = 1;
      while (true) {
        const check = await pool.query("SELECT 1 FROM gigs WHERE slug = $1 AND gig_id != $2", [finalSlug, gig.gig_id]);
        if (check.rows.length === 0) break;
        finalSlug = `${baseSlug}-${counter++}`;
      }
      await pool.query("UPDATE gigs SET slug = $1 WHERE gig_id = $2", [finalSlug, gig.gig_id]);
    }
    if (emptyGigSlugs.rows.length > 0) {
      console.log(`🌱 Backfilled slugs for ${emptyGigSlugs.rows.length} gigs.`);
    }

    // Backfill slugs for users
    const emptyUserSlugs = await pool.query("SELECT user_id, first_name, last_name, display_name FROM users WHERE slug IS NULL OR slug = ''");
    for (const user of emptyUserSlugs.rows) {
      let rawName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`;
      let baseSlug = makeSlug(rawName) || `user-${user.user_id}`;
      let finalSlug = baseSlug;
      let counter = 1;
      while (true) {
        const check = await pool.query("SELECT 1 FROM users WHERE slug = $1 AND user_id != $2", [finalSlug, user.user_id]);
        if (check.rows.length === 0) break;
        finalSlug = `${baseSlug}-${counter++}`;
      }
      await pool.query("UPDATE users SET slug = $1 WHERE user_id = $2", [finalSlug, user.user_id]);
    }
    if (emptyUserSlugs.rows.length > 0) {
      console.log(`🌱 Backfilled slugs for ${emptyUserSlugs.rows.length} users.`);
    }

    // Create form_field_options table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS form_field_options (
        option_id SERIAL PRIMARY KEY,
        field_key VARCHAR(50) NOT NULL,
        option_value VARCHAR(100) NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (field_key, option_value)
      )
    `);
    console.log("✅ 'form_field_options' table ready.");

    // Migrate data from settings table if form_field_options is empty
    const checkEmpty = await pool.query("SELECT COUNT(*) FROM form_field_options");
    if (parseInt(checkEmpty.rows[0].count) === 0) {
      console.log("🌱 Migrating settings to 'form_field_options'...");
      const settingKeys = ['project_durations', 'location_preferences', 'payment_modes'];
      for (const key of settingKeys) {
        const checkSetting = await pool.query("SELECT setting_value FROM settings WHERE setting_key = $1", [key]);
        if (checkSetting.rows.length > 0) {
          let val = checkSetting.rows[0].setting_value;
          if (typeof val === "string") {
            try { val = JSON.parse(val); } catch {}
          }
          if (Array.isArray(val)) {
            for (let i = 0; i < val.length; i++) {
              await pool.query(
                `INSERT INTO form_field_options (field_key, option_value, sort_order) 
                 VALUES ($1, $2, $3)
                 ON CONFLICT (field_key, option_value) DO NOTHING`,
                [key, val[i], i]
              );
            }
          }
        }
      }
      console.log("✅ Migration to 'form_field_options' complete.");
    }

  } catch (error) {
    console.error("❌ Error setting up database tables:", error.message);
  } finally {
    await pool.end();
    console.log("🔌 Database setup connections closed.");
  }
}

setupTables();
