"""
Without an AI model (no key, no network, quota exhausted) the assistant must
still send someone in danger to SOS and point everyone else to the offline guides.
"""

import pytest

from app import assistant, llm
from app.schemas import Action, AssistantRequest


@pytest.fixture(autouse=True)
def no_model(monkeypatch):
    monkeypatch.setattr(llm, "generate_json", lambda *a, **k: None)


def ask(text, lang="en", state="AS"):
    return assistant.answer(AssistantRequest(messages=[{"role": "user", "content": text}], language=lang, state=state))


def test_person_in_danger_is_sent_to_sos_in_their_language():
    r = ask("मेरे पिता मलबे में दबे हैं, भूस्खलन हुआ है", lang="hi")
    assert r.emergency
    assert Action.OPEN_SOS in r.actions and Action.CALL_112 in r.actions
    assert "SOS" in r.reply and "112" in r.reply
    assert r.engine == "rules"


def test_how_to_question_gets_the_guide_not_an_alarm():
    r = ask("What should I do during a landslide?")
    assert not r.emergency
    assert Action.GUIDE_LANDSLIDE in r.actions


def test_shelter_question_opens_shelters():
    r = ask("ওচৰত আশ্ৰয় শিবিৰ ক'ত আছে?", lang="as")
    assert Action.SHOW_SHELTERS in r.actions


def test_unknown_question_gives_helplines_not_made_up_facts():
    r = ask("Is the NH10 open today?")
    assert "1070" in r.reply and "1077" in r.reply
    assert not r.emergency


def test_model_output_with_unknown_action_is_cleaned(monkeypatch):
    monkeypatch.setattr(llm, "generate_json", lambda *a, **k: {
        "reply": "Move to higher ground.", "emergency": False,
        "actions": ["GUIDE_FLOOD", "LAUNCH_ROCKETS"], "follow_ups": ["a", "b", "c", "d"], "_model": "test"})
    monkeypatch.setattr(llm, "provider", lambda: "gemini")
    r = ask("flood safety?")
    assert r.actions == [Action.GUIDE_FLOOD]
    assert len(r.follow_ups) == 3
    assert r.engine == "gemini"
