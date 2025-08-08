import { useState } from "react";
import { RoleSelector } from "@/components/RoleSelector";
import { JoinForm } from "@/components/JoinForm";
import { MeetingRoom } from "@/components/MeetingRoom";

type AppState = 
  | { page: 'role-selection' }
  | { page: 'join-form'; role: 'student' | 'teacher' }
  | { page: 'meeting'; role: 'student' | 'teacher'; username: string; roomName: string; email?: string; password?: string };

const Index = () => {
  const [state, setState] = useState<AppState>({ page: 'role-selection' });

  const handleRoleSelect = (role: 'student' | 'teacher') => {
    setState({ page: 'join-form', role });
  };

  const handleJoin = (username: string, roomName: string, email?: string, password?: string) => {
    if (state.page === 'join-form') {
      setState({ 
        page: 'meeting', 
        role: state.role, 
        username, 
        roomName,
        email,
        password
      });
    }
  };

  const handleBack = () => {
    setState({ page: 'role-selection' });
  };

  const handleLeave = () => {
    setState({ page: 'role-selection' });
  };

  if (state.page === 'role-selection') {
    return <RoleSelector onRoleSelect={handleRoleSelect} />;
  }

  if (state.page === 'join-form') {
    return (
      <JoinForm 
        role={state.role} 
        onBack={handleBack} 
        onJoin={handleJoin} 
      />
    );
  }

  if (state.page === 'meeting') {
    return (
      <MeetingRoom 
        role={state.role}
        username={state.username}
        roomName={state.roomName}
        email={state.email}
        password={state.password}
        onLeave={handleLeave}
      />
    );
  }

  return null;
};

export default Index;
