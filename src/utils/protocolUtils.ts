// Utilitários para gerenciamento de protocolos

export interface FormData {
  processNumber: string;
  court: string;
  system: string;
  jurisdiction: '' | '1º Grau' | '2º Grau';
  processType: '' | 'civel' | 'trabalhista';
  isFatal: boolean;
  needsProcuration: boolean;
  procurationType: string;
  needsGuia: boolean;
  petitionType: string;
  observations: string;
}

/**
 * Função para verificar se o protocolo é elegível para a fila do robô
 */
export const checkRobotEligibility = (system: string, court: string): boolean => {
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

/**
 * Função para determinar automaticamente para qual fila enviar o protocolo
 */
export const determineQueueAssignment = (
  data: FormData, 
  isDistribution: boolean = false,
  isResubmission: boolean = false,
  previousAssignedTo?: 'Carlos' | 'Deyse' | null
): 'Carlos' | 'Deyse' | null => {
  // Se é uma resubmissão (protocolo devolvido sendo reenviado), sempre vai para Carlos
  if (isResubmission) {
    return 'Carlos';
  }

  // Se é distribuição, sempre vai para o Carlos
  if (isDistribution) {
    return 'Carlos';
  }

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