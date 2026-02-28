const STORAGE_KEYS = {
  theme: "planifyverse.theme",
  form: "planifyverse.form",
};

const DAY_MULTIPLIERS = {
  days: 1,
  weeks: 7,
  months: 30,
  years: 365,
};

const WAKE_HINT_MS = 2500;
const LONG_WAIT_HINT_MS = 12000;

const dom = {};
let generatedPlanText = "";
let wakeHintTimer = null;
let longWaitHintTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  cacheDomElements();
  if (!dom.form) {
    return;
  }

  dom.currentYear.textContent = String(new Date().getFullYear());
  applyTheme(getInitialTheme());
  hydrateFormState();
  updateStudySummary();
  bindEvents();
});

function cacheDomElements() {
  dom.form = document.getElementById("studyPlanForm");
  dom.subject = document.getElementById("subject");
  dom.time = document.getElementById("time");
  dom.durationValue = document.getElementById("durationValue");
  dom.durationUnit = document.getElementById("durationUnit");
  dom.goal = document.getElementById("goal");
  dom.planType = document.getElementById("planType");
  dom.pace = document.getElementById("pace");
  dom.includeRevision = document.getElementById("includeRevision");
  dom.weekendSessions = document.getElementById("weekendSessions");
  dom.generateBtn = document.getElementById("generateBtn");
  dom.loadingIndicator = document.getElementById("loadingIndicator");
  dom.loadingText = document.getElementById("loadingText");
  dom.formStatus = document.getElementById("formStatus");
  dom.studySummary = document.getElementById("studySummary");
  dom.resultHint = document.getElementById("resultHint");
  dom.planResult = document.getElementById("studyPlanResult");
  dom.copyPlanBtn = document.getElementById("copyPlanBtn");
  dom.downloadPdfBtn = document.getElementById("downloadPdfBtn");
  dom.themeToggle = document.getElementById("themeToggle");
  dom.themeToggleText = document.getElementById("themeToggleText");
  dom.siteLogo = document.getElementById("siteLogo");
  dom.currentYear = document.getElementById("currentYear");
}

function bindEvents() {
  dom.themeToggle.addEventListener("click", toggleTheme);
  dom.form.addEventListener("submit", handleFormSubmit);
  dom.form.addEventListener("reset", handleFormReset);
  dom.copyPlanBtn.addEventListener("click", copyPlanToClipboard);
  dom.downloadPdfBtn.addEventListener("click", downloadPlanAsPdf);

  [dom.time, dom.durationValue, dom.durationUnit].forEach((input) => {
    input.addEventListener("input", () => {
      updateStudySummary();
      persistFormState();
    });
    input.addEventListener("change", persistFormState);
  });

  [
    dom.subject,
    dom.goal,
    dom.planType,
    dom.pace,
    dom.includeRevision,
    dom.weekendSessions,
  ].forEach((input) => {
    input.addEventListener("input", persistFormState);
    input.addEventListener("change", persistFormState);
  });
}

function getInitialTheme() {
  const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  const safeTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", safeTheme);
  dom.themeToggle.setAttribute("aria-pressed", String(safeTheme === "dark"));
  dom.themeToggleText.textContent = safeTheme === "dark" ? "Light Theme" : "Dark Theme";

  if (dom.siteLogo?.dataset.logoLight && dom.siteLogo?.dataset.logoDark) {
    dom.siteLogo.src = safeTheme === "dark" ? dom.siteLogo.dataset.logoDark : dom.siteLogo.dataset.logoLight;
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
}

function persistFormState() {
  const snapshot = {
    subject: dom.subject.value,
    time: dom.time.value,
    durationValue: dom.durationValue.value,
    durationUnit: dom.durationUnit.value,
    goal: dom.goal.value,
    planType: dom.planType.value,
    pace: dom.pace.value,
    includeRevision: dom.includeRevision.checked,
    weekendSessions: dom.weekendSessions.checked,
  };
  sessionStorage.setItem(STORAGE_KEYS.form, JSON.stringify(snapshot));
}

function hydrateFormState() {
  const raw = sessionStorage.getItem(STORAGE_KEYS.form);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    dom.subject.value = parsed.subject || "";
    dom.time.value = parsed.time || "";
    dom.durationValue.value = parsed.durationValue || "";
    dom.durationUnit.value = parsed.durationUnit || "weeks";
    dom.goal.value = parsed.goal || "";
    dom.planType.value = parsed.planType || "concise";
    dom.pace.value = parsed.pace || "steady";
    dom.includeRevision.checked = parsed.includeRevision !== false;
    dom.weekendSessions.checked = Boolean(parsed.weekendSessions);
  } catch {
    sessionStorage.removeItem(STORAGE_KEYS.form);
  }
}

function updateStudySummary() {
  const hours = Number.parseFloat(dom.time.value);
  const duration = Number.parseInt(dom.durationValue.value, 10);
  const unit = dom.durationUnit.value;

  if (!Number.isFinite(hours) || !Number.isFinite(duration) || !DAY_MULTIPLIERS[unit]) {
    dom.studySummary.textContent = "Estimated workload: select your duration and hours.";
    return;
  }

  const totalDays = duration * DAY_MULTIPLIERS[unit];
  const totalHours = Math.round(hours * totalDays * 10) / 10;
  dom.studySummary.textContent = `Estimated workload: ${totalHours} hours over about ${totalDays} days.`;
}

function setFormStatus(message, status = "") {
  dom.formStatus.textContent = message;
  dom.formStatus.dataset.status = status;
}

function setLoadingText(message) {
  if (dom.loadingText) {
    dom.loadingText.textContent = message;
  }
}

function clearLoadingTimers() {
  if (wakeHintTimer) {
    clearTimeout(wakeHintTimer);
    wakeHintTimer = null;
  }
  if (longWaitHintTimer) {
    clearTimeout(longWaitHintTimer);
    longWaitHintTimer = null;
  }
}

function setLoading(isLoading) {
  dom.loadingIndicator.classList.toggle("hidden", !isLoading);
  dom.generateBtn.disabled = isLoading;

  clearLoadingTimers();
  if (isLoading) {
    setLoadingText("Generating your plan...");
    wakeHintTimer = setTimeout(() => {
      setLoadingText("Waking server... this can take up to 60 seconds.");
    }, WAKE_HINT_MS);
    longWaitHintTimer = setTimeout(() => {
      setLoadingText("Still waking up... thanks for your patience.");
    }, LONG_WAIT_HINT_MS);
  } else {
    setLoadingText("Generating your plan...");
  }
}

function getPayload() {
  return {
    subject: dom.subject.value.trim(),
    time: Number.parseFloat(dom.time.value),
    durationValue: Number.parseInt(dom.durationValue.value, 10),
    durationUnit: dom.durationUnit.value,
    goal: dom.goal.value.trim(),
    planType: dom.planType.value,
    pace: dom.pace.value,
    includeRevision: dom.includeRevision.checked,
    weekendSessions: dom.weekendSessions.checked,
  };
}

async function handleFormSubmit(event) {
  event.preventDefault();
  setFormStatus("");

  if (!dom.form.checkValidity()) {
    dom.form.reportValidity();
    return;
  }

  const payload = getPayload();
  if (!Number.isFinite(payload.time) || payload.time < 0.5) {
    setFormStatus("Please enter valid available hours per day.", "error");
    return;
  }

  setLoading(true);
  try {
    const response = await fetch("/generateStudyPlan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Unable to generate a study plan.");
    }

    generatedPlanText = sanitizePlan(data.plan || "");
    if (!generatedPlanText) {
      throw new Error("No plan text was returned.");
    }

    dom.planResult.textContent = generatedPlanText;
    dom.resultHint.classList.add("hidden");
    dom.copyPlanBtn.disabled = false;
    dom.downloadPdfBtn.disabled = false;
    setFormStatus("Study plan generated successfully.", "success");
    persistFormState();
  } catch (error) {
    dom.planResult.textContent = "";
    dom.resultHint.classList.remove("hidden");
    dom.copyPlanBtn.disabled = true;
    dom.downloadPdfBtn.disabled = true;
    setFormStatus(error.message || "Something went wrong while generating your plan.", "error");
  } finally {
    setLoading(false);
  }
}

function sanitizePlan(text) {
  return String(text)
    .replace(/\*\*/g, "")
    .replace(/\r\n/g, "\n")
    .trim();
}

async function copyPlanToClipboard() {
  if (!generatedPlanText) {
    return;
  }

  try {
    await navigator.clipboard.writeText(generatedPlanText);
    setFormStatus("Plan copied to clipboard.", "success");
  } catch {
    setFormStatus("Clipboard copy failed. You can still copy manually.", "error");
  }
}

function downloadPlanAsPdf() {
  if (!generatedPlanText) {
    setFormStatus("Generate a plan first before downloading.", "error");
    return;
  }

  const jsPdfNamespace = window.jspdf;
  if (!jsPdfNamespace?.jsPDF) {
    setFormStatus("PDF library failed to load.", "error");
    return;
  }

  const { jsPDF } = jsPdfNamespace;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 42;
  const lineHeight = 18;
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  const title = `PlanifyVerse Study Plan: ${dom.subject.value.trim() || "Custom Topic"}`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, margin, y);
  y += 26;

  doc.setFont("courier", "normal");
  doc.setFontSize(11);

  const lines = doc.splitTextToSize(generatedPlanText, usableWidth);
  lines.forEach((line) => {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  });

  const subjectSlug = (dom.subject.value || "study-plan")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  doc.save(`${subjectSlug || "study-plan"}.pdf`);
}

function handleFormReset() {
  setTimeout(() => {
    dom.durationUnit.value = "weeks";
    dom.planType.value = "concise";
    dom.pace.value = "steady";
    dom.includeRevision.checked = true;
    dom.weekendSessions.checked = false;
    updateStudySummary();
    setFormStatus("");
    sessionStorage.removeItem(STORAGE_KEYS.form);
  }, 0);
}
