import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MeetingRoomProps {
  username: string;
  roomName: string;
  role: 'student' | 'teacher';
  onLeave: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export const MeetingRoom = ({ username, roomName, role, onLeave }: MeetingRoomProps) => {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadJitsiScript = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve(window.JitsiMeetExternalAPI);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
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

        const isTeacher = role === 'teacher';
        
        const options = {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: username,
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            prejoinPageEnabled: false,
            // Student restrictions
            ...((!isTeacher) && {
              disableInviteFunctions: true,
              doNotStoreRoom: true,
            }),
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: isTeacher ? [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
              'tileview', 'select-background', 'download', 'help', 'mute-everyone'
            ] : [
              'microphone', 'camera', 'closedcaptions', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'tileview', 'select-background'
            ],
            SETTINGS_SECTIONS: isTeacher ? [
              'devices', 'language', 'moderator', 'profile', 'calendar'
            ] : [
              'devices', 'language', 'profile'
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: "",
            GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
            DISPLAY_WELCOME_PAGE_CONTENT: false,
            APP_NAME: "Virtual Classroom",
            DEFAULT_BACKGROUND: '#0F172A',
          },
        };

        apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', options);

        // Event listeners
        apiRef.current.addEventListener('ready', () => {
          setIsLoading(false);
          toast({
            title: "Connected to meeting",
            description: `Joined as ${role}`,
          });
        });

        apiRef.current.addEventListener('videoConferenceLeft', () => {
          onLeave();
        });

        apiRef.current.addEventListener('participantJoined', (participant: any) => {
          if (isTeacher) {
            toast({
              title: "Participant joined",
              description: `${participant.displayName} joined the meeting`,
            });
          }
        });

      } catch (err) {
        setError('Failed to initialize meeting');
        setIsLoading(false);
        toast({
          title: "Connection failed",
          description: "Unable to connect to the meeting",
          variant: "destructive",
        });
      }
    };

    initializeJitsi();

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
  }, [username, roomName, role, onLeave, toast]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-destructive">Connection Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={onLeave} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-meeting flex flex-col">
      <div className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Room: {roomName}</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${role}/10 text-${role}`}>
            {role.toUpperCase()}
          </span>
        </div>
        <Button onClick={onLeave} variant="destructive" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Leave Meeting
        </Button>
      </div>
      
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Connecting to meeting...</p>
            </div>
          </div>
        )}
        <div ref={jitsiContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};