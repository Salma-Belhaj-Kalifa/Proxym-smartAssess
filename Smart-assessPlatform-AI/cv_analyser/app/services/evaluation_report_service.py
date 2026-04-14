# app/services/evaluation_report_service.py
import os
import json
import uuid
import time
import logging
import aiohttp
import asyncio
from datetime import datetime
from typing import List, Dict, Optional, Tuple, Any, Union
from pydantic import BaseModel, Field, model_validator

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Enhanced evaluation report prompt template
EVALUATION_REPORT_PROMPT = """Generate evaluation report as JSON only.

Profile: {candidate_profile}
Test Results: {test_results}
Score: {actual_global_score}% ({actual_correct_answers}/{actual_total_questions})
Applied Positions: {applied_positions}
Candidate Info: {candidate_info}
SCORING RULE (MANDATORY):
You must compute a final composite score using:

Composite score = 
40% Technical Test Score +
30% Position Fit Score +
30% CV Profile Score

Where:
- Technical Test Score = {actual_global_score}
- Position Fit Score = based on STRICT skill matching with required skills
- CV Profile Score = based on experience level, number of relevant skills, and domain consistency

CRITICAL:
- The composite_score MUST equal this computed composite score
- Do NOT invent another scoring logic

IMPORTANT DECISION RULE:
Base the hiring recommendation ONLY on the FINAL COMPOSITE SCORE:

- If composite Score < 40% → "Do Not Hire"
- If composite Score between 40-60% → "Consider"
- If composite Score > 60% → "Hire"

CRITICAL:
- The recommendation MUST strictly follow this rule
- Do NOT base decision only on technical score

CRITICAL: Analyze ALL positions in applied_positions array. The candidate applied to multiple positions:
- Consider each position's required skills and match with candidate's profile
- Calculate match scores for ALL positions
- Recommend positions where candidate has best fit
- Don't focus only on one position

CRITICAL: Use the candidate_info for accurate personal information:
- Use candidate_info.first_name and candidate_info.last_name for the name
- Use candidate_info.email for the email
- Use candidate_info.position_applied and candidate_info.company for position details

Return JSON:
{{
  "candidate_summary": {{
    "name": "<Use candidate_info.first_name + ' ' + candidate_info.last_name>", 
    "first_name": "<Use candidate_info.first_name>", 
    "last_name": "<Use candidate_info.last_name>",
    "email": "<Use candidate_info.email>", 
    "experience_level": "<Junior|Mid|Senior>", 
    "years_of_experience": "<string>", "primary_domain": "<domain>", 
    "key_technologies": ["<tech>"], "applied_positions": {applied_positions},
    "position_applied": "<Use candidate_info.position_applied>"
  }},
  "technical_assessment": {{
    "overall_score": {actual_global_score},
    "skill_breakdown": [{{"skill": "<skill>", "score": <percent>, "mastery_level": "<Beginner|Intermediate|Advanced>", "assessment": "<assessment>"}}],
    "strengths": ["<skill>"], "improvement_areas": ["<skill>"]
  }},
  "position_analysis": {{
    "applied_positions": {applied_positions},
    "applied_position_match": <0-100>,
    "position_fit": "<Poor|Partial|Good>", "position_requirements": {{}},
    "position_title": "<Use candidate_info.position_applied>",
    "company": "<Use candidate_info.company>",
    "recommended_positions": [
      {{"position": "<position_from_applied_positions>", "match_score": <score>, "reasoning": "<reason>"}},
      {{"position": "<other_position_from_applied_positions>", "match_score": <score>, "reasoning": "<reason>"}}
    ],
    "alternative_positions": []
  }},
  "hiring_recommendation": {{
    "recommendation": "<Do Not Hire|Consider|Hire>", "composite_score": <0-100>,
    "composite_score_breakdown": {{
      "technical_test_score": <0-100>,
      "position_fit_score": <0-100>,
      "cv_profile_score": <0-100>,
      "technical_weight": 0.4,
      "position_weight": 0.3,
      "cv_weight": 0.3,
      "calculation_formula": "40% Test Technique + 30% Fit Poste + 30% Profil CV",
      "final_composite_score": <0-100>
    }},
    "reason": "<Main reason for recommendation based on composite score>",
    "recommendation_reasoning": "<Detailed reasoning considering all applied positions and composite score>",
    "key_factors": ["<factor>"], "potential_risks": ["<risk>"],
    "strengths": ["<strength>"], "weaknesses": ["<weakness>"],
    "next_steps": ["<step>"]
  }},
  "team_fit_analysis": {{
    "collaboration_score": <0-10>, "leadership_potential": "<Low|Medium|High>",
    "adaptability_score": <0-10>, "communication_skills": <0-10>,
    "problem_solving_approach": "<approach>", "teamwork_preference": "<preference>",
    "work_style": "<style>", "motivation_level": "<level>"
  }}
}}
"""

# Pydantic models for evaluation report
class SkillBreakdown(BaseModel):
    skill: str
    score: float
    mastery_level: str
    assessment: str

class CandidateSummary(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    experience_level: Optional[str] = "Unknown"
    years_of_experience: Optional[str] = "0"
    primary_domain: Optional[str] = "Unknown"
    key_technologies: Optional[List[str]] = Field(default_factory=list)
    applied_positions: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    position_applied: Optional[str] = None  # Keep for backward compatibility
    summary: Optional[str] = None
    # Profile enrichment fields (added after LLM call)
    key_skills_from_profile: Optional[List[str]] = Field(default_factory=list)
    career_level_from_profile: Optional[str] = None

class TechnicalAssessment(BaseModel):
    overall_score: float = 0.0
    skill_breakdown: List[SkillBreakdown] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    improvement_areas: List[str] = Field(default_factory=list)
    comments: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def build_skill_breakdown_from_test_results(cls, data: Any) -> Any:
        """If LLM didn't return a proper skill_breakdown, build it from injected test_results"""
        if isinstance(data, dict):
            breakdown = data.get('skill_breakdown', [])
            test_results = data.get('_test_results', [])  # injected by service
            
            # Convert "N/A" strings to 0.0 for overall_score
            overall_score = data.get('overall_score', 0.0)
            if isinstance(overall_score, str) and overall_score.upper() == 'N/A':
                data['overall_score'] = 0.0
            elif isinstance(overall_score, (int, float)):
                data['overall_score'] = float(overall_score)
            else:
                data['overall_score'] = 0.0
            
            # Convert skill scores in breakdown from "N/A" to 0.0
            if isinstance(breakdown, list):
                for skill in breakdown:
                    if isinstance(skill, dict):
                        score = skill.get('score', 0.0)
                        if isinstance(score, str) and score.upper() == 'N/A':
                            skill['score'] = 0.0
                        elif isinstance(score, (int, float)):
                            skill['score'] = float(score)
                        else:
                            skill['score'] = 0.0
            
            # Only use fallback if breakdown is missing or is the "General" placeholder
            if (not breakdown or 
                (len(breakdown) == 1 and breakdown[0].get('skill') == 'General')) \
                and test_results:
                data['skill_breakdown'] = [
                    {
                        "skill": r['skill_name'],
                        "score": r['percentage'],
                        "mastery_level": _mastery(r['percentage']),
                        "assessment": r.get('comment', f"{r['skill_name']}: {r['percentage']:.1f}% ({r['correct_answers']}/{r['total_questions']} correct)")
                    }
                    for r in test_results
                ]
            
            # Enforce actual score from test results if provided
            actual_score = data.pop('_actual_score', None)
            if actual_score is not None:
                data['overall_score'] = actual_score
                
        return data

def _mastery(pct: float) -> str:
    if pct >= 80: return "Expert"
    if pct >= 60: return "Advanced"
    if pct >= 40: return "Intermediate"
    return "Beginner"

class AppliedPosition(BaseModel):
    id: int
    title: str
    company: Optional[str] = None
    description: Optional[str] = None
    required_skills: List[str] = Field(default_factory=list)

class RecommendedPosition(BaseModel):
    position: str
    match_score: float
    reasoning: Optional[str] = None
    requirements_match: Optional[Dict[str, Any]] = None
    skill_gaps: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)

class PositionAnalysis(BaseModel):
    applied_positions: List[AppliedPosition] = Field(default_factory=list)
    applied_position: Optional[str] = None  # For backward compatibility
    applied_position_match: float = 0.0
    position_fit: Optional[str] = None
    position_requirements: Dict[str, Any] = Field(default_factory=dict)
    recommended_positions: List[RecommendedPosition] = Field(default_factory=list)
    alternative_positions: List[RecommendedPosition] = Field(default_factory=list)
    comments: Optional[str] = None
    detailed_analysis: Optional[str] = None

class CompositeScoreBreakdown(BaseModel):
    """Détail du calcul du score composite"""
    technical_test_score: float = 0.0
    position_fit_score: float = 0.0
    cv_profile_score: float = 0.0
    technical_weight: float = 0.4
    position_weight: float = 0.3
    cv_weight: float = 0.3
    calculation_formula: str = "40% Test Technique + 30% Fit Poste + 30% Profil CV"
    final_composite_score: float = 0.0

class HiringRecommendation(BaseModel):
    recommendation: str = "No recommendation"
    composite_score: float = 0.0
    composite_score_breakdown: Optional[CompositeScoreBreakdown] = None
    reason: Optional[str] = None  # Raison principale de la recommandation
    recommendation_reasoning: Optional[str] = None
    key_factors: List[str] = Field(default_factory=list)
    potential_risks: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)
    salary_expectations: Optional[str] = None
    start_date_availability: Optional[str] = None
    comments: Optional[str] = None

class TeamFitAnalysis(BaseModel):
    collaboration_score: float = 0.0
    leadership_potential: str = "Unknown"
    adaptability_score: float = 0.0
    communication_skills: float = 0.0
    problem_solving_approach: Optional[str] = None
    teamwork_preference: Optional[str] = None
    cultural_fit_indicators: List[str] = Field(default_factory=list)
    work_style: Optional[str] = None
    motivation_level: Optional[str] = None
    conflict_resolution: Optional[str] = None
    comments: Optional[str] = None

class EvaluationReport(BaseModel):
    candidate_summary: CandidateSummary
    technical_assessment: TechnicalAssessment
    position_analysis: PositionAnalysis
    hiring_recommendation: HiringRecommendation
    team_fit_analysis: TeamFitAnalysis

class EvaluationReportService:
    def __init__(self):
        self.api_key = None

    def _ensure_api_key(self):
        if self.api_key is None:
            self.api_key = os.getenv("GROQ_API_KEY")
            if not self.api_key:
                raise ValueError("GROQ_API_KEY not set in environment variables")

    async def _call_groq_api_async(self, prompt: str, retries: int = 3) -> str:
        """Call Groq API for LLM evaluation"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": 4000
        }

        timeout = aiohttp.ClientTimeout(total=120)  # 2 minutes timeout

        for attempt in range(retries):
            try:
                async with aiohttp.ClientSession(timeout=timeout) as session:
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
                            # Use exponential backoff with longer wait times for rate limiting
                            wait_time = min(60, 10 * (2 ** attempt))  # 10s, 20s, 40s, max 60s
                            logger.info(f"Waiting {wait_time} seconds before retry...")
                            await asyncio.sleep(wait_time)
                        else:
                            error_text = await resp.text()
                            logger.error(f"API error {resp.status}: {error_text}")
                            if resp.status >= 500:  # Server errors, retry
                                wait_time = min(30, 5 * (attempt + 1))
                                logger.info(f"Server error, waiting {wait_time} seconds before retry...")
                                await asyncio.sleep(wait_time)
                            else:  # Client errors (4xx), don't retry
                                break
            except asyncio.TimeoutError:
                logger.warning(f"Timeout on attempt {attempt + 1}/{retries}")
                if attempt < retries - 1:
                    await asyncio.sleep(10)
            except Exception as e:
                logger.error(f"Request failed on attempt {attempt + 1}/{retries}: {e}")
                if attempt < retries - 1:
                    await asyncio.sleep(5)
        
        raise Exception(f"Max retries exceeded for evaluation report generation")

    def _extract_json_from_response(self, response_text: str) -> dict:
        """Extract JSON from LLM response"""
        response_text = response_text.replace("```json", "").replace("```", "").strip()
        
        # Try to find JSON boundaries in case there's extra text
        try:
            # Look for the first { and the last } to extract JSON portion
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}')
            
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                json_text = response_text[start_idx:end_idx + 1]
                return json.loads(json_text)
            else:
                # Fallback to original approach
                return json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}")
            logger.error(f"Response text: {response_text[:500]}...")  # Log first 500 chars
            return {}

    def _calculate_fallback_scores(self, test_results: List[Dict]) -> Dict:
        """Calculate fallback scores if LLM fails"""
        if not test_results:
            return {"overall_score": 0, "skill_breakdown": []}
        
        total_score = sum(result.get("score", 0) for result in test_results)
        max_total = sum(result.get("max_score", 1) for result in test_results)
        overall_score = round((total_score / max_total) * 100, 2) if max_total > 0 else 0
        
        skill_breakdown = []
        for result in test_results:
            score = result.get("score", 0)
            max_score = result.get("max_score", 1)
            percentage = round((score / max_score) * 100, 2) if max_score > 0 else 0
            
            mastery_level = "Beginner"
            if percentage >= 80:
                mastery_level = "Expert"
            elif percentage >= 60:
                mastery_level = "Advanced"
            elif percentage >= 40:
                mastery_level = "Intermediate"
            
            skill_breakdown.append({
                "skill": result.get("skill_name", "Unknown"),
                "score": percentage,
                "mastery_level": mastery_level,
                "assessment": f"Scored {percentage}% on {result.get('skill_name', 'Unknown')}"
            })
        
        return {
            "overall_score": overall_score,
            "skill_breakdown": skill_breakdown
        }

    async def generate_evaluation_report(
        self,
        candidate_profile: dict,
        test_results: List[Dict],
        applied_position: str,
        applied_positions: List[Dict] = None,
        actual_global_score: float = None,
        actual_correct_answers: int = None,
        actual_total_questions: int = None,
        candidate_info: dict = None
    ) -> EvaluationReport:
        """
        Generate comprehensive evaluation report for a candidate
        
        Args:
            candidate_profile: Candidate's CV and profile data
            test_results: List of test results with scores
            applied_position: Primary position the candidate applied for
            applied_positions: List of all positions the candidate applied for
            actual_global_score: Actual global score from test
            actual_correct_answers: Number of correct answers
            actual_total_questions: Total number of questions
            candidate_info: Candidate's personal information from backend
            
        Returns:
            EvaluationReport: Comprehensive evaluation report
        """
        self._ensure_api_key()
        
        # Log the test_results being sent to LLM
        logger.info("=" * 80)
        logger.info("TEST_RESULTS ENVOYÉS AU LLM:")
        logger.info("=" * 80)
        logger.info(f"Test results data: {test_results}")
        logger.info(f"Test results type: {type(test_results)}")
        if isinstance(test_results, list) and len(test_results) > 0:
            logger.info(f"Number of skills: {len(test_results)}")
            for i, result in enumerate(test_results):
                logger.info(f"Skill {i+1}: {result}")
        else:
            logger.warning("Test results is empty or not a list!")
        logger.info("=" * 80)
        
        # Log the applied positions being sent to LLM
        logger.info("=" * 80)
        logger.info("POSITIONS APPLIQUÉES ENVOYÉES AU LLM:")
        logger.info("=" * 80)
        logger.info(f"Applied positions: {applied_positions}")
        logger.info(f"Primary position: {applied_position}")
        logger.info("=" * 80)
        
        # Log candidate info being sent to LLM
        logger.info("=" * 80)
        logger.info("INFORMATIONS DU CANDIDAT ENVOYÉES AU LLM:")
        logger.info("=" * 80)
        logger.info(f"Candidate info: {candidate_info}")
        logger.info("=" * 80)
        
        # Build the prompt with actual scores
        # Better JSON escaping for complex nested structures
        def safe_json_str(obj):
            """Convert object to JSON string with proper escaping"""
            if obj is None:
                return "null"
            if isinstance(obj, str):
                # For format strings, we need to escape single quotes but keep JSON valid
                # Don't escape single quotes here - let json.dumps handle it properly
                return obj
            if isinstance(obj, (int, float)):
                # Convert numbers directly to string
                return str(obj)
            try:
                import json
                json_str = json.dumps(obj, ensure_ascii=False)
                # For format strings, we need to escape braces but keep JSON valid
                # Don't modify the JSON string - let format() handle it
                return json_str
            except Exception as e:
                logger.warning(f"JSON serialization failed: {e}")
                return str(obj)
        
        try:
            # Log types and values for debugging
            logger.info("=" * 80)
            logger.info("DEBUGGING TYPES AND VALUES:")
            logger.info("=" * 80)
            logger.info(f"actual_global_score type: {type(actual_global_score)}, value: {actual_global_score}")
            logger.info(f"actual_correct_answers type: {type(actual_correct_answers)}, value: {actual_correct_answers}")
            logger.info(f"actual_total_questions type: {type(actual_total_questions)}, value: {actual_total_questions}")
            logger.info(f"applied_position type: {type(applied_position)}, value: {applied_position}")
            logger.info("=" * 80)
            
            # Prepare all format arguments with explicit type conversion
            format_args = {
                'candidate_profile': safe_json_str(candidate_profile),
                'test_results': safe_json_str(test_results),
                'actual_global_score': str(actual_global_score) if actual_global_score is not None else "N/A",
                'actual_correct_answers': str(actual_correct_answers) if actual_correct_answers is not None else "N/A",
                'actual_total_questions': str(actual_total_questions) if actual_total_questions is not None else "N/A",
                'applied_positions': safe_json_str(applied_positions) if applied_positions else "[]",
                'applied_position': str(applied_position) if applied_position is not None else "N/A",
                'candidate_info': safe_json_str(candidate_info) if candidate_info else "{}"
            }
            
            # Log format arguments for debugging
            logger.info("=" * 80)
            logger.info("FORMAT ARGUMENTS FOR PROMPT:")
            logger.info("=" * 80)
            for key, value in format_args.items():
                logger.info(f"{key}: {value[:200]}...")
            logger.info("=" * 80)
            
            # Test template variables count
            template_vars = EVALUATION_REPORT_PROMPT.count('{')
            logger.info(f"Template variables needed: {template_vars}")
            logger.info(f"Format arguments provided: {len(format_args)}")
            
            prompt = EVALUATION_REPORT_PROMPT.format(**format_args)
            
        except Exception as e:
            logger.error(f"Prompt formatting failed: {e}")
            logger.error(f"Exception type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            logger.error(f"Template variables: {EVALUATION_REPORT_PROMPT.count('{')}")
            raise ValueError(f"Erreur de formatage du prompt: {str(e)}")
        
        # Log the prompt being sent to LLM
        logger.info("=" * 80)
        logger.info("PROMPT COMPLET ENVOYÉ AU LLM:")
        logger.info("=" * 80)
        logger.info(f"Prompt preview (first 1000 chars): {prompt[:1000]}")
        logger.info("=" * 80)
        
        # Add unique identifiers for tracking
        unique_id = str(uuid.uuid4())[:8]
        timestamp = int(time.time())
        prompt = f"EVALUATION_REPORT_ID:{unique_id}_TIME:{timestamp}\n{prompt}"
        
        try:
            # Call LLM API
            llm_response = await self._call_groq_api_async(prompt)
            
            # Log the raw LLM response
            logger.info("=" * 80)
            logger.info("RÉPONSE BRUTE DU LLM:")
            logger.info("=" * 80)
            logger.info(f"Response text: {llm_response}")
            logger.info("=" * 80)
            
            # Extract JSON from response
            if "```json" in llm_response:
                json_start = llm_response.find("```json") + 7
                json_end = llm_response.find("```", json_start)
                json_str = llm_response[json_start:json_end].strip()
            else:
                json_str = llm_response.strip()
            
            # More robust JSON parsing with fallback
            try:
                parsed_data = json.loads(json_str)
            except json.JSONDecodeError as e:
                logger.error(f"Primary JSON parsing failed: {e}")
                # Try to fix common JSON issues
                try:
                    # Fix invalid escape sequences
                    fixed_json = json_str.replace("\\'", "'").replace('\\"', '"')
                    parsed_data = json.loads(fixed_json)
                    logger.info("JSON parsing succeeded after fixing escape sequences")
                except json.JSONDecodeError as e2:
                    logger.error(f"Fixed JSON parsing also failed: {e2}")
                    # Last resort: try to extract JSON manually
                    try:
                        import re
                        # Extract JSON object between first { and last }
                        json_match = re.search(r'\{.*\}', json_str, re.DOTALL)
                        if json_match:
                            cleaned_json = json_match.group(0)
                            parsed_data = json.loads(cleaned_json)
                            logger.info("JSON parsing succeeded with regex extraction")
                        else:
                            raise ValueError("No valid JSON object found")
                    except Exception as e3:
                        logger.error(f"All JSON parsing methods failed: {e3}")
                        raise ValueError(f"Échec du parsing JSON: {str(e)}")
            
            logger.info("=" * 80)
            logger.info("DONNÉES JSON PARSÉES:")
            logger.info("=" * 80)
            logger.info(f"Parsed data: {parsed_data}")
            logger.info("=" * 80)
            
            if not parsed_data:
                logger.error("LLM response parsing failed - cannot generate report without LLM")
                raise ValueError("Échec de la génération du rapport: la réponse LLM n'a pas pu être parsée")
        
        except Exception as e:
            logger.error(f"Error generating evaluation report: {e}")
            if "rate_limit_exceeded" in str(e) or "tokens per minute" in str(e):
                raise ValueError("Limite de l'API Groq atteinte (6000 TPM). Veuillez réessayer dans quelques minutes ou réduire la taille des données.")
            else:
                raise ValueError(f"Échec de la génération du rapport: {str(e)}")
        
        # Log the data being passed to Pydantic models for debugging
        logger.info("=" * 80)
        logger.info("DONNÉES PASSÉES AUX MODÈLES PYDANTIC:")
        logger.info("=" * 80)
        logger.info(f"CandidateSummary data: {parsed_data.get('candidate_summary', {})}")
        logger.info(f"TechnicalAssessment data: {parsed_data.get('technical_assessment', {})}")
        logger.info(f"PositionAnalysis data: {parsed_data.get('position_analysis', {})}")
        logger.info(f"HiringRecommendation data: {parsed_data.get('hiring_recommendation', {})}")
        logger.info(f"TeamFitAnalysis data: {parsed_data.get('team_fit_analysis', {})}")
        logger.info("=" * 80)
        
        # --- Enrich parsed_data before building models ---
        
        # 1. Inject test_results and actual score into technical_assessment for the validator
        tech_data = parsed_data.get("technical_assessment", {})
        tech_data['_test_results'] = test_results
        if actual_global_score is not None:
            tech_data['_actual_score'] = actual_global_score
        parsed_data['technical_assessment'] = tech_data

        # 2. Ensure candidate_summary has position_applied with all positions
        summary_data = parsed_data.get("candidate_summary", {})
        # Always override with all applied positions for consistency
        if applied_positions:
            position_titles = [pos.get("title", "Unknown") for pos in applied_positions]
            summary_data["position_applied"] = ", ".join(position_titles)
        else:
            summary_data["position_applied"] = applied_position or "Unknown"
        parsed_data["candidate_summary"] = summary_data

        # 3. Merge candidate profile data into candidate_summary
        profile_summary = candidate_profile.get("Summary", {})
        summary_data.update({
            "key_skills_from_profile": profile_summary.get("key_skills", []),
            "career_level_from_profile": profile_summary.get("career_level"),
        })
        # Fill email from profile if LLM missed it
        if not summary_data.get("email"):
            basic = candidate_profile.get("basic_information", {})
            summary_data["email"] = basic.get("email")
        parsed_data["candidate_summary"] = summary_data

        # 3. Ensure position_analysis has all applied positions as string
        pos_data = parsed_data.get("position_analysis", {})
        if not pos_data.get("applied_position"):
            # Create a string with all applied positions
            if applied_positions:
                position_titles = [pos.get("title", "Unknown") for pos in applied_positions]
                pos_data["applied_position"] = ", ".join(position_titles)
            else:
                pos_data["applied_position"] = applied_position
        parsed_data["position_analysis"] = pos_data

        # --- Build Pydantic models ---
        try:
            report = EvaluationReport(
                candidate_summary=CandidateSummary(**parsed_data.get("candidate_summary", {})),
                technical_assessment=TechnicalAssessment(**parsed_data.get("technical_assessment", {})),
                position_analysis=PositionAnalysis(**parsed_data.get("position_analysis", {})),
                hiring_recommendation=HiringRecommendation(**parsed_data.get("hiring_recommendation", {})),
                team_fit_analysis=TeamFitAnalysis(**parsed_data.get("team_fit_analysis", {}))
            )
        except Exception as e:
            logger.error(f"Pydantic model error: {e}\nData: {parsed_data}")
            raise
        
        # Log the generated report for debugging
        logger.info("=" * 80)
        logger.info("GÉNÉRATION DU RAPPORT D'ÉVALUATION IA")
        logger.info("=" * 80)
        logger.info(f"CANDIDAT: {report.candidate_summary.name}")
        logger.info(f"EMAIL: {report.candidate_summary.email}")
        logger.info(f"NIVEAU: {report.candidate_summary.experience_level}")
        logger.info(f"SCORE TECHNIQUE: {report.technical_assessment.overall_score}%")
        logger.info(f"COMPÉTENCES: {', '.join(report.technical_assessment.strengths)}")
        logger.info(f"SCORE DE COMPATIBILITÉ: {report.position_analysis.applied_position_match}%")
        logger.info(f"RECOMMANDATION: {report.hiring_recommendation.recommendation}")
        logger.info(f"COMPOSITE SCORE: {report.hiring_recommendation.composite_score}%")
        logger.info(f"SCORE D'ÉQUIPE: {report.team_fit_analysis.collaboration_score}%")
        logger.info("=" * 80)
        
        return report

    
    def generate_json_report(self, report: EvaluationReport) -> str:
        # exclude=None keeps all fields; no resolved_* clutter since we removed computed_fields
        return report.model_dump_json(indent=4, exclude_none=True)
