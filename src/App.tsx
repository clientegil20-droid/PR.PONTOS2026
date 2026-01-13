import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppState, Employee, TimeLog } from './types';
import { MOCK_EMPLOYEES, COMPANY_NAME } from './constants';
import Keypad from './components/Keypad';
import CameraFeed from './components/CameraFeed';
import LogList from './components/LogList';
import { verifyCheckInImage } from './services/geminiService';
import { playSound } from './utils/sound';
import { supabase } from './services/supabase';

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const msg = location.state as { title: string; subtitle: string } | null;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#020617] text-white animate-fade-in relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="relative z-10 p-8 text-center max-w-2xl flex flex-col items-center animate-scale-in">
        <div className="mb-10 flex justify-center">
          <div className={`p-8 rounded-[2.5rem] shadow-2xl relative group ${msg ? 'bg-emerald-500/20 ring-4 ring-emerald-500/20' : 'bg-indigo-500/20 ring-4 ring-indigo-500/20'}`}>
            <div className="absolute inset-0 bg-white/5 rounded-[2.5rem] blur-xl group-hover:blur-2xl transition-all"></div>
            {msg ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-16 h-16 text-emerald-400 relative z-10 animate-bounce-short">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-16 h-16 text-indigo-400 relative z-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            )}
          </div>
        </div>

        <h1 className="text-5xl font-black mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-400">{COMPANY_NAME}</h1>
        <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-8"></div>

        {msg ? (
          <div className="mb-12 space-y-3">
            <h2 className="text-3xl font-extrabold text-emerald-400 tracking-tight">{msg.title}</h2>
            <p className="text-lg text-slate-400 font-medium">{msg.subtitle}</p>
          </div>
        ) : (
          <div className="mb-12">
            <p className="text-lg text-slate-400 font-medium">Sessão administrativa finalizada com segurança.</p>
          </div>
        )}

        <button
          onClick={() => {
            playSound('click');
            navigate('/');
          }}
          className="group relative px-12 py-5 bg-white text-slate-950 rounded-[2rem] font-black text-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-4 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6 group-hover:-translate-x-1 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Voltar ao Início
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [enteredId, setEnteredId] = useState('');

  // State variables
  const [adminPin, setAdminPin] = useState<string>('9999');
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [logs, setLogs] = useState<TimeLog[]>([]);

  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Load data from Supabase on init
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch PIN
        const savedPin = localStorage.getItem('gil_ponto_admin_pin') || '9999';
        setAdminPin(savedPin);

        // Fetch Employees
        const { data: empData, error: empError } = await supabase
          .from('employees')
          .select('*');

        if (empError) {
          console.error('Error fetching employees:', empError);
          setEmployees(MOCK_EMPLOYEES);
        } else if (empData && empData.length > 0) {
          setEmployees(empData.map(e => ({
            id: e.id,
            name: e.name,
            role: e.role,
            department: e.department || 'Geral',
            email: e.email,
            phone: e.phone,
            cpf: e.cpf,
            hireDate: e.hire_date,
            status: e.status || 'active',
            hourlyRate: e.hourly_rate,
            overtimeRate: e.overtime_rate,
            dailyHours: e.daily_hours,
            avatarUrl: e.avatar_url
          })));
        } else {
          setEmployees(MOCK_EMPLOYEES);
        }

        // Fetch Logs
        const { data: logData, error: logError } = await supabase
          .from('time_logs')
          .select('*')
          .order('timestamp', { ascending: true });

        if (logError) {
          console.error('Error fetching logs:', logError);
        } else if (logData) {
          setLogs(logData.map(l => ({
            id: l.id,
            employeeId: l.employee_id,
            employeeName: l.employee_name,
            timestamp: new Date(l.timestamp),
            type: l.type,
            photoBase64: l.photo_base64,
            verificationMessage: l.verification_message,
            isVerified: l.is_verified
          })));
        }
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sync PIN to local (sensitive, better kept local for now or in dedicated profile)
  useEffect(() => {
    localStorage.setItem('gil_ponto_admin_pin', adminPin);
  }, [adminPin]);

  // Clock updates
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Handlers ---

  const handleKeypadPress = (key: string) => {
    if (enteredId.length < 4) {
      setEnteredId(prev => prev + key);
    }
  };

  const handleKeypadClear = () => {
    setEnteredId('');
  };

  const handleIdSubmit = () => {
    // Admin Backdoor (Dynamic PIN) - Navigate to Admin Route
    if (enteredId === adminPin) {
      setEnteredId('');
      navigate('/admin');
      return;
    }

    // Lookup in state, not constants
    const employee = employees.find(e => e.id === enteredId);
    if (employee) {
      setCurrentEmployee(employee);
      setState(AppState.CAMERA);
      setEnteredId('');
    } else {
      playSound('cancel'); // Error sound
      alert("Funcionário não encontrado!");
      setEnteredId('');
    }
  };

  const handleCapture = async (imageSrc: string) => {
    if (!currentEmployee) return;
    setCapturedImage(imageSrc);
    setState(AppState.PROCESSING);

    // AI Verification
    const verification = await verifyCheckInImage(imageSrc, currentEmployee.name);

    // Determine type (Toggle based on last log for this user, simple logic for demo)
    const userLogs = logs.filter(l => l.employeeId === currentEmployee.id);
    const lastLog = userLogs[userLogs.length - 1];
    const type = lastLog && lastLog.type === 'IN' ? 'OUT' : 'IN';

    const newLog: TimeLog = {
      id: Date.now().toString(),
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      timestamp: new Date(),
      type: type,
      photoBase64: imageSrc,
      verificationMessage: verification.message,
      isVerified: verification.faceDetected
    };

    // Save to Supabase
    const { error: logError } = await supabase
      .from('time_logs')
      .insert([{
        id: newLog.id,
        employee_id: newLog.employeeId,
        employee_name: newLog.employeeName,
        timestamp: newLog.timestamp.toISOString(),
        type: newLog.type,
        photo_base64: newLog.photoBase64,
        verification_message: newLog.verificationMessage,
        is_verified: newLog.isVerified
      }]);

    if (logError) {
      console.error('Error saving log to Supabase:', logError);
    }

    setLogs(prev => [...prev, newLog]);

    // Success sound for completion
    playSound('success');

    const message = {
      title: type === 'IN' ? 'Bom trabalho!' : 'Até logo!',
      subtitle: verification.message || `Ponto de ${type === 'IN' ? 'entrada' : 'saída'} registrado com sucesso.`
    };

    // Reset internal state before navigating to Welcome screen
    resetFlow();

    navigate('/welcome', { state: message });
  };

  const handleAddEmployee = async (newEmployee: Employee) => {
    const { error } = await supabase
      .from('employees')
      .insert([{
        id: newEmployee.id,
        name: newEmployee.name,
        role: newEmployee.role,
        department: newEmployee.department,
        email: newEmployee.email,
        phone: newEmployee.phone,
        cpf: newEmployee.cpf,
        hire_date: newEmployee.hireDate,
        status: newEmployee.status,
        hourly_rate: newEmployee.hourlyRate,
        overtime_rate: newEmployee.overtimeRate,
        daily_hours: newEmployee.dailyHours,
        avatar_url: newEmployee.avatarUrl
      }]);

    if (error) {
      console.error('Error adding employee to Supabase:', error);
      alert(`Erro ao salvar no banco de dados remoto: ${error.message || JSON.stringify(error)}`);
      return;
    }
    setEmployees(prev => [...prev, newEmployee]);
  };

  const handleUpdateEmployee = async (updatedEmployee: Employee) => {
    const { error } = await supabase
      .from('employees')
      .update({
        name: updatedEmployee.name,
        role: updatedEmployee.role,
        department: updatedEmployee.department,
        email: updatedEmployee.email,
        phone: updatedEmployee.phone,
        cpf: updatedEmployee.cpf,
        hire_date: updatedEmployee.hireDate,
        status: updatedEmployee.status,
        hourly_rate: updatedEmployee.hourlyRate,
        overtime_rate: updatedEmployee.overtimeRate,
        daily_hours: updatedEmployee.dailyHours,
        avatar_url: updatedEmployee.avatarUrl
      })
      .eq('id', updatedEmployee.id);

    if (error) {
      console.error('Error updating employee in Supabase:', error);
      alert(`Erro ao atualizar no banco de dados remoto: ${error.message || JSON.stringify(error)}`);
      return;
    }
    setEmployees(prev => prev.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);

      if (error) {
        console.error('Error deleting employee from Supabase:', error);
        alert(`Erro ao excluir no banco de dados remoto: ${error.message || JSON.stringify(error)}`);
        return;
      }
      setEmployees(prev => prev.filter(e => e.id !== employeeId));
    } catch (err) {
      console.error('Network or unexpected error during employee deletion:', err);
      alert('Erro de conexão com o banco de dados. Verifique sua rede ou se o projeto Supabase está ativo. (Falha na requisição)');
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      const { error } = await supabase
        .from('time_logs')
        .delete()
        .eq('id', logId);

      if (error) {
        console.error('Error deleting log from Supabase:', error);
        alert(`Erro ao excluir registro no banco de dados remoto: ${error.message || JSON.stringify(error)}`);
        return;
      }
      setLogs(prev => prev.filter(l => l.id !== logId));
    } catch (err) {
      console.error('Network or unexpected error during log deletion:', err);
      alert('Erro de conexão com o banco de dados. Verifique sua rede ou se o projeto Supabase está ativo. (Falha na requisição)');
    }
  };

  const handleUpdateAdminPin = (newPin: string) => {
    setAdminPin(newPin);
  };

  const resetFlow = () => {
    setState(AppState.IDLE);
    setEnteredId('');
    setCurrentEmployee(null);
    setCapturedImage(null);
  };

  // --- Renders ---

  const renderIdle = () => (
    <div
      className="flex flex-col items-center justify-center h-full w-full bg-[#030712] text-white cursor-pointer relative overflow-hidden"
      onClick={() => {
        playSound('start');
        setState(AppState.ENTER_ID);
      }}
    >
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]"></div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center mb-32 group">
        <div className="mb-10 p-8 bg-white/[0.03] rounded-[2.5rem] backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:border-indigo-500/30">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full scale-75 animate-pulse"></div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-24 h-24 text-indigo-400 relative z-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-7xl font-black mb-2 tracking-tighter text-white font-outfit drop-shadow-2xl">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </h1>
          <p className="text-indigo-300/60 font-black uppercase tracking-[0.3em] text-[10px] bg-indigo-500/5 py-1 px-4 rounded-full border border-indigo-500/10 inline-block">
            {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(79,70,229,0.3)] animate-bounce active:scale-95 transition-all">
            Toque para Iniciar
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{COMPANY_NAME} &bull; SISTEMA DE PONTO</p>
        </div>
      </div>

      {/* Recent Activity Feed */}
      {logs.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-12 pt-20 bg-gradient-to-t from-[#030712] via-[#030712]/90 to-transparent">
          <div className="max-w-6xl mx-auto px-6">
            <h3 className="text-slate-500 text-[9px] uppercase tracking-[0.3em] font-black mb-6 flex items-center gap-3 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Atividade em Tempo Real
            </h3>
            <div className="flex gap-5 overflow-x-auto pb-4 px-2 scrollbar-hide">
              {logs.slice(-5).reverse().map((log) => (
                <div key={log.id} className="flex-shrink-0 glass-card p-4 rounded-[1.5rem] border border-white/5 flex items-center gap-4 shadow-xl hover:border-indigo-500/30 transition-all w-72 group/item">
                  <div className="relative">
                    <img src={log.photoBase64} alt="User" className="w-14 h-14 rounded-2xl object-cover border border-white/10 group-hover/item:border-indigo-500/50 transition-colors" />
                    <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-lg flex items-center justify-center border-4 border-[#030712] shadow-lg ${log.type === 'IN' ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                      {log.type === 'IN' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.5-9a.75.75 0 00-.75-.75H7.25a.75.75 0 000 1.5h5.5a.75.75 0 00.75-.75z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-white truncate group-hover/item:text-indigo-300 transition-colors">{log.employeeName}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${log.type === 'IN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                        {log.type === 'IN' ? 'Entrada' : 'Saída'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-black font-mono">{log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );


  const renderProcessing = () => (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#030712] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-500/10 blur-[150px] rounded-full animate-pulse"></div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-orbit {
          animation: orbit 10s linear infinite;
        }
      `}</style>

      <div className="relative mb-12 group">
        {/* Animated Rings */}
        <div className="absolute -inset-10 border border-indigo-500/20 rounded-full animate-orbit border-dashed"></div>
        <div className="absolute -inset-6 border border-blue-500/10 rounded-full animate-orbit border-dotted" style={{ animationDirection: 'reverse', animationDuration: '15s' }}></div>

        {/* Pulsing Aura */}
        <div className="absolute inset-0 rounded-[3rem] bg-indigo-500/20 blur-2xl animate-pulse"></div>

        {/* Image Container */}
        <div className="relative w-48 h-64 rounded-[3rem] overflow-hidden border-2 border-white/10 shadow-2xl z-10 bg-slate-900 group-hover:border-indigo-500/50 transition-colors duration-500">
          {capturedImage ? (
            <img src={capturedImage} alt="Processing" className="w-full h-full object-cover opacity-80 backdrop-grayscale" />
          ) : (
            <div className="w-full h-full bg-slate-800 animate-pulse"></div>
          )}

          {/* Biometric Grid Overlay */}
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

          {/* Scanning Beam */}
          <div className="absolute inset-0 w-full h-full animate-scan pointer-events-none">
            <div className="w-full h-1/2 bg-gradient-to-b from-transparent via-indigo-500/50 to-transparent border-b-2 border-indigo-400 shadow-[0_8px_20px_rgba(99,102,241,0.4)]"></div>
          </div>
        </div>
      </div>

      <div className="text-center relative z-10">
        <h2 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">Verificação Biométrica</h2>
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></span>
          <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></span>
        </div>

        <div className="px-6 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full inline-block backdrop-blur-md">
          <p className="text-indigo-300/80 font-black text-[10px] uppercase tracking-[0.2em]">Sincronizando com Servidor Seguro</p>
        </div>
      </div>
    </div>
  );


  if (isLoading) {
    return (
      <div className="h-full w-full bg-[#020617] flex flex-col items-center justify-center text-white relative overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full animate-pulse"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 relative mb-8">
            <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-xl font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500 animate-pulse">
            Sincronizando Sistema
          </p>
          <div className="mt-4 flex gap-1">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-900 overflow-hidden relative">
      <Routes>
        {/* Admin Route */}
        <Route path="/admin" element={
          <LogList
            logs={logs}
            employees={employees}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteLog={handleDeleteLog}
            onDeleteEmployee={handleDeleteEmployee}
            onClose={() => navigate('/welcome')}
            adminPin={adminPin}
            onUpdateAdminPin={handleUpdateAdminPin}
          />
        } />

        {/* Welcome / Success Route */}
        <Route path="/welcome" element={<WelcomeScreen />} />

        {/* Main Kiosk Flow */}
        <Route path="/" element={
          <>
            {state === AppState.IDLE && renderIdle()}

            {state === AppState.ENTER_ID && (
              <div className="h-full flex flex-col justify-center">
                <Keypad
                  value={enteredId}
                  onKeyPress={handleKeypadPress}
                  onClear={handleKeypadClear}
                  onSubmit={handleIdSubmit}
                  onBack={resetFlow}
                />
              </div>
            )}

            {state === AppState.CAMERA && currentEmployee && (
              <CameraFeed
                employeeName={currentEmployee.name}
                onCapture={handleCapture}
                onCancel={resetFlow}
              />
            )}

            {state === AppState.PROCESSING && renderProcessing()}
          </>
        } />
      </Routes>
    </div>
  );
};

export default App;