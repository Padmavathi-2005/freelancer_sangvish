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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'currencies' table ready.");

    // Seed currencies if table is empty
    const currCheck = await pool.query("SELECT COUNT(*) FROM currencies");
    if (parseInt(currCheck.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO currencies (code, name, symbol) VALUES
        ('USD', 'US Dollar', '$'),
        ('INR', 'Indian Rupee', '₹'),
        ('EUR', 'Euro', '€'),
        ('GBP', 'British Pound', '£')
      `);
      console.log("🌱 Seeded default currencies (USD, INR, EUR, GBP).");
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
        status VARCHAR(50) DEFAULT 'In Progress',
        progress INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      ADD COLUMN IF NOT EXISTS milestones JSONB
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



  } catch (error) {
    console.error("❌ Error setting up database tables:", error.message);
  } finally {
    await pool.end();
    console.log("🔌 Database setup connections closed.");
  }
}

setupTables();
