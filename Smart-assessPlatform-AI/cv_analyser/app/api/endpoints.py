from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.extractor import extract_text_from_bytes
from app.services.analyzer import CVAnalyzer
from app.services.generator import QuestionGenerator
from app.utils.cv_validator import validate_cv_text, validate_file_type
from app.services.report_generator import ReportGenerator, CandidateReport
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from app.services.eligibility_service import check_domain_eligibility  # ✅ import
from app.services.evaluation_report_service import EvaluationReportService
from app.services.matching_service import CandidateMatchingService

router = APIRouter()
analyzer = CVAnalyzer()
generator = QuestionGenerator()
report_generator = ReportGenerator()
evaluation_service = EvaluationReportService()
matching_service = CandidateMatchingService()

class Skill(BaseModel):
    name: str
    skill_level: str

class TechnicalInfo(BaseModel):
    domain: str = ""
    technologies: Dict = {}

class Certification(BaseModel):
    certification_name: str
    issuing_organization: Optional[str] = None
    issue_date: Optional[str] = None
    expiration_date: Optional[str] = None

class SoftSkills(BaseModel):
    communication_skills: List[str] = []
    leadership_skills: List[str] = []
    problem_solving: List[str] = []
    teamwork: List[str] = []
    time_management: List[str] = []
    adaptability: List[str] = []


class Project(BaseModel):
    name: str
    tech_stack: List[str] = []
    role: str

class CandidateProfile(BaseModel):
    basic_information: Dict[str, str]
    summary: Dict[str, str]
    technical_information: TechnicalInfo
    certifications: List[Certification] = []
    soft_skills: SoftSkills
    projects_list: List[Project]

class GenerateRequest(BaseModel):
    candidate_id: str
    candidate_profile: CandidateProfile
    target_difficulty: str
    number_of_questions: int
    question_types: List[str]

class GenerateFromProfileRequest(BaseModel):
    candidate_profile: dict
    number_of_questions: int = 5
class GenerateReportRequest(BaseModel):
    candidate_profile: dict
    test_results: List[Dict]          # Liste des résultats de test [{skill_name, score, max_score, comment}]
    applied_position: str
    test_start: str                   
    test_end: str                     

class EligibilityRequest(BaseModel):
    candidate_domain: str
    accepted_domains: list[str]

class EligibilityResult(BaseModel):
    eligible: bool
    matched_domain: str | None = None
    reason: str 

# Models for evaluation report
class EvaluationReportRequest(BaseModel):
    candidate_profile: dict
    test_results: List[Dict]
    applied_position: str
    applied_positions: Optional[List[Dict]] = None
    actual_global_score: Optional[float] = None
    actual_correct_answers: Optional[int] = None
    actual_total_questions: Optional[int] = None
    candidate_info: Optional[Dict] = None

# Models for candidate matching
class PositionRequirements(BaseModel):
    title: str
    required_skills: List[str]
    experience_level: str
    domain: str
    key_requirements: List[str] = []
    description: Optional[str] = None

class CandidateProfileForMatching(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    technical_information: Dict
    summary: Dict
    basic_information: Dict

class MatchingRequest(BaseModel):
    position_requirements: PositionRequirements
    candidates_profiles: List[CandidateProfileForMatching]
    top_n: Optional[int] = 5

class BestCandidatesRequest(BaseModel):
    position_requirements: PositionRequirements
    candidates_profiles: List[CandidateProfileForMatching]
    top_n: int = 5 

@router.post("/eligibility", response_model=EligibilityResult)
async def check_domain_eligibility_endpoint(body: EligibilityRequest):
    try:
        result = await check_domain_eligibility(
            candidate_domain=body.candidate_domain,
            accepted_domains=body.accepted_domains
        )
        return EligibilityResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "CV Analysis API"}

@router.post("/generate")
async def generate_questions(request: GenerateRequest):
    profile_json = request.candidate_profile.dict()
    return await generator.generate(profile_json, num_questions=request.number_of_questions)

@router.post("/generate-from-profile")
async def generate_questions_from_profile(request: GenerateFromProfileRequest):
    """
    Generate questions directly from candidate profile JSON (output from analyze-cv endpoint)
    """
    return await generator.generate(request.candidate_profile, num_questions=request.number_of_questions)

@router.post("/analyze-cv")
async def analyze_cv(file: UploadFile = File(...)):
    try:
        type_valid, type_message = validate_file_type(file.filename)
        if not type_valid:
            raise HTTPException(status_code=400, detail=type_message)

        content = await file.read()
        text = extract_text_from_bytes(content, file.filename)

        is_valid, message = validate_cv_text(text)
        if not is_valid:
            raise HTTPException(status_code=400, detail=message)

        data = await analyzer.analyze(text)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-report")
async def generate_report(request: GenerateReportRequest):
    try:
        # Convertir dates ISO en datetime
        from datetime import datetime
        test_start_dt = datetime.fromisoformat(request.test_start)
        test_end_dt = datetime.fromisoformat(request.test_end)

        report: CandidateReport = await report_generator.generate_report(
            candidate_profile=request.candidate_profile,
            test_results=request.test_results,
            applied_position=request.applied_position,
            test_start=test_start_dt,
            test_end=test_end_dt
        )

        # Retourner le JSON du rapport
        return report_generator.generate_json(report)

    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

# New endpoints for evaluation reports and candidate matching

@router.post("/generate-evaluation-report")
async def generate_evaluation_report(request: EvaluationReportRequest):
    """
    Generate comprehensive evaluation report for a candidate
    """
    try:
        report = await evaluation_service.generate_evaluation_report(
            candidate_profile=request.candidate_profile,
            test_results=request.test_results,
            applied_position=request.applied_position,
            applied_positions=request.applied_positions,
            actual_global_score=request.actual_global_score,
            actual_correct_answers=request.actual_correct_answers,
            actual_total_questions=request.actual_total_questions,
            candidate_info=request.candidate_info
        )
        
        # Return JSON report as object (not string)
        return report.model_dump(exclude_none=True)
        
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/match-candidates-to-position")
async def match_candidates_to_position(request: MatchingRequest):
    """
    Match candidates to a specific position and rank them
    """
    try:
        # Convert Pydantic models to dicts
        position_dict = request.position_requirements.dict()
        candidates_list = [candidate.dict() for candidate in request.candidates_profiles]
        
        matching_result = await matching_service.match_candidates_to_position(
            position_requirements=position_dict,
            candidates_profiles=candidates_list
        )
        
        # Return JSON matching result as object (not string)
        return matching_result.model_dump(exclude_none=True)
        
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/get-best-candidates")
async def get_best_candidates_for_position(request: BestCandidatesRequest):
    """
    Get top N candidates for a position (simplified response)
    """
    try:
        # Convert Pydantic models to dicts
        position_dict = request.position_requirements.dict()
        candidates_list = [candidate.dict() for candidate in request.candidates_profiles]
        
        top_candidates = await matching_service.get_best_candidates_for_position(
            position_requirements=position_dict,
            candidates_profiles=candidates_list,
            top_n=request.top_n
        )
        
        return {
            "position": request.position_requirements.title,
            "total_candidates": len(candidates_list),
            "top_candidates": top_candidates
        }
        
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))