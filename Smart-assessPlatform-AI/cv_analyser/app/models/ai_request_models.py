"""
Modèles Pydantic pour les requêtes AI service
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# ===== MODÈLES POUR /process-candidate =====

class ProcessCandidateRequest(BaseModel):
    """Requête pour traiter un candidat"""
    candidate_id: int
    skills: List[str]
    summary: str
    years_of_experience: Optional[int] = 0

class ProcessCandidateResponse(BaseModel):
    """Réponse pour le traitement d'un candidat"""
    indexed: bool
    candidate_id: int
    skills_count: int
    cv_length: int
    embedding_dimension: int
    message: str

# ===== MODÈLES POUR /compute-score =====

class ComputeScoreRequest(BaseModel):
    """Requête pour calculer le score de matching"""
    candidate_id: int
    position_id: int
    technical_score: Optional[float] = 0.0

class ComputeScoreResponse(BaseModel):
    """Réponse pour le score de matching"""
    candidate_id: int
    position_id: int
    composite_score: float
    text_similarity: float
    vector_similarity: float
    technical_weight: float
    recommendation: str
    message: str

# Modèles pour le matching ciblé
class ComputeScoreCibleRequest(BaseModel):
    candidate_id: int

class ComputeScoreCibleResponse(BaseModel):
    candidate_id: int
    matching_scores: List[Dict]  # Score pour chaque poste postulé
    best_match: Dict  # Meilleur matching
    average_score: float
    technical_scores: Dict[int, float]  # Scores techniques par poste
    message: str

# ===== MODÈLES POUR /candidate/{id}/update =====

class UpdateCandidateRequest(BaseModel):
    """Requête pour mettre à jour un candidat dans Elasticsearch"""
    candidate_id: int
    update_data: Dict[str, Any]

class UpdateCandidateResponse(BaseModel):
    """Réponse pour la mise à jour d'un candidat"""
    success: bool
    candidate_id: int
    updated_fields: List[str]
    message: str
    composite_score: Optional[float] = None  # Ajouter le composite_score calculé par Python

# ===== MODÈLES POUR /process-position =====

class ProcessPositionRequest(BaseModel):
    """Requête pour traiter un poste"""
    position_id: int
    title: str
    description: str
    requirements: Optional[str] = ""
    company: Optional[str] = ""
    required_skills: Optional[List[str]] = []

class ProcessPositionResponse(BaseModel):
    """Réponse pour le traitement d'un poste"""
    indexed: bool
    position_id: int
    title: str
    description_length: int
    embedding_dimension: int
    message: str

# ===== MODÈLES UTILITAIRES =====

class ErrorResponse(BaseModel):
    """Modèle pour les réponses d'erreur"""
    error: str
    message: str
    timestamp: datetime = datetime.now()

class SuccessResponse(BaseModel):
    """Modèle pour les réponses de succès"""
    success: bool
    message: str
    timestamp: datetime = datetime.now()
