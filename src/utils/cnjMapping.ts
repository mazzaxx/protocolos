// Mapeamento dos códigos CNJ para tribunais e graus de jurisdição
// Baseado no padrão CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO

export interface TribunalInfo {
  name: string;
  system: string;
  processType: 'civel' | 'trabalhista';
}

// Mapeamento por Justiça (J) e Tribunal (TR)
export const CNJ_MAPPING: Record<string, Record<string, TribunalInfo>> = {
  // Justiça Estadual (8)
  '8': {
    '26': { name: 'Tribunal de Justiça de São Paulo', system: 'ESAJ', processType: 'civel' },
    '19': { name: 'Tribunal de Justiça do Rio de Janeiro', system: 'TJRJ Eletrônico', processType: 'civel' },
    '13': { name: 'Tribunal de Justiça de Minas Gerais', system: 'PJe', processType: 'civel' },
    '09': { name: 'Tribunal de Justiça do Paraná', system: 'Projudi', processType: 'civel' },
    '21': { name: 'Tribunal de Justiça do Rio Grande do Sul', system: 'eProc', processType: 'civel' },
    '02': { name: 'Tribunal de Justiça de Alagoas', system: 'ESAJ', processType: 'civel' },
    '17': { name: 'Tribunal de Justiça de Pernambuco', system: 'PJe', processType: 'civel' },
    '05': { name: 'Tribunal de Justiça da Bahia', system: 'Projudi', processType: 'civel' },
    '06': { name: 'Tribunal de Justiça do Ceará', system: 'ESAJ', processType: 'civel' },
    '07': { name: 'Tribunal de Justiça do Distrito Federal e Territórios', system: 'PJe', processType: 'civel' },
    '14': { name: 'Tribunal de Justiça do Mato Grosso do Sul', system: 'ESAJ', processType: 'civel' },
    '11': { name: 'Tribunal de Justiça do Mato Grosso', system: 'PJe', processType: 'civel' },
    '08': { name: 'Tribunal de Justiça do Espírito Santo', system: 'PJe', processType: 'civel' },
    '10': { name: 'Tribunal de Justiça do Maranhão', system: 'PJe', processType: 'civel' },
    '16': { name: 'Tribunal de Justiça do Pará', system: 'PJe', processType: 'civel' },
    '15': { name: 'Tribunal de Justiça da Paraíba', system: 'PJe', processType: 'civel' },
    '18': { name: 'Tribunal de Justiça do Piauí', system: 'PJe', processType: 'civel' },
    '20': { name: 'Tribunal de Justiça de Rondônia', system: 'PJe', processType: 'civel' },
    '23': { name: 'Tribunal de Justiça de Santa Catarina', system: 'eProc', processType: 'civel' },
    '24': { name: 'Tribunal de Justiça de Sergipe', system: 'Portal do Adv', processType: 'civel' },
    '27': { name: 'Tribunal de Justiça de Tocantins', system: 'eProc', processType: 'civel' },
    '04': { name: 'Tribunal de Justiça do Amazonas', system: 'ESAJ', processType: 'civel' },
    '12': { name: 'Tribunal de Justiça de Goiás', system: 'Projudi', processType: 'civel' },
    '01': { name: 'Tribunal de Justiça do Acre', system: 'ESAJ', processType: 'civel' },
    '03': { name: 'Tribunal de Justiça do Amapá', system: 'PJe', processType: 'civel' },
    '22': { name: 'Tribunal de Justiça de Roraima', system: 'Projudi', processType: 'civel' },
  },
  
  // Justiça Federal (4)
  '4': {
    '01': { name: 'Tribunal Regional Federal da 1ª Região', system: 'PJe', processType: 'civel' },
    '02': { name: 'Tribunal Regional Federal da 2ª Região', system: 'PJe', processType: 'civel' },
    '03': { name: 'Tribunal Regional Federal da 3ª Região', system: 'PJe', processType: 'civel' },
    '04': { name: 'Tribunal Regional Federal da 4ª Região', system: 'PJe', processType: 'civel' },
    '05': { name: 'Tribunal Regional Federal da 5ª Região', system: 'PJe', processType: 'civel' },
    '06': { name: 'Tribunal Regional Federal da 6ª Região', system: 'PJe', processType: 'civel' },
  },
  
  // Justiça do Trabalho (5)
  '5': {
    '01': { name: 'Tribunal Regional do Trabalho da 1ª Região (RJ)', system: 'PJe', processType: 'trabalhista' },
    '02': { name: 'Tribunal Regional do Trabalho da 2ª Região (SP)', system: 'PJe', processType: 'trabalhista' },
    '03': { name: 'Tribunal Regional do Trabalho da 3ª Região (MG)', system: 'PJe', processType: 'trabalhista' },
    '04': { name: 'Tribunal Regional do Trabalho da 4ª Região (RS)', system: 'PJe', processType: 'trabalhista' },
    '05': { name: 'Tribunal Regional do Trabalho da 5ª Região (BA)', system: 'PJe', processType: 'trabalhista' },
    '06': { name: 'Tribunal Regional do Trabalho da 6ª Região (PE)', system: 'PJe', processType: 'trabalhista' },
    '07': { name: 'Tribunal Regional do Trabalho da 7ª Região (CE)', system: 'PJe', processType: 'trabalhista' },
    '08': { name: 'Tribunal Regional do Trabalho da 8ª Região (PA)', system: 'PJe', processType: 'trabalhista' },
    '09': { name: 'Tribunal Regional do Trabalho da 9ª Região (PR)', system: 'PJe', processType: 'trabalhista' },
    '10': { name: 'Tribunal Regional do Trabalho da 10ª Região (DF)', system: 'PJe', processType: 'trabalhista' },
    '11': { name: 'Tribunal Regional do Trabalho da 11ª Região (AM)', system: 'PJe', processType: 'trabalhista' },
    '12': { name: 'Tribunal Regional do Trabalho da 12ª Região (SC)', system: 'PJe', processType: 'trabalhista' },
    '13': { name: 'Tribunal Regional do Trabalho da 13ª Região (PB)', system: 'PJe', processType: 'trabalhista' },
    '14': { name: 'Tribunal Regional do Trabalho da 14ª Região (RO)', system: 'PJe', processType: 'trabalhista' },
    '15': { name: 'Tribunal Regional do Trabalho da 15ª Região (SP)', system: 'PJe', processType: 'trabalhista' },
    '16': { name: 'Tribunal Regional do Trabalho da 16ª Região (MA)', system: 'PJe', processType: 'trabalhista' },
    '17': { name: 'Tribunal Regional do Trabalho da 17ª Região (ES)', system: 'PJe', processType: 'trabalhista' },
    '18': { name: 'Tribunal Regional do Trabalho da 18ª Região (GO)', system: 'PJe', processType: 'trabalhista' },
    '19': { name: 'Tribunal Regional do Trabalho da 19ª Região (AL)', system: 'PJe', processType: 'trabalhista' },
    '20': { name: 'Tribunal Regional do Trabalho da 20ª Região (SE)', system: 'PJe', processType: 'trabalhista' },
    '21': { name: 'Tribunal Regional do Trabalho da 21ª Região (RN)', system: 'PJe', processType: 'trabalhista' },
    '22': { name: 'Tribunal Regional do Trabalho da 22ª Região (PI)', system: 'PJe', processType: 'trabalhista' },
    '23': { name: 'Tribunal Regional do Trabalho da 23ª Região (MT)', system: 'PJe', processType: 'trabalhista' },
    '24': { name: 'Tribunal Regional do Trabalho da 24ª Região (MS)', system: 'PJe', processType: 'trabalhista' },
  },
  
  // Tribunais Superiores (1)
  '1': {
    '00': { name: 'Supremo Tribunal Federal', system: 'PJe', processType: 'civel' },
    '01': { name: 'Superior Tribunal de Justiça', system: 'PJe', processType: 'civel' },
    '02': { name: 'Tribunal Superior do Trabalho', system: 'PJe', processType: 'trabalhista' },
    '03': { name: 'Superior Tribunal Militar', system: 'PJe', processType: 'civel' },
    '04': { name: 'Tribunal Superior Eleitoral', system: 'PJe', processType: 'civel' },
  },
  
  // Justiça Eleitoral (3)
  '3': {
    '01': { name: 'Tribunal Regional Eleitoral do Acre', system: 'PJe', processType: 'civel' },
    '02': { name: 'Tribunal Regional Eleitoral de Alagoas', system: 'PJe', processType: 'civel' },
    '03': { name: 'Tribunal Regional Eleitoral do Amapá', system: 'PJe', processType: 'civel' },
    '04': { name: 'Tribunal Regional Eleitoral do Amazonas', system: 'PJe', processType: 'civel' },
    '05': { name: 'Tribunal Regional Eleitoral da Bahia', system: 'PJe', processType: 'civel' },
    '06': { name: 'Tribunal Regional Eleitoral do Ceará', system: 'PJe', processType: 'civel' },
    '07': { name: 'Tribunal Regional Eleitoral do Distrito Federal', system: 'PJe', processType: 'civel' },
    '08': { name: 'Tribunal Regional Eleitoral do Espírito Santo', system: 'PJe', processType: 'civel' },
    '09': { name: 'Tribunal Regional Eleitoral de Goiás', system: 'PJe', processType: 'civel' },
    '10': { name: 'Tribunal Regional Eleitoral do Maranhão', system: 'PJe', processType: 'civel' },
    '11': { name: 'Tribunal Regional Eleitoral do Mato Grosso', system: 'PJe', processType: 'civel' },
    '12': { name: 'Tribunal Regional Eleitoral do Mato Grosso do Sul', system: 'PJe', processType: 'civel' },
    '13': { name: 'Tribunal Regional Eleitoral de Minas Gerais', system: 'PJe', processType: 'civel' },
    '14': { name: 'Tribunal Regional Eleitoral do Pará', system: 'PJe', processType: 'civel' },
    '15': { name: 'Tribunal Regional Eleitoral da Paraíba', system: 'PJe', processType: 'civel' },
    '16': { name: 'Tribunal Regional Eleitoral do Paraná', system: 'PJe', processType: 'civel' },
    '17': { name: 'Tribunal Regional Eleitoral de Pernambuco', system: 'PJe', processType: 'civel' },
    '18': { name: 'Tribunal Regional Eleitoral do Piauí', system: 'PJe', processType: 'civel' },
    '19': { name: 'Tribunal Regional Eleitoral do Rio de Janeiro', system: 'PJe', processType: 'civel' },
    '20': { name: 'Tribunal Regional Eleitoral do Rio Grande do Norte', system: 'PJe', processType: 'civel' },
    '21': { name: 'Tribunal Regional Eleitoral do Rio Grande do Sul', system: 'PJe', processType: 'civel' },
    '22': { name: 'Tribunal Regional Eleitoral de Rondônia', system: 'PJe', processType: 'civel' },
    '23': { name: 'Tribunal Regional Eleitoral de Roraima', system: 'PJe', processType: 'civel' },
    '24': { name: 'Tribunal Regional Eleitoral de Santa Catarina', system: 'PJe', processType: 'civel' },
    '25': { name: 'Tribunal Regional Eleitoral de São Paulo', system: 'PJe', processType: 'civel' },
    '26': { name: 'Tribunal Regional Eleitoral de Sergipe', system: 'PJe', processType: 'civel' },
    '27': { name: 'Tribunal Regional Eleitoral de Tocantins', system: 'PJe', processType: 'civel' },
  },
  
  // Justiça Militar (2)
  '2': {
    '01': { name: 'Tribunal de Justiça Militar do Estado de Minas Gerais', system: 'PJe', processType: 'civel' },
    '02': { name: 'Tribunal de Justiça Militar do Estado do Rio Grande do Sul', system: 'PJe', processType: 'civel' },
    '03': { name: 'Tribunal de Justiça Militar do Estado de São Paulo', system: 'PJe', processType: 'civel' },
  },
};

/**
 * Determina o sistema específico baseado nas regras complexas de cada tribunal
 * @param processNumber Número do processo no formato CNJ
 * @param tribunalCode Código do tribunal (TR)
 * @param sequentialNumber Número sequencial do processo (NNNNNNN)
 * @param year Ano do processo (AAAA)
 * @param origin Código da origem (OOOO)
 * @returns Sistema específico ou sistema padrão
 */
function determineSpecificSystem(
  processNumber: string,
  tribunalCode: string,
  sequentialNumber: string,
  year: string,
  origin: string
): string {
  const firstDigitSequential = sequentialNumber.charAt(0);
  const firstTwoDigitsSequential = sequentialNumber.substring(0, 2);
  const firstThreeDigitsSequential = sequentialNumber.substring(0, 3);
  
  switch (tribunalCode) {
    case '04': // Amazonas
      // Se o final for .1000 é projudi, demais casos esaj
      return origin === '1000' ? 'Projudi' : 'ESAJ';
      
    case '05': // Bahia
      // Se começar com 8 é PJE, demais casos projudi
      return firstDigitSequential === '8' ? 'PJe' : 'Projudi';
      
    case '06': // Ceará
      // Se começar com 3 é PJe, demais casos esaj
      return firstDigitSequential === '3' ? 'PJe' : 'ESAJ';
      
    case '13': // Minas Gerais
      // Se começar com 5 ou 6 é pje, se começar com 1 e o ano for 2025 é eproc
      if (firstDigitSequential === '5' || firstDigitSequential === '6') {
        return 'PJe';
      }
      if (firstDigitSequential === '1' && year === '2025') {
        return 'eProc';
      }
      return 'PJe'; // padrão para MG
      
    case '19': // Rio de Janeiro
      // Se começar com 08, 09, 008 ou 009 é PJe RJ, demais casos é TJRJ Eletrônico
      if (firstTwoDigitsSequential === '08' || firstTwoDigitsSequential === '09' ||
          firstThreeDigitsSequential === '008' || firstThreeDigitsSequential === '009') {
        return 'PJe';
      }
      return 'TJRJ Eletrônico';
      
    case '26': // São Paulo
      // Se começar com 4 é eproc sp. Demais casos ESAJ
      return firstDigitSequential === '4' ? 'eProc SP' : 'ESAJ';
      
    default:
      // Para outros tribunais, usar o sistema padrão do mapeamento
      return CNJ_MAPPING['8']?.[tribunalCode]?.system || 'Sistema não identificado';
  }
}

/**
 * Extrai informações do tribunal com base no número do processo CNJ
 * @param processNumber Número do processo no formato CNJ
 * @returns Informações do tribunal ou null se não encontrado
 */
export function extractTribunalInfo(processNumber: string): TribunalInfo | null {
  // Remove espaços e caracteres especiais, mantendo apenas números, pontos e hífen
  const cleanNumber = processNumber.replace(/[^\d.-]/g, '');
  
  // Regex para validar o formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
  const cnjRegex = /^(\d{7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})$/;
  const match = cleanNumber.match(cnjRegex);
  
  if (!match) {
    return null;
  }
  
  const sequentialNumber = match[1]; // NNNNNNN
  const verificationDigits = match[2]; // DD
  const year = match[3]; // AAAA
  const justica = match[4]; // J
  const tribunal = match[5]; // TR
  const origin = match[6]; // OOOO
  
  // Busca no mapeamento básico
  const basicTribunalInfo = CNJ_MAPPING[justica]?.[tribunal];
  
  if (!basicTribunalInfo) {
    return null;
  }
  
  // Para justiça estadual (8), aplicar regras específicas
  let specificSystem = basicTribunalInfo.system;
  if (justica === '8') {
    specificSystem = determineSpecificSystem(
      processNumber,
      tribunal,
      sequentialNumber,
      year,
      origin
    );
  }
  
  // Determinar jurisdição específica
  // Removido - jurisdição deve ser manual
  
  return {
    name: basicTribunalInfo.name,
    system: specificSystem,
    processType: basicTribunalInfo.processType,
  };
}

/**
 * Valida se o número do processo está no formato CNJ correto
 * @param processNumber Número do processo
 * @returns true se válido, false caso contrário
 */
export function isValidCNJFormat(processNumber: string): boolean {
  const cleanNumber = processNumber.replace(/[^\d.-]/g, '');
  const cnjRegex = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;
  return cnjRegex.test(cleanNumber);
}