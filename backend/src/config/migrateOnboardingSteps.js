import "dotenv/config";
import pool from "./db.js";

const migrateOnboardingSteps = async () => {
  try {
    // 1. Add step_number and is_system columns to document_fields
    await pool.query(`
      ALTER TABLE document_fields 
      ADD COLUMN IF NOT EXISTS step_number INT DEFAULT 5,
      ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE
    `);
    console.log("✅ 'document_fields.step_number' and 'is_system' columns ready.");

    // 2. Set default step_number for existing client fields to 4 (since client onboarding is 4 steps)
    await pool.query(`
      UPDATE document_fields 
      SET step_number = 4 
      WHERE applicable_to = 'client' AND (step_number = 5 OR step_number IS NULL)
    `);
    console.log("✅ Updated existing client document fields to default to Step 4.");

    // 3. Helper to insert/update system fields
    const seedSystemField = async (field_key, field_name, field_description, is_required, is_enabled, has_expiry, applicable_to, step_number) => {
      // Check if key already exists
      const checkExist = await pool.query("SELECT * FROM document_fields WHERE field_key = $1", [field_key]);
      if (checkExist.rows.length === 0) {
        await pool.query(`
          INSERT INTO document_fields (field_key, field_name, field_description, is_required, is_enabled, has_expiry, applicable_to, step_number, is_system)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
        `, [field_key, field_name, field_description, is_required, is_enabled, has_expiry, applicable_to, step_number]);
        console.log(`🌱 Seeded system field: ${field_key}`);
      } else {
        // Update its is_system status and step_number if it exists but is not marked as system
        await pool.query(`
          UPDATE document_fields
          SET is_system = TRUE, step_number = $2
          WHERE field_key = $1
        `, [field_key, step_number]);
        console.log(`🔄 Updated system field properties: ${field_key}`);
      }
    };

    // Freelancer default fields:
    await seedSystemField('title', 'Professional Title', 'Your professional headline representing your primary role.', true, true, false, 'freelancer', 1);
    await seedSystemField('category', 'Main Category', 'Your primary field of work.', true, true, false, 'freelancer', 1);
    await seedSystemField('experience_level', 'Experience Level', 'Your current experience tier (Entry, Intermediate, Expert).', true, true, false, 'freelancer', 1);
    await seedSystemField('hourly_rate', 'Hourly Rate', 'Your standard hourly billing rate in USD.', true, true, false, 'freelancer', 1);

    await seedSystemField('skills', 'Skills', 'The key skills and technologies you specialize in.', true, true, false, 'freelancer', 2);
    await seedSystemField('portfolio', 'Portfolio Projects', 'Showcase of your past work projects and links.', true, true, false, 'freelancer', 2);

    await seedSystemField('bio', 'Profile Bio', 'A summary of your professional background, skills, and values.', true, true, false, 'freelancer', 3);
    await seedSystemField('avatar', 'Profile Picture', 'Your professional profile photo.', true, true, false, 'freelancer', 3);

    await seedSystemField('linkedin', 'LinkedIn Profile', 'Link to your professional LinkedIn profile.', false, true, false, 'freelancer', 4);
    await seedSystemField('github', 'GitHub Profile', 'Link to your personal GitHub profile.', false, true, false, 'freelancer', 4);
    await seedSystemField('website', 'Personal Website', 'Link to your personal portfolio or website.', false, true, false, 'freelancer', 4);

    // Client default fields:
    await seedSystemField('company_name', 'Company Name', 'The official registered name of your business.', true, true, false, 'client', 1);
    await seedSystemField('industry', 'Industry', 'The primary industry sector your company operates in.', true, true, false, 'client', 1);
    await seedSystemField('company_size', 'Company Size', 'The number of employees in your organization.', true, true, false, 'client', 1);
    await seedSystemField('established_year', 'Established Year', 'The year your business was founded.', false, true, false, 'client', 1);

    await seedSystemField('company_website', 'Website URL', 'Your official company website link.', false, true, false, 'client', 2);
    await seedSystemField('company_description', 'Company Description', 'A detailed description of what your business does and its culture.', false, true, false, 'client', 2);

    await seedSystemField('hiring_contact_name', 'Hiring Contact Name', 'The full name of the hiring representative.', true, true, false, 'client', 3);
    await seedSystemField('hiring_contact_designation', 'Hiring Contact Designation', 'The job role or title of the hiring representative.', true, true, false, 'client', 3);

    console.log("🏁 Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateOnboardingSteps();
