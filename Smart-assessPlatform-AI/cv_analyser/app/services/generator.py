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

EXAMPLE FORMAT:
{{"questions":[{{"technology":"Python","level":"intermediate","question":"Which statement best describes the role of list comprehension in Python?","options":["A) It creates loops only","B) It simplifies collection creation","C) It manages exceptions","D) It defines classes"],"correct_answer":"A) It simplifies collection creation"}}]}}
CRITICAL: Must generate exactly {num_questions} questions. Count them before returning.
QUESTION RULES:
- Each question must contain:
  - technology
  - level
  - question
  - options (exactly 4 choices)
  - correct_answer

VARIETY RULES (VERY IMPORTANT):
- Do NOT repeat the same concept twice
- Do NOT generate multiple generic definition questions
- Use varied question styles:
  - concept understanding
  - practical situations
  - problem-solving
  - best practices
  - applied usage
  - scenario-based reasoning

PROFILE ADAPTATION:
- Use only skills, tools, technologies, or domains present in candidate profile
- Adapt question difficulty to candidate experience level
- If profile contains multiple domains, distribute questions across them

ANTI-REPETITION RULE:
Avoid repetitive patterns such as:
- "What is X?"
- "What is the purpose of X?"
- "What does X do?"

Instead prefer:
- practical usage
- comparison questions
- decision-making situations
- applied scenarios

QUALITY RULE:
- Every question must test a different concept
- At least half of the questions should be practical or scenario-based
- Questions must feel realistic for recruitment evaluation
FINAL CHECK:
1. Count exactly {num_questions} questions
2. Verify no repeated concept
3. Verify JSON validity

Return ONLY JSON.
"""

def extract_json_from_response(response_text: str) -> dict:
    """Extract valid JSON from LLM response quickly."""
    response_text = re.sub(r"```json|```", "", response_text, flags=re.IGNORECASE)
    
    response_text = re.sub(r",\s*}", "}", response_text)
    response_text = re.sub(r",\s*]", "]", response_text)
    
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


async def call_groq_api_async(prompt: str, retries=3):
    api_key = os.getenv("GROQ_API_KEY")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama-3.3-70b-versatile",
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