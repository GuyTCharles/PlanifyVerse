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
    modal.classList.remove('show');
  });

  // Close modal when clicking outside the modal content
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.classList.remove('show');
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
  const planType = document.getElementById('planType').value; // New plan type field

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
  modal.classList.remove('show');
  spinner.classList.remove('hidden');

  // Make the fetch request including the new planType value
  fetch('/generateStudyPlan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, time, goal, durationValue, durationUnit, planType })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not OK');
    }
    return response.json();
  })
  .then(data => {
    spinner.classList.add('hidden');

    // Process the received plan text
    let plan = data.plan;
    console.log("Plan from server:", plan); // Check for real line breaks

    // Remove any double asterisks
    plan = plan.replace(/\*\*/g, '');
    // Insert a bullet for lines that begin with "Week" or "Day"
    plan = plan.replace(/^Week\s+(\d+)/gm, '• Week $1');
    plan = plan.replace(/^Day\s+(\d+)/gm, '    - Day $1:');

    // Preserve line breaks and spacing
    planResultDiv.textContent = plan;

    // Show the modal and PDF download button
    modal.classList.add('show');
    downloadBtn.style.display = 'block';
  })
  .catch(error => {
    spinner.classList.add('hidden');
    console.error('Error:', error);
    planResultDiv.innerHTML = `<p style="color: #ff4444; font-weight: bold;">
      Error generating study plan. Please try again later.
    </p>`;
    modal.classList.add('show');
  });
}

// =================================
// PDF Download Handling using jsPDF
// =================================
function handleDownloadPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  // Retrieve text from the modal, preserving line breaks
  const planText = document.getElementById('studyPlanResult').textContent;
  const lines = planText.split('\n');

  // Set up fonts and margins
  doc.setFont('Courier', 'normal');  // Monospaced font for consistent indentation
  doc.setFontSize(12);

  const marginLeft = 30;
  const marginRight = 30;
  const marginTop = 30;
  const lineHeight = 20;

  // Calculate usable width and page height
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - marginLeft - marginRight;

  let yPos = marginTop;

  lines.forEach(originalLine => {
    // Detect leading spaces for indentation
    const match = originalLine.match(/^(\s*)/);
    const leadingSpaces = match ? match[1] : "";
    const textWithoutSpaces = originalLine.slice(leadingSpaces.length);

    // Wrap text for the remainder of the line
    const wrappedLines = doc.splitTextToSize(textWithoutSpaces, usableWidth);

    wrappedLines.forEach((wrappedLine, index) => {
      const lineToPrint = (index === 0) 
        ? leadingSpaces + wrappedLine 
        : " ".repeat(leadingSpaces.length) + wrappedLine;
      
      // If the new line exceeds the page height, add a new page and reset yPos
      if (yPos + lineHeight > pageHeight - marginTop) {
        doc.addPage();
        yPos = marginTop;
      }
      
      doc.text(lineToPrint, marginLeft, yPos);
      yPos += lineHeight;
    });
  });

  doc.save('study-plan.pdf');
}