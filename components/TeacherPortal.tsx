import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSheetData, addScore, deleteScore, editScore } from '../services/googleSheetsService';
import type { Student, Score, Teacher, Hafalan, Principal } from '../types';
import { ChevronLeftIcon, BookIcon, PrayingHandsIcon, QuoteIcon, NotYetDevelopedIcon, StartingToDevelopIcon, DevelopingAsExpectedIcon, VeryWellDevelopedIcon, PencilIcon, TrashIcon, ChartBarIcon, UsersIcon, PrinterIcon, XIcon } from './icons';
import { TeacherSection } from '../App';

interface TeacherPortalProps {
  onBack: () => void;
  teacher: Teacher;
  activeSection: TeacherSection;
}

const INPUT_TABS = {
  surah: { label: 'Hafalan Surah Pendek', category: 'Hafalan Surah Pendek' as const, icon: BookIcon, color: 'emerald' },
  doa: { label: 'Hafalan Doa Sehari-hari', category: 'Hafalan Doa Sehari-hari' as const, icon: PrayingHandsIcon, color: 'blue' },
  hadist: { label: 'Hafalan Hadist', category: 'Hafalan Hadist' as const, icon: QuoteIcon, color: 'amber' },
} as const;

type InputTabKey = keyof typeof INPUT_TABS;

const SCORE_OPTIONS = [
    { value: 'BB', label: 'Belum Berkembang', Icon: NotYetDevelopedIcon, color: 'red' },
    { value: 'MB', label: 'Mulai Berkembang', Icon: StartingToDevelopIcon, color: 'yellow' },
    { value: 'BSH', label: 'Berkembang Sesuai Harapan', Icon: DevelopingAsExpectedIcon, color: 'green' },
    { value: 'BSB', label: 'Berkembang Sangat Baik', Icon: VeryWellDevelopedIcon, color: 'emerald' },
];

const SEMESTER_TABS = [
    { id: '1', label: 'Semester 1' },
    { id: '2', label: 'Semester 2' },
];

const colorSchemes = {
    red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', selected: 'border-red-500 ring-red-500', badge: 'bg-red-100 text-red-800', bar: 'bg-red-500' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300', selected: 'border-yellow-500 ring-yellow-500', badge: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-500' },
    green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300', selected: 'border-green-500 ring-green-500', badge: 'bg-green-100 text-green-800', bar: 'bg-green-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', selected: 'border-emerald-500 ring-emerald-500', badge: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-500' },
};

// --- CHART COMPONENT ---
const AchievementChart = ({ scores, title }: { scores: Score[], title: string }) => {
    const stats = useMemo(() => {
        const counts = { BB: 0, MB: 0, BSH: 0, BSB: 0 };
        scores.forEach(s => {
            if (s.Score in counts) {
                counts[s.Score as keyof typeof counts]++;
            }
        });
        const total = scores.length || 1; // avoid division by zero
        return {
            counts,
            percentages: {
                BB: (counts.BB / total) * 100,
                MB: (counts.MB / total) * 100,
                BSH: (counts.BSH / total) * 100,
                BSB: (counts.BSB / total) * 100,
            },
            total: scores.length
        };
    }, [scores]);

    if (stats.total === 0) return null;

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6 print:hidden">
            <h4 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2 text-emerald-600" />
                {title}
            </h4>
            <div className="flex items-end space-x-2 md:space-x-8 h-48 mb-4 justify-center md:justify-start">
                {SCORE_OPTIONS.map(opt => {
                    const pct = stats.percentages[opt.value as keyof typeof stats.percentages];
                    const count = stats.counts[opt.value as keyof typeof stats.counts];
                    const scheme = colorSchemes[opt.color as keyof typeof colorSchemes];
                    
                    return (
                        <div key={opt.value} className="flex flex-col items-center justify-end h-full w-16 md:w-24 group">
                             <div className="mb-2 text-xs font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                {pct.toFixed(1)}%
                            </div>
                            <div 
                                className={`w-full rounded-t-lg transition-all duration-500 relative ${scheme.bar} bg-opacity-80 hover:bg-opacity-100`}
                                style={{ height: `${pct === 0 ? 2 : pct}%` }}
                            >
                                <span className={`absolute -top-6 left-1/2 transform -translate-x-1/2 font-bold text-sm ${scheme.text}`}>
                                    {count > 0 ? count : ''}
                                </span>
                            </div>
                            <div className="mt-2 text-center">
                                <span className={`block font-bold ${scheme.text}`}>{opt.value}</span>
                                <span className="hidden md:block text-[10px] text-gray-400 leading-tight mt-1">{opt.label}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="text-center text-xs text-gray-400 border-t pt-2">
                Total Data: {stats.total} Penilaian
            </div>
        </div>
    );
};

const TeacherPortal: React.FC<TeacherPortalProps> = ({ onBack, teacher, activeSection }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [hafalanItems, setHafalanItems] = useState<Hafalan[]>([]);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingHafalan, setIsLoadingHafalan] = useState(true);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Note: mainTab state removed, controlled by activeSection prop from Sidebar
  const [activeSubTab, setActiveSubTab] = useState<InputTabKey>('surah');
  const [activeSemester, setActiveSemester] = useState<string>('1');
  
  // State for Report Filter
  const [reportStudentId, setReportStudentId] = useState<string>('');

  // State for Editing
  const [editingScore, setEditingScore] = useState<Score | null>(null);

  // State for Print Preview Mode
  const [isPrintPreview, setIsPrintPreview] = useState(false);

  const [formData, setFormData] = useState<Omit<Score, 'Timestamp'>>({
    'Student ID': '',
    Category: INPUT_TABS.surah.category,
    'Item Name': '',
    Score: '',
    Date: new Date().toISOString().split('T')[0],
    Notes: '',
    Semester: 'Semester 1',
    'Teacher Name': teacher.Name,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingStudents(true);
        setError(null);
        const [studentData, principalData] = await Promise.all([
             getSheetData<Student>('Student'),
             getSheetData<Principal>('Principal')
        ]);
        
        const filteredStudents = studentData.filter(s => s.Class === teacher.Class);
        setStudents(filteredStudents);
        
        if (principalData.length > 0) {
            setPrincipal(principalData[0]);
        }
      } catch (err) {
        setError('Gagal memuat data. Silakan coba lagi.');
      } finally {
        setIsLoadingStudents(false);
      }
    };
    fetchData();
  }, [teacher.Class]);
  
  useEffect(() => {
    const fetchHafalanItems = async () => {
      try {
        setIsLoadingHafalan(true);
        const hafalanData = await getSheetData<any>('Hafalan');
        
        const mapCategory = (rawCat: string): string => {
            const lower = (rawCat || '').toLowerCase();
            if (lower.includes('surah')) return INPUT_TABS.surah.category;
            if (lower.includes('doa')) return INPUT_TABS.doa.category;
            if (lower.includes('hadist')) return INPUT_TABS.hadist.category;
            return rawCat; 
        };

        const normalizedData: Hafalan[] = [];
        
        hafalanData.forEach(item => {
            const rawCategory = item.Category || item.Kategori || item['Kategori Hafalan'] || item['Group'] || '';
            const mappedCategory = mapCategory(rawCategory) as Hafalan['Category'];
            
            // Prioritize specific column names from the screenshot
            const sem1Item = item['ItemName Semester 1'] || item['ItemName Semester1'] || item['Semester 1'] || item['Semester I'] || item['Sem 1'] || item['Smt 1'] || item['1'] || item['Ganjil'];
            const sem2Item = item['ItemName Semester 2'] || item['ItemName Semester2'] || item['Semester 2'] || item['Semester II'] || item['Sem 2'] || item['Smt 2'] || item['2'] || item['Genap'];

            let hasSpecificSemester = false;

            if (sem1Item) {
                normalizedData.push({
                    Category: mappedCategory,
                    ItemName: sem1Item,
                    Semester: '1'
                });
                hasSpecificSemester = true;
            }

            if (sem2Item) {
                normalizedData.push({
                    Category: mappedCategory,
                    ItemName: sem2Item,
                    Semester: '2'
                });
                hasSpecificSemester = true;
            }

            // Fallback if specific columns are empty or not found, check generic 'ItemName' + 'Semester' column
            if (!hasSpecificSemester) {
                 const itemName = item.ItemName || item['Item Name'] || item['Nama Item'] || item['Nama Hafalan'] || item['Judul'];
                 if (itemName) {
                    const rawSemester = item.Semester || item.semester || item.Sem || item.sem || '';
                    let normalizedSemester = '';
                    if (rawSemester) {
                        const s = String(rawSemester).toLowerCase();
                        if (s.includes('1') || s.includes('ganjil') || s.includes('i')) normalizedSemester = '1';
                        else if (s.includes('2') || s.includes('genap') || s.includes('ii')) normalizedSemester = '2';
                    }
                    
                    if (normalizedSemester) {
                        normalizedData.push({
                            Category: mappedCategory,
                            ItemName: itemName,
                            Semester: normalizedSemester
                        });
                    }
                 }
            }
        });

        setHafalanItems(normalizedData);
      } catch (err) {
        setError(prev => prev || 'Gagal memuat daftar item hafalan.');
      } finally {
        setIsLoadingHafalan(false);
      }
    };
    fetchHafalanItems();
  }, []);

  useEffect(() => {
    // Only reset if NOT editing
    if (activeSection === 'input-score' && !editingScore) {
      setFormData(prev => ({
        ...prev,
        Category: INPUT_TABS[activeSubTab].category,
        'Item Name': '', 
        Score: '',
        Semester: `Semester ${activeSemester}`,
        'Teacher Name': teacher.Name,
      }));
    }
    setSubmitStatus(null);
  }, [activeSubTab, activeSection, activeSemester, teacher.Name, editingScore]);

  const fetchScores = useCallback(async () => {
    if (students.length === 0) return;
    setIsLoadingScores(true);
    setError(null);
    try {
      const scoreData = await getSheetData<Score>('Score');
      const studentIds = new Set(students.map(s => String(s.NISN)));
      // Convert to string for comparison to handle potential type mismatch from CSV/Sheet
      const teacherScores = scoreData.filter(score => studentIds.has(String(score['Student ID'])));
      setScores(teacherScores.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()));
    } catch (err) {
      setError('Gagal memuat data laporan.');
    } finally {
      setIsLoadingScores(false);
    }
  }, [students]);

  useEffect(() => {
    if (activeSection === 'report') {
      fetchScores();
    }
  }, [activeSection, fetchScores]);

  const studentMap = useMemo(() => new Map(students.map(s => [String(s.NISN), s.Name])), [students]);
  
  const filteredHafalanItems = useMemo(() => {
      let currentCategory = INPUT_TABS[activeSubTab].category;
      if(editingScore) {
          currentCategory = editingScore.Category as any;
      }

      return hafalanItems.filter(item => {
          const catMatch = item.Category === currentCategory;
          const semMatch = !item.Semester || item.Semester === activeSemester;
          return catMatch && semMatch;
      });
  }, [hafalanItems, activeSubTab, activeSemester, editingScore]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScoreSelect = (scoreValue: string) => {
    setFormData(prev => ({ ...prev, Score: scoreValue }));
  }

  const handleEdit = (score: Score) => {
    const sem = score.Semester?.replace('Semester ', '') || '1';
    let subTabKey: InputTabKey = 'surah';
    if(score.Category.includes('Doa')) subTabKey = 'doa';
    else if(score.Category.includes('Hadist')) subTabKey = 'hadist';

    setEditingScore(score);
    setActiveSemester(sem);
    setActiveSubTab(subTabKey);
    setFormData({
        'Student ID': score['Student ID'],
        Category: score.Category,
        'Item Name': score['Item Name'],
        Score: score.Score,
        Date: score.Date,
        Notes: score.Notes,
        Semester: score.Semester || `Semester ${sem}`,
        'Teacher Name': teacher.Name
    });
  };

  const handleDelete = async (score: Score) => {
      if(!window.confirm(`Hapus penilaian ${score['Item Name']} untuk ${studentMap.get(String(score['Student ID']))}?`)) return;
      if(!score.Timestamp) {
          alert('Data ini tidak memiliki Timestamp, tidak dapat dihapus secara aman.');
          return;
      }

      setIsLoadingScores(true);
      try {
          const result = await deleteScore(score.Timestamp);
          if(result.success) {
              await fetchScores();
              alert('Data berhasil dihapus');
          } else {
              alert(result.message);
          }
      } catch (e: any) {
          alert('Gagal menghapus: ' + e.message);
      } finally {
          setIsLoadingScores(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData['Student ID'] || !formData['Item Name'] || !formData.Score) {
      setSubmitStatus({ message: 'Silakan lengkapi semua pilihan: siswa, item, dan penilaian.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      let result;
      if (editingScore && editingScore.Timestamp) {
        result = await editScore(editingScore.Timestamp, formData);
        setEditingScore(null);
      } else {
        result = await addScore(formData);
      }

      setSubmitStatus({ message: result.message, type: 'success' });
      setFormData({
        'Student ID': '',
        Category: INPUT_TABS[activeSubTab].category,
        'Item Name': '',
        Score: '',
        Date: new Date().toISOString().split('T')[0],
        Notes: '',
        Semester: `Semester ${activeSemester}`,
        'Teacher Name': teacher.Name,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui.';
      setSubmitStatus({ message: `Gagal mengirim data: ${errorMessage}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get color badge class
  const getBadgeClass = (scoreVal: string) => {
      const option = SCORE_OPTIONS.find(o => o.value === scoreVal);
      if(!option) return 'bg-gray-100 text-gray-800';
      return colorSchemes[option.color as keyof typeof colorSchemes].badge;
  };

  const handlePrint = () => {
      setIsPrintPreview(true);
      // Wait for rendering then print
      setTimeout(() => {
          try {
              window.print();
          } catch(e) {
              console.log("Print triggered via preview");
          }
      }, 500);
  };

  // --- REPORT VIEW SUB-COMPONENTS ---

  const renderStudentReport = () => {
      // 1. Filter scores by selected student
      const studentScores = scores.filter(s => String(s['Student ID']) === reportStudentId);
      const studentName = studentMap.get(reportStudentId) || 'Siswa';
      // Find current student object for the photo
      const currentStudent = students.find(s => String(s.NISN) === reportStudentId);

      // 2. Group by Category
      const surahScores = studentScores.filter(s => s.Category === INPUT_TABS.surah.category);
      const doaScores = studentScores.filter(s => s.Category === INPUT_TABS.doa.category);
      const hadistScores = studentScores.filter(s => s.Category === INPUT_TABS.hadist.category);

      const StatCard = ({ label, count, icon: Icon, color }: any) => (
          <div className={`p-4 rounded-xl border bg-white flex items-center space-x-4 shadow-sm border-${color}-100`}>
              <div className={`p-3 rounded-full bg-${color}-50 text-${color}-600`}>
                  <Icon className="w-6 h-6" />
              </div>
              <div>
                  <p className="text-gray-500 text-xs uppercase font-semibold">{label}</p>
                  <p className="text-2xl font-bold text-gray-800">{count}</p>
              </div>
          </div>
      );

      const CategorySection = ({ title, items, color }: { title: string, items: Score[], color: string }) => (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
              <div className={`px-4 py-3 bg-${color}-50 border-b border-${color}-100 flex items-center`}>
                  <h4 className={`font-bold text-${color}-800`}>{title}</h4>
                  <span className={`ml-auto text-xs font-semibold bg-white text-${color}-700 px-2 py-1 rounded-full border border-${color}-200`}>
                      {items.length} Item
                  </span>
              </div>
              <div className="p-4 space-y-3 flex-grow overflow-y-auto max-h-96">
                  {items.length > 0 ? items.map((s, idx) => (
                      <div key={idx} className="flex flex-col p-3 rounded-lg border border-gray-100 hover:shadow-md transition-shadow bg-white">
                          <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-gray-800 text-sm">{s['Item Name']}</span>
                              <span className={`text-xs font-bold px-2 py-1 rounded ${getBadgeClass(s.Score)}`}>
                                  {s.Score}
                              </span>
                          </div>
                          <div className="flex justify-between items-end text-xs text-gray-400 mt-auto">
                             <span>{s.Semester || 'Sem -'}</span>
                             <span>{s.Date ? s.Date.split('T')[0] : '-'}</span>
                          </div>
                          {s.Notes && (
                              <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded italic">
                                  "{s.Notes}"
                              </p>
                          )}
                           <div className="mt-2 pt-2 border-t border-gray-100 flex justify-end space-x-2">
                                <button onClick={() => handleEdit(s)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center">
                                    <PencilIcon className="w-3 h-3 mr-1"/> Edit
                                </button>
                                <button onClick={() => handleDelete(s)} className="text-xs text-red-600 hover:text-red-800 flex items-center">
                                    <TrashIcon className="w-3 h-3 mr-1"/> Hapus
                                </button>
                           </div>
                      </div>
                  )) : (
                      <p className="text-center text-gray-400 text-sm py-4 italic">Belum ada penilaian.</p>
                  )}
              </div>
          </div>
      );
      
      const PrintableTable = ({ title, items }: { title: string, items: Score[] }) => (
          <div className="mb-6 break-inside-avoid">
             <h4 className="font-bold text-black mb-2 border-b border-black pb-1 uppercase text-sm tracking-wide">{title}</h4>
             <table className="w-full border-collapse border border-black text-sm">
                 <thead>
                     <tr className="bg-gray-50">
                         <th className="border border-black px-2 py-1 w-10 text-center bg-gray-100 font-bold">No</th>
                         <th className="border border-black px-2 py-1 text-left bg-gray-100 font-bold">Nama Hafalan / Item</th>
                         <th className="border border-black px-2 py-1 w-20 text-center bg-gray-100 font-bold">Nilai</th>
                         <th className="border border-black px-2 py-1 w-24 text-center bg-gray-100 font-bold">Tanggal</th>
                         <th className="border border-black px-2 py-1 bg-gray-100 font-bold">Catatan</th>
                     </tr>
                 </thead>
                 <tbody>
                     {items.length > 0 ? items.map((item, idx) => (
                         <tr key={idx}>
                             <td className="border border-black px-2 py-1 text-center">{idx + 1}</td>
                             <td className="border border-black px-2 py-1">{item['Item Name']}</td>
                             <td className="border border-black px-2 py-1 text-center font-bold">{item.Score}</td>
                             <td className="border border-black px-2 py-1 text-center text-xs">{item.Date}</td>
                             <td className="border border-black px-2 py-1 text-xs italic">{item.Notes}</td>
                         </tr>
                     )) : (
                         <tr>
                             <td colSpan={5} className="border border-black px-2 py-4 text-center italic text-gray-500">Belum ada data</td>
                         </tr>
                     )}
                 </tbody>
             </table>
          </div>
      );

      return (
          <>
          {/* SCREEN VIEW */}
          <div className="space-y-6 animate-fade-in print:hidden">
              <div className="flex justify-between items-center">
                  <button 
                    onClick={() => setReportStudentId('')}
                    className="flex items-center text-gray-500 hover:text-emerald-600 font-medium transition-colors"
                  >
                      <ChevronLeftIcon className="w-4 h-4 mr-1"/>
                      Kembali ke Daftar Siswa
                  </button>
                  <button 
                    onClick={handlePrint}
                    className="flex items-center bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 shadow-sm transition-all"
                  >
                      <PrinterIcon className="w-5 h-5 mr-2" />
                      Cetak Laporan
                  </button>
              </div>

              {/* Header Report */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between items-center relative z-10">
                      <div className="flex items-center space-x-4">
                           <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 border-2 border-white/40 flex-shrink-0 overflow-hidden">
                                {currentStudent?.['Link Photo'] ? (
                                    <img 
                                        src={currentStudent['Link Photo']} 
                                        alt={studentName} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none'; 
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/50">
                                        <UsersIcon className="w-8 h-8" />
                                    </div>
                                )}
                           </div>
                           <div>
                                <h3 className="text-2xl font-bold">{studentName}</h3>
                                <p className="opacity-90">NISN: {reportStudentId} | Kelas: {teacher.Class}</p>
                           </div>
                      </div>
                      <div className="mt-4 md:mt-0 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                          <span className="text-sm font-medium">Total Penilaian: {studentScores.length}</span>
                      </div>
                  </div>
              </div>

              {/* Grafik Perkembangan Siswa */}
              <AchievementChart scores={studentScores} title={`Grafik Capaian: ${studentName}`} />

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard label="Hafalan Surah" count={surahScores.length} icon={INPUT_TABS.surah.icon} color={INPUT_TABS.surah.color} />
                  <StatCard label="Doa Sehari-hari" count={doaScores.length} icon={INPUT_TABS.doa.icon} color={INPUT_TABS.doa.color} />
                  <StatCard label="Hadist Pilihan" count={hadistScores.length} icon={INPUT_TABS.hadist.icon} color={INPUT_TABS.hadist.color} />
              </div>

              {/* Detailed Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <CategorySection title="Surah Pendek" items={surahScores} color={INPUT_TABS.surah.color} />
                  <CategorySection title="Doa Sehari-hari" items={doaScores} color={INPUT_TABS.doa.color} />
                  <CategorySection title="Hadist" items={hadistScores} color={INPUT_TABS.hadist.color} />
              </div>
          </div>

          {/* PRINT PREVIEW & LAYOUT */}
          {/* Overlay to dim background when preview is active */}
          <div className={`${isPrintPreview ? 'fixed inset-0 z-[100] bg-gray-800/80 backdrop-blur-sm overflow-y-auto flex justify-center py-8' : 'hidden'} print:block print:fixed print:inset-0 print:bg-white print:z-[200] print:p-0`}>
              
              {/* Floating Toolbar for Preview Mode (Not printed) */}
              {isPrintPreview && (
                  <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[110] bg-white px-6 py-2 rounded-full shadow-xl border border-gray-200 flex gap-4 items-center print:hidden animate-fade-in-down">
                      <span className="text-sm font-bold text-gray-700">Pratinjau Cetak</span>
                      <div className="h-4 w-px bg-gray-300"></div>
                      <button 
                          onClick={() => window.print()} 
                          className="flex items-center text-emerald-600 hover:text-emerald-700 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full transition-colors"
                      >
                          <PrinterIcon className="w-4 h-4 mr-2"/> Cetak / Simpan PDF
                      </button>
                      <button 
                          onClick={() => setIsPrintPreview(false)} 
                          className="flex items-center text-gray-500 hover:text-gray-700 font-medium text-sm ml-2 bg-gray-100 px-3 py-1 rounded-full transition-colors"
                      >
                          <XIcon className="w-4 h-4 mr-1"/> Tutup
                      </button>
                  </div>
              )}

              {/* A4 Paper Container */}
              <div className="bg-white text-black font-serif w-[210mm] min-h-[297mm] p-[15mm] md:p-[20mm] shadow-2xl relative print:shadow-none print:w-full print:min-h-0 print:p-0 print:mx-auto print:static">
                  
                  {/* KOP SURAT */}
                  <div className="flex items-center gap-6 border-b-4 border-double border-gray-800 pb-4 mb-8">
                      <img src="https://iili.io/KmUyjwu.png" alt="Logo" className="w-24 h-24 object-contain" />
                      <div className="flex-1 text-center">
                          <h1 className="text-3xl font-extrabold uppercase tracking-widest font-sans text-gray-900 leading-tight">TK IT Harvysyah</h1>
                          <p className="text-sm mt-1">Jalan Sadar Timur Gang Rahmad No. 042, Kel. Sekip, Kec. Lubuk Pakam</p>
                          <p className="text-sm">Kabupaten Deli Serdang, Sumatera Utara - 20517</p>
                          <p className="text-xs mt-1 italic text-gray-600">Email: tkit.harvysyah@gmail.com</p>
                      </div>
                  </div>

                  <h2 className="text-center text-xl font-bold underline mb-8 uppercase tracking-wider">Laporan Perkembangan Hafalan Siswa</h2>

                  {/* Data Siswa Table */}
                  <table className="w-full mb-8 text-sm">
                      <tbody>
                          <tr>
                              <td className="font-bold w-32 py-1 align-top">Nama Siswa</td>
                              <td className="py-1 align-top w-4">:</td>
                              <td className="py-1 align-top font-medium uppercase">{studentName}</td>
                              
                              <td className="font-bold w-24 py-1 align-top pl-8">Kelas</td>
                              <td className="py-1 align-top w-4">:</td>
                              <td className="py-1 align-top">{teacher.Class}</td>
                          </tr>
                          <tr>
                              <td className="font-bold w-32 py-1 align-top">NISN</td>
                              <td className="py-1 align-top">:</td>
                              <td className="py-1 align-top">{reportStudentId}</td>

                              <td className="font-bold w-24 py-1 align-top pl-8">Semester</td>
                              <td className="py-1 align-top">:</td>
                              <td className="py-1 align-top">{activeSemester === '1' ? 'Ganjil' : 'Genap'}</td>
                          </tr>
                      </tbody>
                  </table>

                  {/* Content Tables */}
                  <div className="break-inside-avoid">
                    <PrintableTable title="A. Hafalan Surah Pendek" items={surahScores} />
                  </div>
                  <div className="break-inside-avoid">
                    <PrintableTable title="B. Hafalan Doa Sehari-hari" items={doaScores} />
                  </div>
                  <div className="break-inside-avoid">
                    <PrintableTable title="C. Hafalan Hadist Pilihan" items={hadistScores} />
                  </div>

                  {/* Legend / Keterangan */}
                  <div className="mt-8 mb-10 text-xs border border-black p-3 inline-block break-inside-avoid shadow-sm bg-gray-50 print:bg-transparent">
                      <p className="font-bold underline mb-2">Keterangan Nilai:</p>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                         <div className="flex items-center"><span className="font-bold w-8">BB</span> : Belum Berkembang</div>
                         <div className="flex items-center"><span className="font-bold w-8">MB</span> : Mulai Berkembang</div>
                         <div className="flex items-center"><span className="font-bold w-8">BSH</span> : Berkembang Sesuai Harapan</div>
                         <div className="flex items-center"><span className="font-bold w-8">BSB</span> : Berkembang Sangat Baik</div>
                      </div>
                  </div>

                  {/* Signatures */}
                  <div className="flex justify-between mt-12 px-4 break-inside-avoid">
                      <div className="text-center w-1/3">
                          <p className="mb-24">Guru Kelas,</p>
                          <p className="font-bold underline uppercase">{teacher.Name}</p>
                          <p className="text-xs mt-1">NIP. -</p>
                      </div>
                      <div className="text-center w-1/3">
                          <p className="mb-1">Lubuk Pakam, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          <p className="mb-24">Kepala Sekolah,</p>
                          <p className="font-bold underline uppercase">{principal?.Name || '..........................'}</p>
                          <p className="text-xs mt-1">NIP. -</p>
                      </div>
                  </div>
              </div>
          </div>
          </>
      );
  };
  
  const renderInputForm = () => {
    if (isLoadingStudents) return <p className="text-center text-gray-500 py-8">Memuat data siswa...</p>;
    if (error && students.length === 0) return <p className="text-center text-red-500 py-8">{error}</p>;

    return (
      <div>
        {editingScore && (
             <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 flex justify-between items-center animate-pulse">
                <p className="text-yellow-700">
                    Sedang mengedit penilaian untuk <strong>{studentMap.get(String(editingScore['Student ID']))}</strong>
                </p>
                <button 
                    onClick={() => {
                        setEditingScore(null);
                        setFormData(prev => ({
                            ...prev,
                            'Student ID': '',
                            'Item Name': '',
                            Score: '',
                            Notes: ''
                        }));
                    }}
                    className="text-sm text-yellow-700 underline hover:text-yellow-900"
                >
                    Batal Edit
                </button>
             </div>
        )}

        <div className="flex justify-center mb-6">
            <div className="bg-gray-100 p-1 rounded-full inline-flex">
                {SEMESTER_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSemester(tab.id)}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            activeSemester === tab.id
                            ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">Input Penilaian {INPUT_TABS[activeSubTab].label}</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="Student ID" className="block text-sm font-medium text-gray-700">Siswa (Kelas {teacher.Class})</label>
              <select id="Student ID" name="Student ID" value={formData['Student ID']} onChange={handleChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                <option value="">Pilih Siswa</option>
                {students.map(student => <option key={student.NISN} value={student.NISN}>{student.Name} ({student.NISN})</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="Item Name" className="block text-sm font-medium text-gray-700">Nama Item Penilaian</label>
              <select id="Item Name" name="Item Name" value={formData['Item Name']} onChange={handleChange} required disabled={isLoadingHafalan || filteredHafalanItems.length === 0} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md disabled:bg-gray-100">
                <option value="">
                    {isLoadingHafalan ? 'Memuat item...' : (filteredHafalanItems.length === 0 ? 'Item tidak ditemukan' : 'Pilih Item')}
                </option>
                {filteredHafalanItems.map(item => <option key={item.ItemName} value={item.ItemName}>{item.ItemName}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Penilaian</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SCORE_OPTIONS.map(option => {
                const scheme = colorSchemes[option.color as keyof typeof colorSchemes];
                const isSelected = formData.Score === option.value;
                return (
                  <button type="button" key={option.value} onClick={() => handleScoreSelect(option.value)} className={`flex flex-col items-center justify-center text-center p-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${scheme.bg} ${scheme.text} ${isSelected ? `${scheme.selected} ring-2 ring-offset-1` : `${scheme.border} hover:shadow-md hover:-translate-y-1`}`}>
                    <option.Icon className="w-8 h-8 mb-2" />
                    <span className="font-bold text-lg">{option.value}</span>
                    <span className="text-xs">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="Date" className="block text-sm font-medium text-gray-700">Tanggal</label>
              <input type="date" id="Date" name="Date" value={formData.Date} onChange={e => setFormData(p => ({...p, Date: e.target.value}))} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"/>
            </div>
            <div>
              <label htmlFor="Notes" className="block text-sm font-medium text-gray-700">Catatan (Opsional)</label>
              <textarea id="Notes" name="Notes" value={formData.Notes} onChange={handleChange} rows={1} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"></textarea>
            </div>
          </div>
          <div className="text-right">
            <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-gray-400 transition-all">
              {isSubmitting ? (editingScore ? 'Menyimpan...' : 'Mengirim...') : (editingScore ? 'Update Penilaian' : 'Kirim Penilaian')}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const isInputMode = activeSection === 'input-score' || editingScore !== null;

  // Success Popup Component
  const SuccessPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform animate-scale-in">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Berhasil!</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">{successMessage}</p>
          <button
            onClick={() => setShowSuccessPopup(false)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-6xl mx-auto min-h-[600px] print:shadow-none print:w-full print:max-w-none print:p-0">
      {/* Success Popup */}
      {showSuccessPopup && <SuccessPopup />}
      {/* HEADER UTAMA APPS (Disembunyikan saat Print) */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div className="flex items-center gap-4">
             {/* Foto Guru */}
             <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-100 shadow-sm flex-shrink-0">
                {teacher['Link Photo'] ? (
                    <img 
                        src={teacher['Link Photo']} 
                        alt={teacher.Name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                             e.currentTarget.style.display = 'none';
                             e.currentTarget.parentElement?.classList.add('bg-emerald-50', 'flex', 'items-center', 'justify-center');
                        }}
                    />
                ) : (
                    <div className="w-full h-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                         <BookIcon className="w-8 h-8" />
                    </div>
                )}
             </div>
             <div>
                <h2 className="text-2xl font-bold text-gray-800">Portal Guru</h2>
                <p className="text-gray-500">Kelas: {teacher.Class} | Guru: {teacher.Name}</p>
             </div>
        </div>
        <button onClick={onBack} className="flex items-center text-emerald-600 hover:text-emerald-800 font-semibold">
           <ChevronLeftIcon className="w-5 h-5 mr-1" />
           Kembali
        </button>
      </div>

      {isInputMode ? (
        <>
            <div className="border-b mb-6 pb-2 print:hidden">
                <h3 className="text-lg font-medium text-emerald-800">Form Input Penilaian</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-6 print:hidden">
                {(Object.keys(INPUT_TABS) as InputTabKey[]).map((key) => {
                    const tab = INPUT_TABS[key];
                    const isActive = activeSubTab === key;
                    const colorClass = `text-${tab.color}-600`;
                    
                    return (
                        <button
                            key={key}
                            onClick={() => setActiveSubTab(key)}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                                isActive 
                                ? `bg-${tab.color}-50 border-${tab.color}-500 ${colorClass} ring-1 ring-${tab.color}-500 shadow-sm` 
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:shadow-sm'
                            }`}
                        >
                            <tab.icon className={`w-6 h-6 mb-1 ${isActive ? colorClass : 'text-gray-400'}`} />
                            <span className="text-xs font-medium text-center">{tab.label}</span>
                        </button>
                    )
                })}
            </div>
            {submitStatus && submitStatus.type === 'error' && (
                <div className="mb-4 p-4 rounded-md border-l-4 bg-red-50 border-red-500 text-red-700">
                    {submitStatus.message}
                </div>
            )}
            <div className="print:hidden">
              {renderInputForm()}
            </div>
        </>
      ) : (
         <div className="space-y-6">
             <div className="border-b pb-2 print:hidden">
                <h3 className="text-lg font-medium text-emerald-800">Laporan Belajar Siswa</h3>
             </div>
             
             {/* Report Toolbar - Disembunyikan saat print */}
             <div className="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200 gap-4 print:hidden">
                 <div className="w-full md:w-1/2">
                     <label htmlFor="reportStudent" className="block text-sm font-medium text-gray-700 mb-1">Cari / Pilih Siswa</label>
                     <select
                        id="reportStudent"
                        value={reportStudentId}
                        onChange={(e) => setReportStudentId(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                     >
                         <option value="">-- Pilih Siswa --</option>
                         {students.map(s => (
                             <option key={s.NISN} value={s.NISN}>{s.Name}</option>
                         ))}
                     </select>
                 </div>
                 <button 
                    onClick={fetchScores} 
                    className="w-full md:w-auto text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md flex items-center justify-center shadow-sm"
                    disabled={isLoadingScores}
                 >
                    {isLoadingScores ? 'Memuat...' : 'Refresh Data'}
                 </button>
             </div>

             {isLoadingScores ? (
                 <div className="flex flex-col items-center justify-center py-12 print:hidden">
                     <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                     <p className="text-gray-500">Mengambil data terbaru...</p>
                 </div>
             ) : (
                 <>
                    {reportStudentId ? (
                        renderStudentReport()
                    ) : (
                        <div className="space-y-6 animate-fade-in print:hidden">
                            <h3 className="text-lg font-bold text-gray-700 flex items-center">
                                <UsersIcon className="w-5 h-5 mr-2 text-emerald-600" />
                                Daftar Siswa Kelas {teacher.Class}
                            </h3>
                            
                            {/* Student Grid View */}
                            {students.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {students.map((student) => {
                                        const studentScoreCount = scores.filter(s => String(s['Student ID']) === String(student.NISN)).length;
                                        
                                        return (
                                            <div 
                                                key={student.NISN}
                                                onClick={() => setReportStudentId(student.NISN)}
                                                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-300 cursor-pointer transition-all group relative overflow-hidden flex items-center justify-between"
                                            >
                                                <div className="flex-1 mr-3">
                                                    <h4 className="font-bold text-gray-800 text-lg group-hover:text-emerald-700 transition-colors">
                                                        {student.Name}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 mt-1">NISN: {student.NISN}</p>
                                                    <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded mt-2 inline-block">
                                                        {studentScoreCount} Penilaian
                                                    </span>
                                                </div>
                                                
                                                <div className="flex-shrink-0">
                                                    {student['Link Photo'] ? (
                                                         <div className="w-14 h-14 rounded-full border-2 border-emerald-100 overflow-hidden shadow-sm">
                                                             <img 
                                                                src={student['Link Photo']} 
                                                                alt={student.Name} 
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    e.currentTarget.parentElement?.classList.add('bg-emerald-50', 'flex', 'items-center', 'justify-center');
                                                                }}
                                                             />
                                                         </div>
                                                    ) : (
                                                        <div className="bg-emerald-50 p-3 rounded-full text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                                            <BookIcon className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    <UsersIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500">Belum ada data siswa di kelas ini.</p>
                                </div>
                            )}
                        </div>
                    )}
                 </>
             )}
         </div>
      )}
    </div>
  );
};

export default TeacherPortal;