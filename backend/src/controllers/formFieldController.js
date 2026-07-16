import { FormField } from "../models/formFieldModel.js";

// GET ALL FORM FIELD OPTIONS GROUPED BY KEY
export const getFormFieldOptions = async (req, res) => {
  try {
    const rows = await FormField.getAll();
    const grouped = rows.reduce((acc, row) => {
      if (!acc[row.field_key]) {
        acc[row.field_key] = [];
      }
      acc[row.field_key].push(row);
      return acc;
    }, {});
    res.status(200).json(grouped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD FORM FIELD OPTION (ADMIN)
export const addFormFieldOption = async (req, res) => {
  try {
    const { field_key, option_value } = req.body;
    if (!field_key || !option_value || !option_value.trim()) {
      return res.status(400).json({ message: "field_key and option_value are required." });
    }
    const option = await FormField.addOption(field_key, option_value);
    res.status(201).json({
      message: "Option added successfully.",
      option
    });
  } catch (error) {
    if (error.code === "23505") { // Unique violation check
      return res.status(400).json({ message: "This option already exists." });
    }
    res.status(500).json({ message: error.message });
  }
};

// DELETE FORM FIELD OPTION (ADMIN)
export const deleteFormFieldOption = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Option ID is required." });
    }
    const option = await FormField.deleteOption(id);
    if (!option) {
      return res.status(404).json({ message: "Option not found." });
    }
    res.status(200).json({
      message: "Option deleted successfully.",
      option
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
