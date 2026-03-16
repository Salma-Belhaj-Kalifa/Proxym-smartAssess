import fitz  # PyMuPDF
import docx
import io
from typing import Optional

def extract_text_from_bytes(file_bytes: bytes, filename: Optional[str] = None) -> str:
    """Extract text from uploaded file bytes"""
    try:
        # Determine file type from filename or content
        if filename:
            filename_lower = filename.lower()
        else:
            # Try to detect from content
            if file_bytes.startswith(b'%PDF'):
                filename_lower = 'file.pdf'
            elif file_bytes.startswith(b'PK\x03\x04'):
                filename_lower = 'file.docx'
            else:
                filename_lower = 'file.txt'
        
        if filename_lower.endswith('.pdf'):
            return extract_text_from_pdf(file_bytes)
        elif filename_lower.endswith('.docx'):
            return extract_text_from_docx(file_bytes)
        elif filename_lower.endswith('.txt'):
            return extract_text_from_txt(file_bytes)
        else:
            return "Unsupported file format"
    except Exception as e:
        return f"Error extracting text: {str(e)}"

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes"""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        return f"Error reading PDF: {str(e)}"

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX bytes"""
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        return f"Error reading DOCX: {str(e)}"

def extract_text_from_txt(file_bytes: bytes) -> str:
    """Extract text from TXT bytes"""
    try:
        return file_bytes.decode('utf-8')
    except UnicodeDecodeError:
        try:
            return file_bytes.decode('latin-1')
        except Exception as e:
            return f"Error reading TXT: {str(e)}"
