require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { connectDB } = require('./src/config/db.config');

// Kết nối DB (Cho cả Vercel và Local)
connectDB().catch(err => {
    console.error('Failed to connect DB:', err);
});

// Chỉ mở Port khi chạy ở máy tính local (không phải trên Vercel)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    const server = http.createServer(app);
    
    // Đã tắt Socket.io để phù hợp với Vercel
    // const { initSocket } = require('./src/config/socket.config');
    // initSocket(server);
    
    server.listen(PORT, () => {
        console.log(`Server is running locally on port ${PORT}`);
    });
}

// Bắt buộc Export App để Vercel nhận diện được Backend
module.exports = app;
