import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Settings, BarChart3, Download, Calendar, FileText, Building2, RotateCcw, Trash, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Employee {
  id: number;
  email: string;
  permissao: 'admin' | 'mod' | 'advogado';
  equipe?: string;
  created_at: string;
  updated_at: string;
}

interface Team {
  id: number;
  nome: string;
  created_at: string;
  updated_at: string;
  membros: number;
}

interface Stats {
  funcionarios: {
    total: number;
    porPermissao: Array<{ permissao: string; count: number }>;
    porEquipe: Array<{ equipe: string; count: number }>;
  };
  protocolos: {
    total: number;
    porStatus: Array<{ status: string; count: number }>;
    porFila: Array<{ fila: string; count: number }>;
  };
}

interface CleanupPreview {
  total: number;
  peticionados: number;
  cancelados: number;
  devolvidos: number;
  maisAntigo: string;
  maisRecente: string;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'employees' | 'teams' | 'stats' | 'reports' | 'cleanup'>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [cleanupPreview, setCleanupPreview] = useState<CleanupPreview | null>(null);
  const [reportDates, setReportDates] = useState({
    dataInicio: '',
    dataFim: ''
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const [employeeForm, setEmployeeForm] = useState({
    email: '',
    senha: '',
    permissao: 'advogado' as 'admin' | 'mod' | 'advogado',
    equipe: ''
  });

  const [teamForm, setTeamForm] = useState({
    nome: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      
      if (activeTab === 'employees' || activeTab === 'stats') {
        const employeesResponse = await fetch(`${apiBaseUrl}/api/admin/funcionarios`, {
          credentials: 'include'
        });
        if (employeesResponse.ok) {
          const employeesData = await employeesResponse.json();
          setEmployees(employeesData.funcionarios || []);
        }
      }

      if (activeTab === 'teams' || activeTab === 'stats') {
        const teamsResponse = await fetch(`${apiBaseUrl}/api/admin/equipes`, {
          credentials: 'include'
        });
        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          setTeams(teamsData.equipes || []);
        }
      }

      if (activeTab === 'stats') {
        const statsResponse = await fetch(`${apiBaseUrl}/api/admin/stats`, {
          credentials: 'include'
        });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.stats);
        }
      }

      if (activeTab === 'cleanup') {
        const previewResponse = await fetch(`${apiBaseUrl}/api/admin/protocolos/finalizados/preview`, {
          credentials: 'include'
        });
        if (previewResponse.ok) {
          const previewData = await previewResponse.json();
          setCleanupPreview(previewData.preview);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(employeeForm)
      });

      if (response.ok) {
        setEmployeeForm({ email: '', senha: '', permissao: 'advogado', equipe: '' });
        setShowEmployeeModal(false);
        loadData();
      }
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios/${editingEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(employeeForm)
      });

      if (response.ok) {
        setEditingEmployee(null);
        setEmployeeForm({ email: '', senha: '', permissao: 'advogado', equipe: '' });
        setShowEmployeeModal(false);
        loadData();
      }
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este funcionário?')) return;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Erro ao deletar funcionário:', error);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/admin/equipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(teamForm)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Equipe criada com sucesso:', data.equipe);
        setTeamForm({ nome: '' });
        setShowTeamModal(false);
        loadData(); // Recarregar dados
      } else {
        console.error('❌ Erro ao criar equipe:', data.message);
        alert(data.message || 'Erro ao criar equipe');
      }
    } catch (error) {
      console.error('❌ Erro ao criar equipe:', error);
      alert('Erro de conexão ao criar equipe');
    }
  };

  const handleDeleteTeam = async (nome: string) => {
    if (!confirm(`Tem certeza que deseja deletar a equipe "${nome}"? Todos os funcionários desta equipe ficarão sem equipe.`)) return;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/admin/equipes/${encodeURIComponent(nome)}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Erro ao deletar equipe:', error);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportDates.dataInicio || !reportDates.dataFim) {
      alert('Por favor, selecione as datas de início e fim');
      return;
    }

    setIsGeneratingReport(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/admin/relatorio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(reportDates)
      });

      if (response.ok) {
        const data = await response.json();
        generateHTMLReport(data.relatorio);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const generateHTMLReport = (relatorio: any) => {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Protocolos - ${relatorio.periodo.inicio} a ${relatorio.periodo.fim}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; color: #2563eb; }
        .stat-label { color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .fatal { color: #dc2626; font-weight: bold; }
        .trabalhista { color: #7c3aed; font-weight: bold; }
        .distribuicao { color: #ea580c; font-weight: bold; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 0.9em; border-top: 1px solid #ccc; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Relatório de Protocolos Jurídicos</h1>
        <p><strong>Período:</strong> ${new Date(relatorio.periodo.inicio).toLocaleDateString('pt-BR')} a ${new Date(relatorio.periodo.fim).toLocaleDateString('pt-BR')}</p>
        <p><strong>Gerado em:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
    </div>

    <div class="section">
        <h2>📊 Resumo Geral</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${relatorio.resumo.totalProtocolos}</div>
                <div class="stat-label">Total de Protocolos</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #dc2626;">${relatorio.resumo.fatais}</div>
                <div class="stat-label">Protocolos Fatais</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #7c3aed;">${relatorio.resumo.trabalhistas}</div>
                <div class="stat-label">Processos Trabalhistas</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #059669;">${relatorio.resumo.civeis}</div>
                <div class="stat-label">Processos Cíveis</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #ea580c;">${relatorio.resumo.distribuicoes}</div>
                <div class="stat-label">Distribuições</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${relatorio.resumo.normais}</div>
                <div class="stat-label">Protocolos Normais</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>📈 Protocolos por Status</h2>
        <table>
            <thead>
                <tr>
                    <th>Status</th>
                    <th>Quantidade</th>
                    <th>Percentual</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(relatorio.detalhes.porStatus).map(([status, count]) => `
                    <tr>
                        <td>${status}</td>
                        <td>${count}</td>
                        <td>${((count / relatorio.resumo.totalProtocolos) * 100).toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>👥 Protocolos por Equipe</h2>
        <table>
            <thead>
                <tr>
                    <th>Equipe</th>
                    <th>Quantidade</th>
                    <th>Percentual</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(relatorio.detalhes.porEquipe).map(([equipe, count]) => `
                    <tr>
                        <td>${equipe}</td>
                        <td>${count}</td>
                        <td>${((count / relatorio.resumo.totalProtocolos) * 100).toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>🏛️ Protocolos por Tribunal</h2>
        <table>
            <thead>
                <tr>
                    <th>Tribunal</th>
                    <th>Quantidade</th>
                    <th>Percentual</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(relatorio.detalhes.porTribunal).map(([tribunal, count]) => `
                    <tr>
                        <td>${tribunal}</td>
                        <td>${count}</td>
                        <td>${((count / relatorio.resumo.totalProtocolos) * 100).toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>💻 Protocolos por Sistema</h2>
        <table>
            <thead>
                <tr>
                    <th>Sistema</th>
                    <th>Quantidade</th>
                    <th>Percentual</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(relatorio.detalhes.porSistema).map(([sistema, count]) => `
                    <tr>
                        <td>${sistema}</td>
                        <td>${count}</td>
                        <td>${((count / relatorio.resumo.totalProtocolos) * 100).toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>📋 Detalhes dos Protocolos</h2>
        <table>
            <thead>
                <tr>
                    <th>Número do Processo</th>
                    <th>Tribunal</th>
                    <th>Sistema</th>
                    <th>Tipo</th>
                    <th>Status</th>
                    <th>Criado por</th>
                    <th>Equipe</th>
                    <th>Data de Criação</th>
                </tr>
            </thead>
            <tbody>
                ${relatorio.protocolos.map(p => `
                    <tr>
                        <td>
                            ${p.processNumber || 'Distribuição'}
                            ${p.isFatal ? '<span class="fatal"> (FATAL)</span>' : ''}
                            ${p.isDistribution ? '<span class="distribuicao"> (DIST)</span>' : ''}
                        </td>
                        <td>${p.court || 'Não especificado'}</td>
                        <td>${p.system || 'Não especificado'}</td>
                        <td class="${p.processType === 'trabalhista' ? 'trabalhista' : ''}">${p.processType === 'civel' ? 'Cível' : 'Trabalhista'}</td>
                        <td>${p.status}</td>
                        <td>${p.createdByEmail || 'Não identificado'}</td>
                        <td>${p.createdByEquipe || 'Sem equipe'}</td>
                        <td>${new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Sistema de Protocolos Jurídicos - Relatório gerado automaticamente</p>
        <p>Total de ${relatorio.resumo.totalProtocolos} protocolos no período selecionado</p>
    </div>
</body>
</html>`;

    // Criar e baixar o arquivo HTML
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-protocolos-${relatorio.periodo.inicio}-${relatorio.periodo.fim}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleCleanupProtocols = async () => {
    if (!cleanupPreview || cleanupPreview.total === 0) {
      alert('Nenhum protocolo finalizado encontrado para limpeza');
      return;
    }

    const confirmMessage = `Tem certeza que deseja remover ${cleanupPreview.total} protocolos finalizados?\n\n` +
      `• ${cleanupPreview.peticionados} peticionados\n` +
      `• ${cleanupPreview.cancelados} cancelados\n` +
      `• ${cleanupPreview.devolvidos} devolvidos\n\n` +
      `Esta ação não pode ser desfeita!`;

    if (!confirm(confirmMessage)) return;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/admin/protocolos/finalizados`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Limpeza concluída!\n\nRemovidos: ${data.removidos.total} protocolos`);
        loadData(); // Atualizar preview
      }
    } catch (error) {
      console.error('Erro ao limpar protocolos:', error);
      alert('Erro ao limpar protocolos');
    }
  };

  const openEditEmployeeModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      email: employee.email,
      senha: '', // Não preencher senha por segurança
      permissao: employee.permissao,
      equipe: employee.equipe || ''
    });
    setShowEmployeeModal(true);
  };

  const openCreateEmployeeModal = () => {
    setEditingEmployee(null);
    setEmployeeForm({ email: '', senha: '', permissao: 'advogado', equipe: '' });
    setShowEmployeeModal(true);
  };

  const openCreateTeamModal = () => {
    setEditingTeam(null);
    setTeamForm({ nome: '' });
    setShowTeamModal(true);
  };

  if (user?.permissao !== 'admin') {
    return (
      <div className="text-center py-12">
        <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Restrito</h3>
        <p className="text-gray-600">Apenas administradores podem acessar esta seção.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Painel Administrativo</h2>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'employees', label: 'Funcionários', icon: Users },
            { id: 'teams', label: 'Equipes', icon: Building2 },
            { id: 'stats', label: 'Estatísticas', icon: BarChart3 },
            { id: 'reports', label: 'Relatórios', icon: FileText },
            { id: 'cleanup', label: 'Limpeza', icon: Trash }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'employees' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Gerenciar Funcionários</h3>
            <button
              onClick={openCreateEmployeeModal}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Funcionário
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permissão</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Criado em</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.permissao === 'admin' ? 'bg-red-100 text-red-800' :
                        employee.permissao === 'mod' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {employee.permissao}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.equipe || 'Sem equipe'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(employee.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openEditEmployeeModal(employee)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Gerenciar Equipes</h3>
            <button
              onClick={openCreateTeamModal}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Equipe
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome da Equipe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Membros</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Criada em</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teams.map((team) => (
                  <tr key={team.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.nome}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.membros}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(team.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteTeam(team.nome)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Estatísticas do Sistema</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.funcionarios.total}</div>
              <div className="text-sm text-blue-800">Total de Funcionários</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.protocolos.total}</div>
              <div className="text-sm text-green-800">Total de Protocolos</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.protocolos.porFila.reduce((acc, fila) => acc + fila.count, 0)}
              </div>
              <div className="text-sm text-yellow-800">Protocolos Aguardando</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{teams.length}</div>
              <div className="text-sm text-purple-800">Total de Equipes</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-medium text-gray-900 mb-3">Funcionários por Permissão</h4>
              {stats.funcionarios.porPermissao.map((item) => (
                <div key={item.permissao} className="flex justify-between py-1">
                  <span className="capitalize">{item.permissao}</span>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-medium text-gray-900 mb-3">Protocolos por Status</h4>
              {stats.protocolos.porStatus.map((item) => (
                <div key={item.status} className="flex justify-between py-1">
                  <span>{item.status}</span>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Gerar Relatórios</h3>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h4 className="font-medium text-gray-900 mb-4">Relatório por Período</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={reportDates.dataInicio}
                  onChange={(e) => setReportDates(prev => ({ ...prev, dataInicio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Fim
                </label>
                <input
                  type="date"
                  value={reportDates.dataFim}
                  onChange={(e) => setReportDates(prev => ({ ...prev, dataFim: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport || !reportDates.dataInicio || !reportDates.dataFim}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingReport ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Gerar Relatório HTML
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>O relatório incluirá:</strong> Total de protocolos, fatais, trabalhistas, cíveis, distribuições, 
                estatísticas por equipe, tribunal e sistema, além de uma lista detalhada de todos os protocolos do período.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cleanup' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Limpeza de Protocolos</h3>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-start space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Remover Protocolos Finalizados</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Remove protocolos com status "Peticionado", "Cancelado" e "Devolvido" do banco de dados.
                  Esta ação é irreversível!
                </p>
              </div>
            </div>

            {cleanupPreview && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h5 className="font-medium text-gray-900 mb-2">Preview da Limpeza:</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <span className="ml-2 font-medium">{cleanupPreview.total}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Peticionados:</span>
                    <span className="ml-2 font-medium text-green-600">{cleanupPreview.peticionados}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cancelados:</span>
                    <span className="ml-2 font-medium text-red-600">{cleanupPreview.cancelados}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Devolvidos:</span>
                    <span className="ml-2 font-medium text-orange-600">{cleanupPreview.devolvidos}</span>
                  </div>
                </div>
                
                {cleanupPreview.total > 0 && (
                  <div className="mt-3 text-xs text-gray-500">
                    <p>Período: {new Date(cleanupPreview.maisAntigo).toLocaleDateString('pt-BR')} a {new Date(cleanupPreview.maisRecente).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleCleanupProtocols}
              disabled={!cleanupPreview || cleanupPreview.total === 0}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash className="h-4 w-4 mr-2" />
              {cleanupPreview && cleanupPreview.total > 0 
                ? `Remover ${cleanupPreview.total} Protocolos Finalizados`
                : 'Nenhum Protocolo para Remover'
              }
            </button>
          </div>
        </div>
      )}

      {/* Modal de Funcionário */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
            </h3>
            
            <form onSubmit={editingEmployee ? handleUpdateEmployee : handleCreateEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha {editingEmployee && '(deixe vazio para manter atual)'}
                </label>
                <input
                  type="password"
                  value={employeeForm.senha}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, senha: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!editingEmployee}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permissão</label>
                <select
                  value={employeeForm.permissao}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, permissao: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="advogado">Advogado</option>
                  <option value="mod">Moderador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipe</label>
                <select
                  value={employeeForm.equipe}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, equipe: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sem equipe</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.nome}>{team.nome}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  {editingEmployee ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Equipe */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nova Equipe</h3>
            
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Equipe</label>
                <input
                  type="text"
                  value={teamForm.nome}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Equipe Alpha"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                >
                  Criar Equipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}