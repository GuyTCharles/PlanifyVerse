import os
import openai
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# TODO: The 'openai.api_base' option isn't read in the client API. You will need to pass it when you instantiate the client, e.g. 'OpenAI(base_url="https://api.deepseek.com")'
# openai.api_base = "https://api.deepseek.com"

@app.route('/')
def index():
    return render_template('planify-verse.html')

@app.route('/generateStudyPlan', methods=['POST'])
def generate_study_plan():
    data = request.get_json()
    subject = data.get('subject')
    time = data.get('time')
    goal = data.get('goal')

    prompt = (
        f"Generate a detailed study plan for '{subject}' with {time} hours/day to improve {goal}."
    )

    try:
        # New 1.x style call might differ; this is just a placeholder
        response = openai.Chat.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ]
        )
        generated_plan = response.choices[0].message.content.strip()
    except Exception as e:
        generated_plan = f"Error generating study plan: {str(e)}"

    return jsonify({'plan': generated_plan})

if __name__ == '__main__':
    app.run(debug=True)