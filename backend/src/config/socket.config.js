const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PATCH', 'PUT']
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Client kết nối Socket: ${socket.id}`);

        // Lễ tân tham gia room để nhận thông báo realtime
        socket.on('join_receptionist', () => {
            socket.join('receptionist_room');
            console.log(`Lễ tân ${socket.id} đã tham gia receptionist_room`);
        });

        socket.on('disconnect', () => {
            console.log(`🔴 Client ngắt kết nối: ${socket.id}`);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io chưa được khởi tạo!");
    }
    return io;
};

module.exports = {
    initSocket,
    getIo
};
