import os
import json
import uuid
import time
import re
import logging
import aiohttp
import asyncio

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

QUESTION_PROMPT_TEMPLATE = """
Generate exactly {num_questions} multiple-choice questions based on this candidate profile:

{candidate_profile}

REQUIREMENTS:
- Generate EXACTLY {num_questions} questions - no more, no less
- Each question: technology, level, question, options[4], correct_answer
- NO explanations
- Use technologies from candidate profile
- Mix difficulty levels appropriately

FORMAT INSTRUCTIONS:
- Return ONLY valid JSON
- NO markdown blocks
- NO trailing commas
- All strings must be properly quoted
- Escape quotes inside strings with backslash

EXAMPLE FORMAT:
{{"questions":[{{"technology":"React","level":"advanced","question":"What is useEffect?","options":["A) Side effects","B) State","C) Props","D) Context"],"correct_answer":"A) Side effects"}}]}}
CRITICAL: Must generate exactly {num_questions} questions. Count them before returning.
"""

# -----------------------------
# Helper function to parse JSON safely
# -----------------------------
def extract_json_from_response(response_text: str) -> dict:
    """Extract valid JSON from LLM response quickly."""
    # Remove markdown
    response_text = re.sub(r"```json|```", "", response_text, flags=re.IGNORECASE)
    
    # Fix common trailing commas
    response_text = re.sub(r",\s*}", "}", response_text)
    response_text = re.sub(r",\s*]", "]", response_text)
    
    # Try direct parsing first
    try:
        return json.loads(response_text)
    except json.JSONDecodeError as e:
        logger.warning(f"Direct JSON parsing failed: {str(e)}")
        
        # Try to extract questions array with regex
        try:
            questions_match = re.search(r'"questions"\s*:\s*(\[.*?\])', response_text, flags=re.DOTALL)
            if questions_match:
                questions_json = questions_match.group(1)
                questions = json.loads(questions_json)
                return {"questions": questions}
        except Exception as e2:
            logger.warning(f"Regex extraction failed: {str(e2)}")
        
        # Try to extract individual question objects
        try:
            question_objects = re.findall(r'\{[^{}]*"technology"[^{}]*"level"[^{}]*"question"[^{}]*"options"[^{}]*"correct_answer"[^{}]*\}', response_text, flags=re.DOTALL)
            if question_objects:
                questions = []
                for q_obj in question_objects:
                    try:
                        q_json = json.loads(q_obj)
                        questions.append(q_json)
                    except:
                        continue
                if questions:
                    return {"questions": questions}
        except Exception as e3:
            logger.warning(f"Individual question extraction failed: {str(e3)}")
        
        logger.error(f"All JSON parsing methods failed. Response: {response_text[:500]}...")
        raise ValueError("Invalid JSON returned by LLM")

# -----------------------------
# Async Groq API call
# -----------------------------
async def call_groq_api_async(prompt: str, retries=3):
    api_key = os.getenv("GROQ_API_KEY")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "max_tokens": 8000
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
                if resp.status == 429:
                    text = await resp.text()
                    logger.warning("Rate limit hit. Waiting before retry...")
                    await asyncio.sleep(12)
                    continue
                text = await resp.text()
                raise Exception(f"API error {resp.status}: {text}")
    raise Exception("Max retries exceeded due to rate limits")

# -----------------------------
# Question Generator
# -----------------------------
class QuestionGenerator:
    def __init__(self):
        self.api_key = None
        
    def _ensure_api_key(self):
        if self.api_key is None:
            self.api_key = os.getenv("GROQ_API_KEY")
            if not self.api_key:
                raise ValueError("GROQ_API_KEY not set")
        
    async def generate(self, candidate_json: dict, num_questions: int = 20):
        if not candidate_json:
            return {"message": "Candidate profile is empty", "data": None}

        self._ensure_api_key()

        try:
            all_questions = []
            attempts = 0
            max_attempts = 10

            while len(all_questions) < num_questions and attempts < max_attempts:
                remaining = num_questions - len(all_questions)
                logger.info(f"Generating {remaining} remaining questions...")
                unique_id = str(uuid.uuid4())[:8]
                timestamp = int(time.time())
                prompt = QUESTION_PROMPT_TEMPLATE.format(
                    candidate_profile=json.dumps(candidate_json, ensure_ascii=False),
                    num_questions=remaining
                )
                prompt = f"REQUEST_ID:{unique_id}_TIME:{timestamp}\n{prompt}"
                response_text = await call_groq_api_async(prompt)
                parsed = extract_json_from_response(response_text)

                if "questions" not in parsed:
                    attempts += 1
                    continue

                # Deduplicate
                seen = {hash(q.get("question","")) for q in all_questions}
                for q in parsed["questions"]:
                    q_hash = hash(q.get("question",""))
                    if q_hash not in seen:
                        seen.add(q_hash)
                        all_questions.append(q)

                attempts += 1

            # Trim if slightly above
            all_questions = all_questions[:num_questions]
            logger.info(f"Final question count: {len(all_questions)}")
            return {"questions": all_questions}

        except Exception as e:
            logger.error(f"Generation failed: {str(e)}")
            return {"message": str(e), "data": None}