
import React, { useState, useEffect, useMemo } from 'react';
import { getSheetData } from '../services/googleSheetsService';
import type { Teacher, Student, Principal, Score } from '../types';
import { ChevronLeftIcon, UsersIcon, BookIcon, ShieldCheckIcon, ChartBarIcon, QuoteIcon, PrayingHandsIcon, VeryWellDevelopedIcon, DevelopingAsExpectedIcon, StartingToDevelopIcon, NotYetDevelopedIcon } from './icons';
import { PrincipalSection } from '../App';

interface PrincipalPortalProps {
  onBack: () => void;
  principal: Principal;
  activeSection: PrincipalSection;
}

// Updated DataTable with Pagination Support
const DataTable = <T,>({ 
    title, 
    data, 
    columns, 
    itemsPerPage = 0 
}: { 
    title: string; 
    data: T[] | null; 
    columns: { header: string; accessor: keyof T }[];
    itemsPerPage?: number;
}) => {
    const [currentPage, setCurrentPage] = useState(1);

    // Reset page to 1 if data changes (e.g. filtering)
    useEffect(() => {
        setCurrentPage(1);
    }, [data]);

    const { paginatedData, totalPages, startRange, endRange, totalItems } = useMemo(() => {
        if (!data) return { paginatedData: null, totalPages: 1, startRange: 0, endRange: 0, totalItems: 0 };
        
        const total = data.length;
        if (itemsPerPage <= 0 || total <= itemsPerPage) {
            return { paginatedData: data, totalPages: 1, startRange: 1, endRange: total, totalItems: total };
        }

        const pages = Math.ceil(total / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage;
        const end = Math.min(start + itemsPerPage, total);
        const slicedData = data.slice(start, end);

        return { 
            paginatedData: slicedData, 
            totalPages: pages, 
            startRange: start + 1, 
            endRange: end, 
            totalItems: total 
        };
    }, [data, currentPage, itemsPerPage]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                 <h3 className="text-lg font-bold text-gray-700">{title}</h3>
                 {data && <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-1 rounded-full">{data.length} Data Total</span>}
            </div>
            <div className="overflow-x-auto flex-grow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-emerald-600">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-10">No</th>
                            {columns.map(col => (
                                <th key={String(col.accessor)} scope="col" className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedData && paginatedData.length > 0 ? paginatedData.map((item, index) => {
                            // Calculate actual index based on pagination
                            const actualIndex = itemsPerPage > 0 ? ((currentPage - 1) * itemsPerPage) + index : index;
                            
                            return (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">{actualIndex + 1}</td>
                                    {columns.map(col => (
                                        <td key={String(col.accessor)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                            {String(item[col.accessor] !== undefined ? item[col.accessor] : '-')}
                                        </td>
                                    ))}
                                </tr>
                            );
                        }) : (
                            <tr>
                               <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500 italic">
                                    {data ? "Tidak ada data ditemukan" : "Memuat data..."}
                               </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination Controls */}
            {itemsPerPage > 0 && totalPages > 1 && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Menampilkan <span className="font-medium">{startRange}</span> - <span className="font-medium">{endRange}</span> dari <span className="font-medium">{totalItems}</span> data
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            Sebelumnya
                        </button>
                        <div className="flex items-center space-x-1">
                             {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                // Logic to show window of pages centered around current
                                let pNum = i + 1;
                                if (totalPages > 5) {
                                    if (currentPage > 3) pNum = currentPage - 2 + i;
                                    if (pNum > totalPages) pNum = totalPages - 4 + i;
                                }
                                
                                return (
                                    <button
                                        key={pNum}
                                        onClick={() => setCurrentPage(pNum)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                                            currentPage === pNum
                                                ? 'bg-emerald-600 text-white border border-emerald-600'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {pNum}
                                    </button>
                                );
                             })}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            Selanjutnya
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; color: string; subtitle?: string }> = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-start space-x-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 group">
        <div className={`p-4 rounded-xl bg-${color}-50 text-${color}-600 group-hover:bg-${color}-100 transition-colors`}>
            {icon}
        </div>
        <div className="flex-1">
            <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wide">{title}</p>
            <h4 className="text-3xl font-bold text-gray-800">{value}</h4>
            {subtitle && (
                <div className="flex items-center mt-2 text-xs font-medium text-gray-400 bg-gray-50 inline-block px-2 py-1 rounded">
                   {subtitle}
                </div>
            )}
        </div>
    </div>
);

// New Component for Distribution Bar
const DistributionBar = ({ label, count, total, color }: { label: string, count: number, total: number, color: string }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-gray-700">{label}</span>
                <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">{count} ({percentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
                <div className={`h-3 rounded-full bg-${color}-500 transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const PrincipalPortal: React.FC<PrincipalPortalProps> = ({ onBack, principal, activeSection }) => {
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [students, setStudents] = useState<Student[] | null>(null);
  const [scores, setScores] = useState<Score[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for tabs in Data Guru/Siswa section
  const [schoolDataTab, setSchoolDataTab] = useState<'teachers' | 'students'>('teachers');
  
  // State for Class Filter in Student Data
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');

  // State for Score Monitoring Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Fetch all data regardless of section to calculate dashboard stats
        const [teacherData, studentData, scoreData] = await Promise.all([
          getSheetData<Teacher>('Teacher'),
          getSheetData<Student>('Student'),
          getSheetData<Score>('Score'),
        ]);
        setTeachers(teacherData);
        setStudents(studentData);
        setScores(scoreData);
      } catch (err) {
        setError('Gagal memuat data sistem. Silakan periksa koneksi internet Anda.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const getRecentScores = () => {
      if (!scores) return [];
      // Sort by date descending and take top 5
      return [...scores]
        .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
        .slice(0, 5);
  };

  // --- DASHBOARD ANALYTICS LOGIC ---
  const dashboardAnalytics = useMemo(() => {
    if (!scores || !students) return null;

    // 1. Distribution of Scores (BB, MB, BSH, BSB)
    const distribution = { BB: 0, MB: 0, BSH: 0, BSB: 0 };
    scores.forEach(s => {
        if (s.Score in distribution) distribution[s.Score as keyof typeof distribution]++;
    });

    // 2. Category Breakdown
    const categories = { surah: 0, doa: 0, hadist: 0 };
    scores.forEach(s => {
        const cat = s.Category.toLowerCase();
        if (cat.includes('surah')) categories.surah++;
        else if (cat.includes('doa')) categories.doa++;
        else if (cat.includes('hadist')) categories.hadist++;
    });

    // 3. Class Performance (Total Inputs per Class)
    const classPerformance: Record<string, number> = {};
    // Map Student ID to Class
    const studentClassMap = new Map<string, string>(students.map(s => [String(s.NISN), s.Class] as [string, string]));
    
    scores.forEach(s => {
        const studentClass = studentClassMap.get(String(s['Student ID']));
        if (studentClass) {
            classPerformance[studentClass] = (classPerformance[studentClass] || 0) + 1;
        }
    });
    // Sort classes by activity
    const sortedClasses = Object.entries(classPerformance)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5); // Top 5 classes

    // 4. Top 5 Students
    const studentPerformance: Record<string, number> = {};
    const studentNameMap = new Map<string, {name: string, class: string}>(
        students.map(s => [String(s.NISN), {name: s.Name, class: s.Class}] as [string, {name: string, class: string}])
    );

    scores.forEach(s => {
        const sid = String(s['Student ID']);
        studentPerformance[sid] = (studentPerformance[sid] || 0) + 1;
    });

    const topStudents = Object.entries(studentPerformance)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([id, count]) => {
            const info = studentNameMap.get(id);
            return { name: info?.name || id, class: info?.class || '-', count };
        });

    return { distribution, categories, sortedClasses, topStudents };

  }, [scores, students]);


  // Get unique classes for filter dropdown from BOTH students and teachers
  const uniqueClasses = useMemo(() => {
      const classes = new Set<string>();
      if (students) students.forEach(s => classes.add(s.Class));
      if (teachers) teachers.forEach(t => classes.add(t.Class));
      return Array.from(classes).sort();
  }, [students, teachers]);

  // Filter students based on selection
  const filteredStudents = useMemo(() => {
      if (!students) return null;
      if (!selectedClassFilter) return students;
      return students.filter(s => s.Class === selectedClassFilter);
  }, [students, selectedClassFilter]);

  // Filter teachers based on selection
  const filteredTeachers = useMemo(() => {
      if (!teachers) return null;
      if (!selectedClassFilter) return teachers;
      return teachers.filter(t => t.Class === selectedClassFilter);
  }, [teachers, selectedClassFilter]);

  const teacherColumns = [
      { header: 'Nama Lengkap', accessor: 'Name' as keyof Teacher}, 
      { header: 'No. Handphone', accessor: 'Phone' as keyof Teacher}, 
      { header: 'Wali Kelas', accessor: 'Class' as keyof Teacher}
  ];
  
  const studentColumns = [
      { header: 'Nama Lengkap', accessor: 'Name' as keyof Student}, 
      { header: 'NISN', accessor: 'NISN' as keyof Student}, 
      { header: 'Kelas', accessor: 'Class' as keyof Student}
  ];
  
  const scoreColumns = [
    { header: 'Tanggal', accessor: 'Date' as keyof Score},
    { header: 'Nama Siswa', accessor: 'Student ID' as keyof Score}, // Note: Ideally should map to Name
    { header: 'Kategori', accessor: 'Category' as keyof Score}, 
    { header: 'Item Hafalan', accessor: 'Item Name' as keyof Score},
    { header: 'Nilai', accessor: 'Score' as keyof Score},
    { header: 'Guru Penilai', accessor: 'Teacher Name' as keyof Score},
  ];

  // Map Student ID to Student Name AND Apply Date Range & Student Filters
  const mappedFilteredScoreData = useMemo(() => {
      if (!scores || !students) return scores;
      
      const studentMap = new Map(students.map(s => [String(s.NISN), s.Name]));
      
      let filtered = scores;
      
      // Filter by Start Date
      if (startDate) {
          filtered = filtered.filter(s => s.Date >= startDate);
      }

      // Filter by End Date
      if (endDate) {
          filtered = filtered.filter(s => s.Date <= endDate);
      }

      // Filter by Selected Student
      if (selectedStudentFilter) {
          filtered = filtered.filter(s => String(s['Student ID']) === selectedStudentFilter);
      }

      return filtered.map(s => ({
          ...s,
          'Student ID': studentMap.get(String(s['Student ID'])) || s['Student ID'] // Replace ID with Name for display
      }));
  }, [scores, students, startDate, endDate, selectedStudentFilter]);

  // Logic to calculate Teacher Progress
  const teacherProgressData = useMemo(() => {
      if (!teachers || !scores || !students) return null;

      return teachers.map(teacher => {
          // Filter scores by this teacher name
          // Note: This relies on 'Teacher Name' being saved in Score. If missing, it counts as 0.
          const teacherScores = scores.filter(s => s['Teacher Name'] === teacher.Name);
          
          // Calculate distinct students assessed
          const distinctStudents = new Set(teacherScores.map(s => s['Student ID'])).size;
          
          // Get last activity date
          let lastActive = '-';
          if (teacherScores.length > 0) {
              const sortedDates = teacherScores.map(s => new Date(s.Date).getTime()).sort((a, b) => b - a);
              lastActive = new Date(sortedDates[0]).toLocaleDateString('id-ID');
          }

          // Count total students in this teacher's class
          const classStudentCount = students.filter(s => s.Class === teacher.Class).length;

          return {
              name: teacher.Name,
              class: teacher.Class,
              totalInput: teacherScores.length,
              studentsAssessed: distinctStudents,
              totalStudents: classStudentCount,
              lastActive: lastActive,
              performance: classStudentCount > 0 ? Math.round((distinctStudents / classStudentCount) * 100) : 0
          };
      });
  }, [teachers, scores, students]);


  const renderContent = () => {
      if (isLoading) return (
          <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Sedang memuat data...</p>
          </div>
      );

      if (error) return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-700">
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="mt-4 underline">Muat Ulang</button>
          </div>
      );

      switch (activeSection) {
          case 'school-data':
              return (
                  <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-center border-b border-gray-200 gap-4">
                          <div className="flex space-x-4">
                             <button
                                className={`pb-2 px-4 font-medium transition-colors ${schoolDataTab === 'teachers' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setSchoolDataTab('teachers')}
                             >
                                Data Guru
                             </button>
                             <button
                                className={`pb-2 px-4 font-medium transition-colors ${schoolDataTab === 'students' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setSchoolDataTab('students')}
                             >
                                Data Siswa
                             </button>
                          </div>
                          
                          {/* Filter Dropdown for Both Tabs */}
                          <div className="mb-2 sm:mb-0 w-full sm:w-auto">
                              <select
                                  value={selectedClassFilter}
                                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                                  className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 rounded-md border"
                              >
                                  <option value="">Semua Kelas</option>
                                  {uniqueClasses.map(cls => (
                                      <option key={cls} value={cls}>{cls}</option>
                                  ))}
                              </select>
                          </div>
                      </div>
                      
                      {schoolDataTab === 'teachers' ? (
                          <DataTable 
                                title={`Data Guru Pengajar ${selectedClassFilter ? `(Wali Kelas ${selectedClassFilter})` : '(Semua Guru)'}`} 
                                data={filteredTeachers} 
                                columns={teacherColumns}
                                itemsPerPage={10} 
                          />
                      ) : (
                          <DataTable 
                                title={`Data Siswa ${selectedClassFilter ? `(Kelas ${selectedClassFilter})` : '(Semua Kelas)'}`} 
                                data={filteredStudents} 
                                columns={studentColumns}
                                itemsPerPage={10} 
                          />
                      )}
                  </div>
              );
          
          case 'scores':
              return (
                <div className="space-y-4">
                     {/* Filter Section */}
                     <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
                         <h3 className="text-gray-700 font-bold whitespace-nowrap">Filter Data:</h3>
                         
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Filter Tanggal */}
                             <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Dari Tanggal</label>
                                <input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="block w-full px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 rounded-md border"
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Sampai Tanggal</label>
                                <input 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="block w-full px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 rounded-md border"
                                />
                             </div>

                             {/* Filter Siswa */}
                             <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Nama Siswa</label>
                                <select 
                                    value={selectedStudentFilter}
                                    onChange={(e) => setSelectedStudentFilter(e.target.value)}
                                    className="block w-full px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 rounded-md border"
                                >
                                    <option value="">Semua Siswa</option>
                                    {students?.sort((a,b) => a.Name.localeCompare(b.Name)).map(s => (
                                        <option key={s.NISN} value={s.NISN}>{s.Name} ({s.Class})</option>
                                    ))}
                                </select>
                             </div>
                         </div>
                     </div>

                     <DataTable 
                        title={`Monitoring Penilaian`} 
                        data={mappedFilteredScoreData} 
                        columns={scoreColumns} 
                        itemsPerPage={20} 
                     />
                </div>
              );
          
          case 'teacher-progress':
              return (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-700">Progres Kerja & Keaktifan Guru</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-emerald-600 text-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Nama Guru</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Kelas</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Total Input</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Cakupan Siswa</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Terakhir Aktif</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {teacherProgressData && teacherProgressData.map((t, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold">{t.class}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                <span className="bg-emerald-100 text-emerald-800 py-1 px-3 rounded-full font-bold">
                                                    {t.totalInput}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center justify-center">
                                                    <div className="w-full max-w-[100px] bg-gray-200 rounded-full h-2.5 mr-2">
                                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${t.performance}%` }}></div>
                                                    </div>
                                                    <span className="text-xs text-gray-600">{t.studentsAssessed} / {t.totalStudents}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {t.lastActive}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                  </div>
              );

          case 'dashboard':
          default:
              const analytics = dashboardAnalytics;
              const totalScores = scores?.length || 0;

              return (
                  <div className="space-y-6 animate-fade-in">
                      {/* Welcome Card - Clean & Modern */}
                      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl shadow-lg p-8 text-white flex flex-col md:flex-row justify-between items-center">
                           <div className="space-y-2">
                                <h3 className="text-3xl font-extrabold tracking-tight">Halo, {principal.Name}</h3>
                                <p className="text-emerald-50 opacity-90 text-lg">
                                    Pantau perkembangan hafalan siswa dan kinerja guru dalam satu tampilan.
                                </p>
                           </div>
                           <div className="mt-6 md:mt-0 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-center min-w-[180px]">
                                <p className="text-sm font-medium text-emerald-100 uppercase tracking-wider mb-1">Semester</p>
                                <p className="text-xl font-bold">Genap 2024/2025</p>
                           </div>
                      </div>

                      {/* 4 Key Metrics - Grid Layout */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          <StatCard 
                            title="Total Siswa" 
                            value={students?.length || 0} 
                            icon={<UsersIcon className="w-8 h-8"/>} 
                            color="blue"
                            subtitle="Siswa Aktif"
                          />
                          <StatCard 
                            title="Total Guru" 
                            value={teachers?.length || 0} 
                            icon={<BookIcon className="w-8 h-8"/>} 
                            color="emerald"
                            subtitle="Wali Kelas"
                          />
                          <StatCard 
                            title="Total Penilaian" 
                            value={totalScores} 
                            icon={<ShieldCheckIcon className="w-8 h-8"/>} 
                            color="amber"
                            subtitle="Data Tersimpan"
                          />
                          <StatCard 
                            title="Kelas Teraktif" 
                            value={analytics?.sortedClasses[0]?.[0] || '-'} 
                            icon={<ChartBarIcon className="w-8 h-8"/>} 
                            color="purple"
                            subtitle={`${analytics?.sortedClasses[0]?.[1] || 0} Setoran`}
                          />
                      </div>

                      {/* Main Analysis Section */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                           {/* LEFT: Grade Distribution (Takes 2 columns) */}
                           <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-xl font-bold text-gray-800 flex items-center">
                                        <ChartBarIcon className="w-6 h-6 mr-3 text-emerald-600"/>
                                        Analisis Kualitas Hafalan
                                    </h4>
                                    <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">Global Sekolah</span>
                                </div>
                                
                                {analytics ? (
                                    <div className="space-y-6 flex-grow justify-center flex flex-col">
                                        <DistributionBar label="Belum Berkembang (BB)" count={analytics.distribution.BB} total={totalScores} color="red" />
                                        <DistributionBar label="Mulai Berkembang (MB)" count={analytics.distribution.MB} total={totalScores} color="yellow" />
                                        <DistributionBar label="Berkembang Sesuai Harapan (BSH)" count={analytics.distribution.BSH} total={totalScores} color="green" />
                                        <DistributionBar label="Berkembang Sangat Baik (BSB)" count={analytics.distribution.BSB} total={totalScores} color="emerald" />
                                    </div>
                                ) : <div className="h-64 bg-gray-100 animate-pulse rounded-xl"></div>}
                           </div>

                           {/* RIGHT: Category Breakdown (Takes 1 column) */}
                           <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <h4 className="text-xl font-bold text-gray-800 mb-6">Sebaran Kategori</h4>
                                <div className="space-y-4">
                                    <div className="bg-emerald-50 p-4 rounded-xl flex items-center justify-between border border-emerald-100 transition-transform hover:scale-[1.02]">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-emerald-200 rounded-lg text-emerald-700 mr-4">
                                                <BookIcon className="w-6 h-6"/>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">Surah</p>
                                                <p className="text-xs text-emerald-600 font-medium">Hafalan Quran</p>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-bold text-emerald-700">{analytics?.categories.surah}</span>
                                    </div>
                                    
                                    <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between border border-blue-100 transition-transform hover:scale-[1.02]">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-blue-200 rounded-lg text-blue-700 mr-4">
                                                <PrayingHandsIcon className="w-6 h-6"/>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">Doa</p>
                                                <p className="text-xs text-blue-600 font-medium">Harian</p>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-bold text-blue-700">{analytics?.categories.doa}</span>
                                    </div>

                                    <div className="bg-amber-50 p-4 rounded-xl flex items-center justify-between border border-amber-100 transition-transform hover:scale-[1.02]">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-amber-200 rounded-lg text-amber-700 mr-4">
                                                <QuoteIcon className="w-6 h-6"/>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">Hadist</p>
                                                <p className="text-xs text-amber-600 font-medium">Pilihan</p>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-bold text-amber-700">{analytics?.categories.hadist}</span>
                                    </div>
                                </div>
                           </div>
                      </div>

                      {/* Bottom Section: Leaderboards */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                           {/* 1. Class Leaderboard */}
                           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                    <h4 className="font-bold text-gray-800">Peringkat Keaktifan Kelas</h4>
                                    <UsersIcon className="w-5 h-5 text-gray-400"/>
                                </div>
                                <div className="p-0">
                                    {analytics?.sortedClasses.map(([cls, count], idx) => (
                                        <div key={cls} className="flex justify-between items-center px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors even:bg-gray-50/50">
                                            <div className="flex items-center">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 shadow-sm ${idx === 0 ? 'bg-yellow-400 text-white ring-2 ring-yellow-200' : idx === 1 ? 'bg-gray-300 text-white' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="font-semibold text-gray-700">{cls}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-emerald-600 font-bold mr-1">{count}</span>
                                                <span className="text-xs text-gray-400">setoran</span>
                                            </div>
                                        </div>
                                    ))}
                                    {analytics?.sortedClasses.length === 0 && <p className="p-6 text-center text-gray-400">Belum ada data.</p>}
                                </div>
                           </div>

                           {/* 2. Top Students Leaderboard */}
                           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                    <h4 className="font-bold text-gray-800">Top 5 Siswa Terajin</h4>
                                    <VeryWellDevelopedIcon className="w-5 h-5 text-yellow-500"/>
                                </div>
                                <div className="p-0">
                                    {analytics?.topStudents.map((student, idx) => (
                                        <div key={idx} className="flex justify-between items-center px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors even:bg-gray-50/50">
                                            <div className="flex items-center">
                                                 <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 shadow-sm ${idx === 0 ? 'bg-yellow-400 text-white ring-2 ring-yellow-200' : idx === 1 ? 'bg-gray-300 text-white' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                    {idx + 1}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{student.name}</p>
                                                    <p className="text-xs text-gray-500 font-medium">Kelas {student.class}</p>
                                                </div>
                                            </div>
                                            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                                                {student.count} Hafalan
                                            </span>
                                        </div>
                                    ))}
                                    {(!analytics?.topStudents.length) && <p className="p-6 text-center text-gray-400">Belum ada data cukup.</p>}
                                </div>
                           </div>
                      </div>

                      {/* Recent Activity Log - Full Width */}
                       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <h4 className="text-lg font-bold text-gray-800 mb-4 border-b pb-4">Aktivitas Penilaian Terkini</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {getRecentScores()?.map((s, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                                        <div className="flex items-center mb-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">{s.Date.split('T')[0]}</span>
                                        </div>
                                        <p className="font-bold text-sm text-gray-800 line-clamp-1 mb-1">
                                            {students?.find(stu => String(stu.NISN) === String(s['Student ID']))?.Name || s['Student ID']}
                                        </p>
                                        <div className="mt-auto">
                                            <p className="text-xs text-gray-500 truncate">{s['Item Name']}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold mt-2 inline-block ${
                                                s.Score === 'BSB' ? 'bg-emerald-100 text-emerald-700' :
                                                s.Score === 'BSH' ? 'bg-green-100 text-green-700' :
                                                s.Score === 'MB' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {s.Score}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {(!getRecentScores().length) && <p className="text-gray-400 italic">Belum ada aktivitas.</p>}
                            </div>
                       </div>
                  </div>
              );
      }
  };

  return (
    <div className="bg-gray-50 min-h-[600px] w-full max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Portal Kepala Sekolah</h2>
                <p className="text-gray-500 mt-1">
                    {activeSection === 'dashboard' && 'Executive Dashboard & Analisis'}
                    {activeSection === 'school-data' && 'Manajemen Data Guru & Siswa'}
                    {activeSection === 'scores' && 'Monitoring Penilaian Hafalan'}
                    {activeSection === 'teacher-progress' && 'Analisis Kinerja & Keaktifan Guru'}
                </p>
            </div>
            <button onClick={onBack} className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium text-sm">
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                Kembali ke Menu Utama
            </button>
          </div>
      </div>

      {/* Dynamic Content Section */}
      {renderContent()}
    </div>
  );
};

export default PrincipalPortal;
