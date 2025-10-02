import React, { useState, useEffect } from 'react';
import { AlertTriangle, BarChart3, FileText, Users, Trash } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProtocols } from '../hooks/useProtocols';
import { EmployeesTab } from './admin/EmployeesTab';
import { TeamsTab } from './admin/TeamsTab';
import { ReportsTab } from './admin/ReportsTab';
import { CleanupTab } from './admin/CleanupTab';

interface Employee {
  id: number;
  email: string;
  permissao: 'admin' | 'mod' | 'advogado';
  equipe?: string;
  created_at: string;
  updated_at: string;
}

interface Team {
  nome: string;
  membros: number;
}

interface AdminStats {
  funcionarios: {
    total: number;
    porPermissao: Array<{ permissao: string; count: number }>;
  };
  protocolos: {
    total: number;
    porStatus: Array<{ status: string; count: number }>;
    porFila: Array<{ fila: string; count: number }>;
  };
}

type AdminTab = 'employees' | 'teams' | 'reports' | 'cleanup';

export function AdminDashboard() {
  const { user } = useAuth();
  const { protocols } = useProtocols();
  const [activeTab, setActiveTab] = useState<AdminTab>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (user?.permissao !== 'admin' && user?.permissao !== 'mod') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Negado</h3>
        <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
      </div>
    );
  }

  const apiBaseUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    loadEmployees();
    loadTeams();
    loadStats();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setEmployees(data.funcionarios);
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  };

  const loadTeams = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/equipes`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setTeams(data.equipes);
      }
    } catch (error) {
      console.error('Erro ao carregar equipes:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/stats`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleAddEmployee = async (employee: any) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(employee)
      });

      const data = await response.json();
      if (data.success) {
        await loadEmployees();
        await loadTeams();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
      alert('Erro ao criar funcionário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmployee = async (employee: Employee) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(employee)
      });

      const data = await response.json();
      if (data.success) {
        await loadEmployees();
        await loadTeams();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      alert('Erro ao atualizar funcionário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este funcionário?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        await loadEmployees();
        await loadTeams();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Erro ao deletar funcionário:', error);
      alert('Erro ao deletar funcionário');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'employees' as AdminTab, label: 'Funcionários', icon: Users },
    { id: 'teams' as AdminTab, label: 'Equipes', icon: Users },
    { id: 'reports' as AdminTab, label: 'Relatórios', icon: BarChart3 },
    { id: 'cleanup' as AdminTab, label: 'Limpeza', icon: Trash },
  ];

  const getTabColor = (isActive: boolean) => {
    return isActive
      ? 'border-blue-600 text-blue-600 bg-blue-50'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Painel Administrativo</h2>
        <p className="text-gray-600 mt-1">Gerencie funcionários, equipes e relatórios</p>
      </div>

      {stats && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Estatísticas Gerais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.funcionarios.total}</div>
              <div className="text-sm text-blue-800">Funcionários</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.protocolos.total}</div>
              <div className="text-sm text-green-800">Protocolos</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.protocolos.porStatus.find(s => s.status === 'Aguardando')?.count || 0}
              </div>
              <div className="text-sm text-yellow-800">Aguardando</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{teams.length}</div>
              <div className="text-sm text-purple-800">Equipes</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${getTabColor(isActive)}`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          {activeTab === 'employees' && (
            <EmployeesTab
              employees={employees}
              teams={teams}
              isLoading={isLoading}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          )}

          {activeTab === 'teams' && <TeamsTab />}

          {activeTab === 'reports' && <ReportsTab />}

          {activeTab === 'cleanup' && <CleanupTab />}
        </div>
      </div>
    </div>
  );
}
