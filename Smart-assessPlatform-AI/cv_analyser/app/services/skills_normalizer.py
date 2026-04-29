"""
Service de normalisation des compétences
"""
from typing import List

class SkillsNormalizer:
    """Service pour normaliser et préparer les compétences pour BM25"""
    
    @staticmethod
    def normalize_skills(skills: List[str]) -> List[str]:
        """
        Normalise une liste de compétences
        
        Args:
            skills: Liste des compétences brutes
            
        Returns:
            List[str]: Liste des compétences normalisées
        """
        if not skills:
            return []
        
        # Supprimer les espaces, mettre en minuscule, filtrer les vides
        normalized = []
        for skill in skills:
            if skill and isinstance(skill, str):
                cleaned = skill.strip().lower()
                if cleaned:
                    normalized.append(cleaned)
        
        return normalized
    
    @staticmethod
    def normalize_skills_text(skills: List[str]) -> str:
        """
        Convertit une liste de compétences en texte concaténé pour BM25
        
        Args:
            skills: Liste des compétences brutes
            
        Returns:
            str: Texte concaténé des compétences normalisées
        """
        normalized = SkillsNormalizer.normalize_skills(skills)
        return " ".join(normalized)
    
    @staticmethod
    def prepare_candidate_skills(skills: List[str]) -> dict:
        """
        Prépare les données de compétences pour un candidat
        
        Args:
            skills: Liste des compétences brutes du candidat
            
        Returns:
            dict: Dictionnaire avec les différentes formes de compétences
        """
        normalized = SkillsNormalizer.normalize_skills(skills)
        skills_text = SkillsNormalizer.normalize_skills_text(skills)
        
        return {
            "skills_raw": skills,                    # Original pour affichage
            "skills_normalized": normalized,          # Liste normalisée
            "skills_text": skills_text,              # Texte concaténé pour BM25
            "skills_count": len(normalized)          # Nombre de compétences
        }
    
    @staticmethod
    def prepare_position_skills(required_skills: List[str]) -> dict:
        """
        Prépare les données de compétences pour un poste
        
        Args:
            required_skills: Liste des compétences requises pour le poste
            
        Returns:
            dict: Dictionnaire avec les différentes formes de compétences
        """
        normalized = SkillsNormalizer.normalize_skills(required_skills)
        skills_text = SkillsNormalizer.normalize_skills_text(required_skills)
        
        return {
            "required_skills_raw": required_skills,   # Original pour affichage
            "required_skills_normalized": normalized, # Liste normalisée
            "required_skills_text": skills_text,     # Texte concaténé pour BM25
            "required_skills_count": len(normalized) # Nombre de compétences
        }
