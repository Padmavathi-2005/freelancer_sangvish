import pool from "../config/db.js";

// GET /api/documents/fields
export const getDocumentFields = async (req, res) => {
    try {
        const { role } = req.query;
        let query = "SELECT * FROM document_fields WHERE is_enabled = true";
        const params = [];
        
        if (role) {
            query += " AND (applicable_to = $1 OR applicable_to = 'both')";
            params.push(role);
        }
        
        query += " ORDER BY step_number ASC, field_id ASC";
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error getting document fields:", error);
        res.status(500).json({ message: "Failed to get document fields." });
    }
};

// GET /api/documents/my-docs
export const getMyDocuments = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await pool.query(
            `SELECT fd.*, df.field_name, df.field_key, df.is_required, df.has_expiry, df.field_type, df.step_number 
             FROM freelancer_documents fd 
             JOIN document_fields df ON fd.field_id = df.field_id 
             WHERE fd.user_id = $1 
             ORDER BY df.step_number ASC, df.field_id ASC`,
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error getting user documents:", error);
        res.status(500).json({ message: "Failed to get user documents." });
    }
};

// POST /api/documents/upload
export const uploadFreelancerDocument = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { field_id, file_url, text_value, expiry_date } = req.body;

        if (!field_id) {
            return res.status(400).json({ message: "Field ID is required." });
        }

        // Verify if field exists and has expiry
        const fieldCheck = await pool.query("SELECT * FROM document_fields WHERE field_id = $1", [field_id]);
        if (fieldCheck.rows.length === 0) {
            return res.status(404).json({ message: "Document requirement not found." });
        }

        const field = fieldCheck.rows[0];
        const isFileType = field.field_type.startsWith("file_");

        if (isFileType && !file_url) {
            return res.status(400).json({ message: `${field.field_name} requires a file upload.` });
        }
        if (!isFileType && !text_value) {
            return res.status(400).json({ message: `${field.field_name} requires a value.` });
        }

        const expDate = field.has_expiry && expiry_date ? expiry_date : null;

        const result = await pool.query(
            `INSERT INTO freelancer_documents (user_id, field_id, file_url, text_value, expiry_date, status, rejection_reason, submitted_at) 
             VALUES ($1, $2, $3, $4, $5, 'Pending', NULL, NOW()) 
             ON CONFLICT (user_id, field_id) 
             DO UPDATE SET file_url = EXCLUDED.file_url, text_value = EXCLUDED.text_value, expiry_date = EXCLUDED.expiry_date, status = 'Pending', rejection_reason = NULL, submitted_at = NOW() 
             RETURNING *`,
            [userId, field_id, isFileType ? file_url : null, !isFileType ? text_value : null, expDate]
        );

        res.status(200).json({
            message: "Document uploaded and submitted for vetting successfully.",
            document: result.rows[0]
        });
    } catch (error) {
        console.error("Error uploading freelancer document:", error);
        res.status(500).json({ message: "Failed to upload document." });
    }
};

// ==================== ADMIN ENDPOINTS ====================

// GET /api/documents/admin/fields
export const getAdminDocumentFields = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM document_fields ORDER BY applicable_to ASC, step_number ASC, field_id ASC"
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error getting admin document fields:", error);
        res.status(500).json({ message: "Failed to get admin document fields." });
    }
};

// POST /api/documents/admin/fields
export const createAdminDocumentField = async (req, res) => {
    try {
        const { field_name, field_description, is_required, is_enabled, has_expiry, applicable_to, field_type, step_number } = req.body;

        if (!field_name) {
            return res.status(400).json({ message: "Field name is required." });
        }

        // Generate unique key
        const generatedKey = field_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/(^_+|_+$)/g, "");

        // Check uniqueness of field_key
        const dupCheck = await pool.query("SELECT * FROM document_fields WHERE field_key = $1", [generatedKey]);
        let finalKey = generatedKey;
        if (dupCheck.rows.length > 0) {
            finalKey = `${generatedKey}_${Date.now()}`;
        }

        const finalStep = step_number ?? (applicable_to === "client" ? 4 : 5);

        const result = await pool.query(
            `INSERT INTO document_fields (field_key, field_name, field_description, is_required, is_enabled, has_expiry, applicable_to, field_type, step_number, is_system) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE) 
             RETURNING *`,
            [finalKey, field_name, field_description ?? "", is_required ?? true, is_enabled ?? true, has_expiry ?? true, applicable_to ?? "freelancer", field_type ?? "file_any", finalStep]
        );

        res.status(201).json({
            message: "Document requirement field created successfully.",
            field: result.rows[0]
        });
    } catch (error) {
        console.error("Error creating document field:", error);
        res.status(500).json({ message: "Failed to create document field." });
    }
};

// PUT /api/documents/admin/fields/:id
export const updateAdminDocumentField = async (req, res) => {
    try {
        const { id } = req.params;
        const { field_name, field_description, is_required, is_enabled, has_expiry, applicable_to, field_type, step_number } = req.body;

        const checkExist = await pool.query("SELECT * FROM document_fields WHERE field_id = $1", [id]);
        if (checkExist.rows.length === 0) {
            return res.status(404).json({ message: "Document field not found." });
        }

        const currentField = checkExist.rows[0];
        let finalName = field_name;
        let finalType = field_type;
        let finalApplicable = applicable_to;
        
        if (currentField.is_system) {
            finalName = currentField.field_name;
            finalType = currentField.field_type;
            finalApplicable = currentField.applicable_to;
        }

        const result = await pool.query(
            `UPDATE document_fields 
             SET field_name = $1, field_description = $2, is_required = $3, is_enabled = $4, has_expiry = $5, applicable_to = $6, field_type = $7, step_number = $8 
             WHERE field_id = $9 
             RETURNING *`,
            [finalName, field_description, is_required, is_enabled, has_expiry, finalApplicable, finalType ?? currentField.field_type, step_number ?? currentField.step_number, id]
        );

        res.status(200).json({
            message: "Document field updated successfully.",
            field: result.rows[0]
        });
    } catch (error) {
        console.error("Error updating document field:", error);
        res.status(500).json({ message: "Failed to update document field." });
    }
};

// DELETE /api/documents/admin/fields/:id
export const deleteAdminDocumentField = async (req, res) => {
    try {
        const { id } = req.params;
        const checkExist = await pool.query("SELECT * FROM document_fields WHERE field_id = $1", [id]);
        if (checkExist.rows.length === 0) {
            return res.status(404).json({ message: "Document field not found." });
        }

        if (checkExist.rows[0].is_system) {
            return res.status(400).json({ message: "System fields cannot be deleted." });
        }

        await pool.query("DELETE FROM document_fields WHERE field_id = $1", [id]);
        res.status(200).json({ message: "Document field deleted successfully." });
    } catch (error) {
        console.error("Error deleting document field:", error);
        res.status(500).json({ message: "Failed to delete document field." });
    }
};

// GET /api/documents/admin/user/:userId
export const getUserDocumentsForAdmin = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            `SELECT fd.*, df.field_name, df.field_key, df.is_required, df.has_expiry, df.field_type, df.step_number 
             FROM freelancer_documents fd 
             JOIN document_fields df ON fd.field_id = df.field_id 
             WHERE fd.user_id = $1 
             ORDER BY df.step_number ASC, df.field_id ASC`,
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error getting user documents for admin:", error);
        res.status(500).json({ message: "Failed to get user documents for admin." });
    }
};

// PUT /api/documents/admin/:documentId/status
export const updateDocumentStatus = async (req, res) => {
    try {
        const { documentId } = req.params;
        const { status, rejection_reason } = req.body;

        if (!status || !["Approved", "Rejected", "Pending"].includes(status)) {
            return res.status(400).json({ message: "Valid status is required." });
        }

        const checkExist = await pool.query("SELECT * FROM freelancer_documents WHERE document_id = $1", [documentId]);
        if (checkExist.rows.length === 0) {
            return res.status(404).json({ message: "Document record not found." });
        }

        const result = await pool.query(
            `UPDATE freelancer_documents 
             SET status = $1, rejection_reason = $2 
             WHERE document_id = $3 
             RETURNING *`,
            [status, status === "Rejected" ? (rejection_reason || "") : null, documentId]
        );

        res.status(200).json({
            message: `Document status updated to ${status} successfully.`,
            document: result.rows[0]
        });
    } catch (error) {
        console.error("Error updating document status:", error);
        res.status(500).json({ message: "Failed to update document status." });
    }
};
