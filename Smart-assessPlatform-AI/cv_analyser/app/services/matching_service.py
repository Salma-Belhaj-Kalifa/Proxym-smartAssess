# app/services/matching_service.py
import os
import json
import uuid
import time
import logging
import aiohttp
import asyncio
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from pydantic import BaseModel
from collections import defaultdict

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Candidate-position matching prompt template
CANDIDATE_MATCHING_PROMPT = """
You are an expert AI recruitment assistant specializing in candidate-position matching and technical assessment.

TASK: Match candidates to a specific job position and rank them by suitability.

POSITION REQUIREMENTS:
{position_requirements}

CANDIDATES PROFILES:
{candidates_profiles}

ANALYSIS CRITERIA:
- Technical skills match (40% weight)
- Experience level relevance (25% weight) 
- Domain expertise (20% weight)
- Career progression potential (15% weight)

For each candidate, provide:
1. Overall match score (0-100%)
2. Technical compatibility assessment
3. Experience level alignment
4. Strengths for this position
5. Potential gaps/risks
6. Interview recommendation

REQUIRED JSON FORMAT:
{
    "position_analysis": {
        "title": "Position title",
        "required_skills": ["skill1", "skill2", "skill3"],
        "experience_level": "Junior/Mid/Senior/Lead",
        "domain": "Technical domain",
        "key_requirements": ["req1", "req2", "req3"]
    },
    "candidate_rankings": [
        {
            "rank": 1,
            "candidate_id": "candidate_id",
            "candidate_name": "Full name",
            "match_score": percentage,
            "technical_match": percentage,
            "experience_match": percentage,
            "domain_match": percentage,
            "potential_score": percentage,
            "strengths": ["strength1", "strength2", "strength3"],
            "gaps": ["gap1", "gap2"],
            "risks": ["risk1", "risk2"],
            "recommendation": "Strongly Recommend/Recommend/Consider/Not Recommended",
            "interview_priority": "High/Medium/Low",
            "reasoning": "Detailed explanation of the match"
        }
    ],
    "matching_insights": {
        "total_candidates": number,
        "strong_matches": number,
        "moderate_matches": number,
        "weak_matches": number,
        "key_trends": ["trend1", "trend2"],
        "recommendations": ["rec1", "rec2"]
    }
}

Return ONLY valid JSON without markdown formatting.
"""

# Pydantic models for candidate matching
class CandidateRanking(BaseModel):
    rank: int
    candidate_id: str
    candidate_name: str
    match_score: float
    technical_match: float
    experience_match: float
    domain_match: float
    potential_score: float
    strengths: List[str]
    gaps: List[str]
    risks: List[str]
    recommendation: str
    interview_priority: str
    reasoning: str

class PositionAnalysis(BaseModel):
    title: str
    required_skills: List[str]
    experience_level: str
    domain: str
    key_requirements: List[str]

class MatchingInsights(BaseModel):
    total_candidates: int
    strong_matches: int
    moderate_matches: int
    weak_matches: int
    key_trends: List[str]
    recommendations: List[str]

class MatchingResult(BaseModel):
    position_analysis: PositionAnalysis
    candidate_rankings: List[CandidateRanking]
    matching_insights: MatchingInsights

class CandidateMatchingService:
    def __init__(self):
        self.api_key = None

    def _ensure_api_key(self):
        if self.api_key is None:
            self.api_key = os.getenv("GROQ_API_KEY")
            if not self.api_key:
                raise ValueError("GROQ_API_KEY not set in environment variables")

    async def _call_groq_api_async(self, prompt: str, retries: int = 3) -> str:
        """Call Groq API for LLM matching"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
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
                    if resp.status == 200:
                        result = await resp.json()
                        return result["choices"][0]["message"]["content"]
                    elif resp.status == 429:
                        logger.warning(f"Rate limit hit. Attempt {attempt + 1}/{retries}")
                        await asyncio.sleep(5 * (attempt + 1))
                    else:
                        error_text = await resp.text()
                        logger.error(f"API error {resp.status}: {error_text}")
        
        raise Exception(f"Max retries exceeded for candidate matching")

    def _extract_json_from_response(self, response_text: str) -> dict:
        """Extract JSON from LLM response"""
        response_text = response_text.replace("```json", "").replace("```", "").strip()
        try:
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}")
            logger.error(f"Response text: {response_text}")
            return {}

    def _calculate_skill_match(self, candidate_skills: Dict, required_skills: List[str]) -> float:
        """Calculate skill match percentage"""
        if not required_skills:
            return 100.0
        
        candidate_skill_set = set(skill.lower() for skill in candidate_skills.keys())
        required_skill_set = set(skill.lower() for skill in required_skills)
        
        matches = len(candidate_skill_set.intersection(required_skill_set))
        return round((matches / len(required_skill_set)) * 100, 2)

    def _calculate_experience_match(self, candidate_experience: str, required_level: str) -> float:
        """Calculate experience level match"""
        experience_mapping = {
            "Entry": 0, "Junior": 1, "Mid": 2, "Senior": 3, "Lead": 4, "Principal": 5
        }
        
        candidate_level = "Junior"  # Default
        if isinstance(candidate_experience, str):
            for level in experience_mapping.keys():
                if level.lower() in candidate_experience.lower():
                    candidate_level = level
                    break
        
        candidate_score = experience_mapping.get(candidate_level, 1)
        required_score = experience_mapping.get(required_level, 2)
        
        if candidate_score >= required_score:
            return 100.0
        elif candidate_score == required_score - 1:
            return 70.0
        else:
            return 40.0

    def _generate_fallback_matching(
        self, 
        position_requirements: dict, 
        candidates_profiles: List[dict]
    ) -> dict:
        """Generate fallback matching if LLM fails"""
        
        required_skills = position_requirements.get("required_skills", [])
        required_level = position_requirements.get("experience_level", "Mid")
        domain = position_requirements.get("domain", "")
        
        candidate_rankings = []
        
        for i, candidate in enumerate(candidates_profiles):
            candidate_id = str(candidate.get("id", f"candidate_{i}"))
            candidate_name = candidate.get("name", f"Candidate {i+1}")
            
            # Extract candidate data
            tech_info = candidate.get("technical_information", {})
            candidate_skills = tech_info.get("technologies", {})
            summary = candidate.get("summary", {})
            candidate_experience = summary.get("career_level", "Junior")
            candidate_domain = tech_info.get("domain", "")
            
            # Calculate matches
            technical_match = self._calculate_skill_match(candidate_skills, required_skills)
            experience_match = self._calculate_experience_match(candidate_experience, required_level)
            domain_match = 100.0 if domain.lower() in candidate_domain.lower() else 60.0
            
            # Calculate overall score (weighted)
            overall_score = round(
                technical_match * 0.4 + 
                experience_match * 0.25 + 
                domain_match * 0.2 + 
                70.0 * 0.15,  # Default potential score
                2
            )
            
            # Determine recommendation
            if overall_score >= 85:
                recommendation = "Strongly Recommend"
                priority = "High"
            elif overall_score >= 70:
                recommendation = "Recommend"
                priority = "Medium"
            elif overall_score >= 50:
                recommendation = "Consider"
                priority = "Low"
            else:
                recommendation = "Not Recommended"
                priority = "Low"
            
            # Identify strengths and gaps
            strengths = []
            gaps = []
            
            for skill in required_skills:
                if skill.lower() in [s.lower() for s in candidate_skills.keys()]:
                    strengths.append(skill)
                else:
                    gaps.append(skill)
            
            candidate_rankings.append({
                "rank": i + 1,
                "candidate_id": candidate_id,
                "candidate_name": candidate_name,
                "match_score": overall_score,
                "technical_match": technical_match,
                "experience_match": experience_match,
                "domain_match": domain_match,
                "potential_score": 70.0,
                "strengths": strengths[:3],
                "gaps": gaps[:2],
                "risks": ["Limited experience"] if experience_match < 70 else [],
                "recommendation": recommendation,
                "interview_priority": priority,
                "reasoning": f"Candidate shows {overall_score}% match with {technical_match}% technical skills compatibility"
            })
        
        # Sort by match score
        candidate_rankings.sort(key=lambda x: x["match_score"], reverse=True)
        
        # Update ranks
        for i, candidate in enumerate(candidate_rankings):
            candidate["rank"] = i + 1
        
        # Calculate insights
        total = len(candidate_rankings)
        strong = len([c for c in candidate_rankings if c["match_score"] >= 85])
        moderate = len([c for c in candidate_rankings if 70 <= c["match_score"] < 85])
        weak = total - strong - moderate
        
        return {
            "position_analysis": {
                "title": position_requirements.get("title", "Position"),
                "required_skills": required_skills,
                "experience_level": required_level,
                "domain": domain,
                "key_requirements": position_requirements.get("key_requirements", [])
            },
            "candidate_rankings": candidate_rankings,
            "matching_insights": {
                "total_candidates": total,
                "strong_matches": strong,
                "moderate_matches": moderate,
                "weak_matches": weak,
                "key_trends": [f"{strong} strong matches found", f"Average match score: {round(sum(c['match_score'] for c in candidate_rankings) / total, 2) if total > 0 else 0}%"],
                "recommendations": ["Focus on top 3 candidates", "Schedule technical interviews"]
            }
        }

    async def match_candidates_to_position(
        self,
        position_requirements: dict,
        candidates_profiles: List[dict]
    ) -> MatchingResult:
        """
        Match candidates to a specific position and rank them
        
        Args:
            position_requirements: Job position requirements and criteria
            candidates_profiles: List of candidate profiles to match
            
        Returns:
            MatchingResult: Ranked candidates with detailed analysis
        """
        self._ensure_api_key()
        
        # Build the prompt
        prompt = CANDIDATE_MATCHING_PROMPT.format(
            position_requirements=json.dumps(position_requirements, ensure_ascii=False, indent=2),
            candidates_profiles=json.dumps(candidates_profiles, ensure_ascii=False, indent=2)
        )
        
        # Add unique identifiers for tracking
        unique_id = str(uuid.uuid4())[:8]
        timestamp = int(time.time())
        prompt = f"MATCHING_ID:{unique_id}_TIME:{timestamp}\n{prompt}"
        
        try:
            # Call LLM API
            llm_response = await self._call_groq_api_async(prompt)
            parsed_data = self._extract_json_from_response(llm_response)
            
            if not parsed_data:
                logger.warning("LLM response parsing failed, using fallback matching")
                parsed_data = self._generate_fallback_matching(position_requirements, candidates_profiles)
            
        except Exception as e:
            logger.error(f"Error in candidate matching: {e}")
            parsed_data = self._generate_fallback_matching(position_requirements, candidates_profiles)
        
        # Convert to Pydantic models
        return MatchingResult(
            position_analysis=PositionAnalysis(**parsed_data.get("position_analysis", {})),
            candidate_rankings=[CandidateRanking(**ranking) for ranking in parsed_data.get("candidate_rankings", [])],
            matching_insights=MatchingInsights(**parsed_data.get("matching_insights", {}))
        )

    def generate_json_matching(self, matching_result: MatchingResult) -> str:
        """Generate JSON matching report from MatchingResult model"""
        return matching_result.model_dump_json(indent=4, exclude_none=True, ensure_ascii=False)

    async def get_best_candidates_for_position(
        self,
        position_requirements: dict,
        candidates_profiles: List[dict],
        top_n: int = 5
    ) -> List[dict]:
        """
        Get top N candidates for a position
        
        Args:
            position_requirements: Job position requirements
            candidates_profiles: List of candidate profiles
            top_n: Number of top candidates to return
            
        Returns:
            List of top N candidates with their match details
        """
        matching_result = await self.match_candidates_to_position(position_requirements, candidates_profiles)
        
        # Return top N candidates
        top_candidates = matching_result.candidate_rankings[:top_n]
        
        return [
            {
                "rank": candidate.rank,
                "candidate_id": candidate.candidate_id,
                "candidate_name": candidate.candidate_name,
                "match_score": candidate.match_score,
                "recommendation": candidate.recommendation,
                "interview_priority": candidate.interview_priority,
                "key_strengths": candidate.strengths[:3],
                "main_gaps": candidate.gaps[:2],
                "reasoning": candidate.reasoning
            }
            for candidate in top_candidates
        ]
