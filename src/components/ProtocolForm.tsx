import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, AlertTriangle, FileCheck, Plus, X } from 'lucide-react';
import { COURTS, PETITION_TYPES, TRIBUNAL_SYSTEMS, PROCURATION_TYPES, PROCESS_TYPES, ProtocolGuia } from '../types';
import { useProtocols } from '../hooks/useProtocols';
import { useAuth } from '../contexts/AuthContext';
import { extractTribunalInfo, isValidCNJFormat } from '../utils/cnjMapping';
import { checkRobotEligibility, determineQueueAssignment } from '../utils/protocolUtils';

export function ProtocolForm() {
  const { addProtocol } = useProtocols();
  const { user } = useAuth();
  const [isDistribution, setIsDistribution] = useState(false);
  const [formData, setFormData] = useState({
    processNumber: '',
    court: '',
    system: '',
    jurisdiction: '' as '' | '1º Grau' | '2º Grau',
    processType: '' as '' | 'civel' | 'trabalhista',
    isFatal: false,
    needsProcuration: false,
    procurationType: '',
    needsGuia: false,
    petitionType: '',
    observations: '',
  });
  const [petitionDocuments, setPetitionDocuments] = useState<File[]>([]);
  const [complementaryDocuments, setComplementaryDocuments] = useState<File[]>([]);
  const [guias, setGuias] = useState<ProtocolGuia[]>([]);
  const [customProcuration, setCustomProcuration] = useState('');
  const [customPetitionType, setCustomPetitionType] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Limpar campos relacionados quando desmarca checkboxes
    if (name === 'needsProcuration' && !checked) {
      setFormData(prev => ({ ...prev, procurationType: '' }));
      setCustomProcuration('');
    }
    if (name === 'needsGuia' && !checked) {
      setGuias([]);
    }
    if (name === 'petitionType' && value !== 'Outros') {
      setCustomPetitionType('');
    }
  };

  // Funções para gerenciar guias
  const addGuia = () => {
    const newGuia: ProtocolGuia = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      number: '',
      system: formData.system === 'ESAJ' ? 'ESAJ' : 'TJRJ Eletrônico'
    };
    setGuias(prev => [...prev, newGuia]);
  };

  const removeGuia = (id: string) => {
    setGuias(prev => prev.filter(guia => guia.id !== id));
  };

  const updateGuia = (id: string, number: string) => {
    setGuias(prev => prev.map(guia => 
      guia.id === id ? { ...guia, number } : guia
    ));
  };

  // Validação de formato de guia
  const validateGuiaFormat = (number: string, system: string): boolean => {
    if (system === 'ESAJ') {
      // Formato: 250590176268310-0001 (15 dígitos + hífen + 4 dígitos)
      return /^\d{15}-\d{4}$/.test(number);
    } else if (system === 'TJRJ Eletrônico') {
      // Formato: 61832908243-08 (11 dígitos + hífen + 2 dígitos)
      return /^\d{11}-\d{2}$/.test(number);
    }
    return false;
  };

  // Verificar se deve mostrar campos de guia
  const shouldShowGuiaFields = formData.system === 'ESAJ' || formData.system === 'TJRJ Eletrônico';

  const handleProcessNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const processNumber = e.target.value.trim();
    
    if (!processNumber) return;
    
    // Verifica se o número está no formato CNJ válido
    if (isValidCNJFormat(processNumber)) {
      const tribunalInfo = extractTribunalInfo(processNumber);
      
      if (tribunalInfo) {
        // Atualiza automaticamente o tribunal e grau de jurisdição
        setFormData(prev => ({
          ...prev,
          court: tribunalInfo.name,
          system: tribunalInfo.system,
          processType: tribunalInfo.processType,
        }));
        
        // Remove erros dos campos que foram preenchidos automaticamente
        setErrors(prev => ({
          ...prev,
          court: '',
          processType: '',
        }));
      }
    }
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Se não é distribuição, aplicar validações normais
    if (!isDistribution) {
      if (!formData.processNumber.trim()) newErrors.processNumber = 'Número do processo é obrigatório';
      if (!formData.court) newErrors.court = 'Tribunal é obrigatório';
      if (!formData.jurisdiction) newErrors.jurisdiction = 'Grau da jurisdição é obrigatório';
      if (!formData.processType) newErrors.processType = 'Tipo de processo é obrigatório';
      if (!formData.system.trim()) newErrors.system = 'Sistema do tribunal é obrigatório';
      if (!formData.petitionType) newErrors.petitionType = 'Tipo de petição é obrigatório';
      if (petitionDocuments.length === 0) newErrors.petitionDocuments = 'Pelo menos um arquivo de petição deve ser anexado';
    }

    // Validações condicionais
    if (formData.needsProcuration && !formData.procurationType) {
      newErrors.procurationType = 'Tipo de procuração é obrigatório';
    }
    if (formData.procurationType === 'Outros (especificar)' && !customProcuration.trim()) {
      newErrors.customProcuration = 'Especifique o tipo de procuração';
    }
    if (formData.petitionType === 'Outros' && !customPetitionType.trim()) {
      newErrors.customPetitionType = 'Especifique o tipo de petição';
    }
    if (formData.needsGuia && guias.length === 0) {
      newErrors.guias = 'Adicione pelo menos uma guia';
    }
    if (formData.needsGuia) {
      const invalidGuias = guias.filter(guia => !validateGuiaFormat(guia.number, guia.system));
      if (invalidGuias.length > 0) {
        newErrors.guias = 'Formato de guia inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Mostrar modal de confirmação
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);

    setIsSubmitting(true);
    console.log('🚀 Iniciando envio do protocolo...');
    console.log('🌐 Configuração atual:');
    console.log('   - Backend:', import.meta.env.VITE_API_BASE_URL);
    console.log('   - Frontend:', window.location.origin);
    console.log('   - Usuário:', user?.email);
    
    try {
      // Validação adicional antes do envio
      if (!user?.id) {
        throw new Error('Usuário não identificado. Faça login novamente.');
      }
      
      // Verificar se a URL do backend está configurada
      if (!import.meta.env.VITE_API_BASE_URL) {
        console.error('❌ VITE_API_BASE_URL não configurada');
        console.error('❌ Variáveis disponíveis:', import.meta.env);
        throw new Error('ERRO DE CONFIGURAÇÃO: O sistema não está configurado para funcionar online. Entre em contato com o administrador do sistema.');
      }
      
      console.log('🔧 Configuração do sistema:');
      console.log('   - Backend:', import.meta.env.VITE_API_BASE_URL);
      console.log('   - Frontend:', window.location.origin);
      console.log('   - Usuário:', user?.email);
      console.log('   - Modo:', import.meta.env.MODE);
      
      // Converter arquivos de petição para base64
      const petitionProtocolDocuments = await Promise.all(
        petitionDocuments.map(async (file) => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          content: await fileToBase64(file),
          category: 'petition' as const,
        }))
      );

      // Converter arquivos complementares para base64
      const complementaryProtocolDocuments = await Promise.all(
        complementaryDocuments.map(async (file) => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          content: await fileToBase64(file),
          category: 'complementary' as const,
        }))
      );

      // Combinar todos os documentos
      const allDocuments = [...petitionProtocolDocuments, ...complementaryProtocolDocuments];

      // Lógica de direcionamento automático
      const assignedTo = determineQueueAssignment(formData, isDistribution);

      // Preparar tipo de procuração final
      const finalProcurationType = formData.procurationType === 'Outros (especificar)' 
        ? customProcuration.trim() 
        : formData.procurationType;

      // Preparar tipo de petição final
      const finalPetitionType = formData.petitionType === 'Outros'
        ? customPetitionType.trim()
        : formData.petitionType;

      const protocolData = {
        ...formData,
        petitionType: finalPetitionType,
        procurationType: formData.needsProcuration ? finalProcurationType : undefined,
        guias: formData.needsGuia ? guias : [],
        createdBy: user!.id,
        documents: allDocuments,
        status: 'Aguardando',
        assignedTo,
        isDistribution,
      };
      
      console.log('📋 Dados do protocolo preparados:', protocolData);
      
      // Verificar se os dados essenciais estão presentes
      if (!protocolData.createdBy) {
        throw new Error('Erro interno: ID do usuário não encontrado');
      }
      
      const result = await addProtocol(protocolData);
      console.log('✅ Protocolo adicionado:', result);

      setSubmitSuccess(true);
      
      // Mostrar mensagem de sucesso com informação sobre sincronização
      console.log('🌐 Protocolo salvo no servidor e sincronizado com todos os usuários');
      
      setFormData({
        processNumber: '',
        court: '',
        system: '',
        jurisdiction: '',
        processType: '',
        isFatal: false,
        needsProcuration: false,
        procurationType: '',
        needsGuia: false,
        petitionType: '',
        observations: '',
      });
      setPetitionDocuments([]);
      setComplementaryDocuments([]);
      setGuias([]);
      setCustomProcuration('');
      setCustomPetitionType('');
      setIsDistribution(false);
      
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('❌ Erro ao enviar protocolo:', error);
      
      // Mostrar erro mais amigável para o usuário
      const errorMessage = error.message || 'Erro desconhecido';
      
      // Criar modal de erro mais amigável
      const errorModal = document.createElement('div');
      errorModal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
      errorModal.innerHTML = `
        <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <div class="flex items-center mb-4">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h3 class="text-lg font-medium text-gray-900 text-center mb-4">Erro ao Enviar Protocolo</h3>
            <div class="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p class="text-sm text-red-800 whitespace-pre-line">${errorMessage}</p>
            </div>
            <div class="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p class="text-xs text-yellow-800">
                <strong>O protocolo NÃO foi salvo.</strong><br>
                Possíveis soluções:<br>
                • Verifique sua conexão com a internet<br>
                • Tente novamente em alguns minutos<br>
                • Se o problema persistir, entre em contato com o suporte
              </p>
            </div>
            <div class="flex justify-center">
              <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(errorModal);
      
      // Remover modal após 10 segundos
      setTimeout(() => {
        if (errorModal.parentNode) {
          errorModal.parentNode.removeChild(errorModal);
        }
      }, 10000);
    } finally {
      setIsSubmitting(false);
    }
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

  if (submitSuccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Protocolo enviado com sucesso!</h3>
          <p className="text-gray-600">O protocolo foi adicionado à fila para peticionamento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Envio de Protocolo</h2>
        
        {/* Checkbox de Distribuição */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isDistribution"
            checked={isDistribution}
            onChange={(e) => setIsDistribution(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isDistribution" className="ml-2 text-sm font-medium text-gray-700">
            É uma distribuição?
          </label>
        </div>
      </div>
      
      {/* Aviso sobre distribuição */}
      {isDistribution && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Modo Distribuição Ativado</p>
              <p>Nenhum campo é obrigatório. Campos vazios aparecerão como " - " nos detalhes.</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="processNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Número do Processo {!isDistribution && '*'}
            </label>
            <input
              type="text"
              id="processNumber"
              name="processNumber"
              value={formData.processNumber}
              onChange={handleInputChange}
              onBlur={handleProcessNumberBlur}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.processNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: 0000000-00.0000.0.00.0000"
            />
            {errors.processNumber && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.processNumber}
              </p>
            )}
            {formData.processNumber && isValidCNJFormat(formData.processNumber) && (
              <p className="mt-1 text-sm text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Número CNJ válido - Tribunal, sistema e tipo identificados automaticamente
              </p>
            )}
          </div>

          <div>
            <label htmlFor="jurisdiction" className="block text-sm font-medium text-gray-700 mb-2">
              Grau da Jurisdição {!isDistribution && '*'}
            </label>
            <select
              id="jurisdiction"
              name="jurisdiction"
              value={formData.jurisdiction}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.jurisdiction ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Selecione o grau</option>
              <option value="1º Grau">1º Grau</option>
              <option value="2º Grau">2º Grau</option>
            </select>
            {errors.jurisdiction && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.jurisdiction}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="processType" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Processo {!isDistribution && '*'}
            </label>
            <select
              id="processType"
              name="processType"
              value={formData.processType}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.processType ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Selecione o tipo</option>
              {PROCESS_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            {errors.processType && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.processType}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              O tipo é identificado automaticamente com base no número do processo CNJ
            </p>
          </div>

          <div>
            <label htmlFor="system" className="block text-sm font-medium text-gray-700 mb-2">
              Sistema do Tribunal {!isDistribution && '*'}
            </label>
            <select
              id="system"
              name="system"
              value={formData.system}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.system ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Selecione o sistema</option>
              {TRIBUNAL_SYSTEMS.map(system => (
                <option key={system} value={system}>{system}</option>
              ))}
            </select>
            {errors.system && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.system}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              O sistema é identificado automaticamente com base no número do processo CNJ
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="court" className="block text-sm font-medium text-gray-700 mb-2">
            Tribunal {!isDistribution && '*'}
          </label>
          <select
            id="court"
            name="court"
            value={formData.court}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.court ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Selecione o tribunal</option>
            {COURTS.map(court => (
              <option key={court} value={court}>{court}</option>
            ))}
          </select>
          {errors.court && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.court}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="petitionType" className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Petição {!isDistribution && '*'}
          </label>
          <select
            id="petitionType"
            name="petitionType"
            value={formData.petitionType}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.petitionType ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Selecione o tipo de petição</option>
            {PETITION_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.petitionType && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.petitionType}
            </p>
          )}
          
          {/* Campo para especificar "Outros" */}
          {formData.petitionType === 'Outros' && (
            <div className="mt-3">
              <label htmlFor="customPetitionType" className="block text-sm font-medium text-gray-700 mb-2">
                Especificar Tipo de Petição *
              </label>
              <input
                type="text"
                id="customPetitionType"
                value={customPetitionType}
                onChange={(e) => setCustomPetitionType(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.customPetitionType ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Digite o tipo de petição"
              />
              {errors.customPetitionType && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.customPetitionType}
                </p>
              )}
            </div>
          )}
          
          {/* Campo para especificar "Outros" */}
          {formData.petitionType === 'Outros (especificar)' && (
            <div className="mt-3">
              <label htmlFor="customPetitionType" className="block text-sm font-medium text-gray-700 mb-2">
                Especificar Tipo de Petição *
              </label>
              <input
                type="text"
                id="customPetitionType"
                value={customPetitionType}
                onChange={(e) => setCustomPetitionType(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.customPetitionType ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Digite o tipo de petição"
              />
              {errors.customPetitionType && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.customPetitionType}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Checkboxes */}
        <div className="space-y-4">
          {/* Checkbox Fatal */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isFatal"
              name="isFatal"
              checked={formData.isFatal}
              onChange={handleInputChange}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="isFatal" className="ml-2 flex items-center text-sm font-medium text-gray-700">
              <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
              Fatal
            </label>
          </div>

          {/* Checkbox Procuração */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="needsProcuration"
              name="needsProcuration"
              checked={formData.needsProcuration}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="needsProcuration" className="ml-2 flex items-center text-sm font-medium text-gray-700">
              <FileCheck className="h-4 w-4 text-blue-500 mr-1" />
              Necessita de procuração?
            </label>
          </div>

          {/* Campo Tipo de Procuração (condicional) */}
          {formData.needsProcuration && (
            <div className="ml-6 space-y-3">
              <div>
                <label htmlFor="procurationType" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Procuração *
                </label>
                <select
                  id="procurationType"
                  name="procurationType"
                  value={formData.procurationType}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.procurationType ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione o tipo de procuração</option>
                  {PROCURATION_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.procurationType && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.procurationType}
                  </p>
                )}
              </div>

              {/* Campo para especificar "Outros" */}
              {formData.procurationType === 'Outros (especificar)' && (
                <div>
                  <label htmlFor="customProcuration" className="block text-sm font-medium text-gray-700 mb-2">
                    Especificar Procuração *
                  </label>
                  <input
                    type="text"
                    id="customProcuration"
                    value={customProcuration}
                    onChange={(e) => setCustomProcuration(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.customProcuration ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Digite o tipo de procuração"
                  />
                  {errors.customProcuration && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.customProcuration}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Checkbox Guia (apenas para ESAJ e TJRJ) */}
          {shouldShowGuiaFields && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="needsGuia"
                name="needsGuia"
                checked={formData.needsGuia}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="needsGuia" className="ml-2 flex items-center text-sm font-medium text-gray-700">
                <FileText className="h-4 w-4 text-green-500 mr-1" />
                Cadastrar guia de recolhimento?
              </label>
            </div>
          )}

          {/* Campos de Guias (condicional) */}
          {formData.needsGuia && shouldShowGuiaFields && (
            <div className="ml-6 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Guias de Recolhimento *
                </label>
                <button
                  type="button"
                  onClick={addGuia}
                  className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Guia
                </button>
              </div>

              {guias.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  Clique em "Adicionar Guia" para cadastrar uma guia de recolhimento
                </p>
              )}

              {guias.map((guia, index) => (
                <div key={guia.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">
                      Guia #{index + 1} - {guia.system}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeGuia(guia.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={guia.number}
                      onChange={(e) => updateGuia(guia.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder={
                        guia.system === 'ESAJ' 
                          ? 'Ex: 250590176268310-0001' 
                          : 'Ex: 61832908243-08'
                      }
                    />
                    <p className="mt-1 text-xs text-gray-600">
                      Formato {guia.system}: {
                        guia.system === 'ESAJ' 
                          ? '15 dígitos + hífen + 4 dígitos' 
                          : '11 dígitos + hífen + 2 dígitos'
                      }
                    </p>
                    {guia.number && !validateGuiaFormat(guia.number, guia.system) && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Formato inválido para {guia.system}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {errors.guias && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.guias}
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-2">
            Observações (opcional)
          </label>
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Atenção:</p>
                <p>Protocolos com observações, de 2º grau ou sistemas não suportados pelo robô serão automaticamente direcionados para a fila do Carlos.</p>
              </div>
            </div>
          </div>
          <textarea
            id="observations"
            name="observations"
            value={formData.observations}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite observações adicionais..."
          />
          
          {/* Indicador de direcionamento automático */}
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              <strong>Direcionamento automático:</strong> {(() => {
                const assignment = determineQueueAssignment(formData, isDistribution);
                if (assignment === 'Carlos') {
                  if (isDistribution) return 'Fila do Carlos (distribuição)';
                  if (formData.observations.trim()) return 'Fila do Carlos (tem observações)';
                  if (formData.jurisdiction === '2º Grau') return 'Fila do Carlos (2º grau)';
                  if (formData.system && formData.court && !checkRobotEligibility(formData.system, formData.court)) {
                    return 'Fila do Carlos (sistema não suportado pelo robô)';
                  }
                  return 'Fila do Carlos';
                }
                return 'Fila do Robô (automática)';
              })()}
            </p>
          </div>
        </div>

        {/* Seção de Petição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Arquivos da Petição *
          </label>
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50">
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt"
              onChange={handlePetitionUpload}
              className="hidden"
              id="petition-upload"
            />
            <label
              htmlFor="petition-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="h-8 w-8 text-blue-400 mb-2" />
              <p className="text-sm text-blue-600 font-medium">
                Clique para anexar arquivos da petição
              </p>
              <p className="text-xs text-blue-500 mt-1">
                PDF, DOCX, DOC, TXT (máx. 10MB por arquivo)
              </p>
            </label>
          </div>
          
          {petitionDocuments.length > 0 && (
            <div className="mt-4 space-y-2">
              {petitionDocuments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePetitionDocument(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {errors.petitionDocuments && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.petitionDocuments}
            </p>
          )}
        </div>

        {/* Seção de Documentos Complementares */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Documentos Complementares (opcional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleComplementaryUpload}
              className="hidden"
              id="complementary-upload"
            />
            <label
              htmlFor="complementary-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                Clique para anexar documentos complementares
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Provas, certidões, etc. (PDF, DOCX, DOC, TXT)
              </p>
            </label>
          </div>
          
          {complementaryDocuments.length > 0 && (
            <div className="mt-4 space-y-2">
              {complementaryDocuments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
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

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Enviando...
              </>
            ) : (
              'Enviar Protocolo'
            )}
          </button>
        </div>
      </form>

      {/* Modal de Confirmação */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirmar Envio do Protocolo
              </h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Por favor, confirme as informações do protocolo:</strong>
                </p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Número do Processo</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{formData.processNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Grau da Jurisdição</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{formData.jurisdiction}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Processo</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {formData.processType === 'civel' ? 'Cível' : formData.processType === 'trabalhista' ? 'Trabalhista' : formData.processType}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tribunal</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{formData.court}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sistema</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{formData.system}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Tipo de Petição</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {formData.petitionType === 'Outros' ? customPetitionType : formData.petitionType}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fatal</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {formData.isFatal ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Procuração</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {formData.needsProcuration ? 'Sim' : 'Não'}
                    </p>
                  </div>
                </div>

                {formData.needsProcuration && formData.procurationType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Procuração</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {formData.procurationType === 'Outros (especificar)' ? customProcuration : formData.procurationType}
                    </p>
                  </div>
                )}

                {formData.observations && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Observações</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{formData.observations}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Documentos</label>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-sm text-gray-900">
                      {petitionDocuments.length} arquivo(s) de petição
                    </p>
                    {complementaryDocuments.length > 0 && (
                      <p className="text-sm text-gray-900">
                        {complementaryDocuments.length} documento(s) complementar(es)
                      </p>
                    )}
                  </div>
                </div>

                {/* Indicador de direcionamento */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Será direcionado para:</strong> {(() => {
                      const assignment = determineQueueAssignment(formData, isDistribution);
                      if (assignment === 'Carlos') {
                        if (isDistribution) return 'Fila do Carlos (distribuição)';
                        if (formData.observations.trim()) return 'Fila do Carlos (tem observações)';
                        if (formData.jurisdiction === '2º Grau') return 'Fila do Carlos (2º grau)';
                        if (formData.system && formData.court && !checkRobotEligibility(formData.system, formData.court)) {
                          return 'Fila do Carlos (sistema não suportado pelo robô)';
                        }
                        return 'Fila do Carlos';
                      }
                      return 'Fila do Robô (automática)';
                    })()}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Enviando...' : 'Confirmar e Enviar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}