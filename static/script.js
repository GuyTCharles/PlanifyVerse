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
    spinner.classList.add('hidden');

    // Grab the plan text from the server
    let plan = data.plan;
    console.log("Plan from server:", plan); // Check in console for real \n

    // Remove any double asterisks
    plan = plan.replace(/\*\*/g, '');

    // Insert a bullet for lines that begin with "Week" or "Day"
    plan = plan.replace(/^Week\s+(\d+)/gm, '• Week $1');
    plan = plan.replace(/^Day\s+(\d+)/gm, '    - Day $1:');

    // Use textContent to preserve all line breaks and spacing
    planResultDiv.textContent = plan;

    // Show the modal and the PDF download button
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

  // 1) Get the text from your modal (with line breaks)
  const planText = document.getElementById('studyPlanResult').textContent;
  const lines = planText.split('\n');

  // 2) Define fonts and margins
  doc.setFont('Courier', 'normal');  // Monospaced font helps preserve indentation
  doc.setFontSize(12);

  const marginLeft = 30;   
  const marginRight = 30;  
  const marginTop = 30;    
  const lineHeight = 20;   

  // Calculate usable width: (page width) - left margin - right margin
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - marginLeft - marginRight;

  let yPos = marginTop;

  lines.forEach(originalLine => {
    // 3) Detect leading spaces in the line
    // e.g., "    - Day 1-2: ..." => leadingSpaces = "    "
    const match = originalLine.match(/^(\s*)/);
    const leadingSpaces = match ? match[1] : "";
    
    // The actual text to wrap (excluding leading spaces)
    const textWithoutSpaces = originalLine.slice(leadingSpaces.length);

    // 4) Use splitTextToSize for the text after the indentation
    const wrappedLines = doc.splitTextToSize(textWithoutSpaces, usableWidth);

    // 5) Print each wrapped segment, reapplying the leading spaces
    wrappedLines.forEach((wrappedLine, index) => {
      // For the first wrapped segment, use the original leading spaces
      // For subsequent segments, reapply the same number of spaces
      const lineToPrint = (index === 0) 
        ? leadingSpaces + wrappedLine 
        : " ".repeat(leadingSpaces.length) + wrappedLine;

      doc.text(lineToPrint, marginLeft, yPos);
      yPos += lineHeight;
    });
  });

  doc.save('study-plan.pdf');
}