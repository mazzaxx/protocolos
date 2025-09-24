import React, { useState, useEffect } from 'react';
import { BarChart3, Eye, X, Clock, User, ArrowRight, ChevronLeft, History, FileText, AlertCircle, CheckCircle, AlertTriangle, RotateCcw, XCircle } from 'lucide-react';
import { useProtocols } from '../hooks/useProtocols';
import { useAuth } from '../contexts/AuthContext';
import { Protocol, STATUS_COLORS } from '../types';

export function TrackingQueue() {
  const { protocols, forceRefresh, userEmails, cancelProtocol } = useProtocols();
  const { user } = useAuth();
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCompletedProtocols, setShowCompletedProtocols] = useState(false);

  // Filtrar protocolos criados pelo usuário atual
  const getUserProtocols = () => {
    const userProtocols = protocols.filter(p => p.createdBy === user!.id);
    
    if (showCompletedProtocols) {
      // Mostrar apenas protocolos peticionados e cancelados
      return userProtocols.filter(p => p.status === 'Peticionado' || p.status === 'Cancelado');
    } else {
      // Mostrar apenas protocolos ativos (não peticionados nem cancelados)
      return userProtocols.filter(p => p.status !== 'Peticionado' && p.status !== 'Cancelado');
    }
  };

  const userProtocols = getUserProtocols();

  const handleRefreshQueue = () => {
    setIsRefreshing(true);
    
    // Forçar recarregamento dos dados do localStorage
    setTimeout(() => {
      forceRefresh();
      setIsRefreshing(false);
    }, 500);
  };

  const handleProtocolClick = (protocol: Protocol) => {
    setSelectedProtocol(protocol);
    setShowActivityLog(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProtocol(null);
    setShowActivityLog(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  };

  const formatActivityDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusIcon = (status: Protocol['status']) => {
    switch (status) {
      case 'Aguardando':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Em Execução':
        return <BarChart3 className="h-4 w-4 text-blue-500" />;
      case 'Peticionado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Devolvido':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'Cancelado':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getQueueName = (protocol: Protocol) => {
    if (protocol.assignedTo === 'Carlos') return 'Fila do Carlos';
    if (protocol.assignedTo === 'Deyse') return 'Fila da Deyse';
    return 'Fila do Robô';
  };

  const getQueuePosition = (protocol: Protocol) => {
    // Filtrar protocolos na mesma fila e com status 'Aguardando'
    const sameQueueProtocols = protocols.filter(p => 
      p.status === 'Aguardando' && 
      p.assignedTo === protocol.assignedTo
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    const position = sameQueueProtocols.findIndex(p => p.id === protocol.id) + 1;
    return position > 0 ? position : null;
  };

  const canCancelProtocol = (protocol: Protocol) => {
    return protocol.status !== 'Em Execução' && protocol.status !== 'Peticionado';
  };

  const handleCancelProtocol = () => {
    if (selectedProtocol) {
      cancelProtocol(selectedProtocol.id, userEmails[user!.id] || user!.email);
      setShowCancelModal(false);
      handleCloseModal();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {showCompletedProtocols ? 'Protocolos Peticionados e Cancelados' : 'Acompanhamento de Protocolos'}
          </h2>
          <p className="text-sm text-gray-600">
            {showCompletedProtocols 
              ? 'Visualize seus protocolos finalizados (peticionados e cancelados)'
              : 'Visualize o status dos seus protocolos em andamento'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCompletedProtocols(!showCompletedProtocols)}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              showCompletedProtocols 
                ? 'text-blue-600 bg-blue-100 hover:bg-blue-200' 
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
            title={showCompletedProtocols ? 'Voltar para protocolos ativos' : 'Ver protocolos peticionados e cancelados'}
          >
            {showCompletedProtocols ? (
              <>
                <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                Voltar para Ativos
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Peticionados e Cancelados
              </>
            )}
          </button>
          <button
            onClick={handleRefreshQueue}
            disabled={isRefreshing}
            className="flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-100 hover:bg-green-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Atualizar lista de protocolos"
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar Lista'}
          </button>
        </div>
      </div>

      {userProtocols.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {showCompletedProtocols ? 'Nenhum protocolo finalizado' : 'Nenhum protocolo ativo'}
          </h3>
          <p className="text-gray-600">
            {showCompletedProtocols 
              ? 'Você não possui protocolos peticionados ou cancelados.'
              : 'Você não possui protocolos em andamento no momento.'
            }
          </p>
        </div>
      ) : (
        <>
          {/* Contador de protocolos */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>
                {showCompletedProtocols 
                  ? `${userProtocols.length} protocolo${userProtocols.length !== 1 ? 's' : ''} finalizado${userProtocols.length !== 1 ? 's' : ''}`
                  : `${userProtocols.length} protocolo${userProtocols.length !== 1 ? 's' : ''} em andamento`
                }
              </strong>
              {showCompletedProtocols && (
                <span className="ml-2 text-xs">
                  (Peticionados: {userProtocols.filter(p => p.status === 'Peticionado').length}, 
                  Cancelados: {userProtocols.filter(p => p.status === 'Cancelado').length})
                </span>
              )}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={showCompletedProtocols ? "bg-blue-50" : "bg-green-50"}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Processo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tribunal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo de Petição
                </th>
                {!showCompletedProtocols && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fila Atual
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {showCompletedProtocols ? 'Data de Finalização' : 'Data de Envio'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userProtocols.map((protocol) => (
                <tr key={protocol.id} className={showCompletedProtocols ? "hover:bg-blue-50" : "hover:bg-green-50"}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(protocol.status)}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[protocol.status]}`}>
                        {protocol.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        {protocol.isDistribution && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mr-2">
                            📋 DIST
                          </span>
                        )}
                        {protocol.processType && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                            protocol.processType === 'civel' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {protocol.processType === 'civel' ? '⚖️' : '👷'}
                          </span>
                        )}
                        {protocol.processNumber || (protocol.isDistribution ? 'Distribuição sem número' : protocol.processNumber)}
                      </div>
                    </div>
                    {protocol.isFatal && (
                      <div className="flex items-center mt-1">
                        <AlertTriangle className="h-3 w-3 text-red-500 mr-1" />
                        <span className="text-xs text-red-600 font-medium">FATAL</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {protocol.court || (protocol.isDistribution ? 'Tribunal não especificado' : protocol.court)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {protocol.jurisdiction || (protocol.isDistribution ? 'Jurisdição não especificada' : protocol.jurisdiction)}
                      {protocol.isDistribution && (
                        <span className="ml-2 text-orange-600 font-medium">📋 Distribuição</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {protocol.petitionType || (protocol.isDistribution ? 'Tipo não especificado' : protocol.petitionType)}
                    </div>
                  </td>
                  {!showCompletedProtocols && (
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {getQueueName(protocol)}
                      </div>
                      {protocol.status === 'Aguardando' && getQueuePosition(protocol) && (
                        <div className="text-xs text-gray-500">
                          Posição: {getQueuePosition(protocol)}º na fila
                        </div>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {showCompletedProtocols ? formatDate(protocol.updatedAt) : formatDate(protocol.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleProtocolClick(protocol)}
                      className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        showCompletedProtocols 
                          ? 'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500'
                          : 'text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500'
                      }`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Visualizar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Modal de Visualização do Protocolo */}
      {isModalOpen && selectedProtocol && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style={{ zIndex: 1000 }}>
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            {!showActivityLog ? (
              <>
                {/* Header do Modal */}
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Detalhes do Protocolo
                    </h3>
                    <button
                      onClick={() => setShowActivityLog(true)}
                      className="flex items-center px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      title="Ver histórico de atividades"
                    >
                      <History className="h-3 w-3 mr-1" />
                      Log
                    </button>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Conteúdo Principal */}
                <div className="mt-4 space-y-4">
                  {/* Status do Protocolo */}
                  <div className="bg-gray-50 border rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getStatusIcon(selectedProtocol.status)}
                        <span className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[selectedProtocol.status]}`}>
                          {selectedProtocol.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Fila atual: <strong>{getQueueName(selectedProtocol)}</strong>
                      </div>
                    </div>
                    {selectedProtocol.status === 'Aguardando' && getQueuePosition(selectedProtocol) && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Posição na fila:</strong> {getQueuePosition(selectedProtocol)}º
                      </div>
                    )}
                    {selectedProtocol.status === 'Devolvido' && selectedProtocol.returnReason && (
                      <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                        <p className="text-sm text-orange-800">
                          <strong>Motivo da devolução:</strong> {selectedProtocol.returnReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Informações do Processo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Número do Processo
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedProtocol.processNumber || (selectedProtocol.isDistribution ? ' - ' : selectedProtocol.processNumber)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tribunal
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedProtocol.court || (selectedProtocol.isDistribution ? ' - ' : selectedProtocol.court)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Sistema
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {selectedProtocol.system || (selectedProtocol.isDistribution ? ' - ' : selectedProtocol.system)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Grau da Jurisdição
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedProtocol.jurisdiction || (selectedProtocol.isDistribution ? ' - ' : selectedProtocol.jurisdiction)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tipo de Petição
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedProtocol.petitionType || (selectedProtocol.isDistribution ? ' - ' : selectedProtocol.petitionType)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Data de Envio
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(selectedProtocol.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Observações */}
                  {selectedProtocol.observations && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Observações
                      </label>
                      <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
                        {selectedProtocol.observations}
                      </p>
                    </div>
                  )}

                  {/* Lista de Documentos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Documentos Anexados ({selectedProtocol.documents.length})
                    </label>
                    <div className="bg-gray-50 rounded-lg p-3">
                      {selectedProtocol.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center py-1">
                          <FileText className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-900">
                            {doc.name} ({doc.category === 'petition' ? 'Petição' : 'Complementar'})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tipo de Procuração */}
                  {selectedProtocol.needsProcuration && selectedProtocol.procurationType && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tipo de Procuração
                      </label>
                      <p className="mt-1 text-sm text-gray-900 bg-blue-50 p-2 rounded">
                        {selectedProtocol.procurationType}
                      </p>
                    </div>
                  )}

                  {/* Guias de Recolhimento */}
                  {selectedProtocol.needsGuia && selectedProtocol.guias && selectedProtocol.guias.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Guias de Recolhimento ({selectedProtocol.guias.length})
                      </label>
                      <div className="space-y-2">
                        {selectedProtocol.guias.map((guia, index) => (
                          <div key={guia.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-green-800">
                                Guia #{index + 1} - {guia.system}
                              </span>
                            </div>
                            <p className="text-sm text-green-700 font-mono">
                              {guia.number}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Botão de Fechar */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between">
                    {canCancelProtocol(selectedProtocol) && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancelar Protocolo
                      </button>
                    )}
                    <div className={canCancelProtocol(selectedProtocol) ? '' : 'ml-auto'}>
                      <button
                        onClick={handleCloseModal}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Header do Log */}
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowActivityLog(false)}
                      className="flex items-center px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      title="Voltar aos detalhes"
                    >
                      <ChevronLeft className="h-3 w-3 mr-1" />
                      Voltar
                    </button>
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <History className="h-5 w-5 mr-2" />
                      Histórico de Atividades
                    </h3>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Conteúdo do Log */}
                <div className="mt-4">
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Processo:</strong> {selectedProtocol.processNumber}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Status: {selectedProtocol.status}
                    </p>
                    <p className="text-xs text-gray-600">
                      Fila: {getQueueName(selectedProtocol)}
                    </p>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedProtocol.activityLog && selectedProtocol.activityLog.length > 0 ? (
                      selectedProtocol.activityLog
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((activity) => (
                          <div key={activity.id} className="bg-white border rounded-lg p-4 shadow-sm">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                {activity.action === 'created' && <Clock className="h-4 w-4 text-blue-500" />}
                                {activity.action === 'moved_to_queue' && <ArrowRight className="h-4 w-4 text-purple-500" />}
                                {activity.action === 'status_changed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                {activity.action === 'returned' && <AlertCircle className="h-4 w-4 text-orange-500" />}
                                {activity.action === 'resubmitted' && <CheckCircle className="h-4 w-4 text-blue-500" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                {activity.details && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    <strong>Detalhes:</strong> {activity.details}
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-sm text-gray-500">
                                    {activity.performedBy && (
                                      <span className="flex items-center">
                                        <User className="h-3 w-3 mr-1" />
                                        {activity.performedBy}
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {formatActivityDate(new Date(activity.timestamp))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-8">
                        <History className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">Nenhuma atividade registrada</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Cancelamento */}
      {showCancelModal && selectedProtocol && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style={{ zIndex: 1001 }}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <XCircle className="h-6 w-6 text-red-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  Cancelar Protocolo
                </h3>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Tem certeza que deseja cancelar este protocolo?
                </p>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-900">
                    {selectedProtocol.processNumber || 'Distribuição sem número'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {selectedProtocol.petitionType || 'Tipo não especificado'}
                  </p>
                </div>
                <p className="text-xs text-red-600 mt-2">
                  <strong>Atenção:</strong> Esta ação não pode ser desfeita.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Não, manter protocolo
                </button>
                <button
                  onClick={handleCancelProtocol}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Sim, cancelar protocolo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Informações sobre Acompanhamento */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h3 className="font-medium text-green-900 mb-2">
          {showCompletedProtocols ? 'Sobre Protocolos Finalizados:' : 'Sobre o Acompanhamento:'}
        </h3>
        <ul className="text-sm text-green-800 space-y-1">
          {showCompletedProtocols ? (
            <>
              <li>• Visualize protocolos que foram peticionados com sucesso</li>
              <li>• Veja protocolos que foram cancelados</li>
              <li>• A data mostrada é quando o protocolo foi finalizado</li>
              <li>• Use o botão "Voltar para Ativos" para ver protocolos em andamento</li>
              <li>• Clique em "Visualizar" para ver detalhes e histórico completo</li>
            </>
          ) : (
            <>
              <li>• Visualize protocolos em andamento (aguardando, em execução, devolvidos)</li>
              <li>• Acompanhe o status em tempo real</li>
              <li>• Veja em qual fila seu protocolo está sendo processado</li>
              <li>• Use o botão "Peticionados e Cancelados" para ver protocolos finalizados</li>
              <li>• Clique em "Visualizar" para ver detalhes completos</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}