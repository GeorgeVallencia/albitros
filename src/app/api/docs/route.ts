import { NextResponse } from 'next/server';

export async function GET() {
  const swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Albitros Fraud Detection API',
      version: '1.0.0',
      description: 'API for healthcare claims fraud detection and analysis',
      contact: {
        name: 'Albitros Support',
        email: 'support@albitros.com'
      }
    },
    servers: [
      {
        url: 'https://api.albitros.com',
        description: 'Production server'
      },
      {
        url: 'https://staging-api.albitros.com',
        description: 'Staging server'
      }
    ],
    paths: {
      '/api/claims': {
        post: {
          tags: ['Claims'],
          summary: 'Submit a claim for fraud analysis',
          description: 'Processes a healthcare claim and returns fraud detection analysis including risk score, fraud types, and recommendations.',
          security: [{
            bearerAuth: []
          }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ClaimSubmission'
                },
                examples: {
                  standardClaim: {
                    summary: 'Standard medical claim',
                    value: {
                      patientId: 'pat_123456',
                      providerId: 'prov_789012',
                      serviceDate: '2024-01-15T00:00:00Z',
                      lineItems: [
                        {
                          procedureCode: '99213',
                          modifiers: ['25'],
                          units: 1,
                          unitCost: 150.00,
                          diagnosisCodes: ['J45.909', 'Z01.419']
                        }
                      ]
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Claim processed successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ClaimAnalysisResponse'
                  },
                  examples: {
                    approvedClaim: {
                      summary: 'Low-risk approved claim',
                      value: {
                        success: true,
                        claimId: 'clm_123456',
                        analysis: {
                          riskScore: 25,
                          riskLevel: 'LOW',
                          fraudTypes: [],
                          alerts: [],
                          recommendations: ['Auto-approved for payment'],
                          approved: true
                        }
                      }
                    },
                    flaggedClaim: {
                      summary: 'High-risk flagged claim',
                      value: {
                        success: true,
                        claimId: 'clm_789012',
                        analysis: {
                          riskScore: 85,
                          riskLevel: 'HIGH',
                          fraudTypes: ['UPDATING', 'UNBUNDLING'],
                          alerts: [
                            {
                              type: 'UPDATING',
                              severity: 'HIGH',
                              confidence: 75,
                              description: 'Potential upcoding detected',
                              details: {
                                reasons: ['Excessive charge for 99213'],
                                highValueCodes: ['99213']
                              }
                            }
                          ],
                          recommendations: [
                            'Manual review required',
                            'Additional documentation requested',
                            'Review medical record documentation'
                          ],
                          approved: false
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Bad request - invalid input data',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized - invalid or missing authentication',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        },
        get: {
          tags: ['Claims'],
          summary: 'Retrieve claims with filtering and pagination',
          description: 'Returns a list of claims with optional filtering by status, risk level, and provider.',
          security: [{
            bearerAuth: []
          }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Page number for pagination',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
                default: 1
              }
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Number of claims per page',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 100,
                default: 10
              }
            },
            {
              name: 'status',
              in: 'query',
              description: 'Filter by claim status',
              required: false,
              schema: {
                type: 'string',
                enum: ['PENDING', 'APPROVED', 'FLAGGED_FOR_FRAUD', 'REJECTED']
              }
            },
            {
              name: 'riskLevel',
              in: 'query',
              description: 'Filter by risk level',
              required: false,
              schema: {
                type: 'string',
                enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
              }
            },
            {
              name: 'providerId',
              in: 'query',
              description: 'Filter by provider ID',
              required: false,
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Claims retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ClaimsListResponse'
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/claims/{claimId}': {
        get: {
          tags: ['Claims'],
          summary: 'Get detailed claim information',
          description: 'Returns detailed information about a specific claim including fraud alerts and line items.',
          security: [{
            bearerAuth: []
          }],
          parameters: [
            {
              name: 'claimId',
              in: 'path',
              required: true,
              description: 'Unique identifier of the claim',
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Claim details retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ClaimDetailResponse'
                  }
                }
              }
            },
            '404': {
              description: 'Claim not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/dashboard/stats': {
        get: {
          tags: ['Dashboard'],
          summary: 'Get dashboard statistics',
          description: 'Returns aggregated statistics for the insurer dashboard including claim counts, risk distribution, and financial metrics.',
          security: [{
            bearerAuth: []
          }],
          responses: {
            '200': {
              description: 'Dashboard statistics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/DashboardStatsResponse'
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        ClaimSubmission: {
          type: 'object',
          required: ['patientId', 'providerId', 'serviceDate', 'lineItems'],
          properties: {
            patientId: {
              type: 'string',
              description: 'Unique patient identifier',
              example: 'pat_123456'
            },
            providerId: {
              type: 'string',
              description: 'Unique provider identifier',
              example: 'prov_789012'
            },
            serviceDate: {
              type: 'string',
              format: 'date-time',
              description: 'Date of service (ISO 8601 format)',
              example: '2024-01-15T00:00:00Z'
            },
            lineItems: {
              type: 'array',
              description: 'Array of procedure line items',
              minItems: 1,
              items: {
                $ref: '#/components/schemas/ClaimLineItem'
              }
            }
          }
        },
        ClaimLineItem: {
          type: 'object',
          required: ['procedureCode', 'units', 'unitCost', 'diagnosisCodes'],
          properties: {
            procedureCode: {
              type: 'string',
              description: 'CPT/HCPCS procedure code',
              example: '99213'
            },
            modifiers: {
              type: 'array',
              description: 'Procedure modifiers',
              items: {
                type: 'string'
              },
              example: ['25', '59']
            },
            units: {
              type: 'integer',
              minimum: 1,
              description: 'Number of units',
              example: 1
            },
            unitCost: {
              type: 'number',
              minimum: 0,
              description: 'Cost per unit',
              example: 150.00
            },
            diagnosisCodes: {
              type: 'array',
              description: 'ICD-10 diagnosis codes',
              maxItems: 4,
              items: {
                type: 'string'
              },
              example: ['J45.909', 'Z01.419']
            }
          }
        },
        ClaimAnalysisResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            claimId: {
              type: 'string',
              description: 'Generated unique claim identifier',
              example: 'clm_123456'
            },
            analysis: {
              $ref: '#/components/schemas/FraudAnalysis'
            }
          }
        },
        FraudAnalysis: {
          type: 'object',
          properties: {
            riskScore: {
              type: 'integer',
              minimum: 0,
              maximum: 100,
              description: 'Overall fraud risk score (0-100)',
              example: 75
            },
            riskLevel: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
              description: 'Risk level classification',
              example: 'HIGH'
            },
            fraudTypes: {
              type: 'array',
              description: 'Detected fraud types',
              items: {
                type: 'string',
                enum: ['UPDATING', 'UNBUNDLING', 'PHANTOM_BILLING', 'DUPLICATE_CLAIM']
              },
              example: ['UPDATING', 'UNBUNDLING']
            },
            alerts: {
              type: 'array',
              description: 'Detailed fraud alerts',
              items: {
                $ref: '#/components/schemas/FraudAlert'
              }
            },
            recommendations: {
              type: 'array',
              description: 'Action recommendations',
              items: {
                type: 'string'
              },
              example: ['Manual review required', 'Additional documentation requested']
            },
            approved: {
              type: 'boolean',
              description: 'Whether claim was auto-approved',
              example: false
            }
          }
        },
        FraudAlert: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['UPDATING', 'UNBUNDLING', 'PHANTOM_BILLING', 'DUPLICATE_CLAIM'],
              example: 'UPDATING'
            },
            severity: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
              example: 'HIGH'
            },
            confidence: {
              type: 'integer',
              minimum: 0,
              maximum: 100,
              description: 'Confidence score (0-100)',
              example: 85
            },
            description: {
              type: 'string',
              example: 'Potential upcoding detected'
            },
            details: {
              type: 'object',
              description: 'Additional alert details',
              example: {
                reasons: ['Excessive charge for 99213'],
                highValueCodes: ['99213']
              }
            }
          }
        },
        ClaimsListResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ClaimSummary'
              }
            },
            pagination: {
              $ref: '#/components/schemas/Pagination'
            }
          }
        },
        ClaimSummary: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clm_123456'
            },
            claimNumber: {
              type: 'string',
              example: 'CLM-1642245123456-ABC12'
            },
            patient: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                mrn: { type: 'string' }
              }
            },
            provider: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                npi: { type: 'string' }
              }
            },
            serviceDate: {
              type: 'string',
              format: 'date-time'
            },
            billedAmount: {
              type: 'number',
              example: 150.00
            },
            riskScore: {
              type: 'integer',
              example: 75
            },
            riskLevel: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'APPROVED', 'FLAGGED_FOR_FRAUD', 'REJECTED']
            },
            isFlagged: {
              type: 'boolean'
            },
            fraudAlerts: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/FraudAlert'
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        ClaimDetailResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            data: {
              $ref: '#/components/schemas/ClaimSummary'
            }
          }
        },
        DashboardStatsResponse: {
          type: 'object',
          properties: {
            stats: {
              type: 'object',
              properties: {
                total_claims: { type: 'integer' },
                high_risk_count: { type: 'integer' },
                medium_risk_count: { type: 'integer' },
                low_risk_count: { type: 'integer' },
                average_risk_score: { type: 'number' },
                total_billed_amount: { type: 'number' },
                fraud_detected_count: { type: 'integer' },
                approved_count: { type: 'integer' }
              }
            },
            recent_activity: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  claim_number: { type: 'string' },
                  patient_name: { type: 'string' },
                  provider_name: { type: 'string' },
                  risk_score: { type: 'integer' },
                  status: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1
            },
            limit: {
              type: 'integer',
              example: 10
            },
            total: {
              type: 'integer',
              example: 150
            },
            pages: {
              type: 'integer',
              example: 15
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Invalid token'
            },
            details: {
              type: 'object',
              description: 'Additional error details (optional)'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Claims',
        description: 'Claims processing and fraud detection'
      },
      {
        name: 'Dashboard',
        description: 'Dashboard analytics and statistics'
      }
    ]
  };

  return NextResponse.json(swaggerSpec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
