/**
 * Configuration Swagger/OpenAPI pour la documentation de l'API
 */

const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Medical Dictation API',
      version: '1.0.0',
      description: 'API pour l\'application de dictée médicale avec transcription Gemini, structuration JSON et génération PDF',
      contact: {
        name: 'Support API',
        email: 'support@medicaldictation.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.BACKEND_URL || 'http://localhost:3000',
        description: 'Serveur de développement'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT Supabase'
        }
      },
      schemas: {
        Patient: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID unique du patient'
            },
            full_name: {
              type: 'string',
              description: 'Nom complet du patient'
            },
            gender: {
              type: 'string',
              description: 'Genre du patient'
            },
            dob: {
              type: 'string',
              format: 'date',
              description: 'Date de naissance'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création'
            }
          },
          required: ['id', 'full_name']
        },
        Note: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID unique de la note'
            },
            patient_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID du patient'
            },
            created_by: {
              type: 'string',
              format: 'uuid',
              description: 'ID de l\'utilisateur créateur'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création'
            },
            recorded_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date d\'enregistrement'
            },
            transcription_text: {
              type: 'string',
              description: 'Texte transcrit'
            },
            structured_json: {
              type: 'object',
              description: 'Données structurées JSON',
              properties: {
                vitals: {
                  type: 'object',
                  description: 'Signes vitaux'
                },
                care: {
                  type: 'array',
                  description: 'Soins prodigués',
                  items: {
                    type: 'string'
                  }
                },
                medications: {
                  type: 'array',
                  description: 'Médications',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      dose: { type: 'string' },
                      route: { type: 'string' }
                    }
                  }
                },
                observations: {
                  type: 'string',
                  description: 'Observations'
                },
                flags: {
                  type: 'array',
                  description: 'Alertes',
                  items: {
                    type: 'string'
                  }
                }
              }
            },
            pdf_url: {
              type: 'string',
              format: 'uri',
              description: 'URL du PDF généré'
            },
            audio_url: {
              type: 'string',
              format: 'uri',
              description: 'URL du fichier audio'
            },
            synced: {
              type: 'boolean',
              description: 'État de synchronisation'
            }
          },
          required: ['id', 'patient_id']
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Message d\'erreur'
            },
            message: {
              type: 'string',
              description: 'Détails de l\'erreur'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            ok: {
              type: 'boolean',
              description: 'Statut de succès'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentification et gestion des utilisateurs'
      },
      {
        name: 'Upload',
        description: 'Endpoints pour l\'upload audio et la génération de notes'
      },
      {
        name: 'Patients',
        description: 'Gestion des patients'
      },
      {
        name: 'Notes',
        description: 'Gestion des notes médicales'
      },
      {
        name: 'Health',
        description: 'Vérification de l\'état du serveur'
      }
    ]
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../server/index.js')
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

