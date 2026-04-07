# app/services/eligibility_service.py

import os
import json
import httpx

async def check_domain_eligibility(candidate_domain: str, accepted_domains: list[str]) -> dict:
    
    if not candidate_domain or candidate_domain == 'Unknown':
        return {
            "eligible": False,
            "matched_domain": None,
            "reason": "Domaine du candidat non détecté"
        }

    if not accepted_domains:
        return {
            "eligible": True,
            "matched_domain": None,
            "reason": "Aucun domaine accepté défini pour ce poste"
        }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}"
            },
            json={
                "model": "llama-3.1-8b-instant",
                "max_tokens": 200,
                "temperature": 0,
                "messages": [{
                    "role": "user",
                    "content": f"""Tu es un expert RH. Détermine si le domaine du candidat est compatible avec au moins un des domaines acceptés.

Domaine du candidat: "{candidate_domain}"
Domaines acceptés: {json.dumps(accepted_domains)}

Réponds UNIQUEMENT en JSON valide, sans markdown:
{{
  "eligible": true ou false,
  "matchedDomain": "le domaine accepté le plus proche ou null",
  "reason": "explication courte en français"
}}"""
                }]
            },
            timeout=10.0
        )

    if response.status_code != 200:
        raise Exception("Erreur Groq API")

    text = response.json()["choices"][0]["message"]["content"].strip()

    try:
        result = json.loads(text)
        return {
            "eligible": result["eligible"],
            "matched_domain": result.get("matchedDomain"),
            "reason": result["reason"]
        }
    except Exception:
        return {
            "eligible": False,
            "matched_domain": None,
            "reason": "Erreur lors de l'analyse du domaine"
        }