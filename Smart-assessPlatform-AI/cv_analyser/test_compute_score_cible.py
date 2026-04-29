#!/usr/bin/env python3
"""
Test script pour debugger l'erreur 404 sur compute-score-cible
"""

import requests
import json
import sys
from datetime import datetime

def test_compute_score_cible():
    """Test l'endpoint compute-score-cible avec différents candidats"""
    
    print("🔍 === TEST COMPUTE SCORE CIBLE ===")
    print(f"Timestamp: {datetime.now()}")
    
    base_url = "http://localhost:8000/api/v1"
    
    # D'abord, vérifier les candidats disponibles dans Elasticsearch
    print("\n--- Vérification des candidats disponibles ---")
    try:
        from app.config.elasticsearch_config import ElasticsearchConfig
        
        client = ElasticsearchConfig.get_client()
        
        # Lister tous les candidats
        result = client.search(
            index=ElasticsearchConfig.CANDIDATES_INDEX,
            body={
                "query": {"match_all": {}},
                "size": 10,
                "_source": ["candidate_id", "skills"]
            }
        )
        
        candidates = []
        for hit in result["hits"]["hits"]:
            candidates.append({
                "candidate_id": hit["_source"]["candidate_id"],
                "skills": hit["_source"].get("skills", [])
            })
        
        print(f"✅ {len(candidates)} candidats trouvés:")
        for candidate in candidates:
            print(f"   ID: {candidate['candidate_id']} | Skills: {', '.join(candidate['skills'][:3])}...")
        
        if not candidates:
            print("❌ Aucun candidat trouvé dans Elasticsearch")
            return False
            
    except Exception as e:
        print(f"❌ Erreur vérification Elasticsearch: {e}")
        return False
    
    # Maintenant tester compute-score-cible avec les candidats existants
    test_cases = [
        {
            "name": "Candidat 384 (celui qui cause l'erreur)",
            "candidate_id": 384,
            "applied_position_ids": [32]
        },
        {
            "name": "Premier candidat disponible",
            "candidate_id": candidates[0]["candidate_id"],
            "applied_position_ids": [32]
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n--- Test {i}: {test_case['name']} ---")
        
        payload = {
            "candidate_id": test_case["candidate_id"],
            "applied_position_ids": test_case["applied_position_ids"]
        }
        
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        try:
            response = requests.post(
                f"{base_url}/compute-score-cible",
                json=payload,
                timeout=30
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Succès!")
                print(f"   Best match: {data.get('best_match_title', 'N/A')}")
                print(f"   Best score: {data.get('best_match_score', 0)}")
                print(f"   Total positions: {data.get('total_positions', 0)}")
                
            elif response.status_code == 404:
                print(f"❌ Erreur 404 - Candidat ou poste non trouvé")
                print(f"   Response: {response.text}")
                
                # Vérifier si le candidat existe
                candidate_exists = any(c["candidate_id"] == test_case["candidate_id"] for c in candidates)
                print(f"   Candidat {test_case['candidate_id']} existe dans ES: {candidate_exists}")
                
            else:
                print(f"❌ Erreur HTTP {response.status_code}")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")
    
    return True

def test_positions_available():
    """Vérifier les postes disponibles"""
    
    print("\n📍 === VÉRIFICATION DES POSTES ===")
    
    try:
        from app.config.elasticsearch_config import ElasticsearchConfig
        
        client = ElasticsearchConfig.get_client()
        
        # Vérifier si l'index positions existe
        if not client.indices.exists(index=ElasticsearchConfig.POSITIONS_INDEX):
            print(f"❌ Index '{ElasticsearchConfig.POSITIONS_INDEX}' n'existe pas")
            return False
        
        # Lister tous les postes
        result = client.search(
            index=ElasticsearchConfig.POSITIONS_INDEX,
            body={
                "query": {"match_all": {}},
                "size": 10,
                "_source": ["position_id", "title"]
            }
        )
        
        positions = []
        for hit in result["hits"]["hits"]:
            positions.append({
                "position_id": hit["_source"]["position_id"],
                "title": hit["_source"].get("title", "No title")
            })
        
        print(f"✅ {len(positions)} postes trouvés:")
        for position in positions:
            print(f"   ID: {position['position_id']} | Title: {position['title']}")
        
        # Vérifier si le poste 32 existe
        position_32_exists = any(p["position_id"] == 32 for p in positions)
        print(f"   Poste 32 existe: {position_32_exists}")
        
        return position_32_exists
        
    except Exception as e:
        print(f"❌ Erreur vérification postes: {e}")
        return False

def main():
    """Fonction principale de test"""
    
    print("🚀 === DÉBOGAGE COMPUTE SCORE CIBLE ===")
    
    # Vérifier les postes disponibles
    positions_ok = test_positions_available()
    
    # Tester compute-score-cible
    test_compute_score_cible()
    
    print("\n🏁 === FIN DES TESTS ===")

if __name__ == "__main__":
    main()
