from pydantic import BaseModel, Field

from app.providers.gemini import GeminiProvider, GeminiProviderError


class AIPreferences(BaseModel):
    required_genres: list[str] = Field(default_factory=list)
    genre_alternatives: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    platforms: list[str] = Field(default_factory=list)


class AIPreferenceExtractionError(RuntimeError):
    pass


class AIPreferenceService:
    def __init__(self, provider: GeminiProvider | None = None) -> None:
        self._provider = provider or GeminiProvider()

    def extract(self, query: str) -> AIPreferences:
        if not query.strip():
            raise AIPreferenceExtractionError("A game preference query is required")

        prompt = f"""
Extract searchable game preferences from the user's request below.

Return only the structured fields in the provided schema:
- required_genres: distinct requested genres, where every item is required
- genre_alternatives: synonymous or alternative descriptions of the same genre
- keywords: concise descriptive concepts that can be matched against game names or descriptions
- platforms: normalized platform names mentioned by the user

Use empty lists when the user does not specify a category. For example,
"indie puzzle game" means required_genres ["indie", "puzzle"], while
"psychological horror" may use genre_alternatives ["psychological horror", "horror"].
Do not put the same genre in both genre fields. Put descriptive concepts such as
"dark" or "story" in keywords. Do not invent game names, recommendations,
database facts, or fields outside this schema.

User request:
{query.strip()}
""".strip()

        try:
            return self._provider.generate_structured(prompt, AIPreferences)
        except GeminiProviderError as error:
            raise AIPreferenceExtractionError(
                "Could not extract game preferences"
            ) from error


def extract_ai_preferences(query: str) -> AIPreferences:
    return AIPreferenceService().extract(query)
