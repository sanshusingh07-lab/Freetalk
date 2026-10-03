from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import ModerationRequest, ModerationResponse
from app.services.moderator import evaluate_content

app = FastAPI(
    title="FreeTalk AI NLP Moderation Service",
    description="Offline NLP toxicity, harassment, and spam moderation service for FreeTalk",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "FreeTalk Moderation Engine"}

@app.post("/api/v1/moderate", response_model=ModerationResponse)
def moderate_content(payload: ModerationRequest):
    try:
        result = evaluate_content(
            content=payload.content,
            title=payload.title,
            target_type=payload.target_type
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
