# cv_analyser/app/config/elasticsearch_config.py
import os
from dotenv import load_dotenv
from elasticsearch import Elasticsearch

# Charger les variables d'environnement au démarrage du module
load_dotenv()

class ElasticsearchConfig:
    # Elasticsearch Cloud Serverless Configuration
    ELASTICSEARCH_ENDPOINT = os.getenv("ELASTICSEARCH_ENDPOINT", "your-endpoint.es.eastus1.azure.elastic-cloud.com")
    ELASTICSEARCH_API_KEY = os.getenv("ELASTICSEARCH_API_KEY", "your-generated-api-key")
    
    # Index names
    CANDIDATES_INDEX = os.getenv("CANDIDATES_INDEX", "candidates")
    POSITIONS_INDEX = os.getenv("POSITIONS_INDEX", "positions")
    EMBEDDINGS_INDEX = os.getenv("EMBEDDINGS_INDEX", "candidate_embeddings")
    
    # Embedding model configuration
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "384"))
    
    @classmethod
    def get_client(cls):
        return Elasticsearch(
            hosts=[cls.ELASTICSEARCH_ENDPOINT],
            api_key=cls.ELASTICSEARCH_API_KEY
        )
    
    @classmethod
    def get_connection_info(cls):
        return {
            "endpoint": cls.ELASTICSEARCH_ENDPOINT,
            "api_key": "***" if cls.ELASTICSEARCH_API_KEY else None,
            "candidates_index": cls.CANDIDATES_INDEX,
            "positions_index": cls.POSITIONS_INDEX,
            "embeddings_index": cls.EMBEDDINGS_INDEX,
            "embedding_model": cls.EMBEDDING_MODEL,
            "embedding_dimension": cls.EMBEDDING_DIMENSION
        }