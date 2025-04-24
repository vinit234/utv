import React from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useAppContext } from '../context/AppContext';
import { Mic, MicOff, Camera, CameraOff, SkipForward } from 'lucide-react';

const VideoChat: React.FC = () => {
  const { inChat, waiting, nextChat } = useAppContext();
  const {
    localVideoRef,
    remoteVideoRef,
    isMuted,
    isCameraOff,
    isConnected,
    mediaError,
    toggleMute,
    toggleCamera,
  } = useWebRTC();

  return (
    <div className="flex flex-col w-full h-full">
      {mediaError && (
        <div className="bg-red-500 text-white p-3 mb-4 rounded">
          {mediaError}. Please make sure your camera and microphone are connected and you've given permission to use them.
        </div>
      )}

      <div className="relative w-full h-full bg-gray-800 rounded-lg overflow-hidden">
        {/* Remote Video (Main view) */}
        <div className="absolute inset-0 flex items-center justify-center">
          {inChat ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover transition-opacity duration-300 ${isConnected ? 'opacity-100' : 'opacity-0'}`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              {waiting ? (
                <div className="animate-pulse">
                  <div className="text-xl font-medium mb-2">Looking for someone to chat with...</div>
                  <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mt-4"></div>
                </div>
              ) : (
                <div className="text-xl font-medium mb-2">Click "Start Chat" to begin</div>
              )}
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-picture) */}
        <div className="absolute bottom-4 right-4 w-1/4 md:w-1/5 aspect-video rounded-lg overflow-hidden shadow-lg z-10 transition-all duration-300 hover:scale-105">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover bg-gray-900"
          />
          <div className={`absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 ${isCameraOff ? 'opacity-100' : 'opacity-0'}`}>
            <CameraOff size={24} />
          </div>
        </div>

        {/* Connection Status */}
        {inChat && !isConnected && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded-full text-sm">
            Connecting...
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-gray-900 bg-opacity-75 px-6 py-3 rounded-full backdrop-blur-sm transition-all duration-300 hover:bg-opacity-90">
          <button
            onClick={toggleMute}
            className={`p-2 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'} transition-colors duration-200`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          
          <button
            onClick={toggleCamera}
            className={`p-2 rounded-full ${isCameraOff ? 'bg-red-500' : 'bg-gray-700'} transition-colors duration-200`}
            title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isCameraOff ? <CameraOff size={20} /> : <Camera size={20} />}
          </button>
          
          <button
            onClick={nextChat}
            className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            title="Find New Partner"
          >
            <SkipForward size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;