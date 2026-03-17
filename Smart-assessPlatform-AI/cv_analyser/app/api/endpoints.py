from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.extractor import extract_text_from_bytes
from app.services.analyzer import CVAnalyzer
from app.services.generator import QuestionGenerator
from app.utils.cv_validator import validate_cv_text, validate_file_type

router = APIRouter()
analyzer = CVAnalyzer()
generator = QuestionGenerator()

class Skill(BaseModel):
    name: str
    skill_level: str

class TechnicalInfo(BaseModel):
    programming_languages: List[Skill] = []
    web_frameworks: List[Skill] = []
    databases: List[Skill] = []
    tools: List[Skill] = []

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