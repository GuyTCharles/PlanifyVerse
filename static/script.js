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

  // Modal elements
  const modal = document.getElementById('studyPlanModal');
  const closeBtn = document.querySelector('.modal .close');

  // Close modal when the close button is clicked
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Close modal when clicking outside the modal content
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
    planResultDiv.innerText = data.plan;  // Using innerText preserves line breaks from pre-wrap
  
    // Show the modal containing the study plan
    modal.style.display = 'block';
  
    // Show the PDF download button
    downloadBtn.style.display = 'block';
  })
  .catch(error => {
    spinner.classList.add('hidden');
    console.error('Error:', error);
    planResultDiv.innerHTML = `<p style="color: #ff4444; font-weight: bold;">
      Error generating study plan. Please try again later.
    </p>`;
    modal.style.display = 'block';
  });
}

// =================================
// PDF Download Handling using jsPDF
// =================================
function handleDownloadPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  
  // Retrieve text from the studyPlanResult
  const planText = document.getElementById('studyPlanResult').innerText;
  
  // Wrap the text so it fits within a 500pt width
  const lines = doc.splitTextToSize(planText, 500);
  
  // Add the text to the PDF starting at x=50, y=50
  doc.text(lines, 50, 50);
  
  // Save the PDF file
  doc.save('study-plan.pdf');
}