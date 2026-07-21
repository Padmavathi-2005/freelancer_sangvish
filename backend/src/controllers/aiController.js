import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";


// Simple in-memory session store for chat histories
const sessionStore = new Map();

// Helper: Keyword Extractor
function extractSearchKeywords(text) {
  const stopwords = new Set([
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", 
    "he", "him", "his", "she", "her", "it", "its", "they", "them", "their", "what", "which", 
    "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", 
    "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", 
    "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", 
    "for", "with", "about", "against", "between", "into", "through", "during", "before", 
    "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", 
    "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", 
    "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", 
    "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "can", "will", 
    "just", "should", "now", "want", "find", "search", "apply", "job", "jobs", "work", 
    "freelancer", "freelancing", "looking", "need", "get", "show", "gigs", "gig", "service", "services",
    "give", "one", "two", "three", "please", "see", "look", "display", "list", "could", "would", "should", "some"
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopwords.has(word));
}

export const getAIChatResponse = async (req, res) => {
  try {
    const { prompt, threadId } = req.body;
    
    let featuresListText = "";
    try {
      featuresListText = fs.readFileSync(path.join(process.cwd(), "..", "features_list.txt"), "utf8");
    } catch (err) {
      console.error("Failed to read features_list.txt for chatbot:", err.message);
    }
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your_openai_api_key_here") {
      return res.status(400).json({ 
        error: "OpenAI API key is not configured on the server. Please add your OPENAI_API_KEY in the backend .env file." 
      });
    }

    // Generate or retrieve session history
    const activeThreadId = threadId || `session_${Date.now()}`;
    if (!sessionStore.has(activeThreadId)) {
      sessionStore.set(activeThreadId, []);
    }
    const history = sessionStore.get(activeThreadId);

    // Append new user message to history
    history.push({ role: 'user', content: prompt });

    // Fetch user context from database if logged in
    let userContext = null;
    if (req.user && req.user.user_id) {
      const userId = req.user.user_id;
      try {
        const userRes = await pool.query(
          `SELECT u.first_name, u.last_name, u.email, u.active_plan_id, sp.name AS plan_name, sp.credits
           FROM users u
           LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id
           WHERE u.user_id = $1`,
          [userId]
        );
        if (userRes.rows.length > 0) {
          const userData = userRes.rows[0];
          const walletRes = await pool.query("SELECT balance FROM wallets WHERE user_id = $1", [userId]);
          const balance = walletRes.rows.length > 0 ? parseFloat(walletRes.rows[0].balance) || 0.00 : 0.00;
          userContext = {
            name: userData.first_name ? `${userData.first_name} ${userData.last_name || ""}`.trim() : "Member",
            walletBalance: balance,
            subscriptionPlan: userData.plan_name || "Free Tier",
            credits: userData.credits ?? 0,
            isSubscribed: !!userData.active_plan_id
          };
        }
      } catch (err) {
        console.error("Failed to query user context in aiController:", err.message);
      }
    }

    // Perform database queries for Gigs and Jobs
    const keywords = extractSearchKeywords(prompt);
    const lowerText = prompt.toLowerCase();
    const isGeneralQuestion = ["how", "flow", "explain", "about", "what is", "guide", "help", "greet", "hello", "hi", "hey"].some(t => lowerText.includes(t));

    let retrievedGigs = [];
    let retrievedJobs = [];
    let retrievedFreelancers = [];
    let retrievedPlans = [];

    const recentMessages = history.slice(-3);
    const historyText = recentMessages.map(m => m.content).join(" ").toLowerCase();

    const hasGigKeywords = ["gig", "gigs", "service", "services", "catalog", "buy", "order", "checkout", "product", "products", "item", "items"].some(t => lowerText.includes(t) || historyText.includes(t));
    const hasJobKeywords = ["job", "jobs", "project", "projects", "work", "apply", "bid", "openings"].some(t => lowerText.includes(t) || historyText.includes(t));
    const hasPlanKeywords = ["plan", "plans", "pricing", "membership", "subscribe", "package", "packages", "cost", "fee", "fees", "tier", "tiers"].some(t => lowerText.includes(t) || historyText.includes(t));
    const hasFreelancerKeywords = [
      "freelancer", "freelancers", "freelance", "freelances", "talent", 
      "developer", "designer", "coder", "programmer", "expert", "experts", 
      "people", "person", "profiles", "profile", "user", "users", "hire", "hiring", "employ",
      "freealncers", "freealncer", "freelacner", "freelacners"
    ].some(t => lowerText.includes(t) || historyText.includes(t));

    if (!isGeneralQuestion) {
      // 1. Gigs retrieval
      if (hasGigKeywords || (!hasJobKeywords && !hasFreelancerKeywords && keywords.length > 0)) {
        if (keywords.length > 0) {
          const conditions = [];
          const values = [];
          keywords.forEach((keyword, index) => {
            const placeholder = `$${index + 1}`;
            let subCond = `(title ILIKE ${placeholder} OR description ILIKE ${placeholder})`;
            const numVal = parseFloat(keyword);
            if (!isNaN(numVal) && numVal > 0) {
              subCond += ` OR (price BETWEEN ${numVal - 15} AND ${numVal + 15})`;
            }
            conditions.push(`(${subCond})`);
            values.push(`%${keyword}%`);
          });
          const queryText = `
            SELECT gig_id, title, description, price, images, status
            FROM gigs
            WHERE (status = 'Active' OR status = 'active') AND (${conditions.join(" OR ")})
            ORDER BY views DESC LIMIT 5
          `;
          const dbRes = await pool.query(queryText, values);
          retrievedGigs = dbRes.rows;
        }
        if (retrievedGigs.length === 0) {
          const dbRes = await pool.query(`
            SELECT gig_id, title, description, price, images, status
            FROM gigs
            WHERE (status = 'Active' OR status = 'active')
            ORDER BY views DESC LIMIT 5
          `);
          retrievedGigs = dbRes.rows;
        }
      }

      // 2. Jobs retrieval
      if (hasJobKeywords || (!hasGigKeywords && !hasFreelancerKeywords && keywords.length > 0)) {
        if (keywords.length > 0) {
          const conditions = [];
          const values = [];
          keywords.forEach((keyword, index) => {
            const placeholder = `$${index + 1}`;
            let subCond = `(title ILIKE ${placeholder} OR description ILIKE ${placeholder})`;
            const numVal = parseFloat(keyword);
            if (!isNaN(numVal) && numVal > 0) {
              subCond += ` OR (budget BETWEEN ${numVal - 50} AND ${numVal + 50})`;
            }
            conditions.push(`(${subCond})`);
            values.push(`%${keyword}%`);
          });
          const queryText = `
            SELECT job_id, title, description, budget, location, status, skills
            FROM jobs
            WHERE status = 'Open' AND (${conditions.join(" OR ")})
            ORDER BY created_at DESC LIMIT 5
          `;
          const dbRes = await pool.query(queryText, values);
          retrievedJobs = dbRes.rows;
        }
        if (retrievedJobs.length === 0) {
          const dbRes = await pool.query(`
            SELECT job_id, title, description, budget, location, status, skills
            FROM jobs
            WHERE status = 'Open'
            ORDER BY created_at DESC LIMIT 5
          `);
          retrievedJobs = dbRes.rows;
        }
      }

      // 3. Freelancer profiles retrieval
      if (hasFreelancerKeywords || (!hasGigKeywords && !hasJobKeywords && keywords.length > 0)) {
        try {
          let freeRes;
          if (keywords.length > 0) {
            const conditions = [];
            const values = [];
            keywords.forEach((keyword, index) => {
              const placeholder = `$${index + 1}`;
              let subCond = `(fp.professional_title ILIKE ${placeholder} OR u.first_name ILIKE ${placeholder} OR u.last_name ILIKE ${placeholder} OR cat.category_name ILIKE ${placeholder} OR sub.sub_category_name ILIKE ${placeholder} OR EXISTS (SELECT 1 FROM user_skills us JOIN skills s ON us.skill_id = s.skill_id WHERE us.user_id = u.user_id AND s.skill_name ILIKE ${placeholder}))`;
              const numVal = parseFloat(keyword);
              if (!isNaN(numVal) && numVal > 0) {
                subCond += ` OR (fp.hourly_rate BETWEEN ${numVal - 15} AND ${numVal + 15})`;
              }
              conditions.push(`(${subCond})`);
              values.push(`%${keyword}%`);
            });
            freeRes = await pool.query(`
              SELECT u.user_id, u.first_name, u.last_name, u.display_name, u.profile_image, 
                     fp.professional_title, fp.hourly_rate, fp.experience_level,
                     sp.name AS plan_name
              FROM users u
              JOIN freelancer_profiles fp ON u.user_id = fp.user_id
              LEFT JOIN categories cat ON fp.category_id = cat.category_id
              LEFT JOIN sub_categories sub ON fp.sub_category_id = sub.sub_category_id
              LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id
              WHERE (${conditions.join(" OR ")})
              ORDER BY COALESCE(sp.price::numeric, 0) DESC, u.user_id DESC
              LIMIT 5
            `, values);
          }
          if (!freeRes || freeRes.rows.length === 0) {
            freeRes = await pool.query(`
              SELECT u.user_id, u.first_name, u.last_name, u.display_name, u.profile_image, 
                     fp.professional_title, fp.hourly_rate, fp.experience_level,
                     sp.name AS plan_name
              FROM users u
              JOIN freelancer_profiles fp ON u.user_id = fp.user_id
              LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id
              ORDER BY COALESCE(sp.price::numeric, 0) DESC, u.user_id DESC
              LIMIT 5
            `);
          }
          retrievedFreelancers = freeRes.rows;
        } catch (err) {
          console.error("Failed to query freelancers for AI:", err.message);
        }
      }

      // 4. Subscription plans retrieval
      if (hasPlanKeywords) {
        try {
          const planRes = await pool.query(`
            SELECT plan_id, name, description, price, period, features, plan_role, is_enabled
            FROM subscription_plans
            WHERE is_enabled = true
            ORDER BY plan_role DESC, COALESCE(price::numeric, 0) ASC
          `);
          retrievedPlans = planRes.rows;
        } catch (err) {
          console.error("Failed to query subscription plans for AI:", err.message);
        }
      }
    }

    // Build the system prompt
    let systemPrompt = `You are Buy2Lancer AI Assistant, a friendly, intelligent, and professional chatbot built for the Buy2Lancer freelance platform. 
Buy2Lancer is an all-in-one freelance marketplace connecting top clients and freelancers.

---

BUY2LANCER URL SITEMAP DIRECTORY (For page redirects, always output these exact links):
- Landing Page: http://localhost:3000/
- User Login: http://localhost:3000/login
- User Registration: http://localhost:3000/register
- Browse Freelancer Talent: http://localhost:3000/talent
- Gig Services Marketplace: http://localhost:3000/gigs
- Browse Project Listings: http://localhost:3000/projects
- Pricing & Membership Packages: http://localhost:3000/pricing
- Client/Freelancer Dashboard: http://localhost:3000/dashboard
- Message Chat Inbox: http://localhost:3000/dashboard/inbox
- Projects & Contracts Manager: http://localhost:3000/dashboard/my-projects
- Virtual Wallet (Balances & Deposits): http://localhost:3000/dashboard/wallet
- Membership Subscription & Credits: http://localhost:3000/dashboard/subscription
- Account Profile Settings: http://localhost:3000/dashboard/settings

---

NEAT PLATFORM FLOWS & WORKFLOWS:

1. CLIENT & FREELANCER ONBOARDING FLOW:
   - Users register an account and can switch between 'Freelancer' and 'Client' workspaces using the dashboard header toggle.
   - **Freelancers** must complete a 4-step onboarding wizard (adding skills, languages, experience, education, portfolio, and verifying OTP).
   - Once completed, their profile status is 'Pending' until an **Administrator** reviews and approves their profile.
   - Only approved freelancers can post gigs or bid on project listings.

2. GIG MARKETPLACE ORDERING FLOW:
   - **Freelancers** create a gig service with Basic, Standard, and Premium pricing tiers and optional extras/add-ons.
   - **Clients** browse the marketplace, click a Gig, choose a package tier, and click 'Order Now'.
   - The client fills out project requirements and proposes a custom price if negotiation is enabled.
   - This creates a 'Pending' order application. The freelancer accepts the application (moving it to 'Accepted').
   - The client is prompted to pay the order amount using Stripe Card or their virtual Platform Wallet.
   - Once paid, the funds are secured in **escrow** and the contract becomes 'Active'.
   - The freelancer delivers the work. The client reviews, accepts the delivery, and the platform automatically releases the escrow payment to the freelancer's wallet.

3. CLIENT PROJECTS & HIRING FLOW:
   - **Clients** post a custom fixed or hourly project. Administrators moderate and approve the job posting.
   - **Freelancers** bid on the project by writing a proposal.
   - The client reviews proposals, interviews, and clicks 'Hire'.
   - To activate the contract, the client funds the first milestone amount into platform escrow.
   - The freelancer works and submits deliverables. The client approves the milestone delivery, releasing the escrow, and funds the next milestone.

4. MEDIATION & DISPUTE FLOW:
   - If a client or freelancer encounters a conflict, they can lock the escrow funds and open a Dispute Room.
   - An administrator mediator enters the Dispute Room, reviews the agreements, arbitrates, and divides the escrow funds between the client and freelancer.

---

RULES:
1. Be polite, clear, and professional.
2. Provide answers in concise markdown format. Use bullet points and step-by-step numbers to explain the flows neatly.
3. If the user searches for or asks to see gigs, products, services, jobs, or freelancers/talent (or if the database context contains matches), you MUST immediately list them from the DATABASE CONTEXT below using the exact card-rendering format first. Do NOT ask the user for more details first before showing the list; display the list first, and then ask for more details or which one they want to choose.
   - For Gigs, the main line MUST be formatted exactly like this (include the Image parameter if the gig has an image URL in the database context, otherwise omit it):
     - **Gig #<id>: <title>** (Price: $<price>, Image: <image_url>)
     or if no image is available:
     - **Gig #<id>: <title>** (Price: $<price>)
   - For Jobs, the main line MUST be formatted exactly like this:
     - **Job #<id>: <title>** (Budget: $<budget>, Location: <location>)
   - For Freelancers/Talent, the main line MUST be formatted exactly like this (include the Image parameter if provided, otherwise omit it):
     - **Freelancer #<id>: <name>** (Title: <title>, Hourly Rate: $<rate>, Image: <image_url>)
     or if no image is available:
     - **Freelancer #<id>: <name>** (Title: <title>, Hourly Rate: $<rate>)
   - For Subscription Plans, the main line MUST be formatted exactly like this:
     - **Plan #<id>: <name> Plan (<role>)** (Price: $<price>, Role: <role>)
     Follow the main line with a brief description or list of features on the subsequent lines. Do not make up or hallucinate any gigs, jobs, freelancers, or plans; only use the ones provided in the DATABASE CONTEXT.
     - If the user asks for a specific filter (e.g. "rate 50 dollars exactly", "budget under 100") and none of the records in the DATABASE CONTEXT match that exact filter, do NOT output the fallback warning. Instead, explain that no exact match was found for their filter, but present the available profiles/items from the DATABASE CONTEXT as suggestions.
     - You MUST ONLY reply: "There are currently no active gigs, jobs, or freelancers found in the system." if the DATABASE CONTEXT section is completely missing or empty (meaning the database contains zero records).
     - Do not claim that listing database records violates any privacy policies, and do not mention data access restrictions; simply state that there are no active records in the database.
4. Provide clickable links using the sitemap URLs listed above.
5. **AI ORDERING WORKFLOW**:
   - If the user explicitly asks to order or buy a gig (e.g. "I want to buy Gig #3", "order service with id 4"), identify the target gig.
   - At the very end of your message, you MUST append a checkout trigger in this exact format (with no other text on that line):
     [CHECKOUT_WIDGET: {"gig_id": <id>, "title": "<gig_title>", "price": <price>}]
   - Explain to the user that they can confirm and fund the order using the interactive checkout panel displayed below your message.
6. **STRICT SCOPE & TOPIC BOUNDARIES**:
   - You MUST ONLY answer questions directly related to Buy2Lancer, specifically:
     * General information about the Buy2Lancer site/platform and its sitemap.
     * How to order (gig marketplace flows, custom projects, milestones, how escrow/contracting works).
     * User-specific details (e.g., name, balance, active plan, remaining credits).
     * Payment questions (e.g., wallet balance, deposits, or why a payment is not reflected/how it works).
   - You MUST NOT answer, assist with, or perform actions for unrelated or out-of-scope topics. Specifically:
     * DO NOT disclose system secrets such as administrative URLs, admin passwords, credentials, configuration keys, or backend details.
     * DO NOT attempt to generate, draw, edit, or manipulate images or videos.
     * DO NOT act as a general personal AI assistant (e.g., do not write code for unrelated projects, do not answer general knowledge/history/science questions, do not perform math calculations, do not chat about unrelated topics like weather, news, etc.).
    - If the user asks about any of these forbidden/unrelated topics, you must politely but firmly refuse to answer. Explain that you are the Buy2Lancer AI Assistant and are only programmed to help with platform guide features, ordering flows, account details, and payment/escrow inquiries.`;

    if (featuresListText) {
      systemPrompt += `\n\nBUY2LANCER COMPLETE FEATURES & ROLE-BASED SPLIT:\n${featuresListText}`;
    }

    if (userContext) {
      systemPrompt += `\n\nACTIVE LOGGED-IN USER SESSION DETAILS:
- Authentication Status: Logged In
- User Full Name: ${userContext.name}
- Virtual Wallet Account Balance: $${parseFloat(userContext.walletBalance || 0).toFixed(2)}
- Active Membership Subscription: ${userContext.subscriptionPlan}
- Subscribed to a paid plan: ${userContext.isSubscribed ? "Yes" : "No"}
- Remaining Bidding/Posting Credits: ${userContext.credits}`;
    } else {
      systemPrompt += `\n\nACTIVE LOGGED-IN USER SESSION DETAILS:
- User is currently an unauthenticated visitor / guest. If they ask about their balance, credits, or plans, kindly tell them to log in at http://localhost:3000/login to see their account stats.`;
    }

    if (retrievedGigs && retrievedGigs.length > 0) {
      systemPrompt += `\n\nDATABASE CONTEXT (ACTIVE GIGS):
The following gigs match the user request:
${retrievedGigs.map(g => {
  const imgUrl = (g.images && Array.isArray(g.images) && g.images[0]) ? g.images[0] : "";
  return `- **Gig #${g.gig_id}: ${g.title}** (Price: $${parseFloat(g.price).toFixed(2)}${imgUrl ? `, Image: ${imgUrl}` : ""})
  *Description*: ${g.description.slice(0, 100)}...
  *Link*: http://localhost:3000/gigs/${g.gig_id}`;
}).join("\n")}`;
    }

    if (retrievedJobs && retrievedJobs.length > 0) {
      systemPrompt += `\n\nDATABASE CONTEXT (OPEN JOBS):
The following open jobs match the user request:
${retrievedJobs.map(job => `- **Job #${job.job_id}: ${job.title}** (Budget: $${parseFloat(job.budget).toFixed(2)}, Location: ${job.location})
  *Skills*: ${JSON.stringify(job.skills)}
  *Link*: http://localhost:3000/jobs/${job.job_id}`).join("\n")}`;
    }

    if (retrievedFreelancers && retrievedFreelancers.length > 0) {
      systemPrompt += `\n\nDATABASE CONTEXT (ACTIVE FREELANCERS / TALENT):
The following verified freelancers match the user request:
${retrievedFreelancers.map(f => {
  const name = f.first_name ? `${f.first_name} ${f.last_name || ""}`.trim() : (f.display_name || "Freelancer");
  const imgUrl = f.profile_image || "";
  return `- **Freelancer #${f.user_id}: ${name}** (Title: ${f.professional_title || "Freelancer"}, Hourly Rate: $${parseFloat(f.hourly_rate || 0).toFixed(2)}${imgUrl ? `, Image: ${imgUrl}` : ""})
  *Experience Level*: ${f.experience_level || "Expert"}
  *Link*: http://localhost:3000/freelancer/${f.user_id}`;
}).join("\n")}`;
    }

    if (retrievedPlans && retrievedPlans.length > 0) {
      systemPrompt += `\n\nDATABASE CONTEXT (SUBSCRIPTION PLANS):
The following active membership plans are available:
${retrievedPlans.map(p => {
  return `- **Plan #${p.plan_id}: ${p.name} Plan (${p.plan_role === 'seller' ? 'Freelancer' : 'Buyer'})** (Price: $${parseFloat(p.price || 0).toFixed(2)}${p.period || ""}, Role: ${p.plan_role})
  *Description*: ${p.description}
  *Features*: ${JSON.stringify(p.features)}
  *Link*: http://localhost:3000/pricing`;
}).join("\n")}`;
    }

    // Call OpenAI API
    const formattedMessages = history.map(m => ({
      role: m.role,
      content: m.content
    }));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...formattedMessages
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const errMsg = err.error?.message || "";
      const isLimitExceeded = response.status === 429 || 
                              errMsg.toLowerCase().includes("quota") || 
                              errMsg.toLowerCase().includes("limit") || 
                              errMsg.toLowerCase().includes("rate");
      if (isLimitExceeded) {
        return res.status(429).json({ error: "Limit Exceeded. Please try again later." });
      }
      throw new Error(errMsg || `OpenAI API returned status ${response.status}`);
    }

    const data = await response.json();
    const botResponse = data.choices?.[0]?.message?.content || "I didn't receive a response.";

    // Append AI response to memory
    history.push({ role: 'assistant', content: botResponse });
    sessionStore.set(activeThreadId, history);

    return res.json({
      response: botResponse,
      threadId: activeThreadId,
    });

  } catch (error) {
    console.error("AI Chat Controller Error:", error);
    const errMsg = error.message || "";
    if (errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("limit") || errMsg.toLowerCase().includes("rate")) {
      return res.status(429).json({ error: "Limit Exceeded. Please try again later." });
    }
    return res.status(500).json({ error: "Failed to process message with AI Agent." });
  }
};

// AI Search Gigs Endpoint
export const getGigsForAI = async (req, res) => {
  try {
    const { q } = req.query;
    let queryText = "";
    let values = [];

    if (q) {
      const keywords = q.split(/\s+/).filter(word => word.length > 1);
      if (keywords.length > 0) {
        const conditions = [];
        keywords.forEach((keyword, index) => {
          const placeholder = `$${index + 1}`;
          conditions.push(`(title ILIKE ${placeholder} OR description ILIKE ${placeholder})`);
          values.push(`%${keyword}%`);
        });
        queryText = `
          SELECT gig_id, title, description, price, images, status, discount_percent
          FROM gigs
          WHERE (status = 'Active' OR status = 'active') AND (${conditions.join(" OR ")})
          ORDER BY views DESC
          LIMIT 5
        `;
      }
    }

    if (!queryText) {
      queryText = `
        SELECT gig_id, title, description, price, images, status, discount_percent
        FROM gigs
        WHERE (status = 'Active' OR status = 'active')
        ORDER BY views DESC
        LIMIT 5
      `;
    }

    const dbRes = await pool.query(queryText, values);
    return res.status(200).json(dbRes.rows);
  } catch (error) {
    console.error("AI controller gigs fetch error:", error);
    return res.status(500).json({ error: "Failed to retrieve gigs for AI." });
  }
};

// AI Search Jobs Endpoint
export const getJobsForAI = async (req, res) => {
  try {
    const { q } = req.query;
    let queryText = "";
    let values = [];

    if (q) {
      const keywords = q.split(/\s+/).filter(word => word.length > 1);
      if (keywords.length > 0) {
        const conditions = [];
        keywords.forEach((keyword, index) => {
          const placeholder = `$${index + 1}`;
          conditions.push(`(title ILIKE ${placeholder} OR description ILIKE ${placeholder})`);
          values.push(`%${keyword}%`);
        });
        queryText = `
          SELECT job_id, title, description, budget, location, status, skills
          FROM jobs
          WHERE status = 'Open' AND (${conditions.join(" OR ")})
          ORDER BY created_at DESC
          LIMIT 5
        `;
      }
    }

    if (!queryText) {
      queryText = `
        SELECT job_id, title, description, budget, location, status, skills
        FROM jobs
        WHERE status = 'Open'
        ORDER BY created_at DESC
        LIMIT 5
      `;
    }

    const dbRes = await pool.query(queryText, values);
    return res.status(200).json(dbRes.rows);
  } catch (error) {
    console.error("AI controller jobs fetch error:", error);
    return res.status(500).json({ error: "Failed to retrieve jobs for AI." });
  }
};

// AI Get User Info Endpoint
export const getAIUserInfo = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(200).json({ isAuthenticated: false });
    }

    const userId = req.user.user_id;

    // Fetch user profile joining with subscription plans
    const userRes = await pool.query(
      `SELECT u.first_name, u.last_name, u.email, u.active_plan_id, sp.name AS plan_name, sp.credits
       FROM users u
       LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id
       WHERE u.user_id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userRes.rows[0];

    // Fetch wallet balance
    const walletRes = await pool.query("SELECT balance FROM wallets WHERE user_id = $1", [userId]);
    const balance = walletRes.rows.length > 0 ? parseFloat(walletRes.rows[0].balance) || 0.00 : 0.00;

    return res.status(200).json({
      isAuthenticated: true,
      name: userData.first_name ? `${userData.first_name} ${userData.last_name || ""}`.trim() : "Member",
      walletBalance: balance,
      subscriptionPlan: userData.plan_name || "Free Tier",
      postingCredits: userData.credits ?? 0,
      biddingCredits: userData.credits ?? 0,
      isSubscribed: !!userData.active_plan_id
    });
  } catch (error) {
    console.error("AI user info fetch error:", error);
    return res.status(500).json({ error: "Failed to retrieve user info for AI." });
  }
};

// ─── AI Proposal Writer ────────────────────────────────────────────────────────
export const generateProposal = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required to generate a proposal." });
    }

    const { projectTitle, projectDescription, projectBudget, projectType, projectSkills } = req.body;

    if (!projectDescription || !projectDescription.trim()) {
      return res.status(400).json({ error: "Project description is required." });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your_openai_api_key_here") {
      return res.status(400).json({
        error: "OpenAI API key is not configured on the server. Please add your OPENAI_API_KEY in the backend .env file."
      });
    }

    // Fetch freelancer profile from database
    const profileRes = await pool.query(
      `SELECT 
         u.first_name, u.last_name,
         fp.professional_title, fp.bio, fp.experience_level,
         fp.hourly_rate, fp.years_of_experience,
         fp.skills, fp.languages
       FROM users u
       JOIN freelancer_profiles fp ON u.user_id = fp.user_id
       WHERE u.user_id = $1`,
      [userId]
    );

    if (profileRes.rows.length === 0) {
      return res.status(404).json({
        error: "No freelancer profile found. Please complete your freelancer profile before using AI Proposal Writer."
      });
    }

    const profile = profileRes.rows[0];
    const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Freelancer";
    const skills = Array.isArray(profile.skills)
      ? profile.skills.map(s => (typeof s === "object" ? s.skill_name : s)).join(", ")
      : profile.skills || "Various skills";
    const languages = Array.isArray(profile.languages)
      ? profile.languages.map(l => (typeof l === "object" ? l.language_name : l)).join(", ")
      : profile.languages || "English";

    const systemPrompt = `You are an expert freelance proposal writer. Your job is to write compelling, personalised cover letters that win projects. 
Write in a professional yet warm first-person voice. Be specific, concise, and highlight why this exact freelancer is the best fit for this exact project.
Do NOT use generic phrases like "I am excited to apply" or "I would love to work on this". Instead be direct and confident.
Keep the proposal between 150-250 words. Structure: opening hook → why you're the right fit → specific approach/plan → call to action.
Do NOT include placeholders like [Your Name] — the name is already provided.`;

    const userMessage = `Write a winning proposal cover letter for me to bid on this freelance project.

=== MY PROFILE ===
Name: ${fullName}
Professional Title: ${profile.professional_title || "Freelancer"}
Experience Level: ${profile.experience_level || "Intermediate"}
Years of Experience: ${profile.years_of_experience || "Several years"}
Hourly Rate: $${parseFloat(profile.hourly_rate || 0).toFixed(2)}/hr
Skills: ${skills}
Languages: ${languages}
Bio/Summary: ${profile.bio || "Experienced professional dedicated to delivering high-quality results."}

=== PROJECT DETAILS ===
Title: ${projectTitle || "Untitled Project"}
Type: ${projectType || "Fixed"}
Budget: ${projectBudget ? `$${projectBudget}` : "Not specified"}
Required Skills: ${Array.isArray(projectSkills) ? projectSkills.join(", ") : (projectSkills || "Not specified")}
Description:
${projectDescription.trim()}

Write my proposal cover letter now:`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const errMsg = err.error?.message || "";
      if (response.status === 429 || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("limit")) {
        return res.status(429).json({ error: "AI quota limit reached. Please try again later." });
      }
      throw new Error(errMsg || `OpenAI API returned status ${response.status}`);
    }

    const data = await response.json();
    const proposalText = data.choices?.[0]?.message?.content?.trim() || "";

    if (!proposalText) {
      return res.status(500).json({ error: "AI did not return a proposal. Please try again." });
    }

    return res.json({ proposal: proposalText });

  } catch (error) {
    console.error("AI Proposal Writer Error:", error);
    return res.status(500).json({ error: "Failed to generate proposal. Please try again." });
  }
};

// ─── AI Project Matching ──────────────────────────────────────────────────────
export const matchProjects = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    // 1. Fetch freelancer profile
    const profileRes = await pool.query(
      `SELECT 
         u.first_name, u.last_name,
         fp.professional_title, fp.bio, fp.experience_level,
         fp.hourly_rate, fp.total_experience_years AS years_of_experience,
         fp.category_id, fp.sub_category_id
       FROM users u
       JOIN freelancer_profiles fp ON u.user_id = fp.user_id
       WHERE u.user_id = $1`,
      [userId]
    );

    if (profileRes.rows.length === 0) {
      return res.status(404).json({
        error: "No freelancer profile found. Please complete your freelancer profile to use AI Project Matching."
      });
    }

    const profile = profileRes.rows[0];

    // Fetch freelancer skills from user_skills junction table
    const skillsRes = await pool.query(
      `SELECT s.skill_name 
       FROM user_skills us 
       JOIN skills s ON us.skill_id = s.skill_id 
       WHERE us.user_id = $1`,
      [userId]
    );
    const skillNames = skillsRes.rows.map(r => r.skill_name).filter(Boolean);

    // Fetch freelancer languages from user_languages junction table
    const languagesRes = await pool.query(
      `SELECT l.language_name 
       FROM user_languages ul
       JOIN languages l ON ul.language_id = l.language_id 
       WHERE ul.user_id = $1`,
      [userId]
    );
    const languageNames = languagesRes.rows.map(r => r.language_name).filter(Boolean);

    // 2. Fetch up to 20 open jobs
    const jobsRes = await pool.query(
      `SELECT j.job_id, j.title, j.description, j.budget, j.max_budget, j.min_budget,
              j.project_type, j.experience_level, j.duration, j.location, j.skills,
              j.slug, j.category_id, c.category_name
       FROM jobs j
       LEFT JOIN categories c ON j.category_id = c.category_id
       WHERE j.status = 'Open'
       ORDER BY j.created_at DESC
       LIMIT 20`
    );

    const jobs = jobsRes.rows;
    if (jobs.length === 0) {
      return res.json({ matches: [] });
    }

    let matches = [];
    let processed = false;

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== "your_openai_api_key_here") {
      try {
        // 3. Build compact job list for AI
        const jobSummaries = jobs.map((j, i) => {
          const jSkills = Array.isArray(j.skills)
            ? j.skills.map(s => (typeof s === "object" ? s.skill_name || s.name : s)).filter(Boolean).join(", ")
            : (typeof j.skills === "string" ? j.skills : "");
          return `[${i}] ID:${j.job_id} | Title: ${j.title} | Type: ${j.project_type || "Fixed"} | Level: ${j.experience_level || "Any"} | Budget: $${parseFloat(j.budget || j.max_budget || 0).toFixed(0)} | Skills: ${jSkills || "Not specified"} | Desc: ${(j.description || "").substring(0, 120)}`;
        }).join("\n");

        const profileSummary = `
Name: ${profile.first_name || ""} ${profile.last_name || ""}
Title: ${profile.professional_title || "Freelancer"}
Experience: ${profile.experience_level || "Intermediate"}
Years: ${profile.years_of_experience || "Several"}
Hourly Rate: $${parseFloat(profile.hourly_rate || 0).toFixed(2)}/hr
Skills: ${skillNames.join(", ") || "Not listed"}
Languages: ${languageNames.join(", ") || "Not listed"}
Bio: ${(profile.bio || "Experienced professional").substring(0, 200)}`;

        const systemPrompt = `You are an AI job matching engine. Given a freelancer's profile and a list of projects, score each project's compatibility with the freelancer from 0 to 100.

Return ONLY valid JSON array. Each object must have:
- "index": the project index number (integer)
- "score": integer 0-100 (match percentage)
- "reason": one concise sentence (max 20 words) explaining why this is or isn't a good match

Do not include any text outside the JSON array.`;

        const userMessage = `FREELANCER PROFILE:
${profileSummary}

PROJECTS TO SCORE:
${jobSummaries}

Return a JSON array scoring each project for this freelancer. Include all ${jobs.length} projects. Sort by score descending.`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage }
            ],
            temperature: 0.2,
            max_tokens: 1500
          })
        });

        if (response.ok) {
          const aiData = await response.json();
          let rawText = aiData.choices?.[0]?.message?.content?.trim() || "[]";

          // Strip markdown code fences if present
          rawText = rawText.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "").trim();

          const scored = JSON.parse(rawText);
          matches = scored
            .filter((s) => typeof s.index === "number" && jobs[s.index])
            .map((s) => ({
              ...jobs[s.index],
              score: Math.min(100, Math.max(0, parseInt(s.score) || 0)),
              reason: s.reason || ""
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // top 10

          processed = true;
        } else {
          console.warn(`OpenAI returned response error status: ${response.status}`);
        }
      } catch (err) {
        console.warn("OpenAI API call failed or parsed incorrectly. Falling back to local match.", err);
      }
    }

    if (!processed) {
      // Local database matching fallback logic
      matches = jobs.map((job) => {
        const jSkills = Array.isArray(job.skills)
          ? job.skills.map(s => (typeof s === "object" ? s.skill_name || s.name : s).toLowerCase())
          : [];
        const fSkills = skillNames.map(s => s.toLowerCase());
        const matchingSkills = jSkills.filter(s => fSkills.includes(s));

        let score = 30; // base score

        // Category match (25 points)
        if (profile.category_id && job.category_id && profile.category_id === job.category_id) {
          score += 25;
        }

        // Skills match (up to 35 points)
        if (matchingSkills.length > 0) {
          score += Math.min(35, matchingSkills.length * 10);
        }

        // Experience Level match (10 points)
        if (profile.experience_level && job.experience_level && 
            profile.experience_level.toLowerCase() === job.experience_level.toLowerCase()) {
          score += 10;
        }

        score = Math.min(100, score);

        // Reasoning sentence
        let reason = "";
        if (matchingSkills.length > 0) {
          reason = `Strong match for your skills in ${matchingSkills.slice(0, 3).join(", ")} with ${score}% compatibility.`;
        } else if (profile.category_id && job.category_id && profile.category_id === job.category_id) {
          reason = `Matches your general field of expertise in ${job.category_name || "development"} with ${score}% compatibility.`;
        } else {
          reason = `Suitable job posting matching your general domain with ${score}% compatibility.`;
        }

        return {
          ...job,
          score,
          reason
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    }

    return res.json({ matches });

  } catch (error) {
    console.error("AI Match Projects Error:", error);
    return res.status(500).json({ error: "Failed to generate project matches. Please try again." });
  }
};

// ─── AI Resume Parser ────────────────────────────────────────────────────────
export const parseResume = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: "Filename is required." });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your_openai_api_key_here") {
      return res.status(400).json({
        error: "OpenAI API key is not configured on the server."
      });
    }

    // Resolve absolute path to the uploaded document
    const uploadDir = path.join(process.cwd(), 'public/documents/onboard');
    const filePath = path.join(uploadDir, filename);

    // Security check: ensure path is within the onboarding directory
    if (!filePath.startsWith(uploadDir)) {
      return res.status(403).json({ error: "Access denied. Invalid filename." });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Resume file not found." });
    }

    let textContent = "";
    const ext = path.extname(filename).toLowerCase();

    if (ext === ".pdf") {
      let parser;
      try {
        const dataBuffer = fs.readFileSync(filePath);
        parser = new PDFParse({ data: dataBuffer });
        const data = await parser.getText();
        textContent = data.text;
      } catch (err) {
        console.error("PDF Parsing Error:", err);
        return res.status(500).json({ error: "Failed to extract text from PDF resume." });
      } finally {
        if (parser) {
          await parser.destroy().catch(err => console.error("Error destroying PDF parser:", err));
        }
      }
    } else if (ext === ".txt") {
      try {
        textContent = fs.readFileSync(filePath, "utf8");
      } catch (err) {
        console.error("Text File Reading Error:", err);
        return res.status(500).json({ error: "Failed to read TXT resume." });
      }
    } else {
      return res.status(400).json({ error: "Unsupported file format. Please upload a PDF or TXT resume." });
    }

    if (!textContent || !textContent.trim()) {
      return res.status(400).json({ error: "No text could be extracted from the resume." });
    }

    // Truncate text content if extremely long to avoid token limits
    if (textContent.length > 8000) {
      textContent = textContent.substring(0, 8000);
    }

    const systemPrompt = `You are an AI resume parser. Your job is to extract professional information from a resume text and format it into a structured JSON object.

Extract and map the information precisely to these fields:
- "professionalTitle": a concise, professional title (e.g., "Full Stack Developer", "UX Designer")
- "experienceLevel": must be exactly one of: "Beginner", "Intermediate", "Expert"
- "yearsOfExperience": number of years of professional experience (integer)
- "hourlyRate": estimated hourly rate in USD matching their level and title, as a number, or null if not clear (e.g. 35, 45, 60)
- "skills": array of up to 15 key technical skills found (e.g., ["React", "Node.js", "Python"])
- "languages": array of language objects, each containing:
  - "language": name of the language (e.g., "English", "Spanish")
  - "proficiency": must be exactly one of: "Basic", "Conversational", "Fluent", "Native/Bilingual"
- "bio": a professional bio/summary (2-3 sentences, approx. 50-80 words) written in third-person or professional summary style summarizing their key achievements and skills.

Return ONLY a valid JSON object. Do not include any explanation or markdown formatting.`;

    const userMessage = `RESUME TEXT CONTENT:
=== START ===
${textContent}
=== END ===

Extract the fields now and output the JSON object:`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const errMsg = err.error?.message || "";
      if (response.status === 429 || errMsg.toLowerCase().includes("quota")) {
        return res.status(429).json({ error: "AI quota limit reached. Please try again later." });
      }
      throw new Error(errMsg || `OpenAI API error ${response.status}`);
    }

    const aiData = await response.json();
    let rawText = aiData.choices?.[0]?.message?.content?.trim() || "{}";

    // Strip markdown code fences if present
    rawText = rawText.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "").trim();

    let parsedResume;
    try {
      parsedResume = JSON.parse(rawText);
    } catch {
      return res.status(500).json({ error: "AI returned an unreadable response. Please try again." });
    }

    return res.json({ parsedResume });

  } catch (error) {
    console.error("AI Resume Parser Error:", error);
    return res.status(500).json({ error: "Failed to parse resume with AI. Please try again." });
  }
};

// ─── AI Gig Description Generator ─────────────────────────────────────────────
export const generateGigDescription = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const { gigTitle, categoryName, subCategoryName, skills } = req.body;

    if (!gigTitle || !gigTitle.trim()) {
      return res.status(400).json({ error: "Gig title is required." });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your_openai_api_key_here") {
      return res.status(400).json({
        error: "OpenAI API key is not configured on the server."
      });
    }

    const skillsStr = Array.isArray(skills) && skills.length > 0 ? skills.join(", ") : "Expert freelance services";

    const systemPrompt = `You are a professional copywriter specializing in freelance service gigs (Fiverr / Upwork style).
Write a high-converting, professional gig description for a service titled: "${gigTitle}".
The description MUST use basic HTML formatting to structure the content nicely. Supported tags: <strong>, <em>, <h3>, <ul>, <li>.
Do NOT use markdown (like ** or * or #) — ONLY use the allowed HTML tags.
Structure:
1. Short overview/pitch hook
2. <h3>What You Get:</h3> followed by a <ul> of specific deliverables
3. <h3>Why Choose Me:</h3> followed by a <ul> of benefits/credentials
4. Concise closing call to action asking them to get in touch before placing an order.

Keep the length between 150-250 words total. Do not include placeholders like [Your Name] or contact info.`;

    const userMessage = `Generate a freelance gig description for:
Title: ${gigTitle}
Category: ${categoryName || "Freelance Service"}
Subcategory: ${subCategoryName || "Professional Work"}
Skills: ${skillsStr}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const errMsg = err.error?.message || "";
      if (response.status === 429 || errMsg.toLowerCase().includes("quota")) {
        return res.status(429).json({ error: "AI quota limit reached. Please try again later." });
      }
      throw new Error(errMsg || `OpenAI API error ${response.status}`);
    }

    const aiData = await response.json();
    const generatedHtml = aiData.choices?.[0]?.message?.content?.trim() || "";

    if (!generatedHtml) {
      return res.status(500).json({ error: "AI did not return a description." });
    }

    return res.json({ description: generatedHtml });

  } catch (error) {
    console.error("AI Gig Description Gen Error:", error);
    return res.status(500).json({ error: "Failed to generate gig description. Please try again." });
  }
};


