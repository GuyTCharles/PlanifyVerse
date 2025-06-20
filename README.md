# PlanifyVerse

PlanifyVerse is an AI-powered study plan generator that helps you quickly create personalized study schedules. By simply entering your subject, available study hours, desired plan duration, and learning goals, you’ll receive a structured study plan. The application features a modern, responsive interface with light/dark mode toggling, modal display for generated plans, and PDF export functionality.

## Features
###     AI-Generated Study Plans:
    Leverages OpenAI’s GPT-3.5 Turbo to generate structured and concise study plans.

###	    Customizable Duration:
    Users can specify plan duration in days, weeks, months, or years.

###     User-Friendly Interface:
	•	Clean and modern design with light and dark themes.
	•	Modal display for study plans for a focused view.
	•	Downloadable PDF version of the generated study plan.

###     Responsive Design:
    Optimized for both desktop and mobile devices.

## Technologies
	•	Backend: Python, Flask
	•	Frontend: HTML, CSS, JavaScript, jsPDF (for PDF generation)
	•	AI Integration: OpenAI GPT-3.5 Turbo
	•	Deployment: Heroku and Render

## Installation
###     Prerequisites
	•	Python 3.8+
	•	Git

## Usage
###	1.	Enter Your Information:
	Provide subject, available study hours, plan duration, and learning goal.
###	2.	Generate the Plan:
    Click “Generate Study Plan” to receive your AI-generated study plan displayed in a modal.
###	3.	Download as PDF:
    Use the “Download PDF” button to export your study plan to a well-formatted PDF.
###	4.	Toggle Themes:
   	Switch between light and dark mode using the theme toggle in the header.

## Deployment
###     Deploy on Heroku
####	Ensure Your Project is Prepared:
	Verify that your Procfile (with web: gunicorn app:app --bind 0.0.0.0:$PORT), 
    and requirements.txt are in the project root.

## Acknowledgments
	•	OpenAI for the GPT-3.5 Turbo model.
	•	jsPDF for PDF generation.
	•	Heroku and Render for deployment.
 ### License
This repository is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0) License.
You may share the contents with proper credit for non-commercial use only, and no modifications are allowed.
See the [LICENSE](LICENSE)  file for more details.
