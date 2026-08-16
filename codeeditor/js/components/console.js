/**
 * Konsol ve Bildirim Yönetimi Bileşeni
 */

let activeInputCallback = null;

function logToConsole(msg, type = "info") {
  const logsContainer = document.getElementById("consoleLogs");
  if (!logsContainer) return;

  // YENİ: Başka bir işlem yapılıp yeni bir bildirim geldiğinde, 
  // açık olan "girdi (input)" ekranını otomatik iptal et.
  if (activeInputCallback) {
    cancelConsoleInput();
  }

  const time = new Date().toLocaleTimeString("tr-TR", { hour12: false });
  const line = document.createElement("div");
  line.className = "log-line";
  
  const timeSpan = document.createElement("span");
  timeSpan.className = "log-time";
  timeSpan.textContent = `[${time}]`;

  const msgSpan = document.createElement("span");
  msgSpan.className = `log-msg log-${type}`;
  msgSpan.textContent = msg;

  line.appendChild(timeSpan);
  line.appendChild(msgSpan);
  logsContainer.appendChild(line);

  // Her zaman en son bildirime (en aşağıya) kaydır
  logsContainer.scrollTop = logsContainer.scrollHeight;
}

function requestConsoleInput(label, defaultValue = "", callback) {
  const inputArea = document.getElementById("consoleInputArea");
  const inputLabel = document.getElementById("consoleInputLabel");
  const inputField = document.getElementById("consoleInput");
  const consoleBar = document.getElementById("consoleBar");

  inputLabel.textContent = label;
  inputField.value = defaultValue;
  inputArea.style.display = "flex";
  
  // Daraltılmış (minimized) modda CSS'in davranışını değiştirmesi için class ekliyoruz
  consoleBar.classList.add("input-active");

  activeInputCallback = callback;
  inputField.focus();
  
  // Konsol bar tamamen gizliyse zorla aç
  if (consoleBar.style.display === "none" || consoleBar.style.display === "") {
    consoleBar.style.display = "flex";
  }
}

function submitConsoleInput() {
  if (activeInputCallback) {
    const val = document.getElementById("consoleInput").value;
    const cb = activeInputCallback; // Referansı kopyala
    cancelConsoleInput(); // Ekranı ve state'i temizle
    cb(val); // Kullanıcının fonksiyonunu çalıştır
  }
}

function cancelConsoleInput() {
  const inputArea = document.getElementById("consoleInputArea");
  const consoleBar = document.getElementById("consoleBar");
  
  if (inputArea) inputArea.style.display = "none";
  if (consoleBar) consoleBar.classList.remove("input-active"); // CSS class'ını kaldır
  
  activeInputCallback = null;
}

function toggleConsoleBar(forceOpen = null) {
  const consoleBar = document.getElementById("consoleBar");
  const isHidden = consoleBar.style.display === "none" || consoleBar.style.display === "";
  
  if (forceOpen === true || (forceOpen === null && isHidden)) {
    consoleBar.style.display = "flex";
  } else {
    consoleBar.style.display = "none";
  }
}

function toggleConsoleMinimize() {
  const consoleBar = document.getElementById("consoleBar");
  consoleBar.classList.toggle("minimized");
}

function clearConsoleLogs() {
  const logsContainer = document.getElementById("consoleLogs");
  if (logsContainer) {
    logsContainer.innerHTML = "";
  }
  logToConsole("Konsol temizlendi.", "success");
}
