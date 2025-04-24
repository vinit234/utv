import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Home } from 'lucide-react';
import VideoChat from '../components/VideoChat';
import TextChat from '../components/TextChat';
import { useAppContext } from '../context/AppContext';

const ChatPage: React.FC = () => {
  const { connected, inChat, waiting, startChat } = useAppContext();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 py-3 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Video className="text-blue-500" size={24} />
          <span className="text-lg font-bold">VideoChat</span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors duration-200"
          title="Go Home"
        >
          <Home size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col md:flex-row p-4 sm:p-6 gap-4 max-w-7xl mx-auto w-full">
        {/* Left Side - Video Chat */}
        <div className="w-full md:w-2/3 h-[400px] md:h-auto">
          <VideoChat />
        </div>

        {/* Right Side - Text Chat */}
        <div className="w-full md:w-1/3 h-[400px] md:h-auto">
          <TextChat />
        </div>
      </main>

      {/* Control Bar */}
      <div className="bg-gray-800 p-4 flex items-center justify-center">
        {!inChat && !waiting && (
          <button
            onClick={startChat}
            disabled={!connected}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-6 py-3 rounded-full text-lg font-medium transition-colors duration-200"
          >
            Start Chat
          </button>
        )}
        {waiting && (
          <div className="text-yellow-400 flex items-center">
            <div className="animate-spin mr-2 h-5 w-5 border-t-2 border-b-2 border-yellow-400 rounded-full"></div>
            Looking for someone to chat with...
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;