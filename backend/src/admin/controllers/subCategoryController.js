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

        if (!category_id || isNaN(Number(category_id)) || Number(category_id) <= 0) {
            return res.status(400).json({
                message: "Please select a valid parent category."
            });
        }

        if (!sub_category_name || !sub_category_name.trim()) {
            return res.status(400).json({
                message: "Please enter a subcategory name."
            });
        }

        const result =
            await SubCategory.createSubCategory(
                category_id,
                sub_category_name.trim(),
                sub_category_image || null,
                status ?? true
            );

        res.status(201).json({
            message: "Subcategory created successfully",
            sub_category: result.rows[0]
        });

    } catch (error) {
        if (error.code === '23503' || (error.message && error.message.includes('foreign key constraint'))) {
            return res.status(400).json({
                message: "Selected parent category does not exist. Please select a valid parent category."
            });
        }
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

        if (!category_id || isNaN(Number(category_id)) || Number(category_id) <= 0) {
            return res.status(400).json({
                message: "Please select a valid parent category."
            });
        }

        if (!sub_category_name || !sub_category_name.trim()) {
            return res.status(400).json({
                message: "Please enter a subcategory name."
            });
        }

        const result =
            await SubCategory.updateSubCategory(
                id,
                category_id,
                sub_category_name.trim(),
                sub_category_image,
                status
            );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Subcategory not found"
            });
        }

        res.status(200).json({
            message: "Subcategory updated successfully",
            sub_category: result.rows[0]
        });

    } catch (error) {
        if (error.code === '23503' || (error.message && error.message.includes('foreign key constraint'))) {
            return res.status(400).json({
                message: "Selected parent category does not exist. Please select a valid parent category."
            });
        }
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