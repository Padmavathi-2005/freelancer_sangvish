import * as SubCategory from "../models/subCategoryModel.js";

export const getSubCategories = async (req, res) => {
    try {

        const result =
            await SubCategory.getAllSubCategories();

        res.status(200).json(result.rows);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

export const getSubCategory = async (req, res) => {
    try {

        const { id } = req.params;

        const result =
            await SubCategory.getSubCategoryById(id);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Sub category not found"
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

export const addSubCategory = async (req, res) => {
    try {

        const {
            category_id,
            sub_category_name,
            sub_category_image,
            status
        } = req.body;

        const result =
            await SubCategory.createSubCategory(
                category_id,
                sub_category_name,
                sub_category_image || null,
                status ?? true
            );

        res.status(201).json({
            message: "Sub category created",
            sub_category: result.rows[0]
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

export const editSubCategory = async (req, res) => {
    try {

        const { id } = req.params;

        const {
            category_id,
            sub_category_name,
            sub_category_image,
            status
        } = req.body;

        const result =
            await SubCategory.updateSubCategory(
                id,
                category_id,
                sub_category_name,
                sub_category_image,
                status
            );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Sub category not found"
            });
        }

        res.status(200).json({
            message: "Sub category updated",
            sub_category: result.rows[0]
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

export const removeSubCategory = async (req, res) => {
    try {

        const { id } = req.params;

        const result =
            await SubCategory.deleteSubCategory(id);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Sub category not found"
            });
        }

        res.status(200).json({
            message: "Sub category deleted"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};