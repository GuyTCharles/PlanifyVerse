import os
import openai
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Retrieve your OpenAI API key from an environment variable
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not set. Please set your API key as an environment variable.")

openai.api_key = OPENAI_API_KEY

@app.route('/')
def index():
    return render_template('planify-verse.html')

@app.route('/generateStudyPlan', methods=['POST'])
def generate_study_plan():
    data = request.get_json()
    subject = data.get('subject')
    time = data.get('time')
    goal = data.get('goal')
    duration_value = data.get('durationValue')
    duration_unit = data.get('durationUnit')
    plan_type = data.get('planType', 'concise')  # default to concise if not provided

    # Set max_tokens based on plan type
    max_tokens = 500 if plan_type == 'concise' else 1000

    # Build the prompt
    prompt = (
        f"Write an introduction line: 'Study Plan for {subject} to improve {goal} over {duration_value} {duration_unit}, "
        f"studying {time} hours per day:'.\n\n"
        "Use bullet points for each week (e.g., '• Week 1'), and for each day under that week, use an indented sub-bullet (e.g., '    - Day 1-2: ...').\n"
        "Leave a blank line between each week and ensure each week has detailed tasks.\n\n"
        "For a concise plan (500 tokens), provide a high-level summary with key bullet points. "
        "For a detailed plan (1000 tokens), include additional explanations, in-depth daily tasks, and more comprehensive suggestions.\n\n"
        "Align and indent all text so it’s easy to read. Do not use double asterisks or Markdown formatting.\n\n"
        "At the end, provide additional suggestions or tips to help improve study efficiency."
    )

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates structured, concise study plans."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=max_tokens
        )
        generated_plan = response.choices[0].message.content.strip()
    except Exception as e:
        generated_plan = f"Error generating study plan: {str(e)}"

    return jsonify({'plan': generated_plan})

if __name__ == '__main__':
    app.run(debug=True)