# Deployment Guide

This guide covers how to deploy the Nigerian Legal Policy Analyzer to a production environment.

## 1. Backend Deployment (Python Flask)

The backend can be deployed to any cloud provider supporting Python (AWS, GCP, Heroku, or a VPS).

### Steps:
1.  **Environment Setup**:
    Ensure Python 3.10+ is installed.
2.  **Install Production Server**:
    ```bash
    pip install uvicorn gunicorn
    ```
3.  **Run with Gunicorn**:
    ```bash
    gunicorn -w 4 app:app --bind 0.0.0.0:8000
    ```
4.  **Persistent Storage**:
    Ensure the `./nigeria_all_constitutions_db` directory is persisted across deployments to avoid re-indexing documents.

## 2. Frontend Deployment (React/Vite)

The frontend is a static SPA that can be served by the Express server or deployed to Vercel/Netlify.

### Steps:
1.  **Build the Project**:
    ```bash
    npm run build
    ```
2.  **Serve with Express**:
    The included `server.ts` is configured to serve the `dist` folder in production mode:
    ```bash
    NODE_ENV=production npm start
    ```

## 3. Local LLM vs. Cloud Fallback

### Ollama Setup (Production VPS):
If you want to use the local LLM in production:
1.  Install Ollama on the server.
2.  Pull the model: `ollama pull llama3.1:8b`.
3.  Ensure the Ollama service is accessible to the Python backend.

### Cloud-Only Mode:
If you don't want to manage a local LLM, the system will automatically use Groq for all requests if the Ollama connection fails. Ensure `GROQ_API_KEY` is set in your environment variables.

## 4. Environment Variables

Ensure the following are set in your production environment:
-   `GROQ_API_KEY`: Your Groq API key.
-   `NODE_ENV`: Set to `production`.
-   `PORT`: Defaults to 3000 for the Node.js server.

## 5. Reverse Proxy (Nginx)

It is recommended to use Nginx as a reverse proxy to handle SSL and route traffic:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
    }
}
```
