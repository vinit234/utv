import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, MessageCircle, Users } from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  
  const startChatting = () => {
    navigate('/chat');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <header className="py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Video className="text-blue-500" size={28} />
          <span className="text-xl font-bold">VideoChat</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500">
            Talk to Strangers, Make New Friends
          </h1>
          
          <p className="text-xl text-gray-300 mb-8">
            Connect with random people from around the world through video chat. 
            Press one button and you're instantly matched with someone new.
          </p>
          
          <button
            onClick={startChatting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
          >
            Start Chatting Now
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl w-full">
          <div className="bg-gray-800 bg-opacity-50 p-6 rounded-xl">
            <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Video size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Video Chat</h3>
            <p className="text-gray-300">
              Face-to-face conversations with people from all walks of life.
            </p>
          </div>
          
          <div className="bg-gray-800 bg-opacity-50 p-6 rounded-xl">
            <div className="bg-violet-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Text Chat</h3>
            <p className="text-gray-300">
              Send messages alongside your video chat for better communication.
            </p>
          </div>
          
          <div className="bg-gray-800 bg-opacity-50 p-6 rounded-xl">
            <div className="bg-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Random Matching</h3>
            <p className="text-gray-300">
              Don't like your match? Just click next to find someone new.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-gray-400 text-sm">
        <p>© 2025 VideoChat. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;