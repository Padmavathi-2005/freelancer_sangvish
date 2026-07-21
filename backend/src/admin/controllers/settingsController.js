import { Settings } from "../../models/settingsModel.js";

const SECRET_KEYS_PATTERN = /secret|password|pass|token|api_key|credential/i;
const PUBLIC_KEYS_EXCEPTIONS = /publishable|public|site_key|direction|status/i;

function isSecretKey(key) {
    return SECRET_KEYS_PATTERN.test(key) && !PUBLIC_KEYS_EXCEPTIONS.test(key);
}

function safeParseJson(val) {
    if (typeof val === "object" && val !== null) return val;
    try {
        return JSON.parse(val);
    } catch (e) {
        return val;
    }
}

function maskSecrets(obj) {
    if (!obj || typeof obj !== "object") return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => maskSecrets(item));
    }

    const masked = {};
    for (const [key, val] of Object.entries(obj)) {
        if (isSecretKey(key)) {
            if (val && typeof val === "string" && val.trim() !== "") {
                masked[key] = "***";
            } else if (val) {
                masked[key] = "***";
            } else {
                masked[key] = val;
            }
        } else if (typeof val === "object" && val !== null) {
            masked[key] = maskSecrets(val);
        } else {
            masked[key] = val;
        }
    }
    return masked;
}

function mergeIncomingWithDbSecrets(incoming, existing) {
    if (!incoming || typeof incoming !== "object") return incoming;
    if (!existing || typeof existing !== "object") return incoming;

    if (Array.isArray(incoming)) {
        return incoming;
    }

    const merged = {};
    for (const [key, val] of Object.entries(incoming)) {
        const existingVal = existing[key];

        if (isSecretKey(key)) {
            const isMasked = typeof val === "string" && /^\*+$/.test(val);
            if (isMasked && existingVal !== undefined) {
                merged[key] = existingVal;
            } else {
                merged[key] = val;
            }
        } else if (typeof val === "object" && val !== null && existingVal && typeof existingVal === "object") {
            merged[key] = mergeIncomingWithDbSecrets(val, existingVal);
        } else {
            merged[key] = val;
        }
    }
    return merged;
}

const processRowForResponse = (row) => {
    if (!row) return row;
    const isString = typeof row.setting_value === "string";
    const parsedVal = safeParseJson(row.setting_value);
    const maskedVal = maskSecrets(parsedVal);
    return {
        ...row,
        setting_value: isString ? JSON.stringify(maskedVal) : maskedVal
    };
};

// GET ALL SETTINGS
export const getSettings = async (req, res) => {
    try {
        const result = await Settings.getAll();
        const processedRows = result.rows.map(row => processRowForResponse(row));
        res.status(200).json(processedRows);
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

        // Fetch existing setting value
        const existingRow = await Settings.getByKey(setting_key);
        let finalValue = setting_value;

        if (existingRow) {
            const incomingParsed = safeParseJson(setting_value);
            const existingParsed = safeParseJson(existingRow.setting_value);
            finalValue = mergeIncomingWithDbSecrets(incomingParsed, existingParsed);
        }

        const result = await Settings.upsert(
            category || "general",
            setting_key,
            finalValue
        );

        // Mask the returned setting row for response
        const responseRow = processRowForResponse(result.rows[0]);

        res.status(200).json({
            message: "Setting updated successfully.",
            setting: responseRow
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
