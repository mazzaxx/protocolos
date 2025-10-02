import React, { useState, useEffect } from 'react';
import { Trash, AlertTriangle, Filter } from 'lucide-react';
import { useProtocols } from '../../hooks/useProtocols';

interface CleanupPreview {
  total: number;
  peticionados: number;
  cancelados: number;
  devolvidos: number;
  maisAntigo: string;
  maisRecente: string;
}

export function CleanupTab() {
  const { protocols } = useProtocols();
  const [cleanupPreview, setCleanupPreview] = useState<CleanupPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCleanupCategories, setSelectedCleanupCategories] = useState<string[]>(['Peticionado', 'Cancelado']);

  const apiBaseUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    loadCleanupPreview();
  }, []);

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
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          <Trash className="h-5 w-5 mr-2" />
          Limpeza Seletiva de Protocolos
        </h3>
        <p className="text-sm text-gray-600">
          Remove permanentemente protocolos finalizados para otimizar o banco de dados
        </p>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Atenção!</p>
            <p>Esta operação remove permanentemente os protocolos selecionados. Use com cuidado.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Filter className="h-4 w-4 inline mr-1" />
              Selecione as categorias para limpeza:
            </label>
            <div className="space-y-3">
              {['Peticionado', 'Cancelado', 'Devolvido'].map(category => (
                <label key={category} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedCleanupCategories.includes(category)}
                    onChange={() => handleCleanupCategoryChange(category)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <span className="text-sm font-medium text-gray-700">{category}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      ({protocols.filter(p => p.status === category).length} protocolos)
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {selectedCleanupCategories.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-red-800 mb-3">Preview da Limpeza:</h4>
              <div className="text-sm text-red-700 space-y-2">
                {selectedCleanupCategories.includes('Peticionado') && (
                  <div className="flex justify-between">
                    <span>• Peticionados:</span>
                    <span className="font-medium">{protocols.filter(p => p.status === 'Peticionado').length} protocolos</span>
                  </div>
                )}
                {selectedCleanupCategories.includes('Cancelado') && (
                  <div className="flex justify-between">
                    <span>• Cancelados:</span>
                    <span className="font-medium">{protocols.filter(p => p.status === 'Cancelado').length} protocolos</span>
                  </div>
                )}
                {selectedCleanupCategories.includes('Devolvido') && (
                  <div className="flex justify-between">
                    <span>• Devolvidos:</span>
                    <span className="font-medium">{protocols.filter(p => p.status === 'Devolvido').length} protocolos</span>
                  </div>
                )}
                <div className="border-t border-red-300 pt-2 mt-3">
                  <div className="flex justify-between font-medium">
                    <span>Total a ser removido:</span>
                    <span className="text-red-900">
                      {protocols.filter(p => selectedCleanupCategories.includes(p.status)).length} protocolos
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={handleCleanupProtocols}
              disabled={isLoading || selectedCleanupCategories.length === 0}
              className="flex items-center px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash className="h-5 w-5 mr-2" />
              {isLoading ? 'Executando Limpeza...' : 'Executar Limpeza Seletiva'}
            </button>
          </div>

          {/* Informações sobre a limpeza */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Como funciona a limpeza:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Peticionados:</strong> Protocolos que foram processados com sucesso</li>
              <li>• <strong>Cancelados:</strong> Protocolos que foram cancelados pelos usuários</li>
              <li>• <strong>Devolvidos:</strong> Protocolos que foram devolvidos e não corrigidos</li>
              <li>• A limpeza é permanente e não pode ser desfeita</li>
              <li>• Recomenda-se fazer backup antes de executar limpezas grandes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}