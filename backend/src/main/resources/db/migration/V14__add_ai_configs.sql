ALTER TABLE setting ADD COLUMN gemini_api_keys TEXT;
ALTER TABLE setting ADD COLUMN cerebras_api_key VARCHAR(255);
ALTER TABLE setting ADD COLUMN active_llm_provider VARCHAR(50);
