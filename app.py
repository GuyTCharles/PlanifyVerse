from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

@app.route('/')
def index():
    # Render the HTML file from the templates folder
    return render_template('planify-verse.html')

@app.route('/generateStudyPlan', methods=['POST'])
def generate_study_plan():
    data = request.get_json()
    subject = data.get('subject')
    time = data.get('time')
    goal = data.get('goal')

    # Dummy study plan response
    plan = f"Study {subject} for {time} hours per day to achieve your goal: {goal}."
    return jsonify({'plan': plan})

if __name__ == '__main__':
    app.run(debug=True)