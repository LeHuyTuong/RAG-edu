"""API layer cho classify: POST /rag/classify."""
from fastapi import APIRouter, HTTPException, Depends

from app.schemas.classify import RagClassifyRequest, RagClassifyResponse
from app.schemas.config import AiConfig, get_ai_config

router = APIRouter()


@router.post("/classify", response_model=RagClassifyResponse)
def classify_document(req: RagClassifyRequest, ai_config: AiConfig = Depends(get_ai_config)):
    from app.services.classify_service import classify
    try:
        return classify(req, ai_config)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classify failed: {str(e)}")
