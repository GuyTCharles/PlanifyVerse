// ===========================
// Theme Toggling
// ===========================
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

function toggleTheme() {
  if (document.body.classList.contains('dark')) {
    setTheme('light');
    localStorage.setItem('theme', 'light');
  } else {
    setTheme('dark');
    localStorage.setItem('theme', 'dark');
  }
}

// =============================================
// DOMContentLoaded: Set theme and attach events
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme (default to light)
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);

  // Attach form submission handler
  document.getElementById('studyPlanForm').addEventListener('submit', handleFormSubmit);

  // Attach PDF download handler
  document.getElementById('downloadPdfBtn').addEventListener('click', handleDownloadPdf);
});

// ===========================
// Form Submission Handling
// ===========================
function handleFormSubmit(event) {
  event.preventDefault();

  // Retrieve form values
  const subject = document.getElementById('subject').value;
  const time = document.getElementById('time').value;
  const goal = document.getElementById('goal').value;

  // Elements for feedback
  const resultDiv = document.getElementById('studyPlanResult');
  const spinner = document.getElementById('loadingSpinner');
  const downloadBtn = document.getElementById('downloadPdfBtn');

  // Reset/hide elements before making the request
  resultDiv.style.display = 'none';      // Hide the study plan container
  resultDiv.innerHTML = '';             // Clear old results
  downloadBtn.style.display = 'none';   // Hide the PDF button
  spinner.classList.remove('hidden');   // Show the spinner

  // Make the fetch request
  fetch('/generateStudyPlan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, time, goal })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not OK');
    }
    return response.json();
  })
  .then(data => {
    // Hide the spinner once the request completes successfully
    spinner.classList.add('hidden');
  
    // Reveal the study plan container and display the plan
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
      <h2>Your Study Plan</h2>
      <p>${data.plan}</p>
    `;
  
    // Show the PDF download button
    downloadBtn.style.display = 'block';
  })
  .catch(error => {
    // Hide the spinner if there's an error
    spinner.classList.add('hidden');
  
    console.error('Error:', error);
  
    // Reveal the study plan container and show the error message
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
      <p style="color: #ff4444; font-weight: bold;">
        Error generating study plan. Please try again later.
      </p>
    `;
  });
}

// =================================
// PDF Download Handling using jsPDF
// =================================
function handleDownloadPdf() {
  // Ensure jsPDF is loaded (include it via a CDN in your HTML)
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Get the text content from the study plan result
  const planText = document.getElementById('studyPlanResult').innerText;

  // Add the text to the PDF document, starting at x=10, y=10
  doc.text(planText, 10, 10);

  // Save/download the PDF file
  doc.save('study-plan.pdf');
}