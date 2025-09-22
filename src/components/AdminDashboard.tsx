import React, { useState, useEffect } from 'react';
import { Settings, Users, BarChart3, Plus, Edit, Trash2, Eye, X, Calendar, Filter, RefreshCw, Search, SortAsc, SortDesc } from 'lucide-react';
import { useProtocols } from '../hooks/useProtocols';
import { useAuth } from '../contexts/AuthContext';
import { Protocol, User } from '../types';

interface Employee {
  id: number;
  email: string;
  permissao: 'admin' | 'mod' | 'advogado';
  equipe?: string;
  created_at?: string;
  updated_at?: string;
}

const EQUIPES_DISPONIVEIS = [
  'Equipe Rahner',
  'Equipe Mayssa', 
  'Equipe Juacy',
  'Equipe Johnson',
  'Equipe Flaviana'
];

export function AdminDashboard() {
  const { protocols, forceRefresh } = useProtocols();
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'reports'>('overview');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estados para filtros de data
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
    enabled: false
  });

  // Estados para filtros de funcionários
  const [employeeFilters, setEmployeeFilters] = useState({
    searchTerm: '',
    selectedTeam: '',
    selectedPermission: '',
    sortBy: 'email' as 'email' | 'permissao' | 'equipe' | 'created_at',
    sortOrder: 'asc' as 'asc' | 'desc'
  });
  
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
    permissao: 'advogado' as 'admin' | 'mod' | 'advogado',
    equipe: ''
  });

  // Verificar permissões
  if (!hasPermission('canAccessAllQueues')) {
    return (
      <div className="text-center py-12">
        <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Negado</h3>
        <p className="text-gray-600">Você não tem permissão para acessar o painel administrativo.</p>
      </div>
    );
  }

  useEffect(() => {
    fetchEmployees();
    // Forçar refresh inicial para garantir dados atualizados
    handleRefresh();
  }, []);

  const fetchEmployees = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (window as any).__API_BASE_URL__ || '';
      const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEmployees(data.funcionarios);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([
      fetchEmployees(),
      forceRefresh()
    ]).finally(() => {
      setIsRefreshing(false);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setDateFilter(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEmployeeFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEmployeeFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      email: '',
      senha: '',
      permissao: 'advogado',
      equipe: ''
    });
    setEditingEmployee(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (window as any).__API_BASE_URL__ || '';
      const url = editingEmployee 
        ? `${apiBaseUrl}/api/admin/funcionarios/${editingEmployee.id}`
        : `${apiBaseUrl}/api/admin/funcionarios`;
      
      const method = editingEmployee ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchEmployees();
          setIsModalOpen(false);
          resetForm();
        } else {
          alert(data.message || 'Erro ao salvar funcionário');
        }
      } else {
        alert('Erro ao salvar funcionário');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão');
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      email: employee.email,
      senha: '',
      permissao: employee.permissao,
      equipe: employee.equipe || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja deletar este funcionário?')) {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (window as any).__API_BASE_URL__ || '';
        const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          fetchEmployees();
        } else {
          alert('Erro ao deletar funcionário');
        }
      } catch (error) {
        console.error('Erro:', error);
        alert('Erro de conexão');
      }
    }
  };

  const handleSort = (field: typeof employeeFilters.sortBy) => {
    setEmployeeFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filtrar protocolos por data se o filtro estiver ativo
  const getFilteredProtocols = () => {
    if (!dateFilter.enabled || (!dateFilter.startDate && !dateFilter.endDate)) {
      return protocols;
    }

    return protocols.filter(protocol => {
      const protocolDate = new Date(protocol.createdAt);
      const startDate = dateFilter.startDate ? new Date(dateFilter.startDate + 'T00:00:00') : null;
      const endDate = dateFilter.endDate ? new Date(dateFilter.endDate + 'T23:59:59') : null;

      if (startDate && endDate) {
        return protocolDate >= startDate && protocolDate <= endDate;
      } else if (startDate) {
        return protocolDate >= startDate;
      } else if (endDate) {
        return protocolDate <= endDate;
      }
      
      return true;
    });
  };

  // Filtrar e ordenar funcionários
  const getFilteredEmployees = () => {
    let filtered = employees.filter(employee => {
      const matchesSearch = employee.email.toLowerCase().includes(employeeFilters.searchTerm.toLowerCase());
      const matchesTeam = !employeeFilters.selectedTeam || 
        (employeeFilters.selectedTeam === 'sem-equipe' ? (!employee.equipe || employee.equipe === '') : employee.equipe === employeeFilters.selectedTeam);
      const matchesPermission = !employeeFilters.selectedPermission || employee.permissao === employeeFilters.selectedPermission;
      
      return matchesSearch && matchesTeam && matchesPermission;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let aValue = '';
      let bValue = '';

      switch (employeeFilters.sortBy) {
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'permissao':
          aValue = a.permissao;
          bValue = b.permissao;
          break;
        case 'equipe':
          aValue = a.equipe || '';
          bValue = b.equipe || '';
          break;
        case 'created_at':
          aValue = a.created_at || '';
          bValue = b.created_at || '';
          break;
      }

      if (employeeFilters.sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return filtered;
  };

  const filteredProtocols = getFilteredProtocols();
  const filteredEmployees = getFilteredEmployees();

  const getProtocolStats = () => {
    const stats = {
      total: filteredProtocols.length,
      aguardando: filteredProtocols.filter(p => p.status === 'Aguardando').length,
      emExecucao: filteredProtocols.filter(p => p.status === 'Em Execução').length,
      peticionado: filteredProtocols.filter(p => p.status === 'Peticionado').length,
      devolvido: filteredProtocols.filter(p => p.status === 'Devolvido').length,
      cancelado: filteredProtocols.filter(p => p.status === 'Cancelado').length,
      filaRobo: filteredProtocols.filter(p => !p.assignedTo && p.status === 'Aguardando').length,
      filaCarlos: filteredProtocols.filter(p => p.assignedTo === 'Carlos' && p.status === 'Aguardando').length,
      filaDeyse: filteredProtocols.filter(p => p.assignedTo === 'Deyse' && p.status === 'Aguardando').length,
    };
    return stats;
  };

  const getEmployeeStats = () => {
    const totalEmployees = employees.length;
    const byPermission = {
      admin: employees.filter(e => e.permissao === 'admin').length,
      mod: employees.filter(e => e.permissao === 'mod').length,
      advogado: employees.filter(e => e.permissao === 'advogado').length,
    };
    const byTeam = EQUIPES_DISPONIVEIS.reduce((acc, equipe) => {
      acc[equipe] = employees.filter(e => e.equipe === equipe).length;
      return acc;
    }, {} as Record<string, number>);
    
    // Funcionários sem equipe
    const semEquipe = employees.filter(e => !e.equipe || e.equipe === '').length;
    
    return { totalEmployees, byPermission, byTeam, semEquipe };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getSortIcon = (field: typeof employeeFilters.sortBy) => {
    if (employeeFilters.sortBy !== field) return null;
    return employeeFilters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  const stats = getProtocolStats();
  const employeeStats = getEmployeeStats();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Painel Administrativo</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
            title="Recarregar página completamente"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Completo
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b mb-6">
        <div className="flex space-x-8">
          {[
            { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
            { id: 'employees', label: 'Funcionários', icon: Users },
            { id: 'reports', label: 'Relatórios', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                  isActive 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Filtro de Data (visível em todas as abas) */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableDateFilter"
              name="enabled"
              checked={dateFilter.enabled}
              onChange={handleDateFilterChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enableDateFilter" className="ml-2 text-sm font-medium text-gray-700">
              Filtrar por período
            </label>
          </div>
          
          {dateFilter.enabled && (
            <>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <label className="text-sm text-gray-600">De:</label>
                <input
                  type="date"
                  name="startDate"
                  value={dateFilter.startDate}
                  onChange={handleDateFilterChange}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Até:</label>
                <input
                  type="date"
                  name="endDate"
                  value={dateFilter.endDate}
                  onChange={handleDateFilterChange}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={() => setDateFilter({ startDate: '', endDate: '', enabled: false })}
                className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </button>
            </>
          )}
        </div>
        
        {dateFilter.enabled && (dateFilter.startDate || dateFilter.endDate) && (
          <div className="mt-2 text-xs text-blue-600">
            <Filter className="h-3 w-3 inline mr-1" />
            Mostrando dados de {dateFilter.startDate ? new Date(dateFilter.startDate).toLocaleDateString('pt-BR') : 'início'} até {dateFilter.endDate ? new Date(dateFilter.endDate).toLocaleDateString('pt-BR') : 'hoje'}
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Estatísticas de Protocolos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Protocolos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  {dateFilter.enabled && (
                    <p className="text-xs text-blue-600">Período filtrado</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Aguardando</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.aguardando}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Peticionados</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.peticionado}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Devolvidos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.devolvido}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas das Filas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fila do Robô</h3>
              <p className="text-3xl font-bold text-red-600">{stats.filaRobo}</p>
              <p className="text-sm text-gray-600">protocolos aguardando</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fila do Carlos</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.filaCarlos}</p>
              <p className="text-sm text-gray-600">protocolos aguardando</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fila da Deyse</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.filaDeyse}</p>
              <p className="text-sm text-gray-600">protocolos aguardando</p>
            </div>
          </div>

          {/* Estatísticas de Funcionários Aprimoradas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Funcionários ({employeeStats.totalEmployees} total)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Por Permissão</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Administradores:</span>
                    <span className="text-sm font-medium bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      {employeeStats.byPermission.admin}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Moderadores:</span>
                    <span className="text-sm font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      {employeeStats.byPermission.mod}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Advogados:</span>
                    <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {employeeStats.byPermission.advogado}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Por Equipe</h4>
                <div className="space-y-2">
                  {EQUIPES_DISPONIVEIS.map(equipe => (
                    <div key={equipe} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{equipe}:</span>
                      <span className="text-sm font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {employeeStats.byTeam[equipe] || 0}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Sem equipe:</span>
                    <span className="text-sm font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                      {employeeStats.semEquipe}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'employees' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Gerenciar Funcionários ({filteredEmployees.length} de {employees.length})
            </h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Funcionário
            </button>
          </div>

          {/* Filtros de Funcionários */}
          <div className="bg-white rounded-lg shadow p-4">
            {/* Indicador de filtros ativos */}
            {(employeeFilters.searchTerm || employeeFilters.selectedTeam || employeeFilters.selectedPermission) && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Filtros ativos:</span>
                    <div className="flex space-x-2">
                      {employeeFilters.searchTerm && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Email: "{employeeFilters.searchTerm}"
                        </span>
                      )}
                      {employeeFilters.selectedTeam && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Equipe: {employeeFilters.selectedTeam === 'sem-equipe' ? 'Sem equipe' : employeeFilters.selectedTeam}
                        </span>
                      )}
                      {employeeFilters.selectedPermission && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Permissão: {employeeFilters.selectedPermission}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar por email
                </label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="searchTerm"
                    value={employeeFilters.searchTerm}
                    onChange={handleEmployeeFilterChange}
                    placeholder="Digite o email..."
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por equipe
                </label>
                <select
                  name="selectedTeam"
                  value={employeeFilters.selectedTeam}
                  onChange={handleEmployeeFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as equipes</option>
                  {EQUIPES_DISPONIVEIS.map(equipe => (
                    <option key={equipe} value={equipe}>{equipe}</option>
                  ))}
                  <option value="sem-equipe">Sem equipe</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por permissão
                </label>
                <select
                  name="selectedPermission"
                  value={employeeFilters.selectedPermission}
                  onChange={handleEmployeeFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as permissões</option>
                  <option value="admin">Administrador</option>
                  <option value="mod">Moderador</option>
                  <option value="advogado">Advogado</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setEmployeeFilters({
                    searchTerm: '',
                    selectedTeam: '',
                    selectedPermission: '',
                    sortBy: 'email',
                    sortOrder: 'asc'
                  })}
                  className="w-full px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Email</span>
                      {getSortIcon('email')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('permissao')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Permissão</span>
                      {getSortIcon('permissao')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('equipe')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Equipe</span>
                      {getSortIcon('equipe')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Criado em</span>
                      {getSortIcon('created_at')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.equipe ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {employee.equipe}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Sem equipe</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.created_at ? formatDateOnly(employee.created_at) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                        title="Editar funcionário"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                        title="Deletar funcionário"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredEmployees.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  {employees.length === 0 
                    ? 'Nenhum funcionário cadastrado' 
                    : 'Nenhum funcionário encontrado com os filtros aplicados'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Relatórios Detalhados</h3>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="text-md font-medium text-gray-900">
                Protocolos ({filteredProtocols.length} {dateFilter.enabled ? 'filtrados' : 'total'})
              </h4>
              {dateFilter.enabled && (dateFilter.startDate || dateFilter.endDate) && (
                <p className="text-sm text-blue-600 mt-1">
                  Período: {dateFilter.startDate ? new Date(dateFilter.startDate).toLocaleDateString('pt-BR') : 'início'} até {dateFilter.endDate ? new Date(dateFilter.endDate).toLocaleDateString('pt-BR') : 'hoje'}
                </p>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Processo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fila
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProtocols.map((protocol) => (
                    <tr key={protocol.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {protocol.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {protocol.processNumber || 'Distribuição'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          protocol.status === 'Aguardando' ? 'bg-yellow-100 text-yellow-800' :
                          protocol.status === 'Em Execução' ? 'bg-blue-100 text-blue-800' :
                          protocol.status === 'Peticionado' ? 'bg-green-100 text-green-800' :
                          protocol.status === 'Devolvido' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {protocol.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {protocol.assignedTo ? `Fila do ${protocol.assignedTo}` : 'Fila do Robô'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(protocol.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedProtocol(protocol);
                            setIsProtocolModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredProtocols.length === 0 && (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {protocols.length === 0 
                      ? 'Nenhum protocolo encontrado' 
                      : 'Nenhum protocolo encontrado no período selecionado'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Funcionário */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha {editingEmployee && '(deixe em branco para manter a atual)'}
                  </label>
                  <input
                    type="password"
                    name="senha"
                    value={formData.senha}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!editingEmployee}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Permissão *
                  </label>
                  <select
                    name="permissao"
                    value={formData.permissao}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="advogado">Advogado</option>
                    <option value="mod">Moderador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipe
                  </label>
                  <select
                    name="equipe"
                    value={formData.equipe}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione uma equipe (opcional)</option>
                    {EQUIPES_DISPONIVEIS.map(equipe => (
                      <option key={equipe} value={equipe}>{equipe}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    A equipe ajuda na organização e relatórios dos funcionários
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    {editingEmployee ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Protocolo */}
      {isProtocolModalOpen && selectedProtocol && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Detalhes do Protocolo
              </h3>
              <button
                onClick={() => setIsProtocolModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedProtocol.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedProtocol.status === 'Aguardando' ? 'bg-yellow-100 text-yellow-800' :
                    selectedProtocol.status === 'Em Execução' ? 'bg-blue-100 text-blue-800' :
                    selectedProtocol.status === 'Peticionado' ? 'bg-green-100 text-green-800' :
                    selectedProtocol.status === 'Devolvido' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedProtocol.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Processo</label>
                  <p className="text-sm text-gray-900">{selectedProtocol.processNumber || 'Distribuição'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tribunal</label>
                  <p className="text-sm text-gray-900">{selectedProtocol.court || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sistema</label>
                  <p className="text-sm text-gray-900">{selectedProtocol.system || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fila</label>
                  <p className="text-sm text-gray-900">
                    {selectedProtocol.assignedTo ? `Fila do ${selectedProtocol.assignedTo}` : 'Fila do Robô'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Criado em</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedProtocol.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Atualizado em</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedProtocol.updatedAt)}</p>
                </div>
              </div>
              
              {selectedProtocol.observations && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedProtocol.observations}</p>
                </div>
              )}
              
              {selectedProtocol.returnReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Motivo da Devolução</label>
                  <p className="text-sm text-gray-900 bg-orange-50 p-2 rounded">{selectedProtocol.returnReason}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Documentos</label>
                <p className="text-sm text-gray-900">{selectedProtocol.documents.length} arquivo(s) anexado(s)</p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsProtocolModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}