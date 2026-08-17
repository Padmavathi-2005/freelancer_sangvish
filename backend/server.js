import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';
import pool from './src/config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database Connected');

    // Startup migrations safely wrapped to prevent startup crash if database is empty
    try {
        await pool.query(`
          ALTER TABLE currencies 
          ADD COLUMN IF NOT EXISTS rate DOUBLE PRECISION DEFAULT 1.0
        `);
        await pool.query(`
          UPDATE currencies SET rate = 83.5 WHERE code = 'INR' AND rate = 1.0;
          UPDATE currencies SET rate = 0.92 WHERE code = 'EUR' AND rate = 1.0;
          UPDATE currencies SET rate = 0.78 WHERE code = 'GBP' AND rate = 1.0;
        `);
        await pool.query(`
          ALTER TABLE gig_applications 
          ADD COLUMN IF NOT EXISTS milestones JSONB
        `);
        await pool.query(`
          ALTER TABLE gigs 
          ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS wishlist_count INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS reviews_avg_rating NUMERIC DEFAULT 5.0,
          ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'fixed',
          ADD COLUMN IF NOT EXISTS min_price NUMERIC,
          ADD COLUMN IF NOT EXISTS max_price NUMERIC,
          ADD COLUMN IF NOT EXISTS milestones JSONB,
          ADD COLUMN IF NOT EXISTS addons JSONB DEFAULT NULL
        `);
        console.log('✅ Database startup migrations verified.');
    } catch (migErr) {
        console.log('Notice on startup schema migrations:', migErr.message);
    }

    // Seed test freelancers and gigs for cross-selling verification safely
    try {
      const testFreelancersCheck = await pool.query("SELECT * FROM gigs WHERE title = 'Premium Enterprise UI/UX Design & Brand System'");
      if (testFreelancersCheck.rows.length === 0) {
        console.log('🌱 Seeding John Doe & Jane Smith freelancers with gigs for cross-selling demo...');
        
        // Clean up any old test gigs and users to ensure a clean run
        await pool.query("DELETE FROM gigs WHERE title IN ('Premium Enterprise UI/UX Design & Brand System', 'Pro Figma Interactive Prototyping & User Flow Vetting')");
        await pool.query("DELETE FROM freelancer_profiles WHERE user_id IN (SELECT user_id FROM users WHERE email IN ('john@example.com', 'jane@example.com'))");
        await pool.query("DELETE FROM users WHERE email IN ('john@example.com', 'jane@example.com')");

        // Get all active category/subcategory combinations present in existing gigs
        const activeCatsRes = await pool.query(`
          SELECT DISTINCT category_id, sub_category_id, currency_id FROM gigs WHERE category_id IS NOT NULL AND sub_category_id IS NOT NULL LIMIT 5
        `);

        if (activeCatsRes.rows.length > 0) {
          // 1. Create John Doe (Elite Seller)
          const johnRes = await pool.query(`
            INSERT INTO users (first_name, last_name, email, password_hash, referral_code, active_plan_id)
            VALUES (
              'John', 'Doe', 'john@example.com', 
              '$2b$10$K7/L6f2lC6F6F6F6F6F6F6F6F6F6F6F6F6F6F6F6F6F6F6F6F6F6', 'REFJOHN',
              (SELECT plan_id FROM subscription_plans WHERE name = 'Enterprise' AND plan_role = 'seller' LIMIT 1)
            ) RETURNING user_id
          `);
          const johnId = johnRes.rows[0].user_id;

          // 2. Create Jane Smith (Pro Seller)
          const janeRes = await pool.query(`
            INSERT INTO users (first_name, last_name, email, password_hash, referral_code, active_plan_id)
            VALUES (
              'Jane', 'Smith', 'jane@example.com', 
              '$2b$10$K7/L6f2lC6F6F6F6F6F6F6F6F6F6F6F6F6F6F6F6F6F6F6F6F6F6', 'REFJANE',
              (SELECT plan_id FROM subscription_plans WHERE name = 'Professional' AND plan_role = 'seller' LIMIT 1)
            ) RETURNING user_id
          `);
          const janeId = janeRes.rows[0].user_id;

          // Insert freelancer profiles for both using the first active category
          const firstCat = activeCatsRes.rows[0];
          await pool.query(`
            INSERT INTO freelancer_profiles (user_id, professional_title, hourly_rate, bio, vetting_status, category_id, sub_category_id, experience_level, total_experience_years, availability_status)
            VALUES ($1, 'Elite UI/UX Architect', 120.00, 'I build high-end corporate applications and premium UX prototypes.', 'Approved', $2, $3, 'Expert', 8, 'Available')
            ON CONFLICT DO NOTHING
          `, [johnId, firstCat.category_id, firstCat.sub_category_id]);

          await pool.query(`
            INSERT INTO freelancer_profiles (user_id, professional_title, hourly_rate, bio, vetting_status, category_id, sub_category_id, experience_level, total_experience_years, availability_status)
            VALUES ($1, 'Senior Figma Specialist', 75.00, 'Specialist in rapid prototyping, Figma libraries, and design handoffs.', 'Approved', $2, $3, 'Expert', 5, 'Available')
            ON CONFLICT DO NOTHING
          `, [janeId, firstCat.category_id, firstCat.sub_category_id]);

          // Loop through all active categories and seed gigs for both John and Jane in each one!
          for (const row of activeCatsRes.rows) {
            const { category_id, sub_category_id, currency_id } = row;
            const slugSuffix = `${category_id}-${sub_category_id}`;

            // Create John's gig for this category
            await pool.query(`
              INSERT INTO gigs (freelancer_id, category_id, sub_category_id, title, description, price, currency_id, delivery_days, revisions, images, status, slug)
              VALUES (
                $1, $2, $3, 
                'Premium Enterprise UI/UX Design & Brand System', 
                'Design high-fidelity interactive wireframes, brand assets, and custom design guidelines for large-scale SaaS platforms.', 
                650.00, $4, 5, 5, 
                '["https://images.unsplash.com/photo-1541462608143-67571c6738dd?auto=format&fit=crop&w=800&q=80"]'::jsonb, 
                'Active', 
                $5
              )
            `, [johnId, category_id, sub_category_id, currency_id, `premium-enterprise-ui-ux-${slugSuffix}`]);

            // Create Jane's gig for this category
            await pool.query(`
              INSERT INTO gigs (freelancer_id, category_id, sub_category_id, title, description, price, currency_id, delivery_days, revisions, images, status, slug)
              VALUES (
                $1, $2, $3, 
                'Pro Figma Interactive Prototyping & User Flow Vetting', 
                'Build interactive clickable prototypes in Figma, component design systems, and rapid user testing screens.', 
                350.00, $4, 3, 3, 
                '["https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80"]'::jsonb, 
                'Active', 
                $5
              )
            `, [janeId, category_id, sub_category_id, currency_id, `pro-figma-interactive-prototyping-${slugSuffix}`]);
          }
          console.log('✅ Test freelancers & gigs seeded successfully across categories!');
        }
      }
    } catch (seedErr) {
      console.log('Notice on test freelancer seeding:', seedErr.message);
    }

    // Startup migration for freelancer_profiles bio column
    await pool.query(`
      ALTER TABLE freelancer_profiles 
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS seo JSONB DEFAULT NULL
    `);
    console.log('✅ freelancer_profiles bio and seo columns check completed');

    // Startup migration for cms_pages seo column
    await pool.query(`
      ALTER TABLE cms_pages 
      ADD COLUMN IF NOT EXISTS seo JSONB DEFAULT NULL
    `);
    console.log('✅ cms_pages seo column check completed');

    // Startup migration for contracts submitted_files column
    await pool.query(`
      ALTER TABLE contracts 
      ADD COLUMN IF NOT EXISTS submitted_files TEXT
    `);
    console.log('✅ contracts table submitted_files column check completed');

    // Startup migration for unique_views_log table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS unique_views_log (
        id SERIAL PRIMARY KEY,
        view_type VARCHAR(50) NOT NULL,
        target_id VARCHAR(100) NOT NULL,
        ip_address VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_view_log_constraint UNIQUE (view_type, target_id, ip_address)
      )
    `);
    console.log('✅ unique_views_log table check completed');

    // Startup migration for gig_reviews
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gig_reviews (
        review_id SERIAL PRIMARY KEY,
        gig_id INTEGER NOT NULL REFERENCES gigs(gig_id) ON DELETE CASCADE,
        client_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        application_id INTEGER NOT NULL REFERENCES gig_applications(application_id) ON DELETE CASCADE,
        rating NUMERIC NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ gig_reviews table check completed');

    // Startup migration for contract_reviews
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contract_reviews (
        review_id SERIAL PRIMARY KEY,
        contract_id INTEGER NOT NULL REFERENCES contracts(contract_id) ON DELETE CASCADE,
        reviewer_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        reviewee_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        reviewer_role VARCHAR(20) NOT NULL CHECK (reviewer_role IN ('client', 'freelancer')),
        rating NUMERIC NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (contract_id, reviewer_id)
      )
    `);
    console.log('✅ contract_reviews table check completed');

    // Startup migration for contract_milestones feedback column
    await pool.query(`
      ALTER TABLE contract_milestones 
      ADD COLUMN IF NOT EXISTS feedback TEXT
    `);
    console.log('✅ contract_milestones feedback column check completed');

    // Startup migration for subscription_plans custom fields
    await pool.query(`
      ALTER TABLE subscription_plans 
      ADD COLUMN IF NOT EXISTS plan_role VARCHAR(50) DEFAULT 'seller',
      ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'Month(s)',
      ADD COLUMN IF NOT EXISTS plan_duration INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 10,
      ADD COLUMN IF NOT EXISTS profile_featured_duration INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS featured_project_limit INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS featured_project_duration INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS badge_image TEXT,
      ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT TRUE
    `);
    console.log('✅ subscription_plans custom fields check completed');

    // Startup migration for contact_inquiries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_inquiries (
        inquiry_id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) DEFAULT 'General Inquiry',
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ contact_inquiries table check completed');

    // Startup migration for newsletter_subscribers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        subscriber_id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ newsletter_subscribers table check completed');

    // Seed default package options settings if not present
    const checkPkgSettings = await pool.query("SELECT 1 FROM settings WHERE setting_key = 'package_options_settings'");
    if (checkPkgSettings.rows.length === 0) {
      await pool.query(`
        INSERT INTO settings (category, setting_key, setting_value)
        VALUES ('general', 'package_options_settings', '{"package_option": "Free listing for both type of users", "credits_per_project": 1}')
      `);
      console.log('🌱 Seeded default package_options_settings');
    }

    // Seed default app and social links settings if not present
    const checkAppStore = await pool.query("SELECT 1 FROM settings WHERE setting_key = 'app_store_url'");
    if (checkAppStore.rows.length === 0) {
      await pool.query("INSERT INTO settings (category, setting_key, setting_value) VALUES ('general', 'app_store_url', '\"https://apps.apple.com\"')");
      console.log('🌱 Seeded default app_store_url');
    }
    const checkGooglePlay = await pool.query("SELECT 1 FROM settings WHERE setting_key = 'google_play_url'");
    if (checkGooglePlay.rows.length === 0) {
      await pool.query("INSERT INTO settings (category, setting_key, setting_value) VALUES ('general', 'google_play_url', '\"https://play.google.com\"')");
      console.log('🌱 Seeded default google_play_url');
    }
    const checkInstagram = await pool.query("SELECT 1 FROM settings WHERE setting_key = 'instagram_url'");
    if (checkInstagram.rows.length === 0) {
      await pool.query("INSERT INTO settings (category, setting_key, setting_value) VALUES ('general', 'instagram_url', '\"https://instagram.com\"')");
      console.log('🌱 Seeded default instagram_url');
    }
    const checkLinkedin = await pool.query("SELECT 1 FROM settings WHERE setting_key = 'linkedin_url'");
    if (checkLinkedin.rows.length === 0) {
      await pool.query("INSERT INTO settings (category, setting_key, setting_value) VALUES ('general', 'linkedin_url', '\"https://linkedin.com\"')");
      console.log('🌱 Seeded default linkedin_url');
    }
    const checkMockupImage = await pool.query("SELECT 1 FROM settings WHERE setting_key = 'app_mockup_image'");
    if (checkMockupImage.rows.length === 0) {
      await pool.query("INSERT INTO settings (category, setting_key, setting_value) VALUES ('general', 'app_mockup_image', '\"\"')");
      console.log('🌱 Seeded default app_mockup_image');
    }
    const checkGoogleLoginEnabled = await pool.query("SELECT 1 FROM settings WHERE setting_key = 'google_login_enabled'");
    if (checkGoogleLoginEnabled.rows.length === 0) {
      await pool.query("INSERT INTO settings (category, setting_key, setting_value) VALUES ('general', 'google_login_enabled', '\"false\"')");
      console.log('🌱 Seeded default google_login_enabled');
    }
    const checkGoogleClientId = await pool.query("SELECT 1 FROM settings WHERE setting_key = 'google_client_id'");
    if (checkGoogleClientId.rows.length === 0) {
      await pool.query("INSERT INTO settings (category, setting_key, setting_value) VALUES ('general', 'google_client_id', '\"\"')");
      console.log('🌱 Seeded default google_client_id');
    }
    const checkFacebookLoginEnabled = await pool.query("SELECT 1 FROM settings WHERE setting_key = 'facebook_login_enabled'");
    if (checkFacebookLoginEnabled.rows.length === 0) {
      await pool.query("INSERT INTO settings (category, setting_key, setting_value) VALUES ('general', 'facebook_login_enabled', '\"false\"')");
      console.log('🌱 Seeded default facebook_login_enabled');
    }
    const checkFacebookAppId = await pool.query("SELECT 1 FROM settings WHERE setting_key = 'facebook_app_id'");
    if (checkFacebookAppId.rows.length === 0) {
      await pool.query("INSERT INTO settings (category, setting_key, setting_value) VALUES ('general', 'facebook_app_id', '\"\"')");
      console.log('🌱 Seeded default facebook_app_id');
    }

    // Seed newsletter CMS page if not present
    const checkNewsletterPage = await pool.query("SELECT 1 FROM cms_pages WHERE slug = 'newsletter'");
    if (checkNewsletterPage.rows.length === 0) {
      await pool.query(`
        INSERT INTO cms_pages (title, slug, status, content_type, content)
        VALUES (
          'Newsletter Subscription',
          'newsletter',
          'Published',
          'Builder',
          $1
        )
      `, [
        JSON.stringify([
          {
            id: "news-t1",
            type: "Title",
            data: {
              title: "Newsletter Portal",
              subtitle: "Subscribe to stay updated with latest insights, remote jobs, and marketplace stats."
            }
          },
          {
            id: "news-r1",
            type: "RichText",
            data: {
              content: "<p>Join our newsletter community. By subscribing, you will receive:<ul><li>Weekly curated remote jobs list</li><li>Freelancing guides and interview success tips</li><li>Marketplace statistics, metrics, and hiring trends</li></ul></p>"
            }
          }
        ])
      ]);
      console.log('🌱 Seeded default newsletter CMS page');
    }

    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.handshake.query.userId;
        if (userId) {
            socket.join(`user_${userId}`);
            console.log(`🔌 User connected and joined room user_${userId}: socketId=${socket.id}`);
        }

        socket.on('disconnect', () => {
            if (userId) {
                console.log(`🔌 User disconnected: userId=${userId}, socketId=${socket.id}`);
            }
        });
    });

    // Make io accessible globally in app
    app.set('io', io);

    // Start Subscription Expiry Checker Daemon
    const { runSubscriptionDaemon } = await import('./src/utils/subscriptionChecker.js');
    runSubscriptionDaemon(io);

    httpServer.listen(PORT, () => {
        console.log(`🚀 Server running with Socket.io on port ${PORT}`);
    });
} catch (error) {
    console.error('❌ Database Connection Failed');
    console.error(error.message);
}