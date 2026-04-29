"""
Service de normalisation des scores BM25 avec fonction sigmoïde
"""
import math
from typing import Dict, Any

class ScoreNormalizer:
    """Service pour normaliser les scores BM25 en utilisant la fonction sigmoïde"""
    
    @staticmethod
    def normalize_bm25_score(bm25_score: float) -> float:
        """
        Normalise le score BM25 en utilisant la fonction sigmoïde
        
        Formule: 1 / (1 + exp(-score))
        
        Args:
            bm25_score: Score brut BM25 (peut être négatif ou positif)
            
        Returns:
            float: Score normalisé dans l'intervalle [0, 1]
        """
        try:
            # Utiliser la fonction sigmoïde pour normaliser
            normalized = 1 / (1 + math.exp(-bm25_score))
            
            # S'assurer que le résultat est dans [0, 1]
            return max(0.0, min(1.0, normalized))
            
        except (ValueError, OverflowError):
            # Gérer les cas extrêmes (scores très grands ou très petits)
            if bm25_score > 0:
                return 1.0  # Score très positif → 1.0
            else:
                return 0.0  # Score très négatif → 0.0
    
    @staticmethod
    def normalize_to_percentage(score: float) -> float:
        """
        Convertit un score normalisé [0, 1] en pourcentage [0, 100]
        
        Args:
            score: Score normalisé dans [0, 1]
            
        Returns:
            float: Pourcentage dans [0, 100]
        """
        return min(max(score * 100.0, 0.0), 100.0)
    
    @staticmethod
    def get_score_breakdown(bm25_score: float) -> Dict[str, Any]:
        """
        Fournit une analyse détaillée de la normalisation
        
        Args:
            bm25_score: Score brut BM25
            
        Returns:
            Dict: Analyse détaillée du score
        """
        normalized = ScoreNormalizer.normalize_bm25_score(bm25_score)
        percentage = ScoreNormalizer.normalize_to_percentage(normalized)
        
        return {
            "bm25_raw": bm25_score,
            "bm25_normalized": normalized,
            "bm25_percentage": percentage,
            "formula": "1 / (1 + exp(-score))",
            "classification": ScoreNormalizer._classify_score(normalized)
        }
    
    @staticmethod
    def _classify_score(normalized_score: float) -> str:
        """
        Classifie le score normalisé
        
        Args:
            normalized_score: Score normalisé dans [0, 1]
            
        Returns:
            str: Classification du score
        """
        if normalized_score >= 0.8:
            return "excellent"
        elif normalized_score >= 0.6:
            return "bon"
        elif normalized_score >= 0.4:
            return "moyen"
        elif normalized_score >= 0.2:
            return "faible"
        else:
            return "très faible"
