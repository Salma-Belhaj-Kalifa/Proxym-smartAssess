"""
Service d'embeddings pour les candidats et positions
"""

from sentence_transformers import SentenceTransformer
from typing import List, Dict
import numpy as np
from app.config.elasticsearch_config import ElasticsearchConfig


class EmbeddingService:

    def __init__(self):
        self.model = SentenceTransformer(ElasticsearchConfig.EMBEDDING_MODEL)
        self.dimension = ElasticsearchConfig.EMBEDDING_DIMENSION

        # Vérification au démarrage
        test_vec = self.model.encode("test", normalize_embeddings=True)
        assert len(test_vec) == self.dimension, (
            f"Dimension mismatch: config={self.dimension}, modèle={len(test_vec)}"
        )

    # ------------------------------------------------------------------ #
    #  Méthode interne commune                                             #
    # ------------------------------------------------------------------ #

    def _encode(self, text: str, normalize: bool = True) -> List[float]:
        """Encode un texte en vecteur normalisé."""
        if not text or not text.strip():
            return [0.0] * self.dimension

        # Troncature propre (pas au milieu d'un mot)
        text = text.strip()
        if len(text) > 512:
            text = text[:512].rsplit(" ", 1)[0]

        vec = self.model.encode(text, normalize_embeddings=normalize)
        return vec.tolist()

    # ------------------------------------------------------------------ #
    #  Embeddings candidat                                                 #
    # ------------------------------------------------------------------ #

    def generate_skills_embedding(self, skills: List[str]) -> List[float]:
        """
        Vecteur des skills candidat (concaténés).
        Utilisé pour comparer candidat ↔ job requirements.
        """
        if not skills:
            return [0.0] * self.dimension
        skills_text = " ".join(skills)
        return self._encode(skills_text)

    def generate_profile_embedding(self, summary_text: str) -> List[float]:
        """
        Vecteur du profil global (summary CV).
        Utilisé pour la similarité profil ↔ description poste.
        """
        return self._encode(summary_text)

    # ------------------------------------------------------------------ #
    #  Embeddings poste                                                    #
    # ------------------------------------------------------------------ #

    def generate_position_embedding(
        self, description: str, requirements: str = ""
    ) -> List[float]:
        combined = f"{description} {requirements}".strip()
        return self._encode(combined)

    def generate_required_skills_embedding(
        self, required_skills: List[str]
    ) -> List[float]:
        if not required_skills:
            return [0.0] * self.dimension
        return self._encode(" ".join(required_skills))

    # ------------------------------------------------------------------ #
    #  ✅ NOUVEAU — Embedding de query de recherche                        #
    # ------------------------------------------------------------------ #

    def generate_query_embedding(self, query: str) -> List[float]:
        """
        Encode une requête de recherche libre.

        Pourquoi une méthode séparée ?
        - generate_profile_embedding → encode un long résumé CV (contexte riche)
        - generate_query_embedding  → encode un texte court de recherche

        Le modèle SentenceTransformer est symétrique : il faut encoder
        la query de la même façon que les champs qu'on va comparer.

        Règle : 
          - Si tu cherches dans skills_embedding  → encode comme un skill
          - Si tu cherches dans profile_embedding → encode comme un profil

        Ici on encode comme un skill (texte court) car on veut trouver
        des candidats par compétences.
        """
        if not query or not query.strip():
            return [0.0] * self.dimension
        return self._encode(query.strip().lower())

    # ------------------------------------------------------------------ #
    #  Similarité cosine                                                   #
    # ------------------------------------------------------------------ #

    def cosine_similarity(
        self, embedding1: List[float], embedding2: List[float]
    ) -> float:
        if not embedding1 or not embedding2:
            return 0.0

        v1 = np.array(embedding1)
        v2 = np.array(embedding2)
        n1, n2 = np.linalg.norm(v1), np.linalg.norm(v2)

        if n1 == 0 or n2 == 0:
            return 0.0

        return float(np.dot(v1, v2) / (n1 * n2))

    def calculate_debug_similarity(
        self, query_embedding: List[float], doc_embedding: List[float]
    ) -> Dict[str, float]:
        return {
            "vector_similarity": self.cosine_similarity(query_embedding, doc_embedding),
            "embedding_dimension": len(query_embedding) if query_embedding else 0
        }
    
    def generate_required_skills_embedding(self, required_skills: List[str]) -> List[float]:
        """Génère un embedding pour les compétences requises d'un poste"""
        if not required_skills:
            return [0.0] * self.dimension
        
        # Normaliser et combiner les compétences requises
        skills_text = " ".join(required_skills).lower()
        embedding = self.model.encode(skills_text)
        return embedding.tolist()
    
    def cosine_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calcule la similarité cosinus entre deux embeddings"""
        if not embedding1 or not embedding2:
            return 0.0
        
        # Convertir en numpy arrays
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        
        # Calculer la similarité cosinus
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(dot_product / (norm1 * norm2))
    
    def calculate_debug_similarity(self, query_embedding: List[float], doc_embedding: List[float]) -> Dict[str, float]:
        """
        Calcule la similarité vectorielle pour debug/utilitaire
        """
        vector_sim = self.cosine_similarity(query_embedding, doc_embedding)
        
        return {
            "vector_similarity": vector_sim,
            "embedding_dimension": len(query_embedding) if query_embedding else 0
        }

# Instance globale du service
embedding_service = EmbeddingService()
