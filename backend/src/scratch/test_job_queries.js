import pool from "../config/db.js";
import Job from "../models/jobModel.js";

async function test() {
  try {
    console.log("Testing Job.findAllActive...");
    const jobs = await Job.findAllActive();
    console.log(`Success! Found ${jobs.length} jobs.`);
    
    console.log("Testing Job.findByClientId for client 1...");
    const clientJobs = await Job.findByClientId(1);
    console.log(`Success! Found ${clientJobs.length} client jobs.`);
  } catch (err) {
    console.error("❌ Test failed with error:", err);
  } finally {
    await pool.end();
  }
}

test();
