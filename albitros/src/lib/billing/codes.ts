// Healthcare Billing Codes and Fraud Detection Patterns

export interface CPTCode {
  code: string;
  description: string;
  category: string;
  baseRate: number;
  typicalRange: { min: number; max: number };
  modifiers: string[];
  bundlingRules: {
    bundledCodes: string[];
    unbundlingRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  upcodingRisk: {
    higherLevelCodes: string[];
    riskFactors: string[];
  };
}

export interface HCPCSCode {
  code: string;
  description: string;
  category: 'MEDICAL_SUPPLY' | 'DME' | 'PROSTHETIC' | 'OTHER';
  baseRate: number;
  typicalRange: { min: number; max: number };
  requiresDocumentation: boolean;
  fraudIndicators: string[];
}

export interface ICD10Code {
  code: string;
  description: string;
  category: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  chronic: boolean;
  commonlyAssociated: string[];
}

// Common CPT Codes with Fraud Risk Analysis
export const CPT_CODES: Record<string, CPTCode> = {
  // Evaluation and Management
  '99213': {
    code: '99213',
    description: 'Office visit, established patient, 15-29 minutes',
    category: 'E&M',
    baseRate: 75,
    typicalRange: { min: 60, max: 95 },
    modifiers: ['25', '57', '59'],
    bundlingRules: {
      bundledCodes: [],
      unbundlingRisk: 'LOW'
    },
    upcodingRisk: {
      higherLevelCodes: ['99214', '99215'],
      riskFactors: ['HIGH_FREQUENCY', 'TIME_DOCUMENTATION_MISMATCH']
    }
  },
  '99214': {
    code: '99214',
    description: 'Office visit, established patient, 30-39 minutes',
    category: 'E&M',
    baseRate: 110,
    typicalRange: { min: 95, max: 130 },
    modifiers: ['25', '57', '59'],
    bundlingRules: {
      bundledCodes: [],
      unbundlingRisk: 'MEDIUM'
    },
    upcodingRisk: {
      higherLevelCodes: ['99215'],
      riskFactors: ['HIGH_FREQUENCY', 'TIME_DOCUMENTATION_MISMATCH']
    }
  },
  '99215': {
    code: '99215',
    description: 'Office visit, established patient, 40-54 minutes',
    category: 'E&M',
    baseRate: 150,
    typicalRange: { min: 130, max: 180 },
    modifiers: ['25', '57', '59'],
    bundlingRules: {
      bundledCodes: [],
      unbundlingRisk: 'HIGH'
    },
    upcodingRisk: {
      higherLevelCodes: [],
      riskFactors: ['EXCESSIVE_FREQUENCY', 'COMPLEXITY_MISMATCH']
    }
  },

  // Surgical Procedures
  '43239': {
    code: '43239',
    description: 'Upper GI endoscopy with biopsy',
    category: 'ENDOSCOPY',
    baseRate: 450,
    typicalRange: { min: 400, max: 550 },
    modifiers: ['25', '59', '78'],
    bundlingRules: {
      bundledCodes: ['43235', '43236'],
      unbundlingRisk: 'HIGH'
    },
    upcodingRisk: {
      higherLevelCodes: ['43249', '43250'],
      riskFactors: ['UNBUNDLING', 'MODIFIER_ABUSE']
    }
  },

  // Laboratory Tests
  '80053': {
    code: '80053',
    description: 'Comprehensive metabolic panel',
    category: 'LABORATORY',
    baseRate: 45,
    typicalRange: { min: 35, max: 60 },
    modifiers: ['91', '59'],
    bundlingRules: {
      bundledCodes: ['80048', '80076'],
      unbundlingRisk: 'MEDIUM'
    },
    upcodingRisk: {
      higherLevelCodes: ['80076'],
      riskFactors: ['DUPLICATE_TESTING', 'MEDICAL_NECESSITY']
    }
  },

  // Radiology
  '71020': {
    code: '71020',
    description: 'Chest X-ray, 2 views',
    category: 'RADIOLOGY',
    baseRate: 65,
    typicalRange: { min: 50, max: 80 },
    modifiers: ['26', '59'],
    bundlingRules: {
      bundledCodes: ['71010'],
      unbundlingRisk: 'LOW'
    },
    upcodingRisk: {
      higherLevelCodes: ['71021', '71250'],
      riskFactors: ['FREQUENT_REPEATS', 'CLINICAL_INDICATION']
    }
  }
};

// High-Risk Procedure Code Combinations
export const HIGH_RISK_COMBINATIONS = [
  {
    codes: ['99213', '99214'],
    riskType: 'DUPLICATE_E&M',
    description: 'Multiple E&M codes for same encounter',
    riskScore: 85
  },
  {
    codes: ['43239', '43235', '43236'],
    riskType: 'UNBUNDLING_ENDOSCOPY',
    description: 'Unbundling endoscopy procedures',
    riskScore: 90
  },
  {
    codes: ['80053', '80048'],
    riskType: 'DUPLICATE_LAB',
    description: 'Duplicate metabolic panels',
    riskScore: 75
  }
];

// Common Fraud Patterns
export const FRAUD_PATTERNS = {
  UPDATING: {
    indicators: [
      'CONSISTENT_HIGH_LEVEL_CODING',
      'TIME_DOCUMENTATION_MISMATCH',
      'COMPLEXITY_MISMATCH',
      'HIGH_FREQUENCY_99215'
    ],
    riskThreshold: 0.7
  },
  UNBUNDLING: {
    indicators: [
      'SEPARATE_BUNDLED_PROCEDURES',
      'EXCESSIVE_MODIFIER_59',
      'PROCEDURE_SPLITTING'
    ],
    riskThreshold: 0.8
  },
  PHANTOM_BILLING: {
    indicators: [
      'IMPOSSIBLE_VOLUME',
      'GEOGRAPHIC_ANOMALY',
      'PATIENT_PROVIDER_MISMATCH',
      'TIME_CONFLICT'
    ],
    riskThreshold: 0.9
  },
  DUPLICATE_CLAIMS: {
    indicators: [
      'IDENTICAL_CLAIMS',
      'MINOR_VARIATION_REBILLING',
      'MULTIPLE_PAYER_SUBMISSION'
    ],
    riskThreshold: 0.85
  }
};

// Billing Code Validation
export class BillingCodeValidator {
  static validateCPT(code: string): boolean {
    return Object.keys(CPT_CODES).includes(code);
  }

  static validateModifier(code: string, modifier: string): boolean {
    const cptCode = CPT_CODES[code];
    return cptCode ? cptCode.modifiers.includes(modifier) : false;
  }

  static checkUnbundlingRisk(codes: string[]): number {
    let riskScore = 0;
    const checkedCombinations = new Set<string>();

    for (const code of codes) {
      const cptCode = CPT_CODES[code];
      if (!cptCode) continue;

      // Check if this code is commonly unbundled
      for (const bundledCode of cptCode.bundlingRules.bundledCodes) {
        if (codes.includes(bundledCode)) {
          const combination = [code, bundledCode].sort().join('-');
          if (!checkedCombinations.has(combination)) {
            riskScore += this.getBundlingRiskWeight(cptCode.bundlingRules.unbundlingRisk);
            checkedCombinations.add(combination);
          }
        }
      }
    }

    return Math.min(riskScore, 100);
  }

  static checkUpcodingRisk(providerHistory: { code: string; frequency: number }[]): number {
    let riskScore = 0;

    for (const item of providerHistory) {
      const cptCode = CPT_CODES[item.code];
      if (!cptCode) continue;

      // Check for excessive high-level coding
      if (cptCode.upcodingRisk.higherLevelCodes.length === 0 && item.frequency > 0.3) {
        riskScore += 30; // High frequency of highest level codes
      }

      // Check for unusual patterns
      for (const factor of cptCode.upcodingRisk.riskFactors) {
        if (factor === 'HIGH_FREQUENCY' && item.frequency > 0.5) {
          riskScore += 25;
        }
      }
    }

    return Math.min(riskScore, 100);
  }

  private static getBundlingRiskWeight(risk: string): number {
    switch (risk) {
      case 'HIGH': return 40;
      case 'MEDIUM': return 25;
      case 'LOW': return 10;
      default: return 0;
    }
  }

  static validateCodeCombination(codes: string[]): {
    isValid: boolean;
    warnings: string[];
    riskScore: number;
  } {
    const warnings: string[] = [];
    let riskScore = 0;

    // Check for high-risk combinations
    for (const combination of HIGH_RISK_COMBINATIONS) {
      const hasAllCodes = combination.codes.every(code => codes.includes(code));
      if (hasAllCodes) {
        warnings.push(combination.description);
        riskScore = Math.max(riskScore, combination.riskScore);
      }
    }

    // Check unbundling risk
    const unbundlingRisk = this.checkUnbundlingRisk(codes);
    if (unbundlingRisk > 50) {
      warnings.push('High unbundling risk detected');
      riskScore = Math.max(riskScore, unbundlingRisk);
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      riskScore
    };
  }
}
