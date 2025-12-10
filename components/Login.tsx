
import React, { useState, useEffect } from 'react';
import { getSheetData } from '../services/googleSheetsService';
import { BookIcon, UsersIcon, ShieldCheckIcon, ChevronLeftIcon } from './icons';
import type { Teacher, Student, Principal } from '../types';

type PortalType = 'teacher' | 'parent' | 'principal';
type User = Teacher | Student | Principal;

interface LoginProps {
  portalType: PortalType;
  onBack: () => void;
  onLoginSuccess: (user: User) => void;
}

const portalConfig = {
  teacher: {
    title: 'Login sebagai Guru',
    icon: <BookIcon className="w-10 h-10 text-white" />,
    placeholder: 'Masukan nomor PIN Anda',
    sheetName: 'Teacher',
    loginField: 'Phone' as keyof Teacher,
    iconBgClass: 'bg-emerald-500',
  },
  parent: {
    title: 'Login sebagai Orang Tua',
    icon: <UsersIcon className="w-10 h-10 text-white" />,
    placeholder: 'Masukkan NISN',
    sheetName: 'Student',
    loginField: 'NISN' as keyof Student,
    iconBgClass: 'bg-blue-500',
  },
  principal: {
    title: 'Login sebagai Kepala Sekolah',
    icon: <ShieldCheckIcon className="w-10 h-10 text-white" />,
    placeholder: 'Masukan nomor PIN Anda',
    sheetName: 'Principal',
    loginField: 'Phone' as keyof Principal,
    iconBgClass: 'bg-emerald-600',
  },
};

const Login: React.FC<LoginProps> = ({ portalType, onBack, onLoginSuccess }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State khusus untuk menampung Foto Kepala Sekolah
  const [dynamicPhoto, setDynamicPhoto] = useState<string | null>(null);
  
  const config = portalConfig[portalType];

  // Efek untuk mengambil Foto Kepala Sekolah saat halaman dimuat
  useEffect(() => {
    if (portalType === 'principal') {
        const fetchPrincipalData = async () => {
            try {
                const data = await getSheetData<Principal>('Principal');
                // Ambil baris pertama, dan cek apakah ada Link Photo
                if (data.length > 0 && data[0]['Link Photo']) {
                    setDynamicPhoto(data[0]['Link Photo']);
                }
            } catch (e) {
                console.error("Gagal memuat foto kepala sekolah", e);
            }
        };
        fetchPrincipalData();
    } else {
        setDynamicPhoto(null);
    }
  }, [portalType]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const users = await getSheetData<User>(config.sheetName);
      const user = users.find(u => String(u[config.loginField as keyof User]).trim() === inputValue.trim());
      
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Data tidak ditemukan. Silakan periksa kembali input Anda.');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login. Silakan coba lagi.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-md mx-auto text-center relative border-t-8 border-emerald-600">
        <button onClick={onBack} className="absolute top-4 left-4 flex items-center text-gray-500 hover:text-gray-800 font-semibold">
            <ChevronLeftIcon className="w-5 h-5 mr-1" />
            Kembali
        </button>
      
      {/* Icon / Avatar Container */}
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 mt-10 mx-auto overflow-hidden shadow-md ${!dynamicPhoto ? config.iconBgClass : 'bg-white'}`}>
        {dynamicPhoto ? (
            <img 
                src={dynamicPhoto} 
                alt="Foto Profil" 
                className="w-full h-full object-cover"
                onError={(e) => {
                    // Jika gambar gagal dimuat (link rusak), kembali ke icon default
                    e.currentTarget.style.display = 'none';
                    setDynamicPhoto(null);
                }}
            />
        ) : (
            config.icon
        )}
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{config.title}</h2>
      <p className="text-gray-500 mb-8">TK IT Harvysyah</p>

      <form onSubmit={handleLogin} className="space-y-6">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={config.placeholder}
          required
          className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-emerald-500 placeholder-gray-400"
          aria-label={config.placeholder}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-600 transition-colors duration-300 disabled:bg-gray-400"
        >
          {isLoading ? 'Memverifikasi...' : 'Masuk'}
        </button>
      </form>
      {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
    </div>
  );
};

export default Login;
