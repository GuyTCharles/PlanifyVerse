import os
import openai
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Retrieve your OpenAI API key from an environment variable
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not set. Please set your API key as an environment variable.")

# Configure the OpenAI client (default api_base is https://api.openai.com)
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

    # Updated prompt: explicitly instruct to leave an extra blank line between each week
    prompt = (
        f"Write an introduction line: 'Study Plan for {subject} to improve {goal}:'. "
        f"Then generate a concise study plan for the subject '{subject}', where the student studies for {time} hours per day. "
        f"Use bullet points for each week (e.g., '• Week 1') and indent sub-bullets for daily tasks (e.g., '    - Day 1-2: ...'). "
        "Please leave an extra blank line between each week's section to clearly separate the weeks. "
        "Keep the entire response concise and under 500 tokens, and add a concise summary and the end of the response. "
    )

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that generates structured, concise study plans."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=500
        )
        generated_plan = response.choices[0].message.content.strip()
    except Exception as e:
        generated_plan = f"Error generating study plan: {str(e)}"

    return jsonify({'plan': generated_plan})

if __name__ == '__main__':
    app.run(debug=True)