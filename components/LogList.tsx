import React, { useState, useRef, useEffect } from 'react';
import { Employee, TimeLog } from '../types';
import { COMPANY_NAME } from '../constants';

interface LogListProps {
  logs: TimeLog[];
  employees: Employee[];
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteLog: (logId: string) => void;
  onDeleteEmployee: (employeeId: string) => void;
  onClose: () => void;
  adminPin: string;
  onUpdateAdminPin: (newPin: string) => void;
}

const LogList: React.FC<LogListProps> = ({ 
  logs, 
  employees, 
  onAddEmployee, 
  onUpdateEmployee,
  onDeleteLog,
  onDeleteEmployee,
  onClose,
  adminPin,
  onUpdateAdminPin
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'employees'>('dashboard');
  
  // -- FILTERS & SEARCH --
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');

  // -- FEEDBACK STATE --
  const [filterFeedback, setFilterFeedback] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  // -- FORM STATES --
  const [newName, setNewName] = useState('');
  const [newId, setNewId] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newHourlyRate, setNewHourlyRate] = useState(''); 
  const [newOvertimeRate, setNewOvertimeRate] = useState('');
  const [newDailyHours, setNewDailyHours] = useState('');

  // -- EDIT EMPLOYEE STATE --
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // -- MISC STATES --
  const [printData, setPrintData] = useState<{title: string, subtitle: string, logs: TimeLog[]} | null>(null);
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [successScreenData, setSuccessScreenData] = useState<{title: string, message: string} | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{type: 'log' | 'employee', id: string} | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  
  // Settings Form State
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');

  // -- EFFECT: Print Trigger --
  // This ensures the DOM is updated with printData BEFORE window.print() is called
  useEffect(() => {
    if (printData) {
      const timer = setTimeout(() => {
        window.print();
      }, 500); // Small delay to ensure rendering is complete
      return () => clearTimeout(timer);
    }
  }, [printData]);

  // -- EFFECT: Filter Feedback --
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (filterFeedback !== "Filtros Resetados") {
        triggerFeedback("Filtros Atualizados");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, startDate, endDate, filterVerified]);

  const triggerFeedback = (msg: string) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setFilterFeedback(msg);
    feedbackTimeoutRef.current = window.setTimeout(() => setFilterFeedback(null), 2000);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setFilterVerified('all');
    triggerFeedback("Filtros Resetados");
  };

  // -- HELPERS --

  const downloadCSV = () => {
    const headers = "ID Log,Nome,ID Funcionario,Data,Hora,Tipo,Verificado\n";
    const filtered = getFilteredLogs();
    const rows = filtered.map(log => {
      const date = log.timestamp.toLocaleDateString();
      const time = log.timestamp.toLocaleTimeString();
      return `${log.id},"${log.employeeName}",${log.employeeId},${date},${time},${log.type},${log.isVerified ? 'Sim' : 'Nao'}`;
    }).join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pontos_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintFilteredLogs = () => {
    const filtered = getFilteredLogs();
    if (filtered.length === 0) {
      alert("Não há registros visíveis para imprimir.");
      return;
    }

    const dateRangeStr = startDate || endDate ? `Periodo: ${startDate || 'Inicio'} a ${endDate || 'Hoje'}` : 'Todo o Período';
    
    // Set data and trigger the useEffect print
    setPrintData({
      title: "Relatório de Registros de Ponto",
      subtitle: `${dateRangeStr} | Status: ${filterVerified === 'all' ? 'Todos' : filterVerified}`,
      logs: filtered
    });
  };

  const getFilteredLogs = () => {
    return logs.filter(log => {
      const logDateStr = log.timestamp.toISOString().slice(0, 10); // YYYY-MM-DD

      // 1. Search Term
      const matchesSearch = log.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            log.employeeId.includes(searchTerm);

      // 2. Date Range
      const matchesStart = startDate ? logDateStr >= startDate : true;
      const matchesEnd = endDate ? logDateStr <= endDate : true;

      // 3. Verification Status
      let matchesVerified = true;
      if (filterVerified === 'verified') matchesVerified = log.isVerified;
      if (filterVerified === 'unverified') matchesVerified = !log.isVerified;

      return matchesSearch && matchesStart && matchesEnd && matchesVerified;
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const handleRegisterEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all fields including hourly rate
    if (!newName || !newId || !newRole || !newOvertimeRate || !newDailyHours || !newHourlyRate) {
        alert("Por favor, preencha todos os campos para cadastrar o funcionário.");
        return;
    }

    if (employees.some(emp => emp.id === newId)) {
      alert("ID já existe!");
      return;
    }

    const newEmp: Employee = {
      id: newId,
      name: newName,
      role: newRole,
      hourlyRate: parseFloat(newHourlyRate),
      overtimeRate: parseFloat(newOvertimeRate),
      dailyHours: parseFloat(newDailyHours)
    };

    onAddEmployee(newEmp);
    // Reset Form
    setNewName('');
    setNewId('');
    setNewRole('');
    setNewHourlyRate('');
    setNewOvertimeRate('');
    setNewDailyHours('');
    
    setSuccessScreenData({
      title: "Registro Concluído",
      message: `O funcionário ${newEmp.name} foi adicionado com sucesso.`
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    onUpdateEmployee(editingEmployee);
    setEditingEmployee(null);
    setSuccessScreenData({
      title: "Atualizado",
      message: "Dados do funcionário atualizados com sucesso."
    });
  };

  // --- DELETE LOGIC ---
  const confirmDelete = () => {
    if (passwordInput === adminPin) {
      if (deleteTarget) {
        if (deleteTarget.type === 'log') onDeleteLog(deleteTarget.id);
        else if (deleteTarget.type === 'employee') onDeleteEmployee(deleteTarget.id);
        
        setDeleteTarget(null);
        setPasswordInput('');
      }
    } else {
      alert("Senha incorreta!");
    }
  };

  // --- PASSWORD CHANGE ---
  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPinInput !== adminPin) {
      alert("Senha atual incorreta.");
      return;
    }
    if (newPinInput.length !== 4 || isNaN(Number(newPinInput))) {
      alert("A nova senha deve ter 4 dígitos numéricos.");
      return;
    }
    onUpdateAdminPin(newPinInput);
    setShowSettingsModal(false);
    setSuccessScreenData({
      title: "Segurança",
      message: "Senha alterada com sucesso."
    });
  };

  // --- PAYROLL CALC (Overtime Only) ---
  const getEmployeeStats = (employeeId: string, overtimeRate: number, dailyHoursLimit: number) => {
    const userLogs = logs.filter(l => l.employeeId === employeeId).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    let regularHours = 0;
    let overtimeHours = 0;
    const limitHours = dailyHoursLimit || 8; 
    const WORK_DAY_LIMIT_MS = limitHours * 60 * 60 * 1000; 

    for (let i = 0; i < userLogs.length; i++) {
      if (userLogs[i].type === 'IN') {
        if (i + 1 < userLogs.length && userLogs[i+1].type === 'OUT') {
           const duration = userLogs[i+1].timestamp.getTime() - userLogs[i].timestamp.getTime();
           if (duration > WORK_DAY_LIMIT_MS) {
             regularHours += (WORK_DAY_LIMIT_MS / (1000 * 60 * 60));
             overtimeHours += ((duration - WORK_DAY_LIMIT_MS) / (1000 * 60 * 60));
           } else {
             regularHours += (duration / (1000 * 60 * 60));
           }
           i++;
        }
      }
    }
    const totalPay = (overtimeHours * overtimeRate);
    return {
      totalHours: (regularHours + overtimeHours).toFixed(2),
      overtimeHours: overtimeHours.toFixed(2),
      pay: totalPay.toFixed(2)
    };
  };

  // --- DASHBOARD DATA ---
  const getLast7DaysActivity = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      const count = logs.filter(l => l.timestamp.toISOString().slice(0, 10) === dayStr).length;
      days.push({ day: d.toLocaleDateString('pt-BR', {weekday: 'short'}), count });
    }
    return days;
  };
  const activityData = getLast7DaysActivity();
  const maxActivity = Math.max(...activityData.map(d => d.count), 1);

  return (
    <>
      {/* Revised Print Styles */}
      <style>{`
        @media print {
          @page { margin: 1cm; size: auto; }
          /* No special 'body *' visibility hacks needed as we use print:hidden and print:block classes */
        }
      `}</style>

      <div className="w-full h-full flex flex-col bg-slate-900 overflow-hidden animate-fade-in print:hidden relative">
        {/* TOP BAR */}
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center shadow-lg z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-900/50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Painel de Controle</h2>
              <p className="text-xs text-slate-400 font-medium">Logado como Administrador</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Segurança
            </button>
             <button 
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-red-900/30"
            >
              Sair do Painel
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS (Updated Design) */}
        <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center gap-3 overflow-x-auto">
           <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'dashboard' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-105 ring-2 ring-blue-500/50' 
                : 'bg-slate-900/50 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50'
            }`}
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
               <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
             </svg>
             Visão Geral
           </button>
           <button 
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'logs' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-105 ring-2 ring-blue-500/50' 
                : 'bg-slate-900/50 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50'
            }`}
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
               <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
             </svg>
             Registros (Logs)
           </button>
           <button 
            onClick={() => setActiveTab('employees')}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'employees' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-105 ring-2 ring-blue-500/50' 
                : 'bg-slate-900/50 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50'
            }`}
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
               <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
             </svg>
             Equipe & Salários
           </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
          <div className="max-w-7xl mx-auto">
            
            {/* -- DASHBOARD -- */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
                      <p className="text-slate-400 text-sm font-medium mb-1">Total de Registros</p>
                      <p className="text-3xl font-bold text-white">{logs.length}</p>
                   </div>
                   <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
                      <p className="text-slate-400 text-sm font-medium mb-1">Funcionários Ativos</p>
                      <p className="text-3xl font-bold text-blue-400">{employees.length - 2}</p>
                      <p className="text-xs text-slate-500 mt-1">Excluindo Admin/Teste</p>
                   </div>
                   <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
                      <p className="text-slate-400 text-sm font-medium mb-1">Verificação Facial</p>
                      <p className="text-3xl font-bold text-emerald-400">{logs.filter(l => l.isVerified).length}</p>
                      <p className="text-xs text-slate-500 mt-1">Sucessos Confirmados</p>
                   </div>
                   <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
                      <p className="text-slate-400 text-sm font-medium mb-1">Data</p>
                      <p className="text-xl font-bold text-white mt-1">{new Date().toLocaleDateString()}</p>
                   </div>
                </div>

                {/* Simple Activity Chart */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                  <h3 className="text-lg font-bold text-white mb-6">Atividade Recente (7 Dias)</h3>
                  <div className="flex items-end gap-4 h-48 w-full">
                    {activityData.map((d, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                         <div className="w-full relative h-full flex items-end">
                            <div 
                              className="w-full bg-blue-600/50 hover:bg-blue-500 rounded-t-lg transition-all relative group-hover:shadow-lg group-hover:shadow-blue-500/20"
                              style={{ height: `${(d.count / maxActivity) * 100}%` }}
                            >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity border border-slate-600">
                                {d.count}
                              </div>
                            </div>
                         </div>
                         <span className="text-xs text-slate-400 font-medium">{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* -- LOGS TAB -- */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                {/* Tools Bar */}
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                   
                   {/* Filter Groups */}
                   <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                     
                     {/* Search */}
                     <div className="relative flex-1 md:flex-none md:w-64">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 absolute left-3 top-2.5 text-slate-500">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                       </svg>
                       <input 
                         type="text" 
                         placeholder="Buscar nome ou ID..." 
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                       />
                     </div>

                     {/* Date Range */}
                     <div className="flex gap-2 flex-1 md:flex-none">
                       <input 
                         type="date"
                         title="Data Inicial"
                         value={startDate}
                         onChange={(e) => setStartDate(e.target.value)}
                         className="flex-1 md:w-36 bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                       />
                       <span className="self-center text-slate-500">-</span>
                       <input 
                         type="date"
                         title="Data Final"
                         value={endDate}
                         onChange={(e) => setEndDate(e.target.value)}
                         className="flex-1 md:w-36 bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                       />
                     </div>

                     {/* Verified Status */}
                     <div className="flex-1 md:flex-none">
                        <select 
                          value={filterVerified}
                          onChange={(e) => setFilterVerified(e.target.value as any)}
                          className="w-full md:w-40 bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        >
                          <option value="all">Todos Status</option>
                          <option value="verified">Verificados</option>
                          <option value="unverified">Não Verificados</option>
                        </select>
                     </div>

                   </div>

                   {/* Buttons & Feedback */}
                   <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
                     
                     {/* Visual Feedback for Filter/Reset */}
                     {filterFeedback && (
                       <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 text-emerald-400 text-xs font-bold rounded-lg animate-fade-in border border-emerald-500/20 whitespace-nowrap">
                          {filterFeedback === "Filtros Resetados" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                          {filterFeedback}
                       </div>
                     )}

                     {/* Export Button */}
                     <button 
                       onClick={downloadCSV}
                       className="flex-1 xl:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                       </svg>
                       <span className="hidden sm:inline">CSV</span>
                     </button>
                     
                     {/* Print Button */}
                     <button 
                        onClick={handlePrintFilteredLogs}
                        className="flex-1 xl:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                        title="Imprimir Relatório Visível"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008h-.008V10.5zm-3 0h.008v.008h-.008V10.5z" />
                        </svg>
                        <span className="hidden sm:inline">Imprimir</span>
                      </button>
                   </div>
                </div>

                {/* List */}
                <div className="grid gap-3">
                    {getFilteredLogs().length === 0 ? (
                       <div className="text-center py-12 text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                          <p className="mb-2">Nenhum registro encontrado.</p>
                          <button onClick={handleClearFilters} className="text-blue-400 hover:text-blue-300 text-sm underline">
                            Limpar Filtros
                          </button>
                       </div>
                    ) : (
                      getFilteredLogs().map((log) => (
                      <div key={log.id} className="group bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-700 hover:border-slate-500 transition-all flex flex-col sm:flex-row gap-4 items-center">
                        {/* Styled Image Container */}
                        <div className="relative w-14 h-14 bg-slate-900 rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-600 shadow-inner group-hover:border-blue-400 group-hover:shadow-[0_0_15px_rgba(96,165,250,0.6)] transition-all duration-300">
                          <img 
                            src={log.photoBase64} 
                            alt="Check-in" 
                            className="w-full h-full object-cover brightness-75 grayscale-[20%] group-hover:brightness-100 group-hover:grayscale-0 transition-all duration-300" 
                          />
                          {/* Dark overlay tint */}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
                        </div>
                        
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                            <h4 className="font-bold text-slate-100 truncate">{log.employeeName}</h4>
                            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-400 mt-1">
                               <span className="font-mono bg-slate-700 px-1.5 rounded">{log.employeeId}</span>
                               <span>{log.timestamp.toLocaleDateString()}</span>
                               <span>•</span>
                               <span>{log.timestamp.toLocaleTimeString()}</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                             {/* Status Badge */}
                             {!log.isVerified && (
                                <span className="px-2 py-1 rounded text-[10px] font-bold bg-red-900/30 text-red-400 border border-red-900/50 uppercase tracking-wide">
                                  Não Verificado
                                </span>
                             )}

                            <span className={`px-3 py-1 rounded-full text-xs font-bold w-20 text-center ${log.type === 'IN' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50' : 'bg-orange-900/30 text-orange-400 border border-orange-900/50'}`}>
                                {log.type === 'IN' ? 'ENTRADA' : 'SAÍDA'}
                            </span>
                             <button 
                                onClick={() => {
                                  setDeleteTarget({ type: 'log', id: log.id });
                                  setPasswordInput('');
                                }}
                                className="p-2 bg-slate-700 hover:bg-red-900/50 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                        </div>
                      </div>
                    )))}
                </div>
              </div>
            )}

            {/* -- EMPLOYEES TAB -- */}
            {activeTab === 'employees' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Form */}
                <div className="lg:col-span-1">
                  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 sticky top-4">
                    <h3 className="text-lg font-bold text-white mb-4">Adicionar Funcionário</h3>
                    <form onSubmit={handleRegisterEmployee} className="space-y-4">
                        <input 
                          type="text" 
                          placeholder="Nome Completo" 
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        />
                        <input 
                          type="text" 
                          placeholder="ID (Serial - 4 dígitos)" 
                          value={newId}
                          onChange={(e) => setNewId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                          maxLength={4}
                        />
                        <input 
                          type="text" 
                          placeholder="Cargo" 
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        />
                         {/* Added missing Hourly Rate field */}
                         <div>
                             <label className="text-xs text-slate-500 ml-1">Valor Hora (Regular)</label>
                             <input 
                              type="number" 
                              value={newHourlyRate}
                              onChange={(e) => setNewHourlyRate(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white outline-none"
                              required
                              step="0.01"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           <div>
                             <label className="text-xs text-slate-500 ml-1">Horas/Dia</label>
                             <input 
                              type="number" 
                              value={newDailyHours}
                              onChange={(e) => setNewDailyHours(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white outline-none"
                              required
                              step="0.5"
                            />
                           </div>
                           <div>
                             <label className="text-xs text-slate-500 ml-1">R$ Hora Extra</label>
                             <input 
                              type="number" 
                              value={newOvertimeRate}
                              onChange={(e) => setNewOvertimeRate(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white outline-none"
                              required
                              step="0.01"
                            />
                           </div>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3 font-bold transition-colors shadow-lg shadow-blue-900/20">
                          Cadastrar
                        </button>
                    </form>
                  </div>
                </div>

                {/* Right Column: List */}
                <div className="lg:col-span-2 space-y-4">
                  {employees.filter(e => e.id !== '9999').map((emp) => {
                     const stats = getEmployeeStats(emp.id, emp.overtimeRate, emp.dailyHours || 8);
                     return (
                      <div key={emp.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-500 transition-colors">
                        <div>
                           <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-lg">{emp.name}</h4>
                              <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded font-mono">{emp.id}</span>
                           </div>
                           <p className="text-slate-400 text-sm mb-1">{emp.role}</p>
                           <div className="flex gap-4 text-xs text-slate-500">
                              <span>H. Extra: <span className="text-slate-300">R$ {emp.overtimeRate.toFixed(2)}</span></span>
                              <span>Meta: <span className="text-slate-300">{emp.dailyHours}h</span></span>
                           </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                           <div className="text-right">
                              <span className="text-xs text-slate-400 block uppercase tracking-wider">A Pagar (Extras)</span>
                              <span className="text-xl font-bold text-emerald-400">R$ {stats.pay}</span>
                              <span className="text-xs text-slate-500 block">{stats.overtimeHours}h extras realizadas</span>
                           </div>
                           <div className="flex gap-2 mt-2 w-full sm:w-auto">
                              <button 
                                onClick={() => {
                                  setPrintData({ 
                                    title: "Relatório Individual", 
                                    subtitle: `Funcionário: ${emp.name} (${emp.id})`, 
                                    logs: logs.filter(l => l.employeeId === emp.id).sort((a,b)=>a.timestamp.getTime()-b.timestamp.getTime()) 
                                  });
                                  // useEffect handles print
                                }}
                                className="flex-1 sm:flex-none p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors" title="Imprimir"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008h-.008V10.5zm-3 0h.008v.008h-.008V10.5z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => setEditingEmployee(emp)}
                                className="flex-1 sm:flex-none p-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-900/50 rounded-lg transition-colors" title="Editar"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => {
                                  setDeleteTarget({ type: 'employee', id: emp.id });
                                  setPasswordInput('');
                                }}
                                className="flex-1 sm:flex-none p-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg transition-colors" title="Excluir"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                           </div>
                        </div>
                      </div>
                     );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL: EDIT EMPLOYEE */}
        {editingEmployee && (
           <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-md">
                 <h3 className="text-xl font-bold text-white mb-4">Editar Funcionário</h3>
                 <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-500 uppercase font-bold">Nome</label>
                      <input 
                        type="text" 
                        value={editingEmployee.name}
                        onChange={(e) => setEditingEmployee({...editingEmployee, name: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase font-bold">Cargo</label>
                      <input 
                        type="text" 
                        value={editingEmployee.role}
                        onChange={(e) => setEditingEmployee({...editingEmployee, role: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="text-xs text-slate-500 uppercase font-bold">Valor Hora Extra</label>
                         <input 
                          type="number" 
                          value={editingEmployee.overtimeRate}
                          onChange={(e) => setEditingEmployee({...editingEmployee, overtimeRate: parseFloat(e.target.value)})}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                          step="0.01"
                        />
                       </div>
                       <div>
                         <label className="text-xs text-slate-500 uppercase font-bold">Meta Diária (h)</label>
                         <input 
                          type="number" 
                          value={editingEmployee.dailyHours}
                          onChange={(e) => setEditingEmployee({...editingEmployee, dailyHours: parseFloat(e.target.value)})}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                          step="0.5"
                        />
                       </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button 
                        type="button" 
                        onClick={() => setEditingEmployee(null)}
                        className="flex-1 py-3 bg-slate-700 text-slate-200 rounded-lg font-bold"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20"
                      >
                        Salvar Alterações
                      </button>
                    </div>
                 </form>
              </div>
           </div>
        )}

        {/* MODAL: SUCCESS / WELCOME SCREEN */}
        {successScreenData && (
          <div className="absolute inset-0 bg-slate-900 z-[100] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
             <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/20 to-slate-900 pointer-events-none"></div>
             <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-2xl animate-bounce-short">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-10 h-10 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
             </div>
             <h2 className="text-2xl font-bold text-white mb-2">{successScreenData.title}</h2>
             <p className="text-slate-300 mb-8">{successScreenData.message}</p>
             <button onClick={() => setSuccessScreenData(null)} className="py-3 px-8 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold border border-slate-600">
                OK
             </button>
          </div>
        )}

        {/* MODAL: DELETE CONFIRMATION */}
        {deleteTarget && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-sm">
                <h3 className="text-xl font-bold text-white mb-2">Confirmar Ação</h3>
                <p className="text-slate-400 mb-6 text-sm">Digite sua senha para confirmar a exclusão.</p>
                <input 
                  type="password" 
                  placeholder="Senha"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 outline-none mb-4 text-center tracking-widest text-lg"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button onClick={() => { setDeleteTarget(null); setPasswordInput(''); }} className="flex-1 py-3 bg-slate-700 text-slate-200 rounded-lg font-bold">Cancelar</button>
                  <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold">Excluir</button>
                </div>
             </div>
          </div>
        )}

        {/* MODAL: SETTINGS */}
        {showSettingsModal && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-sm">
                <h3 className="text-xl font-bold text-white mb-4 text-center">Alterar Senha</h3>
                <form onSubmit={handleChangePin}>
                  <div className="space-y-4 mb-6">
                    <input type="password" placeholder="Senha Atual" value={currentPinInput} onChange={(e) => setCurrentPinInput(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white" required />
                    <input type="text" placeholder="Nova Senha (4 dígitos)" value={newPinInput} onChange={(e) => setNewPinInput(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white" required maxLength={4} pattern="\d*" />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowSettingsModal(false)} className="flex-1 py-3 bg-slate-700 text-slate-200 rounded-lg font-bold">Cancelar</button>
                    <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold">Salvar</button>
                  </div>
                </form>
             </div>
          </div>
        )}
      </div>

      {/* --- PRINT AREA --- */}
      <div id="print-area" className="hidden print:block">
        {printData && (
          <div className="font-sans text-black p-8">
            <h1 className="text-2xl font-bold mb-1">{COMPANY_NAME}</h1>
            <h2 className="text-lg font-bold mb-2">{printData.title}</h2>
            <p className="mb-4 text-sm text-gray-600">{printData.subtitle}</p>
            
            <table className="w-full text-left border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black p-2">Funcionário</th>
                  <th className="border border-black p-2">Data/Hora</th>
                  <th className="border border-black p-2">Tipo</th>
                  <th className="border border-black p-2">Status</th>
                  <th className="border border-black p-2">Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {printData.logs.map(log => (
                  <tr key={log.id}>
                    <td className="border border-black p-2">
                       {log.employeeName} <span className="text-gray-500">({log.employeeId})</span>
                    </td>
                    <td className="border border-black p-2">{log.timestamp.toLocaleString()}</td>
                    <td className="border border-black p-2">{log.type === 'IN' ? 'ENTRADA' : 'SAÍDA'}</td>
                    <td className="border border-black p-2">{log.isVerified ? 'OK' : 'NÃO VERIFICADO'}</td>
                    <td className="border border-black p-2">{log.verificationMessage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="mt-8 pt-4 border-t border-black text-xs text-center">
               Relatório gerado em {new Date().toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LogList;