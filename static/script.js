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
  const { jsPDF } = window.jspdf;
  // Create a new PDF document with letter size and points as units
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  
  // Retrieve the full text from the study plan container.
  // Ensure your study plan HTML preserves line breaks (use white-space: pre-wrap in CSS).
  const planText = document.getElementById('studyPlanResult').innerText;
  
  // Use splitTextToSize to wrap the text to a max width of 500pt
  const lines = doc.splitTextToSize(planText, 500);
  
  // Add the text to the PDF starting at position (50, 50)
  doc.text(lines, 50, 50);
  
  // Save the PDF file
  doc.save('study-plan.pdf');
}