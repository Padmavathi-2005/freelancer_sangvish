import * as Skill from "../models/skillModel.js";

export const getSkills = async (req, res) => {
    try {

        const result =
            await Skill.getAllSkills();

        res.status(200).json(result.rows);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

export const getSkill = async (req, res) => {
    try {

        const { id } = req.params;

        const result =
            await Skill.getSkillById(id);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Skill not found"
            });
        }

        res.status(200).json(
            result.rows[0]
        );

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

export const addSkill = async (req, res) => {
    try {
        const {
            sub_category_id,
            skill_name,
            status
        } = req.body;

        if (!sub_category_id || isNaN(Number(sub_category_id)) || Number(sub_category_id) <= 0) {
            return res.status(400).json({
                message: "Please select a valid parent subcategory."
            });
        }

        if (!skill_name || !skill_name.trim()) {
            return res.status(400).json({
                message: "Please enter a skill name."
            });
        }

        const result =
            await Skill.createSkill(
                sub_category_id,
                skill_name.trim(),
                status ?? true
            );

        res.status(201).json({
            message: "Skill created successfully",
            skill: result.rows[0]
        });

    } catch (error) {
        if (error.code === '23503' || (error.message && error.message.includes('foreign key constraint'))) {
            return res.status(400).json({
                message: "Selected parent subcategory does not exist. Please select a valid parent subcategory."
            });
        }
        res.status(500).json({
            message: error.message
        });
    }
};

export const editSkill = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            sub_category_id,
            skill_name,
            status
        } = req.body;

        if (!sub_category_id || isNaN(Number(sub_category_id)) || Number(sub_category_id) <= 0) {
            return res.status(400).json({
                message: "Please select a valid parent subcategory."
            });
        }

        if (!skill_name || !skill_name.trim()) {
            return res.status(400).json({
                message: "Please enter a skill name."
            });
        }

        const result =
            await Skill.updateSkill(
                id,
                sub_category_id,
                skill_name.trim(),
                status
            );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Skill not found"
            });
        }

        res.status(200).json({
            message: "Skill updated successfully",
            skill: result.rows[0]
        });

    } catch (error) {
        if (error.code === '23503' || (error.message && error.message.includes('foreign key constraint'))) {
            return res.status(400).json({
                message: "Selected parent subcategory does not exist. Please select a valid parent subcategory."
            });
        }
        res.status(500).json({
            message: error.message
        });
    }
};

export const removeSkill = async (req, res) => {
    try {

        const { id } = req.params;

        const result =
            await Skill.deleteSkill(id);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Skill not found"
            });
        }

        res.status(200).json({
            message: "Skill deleted"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

export const getSkillsBySubCategory =
async (req, res) => {

    try {

        const { sub_category_id } =
            req.params;

        const result =
            await Skill.getSkillsBySubCategory(
                sub_category_id
            );

        res.status(200).json(
            result.rows
        );

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};