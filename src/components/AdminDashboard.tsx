import React, { useState, useEffect } from 'react';
import { Users, Settings, FileText, Download, Plus, Edit, Trash2, AlertCircle, CheckCircle, X, Eye, Search, Filter, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProtocols } from '../hooks/useProtocols';

interface Employee {
  id: number;
  email: string;
  permissao: 'admin' | 'mod' | 'advogado';
}

export function AdminDashboard() {
  const { hasPermission } = useAuth();
  const { protocols, userEmails } = useProtocols();
  const [activeTab, setActiveTab] = useState<'employees' | 'protocols'>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para filtros de protocolos
  const [protocolFilter, setProtocolFilter] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    createdBy: '',
    search: ''
  });

  // Formulário para adicionar/editar funcionário
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
    permissao: 'advogado' as 'admin' | 'mod' | 'advogado'
  });

  // Verificar se o usuário tem permissão para acessar
  if (!hasPermission('canAccessAllQueues')) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Acesso Negado</h3>
              <p className="text-sm text-red-700 mt-1">
                Você não tem permissão para acessar o painel de administração.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Carregar funcionários
  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      console.log('Tentando carregar funcionários de:', `${apiBaseUrl}/api/admin/funcionarios`);
      
      const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setEmployees(data.funcionarios);
      } else {
        setError(data.message || 'Erro ao carregar funcionários');
      }
    } catch (err) {
      console.error('Erro ao carregar funcionários:', err);
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Erro: Backend não está rodando. Execute "npm run server" ou "npm run dev:full"');
      } else {
        setError('Erro de conexão com o servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Adicionar funcionário
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Funcionário adicionado com sucesso!');
        setShowSuccessNotification(true);
        setShowAddModal(false);
        setFormData({ email: '', senha: '', permissao: 'advogado' });
        loadEmployees();
        
        setTimeout(() => {
          setShowSuccessNotification(false);
        }, 4000);
      } else {
        setError(data.message || 'Erro ao adicionar funcionário');
      }
    } catch (err) {
      console.error('Erro ao adicionar funcionário:', err);
      setError('Erro de conexão com o servidor');
    }
  };

  // Editar funcionário
  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee) return;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Funcionário atualizado com sucesso!');
        setShowSuccessNotification(true);
        setShowEditModal(false);
        setSelectedEmployee(null);
        setFormData({ email: '', senha: '', permissao: 'advogado' });
        loadEmployees();
        
        setTimeout(() => {
          setShowSuccessNotification(false);
        }, 4000);
      } else {
        setError(data.message || 'Erro ao atualizar funcionário');
      }
    } catch (err) {
      console.error('Erro ao atualizar funcionário:', err);
      setError('Erro de conexão com o servidor');
    }
  };

  // Deletar funcionário
  const handleDeleteEmployee = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja deletar este funcionário?')) {
      return;
    }

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Funcionário deletado com sucesso!');
        setShowSuccessNotification(true);
        loadEmployees();
        
        setTimeout(() => {
          setShowSuccessNotification(false);
        }, 4000);
      } else {
        setError(data.message || 'Erro ao deletar funcionário');
      }
    } catch (err) {
      console.error('Erro ao deletar funcionário:', err);
      setError('Erro de conexão com o servidor');
    }
  };

  // Abrir modal de edição
  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      email: employee.email,
      senha: '',
      permissao: employee.permissao
    });
    setShowEditModal(true);
  };

  // Gerar relatório de protocolos
  const generateReport = () => {
    const filteredProtocols = getFilteredProtocols();
    
    const csvContent = [
      ['ID', 'Número do Processo', 'Tribunal', 'Sistema', 'Tipo de Petição', 'Status', 'Criado por', 'Data de Criação', 'Última Atualização', 'Observações'].join(','),
      ...filteredProtocols.map(protocol => [
        protocol.id,
        `"${protocol.processNumber}"`,
        `"${protocol.court}"`,
        `"${protocol.system}"`,
        `"${protocol.petitionType}"`,
        protocol.status,
        `"${userEmails[protocol.createdBy] || 'N/A'}"`,
        protocol.createdAt.toLocaleDateString('pt-BR'),
        protocol.updatedAt.toLocaleDateString('pt-BR'),
        `"${protocol.observations || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_protocolos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrar protocolos
  const getFilteredProtocols = () => {
    return protocols.filter(protocol => {
      // Filtro por status
      if (protocolFilter.status && protocol.status !== protocolFilter.status) {
        return false;
      }

      // Filtro por criador
      if (protocolFilter.createdBy && protocol.createdBy.toString() !== protocolFilter.createdBy) {
        return false;
      }

      // Filtro por data de início
      if (protocolFilter.dateFrom) {
        const protocolDate = new Date(protocol.createdAt);
        const filterDate = new Date(protocolFilter.dateFrom);
        if (protocolDate < filterDate) {
          return false;
        }
      }

      // Filtro por data de fim
      if (protocolFilter.dateTo) {
        const protocolDate = new Date(protocol.createdAt);
        const filterDate = new Date(protocolFilter.dateTo);
        filterDate.setHours(23, 59, 59, 999);
        if (protocolDate > filterDate) {
          return false;
        }
      }

      // Filtro por busca
      if (protocolFilter.search) {
        const searchTerm = protocolFilter.search.toLowerCase();
        const searchableText = [
          protocol.processNumber,
          protocol.court,
          protocol.petitionType,
          protocol.observations || ''
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  };

  const filteredProtocols = getFilteredProtocols();

  const getPermissionLabel = (permissao: string) => {
    switch (permissao) {
      case 'admin': return 'Administrador';
      case 'mod': return 'Moderador';
      case 'advogado': return 'Advogado';
      default: return permissao;
    }
  };

  const getPermissionColor = (permissao: string) => {
    switch (permissao) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'mod': return 'bg-purple-100 text-purple-800';
      case 'advogado': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Painel de Administração</h2>
        {activeTab === 'protocols' && (
          <button
            onClick={generateReport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Gerar Relatório
          </button>
        )}
      </div>

      {/* Mensagem de Erro */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Erro</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('employees')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'employees'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-5 w-5 inline mr-2" />
            Gerenciar Funcionários
          </button>
          <button
            onClick={() => setActiveTab('protocols')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'protocols'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-5 w-5 inline mr-2" />
            Relatório de Protocolos
          </button>
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'employees' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Funcionários Cadastrados</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Funcionário
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando funcionários...</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {employees.map((employee) => (
                  <li key={employee.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Users className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {employee.id}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPermissionColor(employee.permissao)}`}>
                          {getPermissionLabel(employee.permissao)}
                        </span>
                        <button
                          onClick={() => openEditModal(employee)}
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
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'protocols' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Relatório de Protocolos</h3>
          
          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={protocolFilter.search}
                    onChange={(e) => setProtocolFilter(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Buscar protocolos..."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={protocolFilter.status}
                  onChange={(e) => setProtocolFilter(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="Aguardando">Aguardando</option>
                  <option value="Peticionado">Peticionado</option>
                  <option value="Erro">Erro</option>
                  <option value="Devolvido">Devolvido</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Criado por
                </label>
                <select
                  value={protocolFilter.createdBy}
                  onChange={(e) => setProtocolFilter(prev => ({ ...prev, createdBy: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id.toString()}>
                      {employee.email}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de
                </label>
                <input
                  type="date"
                  value={protocolFilter.dateFrom}
                  onChange={(e) => setProtocolFilter(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data até
                </label>
                <input
                  type="date"
                  value={protocolFilter.dateTo}
                  onChange={(e) => setProtocolFilter(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Mostrando {filteredProtocols.length} de {protocols.length} protocolos
              </p>
              <button
                onClick={() => setProtocolFilter({ status: '', dateFrom: '', dateTo: '', createdBy: '', search: '' })}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Limpar Filtros
              </button>
            </div>
          </div>

          {/* Tabela de Protocolos */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Processo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado por
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProtocols.map((protocol) => (
                    <tr key={protocol.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {protocol.processNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {protocol.court}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {protocol.petitionType}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          protocol.status === 'Aguardando' ? 'bg-yellow-100 text-yellow-800' :
                          protocol.status === 'Peticionado' ? 'bg-green-100 text-green-800' :
                          protocol.status === 'Erro' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {protocol.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userEmails[protocol.createdBy] || 'Carregando...'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {protocol.createdAt.toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Funcionário */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Adicionar Funcionário
              </h3>
              
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Permissão
                  </label>
                  <select
                    value={formData.permissao}
                    onChange={(e) => setFormData(prev => ({ ...prev, permissao: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="advogado">Advogado</option>
                    <option value="mod">Moderador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({ email: '', senha: '', permissao: 'advogado' });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Funcionário */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Editar Funcionário
              </h3>
              
              <form onSubmit={handleEditEmployee} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nova Senha (deixe em branco para manter a atual)
                  </label>
                  <input
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Permissão
                  </label>
                  <select
                    value={formData.permissao}
                    onChange={(e) => setFormData(prev => ({ ...prev, permissao: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="advogado">Advogado</option>
                    <option value="mod">Moderador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedEmployee(null);
                      setFormData({ email: '', senha: '', permissao: 'advogado' });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Notificação de Sucesso */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Instruções do Painel de Administração */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Instruções do Painel de Administração:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Aba Funcionários:</strong> Gerencie usuários do sistema (criar, editar, deletar)</li>
          <li>• <strong>Aba Protocolos:</strong> Visualize todos os protocolos do sistema com filtros avançados</li>
          <li>• <strong>Busca por CNJ:</strong> Digite o número do processo para encontrar rapidamente</li>
          <li>• <strong>Seta de expansão:</strong> Clique na seta (▶) para ver todos os detalhes do protocolo</li>
          <li>• <strong>Filtros:</strong> Use os filtros para refinar sua busca por status, usuário, data, etc.</li>
          <li>• <strong>Ver Detalhes:</strong> Clique no botão para abrir o modal completo com histórico</li>
          <li>• <strong>Relatórios:</strong> Acesse a aba "Administração" para baixar relatórios completos</li>
        </ul>
      </div>
    </div>
  );
}