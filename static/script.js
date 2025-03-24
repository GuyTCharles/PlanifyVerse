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
  const durationValue = document.getElementById('durationValue').value;
  let durationUnit = document.getElementById('durationUnit').value;

  // Dynamically adjust the duration unit: if the user enters 1, remove the trailing "s"
  if (parseInt(durationValue) === 1 && durationUnit.toLowerCase().endsWith("s")) {
    durationUnit = durationUnit.slice(0, -1);
  }

  // Elements for feedback
  const spinner = document.getElementById('loadingSpinner');
  const downloadBtn = document.getElementById('downloadPdfBtn');
  const modal = document.getElementById('studyPlanModal');
  const planResultDiv = document.getElementById('studyPlanResult');

  // Reset/hide elements before making the request
  planResultDiv.innerHTML = '';
  downloadBtn.style.display = 'none';
  modal.style.display = 'none';
  spinner.classList.remove('hidden');

  // Make the fetch request including the duration values
  fetch('/generateStudyPlan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, time, goal, durationValue, durationUnit })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not OK');
    }
    return response.json();
  })
  .then(data => {
    // Hide spinner
    spinner.classList.add('hidden');

    // 1) Grab the plan text from server
    let plan = data.plan;

    // 2) Remove double asterisks
    plan = plan.replace(/\*\*/g, '');

    // 3) Insert a bullet for lines that begin with 'Week' or 'Day'
    plan = plan.replace(/^Week\s+(\d+)/gm, '• Week $1');
    plan = plan.replace(/^Day\s+(\d+)/gm, '    - Day $1:');  // Added a colon for clarity

    // 4) Display the cleaned text in the modal
    planResultDiv.innerText = plan;

    // Show modal & PDF button
    modal.style.display = 'block';
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