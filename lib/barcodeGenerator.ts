/**
 * Utilitário para gerar códigos de barras únicos para produtos
 */

/**
 * Gera um código EAN-13 válido
 * Formato: 789 + 9 dígitos + 1 dígito verificador
 */
export function generateEAN13(): string {
  // Prefixo 789 para produtos locais/internos
  const prefix = '789';
  
  // Gera 9 dígitos aleatórios
  let code = prefix;
  for (let i = 0; i < 9; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  
  // Calcula o dígito verificador
  const checkDigit = calculateEAN13CheckDigit(code);
  
  return code + checkDigit;
}

/**
 * Calcula o dígito verificador para um código EAN-13
 */
function calculateEAN13CheckDigit(code: string): string {
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i]);
    // Multiplica por 1 se posição for par, por 3 se for ímpar
    const multiplier = (i % 2 === 0) ? 1 : 3;
    sum += digit * multiplier;
  }
  
  // O dígito verificador é o que falta para completar o próximo múltiplo de 10
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return checkDigit.toString();
}

/**
 * Gera um código UPC-A válido
 * Formato: 11 dígitos + 1 dígito verificador
 */
export function generateUPCA(): string {
  // Gera 11 dígitos aleatórios
  let code = '';
  for (let i = 0; i < 11; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  
  // Calcula o dígito verificador
  const checkDigit = calculateUPCACheckDigit(code);
  
  return code + checkDigit;
}

/**
 * Calcula o dígito verificador para um código UPC-A
 */
function calculateUPCACheckDigit(code: string): string {
  let sum = 0;
  
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(code[i]);
    // Multiplica por 3 se posição for par, por 1 se for ímpar
    const multiplier = (i % 2 === 0) ? 3 : 1;
    sum += digit * multiplier;
  }
  
  // O dígito verificador é o que falta para completar o próximo múltiplo de 10
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return checkDigit.toString();
}

/**
 * Gera um código de barras baseado no tipo especificado
 */
export function generateBarcode(type: 'EAN13' | 'UPCA' = 'EAN13'): { code: string; type: string } {
  switch (type) {
    case 'UPCA':
      return {
        code: generateUPCA(),
        type: 'UPCA'
      };
    case 'EAN13':
    default:
      return {
        code: generateEAN13(),
        type: 'EAN13'
      };
  }
}

/**
 * Valida se um código de barras é válido
 */
export function validateBarcode(code: string, type: string): boolean {
  switch (type) {
    case 'EAN13':
      return validateEAN13(code);
    case 'UPCA':
      return validateUPCA(code);
    default:
      return false;
  }
}

/**
 * Valida um código EAN-13
 */
function validateEAN13(code: string): boolean {
  if (code.length !== 13) return false;
  
  const checkDigit = code[12];
  const calculatedCheckDigit = calculateEAN13CheckDigit(code.substring(0, 12));
  
  return checkDigit === calculatedCheckDigit;
}

/**
 * Valida um código UPC-A
 */
function validateUPCA(code: string): boolean {
  if (code.length !== 12) return false;
  
  const checkDigit = code[11];
  const calculatedCheckDigit = calculateUPCACheckDigit(code.substring(0, 11));
  
  return checkDigit === calculatedCheckDigit;
}