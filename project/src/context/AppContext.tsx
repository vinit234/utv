import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface AppContextProps {
  socket: Socket | null;
  connected: boolean;
  inChat: boolean;
  waiting: boolean;
  partnerId: string | null;
  roomId: string | null;
  messages: Message[];
  setInChat: React.Dispatch<React.SetStateAction<boolean>>;
  setWaiting: React.Dispatch<React.SetStateAction<boolean>>;
  setPartnerId: React.Dispatch<React.SetStateAction<string | null>>;
  setRoomId: React.Dispatch<React.SetStateAction<string | null>>;
  startChat: () => void;
  nextChat: () => void;
  sendMessage: (text: string) => void;
  addMessage: (message: Message) => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'partner';
  timestamp: Date;
}

// Create context
const AppContext = createContext<AppContextProps | null>(null);

// Create provider
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [inChat, setInChat] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3002');
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
      setInChat(false);
      setWaiting(false);
      setPartnerId(null);
      setRoomId(null);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Additional socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('waiting', () => {
      console.log('Waiting for partner...');
      setWaiting(true);
      setInChat(false);
      setPartnerId(null);
      setRoomId(null);
      setMessages([]);
    });

    socket.on('chat_started', ({ roomId }) => {
      console.log('Chat started in room:', roomId);
      setRoomId(roomId);
      setWaiting(false);
      setInChat(true);
    });

    socket.on('user_connected', ({ partnerId }) => {
      console.log('Partner connected:', partnerId);
      setPartnerId(partnerId);
    });

    socket.on('chat_ended', ({ reason }) => {
      console.log('Chat ended:', reason);
      setInChat(false);
      setWaiting(false);
      setPartnerId(null);
      setRoomId(null);
      setMessages([]);
    });

    socket.on('receive_message', ({ from, message }) => {
      console.log('Message received:', message);
      addMessage({
        id: `${from}-${Date.now()}`,
        text: message,
        sender: 'partner',
        timestamp: new Date(),
      });
    });

    // Cleanup event listeners
    return () => {
      socket.off('waiting');
      socket.off('chat_started');
      socket.off('user_connected');
      socket.off('chat_ended');
      socket.off('receive_message');
    };
  }, [socket]);

  // Start a new chat
  const startChat = () => {
    if (socket && connected) {
      setMessages([]);
      socket.emit('start_chat');
    }
  };

  // Find a new chat partner
  const nextChat = () => {
    if (socket && connected) {
      setMessages([]);
      socket.emit('next_chat');
    }
  };

  // Send a chat message
  const sendMessage = (text: string) => {
    if (socket && connected && inChat) {
      socket.emit('send_message', { message: text });
      
      // Add message to local state
      addMessage({
        id: `me-${Date.now()}`,
        text,
        sender: 'me',
        timestamp: new Date(),
      });
    }
  };

  // Add a message to the messages array
  const addMessage = (message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  // Context value
  const contextValue: AppContextProps = {
    socket,
    connected,
    inChat,
    waiting,
    partnerId,
    roomId,
    messages,
    setInChat,
    setWaiting,
    setPartnerId,
    setRoomId,
    startChat,
    nextChat,
    sendMessage,
    addMessage,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

// Custom hook to use the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};