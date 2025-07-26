import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap } from "lucide-react";

interface RoleSelectorProps {
  onRoleSelect: (role: 'student' | 'teacher') => void;
}

export const RoleSelector = ({ onRoleSelect }: RoleSelectorProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-teacher bg-clip-text text-transparent">
            Jitsi Meet Integration
          </h1>
          <p className="text-xl text-muted-foreground">
            Connect to virtual meetings with role-based access control
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="group hover:shadow-[0_0_40px_hsl(var(--student-primary)/0.3)] transition-all duration-300 border-2 hover:border-student/50">
            <CardHeader className="text-center pb-4">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-student/10 flex items-center justify-center group-hover:bg-student/20 transition-colors">
                <GraduationCap className="w-12 h-12 text-student" />
              </div>
              <CardTitle className="text-2xl text-student">Join as Student</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Limited access with viewing and listening capabilities
              </p>
              <ul className="text-sm text-muted-foreground mb-6 space-y-2">
                <li>• View and hear the meeting</li>
                <li>• Share your audio/video</li>
                <li>• No chat access</li>
                <li>• Cannot remove participants</li>
              </ul>
              <Button 
                variant="student"
                size="lg" 
                className="w-full"
                onClick={() => onRoleSelect('student')}
              >
                Join as Student
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-[0_0_40px_hsl(var(--teacher-primary)/0.3)] transition-all duration-300 border-2 hover:border-teacher/50">
            <CardHeader className="text-center pb-4">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-teacher/10 flex items-center justify-center group-hover:bg-teacher/20 transition-colors">
                <Users className="w-12 h-12 text-teacher" />
              </div>
              <CardTitle className="text-2xl text-teacher">Join as Teacher</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Full control over the meeting environment
              </p>
              <ul className="text-sm text-muted-foreground mb-6 space-y-2">
                <li>• Full meeting control</li>
                <li>• Chat functionality</li>
                <li>• Manage participants</li>
                <li>• Screen sharing</li>
              </ul>
              <Button 
                variant="teacher"
                size="lg" 
                className="w-full"
                onClick={() => onRoleSelect('teacher')}
              >
                Join as Teacher
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};