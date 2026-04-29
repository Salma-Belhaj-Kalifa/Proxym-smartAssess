#!/usr/bin/env python3
"""
Test des endpoints Elasticsearch
"""

import os
from dotenv import load_dotenv
import requests
import json

# Recharger les variables d'environnement
load_dotenv()

BASE_URL = "http://localhost:8000/api/v1"

def test_process_candidate():
    """Test l'endpoint /process-candidate"""
    print("Test de /process-candidate...")
    
    payload = {
        "candidate_id": 10,
        "skills": [
            "Flutter",
            "Dart",
            "Android",
            "Kotlin",
            "iOS",
            "Swift",
            "Firebase",
            "Git"
        ],
        "summary": "Mobile developer passionate about building high-performance and user-friendly applications. Experienced in cross-platform and native mobile development using modern frameworks and tools.",
        "years_of_experience": 1
    }
    
    try:
        response = requests.post(f"{BASE_URL}/process-candidate", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Erreur: {str(e)}")
        return False

def test_process_position():
    """Test l'endpoint /process-position"""
    print("\nTest de /process-position...")
    
    payload = {
        "position_id": 10,
        "title": "Mobile Developer",
        "description": "Nous recherchons un développeur mobile passionné pour concevoir et développer des applications mobiles performantes et intuitives sur Android et iOS. Vous collaborerez avec les équipes produit et design pour offrir une excellente expérience utilisateur.",
        "requirements": "Expérience en développement mobile (Flutter ou React Native ou natif Android/iOS), bonne maîtrise des API REST, connaissance de Firebase est un plus.",
        "company": "Proxym IT",
        "required_skills": [
            "Flutter",
            "Dart",
            "React Native",
            "JavaScript",
            "Kotlin",
            "Swift",
            "REST APIs",
            "Firebase",
            "Git"
        ]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/process-position", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Erreur: {str(e)}")
        return False

def test_compute_score():
    """Test l'endpoint /compute-score (legacy)"""
    print("\nTest de /compute-score (legacy)...")
    
    payload = {
        "candidate_id": 10,
        "position_id": 10,
        "technical_score": 0.7
    }
    
    try:
        response = requests.post(f"{BASE_URL}/compute-score", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Erreur: {str(e)}")
        return False

def test_compute_score_cible():
    """Test l'endpoint /compute-score-cible (nouveau)"""
    print("\nTest de /compute-score-cible...")
    
    payload = {
        "candidate_id": 5,
        "applied_position_ids": [5]  # Ajouter les postes postulés
    }
    
    try:
        response = requests.post(f"{BASE_URL}/compute-score-cible", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Erreur: {str(e)}")
        return False

def test_update_candidate():
    """Test l'endpoint /candidate/{candidate_id}/update avec vraies valeurs"""
    print("\nTest de /candidate/{candidate_id}/update...")

    try:
        # 1️⃣ Appeler compute-score-cible
        score_payload = {
            "candidate_id": 10,
            "applied_position_ids": [10]
        }

        score_response = requests.post(f"{BASE_URL}/compute-score-cible", json=score_payload)
        
        if score_response.status_code != 200:
            print("Erreur lors du calcul du score")
            print(score_response.json())
            return False

        score_data = score_response.json()

        # 2️⃣ Extraire les vraies valeurs (adapter selon ta structure JSON)
        technical_score = score_data.get("technical_score", 0.7)
        best_match_score = score_data.get("best_match_score", 0)

        print(f"Scores récupérés -> Technical: {technical_score}, Match: {best_match_score}")

        # 3️⃣ Update avec vraies valeurs
        payload = {
            "candidate_id": 10,
            "update_data": {
                "technical_score": technical_score,
                "best_match_score": best_match_score,
                "last_scored_at": "2026-01-01T12:00:00"
            }
        }

        response = requests.put(f"{BASE_URL}/candidate/10/update", json=payload)

        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")

        return response.status_code == 200

    except Exception as e:
        print(f"Erreur: {str(e)}")
        return False

def main():
    """Lance tous les tests"""
    print("=== TEST DES ENDPOINTS ELASTICSEARCH ===")
    print("⚠️  IMPORTANT: Assurez-vous que le serveur Python est démarré (python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000)")
    print("⚠️  Et que les index ont été créés (python setup_elasticsearch_indexes.py)")
    print()
    
    # Test 1: Process candidate
    test1 = test_process_candidate()
    
    # Test 2: Process position
    test2 = test_process_position()
    
    # Attendre un peu pour s'assurer que l'indexation est terminée
    import time
    time.sleep(2)
    
    # Test 3: Compute score (legacy)
    test3 = test_compute_score()
    
    # Test 4: Compute score cible (nouveau)
    test4 = test_compute_score_cible()
    
    # Test 5: Update candidate
    test5 = test_update_candidate()
    
    # Résultats
    print(f"\n=== RÉSULTATS ===")
    print(f"Process Candidate: {'OK' if test1 else 'ÉCHEC'}")
    print(f"Process Position: {'OK' if test2 else 'ÉCHEC'}")
    print(f"Compute Score (legacy): {'OK' if test3 else 'ÉCHEC'}")
    print(f"Compute Score Cible: {'OK' if test4 else 'ÉCHEC'}")
    print(f"Update Candidate: {'OK' if test5 else 'ÉCHEC'}")
    
    if test1 and test2 and test3 and test4 and test5:
        print("\n✅ Tous les tests ont réussi !")
    else:
        print("\n❌ Certains tests ont échoué. Vérifiez les logs et assurez-vous que:")
        print("   1. Le serveur Python est démarré sur localhost:8000")
        print("   2. Les index Elasticsearch existent (python setup_elasticsearch_indexes.py)")
        print("   3. Les données ont été correctement indexées")

if __name__ == "__main__":
    main()
