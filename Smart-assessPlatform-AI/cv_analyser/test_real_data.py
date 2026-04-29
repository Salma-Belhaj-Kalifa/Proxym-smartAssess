#!/usr/bin/env python3
"""
Script pour tester avec les données réelles provenant de l'analyse CV
"""

import json
import requests

def test_with_real_cv_data():
    """Test avec les données réelles d'une analyse CV"""
    print("=== TEST AVEC DONNÉES RÉELLES CV ===")
    
    # Simuler les données réelles d'une analyse CV (basé sur les logs Spring Boot)
    real_cv_analysis = {
        "Basic Information": {
            "name": "mouna M",
            "email": "mouna@example.com",
            "phone": "+21612345678",
            "location": "Tunis, Tunisia",
            "years_of_experience": 3
        },
        "Summary": "Développeur full-stack avec 3 ans d'expérience en Java et React. Passionné par les nouvelles technologies et l'optimisation des performances. Compétent en développement d'applications web robustes et évolutives.",
        "Technical Information": {
            "Skills": ["Java", "Spring Boot", "React", "JavaScript", "SQL", "HTML", "CSS", "Git"],
            "Technologies": ["Spring Boot", "React", "Node.js", "MySQL", "MongoDB"],
            "Frameworks": ["Spring", "Hibernate", "React", "Express.js"],
            "Tools": ["Git", "Docker", "Jenkins", "Maven"]
        },
        "Education": [
            {
                "degree": "Ingénieur en Informatique",
                "school": "École Supérieure d'Informatique",
                "year": "2020"
            }
        ],
        "Experience": [
            {
                "position": "Développeur Full-stack",
                "company": "Tech Company",
                "duration": "2 ans"
            }
        ],
        "Projects": [
            {
                "name": "E-commerce Platform",
                "technologies": ["Spring Boot", "React", "MySQL"]
            }
        ]
    }
    
    # Extraire les données comme le fait Spring Boot
    summary = real_cv_analysis.get("Summary", "")
    skills = []
    if "Technical Information" in real_cv_analysis and "Skills" in real_cv_analysis["Technical Information"]:
        skills = real_cv_analysis["Technical Information"]["Skills"]
    years_of_experience = 0
    if "Basic Information" in real_cv_analysis and "years_of_experience" in real_cv_analysis["Basic Information"]:
        years_of_experience = real_cv_analysis["Basic Information"]["years_of_experience"]
    
    # Créer le payload comme le fait Spring Boot
    payload = {
        "candidate_id": 279,
        "skills": skills,
        "summary": summary,
        "years_of_experience": years_of_experience
    }
    
    print(f"Summary extrait: '{summary}'")
    print(f"Skills extraits: {skills}")
    print(f"Years of experience: {years_of_experience}")
    print(f"Summary length: {len(summary)}")
    print(f"Skills count: {len(skills)}")
    print(f"Payload complet: {json.dumps(payload, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post("http://localhost:8000/api/v1/process-candidate", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("SUCCESS: Indexation avec données réelles réussie!")
        else:
            print(f"ERROR: Échec - Status {response.status_code}")
            
    except Exception as e:
        print(f"ERROR: Exception lors de l'appel: {e}")

def test_with_empty_data():
    """Test avec des données vides ou problématiques"""
    print("\n=== TEST AVEC DONNÉES VIDES/PROBLÉMATIQUES ===")
    
    # Cas 1: Summary vide
    payload1 = {
        "candidate_id": 280,
        "skills": [],
        "summary": "",
        "years_of_experience": 0
    }
    
    print("Test 1 - Summary vide, skills vide:")
    print(f"Payload: {json.dumps(payload1)}")
    
    try:
        response = requests.post("http://localhost:8000/api/v1/process-candidate", json=payload1)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")
    
    # Cas 2: Données null
    payload2 = {
        "candidate_id": 281,
        "skills": None,
        "summary": None,
        "years_of_experience": None
    }
    
    print("\nTest 2 - Données null:")
    print(f"Payload: {json.dumps(payload2)}")
    
    try:
        response = requests.post("http://localhost:8000/api/v1/process-candidate", json=payload2)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_with_real_cv_data()
    test_with_empty_data()
