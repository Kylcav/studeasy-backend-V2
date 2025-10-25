# File Upload & Text Extraction API Documentation

## Overview
This API provides comprehensive file upload and text extraction functionality, converting your PHP file processing code to Node.js. It supports PDF, DOC, DOCX, and image files with OCR capabilities.

## Required Dependencies
```bash
npm install axios uuid multer pdf-parse mammoth tesseract.js
```

## Environment Variables
Add to your `.env` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
OCR_SPACE_API_KEY=your_ocr_space_api_key_here
```

## API Endpoints

### 1. Upload File and Extract Text
**POST** `/api/files/upload-extract`

**Authentication**: Required

**Content-Type**: `multipart/form-data`

**Request Body**:
- `file` (file, required): PDF, DOC, DOCX, JPG, JPEG, PNG, or WEBP file (max 50MB)

**Response**:
```json
{
  "success": true,
  "message": "File uploaded and text extracted successfully",
  "data": {
    "fileUrl": "https://your-bucket.s3.amazonaws.com/documents/1234567890-document.pdf",
    "filename": "document.pdf",
    "text": [
      "First paragraph of extracted text...",
      "Second paragraph of extracted text...",
      "Third paragraph of extracted text..."
    ],
    "textLength": 1234
  }
}
```

### 2. Extract Text from URL
**POST** `/api/files/extract-url`

**Authentication**: Required

**Request Body**:
```json
{
  "url": "https://example.com/document.pdf"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Text extracted successfully",
  "data": {
    "url": "https://example.com/document.pdf",
    "filename": "document.pdf",
    "text": [
      "Extracted paragraph 1...",
      "Extracted paragraph 2..."
    ],
    "textLength": 567
  }
}
```

### 3. Generate Summary
**POST** `/api/files/generate-summary`

**Authentication**: Required

**Request Body**:
```json
{
  "text": "Your text content here...",
  "classId": "64a1b2c3d4e5f6789012345"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Summary generated successfully",
  "data": {
    "summary": "Generated summary of the text content...",
    "classId": "64a1b2c3d4e5f6789012345"
  }
}
```

### 4. Update Class Summary
**POST** `/api/files/update-summary`

**Authentication**: Required (Teacher/Admin only)

**Request Body**:
```json
{
  "classId": "64a1b2c3d4e5f6789012345",
  "text": "Updated summary text..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Summary updated successfully",
  "data": {
    "classId": "64a1b2c3d4e5f6789012345",
    "summary": "Updated summary text..."
  }
}
```

### 5. Generate Quiz with File Upload
**POST** `/api/quiz/generate`

**Authentication**: Required (Teacher only)

**Content-Type**: `multipart/form-data`

**Request Body**:
- `file` (file, optional): PDF, DOC, DOCX, JPG, JPEG, PNG, or WEBP file
- `text` (string, optional): Direct text input
- `questions` (number, required): Number of questions to generate (1-20)
- `subjectId` (string, required): MongoDB ObjectId of the subject
- `difficulty` (string, required): Either "facile" or "difficile"

**Note**: Either `file` or `text` must be provided.

**Response**:
```json
{
  "success": true,
  "message": "Quiz generated successfully",
  "data": {
    "subjectId": "64a1b2c3d4e5f6789012345",
    "subjectTitle": "Mathematics",
    "difficulty": "facile",
    "questionsGenerated": 5,
    "totalQuestions": 10,
    "fileInfo": {
      "filename": "lesson.pdf",
      "mimetype": "application/pdf",
      "size": 1024000
    },
    "newQuestions": [
      {
        "question": "What is 2 + 2?",
        "options": ["3", "4", "5", "6"],
        "correctAnswer": "4"
      }
    ]
  }
}
```

## Supported File Types

### PDF Files
- **Regular PDFs**: Uses `pdf-parse` library for text extraction
- **Scanned PDFs**: Automatically falls back to OCR.space API if text is too short (< 50 characters)

### DOC/DOCX Files
- Uses `mammoth` library for text extraction
- Handles hyperlinks and formatting
- Supports both .doc and .docx formats

### Image Files
- **Supported formats**: JPG, JPEG, PNG, WEBP
- **OCR Engine**: OCR.space API
- **Language**: French (configurable)

## Features

### ✅ **File Processing**
- **Multiple formats**: PDF, DOC, DOCX, JPG, JPEG, PNG, WEBP
- **Large files**: Up to 50MB file size limit
- **S3 Storage**: Automatic file upload to S3 bucket
- **Text cleaning**: Automatic text normalization and cleaning

### ✅ **OCR Integration**
- **OCR.space API**: For image and scanned PDF text extraction
- **Fallback mechanism**: Automatic OCR for PDFs with insufficient text
- **Error handling**: Comprehensive error handling for OCR failures

### ✅ **Quiz Integration**
- **File-based quiz generation**: Upload files directly to generate quizzes
- **Text-based quiz generation**: Use extracted text for quiz generation
- **Hybrid approach**: Combine file upload with manual text input

### ✅ **Summary Generation**
- **AI-powered summaries**: Uses OpenAI GPT-4o-mini
- **Class integration**: Automatically saves summaries to class records
- **Text length limits**: Handles large documents (200k character limit)

## Usage Examples

### Frontend Integration
```javascript
// Upload file and extract text
const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/files/upload-extract', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return await response.json();
};

// Generate quiz from file
const generateQuizFromFile = async (file, subjectId, questions, difficulty) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('subjectId', subjectId);
  formData.append('questions', questions);
  formData.append('difficulty', difficulty);
  
  const response = await fetch('/api/quiz/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return await response.json();
};

// Extract text from URL
const extractFromUrl = async (url) => {
  const response = await fetch('/api/files/extract-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ url })
  });
  
  return await response.json();
};
```

### cURL Examples
```bash
# Upload file and extract text
curl -X POST http://localhost:5000/api/files/upload-extract \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@document.pdf"

# Generate quiz from file
curl -X POST http://localhost:5000/api/quiz/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@lesson.pdf" \
  -F "subjectId=64a1b2c3d4e5f6789012345" \
  -F "questions=5" \
  -F "difficulty=facile"

# Extract text from URL
curl -X POST http://localhost:5000/api/files/extract-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"url": "https://example.com/document.pdf"}'

# Generate summary
curl -X POST http://localhost:5000/api/files/generate-summary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"text": "Your text content...", "classId": "64a1b2c3d4e5f6789012345"}'
```

## Error Handling

### Common Error Responses
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

### Error Codes
- `400`: Bad Request (validation errors, unsupported file types)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (class/subject not found)
- `413`: Payload Too Large (file size exceeds limit)
- `500`: Internal Server Error (processing errors, API failures)

## Migration from PHP

### Key Differences:
1. **File Handling**: Uses multer instead of Laravel's file handling
2. **PDF Processing**: Uses `pdf-parse` instead of Smalot PDF Parser
3. **DOC Processing**: Uses `mammoth` instead of PhpWord
4. **OCR**: Uses OCR.space API (same as PHP version)
5. **Storage**: Uses S3 instead of local storage
6. **Validation**: Uses Express.js validation instead of Laravel validation

### Equivalent PHP Functions:
- `extractDocumentText()` → `POST /api/files/upload-extract`
- `getResume()` → `POST /api/files/generate-summary`
- `updateResume()` → `POST /api/files/update-summary`
- `generateQuiz()` → `POST /api/quiz/generate` (enhanced with file support)

## Performance Considerations

- **File Size Limit**: 50MB maximum
- **Processing Time**: OCR operations can take 1-2 minutes
- **Memory Usage**: Large files are processed in memory
- **Rate Limiting**: Consider implementing rate limiting for production use
- **Caching**: Consider caching extracted text for repeated access

## Security Notes

- **File Validation**: Strict file type and size validation
- **Authentication**: All endpoints require valid JWT tokens
- **Authorization**: Role-based access control
- **Input Sanitization**: All text inputs are cleaned and validated
- **API Keys**: Store OCR and OpenAI API keys securely
