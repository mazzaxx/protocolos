import React, { useState, useEffect } from 'react';
import { Users, Plus, CreditCard as Edit, Trash2, Save, X, BarChart3, Download, FileText, AlertTriangle, Trash, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProtocols } from '../hooks/useProtocols';

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
  const { protocols } = useProtocols();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [cleanupPreview, setCleanupPreview] = useState<CleanupPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    email: '',
    senha: '',
    permissao: 'advogado' as 'admin' | 'mod' | 'advogado',
    equipe: ''
  });
  const [newTeam, setNewTeam] = useState({ nome: '' });
  const [selectedCleanupCategories, setSelectedCleanupCategories] = useState<string[]>(['Peticionado', 'Cancelado']);

  // Verificar permissões
  if (user?.permissao !== 'admin' && user?.permissao !== 'mod') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Negado</h3>
        <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
      </div>
    );
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

  // Carregar dados iniciais
  useEffect(() => {
    loadEmployees();
    loadTeams();
    loadStats();
    loadCleanupPreview();
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

  const loadCleanupPreview = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/protocolos/finalizados/preview`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setCleanupPreview(data.preview);
      }
    } catch (error) {
      console.error('Erro ao carregar preview de limpeza:', error);
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.email || !newEmployee.senha) {
      alert('Email e senha são obrigatórios');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newEmployee)
      });
      
      const data = await response.json();
      if (data.success) {
        await loadEmployees();
        await loadTeams(); // Recarregar equipes após adicionar funcionário
        setNewEmployee({ email: '', senha: '', permissao: 'advogado', equipe: '' });
        setShowAddEmployee(false);
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

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios/${editingEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editingEmployee)
      });
      
      const data = await response.json();
      if (data.success) {
        await loadEmployees();
        await loadTeams(); // Recarregar equipes após atualizar funcionário
        setEditingEmployee(null);
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
        await loadTeams(); // Recarregar equipes após deletar funcionário
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

  const handleAddTeam = async () => {
    if (!newTeam.nome.trim()) {
      alert('Nome da equipe é obrigatório');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/equipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newTeam)
      });
      
      const data = await response.json();
      if (data.success) {
        await loadTeams();
        setNewTeam({ nome: '' });
        setShowAddTeam(false);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Erro ao criar equipe:', error);
      alert('Erro ao criar equipe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeam = async (nome: string) => {
    if (!confirm(`Tem certeza que deseja deletar a equipe "${nome}"? Todos os funcionários desta equipe ficarão sem equipe.`)) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/equipes/${encodeURIComponent(nome)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      if (data.success) {
        await loadTeams();
        await loadEmployees(); // Recarregar funcionários após deletar equipe
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Erro ao deletar equipe:', error);
      alert('Erro ao deletar equipe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanupProtocols = async () => {
    if (selectedCleanupCategories.length === 0) {
      alert('Selecione pelo menos uma categoria para limpeza');
      return;
    }

    const categoriesText = selectedCleanupCategories.join(', ');
    if (!confirm(`Tem certeza que deseja excluir PERMANENTEMENTE todos os protocolos das categorias: ${categoriesText}?\n\nEsta ação não pode ser desfeita!`)) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/protocolos/finalizados`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ categories: selectedCleanupCategories })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`Limpeza concluída! ${data.removidos.total} protocolos foram removidos.`);
        await loadStats();
        await loadCleanupPreview();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Erro na limpeza:', error);
      alert('Erro na limpeza de protocolos');
    } finally {
      setIsLoading(false);
    }
  };

  const generateHTMLReport = () => {
    // Calcular estatísticas por tipo de processo (Pasta)
    const civelProtocols = protocols.filter(p => p.processType === 'civel');
    const trabalhistaProtocols = protocols.filter(p => p.processType === 'trabalhista');

    const civelFatais = civelProtocols.filter(p => p.isFatal).length;
    const trabalhistaFatais = trabalhistaProtocols.filter(p => p.isFatal).length;

    const civelPercentual = civelProtocols.length > 0 ? ((civelFatais / civelProtocols.length) * 100) : 0;
    const trabalhistaPercentual = trabalhistaProtocols.length > 0 ? ((trabalhistaFatais / trabalhistaProtocols.length) * 100) : 0;

    // Calcular estatísticas por equipe
    const teamStats = teams.map(team => {
      const teamProtocols = protocols.filter(p => {
        const creator = employees.find(e => e.id === p.createdBy);
        return creator?.equipe === team.nome;
      });

      const totalProtocols = teamProtocols.length;
      const fatalProtocols = teamProtocols.filter(p => p.isFatal).length;
      const percentualFatal = totalProtocols > 0 ? ((fatalProtocols / totalProtocols) * 100) : 0;

      return {
        nome: team.nome,
        total: totalProtocols,
        fatais: fatalProtocols,
        percentualFatal: percentualFatal
      };
    });

    // Total geral
    const totalProtocols = protocols.length;
    const totalFatais = protocols.filter(p => p.isFatal).length;
    const totalPercentual = totalProtocols > 0 ? ((totalFatais / totalProtocols) * 100) : 0;

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Protocolos Fatais - ${new Date().toLocaleDateString('pt-BR')}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
            padding: 40px 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2rem;
            margin-bottom: 8px;
            font-weight: 700;
        }

        .header p {
            font-size: 1rem;
            opacity: 0.95;
        }

        .content {
            padding: 40px 30px;
        }

        .section {
            margin-bottom: 50px;
        }

        .section:last-of-type {
            margin-bottom: 0;
        }

        .section-title {
            font-size: 1.3rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 3px solid #2563eb;
            display: flex;
            align-items: center;
        }

        .section-title::before {
            content: '';
            display: inline-block;
            width: 6px;
            height: 24px;
            background: #2563eb;
            margin-right: 12px;
            border-radius: 3px;
        }

        .table-container {
            overflow-x: auto;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
        }

        th {
            background: #f8fafc;
            color: #1f2937;
            font-weight: 700;
            padding: 16px 20px;
            text-align: left;
            border-bottom: 2px solid #e5e7eb;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        td {
            padding: 14px 20px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 0.95rem;
        }

        tr:hover {
            background: #f8fafc;
        }

        tr:last-child td {
            border-bottom: none;
        }

        .total-row {
            background: #eff6ff !important;
            font-weight: 700;
        }

        .total-row:hover {
            background: #dbeafe !important;
        }

        .footer {
            background: #f8f9fa;
            padding: 24px 30px;
            text-align: center;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            font-size: 0.9rem;
        }

        .footer p {
            margin: 4px 0;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
                max-width: 100%;
            }
        }

        @media (max-width: 768px) {
            body {
                padding: 20px 10px;
            }
            .header {
                padding: 30px 20px;
            }
            .content {
                padding: 30px 20px;
            }
            th, td {
                padding: 12px 16px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Relatório de Protocolos Fatais</h1>
            <p>Análise de Prazos Fatais por Pasta e Equipe</p>
            <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>

        <div class="content">
            <!-- Análise por Pasta -->
            <div class="section">
                <h2 class="section-title">Pasta</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Pasta</th>
                                <th>Total</th>
                                <th>Fatais</th>
                                <th>% Fatal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Cível</strong></td>
                                <td>${civelProtocols.length}</td>
                                <td>${civelFatais}</td>
                                <td>${civelPercentual.toFixed(0)}%</td>
                            </tr>
                            <tr>
                                <td><strong>Trabalhista</strong></td>
                                <td>${trabalhistaProtocols.length}</td>
                                <td>${trabalhistaFatais}</td>
                                <td>${trabalhistaPercentual.toFixed(0)}%</td>
                            </tr>
                            <tr class="total-row">
                                <td><strong>Total Geral</strong></td>
                                <td>${totalProtocols}</td>
                                <td>${totalFatais}</td>
                                <td>${totalPercentual.toFixed(0)}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Análise por Equipe -->
            <div class="section">
                <h2 class="section-title">Equipes</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Equipe</th>
                                <th>Total</th>
                                <th>Fatais</th>
                                <th>% Fatal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${teamStats.map(team => `
                                <tr>
                                    <td><strong>${team.nome}</strong></td>
                                    <td>${team.total}</td>
                                    <td>${team.fatais}</td>
                                    <td>${team.percentualFatal.toFixed(0)}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="footer">
            <p><strong>Relatório de Protocolos Fatais</strong></p>
            <p>Total de ${totalProtocols} protocolos analisados</p>
            <p>${teams.length} equipes registradas</p>
        </div>
    </div>
</body>
</html>`;

    // Criar e baixar o arquivo
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-protocolos-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCleanupCategoryChange = (category: string) => {
    setSelectedCleanupCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Painel Administrativo</h2>
        <button
          onClick={generateHTMLReport}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Gerar Relatório HTML
        </button>
      </div>

      {/* Estatísticas Gerais */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-6">
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

      {/* Gerenciamento de Equipes */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Gerenciamento de Equipes
          </h3>
          <button
            onClick={() => setShowAddTeam(true)}
            className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Equipe
          </button>
        </div>

        {teams.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhuma equipe cadastrada</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome da Equipe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Membros</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teams.map((team) => (
                  <tr key={team.nome}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {team.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {team.membros} funcionário{team.membros !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteTeam(team.nome)}
                        className="text-red-600 hover:text-red-900 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Adicionar Equipe */}
        {showAddTeam && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Adicionar Nova Equipe</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Equipe</label>
                    <input
                      type="text"
                      value={newTeam.nome}
                      onChange={(e) => setNewTeam({ nome: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: Equipe Alpha"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddTeam(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddTeam}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50"
                  >
                    {isLoading ? 'Criando...' : 'Criar Equipe'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gerenciamento de Funcionários */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Gerenciamento de Funcionários
          </h3>
          <button
            onClick={() => setShowAddEmployee(true)}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo Funcionário
          </button>
        </div>

        <div className="overflow-x-auto">
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
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employee.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      employee.permissao === 'admin' ? 'bg-red-100 text-red-800' :
                      employee.permissao === 'mod' ? 'bg-purple-100 text-purple-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {employee.permissao}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.equipe || 'Sem equipe'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(employee.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setEditingEmployee(employee)}
                      className="text-indigo-600 hover:text-indigo-900 mr-2"
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

        {/* Modal Adicionar Funcionário */}
        {showAddEmployee && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Adicionar Novo Funcionário</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                    <input
                      type="password"
                      value={newEmployee.senha}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, senha: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Permissão</label>
                    <select
                      value={newEmployee.permissao}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, permissao: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="advogado">Advogado</option>
                      <option value="mod">Moderador</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Equipe (opcional)</label>
                    <select
                      value={newEmployee.equipe}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, equipe: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sem equipe</option>
                      {teams.map(team => (
                        <option key={team.nome} value={team.nome}>{team.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddEmployee(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddEmployee}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                  >
                    {isLoading ? 'Criando...' : 'Criar Funcionário'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Funcionário */}
        {editingEmployee && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Funcionário</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editingEmployee.email}
                      onChange={(e) => setEditingEmployee(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha (opcional)</label>
                    <input
                      type="password"
                      placeholder="Deixe vazio para manter a senha atual"
                      onChange={(e) => setEditingEmployee(prev => prev ? ({ ...prev, senha: e.target.value }) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Permissão</label>
                    <select
                      value={editingEmployee.permissao}
                      onChange={(e) => setEditingEmployee(prev => prev ? ({ ...prev, permissao: e.target.value as any }) : null)}
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
                      value={editingEmployee.equipe || ''}
                      onChange={(e) => setEditingEmployee(prev => prev ? ({ ...prev, equipe: e.target.value || undefined }) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sem equipe</option>
                      {teams.map(team => (
                        <option key={team.nome} value={team.nome}>{team.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setEditingEmployee(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdateEmployee}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                  >
                    {isLoading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Limpeza Seletiva de Protocolos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Trash className="h-5 w-5 mr-2" />
          Limpeza Seletiva de Protocolos
        </h3>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Atenção!</p>
              <p>Esta operação remove permanentemente os protocolos selecionados. Use com cuidado.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="h-4 w-4 inline mr-1" />
              Selecione as categorias para limpeza:
            </label>
            <div className="space-y-2">
              {['Peticionado', 'Cancelado', 'Devolvido'].map(category => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedCleanupCategories.includes(category)}
                    onChange={() => handleCleanupCategoryChange(category)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{category}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({protocols.filter(p => p.status === category).length} protocolos)
                  </span>
                </label>
              ))}
            </div>
          </div>

          {cleanupPreview && selectedCleanupCategories.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">Preview da Limpeza:</h4>
              <div className="text-sm text-red-700 space-y-1">
                {selectedCleanupCategories.includes('Peticionado') && (
                  <p>• Peticionados: {protocols.filter(p => p.status === 'Peticionado').length} protocolos</p>
                )}
                {selectedCleanupCategories.includes('Cancelado') && (
                  <p>• Cancelados: {protocols.filter(p => p.status === 'Cancelado').length} protocolos</p>
                )}
                {selectedCleanupCategories.includes('Devolvido') && (
                  <p>• Devolvidos: {protocols.filter(p => p.status === 'Devolvido').length} protocolos</p>
                )}
                <p className="font-medium pt-2">
                  Total a ser removido: {protocols.filter(p => selectedCleanupCategories.includes(p.status)).length} protocolos
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleCleanupProtocols}
            disabled={isLoading || selectedCleanupCategories.length === 0}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash className="h-4 w-4 mr-2" />
            {isLoading ? 'Limpando...' : 'Executar Limpeza Seletiva'}
          </button>
        </div>
      </div>
    </div>
  );
}