// Apply the specified theme: "light" removes the dark class (default light mode), "dark" adds it.
function setTheme(theme) {
  const toggleText = document.getElementById('toggleText');
  if (theme === 'light') {
    document.body.classList.remove('dark');
    toggleText.textContent = 'Dark Mode';
  } else {
    document.body.classList.add('dark');
    toggleText.textContent = 'Light Mode';
  }
}

// Toggle between light and dark themes and save the choice in localStorage.
function toggleTheme() {
  if (document.body.classList.contains('dark')) {
    setTheme('light');
    localStorage.setItem('theme', 'light');
  } else {
    setTheme('dark');
    localStorage.setItem('theme', 'dark');
  }
}

// On page load, apply the saved theme (defaulting to light mode if none is saved).
document.addEventListener("DOMContentLoaded", function() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
});

// Handle study plan form submission
document.getElementById('studyPlanForm').addEventListener('submit', function(event) {
  event.preventDefault();

  // Get input values
  const subject = document.getElementById('subject').value;
  const time = document.getElementById('time').value;
  const goal = document.getElementById('goal').value;

  // Show a loading message
  const resultDiv = document.getElementById('studyPlanResult');
  resultDiv.innerHTML = '<p>Generating your study plan...</p>';

  // Make a POST request to the backend API (replace URL with your actual endpoint)
  fetch('https://your-backend-api.com/generateStudyPlan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ subject, time, goal })
  })
  .then(response => response.json())
  .then(data => {
    // Display the study plan
    resultDiv.innerHTML = `<h2>Your Study Plan</h2><p>${data.plan}</p>`;
  })
  .catch(error => {
    console.error('Error:', error);
    resultDiv.innerHTML = '<p>Error generating study plan. Please try again later.</p>';
  });
});