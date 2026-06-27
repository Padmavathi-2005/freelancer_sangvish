import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';
import pool from './src/config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database Connected');

    // Startup migration for gig_applications
    await pool.query(`
      ALTER TABLE gig_applications 
      ADD COLUMN IF NOT EXISTS milestones JSONB
    `);
    console.log('✅ gig_applications milestones column check completed');

    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.handshake.query.userId;
        if (userId) {
            socket.join(`user_${userId}`);
            console.log(`🔌 User connected and joined room user_${userId}: socketId=${socket.id}`);
        }

        socket.on('disconnect', () => {
            if (userId) {
                console.log(`🔌 User disconnected: userId=${userId}, socketId=${socket.id}`);
            }
        });
    });

    // Make io accessible globally in app
    app.set('io', io);

    httpServer.listen(PORT, () => {
        console.log(`🚀 Server running with Socket.io on port ${PORT}`);
    });
} catch (error) {
    console.error('❌ Database Connection Failed');
    console.error(error.message);
}