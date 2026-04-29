#!/usr/bin/env python3
"""
Test script pour debugger l'erreur 500 de la recherche sémantique
"""

import requests
import json
import sys
import traceback
from datetime import datetime

def test_semantic_search():
    """Test l'endpoint de recherche sémantique avec différents cas"""
    
    print("🔍 === TEST RECHERCHE SÉMANTIQUE ===")
    print(f"Timestamp: {datetime.now()}")
    
    base_url = "http://localhost:8000/api/v1"
    
    # Cas de test 1: Recherche simple
    test_cases = [
        {
            "name": "Recherche simple Python",
            "payload": {
                "query": "développeur Python senior",
                "search_mode": "hybrid",
                "max_results": 5,
                "min_score": 0.3,
                "filters": {}
            }
        },
        {
            "name": "Recherche sémantique pure",
            "payload": {
                "query": "data scientist expérimenté en machine learning",
                "search_mode": "semantic",
                "max_results": 3,
                "min_score": 0.2,
                "filters": {}
            }
        },
        {
            "name": "Recherche mots-clés",
            "payload": {
                "query": "React Node.js JavaScript",
                "search_mode": "keyword",
                "max_results": 3,
                "min_score": 0.1,
                "filters": {}
            }
        },
        {
            "name": "Recherche vide (devrait échouer)",
            "payload": {
                "query": "",
                "search_mode": "hybrid",
                "max_results": 5,
                "min_score": 0.3,
                "filters": {}
            }
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n--- Test {i}: {test_case['name']} ---")
        
        try:
            response = requests.post(
                f"{base_url}/search-candidates",
                json=test_case["payload"],
                timeout=30
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Succès!")
                print(f"   Query: '{data.get('query', 'N/A')}'")
                print(f"   Total found: {data.get('total_found', 0)}")
                print(f"   Returned results: {data.get('returned_results', 0)}")
                print(f"   Processing time: {data.get('processing_time_ms', 0)}ms")
                print(f"   Search mode: {data.get('search_metadata', {}).get('search_mode', 'N/A')}")
                
                # Afficher premier résultat si disponible
                results = data.get('search_results', [])
                if results:
                    first = results[0]
                    print(f"   Premier résultat: {first.get('name')} (score: {first.get('hybrid_score', 0):.3f})")
                
            elif response.status_code == 500:
                print(f"❌ Erreur 500 - Erreur serveur")
                print(f"   Response: {response.text}")
                
                # Essayer de parser l'erreur JSON
                try:
                    error_data = response.json()
                    print(f"   Error detail: {error_data.get('detail', 'No detail')}")
                except:
                    print("   Could not parse error as JSON")
                
            else:
                print(f"❌ Erreur HTTP {response.status_code}")
                print(f"   Response: {response.text}")
                
        except requests.exceptions.Timeout:
            print(f"❌ Timeout après 30 secondes")
        except requests.exceptions.ConnectionError:
            print(f"❌ Erreur de connexion - le serveur FastAPI est-il démarré?")
        except Exception as e:
            print(f"❌ Exception inattendue: {e}")
            print(f"   Traceback: {traceback.format_exc()}")

def test_embedding_service():
    """Test le service d'embeddings directement"""
    
    print("\n🧠 === TEST EMBEDDING SERVICE ===")
    
    try:
        # Importer le service
        from app.services.embedding_service import embedding_service
        
        test_text = "développeur Python senior avec expérience en fintech"
        print(f"Test embedding pour: '{test_text}'")
        
        # Générer l'embedding
        embedding = embedding_service.generate_profile_embedding(test_text)
        print(f"✅ Embedding généré: {len(embedding)} dimensions")
        print(f"   Premier élément: {embedding[0]:.6f}")
        print(f"   Dernier élément: {embedding[-1]:.6f}")
        
        return True
        
    except ImportError as e:
        print(f"❌ Erreur d'import embedding_service: {e}")
        return False
    except Exception as e:
        print(f"❌ Erreur génération embedding: {e}")
        print(f"   Traceback: {traceback.format_exc()}")
        return False

def test_elasticsearch_connection():
    """Test la connexion Elasticsearch"""
    
    print("\n🔍 === TEST ELASTICSEARCH CONNECTION ===")
    
    try:
        from app.config.elasticsearch_config import ElasticsearchConfig
        
        client = ElasticsearchConfig.get_client()
        
        # Test de connexion
        info = client.info()
        print(f"✅ Elasticsearch connecté")
        print(f"   Version: {info['version']['number']}")
        print(f"   Cluster: {info['cluster_name']}")
        
        # Vérifier l'index candidates
        if client.indices.exists(index=ElasticsearchConfig.CANDIDATES_INDEX):
            print(f"✅ Index '{ElasticsearchConfig.CANDIDATES_INDEX}' existe")
            
            # Compter les documents
            count = client.count(index=ElasticsearchConfig.CANDIDATES_INDEX)
            print(f"   Documents dans l'index: {count['count']}")
            
            # Vérifier le mapping
            mapping = client.indices.get_mapping(index=ElasticsearchConfig.CANDIDATES_INDEX)
            props = mapping[ElasticsearchConfig.CANDIDATES_INDEX]['mappings']['properties']
            
            if 'profile_embedding' in props:
                print(f"✅ Champ 'profile_embedding' trouvé: {props['profile_embedding']}")
            else:
                print(f"❌ Champ 'profile_embedding' manquant dans le mapping")
                
        else:
            print(f"❌ Index '{ElasticsearchConfig.CANDIDATES_INDEX}' n'existe pas")
            
        return True
        
    except Exception as e:
        print(f"❌ Erreur connexion Elasticsearch: {e}")
        print(f"   Traceback: {traceback.format_exc()}")
        return False

def test_fastapi_health():
    """Test si FastAPI est en cours d'exécution"""
    
    print("\n🏥 === TEST FASTAPI HEALTH ===")
    
    try:
        response = requests.get("http://localhost:8000/api/v1/health", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ FastAPI est en bonne santé")
            print(f"   Status: {data.get('status', 'N/A')}")
            print(f"   Service: {data.get('service', 'N/A')}")
            return True
        else:
            print(f"❌ FastAPI health check failed: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ FastAPI n'est pas accessible sur http://localhost:8000")
        print(f"   Vérifiez que le serveur FastAPI est démarré")
        return False
    except Exception as e:
        print(f"❌ Erreur test health FastAPI: {e}")
        return False

def main():
    """Fonction principale de test"""
    
    print("🚀 === DÉBOGAGE RECHERCHE SÉMANTIQUE ===")
    
    # Tests de base
    fastapi_ok = test_fastapi_health()
    if not fastapi_ok:
        print("\n❌ Arrêt des tests - FastAPI n'est pas accessible")
        sys.exit(1)
    
    es_ok = test_elasticsearch_connection()
    if not es_ok:
        print("\n❌ Arrêt des tests - Elasticsearch n'est pas accessible")
        sys.exit(1)
    
    embedding_ok = test_embedding_service()
    if not embedding_ok:
        print("\n❌ Arrêt des tests - Embedding service a des problèmes")
        sys.exit(1)
    
    # Tests de recherche sémantique
    test_semantic_search()
    
    print("\n🏁 === FIN DES TESTS ===")

if __name__ == "__main__":
    main()
