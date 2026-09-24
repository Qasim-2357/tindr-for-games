import os
from typing import TypeVar

from google import genai
from google.genai import errors, types
from pydantic import BaseModel, ValidationError


class GeminiProviderError(RuntimeError):
    pass


StructuredResponse = TypeVar("StructuredResponse", bound=BaseModel)


class GeminiProvider:
    _model = "gemini-3.6-flash"

    def __init__(self) -> None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise GeminiProviderError("GEMINI_API_KEY is not configured")
        self._client = genai.Client(api_key=api_key)

    def generate_text(self, prompt: str) -> str:
        response = self._client.models.generate_content(
            model=self._model,
            contents=prompt,
        )
        if not response.text:
            raise GeminiProviderError("Gemini returned no generated text")
        return response.text

    def generate_structured(
        self,
        prompt: str,
        response_schema: type[StructuredResponse],
    ) -> StructuredResponse:
        try:
            response = self._client.models.generate_content(
                model=self._model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema,
                ),
            )
        except errors.APIError as error:
            raise GeminiProviderError("Gemini structured generation failed") from error

        parsed = response.parsed
        if parsed is None:
            raise GeminiProviderError("Gemini returned no structured response")
        if isinstance(parsed, response_schema):
            return parsed
        try:
            return response_schema.model_validate(parsed)
        except ValidationError as error:
            raise GeminiProviderError("Gemini returned an invalid structured response") from error
