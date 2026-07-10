import pool from "../config/db.js";

async function seedBlogs() {
  try {
    console.log("Seeding blog database with 3 premium mock articles...");

    // Find the first user in database to associate as the author (optional)
    const userRes = await pool.query("SELECT user_id FROM users LIMIT 1");
    const authorId = userRes.rows.length > 0 ? userRes.rows[0].user_id : null;
    console.log(`Associating blogs with author_id: ${authorId || "NULL (No users exist)"}`);

    // Clean existing mock articles with same slugs
    await pool.query("DELETE FROM blogs WHERE slug IN ($1, $2, $3)", [
      "10-tips-succeed-remote-freelancer-2026",
      "how-to-hire-vett-top-developers-saas",
      "future-ai-web-development-copilots"
    ]);

    // Blog 1: Careers
    const blog1 = {
      title: "10 Tips to Succeed as a Remote Freelancer in 2026",
      slug: "10-tips-succeed-remote-freelancer-2026",
      summary: "Navigating the freelance landscape requires a mix of discipline, continuous skill acquisition, and branding. Here are the top ten strategies to succeed in today's remote economy.",
      cover_image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800",
      category: "Careers",
      is_published: true,
      author_name: "LancerFlow Career Team",
      content: `
        <h2>Navigating the Remote Gig Economy</h2>
        <p>The freelance landscape has evolved rapidly over the past few years. With remote workspaces becoming the standard global framework, independent professionals must stand out. Success in 2026 is no longer just about your technical skill level—it requires strong self-marketing, discipline, and outstanding communications.</p>
        
        <blockquote>
          "Success in freelancing isn't just about how well you code or design, it's about how well you communicate and manage client expectations."
          <cite class="block text-xs text-slate-400 mt-2 font-bold not-italic">— LancerFlow Career Team</cite>
        </blockquote>

        <h3>Key Focus Areas for Growth</h3>
        <p>To scale your earnings and book recurring retainer clients, prioritize these three core pillars:</p>
        <ul class="list-disc pl-6 my-4 space-y-1.5">
          <li><strong>Build a Niche Portfolio:</strong> Generalists face heavy competition. Specialize in specific verticals like SaaS UI design or cloud infrastructure migration.</li>
          <li><strong>Clear Communication Channels:</strong> Over-communicate milestone updates. Send weekly updates and flag risks early.</li>
          <li><strong>Continuous Skill Acquisition:</strong> Allocate at least 4 hours a week to learn new tool integrations and frameworks.</li>
        </ul>

        <div class="p-4 rounded-xl border-l-4 bg-teal-50 dark:bg-teal-950/20 border-teal-500 text-teal-955 dark:text-teal-200 my-6">
          <p class="m-0 font-semibold text-sm leading-relaxed">Pro-Tip: Use LancerFlow's escrow contracts system to structure your payments and align work scope clearly before starting code work.</p>
        </div>
      `
    };

    // Blog 2: Hiring
    const blog2 = {
      title: "How to Hire and Vett Top-Tier Developers for Your SaaS Startup",
      slug: "how-to-hire-vett-top-developers-saas",
      summary: "Finding developers is easy, but vetting them for quality and startup culture alignment is hard. Learn how to construct a fast, high-conversion technical interview process.",
      cover_image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800",
      category: "Hiring",
      is_published: true,
      author_name: "Human Resources Core",
      content: `
        <h2>Vetting Talent for Early-Stage Tech Startups</h2>
        <p>Building an early product requires generalist engineers who can move fast, wear multiple hats, and debug complex production problems on their own. Standard enterprise whiteboard algorithms are outdated and filter out the builders you actually need.</p>
        
        <h3>A Modern Technical Assessment Blueprint</h3>
        <p>Here is a side-by-side comparison of old vetting techniques vs. high-conversion startup pipelines:</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 items-start">
          <div>
            <h4 class="text-sm font-bold text-rose-500">❌ Outdated Whiteboards</h4>
            <p class="text-xs text-slate-500 mt-1">Asking candidates to invert a binary tree on a blackboard triggers test anxiety and fails to measure actual workspace collaboration or system debugging.</p>
          </div>
          <div>
            <h4 class="text-sm font-bold text-emerald-500">✅ Live Pairing Sessions</h4>
            <p class="text-xs text-slate-500 mt-1">Ask the candidate to build a simple, working REST API endpoint or write a component together in real time. Pay them for their hours!</p>
          </div>
        </div>

        <div class="p-4 rounded-xl border-l-4 bg-amber-50 dark:bg-amber-950/20 border-amber-500 text-amber-955 dark:text-amber-200 my-6">
          <p class="m-0 font-semibold text-sm leading-relaxed">Important Checklist: Avoid long unpaid homework projects. Qualified developers are always in demand and will exit your pipeline if you ask for more than 2 hours of unpaid assessments.</p>
        </div>
      `
    };

    // Blog 3: Tech
    const blog3 = {
      title: "The Future of AI in Web Development: Co-Pilots and Autonomous Agents",
      slug: "future-ai-web-development-copilots",
      summary: "AI is changing how we build, debug, and ship software. Discover how modern development tools can elevate your workflow and save hours of routine boilerplates.",
      cover_image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
      category: "Tech",
      is_published: true,
      author_name: "LancerFlow Dev Team",
      content: `
        <h2>The AI Developer Workspace</h2>
        <p>Artificial Intelligence tools are shifting the role of software developers from syntax writers to systems architects. Understanding how to collaborate with AI LLM agents is becoming the most critical asset for web developers.</p>
        
        <h3>Sample Node Express Setup with AI-guided Checks</h3>
        <p>Here is how a clean validation middleware looks when integrated with standard Express frameworks:</p>

        <pre><code class="language-javascript">
// Validation middleware example
export const validateInput = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};
        </code></pre>

        <p>Using autonomous code assistants frees you up to solve real product architecture problems, optimize database indexes, and improve visual rendering speeds for users.</p>
      `
    };

    // Helper insert function
    const insertBlog = async (blog) => {
      const query = `
        INSERT INTO blogs (title, slug, summary, content, cover_image, author_id, category, is_published, author_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      const values = [
        blog.title,
        blog.slug,
        blog.summary,
        blog.content.trim(),
        blog.cover_image,
        authorId,
        blog.category,
        blog.is_published,
        blog.author_name
      ];
      const res = await pool.query(query, values);
      console.log(`Inserted: "${res.rows[0].title}" (Slug: ${res.rows[0].slug})`);
    };

    await insertBlog(blog1);
    await insertBlog(blog2);
    await insertBlog(blog3);

    console.log("✅ Seeding completed successfully!");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await pool.end();
  }
}

seedBlogs();
