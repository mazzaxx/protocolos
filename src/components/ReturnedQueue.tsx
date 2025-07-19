import React, { useState, useEffect } from 'react';
import { AlertCircle, FileText, Eye, X, CheckCircle, Edit, RotateCcw, Upload, History, Clock, User, ArrowRight, ChevronLeft } from 'lucide-react';
import { useProtocols } from '../hooks/useProtocols';
import { useAuth } from '../contexts/AuthContext';
import { Protocol, COURTS, PETITION_TYPES, TRIBUNAL_SYSTEMS } from '../types';

export function ReturnedQueue() {
  const { protocols, updateProtocolStatus, forceRefresh, updateProtocol, userEmails } = useProtocols();
  const { user } = useAuth();
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    processNumber: '',
    court: '',
    system: '',
    jurisdiction: '' as '' | '1º Grau' | '2º Grau',
    isFatal: false,
    needsProcuration: false,
    petitionType: '',
    observations: '',
  });
  const [petitionDocuments, setPetitionDocuments] = useState<File[]>([]);
  const [complementaryDocuments, setComplementaryDocuments] = useState<File[]>([]);

  // Filtrar apenas protocolos devolvidos criados pelo usuário atual
  const getReturnedProtocols = () => {
    return protocols.filter(p => 
      p.status === 'Devolvido' && 
      p.createdBy === user!.id
    );
  };

  const returnedProtocols = getReturnedProtocols();

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
    setEditFormData({
      processNumber: protocol.processNumber,
      court: protocol.court,
      system: protocol.system,
      jurisdiction: protocol.jurisdiction,
      isFatal: protocol.isFatal,
      needsProcuration: protocol.needsProcuration,
      petitionType: protocol.petitionType,
      observations: protocol.observations || '',
    });
    setPetitionDocuments([]);
    setComplementaryDocuments([]);
    setIsEditing(false);
    setShowActivityLog(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProtocol(null);
    setIsEditing(false);
    setShowActivityLog(false);
    setPetitionDocuments([]);
    setComplementaryDocuments([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setEditFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handlePetitionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPetitionDocuments(prev => [...prev, ...files]);
  };

  const handleComplementaryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setComplementaryDocuments(prev => [...prev, ...files]);
  };

  const removePetitionDocument = (index: number) => {
    setPetitionDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const removeComplementaryDocument = (index: number) => {
    setComplementaryDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const formatFileSize = (bytes: number) => {
    return bytes < 1024 * 1024 
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSaveChanges = async () => {
    if (selectedProtocol) {
      try {
        let updatedDocuments = selectedProtocol.documents;

        // Se novos documentos foram adicionados, converter para base64 e adicionar
        if (petitionDocuments.length > 0 || complementaryDocuments.length > 0) {
          const newPetitionDocs = await Promise.all(
            petitionDocuments.map(async (file) => ({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              name: file.name,
              size: file.size,
              type: file.type,
              content: await fileToBase64(file),
              category: 'petition' as const,
            }))
          );

          const newComplementaryDocs = await Promise.all(
            complementaryDocuments.map(async (file) => ({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              name: file.name,
              size: file.size,
              type: file.type,
              content: await fileToBase64(file),
              category: 'complementary' as const,
            }))
          );

          // Manter documentos existentes e adicionar novos
          updatedDocuments = [...selectedProtocol.documents, ...newPetitionDocs, ...newComplementaryDocs];
        }

        // Determinar se deve ir para fila manual (se tem observações)
        const assignedTo = determineQueueAssignment(editFormData);

        const updates = {
          ...editFormData,
          documents: updatedDocuments,
          status: 'Aguardando' as const,
          assignedTo,
          returnReason: undefined, // Limpar motivo da devolução
        };

        updateProtocol(selectedProtocol.id, updates, userEmails[user!.id] || user!.email);
        handleCloseModal();
      } catch (error) {
        console.error('Erro ao salvar alterações:', error);
      }
    }
  };

  // Função para determinar automaticamente para qual fila enviar o protocolo
  const determineQueueAssignment = (data: typeof editFormData): 'Carlos' | 'Deyse' | null => {
    // Se tem observações, vai para o Carlos
    if (data.observations.trim()) {
      return 'Carlos';
    }

    // Se é 2º grau, vai para o Carlos
    if (data.jurisdiction === '2º Grau') {
      return 'Carlos';
    }

    // Verificar se o sistema/tribunal se encaixa nos parâmetros do robô
    const isRobotEligible = checkRobotEligibility(data.system, data.court);
    
    // Se não se encaixa nos parâmetros do robô, vai para o Carlos
    if (!isRobotEligible) {
      return 'Carlos';
    }

    // Se passou por todas as verificações, vai para a fila do robô (null)
    return null;
  };

  // Função para verificar se o protocolo é elegível para a fila do robô
  const checkRobotEligibility = (system: string, court: string): boolean => {
    // PJe Diversos (todos os PJe exceto MG)
    if (system === 'PJe' && court !== 'Tribunal de Justiça de Minas Gerais') {
      return true;
    }

    // PJe MG (apenas PJe de Minas Gerais)
    if (system === 'PJe' && court === 'Tribunal de Justiça de Minas Gerais') {
      return true;
    }

    // ESAJ SP (apenas ESAJ de São Paulo)
    if (system === 'ESAJ' && court === 'Tribunal de Justiça de São Paulo') {
      return true;
    }

    // eProc RS/SC
    if (system === 'eProc' && (
      court === 'Tribunal de Justiça do Rio Grande do Sul' ||
      court === 'Tribunal de Justiça de Santa Catarina'
    )) {
      return true;
    }

    // Projudi PR
    if (system === 'Projudi' && court === 'Tribunal de Justiça do Paraná') {
      return true;
    }

    // Se não se encaixa em nenhum dos critérios acima, não é elegível para o robô
    return false;
  };

  const handleResubmitWithoutChanges = () => {
    if (selectedProtocol) {
      // Reenviar protocolo sem alterações - volta para status "Aguardando"
      const updates = {
        status: 'Aguardando' as const,
        returnReason: undefined, // Limpar motivo da devolução
      };
      updateProtocol(selectedProtocol.id, updates, userEmails[user!.id] || user!.email);
      handleCloseModal();
    }
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
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Protocolos Devolvidos</h2>
          <p className="text-sm text-gray-600">Protocolos que foram devolvidos para correção</p>
        </div>
        <button
          onClick={handleRefreshQueue}
          disabled={isRefreshing}
          className="flex items-center px-3 py-2 text-sm font-medium text-orange-600 bg-orange-100 hover:bg-orange-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Atualizar lista de protocolos devolvidos"
        >
          <RotateCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar Lista'}
        </button>
      </div>

      {returnedProtocols.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum protocolo devolvido</h3>
          <p className="text-gray-600">Todos os seus protocolos estão sendo processados corretamente!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-orange-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Processo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tribunal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo de Petição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Motivo da Devolução
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data da Devolução
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {returnedProtocols.map((protocol) => (
                <tr key={protocol.id} className="hover:bg-orange-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {protocol.processNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {protocol.court}
                    </div>
                    <div className="text-sm text-gray-500">
                      {protocol.jurisdiction}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {protocol.petitionType}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {protocol.returnReason || 'Não especificado'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(protocol.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleProtocolClick(protocol)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
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
      )}

      {/* Modal de Visualização do Protocolo Devolvido */}
      {isModalOpen && selectedProtocol && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style={{ zIndex: 1000 }}>
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            {!showActivityLog ? (
              <>
                {/* Header do Modal */}
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {isEditing ? 'Editar Protocolo Devolvido' : 'Protocolo Devolvido - Detalhes'}
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
                  <div className="flex items-center space-x-2">
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </button>
                    )}
                    <button
                      onClick={handleCloseModal}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Conteúdo Principal */}
                <div className="mt-4 space-y-4">
                  {!isEditing ? (
                    <>
                      {/* Alerta de Devolução */}
                      <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                        <div className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-medium text-orange-800">Protocolo Devolvido</h4>
                            <p className="text-sm text-orange-700 mt-1">
                              <strong>Motivo:</strong> {selectedProtocol.returnReason || 'Não especificado'}
                            </p>
                            <p className="text-xs text-orange-600 mt-1">
                              Devolvido em: {formatDate(selectedProtocol.updatedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Informações do Processo */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Número do Processo
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedProtocol.processNumber}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Tribunal
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedProtocol.court}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Sistema
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {selectedProtocol.system}
                            </span>
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Grau da Jurisdição
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedProtocol.jurisdiction}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Tipo de Petição
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedProtocol.petitionType}
                          </p>
                        </div>
                      </div>

                      {/* Observações */}
                      {selectedProtocol.observations && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Observações Originais
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
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

                      {/* Instruções para Correção */}
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Instruções para Correção:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Revise o motivo da devolução acima</li>
                          <li>• Clique em "Editar" para fazer correções necessárias</li>
                          <li>• Ou clique em "Reenviar sem Alterações" se não houver mudanças</li>
                          <li>• O protocolo voltará para a fila de processamento</li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Formulário de Edição */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                        <p className="text-sm text-yellow-800">
                          <strong>Editando protocolo devolvido:</strong> {selectedProtocol.returnReason}
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* Campos do formulário */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Número do Processo
                            </label>
                            <input
                              type="text"
                              name="processNumber"
                              value={editFormData.processNumber}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Grau da Jurisdição
                            </label>
                            <select
                              name="jurisdiction"
                              value={editFormData.jurisdiction}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Selecione o grau</option>
                              <option value="1º Grau">1º Grau</option>
                              <option value="2º Grau">2º Grau</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sistema do Tribunal
                          </label>
                          <select
                            name="system"
                            value={editFormData.system}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Selecione o sistema</option>
                            {TRIBUNAL_SYSTEMS.map(system => (
                              <option key={system} value={system}>{system}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tribunal
                          </label>
                          <select
                            name="court"
                            value={editFormData.court}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Selecione o tribunal</option>
                            {COURTS.map(court => (
                              <option key={court} value={court}>{court}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Petição
                          </label>
                          <select
                            name="petitionType"
                            value={editFormData.petitionType}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Selecione o tipo de petição</option>
                            {PETITION_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>

                        {/* Checkboxes */}
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              name="isFatal"
                              checked={editFormData.isFatal}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 text-sm text-gray-700">Fatal</label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              name="needsProcuration"
                              checked={editFormData.needsProcuration}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 text-sm text-gray-700">Necessita de procuração</label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Observações
                          </label>
                          <textarea
                            name="observations"
                            value={editFormData.observations}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Digite observações adicionais..."
                          />
                        </div>

                        {/* Upload de novos documentos */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Adicionar Novos Arquivos de Petição (opcional)
                            </label>
                            <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center bg-blue-50">
                              <input
                                type="file"
                                multiple
                                accept=".pdf,.docx,.doc,.txt"
                                onChange={handlePetitionUpload}
                                className="hidden"
                                id="edit-petition-upload"
                              />
                              <label htmlFor="edit-petition-upload" className="cursor-pointer">
                                <Upload className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                                <p className="text-sm text-blue-600">Clique para adicionar novos arquivos</p>
                              </label>
                            </div>
                            {petitionDocuments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {petitionDocuments.map((file, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                                    <span className="text-sm">{file.name}</span>
                                    <button
                                      onClick={() => removePetitionDocument(index)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Adicionar Novos Documentos Complementares (opcional)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                              <input
                                type="file"
                                multiple
                                accept=".pdf,.docx,.doc,.txt"
                                onChange={handleComplementaryUpload}
                                className="hidden"
                                id="edit-complementary-upload"
                              />
                              <label htmlFor="edit-complementary-upload" className="cursor-pointer">
                                <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Clique para adicionar novos arquivos</p>
                              </label>
                            </div>
                            {complementaryDocuments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {complementaryDocuments.map((file, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-sm">{file.name}</span>
                                    <button
                                      onClick={() => removeComplementaryDocument(index)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Botões de Ação */}
                  <div className="pt-4 border-t">
                    {!isEditing ? (
                      <div className="flex space-x-3">
                        <button
                          onClick={handleResubmitWithoutChanges}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Reenviar sem Alterações
                        </button>
                        <button
                          onClick={handleCloseModal}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Fechar
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-3">
                        <button
                          onClick={handleSaveChanges}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Salvar e Reenviar
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancelar Edição
                        </button>
                      </div>
                    )}
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
                      Status: Devolvido
                    </p>
                    <p className="text-xs text-gray-600">
                      Motivo: {selectedProtocol.returnReason || 'Não especificado'}
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

      {/* Informações sobre Devoluções */}
      <div className="mt-6 p-4 bg-orange-50 rounded-lg">
        <h3 className="font-medium text-orange-900 mb-2">Sobre Protocolos Devolvidos:</h3>
        <ul className="text-sm text-orange-800 space-y-1">
          <li>• Protocolos podem ser devolvidos por moderadores ou administradores</li>
          <li>• Sempre verifique o motivo da devolução antes de reenviar</li>
          <li>• Após correção, clique em "Reenviar Protocolo" para submeter novamente</li>
          <li>• O protocolo voltará para a fila de processamento normal</li>
        </ul>
      </div>
    </div>
  );
}