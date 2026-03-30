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

router = APIRouter()
analyzer = CVAnalyzer()
generator = QuestionGenerator()
report_generator = ReportGenerator()

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