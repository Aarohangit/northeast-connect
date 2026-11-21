"""
One place that talks to an AI model. Gemini is used when GEMINI_API_KEY is
set, Claude when only ANTHROPIC_API_KEY is set. Every call returns None on
any failure so callers can fall back to their rule-based path: in a disaster
the platform must keep answering even if the model is unreachable.
"""

import json
import logging
import os
import time

log = logging.getLogger("llm")

# Networks that inspect HTTPS (campus Wi-Fi, some antivirus) need the OS trust store.
try:
    import truststore

    truststore.inject_into_ssl()
except Exception:  # noqa: BLE001 - optional; only matters on such networks
    pass

# Flash-Lite first: on the free tier the larger Flash models are often overloaded (503/504),
# and a fast, reliable answer matters more here than the last bit of quality.
GEMINI_MODELS = [m.strip() for m in os.getenv(
    "GEMINI_MODELS", "gemini-3.5-flash-lite,gemini-3.8-flash,gemini-3.1-flash-lite").split(",") if m.strip()]
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-opus-5-5")
TIMEOUT_S = float(os.getenv("LLM_TIMEOUT_SECONDS", "15"))
COOLDOWN_S = 120

# model -> time until which it is skipped. Busy models cool down; missing ones stay out.
_skip_until: dict[str, float] = {}

_gemini = None
_claude = None


def provider() -> str | None:
    if os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
        return "gemini"
    if os.getenv("ANTHROPIC_API_KEY"):
        return "claude"
    return None


def model_name() -> str | None:
    p = provider()
    return GEMINI_MODELS[0] if p == "gemini" else CLAUDE_MODEL if p == "claude" else None


def _gemini_client():
    global _gemini
    if _gemini is None:
        from google import genai
        from google.genai import types

        _gemini = genai.Client(http_options=types.HttpOptions(timeout=int(TIMEOUT_S * 1000)))
    return _gemini


def _claude_client():
    global _claude
    if _claude is None:
        import anthropic

        _claude = anthropic.Anthropic(timeout=TIMEOUT_S, max_retries=1)
    return _claude


def generate_json(system: str, user: str | list[dict], schema: dict) -> dict | None:
    """
    Ask the model for a JSON object matching `schema`. `user` is either one message or a
    conversation: [{"role": "user" | "assistant", "content": "..."}]. None if no model or any error.
    """
    p = provider()
    if p == "gemini":
        return _gemini_json(system, user, schema)
    if p == "claude":
        return _claude_json(system, user, schema)
    return None


def _as_messages(user: str | list[dict]) -> list[dict]:
    return [{"role": "user", "content": user}] if isinstance(user, str) else user


def _gemini_json(system: str, user: str | list[dict], schema: dict) -> dict | None:
    from google.genai import errors, types

    contents = [
        types.Content(role="model" if m["role"] == "assistant" else "user", parts=[types.Part(text=m["content"])])
        for m in _as_messages(user)
    ]
    config = types.GenerateContentConfig(
        system_instruction=system,
        response_mime_type="application/json",
        response_json_schema=schema,
        temperature=0.2,
    )
    for model in GEMINI_MODELS:
        if _skip_until.get(model, 0) > time.time():
            continue
        try:
            r = _gemini_client().models.generate_content(model=model, contents=contents, config=config)
        except errors.ClientError as e:
            # 404: model not offered to this key, skip it for good. 429: quota, cool down.
            _skip_until[model] = float("inf") if e.code == 404 else time.time() + COOLDOWN_S
            log.warning("Gemini %s rejected the request (%s); trying next model", model, e.code)
            continue
        except errors.ServerError as e:
            _skip_until[model] = time.time() + COOLDOWN_S
            log.warning("Gemini %s busy (%s); trying next model", model, e.code)
            continue
        except Exception as e:  # noqa: BLE001 - timeouts, network
            _skip_until[model] = time.time() + COOLDOWN_S
            log.warning("Gemini %s unreachable (%s); trying next model", model, type(e).__name__)
            continue
        if not r.text:
            log.warning("Gemini %s returned no text (finish reason: %s)", model,
                        r.candidates[0].finish_reason if r.candidates else "none")
            continue
        try:
            data = json.loads(r.text)
            data["_model"] = model
            return data
        except json.JSONDecodeError:
            log.warning("Gemini %s returned invalid JSON", model)
            continue
    return None


def _claude_json(system: str, user: str | list[dict], schema: dict) -> dict | None:
    import anthropic

    try:
        r = _claude_client().beta.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=8000,
            system=system,
            messages=_as_messages(user),
            output_config={"effort": "medium", "format": {"type": "json_schema", "schema": schema}},
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
        )
    except anthropic.APIError as e:
        log.warning("Claude request failed: %s", type(e).__name__)
        return None
    if r.stop_reason in ("refusal", "max_tokens"):
        log.warning("Claude stopped with %s", r.stop_reason)
        return None
    text = next((b.text for b in r.content if b.type == "text"), None)
    try:
        data = json.loads(text) if text else None
    except json.JSONDecodeError:
        return None
    if data is not None:
        data["_model"] = CLAUDE_MODEL
    return data
