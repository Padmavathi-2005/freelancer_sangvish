import * as Category from "../models/categoryModel.js";

export const getCategories = async (req, res) => {
    try {
        const result = await Category.getAllCategories();

        res.status(200).json(result.rows);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

export const getCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await Category.getCategoryById(id);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

export const addCategory = async (req, res) => {
    try {

        const {
            category_name,
            category_image,
            status
        } = req.body;

        const result = await Category.createCategory(
            category_name,
            category_image || null,
            status ?? true
        );

        res.status(201).json({
            message: "Category created successfully",
            category: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

export const editCategory = async (req, res) => {
    try {

        const { id } = req.params;

        const {
            category_name,
            category_image,
            status
        } = req.body;

        const result = await Category.updateCategory(
            id,
            category_name,
            category_image,
            status
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        res.status(200).json({
            message: "Category updated successfully",
            category: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

export const removeCategory = async (req, res) => {
    try {

        const { id } = req.params;

        const result = await Category.deleteCategory(id);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        res.status(200).json({
            message: "Category deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};