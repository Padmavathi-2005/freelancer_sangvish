import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import userRoutes from './routes/userRoutes.js';
import adminRoutes from './admin/routes/adminRoutes.js';
import categoryRoutes from './admin/routes/categoryRoutes.js';
import subCategoryRoutes from './admin/routes/subCategoryRoutes.js';
import skillRoutes from './admin/routes/skillRoutes.js';
import freelancerRoutes from './routes/freelancerRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import { getSettings } from './admin/controllers/settingsController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Attach socket.io instance to requests
app.use((req, res, next) => {
  req.io = req.app.get('io');
  next();
});

// Serve uploaded files statically
app.use('/public', express.static(path.join(__dirname, '../public')));

app.get('/api/settings', getSettings);
app.use("/api/admin", adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/freelancer', freelancerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wallet', walletRoutes);


app.use("/api/admin/categories",categoryRoutes);
app.use("/api/admin/sub-categories",subCategoryRoutes);
app.use("/api/admin/skills", skillRoutes);

export default app;