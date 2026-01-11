import { Employee } from './types';

export const MOCK_EMPLOYEES: Employee[] = [
  { id: '1234', name: 'João Silva', role: 'Desenvolvedor Senior', hourlyRate: 85.0, overtimeRate: 127.5, dailyHours: 8 },
  { id: '5678', name: 'Maria Souza', role: 'Gerente de Projetos', hourlyRate: 120.0, overtimeRate: 180.0, dailyHours: 8 },
  { id: '9999', name: 'Admin User', role: 'Administrador', hourlyRate: 0, overtimeRate: 0, dailyHours: 0 }, // Special ID for admin
  { id: '0000', name: 'Teste Visitante', role: 'Consultor', hourlyRate: 50.0, overtimeRate: 75.0, dailyHours: 6 }, // Part-time example
];

export const COMPANY_NAME = "Gil Ponto";