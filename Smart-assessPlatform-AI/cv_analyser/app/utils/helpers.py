import re
import json
import logging

logger = logging.getLogger(__name__)


def extract_json_from_response(response_text: str) -> dict:
    """
    Robust JSON extractor for LLM responses.
    Handles complex multi-line JSON from detailed prompts.
    """

    if not isinstance(response_text, str):
        response_text = str(response_text)

    # 1️⃣ Remove markdown ```json ``` wrappers
    response_text = re.sub(r"```json", "", response_text, flags=re.IGNORECASE)
    response_text = re.sub(r"```", "", response_text)

    # 2️⃣ Find the first complete JSON object
    start = response_text.find("{")
    if start == -1:
        raise ValueError("No JSON object found in LLM response")

    # Find the matching closing brace for the first JSON object
    brace_count = 0
    end = None
    in_string = False
    escape_next = False

    for i in range(start, len(response_text)):
        char = response_text[i]
        
        if escape_next:
            escape_next = False
            continue
            
        if char == '\\':
            escape_next = True
            continue
            
        if char == '"' and not escape_next:
            in_string = not in_string
            continue
            
        if not in_string:
            if char == "{":
                brace_count += 1
            elif char == "}":
                brace_count -= 1
                if brace_count == 0:
                    end = i + 1
                    break

    if end is None:
        raise ValueError("Incomplete JSON object in LLM response")

    json_str = response_text[start:end]

    # 3️⃣ Clean formatting issues while preserving structure
    # Remove trailing commas in objects/arrays
    json_str = re.sub(r",\s*}", "}", json_str)
    json_str = re.sub(r",\s*]", "]", json_str)
    
    # Fix common LLM JSON issues
    json_str = re.sub(r"(\w+):\s*", r'"\1": ', json_str)  # Quote unquoted keys
    json_str = re.sub(r":\s*'([^']*)'", r': "\1"', json_str)  # Single to double quotes
    json_str = re.sub(r':\s*([^",\[\]\{\}\s][^",\[\]\{\}\s]*)', r': "\1"', json_str)  # Quote unquoted values
    
    # Handle line breaks properly in JSON strings
    json_str = re.sub(r"\n", "\\n", json_str)
    json_str = re.sub(r"\r", "\\r", json_str)
    json_str = re.sub(r"\t", "\\t", json_str)

    try:
        return json.loads(json_str)

    except json.JSONDecodeError as e:
        logger.error("JSON parsing failed")
        logger.error(f"Error: {str(e)}")
        logger.error(f"JSON string: {json_str}")
        
        # Try additional cleanup attempts
        attempts = [
            # Remove control characters
            lambda s: re.sub(r'[\x00-\x1f\x7f-\x9f]', '', s),
            # Fix missing quotes around keys
            lambda s: re.sub(r'(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', s),
            # Fix missing quotes around string values
            lambda s: re.sub(r':\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(,|\})', r': "\1"\2', s),
        ]
        
        for attempt in attempts:
            try:
                json_str = attempt(json_str)
                return json.loads(json_str)
            except:
                continue
                
        raise ValueError(f"Invalid JSON returned by LLM: {str(e)}")