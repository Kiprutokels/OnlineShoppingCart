import { Server } from "socket.io";

const initSocketIO = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*", // Allow all origins
            credentials: true,
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log(`🟢 New client connected: ${socket.id}`);
        
        // Verify authentication token
        const token = socket.handshake.auth?.token;
        if (!token) {
            console.log("Connection rejected: No auth token");
            socket.disconnect();
            return;
        }
        
        // Send initial network status
        socket.emit("networkStatus", { status: "connected" });

        // Handle disconnection
        socket.on("disconnect", () => {
            console.log(`🔴 Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export { initSocketIO };