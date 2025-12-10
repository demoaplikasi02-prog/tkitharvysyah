
import React, { useState, useEffect, useMemo } from 'react';
import { getSheetData } from '../services/googleSheetsService';
import type { Student, Score, SPP } from '../types';
import { ChevronLeftIcon, BookIcon, ShieldCheckIcon, PrayingHandsIcon, QuoteIcon, UsersIcon, ChartBarIcon } from './icons';
import { ParentSection } from '../App';

interface ParentPortalProps {
  onBack: () => void;
  student: Student;
  activeSection: ParentSection;
}

// Data Dummy untuk Simulasi Tampilan (Hanya digunakan jika terjadi Error Fetch)
const DUMMY_SPP_DATA: SPP[] = [
    { NISN: '1234567890', Kategori: 'SPP', Bulan: 'Juli 2024', Nominal: '300000', Status: 'Lunas', "Tanggal Bayar": '2024-07-10' },
    { NISN: '1234567890', Kategori: 'SPP', Bulan: 'Agustus 2024', Nominal: '300000', Status: 'Belum Lunas', "Tanggal Bayar": '-' },
    { NISN: '1234567890', Kategori: 'Daftar Ulang', Bulan: 'Uang Pangkal & Adm', Nominal: '1500000', Status: 'Lunas', "Tanggal Bayar": '2024-07-05' },
    { NISN: '1234567890', Kategori: 'Seragam', Bulan: 'Paket Seragam (4 Set)', Nominal: '850000', Status: 'Lunas', "Tanggal Bayar": '2024-07-05' },
    { NISN: '1234567890', Kategori: 'Kegiatan', Bulan: 'Manasik Haji', Nominal: '150000', Status: 'Belum Lunas', "Tanggal Bayar": '-' },
];

const ParentPortal: React.FC<ParentPortalProps> = ({ onBack, student, activeSection }) => {
  const [scores, setScores] = useState<Score[]>([]);
  const [sppItems, setSppItems] = useState<SPP[]>([]);
  const [otherItems, setOtherItems] = useState<SPP[]>([]);
  
  const [activeFinanceTab, setActiveFinanceTab] = useState<'spp' | 'others'>('spp');

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSpp, setIsLoadingSpp] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const scoreData = await getSheetData<Score>('Score');
        const studentScores = scoreData.filter(score => String(score['Student ID']) === String(student.NISN));
        // Sort by date descending
        studentScores.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
        setScores(studentScores);
      } catch (err) {
        setError('Gagal memuat data penilaian.');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch scores if on the learning report tab or initial load
    if (activeSection === 'learning-report') {
        fetchScores();
    }
  }, [student.NISN, activeSection]);

  useEffect(() => {
      const fetchSPP = async () => {
          if (activeSection !== 'spp-report') return;
          
          try {
              setIsLoadingSpp(true);
              const allSpp = await getSheetData<SPP>('SPP');
              
              let studentSpp = allSpp.filter(item => String(item.NISN) === String(student.NISN));

              // Pisahkan antara SPP Bulanan dan Pembayaran Lainnya
              const spp = [];
              const others = [];

              for (const item of studentSpp) {
                  const kategori = (item.Kategori || '').toLowerCase();
                  if (kategori.includes('spp') || kategori === '') {
                      spp.push(item);
                  } else {
                      others.push(item);
                  }
              }

              setSppItems(spp);
              setOtherItems(others);

          } catch (err) {
              console.error("Gagal memuat data SPP:", err);
              // Fallback jika fetch error, tetap kosongkan atau gunakan dummy hanya saat error
              setSppItems([]); 
              setOtherItems([]);
          } finally {
              setIsLoadingSpp(false);
          }
      };
      
      fetchSPP();
  }, [student.NISN, activeSection]);

  const renderLearningReport = () => {
    // Group scores logic
    const { surahScores, doaScores, hadistScores } = useMemo(() => {
        return {
            surahScores: scores.filter(s => s.Category === 'Hafalan Surah Pendek'),
            doaScores: scores.filter(s => s.Category === 'Hafalan Doa Sehari-hari'),
            hadistScores: scores.filter(s => s.Category === 'Hafalan Hadist'),
        };
    }, [scores]);

    const StatCard = ({ label, count, icon: Icon, color, bgColor }: any) => (
        <div className={`p-4 rounded-xl border bg-white flex items-center space-x-4 shadow-sm border-${color}-100`}>
            <div className={`p-3 rounded-full ${bgColor} text-${color}-600`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-gray-500 text-xs uppercase font-semibold">{label}</p>
                <p className="text-2xl font-bold text-gray-800">{count}</p>
            </div>
        </div>
    );

    const ScoreCard = ({ item }: { item: Score }) => (
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all mb-3 relative overflow-hidden group">
             {/* Decorative side accent */}
             <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                 item.Score === 'BSB' ? 'bg-emerald-500' : 
                 item.Score === 'BSH' ? 'bg-green-500' : 
                 item.Score === 'MB' ? 'bg-yellow-400' : 'bg-red-400'
             }`}></div>

             <div className="pl-3">
                <div className="flex justify-between items-start mb-1">
                    <h5 className="font-bold text-gray-800 text-sm leading-tight pr-2">{item['Item Name']}</h5>
                    <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.Score === 'BSB' ? 'bg-emerald-100 text-emerald-800' :
                        item.Score === 'BSH' ? 'bg-green-100 text-green-800' :
                        item.Score === 'MB' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {item.Score}
                    </span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
                    <span>{item.Date ? item.Date.split('T')[0] : '-'}</span>
                    <span>{item.Semester || 'Sem -'}</span>
                </div>
                {item.Notes && (
                    <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 italic border border-gray-100">
                        "{item.Notes}"
                    </div>
                )}
             </div>
        </div>
    );

    const CategorySection = ({ title, items, icon: Icon, color, bgHeader }: { title: string, items: Score[], icon: any, color: string, bgHeader: string }) => (
        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className={`${bgHeader} px-4 py-3 border-b border-${color}-100 flex items-center justify-between`}>
                 <div className="flex items-center space-x-2">
                    <Icon className={`w-5 h-5 text-${color}-700`} />
                    <h4 className={`font-bold text-${color}-800`}>{title}</h4>
                 </div>
                 <span className="bg-white/60 text-xs font-bold px-2 py-1 rounded-full text-gray-600">
                     {items.length}
                 </span>
            </div>
            <div className="p-3 overflow-y-auto max-h-[400px]">
                {items.length > 0 ? (
                    items.map((item, idx) => <ScoreCard key={idx} item={item} />)
                ) : (
                    <div className="text-center py-8 text-gray-400 italic text-sm">
                        Belum ada data hafalan.
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
             {/* Header Profil Siswa */}
             <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="flex flex-col md:flex-row items-center space-x-0 md:space-x-6 space-y-4 md:space-y-0 relative z-10">
                       <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/20 border-4 border-white/30 flex-shrink-0 overflow-hidden shadow-inner">
                            {student['Link Photo'] ? (
                                <img 
                                    src={student['Link Photo']} 
                                    alt={student.Name} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none'; 
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/50">
                                    <UsersIcon className="w-10 h-10" />
                                </div>
                            )}
                       </div>
                       <div className="text-center md:text-left">
                            <h3 className="text-2xl md:text-3xl font-bold">{student.Name}</h3>
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2 opacity-90 text-sm font-medium">
                                <span className="bg-white/20 px-3 py-1 rounded-full">NISN: {student.NISN}</span>
                                <span className="bg-white/20 px-3 py-1 rounded-full">Kelas: {student.Class}</span>
                            </div>
                       </div>
                  </div>
                  {/* Decorative circles */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl"></div>
             </div>

             {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500">Memuat data perkembangan...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 p-6 rounded-lg text-red-600 text-center border border-red-200">
                    <p>{error}</p>
                </div>
              ) : (
                <>
                    {/* Ringkasan Statistik */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard label="Hafalan Surah" count={surahScores.length} icon={BookIcon} color="emerald" bgColor="bg-emerald-50" />
                        <StatCard label="Hafalan Doa" count={doaScores.length} icon={PrayingHandsIcon} color="blue" bgColor="bg-blue-50" />
                        <StatCard label="Hafalan Hadist" count={hadistScores.length} icon={QuoteIcon} color="amber" bgColor="bg-amber-50" />
                    </div>

                    {/* Detail Laporan Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <CategorySection 
                            title="Surah Pendek" 
                            items={surahScores} 
                            icon={BookIcon} 
                            color="emerald" 
                            bgHeader="bg-emerald-100" 
                        />
                        <CategorySection 
                            title="Doa Sehari-hari" 
                            items={doaScores} 
                            icon={PrayingHandsIcon} 
                            color="blue" 
                            bgHeader="bg-blue-100" 
                        />
                        <CategorySection 
                            title="Hadist Pilihan" 
                            items={hadistScores} 
                            icon={QuoteIcon} 
                            color="amber" 
                            bgHeader="bg-amber-100" 
                        />
                    </div>
                </>
              )}
        </div>
    );
  };

  const renderSPPReport = () => {
      // Data to display based on active tab
      const currentData = activeFinanceTab === 'spp' ? sppItems : otherItems;

      // Calculate totals for CURRENT tab
      const { totalPaid, totalPending } = useMemo(() => {
          let paid = 0;
          let pending = 0;
          
          currentData.forEach(item => {
              // Clean string "Rp 300.000" or "300000" to number
              const amountStr = String(item.Nominal).replace(/[^0-9]/g, '');
              const amount = parseInt(amountStr) || 0;
              
              if (item.Status.toLowerCase().includes('lunas') && !item.Status.toLowerCase().includes('belum')) {
                  paid += amount;
              } else {
                  pending += amount;
              }
          });
          
          return { totalPaid: paid, totalPending: pending };
      }, [currentData]);

      // Helper to format currency
      const formatCurrency = (val: number) => {
          return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
      };

      if (isLoadingSpp) {
          return (
              <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500">Memuat data Keuangan...</p>
              </div>
          );
      }

      return (
          <div className="space-y-6 animate-fade-in">
              <div className="border-b pb-4">
                 <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <ShieldCheckIcon className="w-5 h-5 mr-2 text-emerald-600" />
                    Laporan Keuangan Siswa
                 </h3>
              </div>

              {/* TABS NAVIGATION */}
              <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg w-fit">
                  <button
                    onClick={() => setActiveFinanceTab('spp')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        activeFinanceTab === 'spp' 
                        ? 'bg-white text-emerald-700 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                      SPP Bulanan
                  </button>
                  <button
                    onClick={() => setActiveFinanceTab('others')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        activeFinanceTab === 'others' 
                        ? 'bg-white text-emerald-700 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                      Pembayaran Lainnya
                  </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      <p className="text-sm text-emerald-600 font-semibold uppercase">Total Terbayar ({activeFinanceTab === 'spp' ? 'SPP' : 'Lainnya'})</p>
                      <p className="text-2xl font-bold text-emerald-800">{formatCurrency(totalPaid)}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                      <p className="text-sm text-red-600 font-semibold uppercase">Tunggakan ({activeFinanceTab === 'spp' ? 'SPP' : 'Lainnya'})</p>
                      <p className="text-2xl font-bold text-red-800">{formatCurrency(totalPending)}</p>
                  </div>
              </div>

              {/* Table Data */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    {activeFinanceTab === 'spp' ? 'Bulan' : 'Kategori'}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    {activeFinanceTab === 'spp' ? 'Keterangan' : 'Rincian'}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nominal</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal Bayar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {currentData.length > 0 ? currentData.map((item, idx) => {
                                const isLunas = item.Status.toLowerCase().includes('lunas') && !item.Status.toLowerCase().includes('belum');
                                const displayNominal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(String(item.Nominal).replace(/[^0-9]/g, '')) || 0);

                                return (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-800">
                                            {activeFinanceTab === 'spp' ? item.Bulan : item.Kategori}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {activeFinanceTab === 'spp' ? 'Iuran Wajib Bulanan' : item.Bulan} 
                                            {/* Note: Di sheet, Kolom C adalah Bulan/Keterangan. Untuk SPP isinya Bulan, Untuk Lainnya isinya Keterangan */}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-800 font-medium">{displayNominal}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                isLunas ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {item.Status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{item["Tanggal Bayar"] || '-'}</td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                                        Belum ada data {activeFinanceTab === 'spp' ? 'SPP' : 'pembayaran lainnya'}.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                  </table>
                  <div className="p-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center italic">
                      * Data diperbarui secara berkala. Hubungi Tata Usaha jika terdapat ketidaksesuaian.
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-6xl mx-auto min-h-[600px]">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Portal Orang Tua</h2>
            <p className="text-gray-500">Selamat datang, Ayah/Bunda dari <span className="font-semibold text-emerald-600">{student.Name}</span></p>
        </div>
        <button onClick={onBack} className="flex items-center text-emerald-600 hover:text-emerald-800 font-semibold transition-colors">
            <ChevronLeftIcon className="w-5 h-5 mr-1" />
            Kembali
        </button>
      </div>

      {activeSection === 'learning-report' && renderLearningReport()}
      {activeSection === 'spp-report' && renderSPPReport()}
      
    </div>
  );
};

export default ParentPortal;
