import os
import re
import json
import unicodedata
import uuid
import time
import requests
import asyncio
from app.utils.helpers import extract_json_from_response
from app.utils.cv_validator import validate_cv_text

PROMPT_TEMPLATE = """
You are an expert CV analyzer for automated MCQ generation. Your goal is to extract a candidate's complete technical profile and relevant information.

Return a STRICT JSON with the following sections:

1) Basic Information
- full_name, email, phone

2) Summary
- summary: Create a concise, professional summary in THIRD PERSON (2-3 sentences maximum) that captures the candidate's essence. Include:
  * Core expertise and specialization
  * Career level and experience highlight
  * Key strengths or notable achievements
  * DO NOT use first-person pronouns (I, my, me). Use third-person (the candidate, they, he/she) or objective descriptions
  * Keep it brief and impactful - maximum 2-3 sentences
- career_level: Determine based on experience and projects (e.g., Junior, Intermediate, Senior)
- years_of_experience: Total years of experience extracted from CV
- key_skills: Top 5 most relevant technical and soft skills
- strengths: Top 3 professional strengths
- specializations: 2-3 key areas of expertise (e.g., "Full-Stack Development", "Cloud Architecture", "AI/ML Integration")

3) Technical Information
- domain: Identify candidate's PRIMARY professional domain (e.g., Software Engineering, Data Science, DevOps, etc.)
- technologies: Group ALL mentioned technologies and skills into logical categories inferred from CV. Use categories dynamically based on context.
- Capture every technology mentioned anywhere in the CV.
- If a technology appears multiple times, include it once with the highest skill level observed.
- skill_level: Assign beginner/intermediate/advanced based on contextual proficiency.
- Consider context from all sections (projects, experience, education, certifications).

4) Certifications
- Extract ONLY explicitly mentioned certifications.
- Include certification_name, issuing_organization (if mentioned, or empty string if not found), issue_date (if mentioned, or empty string if not found), if any info missing, leave it empty.
- Do NOT include diplomas, degrees, or job titles.

5) Soft Skills
- Extract ONLY explicitly mentioned complete soft skills.
- Dynamically group into categories: communication_skills, leadership_skills, problem_solving, teamwork, time_management, adaptability.
- If none mentioned, leave arrays empty.

6) Projects
- For each project in CV, extract following JSON fields:
- name: exact project name
- tech_stack: list of technologies used
- role: very Short, realistic description of candidate's contribution. 
        Infer dynamically from technologies and context mentioned in the CV. 
        Do NOT describe the whole project here; only what the candidate did.
- impact: Brief description of project impact or results achieved

7) Education
- Extract education information with degree, institution, field, start_date, end_date

8) Languages
- Extract all mentioned languages with proficiency levels

CRITICAL RULES:
- Do NOT include project description in the "role" field.
- Keep "role" concise and contribution-focused.
- Extract only information explicitly mentioned in the CV.
- Include every technology at least once in tech_stack.
- Use conservative skill levels if unsure.
- Avoid overfitting; do not use pre-defined role labels.

IMPORTANT: ALWAYS include a comprehensive Summary section with career_level, years_of_experience, key_skills, strengths, and specializations. The summary should be unique, compelling, and highlight the candidate's professional value and potential.

CV TEXT:
{cv_text}
"""

class CVAnalyzer:
    def __init__(self):
        # Initialize LLM components
        self.llm = None

    def _initialize_llm(self):
        """Initialize LLM components lazily using direct Groq API"""
        if self.llm is None:
            try:
                api_key = os.getenv("GROQ_API_KEY")
                if not api_key:
                    raise ValueError("GROQ_API_KEY not found in environment variables")

                self.llm = {
                    "api_key": api_key,
                    "model": "llama-3.1-8b-instant",
                    "temperature": 0
                }
                print("DEBUG: Direct Groq API initialized successfully")
            except Exception as e:
                print(f"DEBUG: Failed to initialize LLM: {str(e)}")
                self.llm = None

    def _call_groq_api(self, cv_text: str, max_retries=3):
        """Call Groq API directly with retry mechanism for rate limiting"""
        for attempt in range(max_retries):
            try:
                headers = {
                    "Authorization": f"Bearer {self.llm['api_key']}",
                    "Content-Type": "application/json"
                }

                data = {
                    "model": self.llm["model"],
                    "messages": [
                        {
                            "role": "user",
                            "content": PROMPT_TEMPLATE.format(cv_text=cv_text)
                        }
                    ],
                    "temperature": self.llm["temperature"]
                }

                response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=data,
                    timeout=30
                )

                if response.status_code == 200:
                    result = response.json()
                    return result["choices"][0]["message"]["content"]
                elif response.status_code == 429:
                    # Rate limit hit - wait and retry
                    error_data = response.json()
                    retry_after = error_data.get('error', {}).get('retry_after', 2)
                    print(f"Rate limit hit, waiting {retry_after}s before retry {attempt + 1}/{max_retries}")
                    time.sleep(retry_after)
                    continue
                else:
                    raise Exception(f"Groq API error: {response.status_code} - {response.text}")

            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                print(f"Attempt {attempt + 1} failed: {str(e)}, retrying...")
                time.sleep(2 ** attempt)  # Exponential backoff
        
        raise Exception("Max retries exceeded")

    async def analyze(self, text: str):
        """Analyze CV text using LLM only"""

        is_valid, validation_message = validate_cv_text(text)
        if not is_valid:
            return {
                "status": "error",
                "message": validation_message,
                "data": None
            }

        try:
            unique_id = str(uuid.uuid4())[:8]
            timestamp = int(time.time())
            cv_text_with_context = f"CV_PROCESSING_ID:{unique_id}_TIME:{timestamp}\n{text}"

            self._initialize_llm()
            if self.llm is not None:
                try:
                    result = self._call_groq_api(cv_text_with_context)
                    extracted_data = extract_json_from_response(result)
                    return extracted_data  # Return only the extracted JSON data
                except Exception as llm_error:
                    return {
                        "status": "error",
                        "message": f"LLM Error: {str(llm_error)}",
                        "data": None
                    }
            else:
                return {
                    "status": "error",
                    "message": "GROQ_API_KEY not found",
                    "data": None
                }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "data": None
            }