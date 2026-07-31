import pool from './src/config/db.js';

async function seedData() {
  try {
    await pool.query("BEGIN");

    // 1. Get user IDs
    const freelancerRes = await pool.query("SELECT user_id FROM users WHERE email = 'freelancer@yopmail.com'");
    const clientRes = await pool.query("SELECT user_id FROM users WHERE email = 'client@yopmail.com'");

    if (freelancerRes.rows.length === 0 || clientRes.rows.length === 0) {
      throw new Error("Freelancer or Client user not found!");
    }

    const freelancerId = freelancerRes.rows[0].user_id; // 7
    const clientId = clientRes.rows[0].user_id; // 19

    console.log(`Freelancer ID: ${freelancerId}, Client ID: ${clientId}`);

    // Ensure Client Wallet has funds for testing
    await pool.query("UPDATE wallets SET balance = GREATEST(balance, 25000.00) WHERE user_id = $1", [clientId]);

    // Ensure Freelancer Wallet exists
    await pool.query(
      "INSERT INTO wallets (user_id, balance) VALUES ($1, 5000.00) ON CONFLICT (user_id) DO UPDATE SET balance = GREATEST(wallets.balance, 5000.00)",
      [freelancerId]
    ).catch(() => {});

    // ==========================================
    // SECTION 1: ADD 4 PROJECT CONTRACTS
    // ==========================================
    console.log("\n--- Seeding 4 Project Contracts ---");

    const projectContractsData = [
      {
        job_id: 11,
        title: "Enterprise SaaS React Dashboard & GraphQL Integration",
        budget: 5000,
        status: "In Progress",
        progress: 50,
        milestones: [
          { title: "UI Component Library & Dashboard Wireframes", amount: 2500, status: "Completed", payment_status: "Paid" },
          { title: "GraphQL API Integration & Real-time Charts", amount: 2500, status: "Pending", payment_status: "Escrowed" }
        ]
      },
      {
        job_id: 12,
        title: "Brand Identity, Typography System & Figma Landing Page Design",
        budget: 2000,
        status: "In Progress",
        progress: 50,
        milestones: [
          { title: "Brand Kit & Visual Guidelines", amount: 1000, status: "Completed", payment_status: "Paid" },
          { title: "High-Fidelity Figma Landing Page Mockups", amount: 1000, status: "Pending", payment_status: "Escrowed" }
        ]
      },
      {
        job_id: 14,
        title: "Mobile App Development for E-Commerce Marketplace",
        budget: 8000,
        status: "Under Review",
        progress: 100,
        milestones: [
          { title: "React Native Mobile Frontend Setup", amount: 4000, status: "Completed", payment_status: "Paid" },
          { title: "Checkout API Integration & Beta Build Submission", amount: 4000, status: "Submitted", payment_status: "Escrowed", submitted_files: "https://example.com/build-v1.zip" }
        ]
      },
      {
        job_id: null,
        title: "Full-Stack Custom Workflow Engine & Node.js Microservices",
        budget: 3500,
        status: "In Progress",
        progress: 40,
        milestones: [
          { title: "Architecture Specs & DB Schema Setup", amount: 1500, status: "Completed", payment_status: "Paid" },
          { title: "Workflow Engine Core Service Implementation", amount: 2000, status: "Pending", payment_status: "Escrowed" }
        ]
      }
    ];

    for (const pData of projectContractsData) {
      // Check if contract already exists to avoid duplicates
      const checkContract = await pool.query(
        "SELECT contract_id FROM contracts WHERE client_id = $1 AND freelancer_id = $2 AND title = $3",
        [clientId, freelancerId, pData.title]
      );

      let contractId;
      if (checkContract.rows.length > 0) {
        contractId = checkContract.rows[0].contract_id;
        await pool.query(
          "UPDATE contracts SET status = $1, progress = $2, updated_at = CURRENT_TIMESTAMP WHERE contract_id = $3",
          [pData.status, pData.progress, contractId]
        );
        console.log(`Updated existing project contract ID: ${contractId} (${pData.title})`);
      } else {
        const insRes = await pool.query(
          `INSERT INTO contracts (client_id, freelancer_id, job_id, title, budget, status, progress, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING contract_id`,
          [clientId, freelancerId, pData.job_id, pData.title, pData.budget, pData.status, pData.progress]
        );
        contractId = insRes.rows[0].contract_id;
        console.log(`Created new project contract ID: ${contractId} (${pData.title})`);
      }

      // Ensure proposal exists if job_id is present
      if (pData.job_id) {
        const checkProp = await pool.query(
          "SELECT proposal_id FROM proposals WHERE job_id = $1 AND freelancer_id = $2",
          [pData.job_id, freelancerId]
        );
        if (checkProp.rows.length === 0) {
          await pool.query(
            `INSERT INTO proposals (job_id, freelancer_id, bid_amount, delivery_days, cover_letter, status, created_at, updated_at)
             VALUES ($1, $2, $3, 7, 'Excited to deliver this project with full quality.', 'Accepted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [pData.job_id, freelancerId, pData.budget]
          );
        }
      }

      // Add Milestones
      for (const m of pData.milestones) {
        const checkMs = await pool.query(
          "SELECT milestone_id FROM contract_milestones WHERE contract_id = $1 AND title = $2",
          [contractId, m.title]
        );
        if (checkMs.rows.length === 0) {
          await pool.query(
            `INSERT INTO contract_milestones (contract_id, title, amount, status, payment_status, submitted_files, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [contractId, m.title, m.amount, m.status, m.payment_status, m.submitted_files || null]
          );
        }
      }
    }

    // ==========================================
    // SECTION 2: ADD 4 GIG ORDERS
    // ==========================================
    console.log("\n--- Seeding 4 Gig Orders ---");

    const gigOrdersData = [
      {
        gig_id: 16,
        title: "Create modern iOS & Android Apps with React Native",
        requirements: "Need iOS and Android build with auth, product list, cart, and push notifications.",
        price: 1500,
        status: "Accepted",
        contract_status: "In Progress",
        progress: 50,
        milestones: [
          { title: "App UI Shell & Navigation", amount: 750, status: "Completed", payment_status: "Paid" },
          { title: "API Wiring & Push Notifications", amount: 750, status: "Pending", payment_status: "Escrowed" }
        ]
      },
      {
        gig_id: 17,
        title: "Comprehensive PostgreSQL Database Design & Query Tuning",
        requirements: "Optimize slow SQL queries on our user activity log tables and create indexes.",
        price: 400,
        status: "Accepted",
        contract_status: "In Progress",
        progress: 50,
        milestones: [
          { title: "Database Query Audit & Index Recommendations", amount: 200, status: "Completed", payment_status: "Paid" },
          { title: "Query Rewriting & Load Test Benchmark", amount: 200, status: "Pending", payment_status: "Escrowed" }
        ]
      },
      {
        gig_id: 18,
        title: "Build modern SaaS Landing Page with Framer Motion & Tailwind",
        requirements: "Create an interactive marketing page for our SaaS app with smooth Framer Motion micro-animations.",
        price: 500,
        status: "Accepted",
        contract_status: "In Progress",
        progress: 50,
        milestones: [
          { title: "Hero Section & Animated Components", amount: 250, status: "Completed", payment_status: "Paid" },
          { title: "Pricing Table & Contact Form Integration", amount: 250, status: "Pending", payment_status: "Escrowed" }
        ]
      },
      {
        gig_id: 19,
        title: "Full Stack eCommerce Solution with Next.js & Stripe",
        requirements: "Deploy Next.js shop frontend with Stripe checkout and order webhook handler.",
        price: 950,
        status: "Accepted",
        contract_status: "Under Review",
        progress: 100,
        milestones: [
          { title: "Product Catalog & Cart UI", amount: 475, status: "Completed", payment_status: "Paid" },
          { title: "Stripe Checkout Payment Gateway Integration", amount: 475, status: "Submitted", payment_status: "Escrowed", submitted_files: "https://example.com/ecommerce-code.zip" }
        ]
      }
    ];

    for (const gData of gigOrdersData) {
      // Check if gig application exists
      const checkApp = await pool.query(
        "SELECT application_id FROM gig_applications WHERE client_id = $1 AND gig_id = $2",
        [clientId, gData.gig_id]
      );

      let applicationId;
      if (checkApp.rows.length > 0) {
        applicationId = checkApp.rows[0].application_id;
        await pool.query(
          "UPDATE gig_applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE application_id = $2",
          [gData.status, applicationId]
        );
        console.log(`Updated existing gig application ID: ${applicationId} for Gig #${gData.gig_id}`);
      } else {
        const insApp = await pool.query(
          `INSERT INTO gig_applications (gig_id, client_id, requirements, price, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING application_id`,
          [gData.gig_id, clientId, gData.requirements, gData.price, gData.status]
        );
        applicationId = insApp.rows[0].application_id;
        console.log(`Created new gig application ID: ${applicationId} for Gig #${gData.gig_id}`);
      }

      // Add gig_application_milestones
      for (const m of gData.milestones) {
        const checkGMs = await pool.query(
          "SELECT id FROM gig_application_milestones WHERE application_id = $1 AND title = $2",
          [applicationId, m.title]
        );
        if (checkGMs.rows.length === 0) {
          await pool.query(
            `INSERT INTO gig_application_milestones (application_id, title, amount, created_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
            [applicationId, m.title, m.amount]
          );
        }
      }

      // Check linked contract for this gig application
      const checkGigContract = await pool.query(
        "SELECT contract_id FROM contracts WHERE application_id = $1",
        [applicationId]
      );

      let gigContractId;
      if (checkGigContract.rows.length > 0) {
        gigContractId = checkGigContract.rows[0].contract_id;
        await pool.query(
          "UPDATE contracts SET status = $1, progress = $2, updated_at = CURRENT_TIMESTAMP WHERE contract_id = $3",
          [gData.contract_status, gData.progress, gigContractId]
        );
        console.log(`Updated linked contract ID: ${gigContractId} for Gig Order #${applicationId}`);
      } else {
        const insContract = await pool.query(
          `INSERT INTO contracts (client_id, freelancer_id, title, budget, status, progress, application_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING contract_id`,
          [clientId, freelancerId, gData.title, gData.price, gData.contract_status, gData.progress, applicationId]
        );
        gigContractId = insContract.rows[0].contract_id;
        console.log(`Created linked contract ID: ${gigContractId} for Gig Order #${applicationId}`);
      }

      // Add contract milestones for gig order contract
      for (const m of gData.milestones) {
        const checkMs = await pool.query(
          "SELECT milestone_id FROM contract_milestones WHERE contract_id = $1 AND title = $2",
          [gigContractId, m.title]
        );
        if (checkMs.rows.length === 0) {
          await pool.query(
            `INSERT INTO contract_milestones (contract_id, title, amount, status, payment_status, submitted_files, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [gigContractId, m.title, m.amount, m.status, m.payment_status, m.submitted_files || null]
          );
        }
      }
    }

    await pool.query("COMMIT");
    console.log("\n✅ Successfully seeded 4 Project Contracts and 4 Gig Orders for freelancer@yopmail.com and client@yopmail.com!");
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("❌ Seed failed:", err);
  } finally {
    await pool.end();
  }
}

seedData();
