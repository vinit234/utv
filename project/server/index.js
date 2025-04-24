import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Store active users
const activeUsers = new Map();
// Store waiting users
const waitingUsers = [];

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Add user to active users
  activeUsers.set(socket.id, { id: socket.id });

  // User requests to start a new chat
  socket.on('start_chat', () => {
    // Check if user is already in a chat
    const user = activeUsers.get(socket.id);
    
    if (user && user.roomId) {
      socket.emit('error', { message: 'You are already in a chat' });
      return;
    }

    // Check if there are any waiting users
    if (waitingUsers.length > 0 && !waitingUsers.includes(socket.id)) {
      // Get the first waiting user
      const partnerId = waitingUsers.shift();
      
      // Create a new room
      const roomId = uuidv4();
      
      // Update both users with room info
      activeUsers.set(socket.id, { id: socket.id, roomId, partnerId });
      activeUsers.set(partnerId, { id: partnerId, roomId, partnerId: socket.id });
      
      // Join both users to the room
      socket.join(roomId);
      io.sockets.sockets.get(partnerId)?.join(roomId);
      
      // Notify both users that they are matched
      io.to(roomId).emit('chat_started', { roomId });
      io.to(socket.id).emit('user_connected', { partnerId });
      io.to(partnerId).emit('user_connected', { partnerId: socket.id });
    } else {
      // Add user to waiting list
      if (!waitingUsers.includes(socket.id)) {
        waitingUsers.push(socket.id);
        socket.emit('waiting');
      }
    }
  });

  // Handle next chat request (skip current partner)
  socket.on('next_chat', () => {
    const user = activeUsers.get(socket.id);
    
    if (user && user.roomId) {
      const { roomId, partnerId } = user;
      
      // Notify other user that the chat ended
      if (partnerId) {
        socket.to(partnerId).emit('chat_ended', { reason: 'partner_left' });
        
        // Reset other user's room info
        const partner = activeUsers.get(partnerId);
        if (partner) {
          activeUsers.set(partnerId, { id: partnerId });
        }
      }
      
      // Leave room
      socket.leave(roomId);
      
      // Reset user's room info
      activeUsers.set(socket.id, { id: socket.id });
      
      // Start a new chat
      socket.emit('chat_ended', { reason: 'you_left' });
    }
  });

  // Handle WebRTC signaling
  socket.on('signal', ({ to, signal }) => {
    const user = activeUsers.get(socket.id);
    
    if (user && user.roomId) {
      io.to(to).emit('signal', { from: socket.id, signal });
    }
  });

  // Handle chat messages
  socket.on('send_message', ({ message }) => {
    const user = activeUsers.get(socket.id);
    
    if (user && user.roomId && user.partnerId) {
      io.to(user.partnerId).emit('receive_message', { 
        from: socket.id, 
        message 
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const user = activeUsers.get(socket.id);
    
    if (user && user.roomId && user.partnerId) {
      // Notify partner
      socket.to(user.partnerId).emit('chat_ended', { reason: 'partner_left' });
      
      // Reset partner's room info
      const partner = activeUsers.get(user.partnerId);
      if (partner) {
        activeUsers.set(user.partnerId, { id: user.partnerId });
      }
    }
    
    // Remove user from active users
    activeUsers.delete(socket.id);
    
    // Remove user from waiting list
    const waitingIndex = waitingUsers.indexOf(socket.id);
    if (waitingIndex !== -1) {
      waitingUsers.splice(waitingIndex, 1);
    }
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});