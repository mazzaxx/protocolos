import React, { useState } from 'react';
import { ArrowRight, Users, Notebook as Robot, CheckSquare, Square, Move, CheckCircle } from 'lucide-react';
import { useProtocols } from '../hooks/useProtocols';
import { useAuth } from '../contexts/AuthContext';
import { Protocol } from '../types';

interface QueueManagerProps {
  protocols: Protocol[];
  currentQueue: 'robot' | 'manual' | 'deyse' | 'enzo' | 'iago';
  selectedProtocols: string[];
  setSelectedProtocols: React.Dispatch<React.SetStateAction<string[]>>;
  onProtocolsMoved?: () => void;
  updateProtocolStatus?: (protocolId: string, status: Protocol['status']) => void;
}

export function QueueManager({ protocols, currentQueue, selectedProtocols, setSelectedProtocols, onProtocolsMoved, updateProtocolStatus }: QueueManagerProps) {
  const { moveProtocolToQueue, moveMultipleProtocols } = useProtocols();
  const { hasPermission, canMoveToQueue } = useAuth();
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [movedCount, setMovedCount] = useState(0);

  if (!hasPermission('canMoveProtocols')) {
    return null;
  }

  const handleSelectAll = () => {
    if (selectedProtocols.length === protocols.length) {
      setSelectedProtocols([]);
    } else {
      setSelectedProtocols(protocols.map(p => p.id));
    }
  };

  const handleMoveProtocols = (targetQueue: 'robot' | 'manual' | 'deyse' | 'enzo' | 'iago') => {
    const queueMap: { [key: string]: 'Manual' | 'Deyse' | 'Enzo' | 'Iago' | null } = {
      'robot': null,
      'manual': 'Manual',
      'deyse': 'Deyse',
      'enzo': 'Enzo',
      'iago': 'Iago'
    };
    const assignedTo = queueMap[targetQueue];

    if (selectedProtocols.length > 0) {
      const count = selectedProtocols.length;

      // Resetar o status de "Em Execução" para "Aguardando" antes de mover
      if (updateProtocolStatus) {
        selectedProtocols.forEach(protocolId => {
          const protocol = protocols.find(p => p.id === protocolId);
          if (protocol && protocol.status === 'Em Execução') {
            updateProtocolStatus(protocolId, 'Aguardando');
          }
        });
      }

      moveMultipleProtocols(selectedProtocols, assignedTo);
      setSelectedProtocols([]);
      setMovedCount(count);
      setShowSuccessNotification(true);

      // Chamar callback para atualizar a lista imediatamente
      if (onProtocolsMoved) {
        onProtocolsMoved();
      }

      // Esconder notificação após 4 segundos
      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 4000);
    }
    setShowMoveModal(false);
  };

  const getQueueIcon = (queue: string) => {
    switch (queue) {
      case 'robot': return <Robot className="h-4 w-4" />;
      case 'manual': return <Users className="h-4 w-4 text-blue-600" />;
      case 'deyse': return <Users className="h-4 w-4 text-purple-600" />;
      case 'enzo': return <Users className="h-4 w-4 text-green-600" />;
      case 'iago': return <Users className="h-4 w-4 text-orange-600" />;
      default: return null;
    }
  };

  const getQueueLabel = (queue: string) => {
    switch (queue) {
      case 'robot': return 'Fila do Robô';
      case 'manual': return 'Fila Manual';
      case 'deyse': return 'Fila da Deyse';
      case 'enzo': return 'Fila do Enzo';
      case 'iago': return 'Fila do Iago';
      default: return queue;
    }
  };

  const getQueueColor = (queue: string) => {
    switch (queue) {
      case 'robot': return 'bg-red-600 hover:bg-red-700';
      case 'manual': return 'bg-blue-600 hover:bg-blue-700';
      case 'deyse': return 'bg-purple-600 hover:bg-purple-700';
      case 'enzo': return 'bg-green-600 hover:bg-green-700';
      case 'iago': return 'bg-orange-600 hover:bg-orange-700';
      default: return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  if (protocols.length === 0) {
    return null;
  }

  return (
    <>
      {/* Barra de Gerenciamento */}
      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSelectAll}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {selectedProtocols.length === protocols.length ? (
                <CheckSquare className="h-4 w-4 mr-2" />
              ) : (
                <Square className="h-4 w-4 mr-2" />
              )}
              {selectedProtocols.length === protocols.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </button>
            
            {selectedProtocols.length > 0 && (
              <span className="text-sm text-gray-600">
                {selectedProtocols.length} protocolo{selectedProtocols.length > 1 ? 's' : ''} selecionado{selectedProtocols.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {selectedProtocols.length > 0 && (
            <button
              onClick={() => setShowMoveModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Move className="h-4 w-4 mr-2" />
              Mover para Outra Fila
            </button>
          )}
        </div>
      </div>

      {/* Modal de Movimentação */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Mover Protocolos
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Selecione a fila de destino para {selectedProtocols.length} protocolo{selectedProtocols.length > 1 ? 's' : ''}:
              </p>
              
              <div className="space-y-3">
                {['robot', 'manual', 'deyse', 'enzo', 'iago']
                  .filter(queue => queue !== currentQueue)
                  .filter(queue => canMoveToQueue(queue as 'manual' | 'deyse' | 'enzo' | 'iago' | 'robot'))
                  .map((targetQueue) => (
                  <button
                    key={targetQueue}
                    onClick={() => handleMoveProtocols(targetQueue as any)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-white rounded-md transition-colors ${getQueueColor(targetQueue)}`}
                  >
                    <div className="flex items-center">
                      {getQueueIcon(targetQueue)}
                      <span className="ml-2">{getQueueLabel(targetQueue)}</span>
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowMoveModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notificação de Sucesso */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">
              {movedCount === 1 
                ? 'Protocolo movido com sucesso!' 
                : `${movedCount} protocolos movidos com sucesso!`
              }
            </span>
          </div>
        </div>
      )}
    </>
  );
}