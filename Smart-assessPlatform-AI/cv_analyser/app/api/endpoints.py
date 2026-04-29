from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Union
from datetime import datetime
from dotenv import load_dotenv
import os
from sentence_transformers import SentenceTransformer

import requests
from app.services.extractor import extract_text_from_bytes
from app.services.analyzer import CVAnalyzer
from app.services.generator import QuestionGenerator
from app.utils.cv_validator import validate_cv_text, validate_file_type
from app.services.report_generator import ReportGenerator, CandidateReport
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from app.services.eligibility_service import check_domain_eligibility  # 
from app.services.evaluation_report_service import EvaluationReportService
from app.services.matching_service import CandidateMatchingService
from app.services.embedding_service import embedding_service
from app.config.elasticsearch_config import ElasticsearchConfig
from app.services.score_normalizer import ScoreNormalizer
from app.models.ai_request_models import (
    ProcessCandidateRequest, ProcessCandidateResponse,
    ComputeScoreRequest, ComputeScoreResponse,
    ProcessPositionRequest, ProcessPositionResponse,
    UpdateCandidateRequest, UpdateCandidateResponse,
    ErrorResponse, SuccessResponse
)
from elasticsearch import Elasticsearch

router = APIRouter()

async def get_applications_for_position(position_id: Union[str, int]) -> List[int]:
    """
    Récupère les IDs des candidats ayant postulé pour un poste spécifique
    via l'API backend Spring Boot
    """
    try:
        # URL de l'API backend pour récupérer les candidatures par position
        backend_url = os.getenv("BACKEND_URL", "http://localhost:8080")
        applications_url = f"{backend_url}/api/candidatures/position/{position_id}"
        
        print(f"Récupération des candidatures pour le poste {position_id}...")
        
        # Appel à l'API backend
        response = requests.get(applications_url, timeout=10)
        response.raise_for_status()
        
        applications = response.json()
        candidate_ids = []
        
        for app in applications:
            if app.get('candidateId'):
                candidate_ids.append(app['candidateId'])
        
        print(f"Trouvé {len(candidate_ids)} candidats ayant postulé au poste {position_id}")
        print(f"Candidats IDs: {candidate_ids}")
        
        return candidate_ids
        
    except requests.exceptions.RequestException as e:
        print(f"Erreur lors de la récupération des candidatures: {e}")
        # En cas d'erreur, retourner une liste vide pour ne pas bloquer le ranking
        return []
    except Exception as e:
        print(f"Erreur inattendue lors de la récupération des candidatures: {e}")
        return []

async def get_candidates_info_batch(candidate_ids: List[int]) -> Dict[int, Dict]:
    """
    Récupère les informations complètes des candidats depuis le backend Spring Boot
    en utilisant l'endpoint batch pour optimiser les performances
    """
    try:
        if not candidate_ids:
            return {}
        
        # URL de l'API backend pour récupérer les candidats par IDs
        backend_url = os.getenv("BACKEND_URL", "http://localhost:8080")
        candidates_url = f"{backend_url}/api/candidates/batch"
        
        print(f"Récupération des informations complètes pour {len(candidate_ids)} candidats...")
        
        # Préparer les paramètres de requête
        params = {"ids": ",".join(map(str, candidate_ids))}
        
        # Appel à l'API backend
        response = requests.get(candidates_url, params=params, timeout=10)
        response.raise_for_status()
        
        candidates = response.json()
        candidates_info = {}
        
        for candidate in candidates:
            candidate_id = candidate.get('id')
            if candidate_id:
                candidates_info[candidate_id] = {
                    "id": candidate.get('id'),
                    "firstName": candidate.get('firstName'),
                    "lastName": candidate.get('lastName'),
                    "email": candidate.get('email'),
                    "phone": candidate.get('phone'),
                    "createdAt": candidate.get('createdAt')
                }
        
        print(f"Récupéré {len(candidates_info)} informations complètes de candidats")
        return candidates_info
        
    except requests.exceptions.RequestException as e:
        print(f"Erreur lors de la récupération des informations candidats: {e}")
        # En cas d'erreur, retourner un dictionnaire vide
        return {}
    except Exception as e:
        print(f"Erreur inattendue lors de la récupération des informations candidats: {e}")
        return {}

analyzer = CVAnalyzer()
generator = QuestionGenerator()
report_generator = ReportGenerator()
evaluation_service = EvaluationReportService()
matching_service = CandidateMatchingService()

def extract_relevant_skills_semantic(candidate_data: Dict, query: str, threshold: float = 0.23):
    """
    Extrait les compétences pertinentes d'un candidat par rapport à une requête
    en utilisant les embeddings sémantiques avec un boost hybride
    """
    skills = candidate_data.get("skills", [])
    profile_embedding = candidate_data.get("profile_embedding")

    if not skills or not profile_embedding:
        return []

    # Créer l'embedding de la requête
    query_embedding = embedding_service.generate_query_embedding(query)

    
    relevant_skills = []

    for skill in skills:
        # Générer l'embedding de la compétence
        skill_embedding = embedding_service.generate_skills_embedding([skill])

        # Calculer la similarité sémantique
        skill_score = embedding_service.cosine_similarity(
            query_embedding,
            skill_embedding
        )

        # Score hybride: 80% compétence + 20% profil
        final_skill_score =  skill_score

        # Afficher le score sémantique de chaque compétence
        print(f"    Skill '{skill}': semantic_score={final_skill_score:.3f}")

        if final_skill_score >= threshold:
            relevant_skills.append({
                "skill": skill,
                "score": round(final_skill_score, 3)
            })

    # Trier par score et retourner les 8 meilleures compétences
    relevant_skills.sort(key=lambda x: x["score"], reverse=True)
    return [s["skill"] for s in relevant_skills[:7]]

class Skill(BaseModel):
    name: str
    skill_level: str

class TechnicalInfo(BaseModel):
    domain: str = ""
    technologies: Dict = {}

class Certification(BaseModel):
    certification_name: str
    issuing_organization: Optional[str] = None
    issue_date: Optional[str] = None
    expiration_date: Optional[str] = None

class SoftSkills(BaseModel):
    communication_skills: List[str] = []
    leadership_skills: List[str] = []
    problem_solving: List[str] = []
    teamwork: List[str] = []
    time_management: List[str] = []
    adaptability: List[str] = []


class Project(BaseModel):
    name: str
    tech_stack: List[str] = []
    role: str

class CandidateProfile(BaseModel):
    basic_information: Dict[str, str]
    summary: Dict[str, str]
    technical_information: TechnicalInfo
    certifications: List[Certification] = []
    soft_skills: SoftSkills
    projects_list: List[Project]

class GenerateRequest(BaseModel):
    candidate_id: str
    candidate_profile: CandidateProfile
    target_difficulty: str
    number_of_questions: int
    question_types: List[str]

class GenerateFromProfileRequest(BaseModel):
    candidate_profile: dict
    number_of_questions: int = 5
class GenerateReportRequest(BaseModel):
    candidate_profile: dict
    test_results: List[Dict]          # Liste des résultats de test [{skill_name, score, max_score, comment}]
    applied_position: str
    test_start: str                   
    test_end: str                     

class EligibilityRequest(BaseModel):
    candidate_domain: str
    accepted_domains: list[str]

class EligibilityResult(BaseModel):
    eligible: bool
    matched_domain: str | None = None
    reason: str 

# Models for evaluation report
class EvaluationReportRequest(BaseModel):
    candidate_profile: dict
    test_results: List[Dict]
    applied_position: str
    applied_positions: Optional[List[Dict]] = None
    actual_global_score: Optional[float] = None
    actual_correct_answers: Optional[int] = None
    actual_total_questions: Optional[int] = None
    candidate_info: Optional[Dict] = None
    composite_score: Optional[float] = None

# Models for candidate matching
class PositionRequirements(BaseModel):
    title: str
    required_skills: List[str]
    experience_level: str
    domain: str
    key_requirements: List[str] = []
    description: Optional[str] = None

class CandidateProfileForMatching(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    technical_information: Dict
    summary: Dict
    basic_information: Dict

class MatchingRequest(BaseModel):
    position_requirements: PositionRequirements
    candidates_profiles: List[CandidateProfileForMatching]
    top_n: Optional[int] = 5

class BestCandidatesRequest(BaseModel):
    position_requirements: PositionRequirements
    candidates_profiles: List[CandidateProfileForMatching]
    top_n: int = 5 

# Models for candidate ranking
class RankingRequest(BaseModel):
    position_id: Optional[Union[str, int]] = None
    position_title: Optional[str] = None
    required_skills: Optional[List[str]] = None
    top_n: Optional[int] = 10
    min_score: Optional[float] = 0.0

class RankedCandidate(BaseModel):
    candidate_id: int
    skills: List[str]
    years_of_experience: Optional[float] = None
    composite_score: float
    bm25_score: Optional[float] = None
    vector_score: Optional[float] = None
    skills_similarity: Optional[float] = None
    profile_similarity: Optional[float] = None
    match_details: Optional[Dict] = None
    candidate_info: Optional[Dict] = None  # {id, firstName, lastName, email, phone, createdAt}

class RankingResponse(BaseModel):
    position_id: Optional[str] = None
    position_title: Optional[str] = None
    total_candidates: int
    ranked_candidates: List[RankedCandidate]
    ranking_method: str = "hybrid_elasticsearch" 

# Models for semantic search
class SemanticSearchRequest(BaseModel):
    query: str                          # Requête en langage naturel
    search_mode: str = "hybrid"          # "semantic", "keyword", "hybrid"
    max_results: int = 20
    min_score: float = 0.4
    filters: Optional[Dict] = None       # Filtres avancés

class SemanticSearchResult(BaseModel):
    candidate_id: int
    name: str
    email: str
    skills: List[str]
    years_of_experience: Optional[float]
    location: Optional[str]
    
    # Scores détaillés
    semantic_score: float               # Similarité cosinus (0-1)
    keyword_score: float                # Score BM25 normalisé (0-1)
    hybrid_score: float                 # Score combiné final (0-1)
    
    # Explications
    matched_concepts: List[str]         # Concepts sémantiques matchés
    relevant_skills: List[str]          # Compétences pertinentes
    search_highlights: List[str]        # Extraits pertinents
    query_keywords: List[str]           # Mots-clés de la query trouvés chez le candidat

class SemanticSearchResponse(BaseModel):
    query: str
    total_found: int
    returned_results: int
    search_results: List[SemanticSearchResult]
    processing_time_ms: float
    search_metadata: Dict 

@router.post("/eligibility", response_model=EligibilityResult)
async def check_domain_eligibility_endpoint(body: EligibilityRequest):
    try:
        result = await check_domain_eligibility(
            candidate_domain=body.candidate_domain,
            accepted_domains=body.accepted_domains
        )
        return EligibilityResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "CV Analysis API"}

@router.post("/generate")
async def generate_questions(request: GenerateRequest):
    profile_json = request.candidate_profile.dict()
    return await generator.generate(profile_json, num_questions=request.number_of_questions)

@router.post("/generate-from-profile")
async def generate_questions_from_profile(request: GenerateFromProfileRequest):
    """
    Generate questions directly from candidate profile JSON (output from analyze-cv endpoint)
    """
    return await generator.generate(request.candidate_profile, num_questions=request.number_of_questions)

@router.post("/analyze-cv")
async def analyze_cv(file: UploadFile = File(...)):
    try:
        type_valid, type_message = validate_file_type(file.filename)
        if not type_valid:
            raise HTTPException(status_code=400, detail=type_message)

        content = await file.read()
        text = extract_text_from_bytes(content, file.filename)

        is_valid, message = validate_cv_text(text)
        if not is_valid:
            raise HTTPException(status_code=400, detail=message)

        data = await analyzer.analyze(text)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-report")
async def generate_report(request: GenerateReportRequest):
    try:
        # Convertir dates ISO en datetime
        from datetime import datetime
        test_start_dt = datetime.fromisoformat(request.test_start)
        test_end_dt = datetime.fromisoformat(request.test_end)

        report: CandidateReport = await report_generator.generate_report(
            candidate_profile=request.candidate_profile,
            test_results=request.test_results,
            applied_position=request.applied_position,
            test_start=test_start_dt,
            test_end=test_end_dt
        )

        # Retourner le JSON du rapport
        return report_generator.generate_json(report)

    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

# New endpoints for evaluation reports and candidate matching

@router.post("/generate-evaluation-report")
async def generate_evaluation_report(request: EvaluationReportRequest):
    """
    Generate comprehensive evaluation report for a candidate
    """
    try:
        report = await evaluation_service.generate_evaluation_report(
            candidate_profile=request.candidate_profile,
            test_results=request.test_results,
            applied_position=request.applied_position,
            applied_positions=request.applied_positions,
            actual_global_score=request.actual_global_score,
            actual_correct_answers=request.actual_correct_answers,
            actual_total_questions=request.actual_total_questions,
            candidate_info=request.candidate_info,
            composite_score=request.composite_score
        )
        
        # Return JSON report as object (not string)
        return report.model_dump(exclude_none=True)
        
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/match-candidates-to-position")
async def match_candidates_to_position(request: MatchingRequest):
    """
    Match candidates to a specific position and rank them
    """
    try:
        # Convert Pydantic models to dicts
        position_dict = request.position_requirements.dict()
        candidates_list = [candidate.dict() for candidate in request.candidates_profiles]
        
        matching_result = await matching_service.match_candidates_to_position(
            position_requirements=position_dict,
            candidates_profiles=candidates_list
        )
        
        # Return JSON matching result as object (not string)
        return matching_result.model_dump(exclude_none=True)
        
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/get-best-candidates")
async def get_best_candidates_for_position(request: BestCandidatesRequest):
    """
    Get top N candidates for a position (simplified response)
    """
    try:
        # Convert Pydantic models to dicts
        position_dict = request.position_requirements.dict()
        candidates_list = [candidate.dict() for candidate in request.candidates_profiles]
        
        top_candidates = await matching_service.get_best_candidates_for_position(
            position_requirements=position_dict,
            candidates_profiles=candidates_list,
            top_n=request.top_n
        )
        
        return {
            "position": request.position_requirements.title,
            "total_candidates": len(candidates_list),
            "top_candidates": top_candidates
        }
        
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

# ===== ENDPOINTS ELASTICSEARCH =====

@router.post("/process-candidate", response_model=ProcessCandidateResponse)
async def process_candidate(request: ProcessCandidateRequest):
    """
    Traite un candidat : génère les embeddings et indexe dans Elasticsearch
    """
    # Recharger les variables d'environnement pour Elasticsearch
    load_dotenv()
    
    try:
        client = ElasticsearchConfig.get_client()
        
        # Générer les embeddings
        skills_embedding = embedding_service.generate_skills_embedding(request.skills)
        profile_embedding = embedding_service.generate_profile_embedding(request.summary)
        
        # Préparer les compétences pour BM25 (normalisation à la volée)
        skills_text = " ".join([skill.strip().lower() for skill in request.skills if skill and skill.strip()])
        
        # Préparer le document Elasticsearch (structure optimisée)
        candidate_doc = {
            "candidate_id": request.candidate_id,
            "skills": request.skills,                    # Original pour affichage
            "skills_text": skills_text,                  # Pour BM25
            "years_of_experience": request.years_of_experience,
            "skills_embedding": skills_embedding,
            "profile_embedding": profile_embedding,
            "indexed_at": datetime.now().isoformat(),
            "composite_score": 0.0
        }
        
        print(f"Préparation du candidat {request.candidate_id}:")
        print(f"  Skills: {request.skills}")
        print(f"  Skills text pour BM25: '{skills_text}'")
        print(f"  Nombre de compétences: {len(request.skills)}")
        
        # Indexer le document
        client.index(
            index=ElasticsearchConfig.CANDIDATES_INDEX,
            id=request.candidate_id,
            body=candidate_doc
        )
        
        return ProcessCandidateResponse(
            indexed=True,
            candidate_id=request.candidate_id,
            skills_count=len(request.skills),
            cv_length=len(request.summary),
            embedding_dimension=ElasticsearchConfig.EMBEDDING_DIMENSION,
            message=f"Candidat {request.candidate_id} indexé avec succès"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du traitement du candidat: {str(e)}")

@router.post("/process-position", response_model=ProcessPositionResponse)
async def process_position(request: ProcessPositionRequest):
    """
    Traite un poste : génère les embeddings et indexe dans Elasticsearch
    """
    # Recharger les variables d'environnement pour Elasticsearch
    load_dotenv()
    
    # Logs détaillés pour diagnostiquer
    print(f"=== DEBUG PROCESS-POSITION ===")
    print(f"Request reçue: {request}")
    print(f"position_id: {request.position_id}")
    print(f"title: {request.title}")
    print(f"description: {request.description}")
    print(f"requirements: '{request.requirements}'")
    print(f"required_skills: {request.required_skills}")
    print(f"Type de required_skills: {type(request.required_skills)}")
    
    try:
        client = ElasticsearchConfig.get_client()
        
        # Générer les embeddings du poste
        position_embedding = embedding_service.generate_position_embedding(
            request.description, 
            request.requirements
        )
        required_skills_embedding = embedding_service.generate_required_skills_embedding(
            request.required_skills
        )
        
        # Préparer le document Elasticsearch (sans requirements pour optimiser le matching)
        position_doc = {
            "position_id": request.position_id,
            "title": request.title,
            "description": request.description,
            "required_skills": request.required_skills,
            "position_embedding": position_embedding,
            "required_skills_embedding": required_skills_embedding,
            "created_at": datetime.now().isoformat()
        }
        
        # Indexer le document
        client.index(
            index=ElasticsearchConfig.POSITIONS_INDEX,
            id=request.position_id,
            body=position_doc
        )
        
        return ProcessPositionResponse(
            indexed=True,
            position_id=request.position_id,
            title=request.title,
            description_length=len(request.description),
            embedding_dimension=ElasticsearchConfig.EMBEDDING_DIMENSION,
            message=f"Poste {request.position_id} indexé avec succès"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du traitement du poste: {str(e)}")

@router.post("/compute-score", response_model=ComputeScoreResponse)
async def compute_score(request: ComputeScoreRequest):
    """
    Legacy endpoint - utilise l'ancienne méthode Python (conservé pour compatibilité)
    """
    print(f"=== DEBUG COMPUTE SCORE (LEGACY) ===")
    print(f"Request received: {request}")
    
    # Recharger les variables d'environnement pour Elasticsearch
    load_dotenv()
    
    try:
        client = ElasticsearchConfig.get_client()
        
        # Récupérer le candidat avec les embeddings
        candidate_result = client.search(
            index=ElasticsearchConfig.CANDIDATES_INDEX,
            body={
                "query": {
                    "term": {
                        "candidate_id": request.candidate_id
                    }
                },
                "_source": ["candidate_id", "skills", "years_of_experience", "profile_embedding", "skills_embedding"]
            }
        )
        
        if not candidate_result["hits"]["hits"]:
            raise HTTPException(status_code=404, detail=f"Candidat {request.candidate_id} non trouvé")
        
        candidate = candidate_result["hits"]["hits"][0]["_source"]
        
        # Récupérer le poste avec les embeddings
        position_result = client.search(
            index=ElasticsearchConfig.POSITIONS_INDEX,
            body={
                "query": {
                    "term": {
                        "position_id": request.position_id
                    }
                },
                "_source": ["position_id", "title", "description", "requirements", "required_skills", "position_embedding", "required_skills_embedding"]
            }
        )
        
        if not position_result["hits"]["hits"]:
            raise HTTPException(status_code=404, detail=f"Poste {request.position_id} non trouvé")
        
        position = position_result["hits"]["hits"][0]["_source"]
        
        # Debug uniquement - calcul vectoriel simple
        debug_result = embedding_service.calculate_debug_similarity(
            candidate["profile_embedding"], 
            position["position_embedding"]
        )
        
        vector_similarity = debug_result["vector_similarity"]
        
        # Approximation simple (legacy)
        text_similarity = vector_similarity * 0.8
        hybrid_similarity = (vector_similarity * 0.8) + (text_similarity * 0.2)
        
        # Pondération : 60% similarité hybride, 40% score technique
        technical_weight = 0.4
        hybrid_weight = 0.6
        
        print(f"   === CALCUL DÉTAILLÉ DU COMPOSITE SCORE (LEGACY) ===")
        print(f"   Vector similarity: {vector_similarity:.6f}")
        print(f"   Technical score: {request.technical_score:.6f}")
        
        # Étape 1: Calculer text_similarity
        print(f"   Text_similarity = Vector_similarity × 0.8")
        print(f"   Text_similarity = {vector_similarity:.6f} × 0.8 = {text_similarity:.6f}")
        
        # Étape 2: Calculer hybrid_similarity
        print(f"   Hybrid_similarity = (Vector_similarity × 0.7) + (Text_similarity × 0.3)")
        print(f"   Hybrid_similarity = ({vector_similarity:.6f} × 0.7) + ({text_similarity:.6f} × 0.3)")
        print(f"   Hybrid_similarity = {vector_similarity * 0.7:.6f} + {text_similarity * 0.3:.6f}")
        print(f"   Hybrid_similarity = {hybrid_similarity:.6f}")
        
        # Étape 3: Calculer composite_score final
        composite_score = (
            hybrid_similarity * hybrid_weight +
            request.technical_score * technical_weight
        )
        print(f"   Composite_score = (Hybrid_similarity × {hybrid_weight}) + (Technical_score × {technical_weight})")
        print(f"   Composite_score = ({hybrid_similarity:.6f} × {hybrid_weight}) + ({request.technical_score:.6f} × {technical_weight})")
        print(f"   Composite_score = {hybrid_similarity * hybrid_weight:.6f} + {request.technical_score * technical_weight:.6f}")
        print(f"   Composite_score = {composite_score:.6f}")
        print(f"   ===============================================")
        print(f"   Final composite_score: {composite_score:.6f}")
        
        # Déterminer la recommandation
        if composite_score >= 0.7:
            recommendation = "Excellent match"
        elif composite_score >= 0.6:
            recommendation = "Bon match"
        elif composite_score >= 0.4:
            recommendation = "Match modéré"
        else:
            recommendation = "Faible match"
        
        # Mettre à jour le score du candidat
        update_doc = {
            "composite_score": composite_score,
            "last_scored_at": datetime.now().isoformat()
        }
        
        client.update(
            index=ElasticsearchConfig.CANDIDATES_INDEX,
            id=request.candidate_id,
            body={"doc": update_doc}
        )
        
        return ComputeScoreResponse(
            candidate_id=request.candidate_id,
            position_id=request.position_id,
            composite_score=round(composite_score, 3),
            text_similarity=round(text_similarity, 3),
            vector_similarity=round(vector_similarity, 3),
            technical_weight=technical_weight,
            recommendation=recommendation,
            message=f"Score calculé (legacy): {composite_score:.3f}"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du calcul du score: {str(e)}")

@router.put("/candidate/{candidate_id}/update", response_model=UpdateCandidateResponse)
async def update_candidate(candidate_id: int, request: UpdateCandidateRequest):
    """
    Met à jour un document candidat dans Elasticsearch
    """
    print(f"=== DEBUG UPDATE CANDIDATE ===")
    print(f"Received update request for candidate_id: {candidate_id}")
    print(f"Request body: {request}")
    
    # Calculer le composite_score à partir des scores bruts si disponibles
    update_data = request.update_data
    technical_score = update_data.get('technical_score')
    best_match_score = update_data.get('best_match_score')
    
    if technical_score is not None and best_match_score is not None:
        print(f"\n=== CALCUL DÉTAILLÉ DU COMPOSITE SCORE (PYTHON) ===")
        print(f"Candidat ID: {candidate_id}")
        print(f"Timestamp du calcul: {update_data.get('last_scored_at', 'N/A')}")
        print(f"Formule utilisée: 60% score technique + 40% score matching")
        print(f"Score technique: {technical_score:.2f}%")
        print(f"Score matching (best match): {best_match_score:.2f}%")
        print(f"\n=== DÉTAILS DU CALCUL ===")
        
        # Convertir les scores en format 0-1 pour le calcul
        tech_score_normalized = technical_score / 100.0
        match_score_normalized = best_match_score / 100.0
        
        print(f"Composite_score = (Technical_score/100 × 0.5) + (Best_match_score/100 × 0.5)")
        print(f"Composite_score = ({technical_score:.2f}/100 × 0.5) + ({best_match_score:.2f}/100 × 0.5)")
        print(f"Composite_score = ({tech_score_normalized:.4f} × 0.5) + ({match_score_normalized:.4f} × 0.5)")
        print(f"Composite_score = {tech_score_normalized * 0.5:.4f} + {match_score_normalized * 0.5:.4f}")
        
        # Calculer le composite_score
        composite_score = (tech_score_normalized * 0.5) + (match_score_normalized * 0.5)
        print(f"Composite_score = {composite_score:.6f}")
        print(f"Composite_score = {composite_score * 100:.2f}%")
        print(f"=====================================")
        
        # Ajouter le composite_score calculé aux données de mise à jour
        update_data['composite_score'] = composite_score
        print(f"Composite score calculé et ajouté aux données de mise à jour: {composite_score:.6f}")
        
        # Mettre à jour le document dans Elasticsearch avec le composite_score
        try:
            client = ElasticsearchConfig.get_client()
            update_result = client.update(
                index=ElasticsearchConfig.CANDIDATES_INDEX,
                id=candidate_id,
                body={"doc": update_data}
            )
            print(f"Elasticsearch update result: {update_result}")
            print(f"Composite score {composite_score:.6f} sauvegardé dans Elasticsearch")
        except Exception as e:
            print(f"Erreur lors de la mise à jour Elasticsearch: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erreur lors de la mise à jour Elasticsearch: {str(e)}")
        
        # Retourner le composite_score pour que Java puisse le sauvegarder dans la base de données
        return UpdateCandidateResponse(
            success=True,
            candidate_id=candidate_id,
            message=f"Candidat {candidate_id} mis à jour avec succès - composite_score: {composite_score:.6f}",
            updated_fields=list(update_data.keys()),
            composite_score=composite_score  # Ajouter le composite_score calculé
        )
    elif 'composite_score' in update_data:
        # Fallback : utiliser le composite_score fourni (ancienne méthode)
        composite_score = update_data['composite_score']
        print(f"\n=== CALCUL DÉTAILLÉ DU COMPOSITE SCORE (MISE À JOUR) ===")
        print(f"Candidat ID: {candidate_id}")
        print(f"Composite score final (fourni): {composite_score:.6f} ({composite_score * 100:.2f}%)")
        print(f"Timestamp du calcul: {update_data.get('last_scored_at', 'N/A')}")
        print(f"Détails techniques non disponibles, utilisation du composite_score fourni")
        print(f"========================================================\n")
    else:
        print(f"\n=== AUCUN CALCUL COMPOSITE ===")
        print(f"Candidat ID: {candidate_id}")
        print(f"Pas de composite_score ni de scores bruts disponibles")
        print(f"Mise à jour des autres champs uniquement")
        print(f"=====================================\n")
    
    try:
        client = ElasticsearchConfig.get_client()
        
        # Valider que le candidat existe
        try:
            existing_doc = client.get(
                index=ElasticsearchConfig.CANDIDATES_INDEX,
                id=candidate_id
            )
            print(f"Found existing document for candidate {candidate_id}")
        except:
            raise HTTPException(status_code=404, detail=f"Candidat {candidate_id} non trouvé")
        
        # Préparer les données de mise à jour
        update_data = request.update_data
        print(f"Update data extracted: {update_data}")
        if not update_data:
            raise HTTPException(status_code=400, detail="Aucune donnée de mise à jour fournie")
        
        # Ajouter un timestamp pour le suivi
        update_data["last_updated_at"] = datetime.now().isoformat()
        print(f"Final update data with timestamp: {update_data}")
        
        # Mettre à jour le document
        update_result = client.update(
            index=ElasticsearchConfig.CANDIDATES_INDEX,
            id=candidate_id,
            body={"doc": update_data}
        )
        print(f"Elasticsearch update result: {update_result}")
        
        response = UpdateCandidateResponse(
            success=True,
            candidate_id=candidate_id,
            message=f"Candidat {candidate_id} mis à jour avec succès",
            updated_fields=list(update_data.keys())
        )
        print(f"Returning response: {response}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la mise à jour du candidat: {str(e)}")



@router.post("/compute-score-cible")
async def compute_score_cible(request: Dict):
    """
    Calcule le score de matching ciblé pour un candidat 
    """
    print(f"=== DEBUG COMPUTE SCORE CIBLE ===")
    print(f"Request received: {request}")
    
    try:
        candidate_id = request.get("candidate_id")
        print(f"Candidate ID extracted: {candidate_id}")
        
        if not candidate_id:
            raise HTTPException(status_code=400, detail="candidate_id is required")
        
        client = ElasticsearchConfig.get_client()
        
        # Récupérer le candidat
        candidate_result = client.search(
            index=ElasticsearchConfig.CANDIDATES_INDEX,
            body={
                "query": {
                    "term": {
                        "candidate_id": candidate_id
                    }
                },
                "_source": ["candidate_id", "skills", "years_of_experience", "profile_embedding", "skills_embedding"]
            }
        )
        
        if not candidate_result["hits"]["hits"]:
            raise HTTPException(status_code=404, detail=f"Candidat {candidate_id} non trouvé")
        
        candidate = candidate_result["hits"]["hits"][0]["_source"]
        
        # Récupérer les postes postulés depuis le request body (envoyés par Java)
        applied_position_ids = request.get("applied_position_ids", [])
        print(f"Applied position IDs from Java: {applied_position_ids}")
        
        # Si le candidat a des postes postulés, limiter la recherche à ces postes
        if applied_position_ids:
            print(f"Filtering positions to: {applied_position_ids}")
            
            positions_query = {
                "query": {
                    "terms": {"position_id": applied_position_ids}
                },
                "_source": ["position_id", "title", "description", "required_skills", "position_embedding", "required_skills_embedding"],
                "size": 100
            }
        else:
            # Si aucun poste postulé, retourner un score vide
            print("No applied positions found - candidate has not applied to any positions")
            return {
                "candidate_id": candidate_id,
                "matching_scores": [],
                "best_match": {"position_id": None, "title": "No positions applied", "score": 0.0},
                "average_score": 0.0,
                "technical_scores": {},
                "message": f"Candidate {candidate_id} has not applied to any positions"
            }
        
        positions_result = client.search(
            index=ElasticsearchConfig.POSITIONS_INDEX,
            body=positions_query
        )
        
        if not positions_result["hits"]["hits"]:
            raise HTTPException(status_code=404, detail="Aucun poste trouvé")
        
        positions = [hit["_source"] for hit in positions_result["hits"]["hits"]]
        
        # Calculer les scores pour tous les postes
        matching_scores = []
        best_match_score = 0.0
        best_match_position_id = None
        best_match_title = None
        
        print(f"Processing {len(positions)} positions for candidate {candidate_id}")
        
        for position in positions:
            print(f"\n--- Processing position {position['position_id']}: {position['title']} ---")
            # 1. Récupérer les compétences requises du poste
            required_skills_text = " ".join(position.get('required_skills', []))
            print(f"Required skills: {position.get('required_skills', [])}")
            
            # 2. Calculer BM25 avec skills_text (optimisé)
            required_skills = position.get('required_skills', [])
            skills_query = " ".join([skill.strip().lower() for skill in required_skills if skill and skill.strip()])
            
            print(f"      Normalized query: '{skills_query}'")
            
            # UNE SEULE requête BM25 propre avec skills_text
            bm25_search = {
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"candidate_id": candidate_id}},
                            {"match": {"skills_text": skills_query}}
                        ]
                    }
                },
                "_source": ["candidate_id", "skills", "skills_text"],
                "size": 1,
                "explain": True
            }
            
            bm25_result = client.search(
                index=ElasticsearchConfig.CANDIDATES_INDEX,
                body=bm25_search
            )
            
            # Initialiser les variables
            normalized_bm25 = 0.0
            bm25_score = 0.0
            individual_scores = []
            
            # Calculer le score BM25
            if bm25_result["hits"]["hits"]:
                raw_bm25_score = bm25_result["hits"]["hits"][0]["_score"]
                # NORMALISATION SIGMOÏDE OBLIGATOIRE
                normalized_bm25 = ScoreNormalizer.normalize_bm25_score(raw_bm25_score)
                bm25_percentage = ScoreNormalizer.normalize_to_percentage(normalized_bm25)
                bm25_score = normalized_bm25  # Utiliser le score normalisé
                
                print(f"   ✓ Raw BM25 score: {raw_bm25_score:.6f}")
                print(f"   ✓ Normalized BM25 (sigmoïde): {normalized_bm25:.6f}")
                print(f"   ✓ BM25 percentage: {bm25_percentage:.2f}%")
                
                # Analyse détaillée du score
                if hasattr(ScoreNormalizer, 'get_score_breakdown'):
                    score_breakdown = ScoreNormalizer.get_score_breakdown(raw_bm25_score)
                    print(f"   ✓ Classification: {score_breakdown['classification']}")
                
                # Créer les scores individuels pour compatibilité
                # Le BM25 a trouvé un match, distribuer le score proportionnellement
                for skill in required_skills:
                    # Vérifier si cette compétence spécifique existe dans les skills du candidat
                    candidate_skills = candidate.get("skills", [])
                    skill_found = any(skill.lower() in candidate_skill.lower() or candidate_skill.lower() in skill.lower() 
                                    for candidate_skill in candidate_skills)
                    
                    if skill_found:
                        # La compétence a été trouvée, donner une partie du score BM25 normalisé
                        individual_score = normalized_bm25 / len(required_skills)  # Distribuer équitablement
                        individual_scores.append((skill, individual_score))
                        print(f"      ✓ Skill '{skill}': Found in candidate skills = {individual_score:.6f}")
                    else:
                        individual_scores.append((skill, 0.0))
                        print(f"      ✗ Skill '{skill}': NOT FOUND in candidate skills")
            else:
                # Pas de match BM25, tous les scores sont 0
                bm25_score = 0.0
                print(f"      ✗ Combined BM25 score: 0.000000 (NO MATCHES)")
                
                # Pas de match, tous les scores individuels sont 0
                for skill in required_skills:
                    individual_scores.append((skill, 0.0))
                    print(f"      ✗ Skill '{skill}': NO BM25 MATCH")
                
                # Diagnostic: vérifier le mapping du champ skills
                print(f"      → Diagnosing field mapping...")
                try:
                    mapping_result = client.indices.get_mapping(
                        index=ElasticsearchConfig.CANDIDATES_INDEX
                    )
                    skills_mapping = mapping_result[ElasticsearchConfig.CANDIDATES_INDEX]["mappings"]["properties"].get("skills", {})
                    print(f"      Skills field mapping: {skills_mapping}")
                except Exception as e:
                    print(f"      Could not retrieve mapping: {e}")
            
            print(f"      {len([s for s, score in individual_scores if score > 0])}/{len(required_skills)} skills matched")
            
            # Calculer les similarités vectorielles
            skills_similarity = embedding_service.cosine_similarity(
                candidate.get("skills_embedding", []),
                position.get("required_skills_embedding", [])
            )
            print(f"Skills similarity: {skills_similarity:.6f}")
            
            vector_similarity = embedding_service.cosine_similarity(
                candidate.get("profile_embedding", []),
                position.get("position_embedding", [])
            )
            print(f"Profile similarity: {vector_similarity:.6f}")
            
            # Calculer le score hybride
            print(f"   === CALCUL DÉTAILLÉ DU SCORE ===")
            print(f"   Skills similarity: {skills_similarity:.6f}")
            print(f"   Profile similarity: {vector_similarity:.6f}")
            print(f"   BM25 score: {bm25_score:.6f}")
            
            # Étape 1: Calculer le vector_score (pondération des similarités)
            vector_score = (skills_similarity * 0.6) + (vector_similarity * 0.4)
            print(f"   Vector_score = (Skills_similarity × 0.6) + (Profile_similarity × 0.4)")
            print(f"   Vector_score = ({skills_similarity:.6f} × 0.6) + ({vector_similarity:.6f} × 0.4)")
            print(f"   Vector_score = {skills_similarity * 0.6:.6f} + {vector_similarity * 0.4:.6f}")
            print(f"   Vector_score = {vector_score:.6f}")
            
            # Étape 2: Calculer le combined_score final
            combined_score = (vector_score * 0.7) + (bm25_score * 0.3)
            print(f"   Combined_score = (Vector_score × 0.7) + (BM25_score × 0.3)")
            print(f"   Combined_score = ({vector_score:.6f} × 0.7) + ({bm25_score:.6f} × 0.3)")
            print(f"   Combined_score = {vector_score * 0.7:.6f} + {bm25_score * 0.3:.6f}")
            print(f"   Combined_score = {combined_score:.6f}")
            print(f"   ================================")
            print(f"   Final combined_score: {combined_score:.6f}")
            
            position_score = {
                "position_id": position["position_id"],
                "title": position["title"],
                "vector_similarity": round(vector_similarity, 3),
                "skills_similarity": round(skills_similarity, 3),
                "combined_score": round(combined_score, 3),
                "bm25_score": round(bm25_score, 3),
                "bm25_debug": {
                    "required_skills": position.get('required_skills', []),
                    "candidate_skills": candidate.get("skills", []),
                    "individual_scores": [{"skill": skill, "score": round(score, 6)} for skill, score in individual_scores],
                    "bm25_hits": len(bm25_result["hits"]["hits"]),
                    "matched_skills_count": len([s for s, score in individual_scores if score > 0])
                }
            }
            
            matching_scores.append(position_score)
            
            # Garder le meilleur score
            if combined_score > best_match_score:
                best_match_score = combined_score
                best_match_position_id = position["position_id"]
                best_match_title = position["title"]
        
        # Calculer le score moyen
        average_matching_score = sum(score["combined_score"] for score in matching_scores) / len(matching_scores) if matching_scores else 0.0
        
        print(f"\n=== FINAL RESULTS ===")
        print(f"Best match: {best_match_title} (ID: {best_match_position_id}) with score: {best_match_score:.6f}")
        print(f"Average matching score: {average_matching_score:.6f}")
        print(f"Total positions processed: {len(matching_scores)}")
        
        return {
            "candidate_id": candidate_id,
            "matching_scores": matching_scores,
            "best_match_score": round(best_match_score, 3),
            "best_match_position_id": best_match_position_id,
            "best_match_title": best_match_title,
            "average_matching_score": round(average_matching_score, 3),
            "total_positions": len(matching_scores),
            "message": f"Score de matching calculé avec succès pour le candidat {candidate_id}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du calcul du score de matching: {str(e)}")

@router.post("/rank-candidates", response_model=RankingResponse)
async def rank_candidates(request: RankingRequest):
    """
    Classe les candidats en fonction de leur compatibilité avec un poste spécifique
    en utilisant les capacités d'Elasticsearch (BM25 + similarités vectorielles)
    """
    # Recharger les variables d'environnement pour Elasticsearch
    load_dotenv()
    
    print(f"=== RANKING CANDIDATES REQUEST ===")
    print(f"Request data: {request}")
    print(f"Position ID: {request.position_id} (type: {type(request.position_id)})")
    print(f"Required Skills: {request.required_skills}")
    print(f"Top N: {request.top_n}")
    print(f"Min Score: {request.min_score}")

    try:
        client = ElasticsearchConfig.get_client()

        # Récupérer les informations du poste si position_id est fourni
        position_data = None
        if request.position_id:
            print(f"Recherche du poste avec ID: {request.position_id}")
            position_result = client.search(
                index=ElasticsearchConfig.POSITIONS_INDEX,
                body={
                    "query": {
                        "term": {
                            "position_id": request.position_id
                        }
                    }
                }
            )

            print(f"Résultat recherche poste: {len(position_result['hits']['hits'])} trouvé(s)")

            if not position_result["hits"]["hits"]:
                print(f"Poste {request.position_id} non trouvé dans Elasticsearch")
                raise HTTPException(status_code=404, detail=f"Poste {request.position_id} non trouvé")

            position_data = position_result["hits"]["hits"][0]["_source"]
            print(f"Données poste trouvées: {position_data}")

            # Récupérer les candidats ayant postulé pour ce poste
            applied_candidate_ids = await get_applications_for_position(request.position_id)

            if not applied_candidate_ids:
                print(f"Aucun candidat n'a postulé au poste {request.position_id}")
                # Retourner une réponse vide mais valide
                return RankingResponse(
                    position_id=str(request.position_id),
                    position_title=request.position_title or (position_data.get("title") if position_data else None),
                    total_candidates=0,
                    ranked_candidates=[],
                    ranking_method="hybrid_elasticsearch"
                )
        else:
            applied_candidate_ids = []  # Pas de filtrage si pas de position_id

        # Utiliser les compétences fournies ou celles du poste
        required_skills = request.required_skills
        if not required_skills and position_data:
            required_skills = position_data.get("required_skills", [])

        
        if not required_skills:
            raise HTTPException(status_code=400, detail="Aucune compétence requise fournie")
        
        # Le composite_score contient déjà : matching + score technique
        search_body = {
            "query": {
                "match_all": {}  # Récupérer tous les candidats, le tri se fera sur composite_score
            },
            "size": 1000,  # Récupérer beaucoup plus de candidats pour ensuite filtrer
            "_source": ["candidate_id", "skills", "years_of_experience", "composite_score"],
            "sort": [
                {"composite_score": {"order": "desc"}}  # Trier directement par composite_score décroissant
            ]
        }
        
        # Vérifier d'abord si l'index candidates existe et combien de documents il contient
        try:
            index_stats = client.indices.stats(index=ElasticsearchConfig.CANDIDATES_INDEX)
            doc_count = index_stats["indices"][ElasticsearchConfig.CANDIDATES_INDEX]["total"]["docs"]["count"]
            print(f"Index {ElasticsearchConfig.CANDIDATES_INDEX} contains {doc_count} documents")
        except Exception as e:
            print(f"Error checking index stats: {e}")
            # Essayer de voir si l'index existe
            try:
                exists = client.indices.exists(index=ElasticsearchConfig.CANDIDATES_INDEX)
                print(f"Index {ElasticsearchConfig.CANDIDATES_INDEX} exists: {exists}")
            except Exception as e2:
                print(f"Error checking if index exists: {e2}")
        
        print(f"Search query: {search_body}")
        
        result = client.search(
            index=ElasticsearchConfig.CANDIDATES_INDEX,
            body=search_body
        )
        
        candidates = []
        hits = result["hits"]["hits"]
        
        print(f"Found {len(hits)} candidates in Elasticsearch")
        print(f"Total hits in result: {result['hits']['total']['value']}")
        
        # Collecter les IDs des candidats ayant postulé pour récupérer leurs infos complètes
        applied_candidates_ids_for_info = []
        for hit in hits:
            candidate = hit["_source"]
            candidate_id = candidate.get("candidate_id")
            
            # Filtrer : ne garder que les candidats ayant postulé au poste (si position_id est fourni)
            if applied_candidate_ids and candidate_id not in applied_candidate_ids:
                continue
            
            applied_candidates_ids_for_info.append(candidate_id)
        
        # Récupérer les informations complètes des candidats depuis le backend
        candidates_info = await get_candidates_info_batch(applied_candidates_ids_for_info)
        print(f"Récupéré infos complètes pour {len(candidates_info)} candidats")
        
        for hit in hits:
            candidate = hit["_source"]
            candidate_id = candidate.get("candidate_id")
            
            print(f"Processing candidate: {candidate}")
            
            # Filtrer : ne garder que les candidats ayant postulé au poste (si position_id est fourni)
            if applied_candidate_ids and candidate_id not in applied_candidate_ids:
                print(f"⏭️ Skipping candidate {candidate_id} - n'a pas postulé au poste {request.position_id}")
                continue
            
            print(f"✅ Candidate {candidate_id} a postulé au poste - processing...")
            
            # Utiliser directement le composite_score pré-calculé
            composite_score = candidate.get("composite_score", 0.0)
            candidate_skills = candidate.get("skills", [])
            
            print(f"Candidate {candidate_id}: composite_score={composite_score}, skills={candidate_skills}")
            
            # Analyser les compétences matching pour l'affichage
            matched_skills = []
            for skill in required_skills:
                skill_lower = skill.lower().strip()
                skill_found = any(
                    skill_lower in candidate_skill.lower() or 
                    candidate_skill.lower() in skill_lower 
                    for candidate_skill in candidate_skills
                )

                if skill_found:
                    matched_skills.append(skill)

            try:
                # Récupérer les informations complètes du candidat depuis le backend
                candidate_info = candidates_info.get(candidate_id)

                # Créer le candidat classé avec le score pré-calculé
                ranked_candidate = RankedCandidate(
                    candidate_id=candidate_id,
                    skills=candidate_skills,
                    years_of_experience=candidate.get("years_of_experience"),
                    composite_score=round(composite_score, 3),
                    bm25_score=None,  # Plus nécessaire, score pré-calculé
                    vector_score=None,  # Plus nécessaire, score pré-calculé
                    skills_similarity=None,  # Plus nécessaire, score pré-calculé
                    profile_similarity=None,  # Plus nécessaire, score pré-calculé
                    match_details={
                        "matched_skills": matched_skills,
                        "total_required": len(required_skills),
                        "matched_count": len(matched_skills),
                        "match_percentage": round(len(matched_skills) / len(required_skills) * 100, 1),
                        "note": "Score composite pré-calculé (matching + score technique) - Candidat ayant postulé"
                    },
                    candidate_info=candidate_info  # Informations complètes depuis PostgreSQL
                )

                candidates.append(ranked_candidate)
                print(f"✅ Successfully created ranked candidate {candidate_id}")

            except Exception as e:
                print(f"❌ Error creating ranked candidate {candidate_id}: {e}")
                print(f"   Candidate data: {candidate}")
                raise e
        
        # Les candidats sont déjà triés par composite_score grâce au sort Elasticsearch
        
        # Filtrer par score minimum et limiter à top_n
        # Autoriser même les scores de 0 si min_score est 0
        filtered_candidates = [
            c for c in candidates 
            if c.composite_score >= request.min_score or (request.min_score == 0.0 and c.composite_score >= 0)
        ][:request.top_n]
        
        print(f"Ranked {len(filtered_candidates)} candidates (min score: {request.min_score})")
        
        try:
            print(f"=== CRÉATION DE LA RÉPONSE ===")
            print(f"position_id: {request.position_id}")
            print(f"position_title: {request.position_title or (position_data.get('title') if position_data else None)}")
            print(f"total_candidates: {len(candidates)}")
            print(f"ranked_candidates count: {len(filtered_candidates)}")
            print(f"ranking_method: hybrid_elasticsearch")
            
            response = RankingResponse(
                position_id=str(request.position_id),  # Convertir int en string
                position_title=request.position_title or (position_data.get("title") if position_data else None),
                total_candidates=len(candidates),  # Uniquement les candidats ayant postulé
                ranked_candidates=filtered_candidates,
                ranking_method="hybrid_elasticsearch"
            )
            
            print(f"✅ RankingResponse created successfully")
            return response
            
        except Exception as e:
            print(f"❌ Error creating RankingResponse: {e}")
            print(f"   Type of error: {type(e)}")
            print(f"   Request data: {request}")
            print(f"   Position data: {position_data}")
            print(f"   Filtered candidates: {len(filtered_candidates)}")
            raise e
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du ranking des candidats: {str(e)}")

@router.post("/search-candidates", response_model=SemanticSearchResponse)
async def search_candidates_semantic(request: SemanticSearchRequest):
    """
    Recherche sémantique hybride : kNN vectoriel + BM25 mots-clés.

    Principe pour les débutantes ES :
    ┌─────────────────────────────────────────────────────────┐
    │  kNN   → "trouve les vecteurs les plus proches"         │
    │  BM25  → "trouve les documents avec ces mots-clés"      │
    │  RRF   → "fusionne les deux listes intelligemment"      │
    └─────────────────────────────────────────────────────────┘
    """
    import time
    import numpy as np
    start_time = time.time()
    load_dotenv()

    try:
        client = ElasticsearchConfig.get_client()

        # ✅ Fix principal : utiliser generate_query_embedding, pas generate_profile_embedding
        query_embedding = embedding_service.generate_query_embedding(request.query)

        print(f"=== SEMANTIC SEARCH ===")
        print(f"Query       : '{request.query}'")
        print(f"Mode        : {request.search_mode}")
        print(f"Vector dim  : {len(query_embedding)}")

        # Construire et exécuter la requête ES
        search_body = build_semantic_search_query(
            query=request.query,
            query_embedding=query_embedding,
            search_mode=request.search_mode,
            max_results=request.max_results,
            filters=request.filters or {}
        )

        result = client.search(
            index=ElasticsearchConfig.CANDIDATES_INDEX,
            body=search_body
        )

        hits = result["hits"]["hits"]
        print(f"ES hits     : {len(hits)}")

        # DEBUG: Vérifier pourquoi 0 résultats en mode hybrid
        if len(hits) == 0 and request.search_mode == "hybrid":
            print("=== DEBUG HYBRID 0 RESULTS ===")
            # Tester une requête simple pour voir si l'index a des données
            simple_query = {
                "query": {"match_all": {}},
                "size": 3,
                "_source": ["candidate_id", "skills_embedding", "profile_embedding"]
            }
            simple_result = client.search(
                index=ElasticsearchConfig.CANDIDATES_INDEX,
                body=simple_query
            )
            simple_hits = simple_result["hits"]["hits"]
            print(f"Total documents in index: {simple_result['hits']['total']['value']}")

            if simple_hits:
                sample_doc = simple_hits[0]["_source"]
                print(f"Sample doc {sample_doc.get('candidate_id')}:")
                print(f"  - has skills_embedding: {'skills_embedding' in sample_doc and bool(sample_doc['skills_embedding'])}")
                print(f"  - has profile_embedding: {'profile_embedding' in sample_doc and bool(sample_doc['profile_embedding'])}")
                print(f"  - skills: {sample_doc.get('skills', [])[:3]}")
            else:
                print("No documents found in index!")
        elif len(hits) > 0:
            print("=== DEBUG HYBRID SUCCESS ===")
            sample_hit = hits[0]
            src = sample_hit["_source"]
            print(f"Sample hit {src.get('candidate_id')}:")
            print(f"  - es_score: {sample_hit['_score']}")
            print(f"  - has skills_embedding: {'skills_embedding' in src and bool(src['skills_embedding'])}")
            print(f"  - skills: {src.get('skills', [])[:3]}")

        # Récupérer les infos candidats depuis Spring Boot en batch
        candidate_ids = [h["_source"]["candidate_id"] for h in hits]
        candidates_info = await get_candidates_info_batch(candidate_ids)

        # Calculer les scores max pour normalisation
        es_scores = [h["_score"] for h in hits if h["_score"]]
        max_es_score = max(es_scores) if es_scores else 1.0

        search_results = []

        for hit in hits:
            src          = hit["_source"]
            candidate_id = src["candidate_id"]
            es_score     = hit["_score"] or 0.0

            # ── Scores détaillés ──────────────────────────────────────────
            # Similarité cosine query ↔ skills_embedding
            skills_sim = embedding_service.cosine_similarity(
                query_embedding, src.get("skills_embedding", [])
            )
            # Similarité cosine query ↔ profile_embedding (secondaire)
            profile_sim = embedding_service.cosine_similarity(
                query_embedding, src.get("profile_embedding", [])
            )

            # Score sémantique : max skills, profile réduit
            # (skills_embedding encode les technos → plus pertinent pour une query "ReactJS")
            # Évite la dilution du signal fort
            semantic_score = max(skills_sim, profile_sim * 0.8)

            # Score hybride selon le mode - CORRIGÉ pour script_score
            if request.search_mode == "semantic":
                # Mode sémantique : calculer aussi le score keyword si disponible
                keyword_score = ScoreNormalizer.normalize_bm25_score(es_score) if es_score > 0 else None
                hybrid_score = semantic_score
            elif request.search_mode == "keyword":
                # Score keyword : normaliser le score BM25 brut ES → 0-1
                keyword_score = ScoreNormalizer.normalize_bm25_score(es_score)
                hybrid_score = keyword_score
            else:
                # hybrid avec script_score : es_score contient déjà le score hybride calculé
                hybrid_score = es_score
                keyword_score = ScoreNormalizer.normalize_bm25_score(es_score) if es_score > 0 else None

            print(f"  Candidate {candidate_id}: "
                  f"skills_sim={skills_sim:.3f}, "
                  f"profile_sim={profile_sim:.3f}, "
                  f"semantic={semantic_score:.3f}, "
                  f"keyword={keyword_score if keyword_score is not None else 'None'}, "
                  f"hybrid={hybrid_score:.3f}")

            # ── Informations candidat ─────────────────────────────────────
            info = candidates_info.get(candidate_id, {})
            name  = f"{info.get('firstName','')} {info.get('lastName','')}".strip()
            name  = name or f"Candidat #{candidate_id}"
            email = info.get("email", f"candidate.{candidate_id}@proxym.com")

            # ── Compétences pertinentes ───────────────────────────────────
            relevant_skills  = extract_relevant_skills_semantic(
                src, request.query
            )
            matched_concepts = _extract_matched_concepts(src, request.query)
            highlights       = _extract_highlights(src)
            query_keywords   = _extract_query_keywords(src, request.query)

            search_results.append(SemanticSearchResult(
                candidate_id    =candidate_id,
                name            =name,
                email           =email,
                skills          =src.get("skills", []),
                years_of_experience=src.get("years_of_experience"),
                location        =src.get("location"),
                semantic_score  =round(max(0.0, semantic_score), 3),
                keyword_score   =round(max(0.0, keyword_score if keyword_score is not None else 0.0), 3),
                hybrid_score    =round(max(0.0, hybrid_score), 3),
                matched_concepts=matched_concepts,
                relevant_skills =relevant_skills,
                search_highlights=highlights,
                query_keywords  =query_keywords
            ))

        # Tri final par hybrid_score décroissant
        search_results.sort(key=lambda x: x.hybrid_score, reverse=True)

        # Filtrer par min_score après calcul
        search_results = [
            r for r in search_results if r.hybrid_score >= request.min_score
        ]

        processing_time = (time.time() - start_time) * 1000
        print(f"Done in {processing_time:.0f}ms — {len(search_results)} results returned")

        return SemanticSearchResponse(
            query           =request.query,
            total_found     =result["hits"]["total"]["value"],
            returned_results=len(search_results),
            search_results  =search_results,
            processing_time_ms=round(processing_time, 2),
            search_metadata ={
                "search_mode"      : request.search_mode,
                "index"            : ElasticsearchConfig.CANDIDATES_INDEX,
                "took_ms"          : result["took"],
                "embedding_dim"    : len(query_embedding),
                "max_es_score"     : round(max_es_score, 4),
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Semantic search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def build_semantic_search_query(
    query: str,
    query_embedding: List[float],
    search_mode: str,
    max_results: int,
    filters: Dict
) -> Dict:
    """
    Construit la requête ES selon le mode.

    ES propose 3 approches :
      1. kNN seul       → cherche par proximité vectorielle
      2. BM25 seul      → cherche par mots-clés
      3. kNN + BM25 RRF → fusionne les deux classements (Reciprocal Rank Fusion)
                          C'est l'approche la plus robuste.
    """

    base_source = [
        "candidate_id", "skills", "years_of_experience",
        "skills_text", "skills_embedding", "profile_embedding", "composite_score"
    ]

    if search_mode == "semantic":
        # kNN combiné sur skills ET profile embeddings via script_score
        # Combine les similarités cosine des deux embeddings
        return {
            "query": {
                "script_score": {
                    "query": {"match_all": {}},
                    "script": {
                        "source": """
                        double skills_sim = cosineSimilarity(params.query_vector, 'skills_embedding');
                        double profile_sim = cosineSimilarity(params.query_vector, 'profile_embedding');
                        
                        // Normaliser les scores entre 0 et 1
                        double skills_norm = (skills_sim + 1) / 2;
                        double profile_norm = (profile_sim + 1) / 2;
                        
                        // Score combiné : 70% skills + 30% profile
                        return (skills_norm * 0.7) + (profile_norm * 0.3);
                        """,
                        "params": {
                            "query_vector": query_embedding
                        }
                    }
                }
            },
            "_source": base_source,
            "size": max_results
        }

    elif search_mode == "keyword":
        # BM25 pur sur skills_text
        # fuzziness AUTO → "mobil" trouve "mobile", "Mobil", etc.
        return {
            "query": {
                "multi_match": {
                    "query"    : query,
                    "fields"   : ["skills_text^3", "skills^2"],
                    "type"     : "best_fields",
                    "fuzziness": "AUTO"
                }
            },
            "_source": base_source,
            "size": max_results
        }

    else:
        # ── Mode HYBRIDE avec script_score (compatible) ──────────────
        # Fusion kNN + BM25 via script_score quand RRF n'est pas disponible
        return {
            "query": {
                "script_score": {
                    "query": {
                        "multi_match": {
                            "query"    : query,
                            "fields"   : ["skills_text^3", "skills^2"],
                            "type"     : "best_fields",
                            "fuzziness": "AUTO"
                        }
                    },
                    "script": {
                        "source": """
                        double bm25_score = _score;
                        double bm25_norm = bm25_score / (bm25_score + 1);
                        
                        double semantic_score = cosineSimilarity(params.query_vector, 'skills_embedding');
                        double semantic_norm = (semantic_score + 1) / 2;
                        
                        // Hybrid score : 70% sémantique + 30% BM25
                        return (semantic_norm * 0.7) + (bm25_norm * 0.3);
                        """,
                        "params": {
                            "query_vector": query_embedding
                        }
                    }
                }
            },
            "_source": base_source,
            "size": max_results
        }

def _extract_relevant_skills(
    skills: List[str],
    query: str,
    query_embedding: List[float],
    svc: "EmbeddingService",
    src: Dict
) -> List[str]:
    """
    Retourne les skills pertinents via double critère :
    - match textuel partiel (rapide)
    - similarité cosine embedding (sémantique)
    
    OPTIMISATION: Utilise skills_embedding pré-calculés si disponibles
    """
    if not skills:
        return []

    query_lower = query.lower()
    scored = []

    # OPTIMISATION : Utiliser les embeddings pré-calculés si disponibles
    # Cette fonction sera appelée avec src qui contient déjà skills_embedding
    # Pour éviter le ré-encodage coûteux, on fait une recherche textuelle simple
    for skill in skills:
        # Score textuel 0 ou 1
        text_score = 1.0 if any(
            w in skill.lower() for w in query_lower.split() if len(w) > 2
        ) else 0.0

        # Score sémantique simplifié (basé sur la présence de mots-clés)
        # Pour une vraie similarité sémantique, il faudrait utiliser skills_embedding pré-calculés
        sem_score = text_score * 0.8  # Approximation simple

        # Combiné : texte booste, sémantique classe
        combined = (text_score * 0.4) + (sem_score * 0.6)

        if combined > 0.25:
            scored.append((skill, combined))

    scored.sort(key=lambda x: x[1], reverse=True)
    return [s for s, _ in scored[:8]]

def _extract_matched_concepts(src: Dict, query: str) -> List[str]:
    """Skills dont un mot correspond exactement à un mot de la query."""
    query_words = {w for w in query.lower().split() if len(w) > 2}
    return [
        s for s in src.get("skills", [])
        if query_words & set(s.lower().split())
    ][:5]

def _extract_highlights(src: Dict) -> List[str]:
    highlights = []
    if src.get("skills"):
        highlights.append(f"Compétences: {', '.join(src['skills'][:4])}")
    if src.get("years_of_experience"):
        highlights.append(f"Expérience: {src['years_of_experience']} ans")
    return highlights

def _extract_query_keywords(src: Dict, query: str) -> List[str]:
    skills_text = src.get("skills_text", "")
    found = []
    for word in query.lower().split():
        if len(word) > 2 and word in skills_text.lower() and word not in found:
            found.append(word)
    return found[:8]