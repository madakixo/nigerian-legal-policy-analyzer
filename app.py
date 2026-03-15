import os
import logging
import requests
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# LangChain Imports
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -------------------------------
# Configuration
# -------------------------------
LOCAL_LLM = "llama3.1:8b"
MODELS_DIR = "./local_models"
LLM_MODEL_PATH = os.path.join(MODELS_DIR, "llm")
EMBEDDINGS_CACHE_DIR = os.path.join(MODELS_DIR, "embeddings")

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return jsonify({"status": "online", "message": "Nigerian Legal API (Direct Call) is running"})

@app.route("/health")
def health():
    return jsonify({"status": "healthy"})

# -------------------------------
# Logic
# -------------------------------

PETITION_TEMPLATE = """
TO: THE NATIONAL ASSEMBLY / RELEVANT AUTHORITY
FROM: [PETITIONER NAMES]
DATE: [DATE]

SUBJECT: PETITION AGAINST [POLICY/BILL NAME] ON GROUNDS OF CONSTITUTIONAL NON-ALIGNMENT

1. PREAMBLE:
Briefly state the purpose of this petition.

2. CONSTITUTIONAL BASIS:
Cite specific sections (e.g., Section 14(2)(b) - Welfare of the people).

3. LEGAL ANALYSIS:
[DETAILED ANALYSIS]

4. PRAYERS:
What the petitioners want the authority to do.

5. SIGNATORIES:
[LIST OF NAMES & NIN/PVC]
"""

@app.route("/query", methods=["POST"])
@app.route("/api/query", methods=["POST"])
def query_direct():
    data = request.json
    if not data or "question" not in data:
        return jsonify({"detail": "Invalid or missing question parameter"}), 400
    
    question = data["question"]
    logger.info(f"Received legal query: {question[:50]}...")
    
    try:
        # Direct LLM Phase (No RAG context)
        try:
            llm = ChatOllama(model=LOCAL_LLM, temperature=0.1, timeout=17)
            
            prompt = ChatPromptTemplate.from_template("""
            You are a Senior Constitutional Lawyer in Nigeria. 
            Analyze the query using your expert knowledge of Nigerian constitutional law.
            Structure your response as a FORMAL LEGAL ARGUMENT for a petition.
            
            TEMPLATE STRUCTURE:
            - Legal Grounds: Specific constitutional sections violated.
            - Impact Analysis: How this affects the National Interest.
            - Recommendations: Specific prayers for the petition.
            
            Query: {query}
            
            Response:
            """)
            
            chain = prompt | llm
            response = chain.invoke({"query": question})
            
            return jsonify({
                "answer": response.content,
                "relevant_constitutions": [],
                "fallback_required": False,
                "source": "local_llm"
            })
            
        except Exception as llm_error:
            logger.warning(f"Local LLM failed, triggering fallback: {llm_error}")
            return jsonify({
                "answer": None,
                "context": "Direct API call mode - No RAG context provided.",
                "relevant_constitutions": [],
                "fallback_required": True,
                "source": "groq_fallback_pending"
            })

    except Exception as e:
        logger.error(f"Critical API Error: {e}")
        return jsonify({"detail": "Internal Legal Analysis Engine Error"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
