/**
 * Konsol, Loglama ve Prompt İşlemleri
 */
let consoleCallback = null;

function toggleConsoleBar(open) {
  const bar = document.getElementById("consoleBar");
  const btn = document.getElementById("consoleToggleBtn");
  const isVisible = bar.style.display === "flex";
  
  if (open === true || (open === undefined && !isVisible)) {
    bar.style.display = "flex"; 
    btn.classList.add("active");
  } else {
    bar.style.display = "none"; 
    btn.classList.remove("active");
  }
}

function toggleConsoleMinimize() {
  const consoleBar = document.getElementById("consoleBar");
  const minMaxBtn = document.getElementById("consoleMinMaxBtn");
  const isMin = consoleBar.classList.toggle("minimized");
  minMaxBtn.textContent = isMin ? "▲" : "▼";
  
  const logs = document.getElementById("consoleLogs");
  logs.scrollTop = logs.scrollHeight;
}

function logToConsole(msg, type = "info") {
  toggleConsoleBar(true);
  const logs = document.getElementById("consoleLogs");
  const line = document.createElement("div");
  line.className = "log-line";
  const timeStr = new Date().toLocaleTimeString();
  line.innerHTML = `<span class="log-time">[${timeStr}]</span> <span class="log-msg log-${type}">${msg}</span>`;
  logs.appendChild(line);
  logs.scrollTop = logs.scrollHeight;
}

function clearConsoleLogs() {
  document.getElementById("consoleLogs").innerHTML = "";
}

function requestConsoleInput(label, defaultValue, callback) {
  toggleConsoleBar(true);

  const inputArea = document.getElementById("consoleInputArea");
  const inputEl = document.getElementById("consoleInput");
  const labelEl = document.getElementById("consoleInputLabel");
  
  labelEl.textContent = label;
  inputEl.value = defaultValue || "";
  inputArea.style.display = "flex";
  inputEl.focus();
  
  consoleCallback = callback;
}

function submitConsoleInput() {
  const inputArea = document.getElementById("consoleInputArea");
  const inputEl = document.getElementById("consoleInput");
  const val = inputEl.value.trim();
  
  // Girdi alanını kapatıyoruz
  inputArea.style.display = "none";
  inputEl.value = "";
  
  if (consoleCallback) {
    const cb = consoleCallback;
    consoleCallback = null;
    cb(val);
  }
}
