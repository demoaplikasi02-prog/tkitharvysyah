import React, { useState, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import TeacherPortal from './components/TeacherPortal';
import ParentPortal from './components/ParentPortal';
import PrincipalPortal from './components/PrincipalPortal';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SchoolInfoModal from './components/SchoolInfoModal';
import type { Teacher, Student, Principal } from './types';

type Portal = 'landing' | 'teacher' | 'parent' | 'principal';
type User = Teacher | Student | Principal;
export type PrincipalSection = 'dashboard' | 'school-data' | 'scores' | 'teacher-progress';
export type TeacherSection = 'input-score' | 'report';
export type ParentSection = 'learning-report' | 'spp-report';

const App: React.FC = () => {
  const [activePortal, setActivePortal] = useState<Portal>('landing');
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSchoolInfoVisible, setIsSchoolInfoVisible] = useState(false);
  
  // State khusus untuk navigasi sub-menu Kepala Sekolah
  const [principalSection, setPrincipalSection] = useState<PrincipalSection>('dashboard');
  
  // State khusus untuk navigasi sub-menu Guru
  const [teacherSection, setTeacherSection] = useState<TeacherSection>('input-score');

  // State khusus untuk navigasi sub-menu Orang Tua
  const [parentSection, setParentSection] = useState<ParentSection>('learning-report');

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);
  
  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleShowSchoolInfo = useCallback(() => {
    setIsSchoolInfoVisible(true);
    closeSidebar();
  }, [closeSidebar]);

  const handleCloseSchoolInfo = useCallback(() => {
    setIsSchoolInfoVisible(false);
  }, []);

  const handlePortalSelect = useCallback((portal: Portal) => {
    setActivePortal(portal);
    setLoggedInUser(null); // Reset user on new portal selection
    setPrincipalSection('dashboard'); // Reset principal section
    setTeacherSection('input-score'); // Reset teacher section
    setParentSection('learning-report'); // Reset parent section
    closeSidebar();
  }, [closeSidebar]);

  const handleBackToHome = useCallback(() => {
    setActivePortal('landing');
    setLoggedInUser(null);
    closeSidebar();
  }, [closeSidebar]);

  const handleLoginSuccess = useCallback((user: User) => {
    setLoggedInUser(user);
    closeSidebar();
  }, [closeSidebar]);

  const renderPortal = () => {
    switch (activePortal) {
      case 'teacher':
        return loggedInUser ? 
            <TeacherPortal 
                onBack={handleBackToHome} 
                teacher={loggedInUser as Teacher} 
                activeSection={teacherSection}
            /> : 
            <Login portalType="teacher" onBack={handleBackToHome} onLoginSuccess={handleLoginSuccess} />;
      case 'parent':
        return loggedInUser ? 
            <ParentPortal 
                onBack={handleBackToHome} 
                student={loggedInUser as Student} 
                activeSection={parentSection}
            /> : 
            <Login portalType="parent" onBack={handleBackToHome} onLoginSuccess={handleLoginSuccess} />;
      case 'principal':
        return loggedInUser ? 
            <PrincipalPortal 
                onBack={handleBackToHome} 
                principal={loggedInUser as Principal} 
                activeSection={principalSection}
            /> : 
            <Login portalType="principal" onBack={handleBackToHome} onLoginSuccess={handleLoginSuccess} />;
      case 'landing':
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
        <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={closeSidebar}
            onNavigate={handlePortalSelect}
            onGoHome={handleBackToHome}
            onShowSchoolInfo={handleShowSchoolInfo}
            isLoggedIn={!!loggedInUser}
            onLogout={handleBackToHome}
            activePortal={activePortal}
            
            principalSection={principalSection}
            onNavigatePrincipal={setPrincipalSection}
            
            teacherSection={teacherSection}
            onNavigateTeacher={setTeacherSection}

            parentSection={parentSection}
            onNavigateParent={setParentSection}
        />
        <div className="flex flex-col transition-all duration-300 md:pl-64">
            <Header onMenuClick={toggleSidebar} />
            <main className="flex-grow p-4 md:p-8 flex items-center justify-center">
                {renderPortal()}
            </main>
        </div>
        {isSchoolInfoVisible && <SchoolInfoModal onClose={handleCloseSchoolInfo} />}
    </div>
  );
};

export default App;