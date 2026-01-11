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
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900 text-white animate-fade-in relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black opacity-80"></div>

      <div className="relative z-10 p-8 text-center max-w-2xl flex flex-col items-center">
        <div className="mb-8 flex justify-center">
          <div className="p-6 bg-blue-600 rounded-full shadow-lg shadow-blue-500/30">
            {msg ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            )}
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-6 tracking-tight">{COMPANY_NAME}</h1>

        {msg ? (
          <div className="mb-12 animate-fade-in">
            <h2 className="text-3xl font-semibold text-emerald-400 mb-3">{msg.title}</h2>
            <p className="text-xl text-slate-300">{msg.subtitle}</p>
          </div>
        ) : (
          <div className="mb-12">
            <p className="text-xl text-slate-400">Sistema administrativo encerrado.</p>
          </div>
        )}

        <button
          onClick={() => {
            playSound('click');
            navigate('/');
          }}
          className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all shadow-xl active:scale-95 flex items-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
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

      setIsLoading(false);
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
        hourly_rate: newEmployee.hourlyRate,
        overtime_rate: newEmployee.overtimeRate,
        daily_hours: newEmployee.dailyHours,
        avatar_url: newEmployee.avatarUrl
      }]);

    if (error) {
      console.error('Error adding employee to Supabase:', error);
      alert('Erro ao salvar no banco de dados remoto.');
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
        hourly_rate: updatedEmployee.hourlyRate,
        overtime_rate: updatedEmployee.overtimeRate,
        daily_hours: updatedEmployee.dailyHours,
        avatar_url: updatedEmployee.avatarUrl
      })
      .eq('id', updatedEmployee.id);

    if (error) {
      console.error('Error updating employee in Supabase:', error);
      alert('Erro ao atualizar no banco de dados remoto.');
      return;
    }
    setEmployees(prev => prev.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId);

    if (error) {
      console.error('Error deleting employee from Supabase:', error);
      alert('Erro ao excluir no banco de dados remoto.');
      return;
    }
    setEmployees(prev => prev.filter(e => e.id !== employeeId));
  };

  const handleDeleteLog = async (logId: string) => {
    const { error } = await supabase
      .from('time_logs')
      .delete()
      .eq('id', logId);

    if (error) {
      console.error('Error deleting log from Supabase:', error);
      alert('Erro ao excluir registro no banco de dados remoto.');
      return;
    }
    setLogs(prev => prev.filter(l => l.id !== logId));
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
      className="flex flex-col items-center justify-center h-full w-full bg-slate-900 text-white cursor-pointer relative overflow-hidden"
      onClick={() => {
        playSound('start');
        setState(AppState.ENTER_ID);
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-900 opacity-80"></div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center mb-32">
        <div className="mb-8 p-6 bg-white/5 rounded-full backdrop-blur-md animate-pulse border border-white/10">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-20 h-20 text-blue-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-5xl font-bold mb-2 tracking-tight text-white font-mono">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h1>
        <p className="text-xl text-slate-300 mb-12 capitalize">{currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2 text-white">{COMPANY_NAME}</h2>
          <p className="text-blue-300/80 animate-bounce">Toque na tela para bater o ponto</p>
        </div>
      </div>

      {/* Recent Activity Feed */}
      {logs.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-8 pt-12 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent">
          <div className="max-w-6xl mx-auto px-6">
            <h3 className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-4 ml-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Últimas Atividades
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide mask-fade-right">
              {logs.slice(-5).reverse().map((log) => (
                <div key={log.id} className="flex-shrink-0 bg-slate-800/60 backdrop-blur-md p-3 rounded-xl border border-slate-700/50 flex items-center gap-3 shadow-lg hover:bg-slate-800/80 transition-colors w-64">
                  <div className="relative">
                    <img src={log.photoBase64} alt="User" className="w-12 h-12 rounded-full object-cover border-2 border-slate-600" />
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-800 ${log.type === 'IN' ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                      {log.type === 'IN' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.5-9a.75.75 0 00-.75-.75H7.25a.75.75 0 000 1.5h5.5a.75.75 0 00.75-.75z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{log.employeeName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold px-1.5 rounded-md tracking-wide ${log.type === 'IN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                        {log.type === 'IN' ? 'ENTROU' : 'SAIU'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900">
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scan 1.5s linear infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-reverse {
          animation: spin-reverse 6s linear infinite;
        }
      `}</style>
      <div className="relative mb-10">
        {/* Rotating Outer Rings */}
        <div className="absolute -inset-4 border border-blue-500/30 rounded-full animate-spin-slow pointer-events-none border-dashed"></div>
        <div className="absolute -inset-2 border border-indigo-500/30 rounded-full animate-spin-reverse pointer-events-none border-dotted"></div>

        {/* Pulsing effect behind the image */}
        <div className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-ping"></div>

        {/* User image container */}
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-slate-700 shadow-2xl z-10 bg-slate-800">
          {capturedImage ? (
            <img src={capturedImage} alt="Processing" className="w-full h-full object-cover opacity-90" />
          ) : (
            <div className="w-full h-full bg-slate-800"></div>
          )}

          {/* Grid Overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0ibm9uZSIvPjwvc3ZnPg==')] opacity-20 mix-blend-overlay"></div>

          {/* Scanning Line Animation */}
          <div className="absolute inset-0 w-full h-full animate-scan pointer-events-none">
            <div className="w-full h-2/3 bg-gradient-to-b from-transparent via-blue-500/40 to-transparent border-b-2 border-blue-400/80 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-4 animate-pulse">Verificando Biometria...</h2>

      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-slate-400 font-medium text-sm">Analisando traços faciais</p>
        <p className="text-slate-500 text-xs">Aguarde um momento</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="h-full w-full bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-medium animate-pulse">Sincronizando com Supabase...</p>
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