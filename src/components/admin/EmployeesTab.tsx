import React, { useState, useEffect } from 'react';
import { Users, Plus, CreditCard as Edit, Trash2, Search } from 'lucide-react';

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

export function EmployeesTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    email: '',
    senha: '',
    permissao: 'advogado' as 'admin' | 'mod' | 'advogado',
    equipe: ''
  });

  const apiBaseUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    loadEmployees();
    loadTeams();
  }, []);

  useEffect(() => {
    // Filtrar funcionários baseado no termo de busca
    const filtered = employees.filter(employee =>
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.equipe && employee.equipe.toLowerCase().includes(searchTerm.toLowerCase())) ||
      employee.permissao.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [employees, searchTerm]);

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
        await loadTeams();
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
        await loadTeams();
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Gerenciamento de Funcionários
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredEmployees.length} de {employees.length} funcionários
          </p>
        </div>
        <button
          onClick={() => setShowAddEmployee(true)}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo Funcionário
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Pesquisar por email, equipe ou permissão..."
          />
        </div>
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
            {filteredEmployees.map((employee) => (
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

      {filteredEmployees.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum funcionário encontrado para "{searchTerm}"</p>
        </div>
      )}

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
  );
}