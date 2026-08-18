import pool from './src/config/db.js';

const newBlogs = [
  {
    title: 'Master AI-Driven Freelance Workflows: How Developers & Designers Scale Output 10x',
    slug: 'master-ai-driven-freelance-workflows',
    summary: 'Discover how top freelancers leverage AI copilots, prompt engineering, automated code generators, and AI design assistants to deliver projects faster with unmatched quality.',
    content: `
      <h2>The Shift to AI-Assisted Freelancing</h2>
      <p>The global freelance ecosystem is undergoing a dramatic shift. Freelancers who embrace artificial intelligence tools are not just saving time—they are outputting higher quality work at speeds previously thought impossible.</p>
      
      <h3>1. Code Generation & Architecture Assistance</h3>
      <p>Using AI inline code assistants allows developers to boilerplate APIs, generate unit tests, and resolve edge-case errors in seconds. Rather than replacing developer logic, AI acts as an experienced senior reviewer in your editor.</p>
      
      <blockquote>
        "AI does not replace freelancers—freelancers who master AI replace those who do not."
      </blockquote>

      <h3>2. AI-Driven Visual Prototyping</h3>
      <p>For designers and front-end engineers, generative AI tools assist in producing moodboards, visual concepts, and UI component variations before committing to production code.</p>

      <h3>3. Key Best Practices</h3>
      <ul>
        <li><strong>Verify and Audit:</strong> Always human-review AI generated code for security vulnerabilities and performance bottlenecks.</li>
        <li><strong>Protect Client Intellectual Property:</strong> Ensure your AI tools do not train on private client codebases or confidential data.</li>
        <li><strong>Focus on Client Value:</strong> Pass the efficiency savings to your clients through faster turnarounds and comprehensive feature sets.</li>
      </ul>
    `,
    category: 'AI & Tech',
    is_published: true,
    author_name: 'David Chen',
    cover_image: '/public/images/blogs/blog_5_ai_workflows.jpg'
  },
  {
    title: 'The Ultimate Guide to Freelance Contract Negotiation & Client Communication',
    slug: 'ultimate-guide-to-freelance-contract-negotiation',
    summary: 'Master the art of pricing, milestone structuring, scope management, and professional communication to build long-term high-ticket client relationships.',
    content: `
      <h2>Mastering Client Negotiations</h2>
      <p>Successful freelancing relies as much on clear communication and solid contracts as it does on raw technical craftsmanship. Ambiguous terms lead to scope creep, delayed payments, and strained client relationships.</p>

      <h3>1. Always Define Clear Project Milestones</h3>
      <p>Break large projects into 3 to 4 distinct phase milestones. Each milestone must have unambiguous deliverables, review periods, and payout triggers.</p>

      <h3>2. How to Handle Scope Creep Gracefully</h3>
      <p>When a client requests additional features mid-project, never say a flat "no". Instead, offer a change order quote:</p>
      <pre><code>"I would be glad to implement feature X! That addition falls outside our current milestone scope. I can prepare a quick Change Order quote for $500, or we can schedule it for Phase 2 after launch."</code></pre>

      <h3>3. Five Non-Negotiable Contract Clauses</h3>
      <ul>
        <li><strong>Revision Limits:</strong> Specify exact number of revision rounds (e.g. 2 revision rounds per milestone).</li>
        <li><strong>IP Ownership:</strong> Intellectual property transfers only upon full payment receipt.</li>
        <li><strong>Cancellation & Kill Fee:</strong> Protect your invested time if a project is canceled halfway.</li>
        <li><strong>Client Asset Turnaround Timelines:</strong> Define timeline pauses if client feedback or assets are delayed.</li>
      </ul>
    `,
    category: 'Business & Strategy',
    is_published: true,
    author_name: 'Marcus Vance',
    cover_image: '/public/images/blogs/blog_6_contract_negotiation.jpg'
  },
  {
    title: 'Modern Full-Stack Security: Protecting Freelance Applications Against OWASP Top 10',
    slug: 'modern-full-stack-security-owasp-top-10',
    summary: 'A practical, actionable security checklist for React, Node.js, and PostgreSQL web applications to safeguard user data, authentication tokens, and server APIs.',
    content: `
      <h2>Why Full-Stack Security Matters for Freelancers</h2>
      <p>Building functional web apps is only half the battle—securing them against cyber vulnerabilities is paramount. Delivering insecure code can damage your reputation and put your clients at severe risk.</p>

      <h3>1. Parameterized Queries Against SQL Injection</h3>
      <p>Never concatenate dynamic string variables into raw SQL queries. Always use parameterized queries or trusted ORMs to neutralize SQL injection vectors:</p>
      <pre><code>// ❌ Dangerous (Vulnerable to SQLi):
const res = await pool.query(\`SELECT * FROM users WHERE email = '\${userEmail}'\`);

// ✅ Secure (Parameterized):
const res = await pool.query("SELECT * FROM users WHERE email = $1", [userEmail]);</code></pre>

      <h3>2. Secure JWT Storage & Cookie Flags</h3>
      <p>Store sensitive authentication tokens in <code>httpOnly</code>, <code>SameSite=Strict</code>, and <code>Secure</code> cookies to prevent Cross-Site Scripting (XSS) token theft.</p>

      <h3>3. API Rate Limiting & Input Validation</h3>
      <ul>
        <li><strong>Rate Limiting:</strong> Enforce rate limiters on login, password reset, and payment API endpoints.</li>
        <li><strong>Sanitize HTML Input:</strong> Always sanitize HTML user input using DOMPurify or sanitize-html before rendering.</li>
        <li><strong>Environment Secrets:</strong> Never commit <code>.env</code> credentials or API private keys into public version control.</li>
      </ul>
    `,
    category: 'Engineering',
    is_published: true,
    author_name: 'Sofia Al-Mansoor',
    cover_image: '/public/images/blogs/blog_7_security_owasp.jpg'
  },
  {
    title: 'Mastering Remote Team Collaboration: Tools, Async Communication & Timezone Management',
    slug: 'mastering-remote-team-collaboration',
    summary: 'Discover how distributed engineering and design teams coordinate complex projects, maintain momentum across timezones, and communicate asynchronously.',
    content: `
      <h2>The Async First Advantage</h2>
      <p>Working with global clients and distributed teams requires a shift from real-time meeting dependence to asynchronous-first communication. Asynchronous workflows keep teams focused while maintaining project velocity across continents.</p>

      <h3>1. Document Everything in Central Knowledge Repositories</h3>
      <p>If a decision or architecture pattern isn't documented, it doesn't exist. Maintain living README files, technical specs, and design handoff docs so teammates across timezones can proceed independently without waiting for meeting syncs.</p>

      <h3>2. Daily Async Standups & Status Check-Ins</h3>
      <p>Instead of forcing 30-minute video meetings across incompatible timezones, use concise text or loom updates detailing:</p>
      <ul>
        <li><strong>Yesterday:</strong> Key completed milestones and merged PRs.</li>
        <li><strong>Today:</strong> Current focus deliverables.</li>
        <li><strong>Blockers:</strong> Any immediate code or decision dependencies.</li>
      </ul>

      <h3>3. Best Tools for Distributed Teams</h3>
      <p>Pairing Slack/Discord for instant chat with GitHub/GitLab for code review, Figma for real-time design feedback, and LancerFlow for task milestones creates a seamless remote ecosystem.</p>
    `,
    category: 'Career & Growth',
    is_published: true,
    author_name: 'James Sterling',
    cover_image: '/public/images/blogs/blog_8_remote_collaboration.jpg'
  },
  {
    title: 'High-Converting Portfolio Design: Turn Casual Browsers Into Paying Clients',
    slug: 'high-converting-portfolio-design-guide',
    summary: 'Learn how to structure your portfolio case studies, showcase real business metrics, design compelling project banners, and build instant trust with potential clients.',
    content: `
      <h2>Your Portfolio is Your Sales Funnel</h2>
      <p>Most freelancer portfolios fail because they act as passive galleries rather than persuasive sales experiences. A high-converting portfolio demonstrates how your work solves tangible business problems and generates measurable ROI.</p>

      <h3>1. Structure Case Studies with Problem-Solution-Result</h3>
      <p>Don't just show screenshots—tell the project's story:</p>
      <ul>
        <li><strong>The Problem:</strong> What challenge did the client face? (e.g. High cart abandonment rate on mobile).</li>
        <li><strong>The Strategy & Execution:</strong> How did your technical or design decisions address the problem?</li>
        <li><strong>The Quantifiable Result:</strong> Highlight concrete metrics (e.g. 34% increase in mobile checkout conversions).</li>
      </ul>

      <h3>2. Leverage Social Proof & Client Testimonials</h3>
      <p>Place direct client quotes alongside project visuals. Authenticity builds rapid trust with prospects evaluating multiple candidates.</p>

      <h3>3. Include Clear Calls to Action (CTAs)</h3>
      <p>Every case study page should conclude with a prominent contact or booking button, making it effortless for interested clients to hire you immediately.</p>
    `,
    category: 'Design',
    is_published: true,
    author_name: 'Chloe Dubois',
    cover_image: '/public/images/blogs/blog_9_portfolio_design.jpg'
  },
  {
    title: 'Building Passive Income as a Freelancer: Digital Assets, Gigs & Recurring Retainers',
    slug: 'building-passive-income-for-freelancers',
    summary: 'Explore proven strategies to diversify your freelance revenue through recurring monthly maintenance retainers, pre-packaged Gigs, digital templates, and platform referrals.',
    content: `
      <h2>Unlocking Diversified Revenue Streams</h2>
      <p>Relying solely on one-off project contracts creates income spikes and dips. To achieve financial predictability, top freelancers layer passive and recurring income models into their service offerings.</p>

      <h3>1. Monthly Maintenance Retainers</h3>
      <p>After delivering a website or app, offer ongoing maintenance packages (security patches, backups, minor updates, performance audits). Retainers convert one-time client relationships into predictable monthly subscription revenue.</p>

      <h3>2. Pre-Packaged Gigs & Digital Products</h3>
      <p>Productize your expertise by creating fixed-scope Gigs, starter code templates, or UI kit libraries. Productized services reduce custom scoping friction and allow clients to purchase instantly.</p>

      <h3>3. Platform Affiliate & Referral Programs</h3>
      <p>Earn passive commissions by referring contractors, agencies, or client businesses to the LancerFlow marketplace platform.</p>
    `,
    category: 'Finance & Growth',
    is_published: true,
    author_name: 'Buy2Lancer Team',
    cover_image: '/public/images/blogs/blog_10_passive_income.jpg'
  }
];

async function seedNewBlogs() {
  try {
    for (const blog of newBlogs) {
      const checkRes = await pool.query('SELECT blog_id FROM blogs WHERE slug = $1', [blog.slug]);
      if (checkRes.rows.length === 0) {
        await pool.query(
          `INSERT INTO blogs (title, slug, summary, content, category, is_published, author_name, cover_image)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            blog.title,
            blog.slug,
            blog.summary,
            blog.content.trim(),
            blog.category,
            blog.is_published,
            blog.author_name,
            blog.cover_image
          ]
        );
        console.log(`✅ Seeded blog: "${blog.title}"`);
      } else {
        console.log(`ℹ️ Blog already exists: "${blog.title}"`);
      }
    }
    console.log('🎉 All 6 new blogs processed successfully!');
  } catch (err) {
    console.error('Error seeding new blogs:', err);
  } finally {
    process.exit(0);
  }
}

seedNewBlogs();
