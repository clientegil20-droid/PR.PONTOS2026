import { Employee } from './types';

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: '1234',
    name: 'João Silva',
    role: 'Desenvolvedor Senior',
    department: 'Tecnologia',
    status: 'active',
    hourlyRate: 85.0,
    overtimeRate: 127.5,
    dailyHours: 8,
    baseSalary: 18700.00,
    workDays: [1, 2, 3, 4, 5] // Seg-Sex
  },
  {
    id: '5678',
    name: 'Maria Souza',
    role: 'Gerente de Projetos',
    department: 'Operações',
    status: 'active',
    hourlyRate: 120.0,
    overtimeRate: 180.0,
    dailyHours: 8,
    baseSalary: 26400.00,
    workDays: [1, 2, 3, 4, 5]
  },
  {
    id: '9999',
    name: 'Admin User',
    role: 'Administrador',
    department: 'Diretoria',
    status: 'active',
    hourlyRate: 0,
    overtimeRate: 0,
    dailyHours: 0,
    baseSalary: 0,
    workDays: [1, 2, 3, 4, 5]
  },
  {
    id: '0000',
    name: 'Teste Visitante',
    role: 'Consultor',
    department: 'Comercial',
    status: 'active',
    hourlyRate: 50.0,
    overtimeRate: 75.0,
    dailyHours: 6,
    baseSalary: 6600.00,
    workDays: [1, 3, 5] // Seg, Qua, Sex
  },
];

export const COMPANY_NAME = "Gil Ponto";