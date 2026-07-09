import pool from '../config/db.js';
import { FreelancerProfile } from "../models/freelancerProfileModel.js";
import { Experience } from "../models/experienceModel.js";
import { Education } from "../models/educationModel.js";
import { Certification } from "../models/certificationModel.js";
import { FreelancerProject } from "../models/freelancerProjectModel.js";

async function run() {
  try {
    const userId = 7;

    const profileRes = await FreelancerProfile.findByUserId(userId);
    console.log("Profile success:", profileRes.rows.length);

    const experienceRes = await Experience.getByUserId(userId);
    console.log("Experience success:", experienceRes.rows.length);

    const educationRes = await Education.getByUserId(userId);
    console.log("Education success:", educationRes.rows.length);

    const certificationRes = await Certification.getByUserId(userId);
    console.log("Certification success:", certificationRes.rows.length);

    const projectsRes = await FreelancerProject.getByUserId(userId);
    console.log("Projects success:", projectsRes.rows.length);

  } catch (e) {
    console.error("FAILED calling model methods:", e);
  } finally {
    process.exit(0);
  }
}

run();
