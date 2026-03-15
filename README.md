# Nigerian Legal Policy Analyzer

A robust full-stack application designed to analyze policies against Nigerian constitutional principles and national interest using expert LLM analysis. It helps users prepare petitions by providing legal insights based on Nigerian constitutional law.

## Features

-   **Expert Legal Analysis**: Utilizes advanced LLMs to provide structured legal arguments focused on Nigerian constitutional principles.
-   **Local LLM Support**: Integrates with Ollama (Llama 3.1) for local, private legal analysis.
-   **Intelligent Fallback**: Automatically falls back to Groq (Llama 3 70B) if the local LLM is slow or unavailable, ensuring high availability.
-   **Petition-Ready Output**: Generates structured legal analysis focused on "Fundamental Objectives and Directive Principles of State Policy."
-   **Modern UI**: Built with React, Tailwind CSS, and Framer Motion for a premium, professional experience.

## Tech Stack

-   **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Lucide Icons.
-   **Backend**: Python 3.10+, Flask, LangChain.
-   **LLMs**: Ollama (Local) & Groq (Cloud Fallback).

## Getting Started

### Prerequisites

-   Node.js 18+
-   Python 3.10+
-   Ollama (optional, for local LLM support)

### Installation

1.  **Clone the repository**
2.  **Install Frontend Dependencies**:
    ```bash
    npm install
    ```
3.  **Install Backend Dependencies**:
    ```bash
    pip install flask flask-cors langchain langchain-community langchain-ollama requests
    ```
4.  **Set Environment Variables**:
    Create a `.env` file with:
    ```env
    GROQ_API_KEY=your_groq_api_key
    ```

### Running the App

1.  **Start the Python Backend**:
    ```bash
    python app.py
    ```
2.  **Start the Frontend Dev Server**:
    ```bash
    npm run dev
    ```

## Usage

1.  Enter a policy description or a legal question in the input field.
2.  Click "Analyze & Prepare Petition".
3.  Review the legal analysis and national interest recommendations.
4.  Use the generated text to draft formal petitions.
