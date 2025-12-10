import React, { Fragment } from 'react';
import { HomeIcon, BookIcon, UsersIcon, ShieldCheckIcon, LogOutIcon, XIcon, InfoIcon, ChartBarIcon } from './icons';
import { PrincipalSection, TeacherSection, ParentSection } from '../App';

type Portal = 'teacher' | 'parent' | 'principal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (portal: Portal) => void;
  onGoHome: () => void;
  onShowSchoolInfo: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  activePortal: string; // Prop baru untuk tahu portal mana yang aktif
  
  principalSection?: PrincipalSection; // Prop baru untuk sub-menu aktif Principal
  onNavigatePrincipal?: (section: PrincipalSection) => void; // Callback navigasi sub-menu Principal
  
  teacherSection?: TeacherSection; // Prop baru untuk sub-menu aktif Teacher
  onNavigateTeacher?: (section: TeacherSection) => void; // Callback navigasi sub-menu Teacher

  parentSection?: ParentSection; // Prop baru untuk sub-menu aktif Parent
  onNavigateParent?: (section: ParentSection) => void; // Callback navigasi sub-menu Parent
}

const NavLink: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; isActive?: boolean }> = ({ icon, label, onClick, isActive }) => (
    <a
        href="#"
        onClick={(e) => { e.preventDefault(); onClick(); }}
        className={`group flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors ${
            isActive 
            ? 'bg-emerald-800 text-white' 
            : 'text-gray-300 hover:bg-emerald-700 hover:text-white'
        }`}
    >
        {icon}
        {label}
    </a>
);

const SubNavLink: React.FC<{ label: string; onClick: () => void; isActive?: boolean }> = ({ label, onClick, isActive }) => (
    <a
        href="#"
        onClick={(e) => { e.preventDefault(); onClick(); }}
        className={`group flex items-center pl-11 pr-3 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive 
            ? 'text-white bg-emerald-800/50' 
            : 'text-emerald-200 hover:text-white hover:bg-emerald-800/30'
        }`}
    >
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-2"></span>
        {label}
    </a>
);

const Sidebar: React.FC<SidebarProps> = ({ 
    isOpen, 
    onClose, 
    onNavigate, 
    onGoHome, 
    onShowSchoolInfo, 
    isLoggedIn, 
    onLogout,
    activePortal,
    
    principalSection,
    onNavigatePrincipal,
    
    teacherSection,
    onNavigateTeacher,

    parentSection,
    onNavigateParent
}) => {
  const commonIconClass = "mr-4 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-white transition-colors";
  const activeIconClass = "mr-4 flex-shrink-0 h-6 w-6 text-white";

  return (
    <Fragment>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-gray-600 bg-opacity-75 z-40 md:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 flex flex-col w-64 bg-emerald-900 text-white transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:flex`}
      >
        <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 bg-emerald-800 shadow-md">
           <h1 className="text-xl font-bold tracking-wide">Navigasi Portal</h1>
           <button onClick={onClose} className="md:hidden p-1 rounded-full text-white hover:bg-emerald-700 focus:outline-none">
              <XIcon className="w-6 h-6"/>
           </button>
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            <NavLink 
                icon={<HomeIcon className={activePortal === 'landing' ? activeIconClass : commonIconClass} />} 
                label="Home" 
                onClick={onGoHome}
                isActive={activePortal === 'landing'}
            />
            
            <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                    Menu Utama
                </p>
            </div>

            {/* PORTAL GURU */}
            <div>
                <NavLink 
                    icon={<BookIcon className={activePortal === 'teacher' ? activeIconClass : commonIconClass} />} 
                    label="Portal Guru" 
                    onClick={() => onNavigate('teacher')}
                    isActive={activePortal === 'teacher'} 
                />
                
                {/* SUB MENU GURU */}
                {isLoggedIn && activePortal === 'teacher' && onNavigateTeacher && (
                     <div className="mt-1 space-y-1 animate-fade-in-down">
                        <SubNavLink 
                            label="Input Penilaian" 
                            onClick={() => onNavigateTeacher('input-score')} 
                            isActive={teacherSection === 'input-score'}
                        />
                        <SubNavLink 
                            label="Laporan Belajar" 
                            onClick={() => onNavigateTeacher('report')} 
                            isActive={teacherSection === 'report'}
                        />
                     </div>
                )}
            </div>

            {/* PORTAL ORANG TUA */}
            <div>
                <NavLink 
                    icon={<UsersIcon className={activePortal === 'parent' ? activeIconClass : commonIconClass} />} 
                    label="Portal Orang Tua" 
                    onClick={() => onNavigate('parent')} 
                    isActive={activePortal === 'parent'}
                />

                {/* SUB MENU ORANG TUA */}
                {isLoggedIn && activePortal === 'parent' && onNavigateParent && (
                    <div className="mt-1 space-y-1 animate-fade-in-down">
                        <SubNavLink 
                            label="Laporan Hasil Belajar" 
                            onClick={() => onNavigateParent('learning-report')} 
                            isActive={parentSection === 'learning-report'}
                        />
                        <SubNavLink 
                            label="Laporan SPP" 
                            onClick={() => onNavigateParent('spp-report')} 
                            isActive={parentSection === 'spp-report'}
                        />
                    </div>
                )}
            </div>
            
            {/* PORTAL KEPALA SEKOLAH */}
            <div>
                <NavLink 
                    icon={<ShieldCheckIcon className={activePortal === 'principal' ? activeIconClass : commonIconClass} />} 
                    label="Portal Kepala Sekolah" 
                    onClick={() => onNavigate('principal')} 
                    isActive={activePortal === 'principal'}
                />
                
                {/* SUB MENU KEPALA SEKOLAH */}
                {isLoggedIn && activePortal === 'principal' && onNavigatePrincipal && (
                    <div className="mt-1 space-y-1 animate-fade-in-down">
                        <SubNavLink 
                            label="Dashboard & Statistik" 
                            onClick={() => onNavigatePrincipal('dashboard')} 
                            isActive={principalSection === 'dashboard'}
                        />
                        <SubNavLink 
                            label="Progres Kerja Guru" 
                            onClick={() => onNavigatePrincipal('teacher-progress')} 
                            isActive={principalSection === 'teacher-progress'}
                        />
                        <SubNavLink 
                            label="Data Guru/Siswa" 
                            onClick={() => onNavigatePrincipal('school-data')} 
                            isActive={principalSection === 'school-data'}
                        />
                        <SubNavLink 
                            label="Monitoring Penilaian" 
                            onClick={() => onNavigatePrincipal('scores')} 
                            isActive={principalSection === 'scores'}
                        />
                    </div>
                )}
            </div>

            <div className="pt-4 pb-2 border-t border-emerald-800 mt-4">
                 <NavLink 
                    icon={<InfoIcon className={commonIconClass} />} 
                    label="Info Sekolah" 
                    onClick={onShowSchoolInfo} 
                />
            </div>
        </nav>

        {isLoggedIn && (
            <div className="px-2 py-4 border-t border-emerald-800 bg-emerald-950">
                 <NavLink 
                    icon={<LogOutIcon className="mr-4 flex-shrink-0 h-6 w-6 text-red-300 group-hover:text-red-100" />} 
                    label="Logout" 
                    onClick={onLogout} 
                />
            </div>
        )}
      </div>
    </Fragment>
  );
};

export default Sidebar;