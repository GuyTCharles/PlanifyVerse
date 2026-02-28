# PlanifyVerse

PlanifyVerse is a Flask web app that generates personalized study plans with OpenAI. It includes a modern responsive UI, light/dark theming, plan customization controls, and one-click export to PDF.

## What Changed

- Modernized responsive layout with semantic structure and improved accessibility.
- Professional visual system with design tokens, purposeful motion, and adaptive theming.
- Improved form UX with validation, live workload summary, and local preference persistence.
- Inline results experience with copy-to-clipboard and PDF download.
- Backend upgraded from legacy `openai.ChatCompletion` to the modern `OpenAI` client and Responses API (with fallback support).

## Tech Stack

- Backend: Flask
- Frontend: HTML, CSS, vanilla JavaScript
- AI: OpenAI API
- PDF: jsPDF

## Project Structure

- `app.py`: Flask server and AI generation endpoint
- `templates/index.html`: main page template
- `static/style.css`: UI styling
- `static/script.js`: client-side behavior
- `static/images/`: logo assets

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export OPENAI_API_KEY="your_api_key"
export OPENAI_MODEL="gpt-4.1-mini"  # optional
export OPENAI_LEGACY_MODEL="gpt-3.5-turbo"  # optional fallback for openai<1.0
```

3. Run the app:
```bash
python app.py
```

4. Open:
`http://127.0.0.1:5000`

## API Endpoints

- `GET /`: app UI
- `GET /healthz`: service status
- `POST /generateStudyPlan`: generate a study plan
- `POST /api/study-plan`: alias of the generation endpoint

## Deploy

`Procfile` is included for process-based deployment platforms (for example Heroku/Render):

`web: gunicorn app:app --bind 0.0.0.0:$PORT`

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)** license.

- License summary: [https://creativecommons.org/licenses/by-nc-nd/4.0/](https://creativecommons.org/licenses/by-nc-nd/4.0/)
- Full legal text: [https://creativecommons.org/licenses/by-nc-nd/4.0/legalcode](https://creativecommons.org/licenses/by-nc-nd/4.0/legalcode)

See the [LICENSE](LICENSE) file for details.

