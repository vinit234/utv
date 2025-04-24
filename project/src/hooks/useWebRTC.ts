import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useWebRTC = () => {
  const { socket, inChat, partnerId } = useAppContext();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Function to get media stream
  const getMedia = async () => {
    try {
      // First check if we already have a stream
      if (localStream) {
        return localStream;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setMediaError(null);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setMediaError('Could not access camera or microphone');
      return null;
    }
  };

  // Clean up resources
  const cleanupConnection = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setIsConnected(false);
    setRemoteStream(null);
    
    // Don't stop local stream here as we can reuse it for the next connection
  };

  // Initialize WebRTC when chat starts
  useEffect(() => {
    let isCurrentPartner = true;
    
    if (inChat && partnerId && socket) {
      // Clean up any existing connection first
      cleanupConnection();
      
      // Create peer connection
      const initializeConnection = async () => {
        try {
          // Get local media stream
          const stream = await getMedia();
          if (!stream || !isCurrentPartner) return;

          // Create RTCPeerConnection
          const peerConnection = new RTCPeerConnection(configuration);
          peerConnectionRef.current = peerConnection;

          // Add local tracks to the connection
          stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
          });

          // Handle remote tracks
          peerConnection.ontrack = (event) => {
            console.log('Remote track received');
            if (!isCurrentPartner) return;
            
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
            }
          };

          // ICE candidate handling
          peerConnection.onicecandidate = (event) => {
            if (!isCurrentPartner) return;
            
            if (event.candidate) {
              socket.emit('signal', {
                to: partnerId,
                signal: {
                  type: 'ice-candidate',
                  candidate: event.candidate,
                },
              });
            }
          };

          // Connection state change
          peerConnection.onconnectionstatechange = () => {
            if (!isCurrentPartner) return;
            
            console.log('Connection state:', peerConnection.connectionState);
            if (peerConnection.connectionState === 'connected') {
              setIsConnected(true);
            } else if (['disconnected', 'failed', 'closed'].includes(peerConnection.connectionState)) {
              setIsConnected(false);
            }
          };

          // Create offer if we are the initiator
          const createOffer = async () => {
            try {
              if (!isCurrentPartner) return;
              
              const offer = await peerConnection.createOffer();
              await peerConnection.setLocalDescription(offer);
              
              socket.emit('signal', {
                to: partnerId,
                signal: {
                  type: 'offer',
                  sdp: peerConnection.localDescription,
                },
              });
            } catch (error) {
              console.error('Error creating offer:', error);
            }
          };

          // Wait a moment to ensure connection is set up properly
          setTimeout(() => {
            if (isCurrentPartner) {
              createOffer();
            }
          }, 1000);
        } catch (error) {
          console.error('Error initializing WebRTC:', error);
        }
      };

      initializeConnection();

      // Signal event handler
      const handleSignal = async ({ from, signal }: { from: string; signal: any }) => {
        // Ensure signal is from current partner
        if (from !== partnerId || !isCurrentPartner) return;

        try {
          // Handle different signal types
          if (signal.type === 'offer') {
            // Ensure we have a peer connection
            if (!peerConnectionRef.current) {
              const stream = await getMedia();
              if (!stream || !isCurrentPartner) return;

              const peerConnection = new RTCPeerConnection(configuration);
              peerConnectionRef.current = peerConnection;

              // Add local tracks
              stream.getTracks().forEach(track => {
                peerConnection.addTrack(track, stream);
              });

              // Handle remote tracks
              peerConnection.ontrack = (event) => {
                if (!isCurrentPartner) return;
                
                setRemoteStream(event.streams[0]);
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = event.streams[0];
                }
              };

              // ICE candidate handling
              peerConnection.onicecandidate = (event) => {
                if (!isCurrentPartner) return;
                
                if (event.candidate) {
                  socket.emit('signal', {
                    to: partnerId,
                    signal: {
                      type: 'ice-candidate',
                      candidate: event.candidate,
                    },
                  });
                }
              };

              // Connection state change
              peerConnection.onconnectionstatechange = () => {
                if (!isCurrentPartner) return;
                
                if (peerConnection.connectionState === 'connected') {
                  setIsConnected(true);
                } else if (['disconnected', 'failed', 'closed'].includes(peerConnection.connectionState)) {
                  setIsConnected(false);
                }
              };
            }

            // Set remote description from offer
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            
            // Create answer
            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);
            
            // Send answer back
            socket.emit('signal', {
              to: partnerId,
              signal: {
                type: 'answer',
                sdp: peerConnectionRef.current.localDescription,
              },
            });
          } else if (signal.type === 'answer') {
            if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'stable') {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            }
          } else if (signal.type === 'ice-candidate') {
            if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } else {
              // Queue ICE candidates if remote description is not set yet
              console.log('Received ICE candidate before remote description was set');
            }
          }
        } catch (error) {
          console.error('Error handling signal:', error);
        }
      };

      // Register signal handler
      socket.on('signal', handleSignal);

      // Cleanup
      return () => {
        isCurrentPartner = false;
        socket.off('signal', handleSignal);
        cleanupConnection();
      };
    }
  }, [inChat, partnerId, socket]);

  // Stop all media and clean up when user leaves chat
  useEffect(() => {
    if (!inChat && localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      setIsMuted(false);
      setIsCameraOff(false);
    }
  }, [inChat, localStream]);

  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    isMuted,
    isCameraOff,
    isConnected,
    mediaError,
    toggleMute,
    toggleCamera,
  };
};