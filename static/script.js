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

  // Attach modal close button
  const modal = document.getElementById('studyPlanModal');
  const closeBtn = document.querySelector('.close');
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // If user clicks anywhere outside the modal, close it
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
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
  const spinner = document.getElementById('loadingSpinner');
  const downloadBtn = document.getElementById('downloadPdfBtn');
  const modal = document.getElementById('studyPlanModal');
  const planResultDiv = document.getElementById('studyPlanResult');

  // Reset/hide elements before making the request
  planResultDiv.innerHTML = '';        // Clear old results
  downloadBtn.style.display = 'none';  // Hide the PDF button
  modal.style.display = 'none';        // Ensure modal is hidden initially
  spinner.classList.remove('hidden');  // Show the spinner

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
  
    // Insert the generated plan into the planResultDiv
    planResultDiv.innerHTML = `Your Study Plan\n${data.plan}`;

    // Show the modal
    modal.style.display = 'block';

    // Show the PDF download button
    downloadBtn.style.display = 'block';
  })
  .catch(error => {
    spinner.classList.add('hidden');
    console.error('Error:', error);

    planResultDiv.innerHTML = `
      Error generating study plan. Please try again later.
    `;
    modal.style.display = 'block';
  });
}

// =================================
// PDF Download Handling using jsPDF
// =================================
function handleDownloadPdf() {
  const { jsPDF } = window.jspdf;
  // Create a new PDF doc with letter size
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  
  // Retrieve text from the studyPlanResult
  const planText = document.getElementById('studyPlanResult').innerText;

  // Wrap text at 500pt
  const lines = doc.splitTextToSize(planText, 500);

  doc.text(lines, 50, 50);
  doc.save('study-plan.pdf');
}