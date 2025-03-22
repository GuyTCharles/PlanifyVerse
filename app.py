from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/generateStudyPlan', methods=['POST'])
def generate_study_plan():
    data = request.get_json()
    subject = data.get('subject')
    time = data.get('time')
    goal = data.get('goal')

    # Here you would implement your AI logic or call a pre-trained model.
    # For now, we'll return a dummy study plan.
    plan = f"Study {subject} for {time} hours per day to achieve your goal: {goal}."

    return jsonify({'plan': plan})

if __name__ == '__main__':
    app.run(debug=True)