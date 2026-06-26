"""API layer cho classify: POST /rag/classify."""
from fastapi import APIRouter, HTTPException

from app.schemas.classify import RagClassifyRequest, RagClassifyResponse

router = APIRouter()


@router.post("/classify", response_model=RagClassifyResponse)
async def classify_document(req: RagClassifyRequest):
    from app.services.classify_service import classify
    try:
        return classify(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classify failed: {str(e)}")
