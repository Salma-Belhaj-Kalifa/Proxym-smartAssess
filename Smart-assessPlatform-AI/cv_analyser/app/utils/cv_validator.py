import re
import os

CV_SECTION_KEYWORDS = [
    # English
    "experience", "education", "skills", "projects", "summary", "employment",
    # French
    "expérience", "formation", "compétences", "profil", "parcours",
    # Arabic
    "خبرة", "التعليم", "مهارات", "المشاريع",
    # Spanish
    "experiencia", "educación", "habilidades",
    # German
    "erfahrung", "ausbildung", "fähigkeiten"
]

ALLOWED_EXTENSIONS = {"pdf", "txt", "docx"}

EMAIL_REGEX = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
PHONE_REGEX = r"\+?\d[\d\s\-]{7,}"


def validate_file_type(filename: str):
    """
    Validate file extension (only pdf, txt, docx allowed)
    """
    if not filename:
        return False, "Filename is missing"

    extension = filename.split(".")[-1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file type: .{extension}. Allowed types: pdf, txt, docx"

    return True, "Valid file type"


def validate_cv_text(text: str):
    """
    Validate if extracted text looks like a real CV
    """
    if not text or len(text.strip()) < 300:
        return False, "Not enough text extracted. Document does not look like a CV"

    text_lower = text.lower()

    # Count section keywords
    section_matches = sum(1 for kw in CV_SECTION_KEYWORDS if kw in text_lower)

    # Contact info detection
    email_found = re.search(EMAIL_REGEX, text)
    phone_found = re.search(PHONE_REGEX, text)

    score = 0

    if section_matches >= 2:
        score += 2

    if email_found:
        score += 1

    if phone_found:
        score += 1

    if len(text.split()) > 150:
        score += 1

    if score >= 3:
        return True, "Valid CV"

    return False, "Document does not look like a CV"


def validate_cv(filename: str, text: str):
    """
    Full validation: file type + content validation
    """
    # Step 1: Validate type
    type_valid, type_message = validate_file_type(filename)
    if not type_valid:
        return False, type_message

    # Step 2: Validate content
    text_valid, text_message = validate_cv_text(text)
    if not text_valid:
        return False, text_message

    return True, "Valid CV file"