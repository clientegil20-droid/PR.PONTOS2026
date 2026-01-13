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
  const [newDepartment, setNewDepartment] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [newHireDate, setNewHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStatus, setNewStatus] = useState<'active' | 'inactive' | 'on_vacation'>('active');
  const [newHourlyRate, setNewHourlyRate] = useState('');
  const [newOvertimeRate, setNewOvertimeRate] = useState('');
  const [newDailyHours, setNewDailyHours] = useState('8');

  // -- EDIT EMPLOYEE STATE --
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // -- MISC STATES --
  const [printData, setPrintData] = useState<{ title: string, subtitle: string, logs: TimeLog[] } | null>(null);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [successScreenData, setSuccessScreenData] = useState<{ title: string, message: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'log' | 'employee', id: string } | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string>('');
  const [isDiagnosing, setIsDiagnosing] = useState(false);

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
    link.setAttribute("download", `pontos_${new Date().toISOString().slice(0, 10)}.csv`);
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
      department: newDepartment || 'Geral',
      email: newEmail,
      phone: newPhone,
      cpf: newCpf,
      hireDate: newHireDate,
      status: newStatus,
      hourlyRate: parseFloat(newHourlyRate),
      overtimeRate: parseFloat(newOvertimeRate),
      dailyHours: parseFloat(newDailyHours)
    };

    onAddEmployee(newEmp);
    // Reset Form
    setNewName('');
    setNewId('');
    setNewRole('');
    setNewDepartment('');
    setNewEmail('');
    setNewPhone('');
    setNewCpf('');
    setNewHireDate(new Date().toISOString().split('T')[0]);
    setNewStatus('active');
    setNewHourlyRate('');
    setNewOvertimeRate('');
    setNewDailyHours('8');

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
  const getEmployeeStats = (employeeId: string, hourlyRate: number, overtimeRate: number, dailyHoursLimit: number) => {
    const userLogs = logs.filter(l => l.employeeId === employeeId).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    let regularHours = 0;
    let overtimeHours = 0;
    const limitHours = dailyHoursLimit || 8;
    const WORK_DAY_LIMIT_MS = limitHours * 60 * 60 * 1000;

    for (let i = 0; i < userLogs.length; i++) {
      if (userLogs[i].type === 'IN') {
        if (i + 1 < userLogs.length && userLogs[i + 1].type === 'OUT') {
          const duration = userLogs[i + 1].timestamp.getTime() - userLogs[i].timestamp.getTime();
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
    const totalPayValue = (regularHours * hourlyRate) + (overtimeHours * overtimeRate);
    return {
      totalHours: (regularHours + overtimeHours).toFixed(2),
      regularHours: regularHours.toFixed(2),
      overtimeHours: overtimeHours.toFixed(2),
      pay: totalPayValue.toFixed(2)
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
      days.push({ day: d.toLocaleDateString('pt-BR', { weekday: 'short' }), count });
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

      <div className="w-full h-full flex flex-col bg-[#020617] overflow-hidden animate-fade-in print:hidden relative">
        {/* TOP BAR - SaaS Style */}
        <div className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/60 px-8 py-5 flex justify-between items-center z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Portal de Gestão RH</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest uppercase">Sistema de Ponto Inteligente</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700/50 hover:border-indigo-500/50"
              title="Configurações de Segurança"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </button>
            <button
              onClick={() => setShowDiagnostic(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-xl transition-all text-sm font-bold border border-amber-500/20"
            >
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              Diagnóstico
            </button>
            <div className="w-[1px] h-8 bg-slate-800 mx-2"></div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all text-sm font-bold shadow-lg shadow-red-500/20 active:scale-95"
            >
              Sair do Sistema
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS - Premium Style */}
        <div className="px-8 py-0 bg-slate-900/30 border-b border-slate-800/40 flex items-center gap-8 overflow-x-auto h-16">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`h-full px-2 relative font-bold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'dashboard'
              ? 'text-indigo-400'
              : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Visão Geral
            {activeTab === 'dashboard' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-full shadow-[0_-4px_10px_rgba(99,102,241,0.5)]"></div>}
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`h-full px-2 relative font-bold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'logs'
              ? 'text-indigo-400'
              : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            Auditoria de Ponto
            {activeTab === 'logs' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-full shadow-[0_-4px_10px_rgba(99,102,241,0.5)]"></div>}
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`h-full px-2 relative font-bold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'employees'
              ? 'text-indigo-400'
              : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            Gestão da Equipe
            {activeTab === 'employees' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-full shadow-[0_-4px_10px_rgba(99,102,241,0.5)]"></div>}
          </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
          <div className="max-w-7xl mx-auto">

            {/* -- DASHBOARD -- */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-slide-up">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="glass-card p-6 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-500">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Colaboradores</p>
                    <div className="flex items-end gap-2">
                      <p className="text-4xl font-extrabold text-white leading-none">{employees.filter(e => e.id !== '9999').length}</p>
                      <span className="text-emerald-400 text-xs font-bold mb-1 flex items-center gap-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.25a.75.75 0 011.08 0l5.25 5.25a.75.75 0 11-1.08 1.04l-3.96-3.908V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                        </svg>
                        Total
                      </span>
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-500">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Setores Ativos</p>
                    <div className="flex items-end gap-2">
                      <p className="text-4xl font-extrabold text-white leading-none">{new Set(employees.filter(e => e.id !== '9999').map(e => e.department)).size}</p>
                      <span className="text-indigo-400 text-xs font-bold mb-1 whitespace-nowrap">Estrutura Org.</span>
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Status: Ativos</p>
                    <div className="flex items-end gap-2">
                      <p className="text-4xl font-extrabold text-emerald-400 leading-none">{employees.filter(e => e.status === 'active' && e.id !== '9999').length}</p>
                      <span className="text-slate-500 text-xs font-bold mb-1">On-duty</span>
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all duration-500">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Calendário</p>
                    <div className="flex flex-col">
                      <p className="text-2xl font-extrabold text-white leading-none mb-1">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                </div>

                {/* Refined Activity Chart */}
                <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h3 className="text-xl font-extrabold text-white tracking-tight">Frequência Semanal</h3>
                      <p className="text-xs text-slate-500 font-medium">Histórico de acessos dos últimos 7 dias</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
                        Registros
                      </span>
                    </div>
                  </div>
                  <div className="flex items-end gap-6 h-56 w-full px-4">
                    {activityData.map((d, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-4 group cursor-default">
                        <div className="w-full relative h-full flex items-end justify-center">
                          <div
                            className="w-10 bg-gradient-to-t from-indigo-600/20 to-indigo-500 rounded-2xl transition-all duration-500 group-hover:from-indigo-500 group-hover:to-purple-500 relative group-hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] shadow-lg"
                            style={{ height: `${Math.max((d.count / maxActivity) * 100, 8)}%` }}
                          >
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-black py-1.5 px-3 rounded-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all shadow-2xl pointer-events-none">
                              {d.count}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest group-hover:text-indigo-400 transition-colors">{d.day}</span>
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
              <div className="flex flex-col lg:flex-row gap-8 h-full animate-slide-up">
                {/* LEFT: ADD EMPLOYEE FORM */}
                <div className="w-full lg:w-96 flex-shrink-0">
                  <div className="glass-card p-8 rounded-[2rem] border border-white/5 shadow-2xl sticky top-0">
                    <h3 className="text-xl font-extrabold text-white mb-6 flex items-center gap-2">
                      <span className="p-1.5 bg-indigo-500 rounded-lg text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                        </svg>
                      </span>
                      Novo Colaborador
                    </h3>
                    <form onSubmit={handleRegisterEmployee} className="space-y-4">
                      <div>
                        <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1 mb-1 block">Identificação</label>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="PIN"
                            value={newId}
                            onChange={(e) => setNewId(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-600 font-mono text-center"
                            required
                            maxLength={4}
                          />
                          <input
                            type="text"
                            placeholder="Nome Completo"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="col-span-2 w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-600"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1 mb-1 block">Setor</label>
                          <input
                            type="text"
                            placeholder="ex: Vendas"
                            value={newDepartment}
                            onChange={(e) => setNewDepartment(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1 mb-1 block">CPF</label>
                          <input
                            type="text"
                            placeholder="000.000..."
                            value={newCpf}
                            onChange={(e) => setNewCpf(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1 mb-1 block">Contato</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="email"
                            placeholder="E-mail"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-600"
                          />
                          <input
                            type="text"
                            placeholder="Telefone"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1 mb-1 block">Contratação</label>
                          <input
                            type="date"
                            value={newHireDate}
                            onChange={(e) => setNewHireDate(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-all font-medium text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1 mb-1 block">Status Inicial</label>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as any)}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-all text-xs font-bold"
                          >
                            <option value="active">Ativo</option>
                            <option value="inactive">Inativo</option>
                            <option value="on_vacation">Férias</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1 mb-3 block">Configuração Financeira</label>
                        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400 font-medium">Valor Hora Regular</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-600 font-bold">R$</span>
                              <input
                                type="number"
                                value={newHourlyRate}
                                onChange={(e) => setNewHourlyRate(e.target.value)}
                                className="w-20 bg-transparent text-right text-indigo-400 font-black outline-none"
                                placeholder="0.00"
                                step="0.01"
                                required
                              />
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400 font-medium">Extra (Adicional)</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-600 font-bold">R$</span>
                              <input
                                type="number"
                                value={newOvertimeRate}
                                onChange={(e) => setNewOvertimeRate(e.target.value)}
                                className="w-20 bg-transparent text-right text-purple-400 font-black outline-none"
                                placeholder="0.00"
                                step="0.01"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl px-4 py-4 font-black transition-all shadow-xl shadow-indigo-900/40 active:scale-95 text-sm uppercase tracking-widest mt-4">
                        Confirmar Cadastro
                      </button>
                    </form>
                  </div>
                </div>

                {/* RIGHT: EMPLOYEE LIST */}
                <div className="flex-1 space-y-4 overflow-y-auto pr-2 pb-10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-indigo-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      Quadro de Funcionários
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-3 py-1 rounded-full">{employees.filter(e => e.id !== '9999').length}</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {employees.filter(e => e.id !== '9999').map(emp => (
                      <div key={emp.id} className="glass-card p-6 rounded-[2rem] border border-white/5 hover:border-indigo-500/30 transition-all group relative overflow-hidden flex items-center gap-6">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full"></div>

                        <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-xl shadow-inner border border-white/5 relative z-10">
                          {emp.name.charAt(0)}
                        </div>

                        <div className="flex-1 relative z-10">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-black text-white text-lg tracking-tight truncate max-w-[150px]">{emp.name}</h4>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${emp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              emp.status === 'on_vacation' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                              }`}>
                              {emp.status === 'active' ? 'Ativo' : emp.status === 'on_vacation' ? 'Férias' : 'Inativo'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-y-1 gap-x-4 border-t border-white/5 pt-3">
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Remuneração</span>
                              <span className="text-xs text-white font-black">R$ {emp.hourlyRate?.toFixed(2) || '0.00'} <small className="text-[8px] text-slate-500 font-normal">/h</small></span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Carga Diária</span>
                              <span className="text-xs text-white font-black">{emp.dailyHours}h</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 relative z-10">
                          <button
                            onClick={() => setEditingEmployee(emp)}
                            className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-500 hover:text-white rounded-xl transition-all border border-indigo-500/20 active:scale-95 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                            title="Editar Dados"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget({ type: 'employee', id: emp.id });
                              setPasswordInput('');
                            }}
                            className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 active:scale-95"
                            title="Remover do Sistema"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: EDIT EMPLOYEE */}
            {
              editingEmployee && (
                <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                  <div className="glass-card p-8 rounded-[2.5rem] border border-white/10 shadow-2xl w-full max-w-md animate-slide-up relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>

                    <h3 className="text-xl font-extrabold text-white mb-6 flex items-center gap-2">
                      <span className="p-1.5 bg-indigo-500 rounded-lg text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                      </span>
                      Editar Colaborador
                    </h3>

                    <form onSubmit={handleEditSubmit} className="space-y-4">
                      <div>
                        <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1 mb-1 block">Nome Completo</label>
                        <input
                          type="text"
                          value={editingEmployee.name}
                          onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-600"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1 mb-1 block">Cargo</label>
                          <input
                            type="text"
                            value={editingEmployee.role}
                            onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1 mb-1 block">Setor</label>
                          <input
                            type="text"
                            value={editingEmployee.department}
                            onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1 mb-1 block">CPF</label>
                          <input
                            type="text"
                            value={editingEmployee.cpf || ''}
                            onChange={(e) => setEditingEmployee({ ...editingEmployee, cpf: e.target.value })}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1 mb-1 block">Status</label>
                          <select
                            value={editingEmployee.status}
                            onChange={(e) => setEditingEmployee({ ...editingEmployee, status: e.target.value as any })}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-indigo-500 transition-all outline-none font-bold text-xs"
                          >
                            <option value="active">Ativo</option>
                            <option value="inactive">Inativo</option>
                            <option value="on_vacation">Férias</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1 mb-3 block">Configuração Financeira</label>
                        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400 font-medium">Hora Regular</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-600 font-bold">R$</span>
                              <input
                                type="number"
                                value={editingEmployee.hourlyRate || 0}
                                onChange={(e) => setEditingEmployee({ ...editingEmployee, hourlyRate: parseFloat(e.target.value) })}
                                className="w-16 bg-transparent text-right text-indigo-400 font-black outline-none"
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400 font-medium">Hora Extra</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-600 font-bold">R$</span>
                              <input
                                type="number"
                                value={editingEmployee.overtimeRate}
                                onChange={(e) => setEditingEmployee({ ...editingEmployee, overtimeRate: parseFloat(e.target.value) })}
                                className="w-16 bg-transparent text-right text-purple-400 font-black outline-none"
                                step="0.01"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-8">
                        <button
                          type="button"
                          onClick={() => setEditingEmployee(null)}
                          className="flex-1 py-4 bg-slate-800/50 text-slate-400 hover:text-white rounded-2xl font-bold transition-all border border-slate-700/50 active:scale-95"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-indigo-900/40 active:scale-95 uppercase text-xs tracking-widest"
                        >
                          Salvar Alterações
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )
            }


            {/* MODAL: SUCCESS / WELCOME SCREEN */}
            {
              successScreenData && (
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
              )
            }

            {/* MODAL: DELETE CONFIRMATION */}
            {
              deleteTarget && (
                <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                  <div className="glass-card p-8 rounded-[2.5rem] border border-white/10 shadow-2xl w-full max-w-sm animate-slide-up text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8 text-red-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.731 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-extrabold text-white mb-2">Excluir Registro?</h3>
                    <p className="text-slate-400 mb-8 text-sm font-medium">Esta ação é permanente. Digite a senha administrativa para confirmar.</p>

                    <input
                      type="password"
                      placeholder="••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-4 text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none mb-6 text-center tracking-[1em] text-2xl font-black"
                      autoFocus
                    />

                    <div className="flex gap-3">
                      <button
                        onClick={() => { setDeleteTarget(null); setPasswordInput(''); }}
                        className="flex-1 py-4 bg-slate-800/50 text-slate-400 hover:text-white rounded-2xl font-bold border border-slate-700/50 transition-all active:scale-95"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={confirmDelete}
                        className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-red-900/40 active:scale-95 uppercase text-xs tracking-widest"
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                </div>
              )
            }


            {/* MODAL: SETTINGS */}
            {
              showSettingsModal && (
                <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                  <div className="glass-card p-8 rounded-[2.5rem] border border-white/10 shadow-2xl w-full max-w-sm animate-slide-up">
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8 text-indigo-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-extrabold text-white mb-6 text-center">Segurança Admin</h3>

                    <form onSubmit={handleChangePin}>
                      <div className="space-y-4 mb-8">
                        <div>
                          <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1 mb-1 block">Senha Atual</label>
                          <input
                            type="password"
                            placeholder="••••"
                            value={currentPinInput}
                            onChange={(e) => setCurrentPinInput(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-4 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-center tracking-[0.5em] font-black"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1 mb-1 block">Nova Senha</label>
                          <input
                            type="text"
                            placeholder="4 dígitos"
                            value={newPinInput}
                            onChange={(e) => setNewPinInput(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-4 text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none text-center tracking-[0.5em] font-black"
                            required
                            maxLength={4}
                            pattern="\d*"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowSettingsModal(false)}
                          className="flex-1 py-4 bg-slate-800/50 text-slate-400 hover:text-white rounded-2xl font-bold border border-slate-700/50 transition-all active:scale-95"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-indigo-900/40 active:scale-95 uppercase text-xs tracking-widest"
                        >
                          Salvar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )
            }

            {/* MODAL: DIAGNOSTIC */}
            {
              showDiagnostic && (
                <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                  <div className="glass-card p-8 rounded-[2.5rem] border border-white/10 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-slide-up overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-amber-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8l2.25-2.25m4.33-4.14c.16-.43.25-.89.25-1.37a6.75 6.75 0 10-13.5 0c0 .48.09.94.25 1.37m13 0c.96 2.5 1.25 5.23.25 7.74a5.25 5.25 0 01-10.5 0c-1-2.51-.71-5.24.25-7.74m13 0a10.5 10.5 0 11-20.5 0" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-extrabold text-white tracking-tight">Status da Infraestrutura</h3>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Diagnóstico de Rede Supabase</p>
                        </div>
                      </div>
                      <button onClick={() => { setShowDiagnostic(false); setDiagnosticResult(''); }} className="p-2 bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto mb-8 bg-slate-950/50 rounded-2xl p-6 font-mono text-xs text-indigo-300 space-y-3 border border-slate-800/50 shadow-inner">
                      {diagnosticResult ? (
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {diagnosticResult.split('\n').map((line, i) => (
                            <div key={i} className={`${line.includes('ERRO') ? 'text-rose-400' : line.includes('SUCESSO') ? 'text-emerald-400' : ''}`}>
                              {line}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 opacity-20">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                          </svg>
                          <p className="font-bold text-sm">Pronto para iniciar análise de conexão.</p>
                        </div>
                      )}
                      {isDiagnosing && (
                        <div className="flex items-center gap-3 text-indigo-400 font-bold animate-pulse py-4">
                          <svg className="animate-spin h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-xs uppercase tracking-[0.2em]">Executando Protocolos...</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={async () => {
                          setIsDiagnosing(true);
                          setDiagnosticResult(`[${new Date().toLocaleTimeString()}] Iniciando diagnóstico...\n`);
                          let log = (msg: string) => setDiagnosticResult(prev => prev + `[${new Date().toLocaleTimeString()}] ${msg}\n`);

                          try {
                            const url = (import.meta as any).env.VITE_SUPABASE_URL || '';
                            const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

                            log(`Config: URL=${url ? 'OK' : 'MISSING'}, Key=${key ? 'OK' : 'MISSING'}`);

                            if (!url) {
                              log(`ERRO: VITE_SUPABASE_URL não definida.`);
                              setIsDiagnosing(false);
                              return;
                            }

                            log(`Testando ping (Health Check): ${url}/rest/v1/`);
                            const start = Date.now();
                            try {
                              const res = await fetch(`${url}/rest/v1/`, {
                                method: 'GET',
                                headers: { 'apikey': key }
                              });
                              const end = Date.now();
                              log(`Resultado fetch: Status ${res.status} (${res.statusText}) em ${end - start}ms`);

                              if (res.ok) {
                                log(`SUCESSO: Conexão básica estabelecida.`);
                              } else {
                                log(`ALERTA: O servidor respondeu, mas com erro status ${res.status}. Verifique se a API Key é válida.`);
                              }
                            } catch (e) {
                              log(`ERRO CRÍTICO: Falha ao alcançar o servidor: ${String(e)}`);
                              log(`Sugestão: Verifique se o projeto não está pausado no painel da Supabase.`);
                            }

                            log(`Testando CORS (OPTIONS)...`);
                            try {
                              const res = await fetch(`${url}/rest/v1/employees`, {
                                method: 'OPTIONS',
                                headers: { 'apikey': key }
                              });
                              log(`OPTIONS response: ${res.status} ${res.statusText}`);
                            } catch (e) {
                              log(`ERRO CORS: Falha no preflight: ${String(e)}`);
                            }

                            log(`Diagnóstico concluído.`);
                          } catch (e) {
                            log(`ERRO NÃO TRATADO: ${String(e)}`);
                          } finally {
                            setIsDiagnosing(false);
                          }
                        }}
                        disabled={isDiagnosing}
                        className="flex-3 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-900/40 active:scale-95 disabled:opacity-50 uppercase text-xs tracking-widest"
                      >
                        {isDiagnosing ? 'Analisando...' : 'Iniciar Teste'}
                      </button>
                      <button
                        onClick={() => { setShowDiagnostic(false); setDiagnosticResult(''); }}
                        className="flex-1 px-6 py-4 bg-slate-800 text-slate-400 hover:text-white rounded-2xl font-bold border border-slate-700/50 transition-all active:scale-95"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              )
            }
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
          </div >
        </>
        );
};

        export default LogList;