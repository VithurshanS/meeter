import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users, GraduationCap } from "lucide-react";

interface JoinFormProps {
  role: 'student' | 'teacher';
  onBack: () => void;
  onJoin: (username: string, roomName: string, email?: string, password?: string) => void;
}

export const JoinForm = ({ role, onBack, onJoin }: JoinFormProps) => {
  const [username, setUsername] = useState("");
  const [roomName, setRoomName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [useAuth, setUseAuth] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && roomName.trim()) {
      const authEmail = useAuth ? email.trim() || undefined : undefined;
      const authPassword = useAuth ? password.trim() || undefined : undefined;
      onJoin(username.trim(), roomName.trim(), authEmail, authPassword);
    }
  };

  const isTeacher = role === 'teacher';
  const roleColor = isTeacher ? 'teacher' : 'student';
  const RoleIcon = isTeacher ? Users : GraduationCap;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className={`w-full max-w-md shadow-[0_0_40px_hsl(var(--${roleColor}-primary)/0.3)] border-2 border-${roleColor}/50`}>
        <CardHeader className="text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${roleColor}/10 flex items-center justify-center`}>
            <RoleIcon className={`w-8 h-8 text-${roleColor}`} />
          </div>
          <CardTitle className={`text-2xl text-${roleColor}`}>
            {isTeacher ? 'Teacher Access' : 'Student Access'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="roomName">Meeting Room</Label>
              <Input
                id="roomName"
                type="text"
                placeholder={isTeacher ? "Create or join a room" : "Enter room name"}
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                {isTeacher 
                  ? "If the room doesn't exist, it will be created"
                  : "Make sure you have the correct room name"
                }
              </p>
            </div>

            {/* Optional Authentication */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useAuth"
                  checked={useAuth}
                  onChange={(e) => setUseAuth(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="useAuth" className="text-sm">
                  Use authentication (optional)
                </Label>
              </div>
              
              {useAuth && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Demo credentials: tutor@example.com / tutor123 or student@example.com / student123
                  </p>
                </>
              )}
            </div>
            
            <div className="space-y-3">
              <Button 
                type="submit" 
                variant={roleColor}
                className="w-full" 
                size="lg"
                disabled={!username.trim() || !roomName.trim()}
              >
                Join Meeting
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={onBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Role Selection
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};