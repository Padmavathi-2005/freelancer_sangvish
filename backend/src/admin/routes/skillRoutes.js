import express from "express";

import {
    getSkills,
    getSkill,
    addSkill,
    editSkill,
    removeSkill,
    getSkillsBySubCategory
} from "../controllers/skillController.js";

const router = express.Router();

router.get("/", getSkills);

router.get("/:id", getSkill);

router.post("/", addSkill);

router.put("/:id", editSkill);

router.delete("/:id", removeSkill);

router.get(
    "/subcategory/:sub_category_id",
    getSkillsBySubCategory
);

export default router;