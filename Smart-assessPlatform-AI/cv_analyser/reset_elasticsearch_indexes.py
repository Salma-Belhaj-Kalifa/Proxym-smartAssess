#!/usr/bin/env python3
"""
Script pour supprimer et recréer les index Elasticsearch avec les mappings corrects
"""

import os
from dotenv import load_dotenv
from app.config.elasticsearch_config import ElasticsearchConfig

# Charger les variables d'environnement
load_dotenv()

def reset_indexes():
    """Supprime et recrée les index Elasticsearch"""
    print("=== RÉINITIALISATION DES INDEX ELASTICSEARCH ===")
    
    try:
        client = ElasticsearchConfig.get_client()
        
        # Supprimer les index existants
        print("\n--- SUPPRESSION DES INDEX EXISTANTS ---")
        
        if client.indices.exists(index=ElasticsearchConfig.CANDIDATES_INDEX):
            client.indices.delete(index=ElasticsearchConfig.CANDIDATES_INDEX)
            print(f"Index '{ElasticsearchConfig.CANDIDATES_INDEX}' supprimé")
        else:
            print(f"Index '{ElasticsearchConfig.CANDIDATES_INDEX}' n'existe pas")
            
        if client.indices.exists(index=ElasticsearchConfig.POSITIONS_INDEX):
            client.indices.delete(index=ElasticsearchConfig.POSITIONS_INDEX)
            print(f"Index '{ElasticsearchConfig.POSITIONS_INDEX}' supprimé")
        else:
            print(f"Index '{ElasticsearchConfig.POSITIONS_INDEX}' n'existe pas")
        
        # Recréer les index avec les nouveaux mappings
        print("\n--- CRÉATION DES NOUVEAUX INDEX ---")
        
        # Mapping pour l'index candidates
        candidates_mapping = {
            "mappings": {
                "properties": {
                    "candidate_id": {"type": "long"},
                    "skills_normalized": {"type": "text", "analyzer": "standard"},
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
        
        # Mapping pour l'index positions (optimisé sans requirements)
        positions_mapping = {
            "mappings": {
                "properties": {
                    "position_id": {"type": "long"},
                    "title": {"type": "text", "analyzer": "standard"},
                    "description": {"type": "text", "analyzer": "standard"},
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
        
        # Créer l'index candidates
        client.indices.create(
            index=ElasticsearchConfig.CANDIDATES_INDEX,
            body=candidates_mapping
        )
        print(f"Index '{ElasticsearchConfig.CANDIDATES_INDEX}' créé avec succès")
        
        # Créer l'index positions
        client.indices.create(
            index=ElasticsearchConfig.POSITIONS_INDEX,
            body=positions_mapping
        )
        print(f"Index '{ElasticsearchConfig.POSITIONS_INDEX}' créé avec succès")
        
        # Vérification finale
        indices = client.indices.get_alias(index="*")
        print(f"\nIndex disponibles dans Elasticsearch:")
        for index_name in indices.keys():
            print(f"  - {index_name}")
        
        print("\n=== RÉINITIALISATION TERMINÉE AVEC SUCCÈS ===")
        return True
        
    except Exception as e:
        print(f"Erreur lors de la réinitialisation: {str(e)}")
        return False

if __name__ == "__main__":
    reset_indexes()
