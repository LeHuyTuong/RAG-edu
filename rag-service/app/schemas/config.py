from fastapi import Header
from typing import Annotated, Optional

class AiConfig:
    def __init__(
        self,
        gemini_api_keys: Optional[str] = None,
        cerebras_api_key: Optional[str] = None,
        active_llm_provider: Optional[str] = None,
    ):
        self.gemini_api_keys = gemini_api_keys
        self.cerebras_api_key = cerebras_api_key
        self.active_llm_provider = active_llm_provider

def get_ai_config(
    x_ai_gemini_api_keys: Annotated[Optional[str], Header()] = None,
    x_ai_cerebras_api_key: Annotated[Optional[str], Header()] = None,
    x_ai_active_llm_provider: Annotated[Optional[str], Header()] = None,
) -> AiConfig:
    return AiConfig(
        gemini_api_keys=x_ai_gemini_api_keys,
        cerebras_api_key=x_ai_cerebras_api_key,
        active_llm_provider=x_ai_active_llm_provider,
    )
