import React, { useState, useEffect } from 'react';
import { Users, Plus, CreditCard as Edit, Trash2 } from 'lucide-react';

interface Team {
  nome: string;
  membros: number;
}

export function TeamsTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState({ nome: '' });
  const [editTeamName, setEditTeamName] = useState('');

  const apiBaseUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    loadTeams();
  }, []);

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

  const handleEditTeam = async () => {
    if (!editingTeam || !editTeamName.trim()) {
      alert('Nome da equipe é obrigatório');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/equipes/${encodeURIComponent(editingTeam.nome)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nomeNovo: editTeamName.trim() })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadTeams();
        setEditingTeam(null);
        setEditTeamName('');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Erro ao editar equipe:', error);
      alert('Erro ao editar equipe');
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Gerenciamento de Equipes
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {teams.length} equipe{teams.length !== 1 ? 's' : ''} cadastrada{teams.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowAddTeam(true)}
          className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nova Equipe
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma equipe cadastrada</h3>
          <p className="text-gray-600">Clique em "Nova Equipe" para começar</p>
        </div>
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
                      onClick={() => {
                        setEditingTeam(team);
                        setEditTeamName(team.nome);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 mr-2"
                      title="Editar nome da equipe"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.nome)}
                      className="text-red-600 hover:text-red-900"
                      title="Deletar equipe"
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

      {/* Modal Editar Equipe */}
      {editingTeam && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Nome da Equipe</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Atual</label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{editingTeam.nome}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Novo Nome</label>
                  <input
                    type="text"
                    value={editTeamName}
                    onChange={(e) => setEditTeamName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Digite o novo nome da equipe"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  <p>• {editingTeam.membros} funcionário{editingTeam.membros !== 1 ? 's' : ''} será{editingTeam.membros !== 1 ? 'ão' : ''} atualizado{editingTeam.membros !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setEditingTeam(null);
                    setEditTeamName('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditTeam}
                  disabled={isLoading || !editTeamName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50"
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}