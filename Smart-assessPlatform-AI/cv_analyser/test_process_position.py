#!/usr/bin/env python3
"""
Script pour tester l'endpoint /process-position avec des données réelles
"""

import requests
import json

def test_process_position():
    """Teste l'endpoint /process-position"""
    print("=== TEST /process-position ===")
    
    url = "http://localhost:8000/api/v1/process-position"
    
    # Données de test similaires à celles envoyées par Spring Boot
    test_data = {
        "position_id": 999,
        "title": "Développeur Backend Test",
        "description": "Nous recherchons un développeur backend expérimenté",
        "requirements": "Python, Django, PostgreSQL",
        "required_skills": ["python", "django", "postgresql", "rest api"]
    }
    
    print(f"URL: {url}")
    print(f"Données envoyées: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(url, json=test_data, timeout=30)
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("SUCCESS!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print("ERROR!")
            print(f"Response Text: {response.text}")
            
            # Essayer de parser l'erreur
            try:
                error_data = response.json()
                print(f"Error Details: {json.dumps(error_data, indent=2)}")
            except:
                print("Could not parse error as JSON")
        
        return response.status_code == 200
        
    except requests.exceptions.RequestException as e:
        print(f"Request Error: {str(e)}")
        return False
    except Exception as e:
        print(f"General Error: {str(e)}")
        return False

if __name__ == "__main__":
    test_process_position()
