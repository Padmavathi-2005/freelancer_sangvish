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

        const result =
            await Skill.createSkill(
                sub_category_id,
                skill_name,
                status ?? true
            );

        res.status(201).json({
            message: "Skill created",
            skill: result.rows[0]
        });

    } catch (error) {

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

        const result =
            await Skill.updateSkill(
                id,
                sub_category_id,
                skill_name,
                status
            );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Skill not found"
            });
        }

        res.status(200).json({
            message: "Skill updated",
            skill: result.rows[0]
        });

    } catch (error) {

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