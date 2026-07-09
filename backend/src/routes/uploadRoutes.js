import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Define storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'public/documents/onboard';
    if (file.mimetype.startsWith('image/')) {
      if (req.query.category === 'settings' || req.query.type === 'settings') {
        folder = 'public/images/settings';
      } else {
        folder = 'public/images/onboard';
      }
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'public/videos/onboard';
    }
    
    const destPath = path.join(__dirname, '../../', folder);
    
    // Create directory recursively if it doesn't exist
    fs.mkdirSync(destPath, { recursive: true });
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    
    // Determine relative URL path for the client
    let relativeFolder = 'public/documents/onboard';
    if (req.file.mimetype.startsWith('image/')) {
      if (req.query.category === 'settings' || req.query.type === 'settings') {
        relativeFolder = 'public/images/settings';
      } else {
        relativeFolder = 'public/images/onboard';
      }
    } else if (req.file.mimetype.startsWith('video/')) {
      relativeFolder = 'public/videos/onboard';
    }
    
    const fileUrl = `http://localhost:5000/${relativeFolder}/${req.file.filename}`;
    
    return res.status(200).json({
      message: 'File uploaded successfully!',
      url: fileUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ message: 'Internal server error during file upload.' });
  }
});

export default router;
