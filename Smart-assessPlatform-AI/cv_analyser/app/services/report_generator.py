# app/services/report_generator.py
import os
import json
import uuid
import time
import logging
import aiohttp
import asyncio
from datetime import datetime
from typing import List, Dict
from pydantic import BaseModel

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

REPORT_PROMPT_TEMPLATE = """
You are an expert HR AI assistant. Generate a professional candidate report based on CV and test results.

Candidate Profile:
{candidate_profile}

Test Results:
{test_results}

Requirements:
- Provide a JSON only
- Include these sections:
  1) basic_information (full_name, email)
  2) summary (career_level, years_of_experience, key_skills, strengths, specializations)
  3) applied_position
  4) test_date, test_duration
  5) score_global
  6) detailed_test_results (skill_name, score, max_score, comment)
  7) recommendations (suggested_positions, improvement_areas, match_score_cv_test)

Return a strict JSON.
"""

# -----------------------------
# Pydantic Models
# -----------------------------
class TestResult(BaseModel):
    skill_name: str
    score: float
    max_score: float
    comment: str = ""

class Recommendation(BaseModel):
    suggested_positions: List[str]
    improvement_areas: List[str]
    match_score_cv_test: float

class CandidateReport(BaseModel):
    candidate_name: str
    email: str
    applied_position: str
    test_date: str
    test_duration: str
    score_global: float
    test_results: List[TestResult]
    profile_summary: Dict[str, str]
    recommendations: Recommendation

# -----------------------------
# Async LLM call
# -----------------------------
async def call_groq_api_async(prompt: str, retries=3):
    api_key = os.getenv("GROQ_API_KEY")
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    data = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "max_tokens": 4000
    }

    for attempt in range(retries):
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=data
            ) as resp:
                text = await resp.text()
                if resp.status == 200:
                    result = await resp.json()
                    return result["choices"][0]["message"]["content"]
                elif resp.status == 429:
                    logger.warning("Rate limit hit. Waiting before retry...")
                    await asyncio.sleep(5 * (attempt + 1))
                else:
                    logger.error(f"API error {resp.status}: {text}")
    raise Exception("Max retries exceeded for report generation")

# -----------------------------
# Helper to parse JSON
# -----------------------------
def extract_json_from_response(response_text: str) -> dict:
    response_text = response_text.replace("```json", "").replace("```", "")
    try:
        return json.loads(response_text)
    except:
        logger.warning("Failed to parse JSON, returning empty dict")
        return {}

# -----------------------------
# Report Generator
# -----------------------------
class ReportGenerator:
    def __init__(self):
        self.api_key = None

    def _ensure_api_key(self):
        if self.api_key is None:
            self.api_key = os.getenv("GROQ_API_KEY")
            if not self.api_key:
                raise ValueError("GROQ_API_KEY not set")

    async def generate_report(self, candidate_profile: dict, test_results: List[Dict], applied_position: str, test_start: datetime, test_end: datetime):
        self._ensure_api_key()

        # Format duration
        duration_seconds = (test_end - test_start).total_seconds()
        minutes, seconds = divmod(int(duration_seconds), 60)
        test_duration_str = f"{minutes} min {seconds}s"

        # Global score
        total_score = sum(r["score"] for r in test_results)
        max_total = sum(r["max_score"] for r in test_results)
        score_global = round((total_score / max_total) * 100, 2) if max_total > 0 else 0

        # Build prompt
        prompt = REPORT_PROMPT_TEMPLATE.format(
            candidate_profile=json.dumps(candidate_profile, ensure_ascii=False),
            test_results=json.dumps(test_results, ensure_ascii=False)
        )
        unique_id = str(uuid.uuid4())[:8]
        timestamp = int(time.time())
        prompt = f"REQUEST_ID:{unique_id}_TIME:{timestamp}\n{prompt}"

        # Call LLM
        llm_response = await call_groq_api_async(prompt)
        parsed_data = extract_json_from_response(llm_response)

        # Fallback simple report if LLM fails
        if not parsed_data:
            suggested_positions = [applied_position if score_global >= 85 else f"Junior {applied_position}"]
            improvement_areas = [r["skill_name"] for r in test_results if r["score"]/r["max_score"] < 0.7]
            match_score = round(score_global * 0.9, 2)
            summary = candidate_profile.get("summary", {})
            parsed_data = {
                "candidate_name": candidate_profile.get("basic_information", {}).get("full_name", "Unknown"),
                "email": candidate_profile.get("basic_information", {}).get("email", "Unknown"),
                "applied_position": applied_position,
                "test_date": test_start.strftime("%d/%m/%Y"),
                "test_duration": test_duration_str,
                "score_global": score_global,
                "test_results": test_results,
                "profile_summary": {
                    "career_level": summary.get("career_level", ""),
                    "years_of_experience": summary.get("years_of_experience", ""),
                    "key_skills": ", ".join(summary.get("key_skills", [])),
                    "strengths": ", ".join(summary.get("strengths", [])),
                    "specializations": ", ".join(summary.get("specializations", []))
                },
                "recommendations": {
                    "suggested_positions": suggested_positions,
                    "improvement_areas": improvement_areas,
                    "match_score_cv_test": match_score
                }
            }

        # Convert to Pydantic model
        report = CandidateReport(
            candidate_name=parsed_data["candidate_name"],
            email=parsed_data["email"],
            applied_position=parsed_data.get("applied_position", applied_position),
            test_date=parsed_data.get("test_date", test_start.strftime("%d/%m/%Y")),
            test_duration=parsed_data.get("test_duration", test_duration_str),
            score_global=parsed_data.get("score_global", score_global),
            test_results=[TestResult(**r) for r in parsed_data.get("test_results", [])],
            profile_summary=parsed_data.get("profile_summary", {}),
            recommendations=Recommendation(**parsed_data.get("recommendations", {}))
        )
        return report


    def generate_json(self, report: CandidateReport) -> str:
        return report.model_dump_json(indent=4, exclude_none=True, ensure_ascii=False)