require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { connectDB } = require('./src/config/db.config');

// Kết nối CSDL PostgreSQL Supabase
connectDB().catch(err => {
    console.error('Failed to connect DB:', err);
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Khởi chạy Socket.io cho đồng bộ thời gian thực
try {
    const { initSocket } = require('./src/config/socket.config');
    initSocket(server);
} catch (e) {
    console.log('Socket.io note:', e.message);
}

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
