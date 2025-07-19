import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, AlertTriangle, FileCheck } from 'lucide-react';
import { COURTS, PETITION_TYPES, TRIBUNAL_SYSTEMS } from '../types';
import { useProtocols } from '../hooks/useProtocols';
import { useAuth } from '../contexts/AuthContext';
import { extractTribunalInfo, isValidCNJFormat } from '../utils/cnjMapping';

export function ProtocolForm() {
  const { addProtocol } = useProtocols();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
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
  };

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
        }));
        
        // Remove erros dos campos que foram preenchidos automaticamente
        setErrors(prev => ({
          ...prev,
          court: '',
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
    
    if (!formData.processNumber.trim()) newErrors.processNumber = 'Número do processo é obrigatório';
    if (!formData.court) newErrors.court = 'Tribunal é obrigatório';
    if (!formData.jurisdiction) newErrors.jurisdiction = 'Grau da jurisdição é obrigatório';
    if (!formData.system.trim()) newErrors.system = 'Sistema do tribunal é obrigatório';
    if (!formData.petitionType) newErrors.petitionType = 'Tipo de petição é obrigatório';
    if (petitionDocuments.length === 0) newErrors.petitionDocuments = 'Pelo menos um arquivo de petição deve ser anexado';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
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
      const assignedTo = determineQueueAssignment(formData);

      addProtocol({
        ...formData,
        createdBy: user!.id,
        documents: allDocuments,
        status: 'Aguardando',
        assignedTo,
      });

      setSubmitSuccess(true);
      setFormData({
        processNumber: '',
        court: '',
        system: '',
        jurisdiction: '',
        isFatal: false,
        needsProcuration: false,
        petitionType: '',
        observations: '',
      });
      setPetitionDocuments([]);
      setComplementaryDocuments([]);
      
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao enviar protocolo:', error);
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

  // Função para determinar automaticamente para qual fila enviar o protocolo
  const determineQueueAssignment = (data: typeof formData): 'Carlos' | 'Deyse' | null => {
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Envio de Protocolo</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="processNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Número do Processo *
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
                Número CNJ válido - Tribunal e sistema identificados automaticamente
              </p>
            )}
          </div>

          <div>
            <label htmlFor="jurisdiction" className="block text-sm font-medium text-gray-700 mb-2">
              Grau da Jurisdição *
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

        <div>
          <label htmlFor="system" className="block text-sm font-medium text-gray-700 mb-2">
            Sistema do Tribunal *
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
            O sistema é identificado automaticamente com base no número do processo CNJ, mas pode ser selecionado manualmente
          </p>
        </div>

        <div>
          <label htmlFor="court" className="block text-sm font-medium text-gray-700 mb-2">
            Tribunal *
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
            Tipo de Petição *
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
                const assignment = determineQueueAssignment(formData);
                if (assignment === 'Carlos') {
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
    </div>
  );
}