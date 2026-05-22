# Improvements: Advanced / AI Features

## 1. AI Study Assistant
### Frontend Improvements
- **Voice Input/Output:** Add a microphone button for voice queries and text-to-speech for responses.
- **Contextual Awareness:** Allow the bot to read the current page (e.g., if on the syllabus page, "Explain Unit 3 of this subject").
- **Rich Rendering:** Support for rendering LaTeX math equations, code snippets with syntax highlighting, and Mermaid diagrams.

### Backend Improvements
- **RAG Architecture:** Implement Retrieval-Augmented Generation using LangChain and a vector database (Pinecone/Weaviate) containing specific university materials, past papers, and textbooks, reducing hallucinations.
- **Cost Management:** Implement token tracking and rate limiting per user to manage LLM API costs.

## 2. GPA Predictor
### Frontend Improvements
- **"What-If" Scenarios:** Allow saving multiple predictive scenarios (e.g., "Safe Play" vs "Aggressive Target").
- **Visual Goal Tracking:** A speedometer-style gauge showing how close the current prediction is to the target.

### Backend Improvements
- **Historical Accuracy:** Machine learning model to analyze historical student data and predict likely grades based on past performance trends, rather than simple mathematical averages.

## 3. Document Scanner
### Frontend Improvements
- **Edge Detection:** Real-time visual overlay showing the detected document edges before capturing.
- **Multi-Page PDFs:** UI for capturing multiple images and compiling them into a single PDF document.

### Backend Improvements
- **Server-Side OCR:** Extract text from scanned documents and make it searchable or summarize it.
- **Auto-Cropping:** Server-side fallback for perspective correction if the frontend edge detection fails.

## 4. Usage Analytics
### Frontend Improvements
- **Digital Wellbeing Prompts:** Gentle nudges if the user spends too much time on non-academic sections (e.g., "You've been swiping on Team Finder for an hour, time to study?").
- **Customizable Dashboards:** Allow users to drag and drop widgets to build their own analytics view.

### Backend Improvements
- **Predictive Analytics:** Correlation engine identifying links between app usage patterns (e.g., library visits) and academic performance (CGPA).
- **Privacy-Preserving Aggregation:** Ensure analytics data is anonymized when used for macro-level insights.
