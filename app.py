import os
from typing import Any

from flask import Flask, jsonify, render_template, request

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None
    import openai as legacy_openai
else:
    legacy_openai = None

app = Flask(__name__, template_folder="templates", static_folder="static")

DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
VALID_DURATION_UNITS = {"days", "weeks", "months", "years"}
VALID_PLAN_TYPES = {"concise", "detailed"}
VALID_PACES = {"steady", "accelerated"}


def _to_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "yes", "on"}
    return bool(value)


def validate_payload(data: Any) -> tuple[dict[str, Any] | None, str | None]:
    if not isinstance(data, dict):
        return None, "Request body must be a JSON object."

    subject = str(data.get("subject", "")).strip()
    if len(subject) < 2:
        return None, "Subject must be at least 2 characters."
    if len(subject) > 80:
        return None, "Subject must be 80 characters or fewer."

    try:
        hours_per_day = float(data.get("time", ""))
    except (TypeError, ValueError):
        return None, "Available study hours must be a number."
    if hours_per_day < 0.5 or hours_per_day > 16:
        return None, "Available study hours must be between 0.5 and 16."

    try:
        duration_value = int(data.get("durationValue", ""))
    except (TypeError, ValueError):
        return None, "Plan duration must be a whole number."
    if duration_value < 1 or duration_value > 365:
        return None, "Plan duration must be between 1 and 365."

    duration_unit = str(data.get("durationUnit", "")).strip().lower()
    if duration_unit not in VALID_DURATION_UNITS:
        return None, "Duration unit must be days, weeks, months, or years."

    goal = str(data.get("goal", "")).strip()
    if len(goal) > 240:
        return None, "Learning goal must be 240 characters or fewer."

    plan_type = str(data.get("planType", "concise")).strip().lower()
    if plan_type not in VALID_PLAN_TYPES:
        return None, "Plan type must be concise or detailed."

    pace = str(data.get("pace", "steady")).strip().lower()
    if pace not in VALID_PACES:
        return None, "Pace must be steady or accelerated."

    cleaned_data = {
        "subject": subject,
        "time": hours_per_day,
        "goal": goal or "build practical confidence",
        "durationValue": duration_value,
        "durationUnit": duration_unit,
        "planType": plan_type,
        "pace": pace,
        "includeRevision": _to_bool(data.get("includeRevision", True)),
        "weekendSessions": _to_bool(data.get("weekendSessions", False)),
    }
    return cleaned_data, None


def build_prompt(payload: dict[str, Any]) -> tuple[str, str]:
    duration_unit = payload["durationUnit"]
    duration_value = payload["durationValue"]
    if duration_value == 1 and duration_unit.endswith("s"):
        duration_unit = duration_unit[:-1]

    detail_instruction = (
        "Keep it compact and focused on the highest-value activities."
        if payload["planType"] == "concise"
        else "Include richer detail, sequencing guidance, and checkpoints for each stage."
    )
    pace_instruction = (
        "Use a realistic steady cadence with consistent daily momentum."
        if payload["pace"] == "steady"
        else "Use an accelerated cadence while still protecting sustainability."
    )
    revision_instruction = (
        "Include dedicated review checkpoints and cumulative recall practice."
        if payload["includeRevision"]
        else "Skip dedicated revision blocks and keep the plan forward-moving."
    )
    weekend_instruction = (
        "Weekend sessions are allowed and can include deep practice."
        if payload["weekendSessions"]
        else "Treat weekends as light review or rest unless absolutely needed."
    )

    system_prompt = (
        "You are PlanifyVerse, an expert learning strategist. "
        "Produce practical, motivating study plans that are realistic, progressive, and measurable."
    )

    user_prompt = (
        "Create a structured study plan with this profile:\n"
        f"- Subject: {payload['subject']}\n"
        f"- Goal: {payload['goal']}\n"
        f"- Time available: {payload['time']} hours/day\n"
        f"- Duration: {duration_value} {duration_unit}\n"
        f"- Plan depth: {payload['planType']}\n"
        f"- Pace: {payload['pace']}\n\n"
        "Requirements:\n"
        f"- {detail_instruction}\n"
        f"- {pace_instruction}\n"
        f"- {revision_instruction}\n"
        f"- {weekend_instruction}\n"
        "- Start with a one-line objective summary.\n"
        "- Organize the plan by week (or day if duration is less than 2 weeks).\n"
        "- Under each week/day, include concise daily tasks.\n"
        "- Include milestone checkpoints and progress criteria.\n"
        "- End with 5 short execution tips.\n"
        "- Use plain text only (no markdown tables, no asterisks).\n"
        "- Keep the total response under 800 words."
    )
    return system_prompt, user_prompt


def extract_response_text(response: Any) -> str:
    output_text = getattr(response, "output_text", "")
    if output_text:
        return output_text.strip()

    chunks: list[str] = []
    for item in getattr(response, "output", []) or []:
        for content in getattr(item, "content", []) or []:
            text_value = getattr(content, "text", None)
            if text_value:
                chunks.append(text_value)
    return "\n".join(chunks).strip()


def build_mock_plan(payload: dict[str, Any]) -> str:
    duration_value = payload["durationValue"]
    duration_unit = payload["durationUnit"]
    if duration_value == 1 and duration_unit.endswith("s"):
        duration_unit = duration_unit[:-1]

    return (
        f"Objective: Build measurable progress in {payload['subject']} for {duration_value} {duration_unit}.\n\n"
        f"Week 1\n"
        f"- Day 1-2: Review core concepts and define your {payload['goal']} baseline.\n"
        f"- Day 3-4: Focused drills for 60-90 minutes, then short recap notes.\n"
        f"- Day 5-6: Practice set with timed conditions and error review.\n"
        f"- Day 7: Light consolidation and planning for next week.\n\n"
        f"Week 2\n"
        f"- Day 1-2: Increase complexity using mixed-topic practice.\n"
        f"- Day 3-4: Deep work block on weakest area from Week 1.\n"
        f"- Day 5-6: Milestone assessment and score tracking.\n"
        f"- Day 7: Reflection + adjustments for workload sustainability.\n\n"
        "Execution tips\n"
        "1) Study at a fixed time each day.\n"
        "2) Track one concrete metric per session.\n"
        "3) Keep notes short and actionable.\n"
        "4) Review mistakes before new content.\n"
        "5) End each day with a 5-minute recap."
    )


def generate_plan(payload: dict[str, Any]) -> str:
    if _to_bool(os.getenv("PLANIFYVERSE_TEST_MODE", False)):
        return build_mock_plan(payload)

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is missing on the server.")

    system_prompt, user_prompt = build_prompt(payload)
    if OpenAI is not None:
        client = OpenAI(api_key=api_key)
        try:
            response = client.responses.create(
                model=DEFAULT_MODEL,
                temperature=0.6,
                max_output_tokens=1200,
                input=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            text = extract_response_text(response)
            if text:
                return text
            raise RuntimeError("The model returned an empty response.")
        except Exception as responses_error:
            app.logger.warning("Responses API failed; falling back to chat completions: %s", responses_error)
            completion = client.chat.completions.create(
                model=DEFAULT_MODEL,
                temperature=0.6,
                max_tokens=1200,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            content = completion.choices[0].message.content or ""
            if not content.strip():
                raise RuntimeError("The model returned an empty response.")
            return content.strip()

    if legacy_openai is None:
        raise RuntimeError("OpenAI SDK is unavailable.")

    legacy_openai.api_key = api_key
    legacy_model = os.getenv("OPENAI_LEGACY_MODEL", DEFAULT_MODEL)
    completion = legacy_openai.ChatCompletion.create(
        model=legacy_model,
        temperature=0.6,
        max_tokens=1200,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    content = completion["choices"][0]["message"]["content"]
    if not content.strip():
        raise RuntimeError("The model returned an empty response.")
    return content.strip()


@app.get("/")
def index() -> str:
    return render_template("index.html")


@app.get("/healthz")
def healthz():
    sdk_mode = "modern" if OpenAI is not None else "legacy"
    test_mode = _to_bool(os.getenv("PLANIFYVERSE_TEST_MODE", False))
    return jsonify({"status": "ok", "model": DEFAULT_MODEL, "sdkMode": sdk_mode, "testMode": test_mode})


@app.post("/generateStudyPlan")
@app.post("/api/study-plan")
def generate_study_plan():
    payload, error_message = validate_payload(request.get_json(silent=True) or {})
    if error_message:
        return jsonify({"error": error_message}), 400

    try:
        plan_text = generate_plan(payload)
    except RuntimeError as error:
        return jsonify({"error": str(error)}), 500
    except Exception as error:
        app.logger.exception("Unhandled study plan generation failure.")
        base_message = (
            "Unable to generate a study plan right now. "
            "Check your API key, billing/quota, model access, and internet connection."
        )
        if app.debug:
            debug_hint = f"{type(error).__name__}: {error}"
            return jsonify({"error": f"{base_message} ({debug_hint})"}), 502
        return jsonify({"error": base_message}), 502

    return jsonify(
        {
            "plan": plan_text,
            "meta": {
                "model": DEFAULT_MODEL,
                "planType": payload["planType"],
                "pace": payload["pace"],
            },
        }
    )


if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "false").strip().lower() == "true"
    app.run(debug=debug_mode)
