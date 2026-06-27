import { Settings } from "../../models/settingsModel.js";

// GET ALL SETTINGS
export const getSettings = async (req, res) => {
    try {
        const result = await Settings.getAll();
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE OR UPSERT SETTING
export const updateSetting = async (req, res) => {
    try {
        const { category, setting_key, setting_value } = req.body;

        if (!setting_key || setting_value === undefined) {
            return res.status(400).json({ message: "setting_key and setting_value are required." });
        }

        const result = await Settings.upsert(
            category || "general",
            setting_key,
            setting_value
        );

        res.status(200).json({
            message: "Setting updated successfully.",
            setting: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
