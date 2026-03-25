import apiClient from '@/lib/api';
import { TechnicalProfile } from './types';
import { CVAnalysisResult } from '../cv-analysis/types';

export const technicalProfileService = {
  getAll: async (): Promise<TechnicalProfile[]> => {
    const response = await apiClient.get('/technical-profiles');
    return response.data;
  },

  getById: async (id: number): Promise<TechnicalProfile> => {
    const response = await apiClient.get(`/technical-profiles/${id}`);
    return response.data;
  },

  getByCandidateId: async (candidateId: number): Promise<TechnicalProfile> => {
    console.log(`=== TECHNICAL PROFILE SEARCH FOR CANDIDATE ${candidateId} ===`);
    
    // Utiliser l'endpoint qui fonctionne selon les logs backend (priorité absolue)
    const workingEndpoints = [
      `/candidatures/candidate/${candidateId}`,             // Endpoint qui fonctionne et charge les données
      `/technical-profiles/candidate/${candidateId}`,       // Ancien endpoint qui fonctionnait
      `/technical-profiles/by-candidate/${candidateId}`,    // Alternative
    ];
    
    for (const endpoint of workingEndpoints) {
      try {
        console.log(`🔍 Trying working endpoint: ${endpoint}`);
        const response = await apiClient.get(endpoint);
        console.log(`✅ Success with endpoint: ${endpoint}`);
        console.log('Response data:', response.data);
        
        // Si c'est un endpoint candidatures/candidate qui fonctionne selon les logs backend
        if (endpoint.includes('/candidatures/candidate/') && response.data) {
          console.log(`✅ Found working candidatures/candidate endpoint: ${endpoint}`);
          console.log(`=== COMPLÈTE RESPONSE ANALYSIS ===`);
          console.log('Response type:', typeof response.data);
          console.log('Is array:', Array.isArray(response.data));
          console.log('Response keys:', Object.keys(response.data));
          console.log('Response data:', JSON.stringify(response.data, null, 2));
          console.log(`=== END RESPONSE ANALYSIS ===`);
          
          const candidatures = Array.isArray(response.data) ? response.data : [response.data];
          const candidature = candidatures[0]; // Prendre la première candidature
          
          if (candidature) {
            console.log(`✅ Found candidature data:`, candidature);
            console.log('Candidature keys:', Object.keys(candidature));
            console.log('Candidature type:', typeof candidature);
            
            // NOUVELLES DONNÉES IA - Chercher dans les nouvelles structures du backend
            console.log('=== CHECKING NEW IA DATA STRUCTURES ===');
            console.log('candidateCVs:', candidature.candidateCVs);
            console.log('technicalProfiles:', candidature.technicalProfiles);
            
            // Chercher d'abord dans candidateCVs (file_data contient les IA)
            if (candidature.candidateCVs && Array.isArray(candidature.candidateCVs) && candidature.candidateCVs.length > 0) {
              const candidateCV = candidature.candidateCVs[0];
              console.log('First candidateCV:', candidateCV);
              console.log('candidateCV keys:', Object.keys(candidateCV || {}));
              console.log('fileData:', candidateCV?.fileData);
              console.log('parsingStatus:', candidateCV?.parsingStatus);
              
              if (candidateCV.fileData && candidateCV.parsingStatus === 'PARSED') {
                console.log(`✅ Using NEW candidateCVs fileData:`, candidateCV.fileData);
                
                const technicalProfile: TechnicalProfile = {
                  id: candidateCV.id || candidateId,
                  cvId: candidateId,
                  candidateId: candidateId,
                  parsedData: candidateCV.fileData, // fileData contient les vraies données IA
                  createdAt: candidateCV.uploadDate || new Date().toISOString()
                };
                
                console.log('✅ Transformed NEW candidateCVs data to TechnicalProfile:', technicalProfile);
                return technicalProfile;
              }
            }
            
            // Chercher ensuite dans technicalProfiles (parsedData contient les IA)
            if (candidature.technicalProfiles && Array.isArray(candidature.technicalProfiles) && candidature.technicalProfiles.length > 0) {
              const techProfile = candidature.technicalProfiles[0];
              console.log('First techProfile:', techProfile);
              console.log('techProfile keys:', Object.keys(techProfile || {}));
              console.log('parsedData:', techProfile?.parsedData);
              
              if (techProfile.parsedData) {
                console.log(`✅ Using NEW technicalProfiles parsedData:`, techProfile.parsedData);
                
                const technicalProfile: TechnicalProfile = {
                  id: techProfile.id || candidateId,
                  cvId: techProfile.cvId || candidateId,
                  candidateId: candidateId,
                  parsedData: techProfile.parsedData, // parsedData contient les vraies données IA
                  createdAt: techProfile.createdAt || new Date().toISOString()
                };
                
                console.log('✅ Transformed NEW technical profile data to TechnicalProfile:', technicalProfile);
                return technicalProfile;
              }
            }
            
            // ANCIENNE MÉTHODE - Chercher les données IA directement dans la candidature (fallback)
            const aiData = candidature.aiAnalysis || candidature.cvAnalysis || candidature.parsedData || candidature.technicalProfile;
            
            console.log('AI Data search results (fallback):');
            console.log('- aiAnalysis:', candidature.aiAnalysis);
            console.log('- cvAnalysis:', candidature.cvAnalysis);
            console.log('- parsedData:', candidature.parsedData);
            console.log('- technicalProfile:', candidature.technicalProfile);
            console.log('- Found AI Data:', aiData);
            
            if (aiData && typeof aiData === 'object' && Object.keys(aiData).length > 0) {
              console.log(`✅ Found real AI analysis data in candidature (fallback):`, aiData);
              
              const technicalProfile: TechnicalProfile = {
                id: candidature.id,
                cvId: candidature.candidateId || candidateId,
                candidateId: candidateId,
                parsedData: aiData,
                createdAt: candidature.updatedAt || new Date().toISOString()
              };
              
              console.log('✅ Transformed fallback candidature AI data to TechnicalProfile:', technicalProfile);
              return technicalProfile;
            } else {
              console.log(`❌ No AI analysis data found in any structure`);
            }
          }
        }
        
        // Si c'est un endpoint technical-profiles direct
        if (endpoint.includes('/technical-profiles/') && response.data) {
          console.log(`✅ Found technical profiles endpoint: ${endpoint}`);
          
          const techProfiles = Array.isArray(response.data) ? response.data : [response.data];
          const techProfile = techProfiles[0];
          
          if (techProfile && techProfile.parsedData) {
            console.log(`✅ Using technical profiles parsedData:`, techProfile.parsedData);
            
            const technicalProfile: TechnicalProfile = {
              id: techProfile.id || candidateId,
              cvId: techProfile.cvId || techProfile.cv_id || candidateId,
              candidateId: candidateId,
              parsedData: techProfile.parsedData,
              createdAt: techProfile.created_at || new Date().toISOString()
            };
            
            console.log('✅ Transformed technical profile data to TechnicalProfile:', technicalProfile);
            return technicalProfile;
          }
        }
        
      } catch (error) {
        console.log(`❌ Error with endpoint ${endpoint}:`, error);
        continue;
      }
    }
    
    // Si aucun endpoint n'a fonctionné, créer un fallback basique
    console.log(`=== NO WORKING ENDPOINT FOUND - CREATING FALLBACK ===`);
    const fallbackProfile: TechnicalProfile = {
      id: candidateId,
      cvId: candidateId,
      candidateId: candidateId,
      parsedData: {
        "Basic Information": {
          "full_name": "Candidat " + candidateId,
          "email": "candidat" + candidateId + "@example.com",
          "phone": ""
        },
        "Technical Information": {
          "domain": "Non spécifié",
          "technologies": {
            "Frontend": [],
            "Backend": [],
            "Tools": []
          }
        },
        "Summary": {
          "overall_score": 0,
          "experience_years": "Non spécifié",
          "skill_level": "Non évalué",
          "career_level": "Non évalué",
          "recommendation": "À évaluer",
          "summary": "Aucune analyse IA disponible"
        }
      },
      createdAt: new Date().toISOString()
    };
    
    console.log('✅ Created fallback profile:', fallbackProfile);
    return fallbackProfile;
  },

  create: async (profile: Omit<TechnicalProfile, 'id' | 'createdAt'>): Promise<TechnicalProfile> => {
    const response = await apiClient.post('/technical-profiles', profile);
    return response.data;
  },

  update: async (id: number, profile: Partial<TechnicalProfile>): Promise<TechnicalProfile> => {
    const response = await apiClient.put(`/technical-profiles/${id}`, profile);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/technical-profiles/${id}`);
  },
};
