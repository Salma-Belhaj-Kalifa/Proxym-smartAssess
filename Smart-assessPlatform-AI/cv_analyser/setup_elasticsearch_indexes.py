#!/usr/bin/env python3
"""
Création des index Elasticsearch pour les candidats et positions
"""

import os
from dotenv import load_dotenv

# Recharger les variables d'environnement AVANT d'importer ElasticsearchConfig
load_dotenv()

from app.config.elasticsearch_config import ElasticsearchConfig

def create_indexes():
    """Crée les index Elasticsearch pour candidates et positions"""
    print("Création des index Elasticsearch...")
    
    try:
        client = ElasticsearchConfig.get_client()
        
        # Mapping pour l'index candidates (optimisé)
        candidates_mapping = {
            "mappings": {
                "properties": {
                    "candidate_id": {"type": "long"},
                    "skills": {"type": "keyword"},
                    "skills_text": {"type": "text", "analyzer": "standard"},
                    "years_of_experience": {"type": "integer"},
                    "skills_embedding": {
                        "type": "dense_vector",
                        "dims": ElasticsearchConfig.EMBEDDING_DIMENSION,
                        "index": True,
                        "similarity": "cosine"
                    },
                    "profile_embedding": {
                        "type": "dense_vector", 
                        "dims": ElasticsearchConfig.EMBEDDING_DIMENSION,
                        "index": True,
                        "similarity": "cosine"
                    },
                    "indexed_at": {"type": "date"},
                    "last_scored_at": {"type": "date"},
                    "composite_score": {"type": "float"}
                }
            }
        }
        
        # Mapping pour l'index positions  
        positions_mapping = {
            "mappings": {
                "properties": {
                    "position_id": {"type": "long"},
                    "title": {"type": "text", "analyzer": "standard"},
                    "description": {"type": "text", "analyzer": "standard"},
                    "requirements": {"type": "text", "analyzer": "standard"},
                    "required_skills": {"type": "keyword"},
                    "position_embedding": {
                        "type": "dense_vector",
                        "dims": ElasticsearchConfig.EMBEDDING_DIMENSION,
                        "index": True,
                        "similarity": "cosine"
                    },
                    "required_skills_embedding": {
                        "type": "dense_vector",
                        "dims": ElasticsearchConfig.EMBEDDING_DIMENSION,
                        "index": True,
                        "similarity": "cosine"
                    },
                    "created_at": {"type": "date"}
                }
            }
        }
        
        # Supprimer et recréer l'index candidates avec le bon mapping
        if client.indices.exists(index=ElasticsearchConfig.CANDIDATES_INDEX):
            client.indices.delete(index=ElasticsearchConfig.CANDIDATES_INDEX)
            print(f"Index '{ElasticsearchConfig.CANDIDATES_INDEX}' supprimé")
        
        client.indices.create(
            index=ElasticsearchConfig.CANDIDATES_INDEX,
            body=candidates_mapping
        )
        print(f"Index '{ElasticsearchConfig.CANDIDATES_INDEX}' créé avec succès (nouveau mapping)")
        
        # Supprimer et recréer l'index positions avec le bon mapping
        if client.indices.exists(index=ElasticsearchConfig.POSITIONS_INDEX):
            client.indices.delete(index=ElasticsearchConfig.POSITIONS_INDEX)
            print(f"Index '{ElasticsearchConfig.POSITIONS_INDEX}' supprimé")
        
        client.indices.create(
            index=ElasticsearchConfig.POSITIONS_INDEX,
            body=positions_mapping
        )
        print(f"Index '{ElasticsearchConfig.POSITIONS_INDEX}' créé avec succès (nouveau mapping)")
        
        # Vérification finale
        indices = client.indices.get_alias(index="*")
        print(f"\nIndex disponibles dans Elasticsearch:")
        for index_name in indices.keys():
            print(f"  - {index_name}")
        
        return True
        
    except Exception as e:
        print(f"Erreur lors de la création des index: {str(e)}")
        return False

if __name__ == "__main__":
    create_indexes()
