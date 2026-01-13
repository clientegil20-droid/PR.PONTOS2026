import { Employee } from './types';

export const MOCK_EMPLOYEES: Employee[] = [
  { id: '1234', name: 'João Silva', role: 'Desenvolvedor Senior', department: 'Tecnologia', status: 'active', hourlyRate: 85.0, overtimeRate: 127.5, dailyHours: 8 },
  { id: '5678', name: 'Maria Souza', role: 'Gerente de Projetos', department: 'Operações', status: 'active', hourlyRate: 120.0, overtimeRate: 180.0, dailyHours: 8 },
  { id: '9999', name: 'Admin User', role: 'Administrador', department: 'Diretoria', status: 'active', hourlyRate: 0, overtimeRate: 0, dailyHours: 0 },
  { id: '0000', name: 'Teste Visitante', role: 'Consultor', department: 'Comercial', status: 'active', hourlyRate: 50.0, overtimeRate: 75.0, dailyHours: 6 },
];

export const COMPANY_NAME = "Gil Ponto";