import { Button } from "@/components/ui/button";
import { ArrowLeft, Video, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { JWTService } from "@/lib/jwt-service";

interface MeetingRoomProps {
  username: string;
  roomName: string;
  role: 'student' | 'teacher';
  email?: string;
  password?: string;
  onLeave: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export const MeetingRoom = ({ username, roomName, role, email, password, onLeave }: MeetingRoomProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTeacher = role === 'teacher';

  useEffect(() => {
    const loadJitsiScript = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve(window.JitsiMeetExternalAPI);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://jit.shancloudservice.com/external_api.js';
        script.async = true;
        script.onload = () => resolve(window.JitsiMeetExternalAPI);
        script.onerror = () => reject(new Error('Failed to load Jitsi Meet API'));
        document.head.appendChild(script);
      });
    };

    const initializeJitsi = async () => {
      try {
        await loadJitsiScript();
        
        if (!jitsiContainerRef.current) return;

        // Check if we're on HTTPS or localhost
        const isSecureContext = window.location.protocol === 'https:' || 
                               window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1';

        if (!isSecureContext) {
          console.warn('Jitsi requires HTTPS for full functionality. Some features may not work over HTTP/IP.');
          toast({
            title: "Security Warning",
            description: "For full functionality, please use HTTPS or localhost",
            variant: "destructive",
          });
        }

        // Generate JWT token dynamically
        let jwt: string;
        try {
          if (email && password) {
            // Use authentication-based token generation
            const token = await JWTService.generateTokenWithAuth(email, password, roomName);
            if (token) {
              jwt = token;
            } else {
              throw new Error('Authentication failed');
            }
          } else {
            // Generate token directly with user data
            const userData = {
              username: username,
              email: email || `${username}@classroom.com`,
              role: isTeacher ? 'TUTOR' as const : 'STUDENT' as const
            };
            jwt = await JWTService.generateToken(userData, roomName);
          }
          console.log('Generated JWT token successfully');
        } catch (jwtError) {
          console.error('Failed to generate JWT token:', jwtError);
          // Fallback to hardcoded token
          jwt = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6Im15ZGVwbG95MSIsInN1YiI6ImppdC5zaGFuY2xvdWRzZXJ2aWNlLmNvbSIsInJvb20iOiIqIiwibW9kZXJhdG9yIjp0cnVlLCJleHAiOjE3NTQ2ODA5NzcsImNvbnRleHQiOnsidXNlciI6eyJuYW1lIjoicHJvamVjdCBtZWV0aW5nIiwiZW1haWwiOiJwcm9qZWN0QHNhbXBsZS5jb20ifX19.FG4cHbKtJ1RLPh5l1Pla5laxFZCAty5jucgnd31pOSE';
          toast({
            title: "JWT Warning",
            description: "Using fallback token - authentication may be limited",
            variant: "destructive",
          });
        }

        const options = {
          roomName: roomName,
          width: '100%',
          height: '600px',
          parentNode: jitsiContainerRef.current,
          jwt: jwt,
          userInfo: {
            displayName: username,
            email: email || `${username}@classroom.com`,
          },
          configOverwrite: {
            startWithAudioMuted: true,
            disableModeratorIndicator: true,
            enableEmailInStats: false,
            enableWelcomePage: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            analytics: {
              disabled: true,
            },
            disableThirdPartyRequests: true,
            // Force HTTPS and bypass security restrictions
            useHostPageLocalStorage: true,
            enableNoAudioDetection: false,
            enableNoisyMicDetection: false,
            // Allow insecure contexts (for IP access)
            constraints: {
              video: {
                height: {
                  ideal: 720,
                  max: 720,
                  min: 240
                }
              }
            },
            ...((!isTeacher) && {
              disableInviteFunctions: true,
              doNotStoreRoom: true,
            }),
          },
          interfaceConfigOverwrite: {
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            APP_NAME: "Virtual Classroom",
            DEFAULT_BACKGROUND: '#0F172A',
            DISABLE_DOMINANT_SPEAKER_INDICATOR: true,
            DISABLE_TRANSCRIPTION_SUBTITLES: true,
            DISABLE_RINGING: true,
            HIDE_INVITE_MORE_HEADER: true,
            TOOLBAR_BUTTONS: isTeacher ? [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'settings', 'raisehand', 'videoquality', 'filmstrip', 'invite',
              'tileview', 'select-background', 'help', 'mute-everyone'
            ] : [
              'microphone', 'camera', 'closedcaptions', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'tileview', 'select-background'
            ],
          },
        };

        apiRef.current = new window.JitsiMeetExternalAPI('jit.shancloudservice.com', options);

        // Event listeners
        apiRef.current.addEventListener('ready', () => {
          console.log("Jitsi API is ready");
          setIsLoading(false);
          toast({
            title: "Meeting Joined",
            description: `Joined as ${role}`,
          });
        });

        apiRef.current.addEventListener('videoConferenceLeft', () => {
          console.log("Left the meeting");
          onLeave();
        });

        apiRef.current.addEventListener('participantJoined', (participant: any) => {
          console.log("Participant joined:", participant);
          if (isTeacher) {
            toast({
              title: "Participant joined",
              description: `${participant.displayName} joined the meeting`,
            });
          }
        });

        // Handle connection failures
        apiRef.current.addEventListener('connectionFailed', () => {
          console.error("Connection failed");
          setError("Connection failed. Please check your internet connection and try again.");
          setIsLoading(false);
        });

        // Handle device errors
        apiRef.current.addEventListener('deviceListChanged', (devices: any) => {
          console.log("Available devices:", devices);
        });

      } catch (err: any) {
        console.error("Jitsi Meeting Error:", err);
        setError(`Meeting failed to load: ${err.message || 'Unknown error'}`);
        setIsLoading(false);
        toast({
          title: "Meeting Error",
          description: "Failed to load the meeting. Please try again.",
          variant: "destructive",
        });
      }
    };

    initializeJitsi();

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [username, roomName, role, onLeave, toast, isTeacher]);

  // Recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Reset recorded chunks
      recordedChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      });

      mediaRecorder.addEventListener('stop', () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: 'video/webm',
        });

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${roomName}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Recording Saved",
          description: "Meeting recording has been downloaded to your computer",
        });
      });

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast({
        title: "Recording Started",
        description: "Meeting recording has begun",
      });

      // Handle stream end (user stops screen sharing)
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopRecording();
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    setIsRecording(false);
    setRecordingTime(0);

    toast({
      title: "Recording Stopped",
      description: "Recording has been stopped and will be downloaded shortly",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleApiReady = (externalApi: any) => {
    console.log("Jitsi API is ready");
    setIsLoading(false);
    
    // Add event listeners for debugging
    externalApi.addEventListeners({
      readyToClose: () => {
        console.log("Meeting is ready to close");
        onLeave();
      },
      participantJoined: (participant: any) => {
        console.log("Participant joined:", participant);
        if (isTeacher) {
          toast({
            title: "Participant joined",
            description: `${participant.displayName} joined the meeting`,
          });
        }
      },
      videoConferenceJoined: () => {
        console.log("Successfully joined the meeting");
        toast({
          title: "Meeting Joined",
          description: `Joined as ${role}`,
        });
      },
      videoConferenceLeft: () => {
        console.log("Left the meeting");
        onLeave();
      }
    });
  };

  const handleError = (error: any) => {
    console.error("Jitsi Meeting Error:", error);
    setError(`Meeting failed to load: ${error.message || 'Unknown error'}`);
    setIsLoading(false);
    toast({
      title: "Meeting Error",
      description: "Failed to load the meeting. Please try again.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-meeting flex flex-col items-center justify-center p-4">
      <div className="bg-card border-b border-border p-4 w-full max-w-5xl flex items-center justify-between rounded-t-xl">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Room: {roomName}</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${role}/10 text-${role}`}>{role.toUpperCase()}</span>
          {isRecording && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-700 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">REC {formatTime(recordingTime)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isTeacher && (
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "secondary"}
              size="sm"
              className="mr-2"
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Start Recording
                </>
              )}
            </Button>
          )}
          <Button onClick={onLeave} variant="destructive" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Leave Meeting
          </Button>
        </div>
      </div>
      
      <div className="flex-1 w-full max-w-5xl mx-auto bg-card rounded-b-xl shadow-lg" style={{ minHeight: 600 }}>
        {error ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Meeting Error</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading meeting...</p>
                </div>
              </div>
            )}
            <div 
              ref={jitsiContainerRef} 
              className="w-full h-full rounded-b-xl"
              style={{ minHeight: 600 }}
            />
          </>
        )}
      </div>
    </div>
  );
};