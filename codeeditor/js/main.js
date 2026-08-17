/**
 * Ana Uygulama Girişi ve Event Listeners
 */

document.addEventListener("DOMContentLoaded", () => {
  // Uygulama açılır açılmaz konsolu daraltılmış (minimized) modda başlat
  const consoleBar = document.getElementById("consoleBar");
  if (consoleBar) {
    consoleBar.classList.add("minimized");
    const btn = document.getElementById("consoleMinMaxBtn");
    if (btn) {
      btn.textContent = "▲"; 
      btn.title = "Genişlet";
    }
  }

  // DÜZELTİLDİ: Tema algılamayı başlatmadan ÖNCE editörü başlatmalıyız!
  initEditor(); 
  
  // Artık editör hazır olduğuna göre temasını güvenle güncelleyebiliriz
  initThemeAndFavicon(); 
  
  initCanvasInteractions();
  bindEvents();
});

/* Tarayıcı Temasına Göre Favicon ve Arayüz Teması Değiştirme Sistemi */
function initThemeAndFavicon() {
  const matcher = window.matchMedia('(prefers-color-scheme: dark)');
  
  function applyTheme(e) {
    const isDark = e.matches;
    
    // Favicon Güncelleme
    const iconUrl = isDark ? '../assets/favicon-beyaz.png' : '../assets/favicon-siyah.png';
    const link = document.getElementById('dynamicFavicon');
    if (link) {
      link.href = iconUrl;
    }
    
    // Arayüz Temasını Otomatik Güncelleme
    if (isDark) {
      document.body.classList.add("dark");
      if (editor) editor.setOption("theme", "dracula");
    } else {
      document.body.classList.remove("dark");
      if (editor) editor.setOption("theme", "default");
    }
    
    // Üst Çubuk (Top Bar) Logosunu Güncelle
    const topBarLogo = document.getElementById("siteLogo");
    if (topBarLogo) {
      topBarLogo.src = isDark ? "../assets/ondayelectronicslogo1.png" : "../assets/ondayelectronicslogo2.png";
    }
  }

  // Temayı algıla ve uygula
  matcher.addEventListener('change', applyTheme);
  applyTheme(matcher);
}

function bindEvents() {
  // TopBar Butonları
  document.getElementById("btnToggleProjects").onclick = () => toggleSidebar("projectsSidebar");
  document.getElementById("projectTitleDisplay").onclick = () => toggleSidebar("toolsSidebar");
  document.getElementById("btnOpenFile").onclick = () => document.getElementById("fileInput").click();
  document.getElementById("fileInput").onchange = openFile;
  
  // Tema butonuna basıldığında manuel olarak temanın değiştirilmesi
  document.getElementById("btnToggleTheme").onclick = toggleDarkMode;
  
  document.getElementById("btnToggleEditor").onclick = toggleEditor;
  document.getElementById("consoleToggleBtn").onclick = () => toggleConsoleBar();

  // Sidebar Kapatma
  document.querySelectorAll(".close-sidebar-btn").forEach(btn => {
    btn.onclick = closeSidebars;
  });

  // Araçlar 
  document.getElementById("btnSaveProject").onclick = saveProject;
  document.getElementById("btnSaveAsProject").onclick = initSaveAsProject;
  document.getElementById("btnRunCode").onclick = runCode;
  document.getElementById("btnClearCode").onclick = clearCode;
  document.getElementById("btnDownloadHtml").onclick = saveCode;
  document.getElementById("btnDownloadZip").onclick = downloadProjectAsZip;
  document.getElementById("btnOpenNotepad").onclick = openNotepadModal;

  // Ağaç Butonları
  document.getElementById("btnAddFile").onclick = () => promptCreateFile();
  document.getElementById("btnAddFolder").onclick = () => promptCreateFolder();
  document.getElementById("btnOpenSchema").onclick = openSchemaModal;

  // Kopyala Butonu
  document.getElementById("btnCopyCodeIcon").onclick = copyCodeToClipboard;

  // Arama Paneli Butonları
  const searchInput = document.getElementById("searchInput");
  searchInput.oninput = (e) => performSearch(e.target.value);
  searchInput.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) prevSearchMatch();
      else nextSearchMatch();
    } else if (e.key === "Escape") {
      closeSearchPanel();
    }
  };
  document.getElementById("searchNext").onclick = nextSearchMatch;
  document.getElementById("searchPrev").onclick = prevSearchMatch;
  document.getElementById("searchClose").onclick = closeSearchPanel;

  // Konsol Eventleri
  document.getElementById("btnClearConsoleLogs").onclick = clearConsoleLogs;
  document.getElementById("consoleMinMaxBtn").onclick = toggleConsoleMinimize;
  document.getElementById("btnCloseConsole").onclick = () => toggleConsoleBar(false);
  document.getElementById("consoleInputBtn").onclick = submitConsoleInput;
  document.getElementById("consoleInput").onkeyup = (e) => { if (e.key === "Enter") submitConsoleInput(); };

  // Modallar
  document.querySelectorAll(".close-modal-btn").forEach(btn => {
    btn.onclick = () => {
      document.getElementById("notepadModal").style.display = "none";
      document.getElementById("schemaModal").style.display = "none";
    };
  });
  document.getElementById("btnSaveNotepad").onclick = saveNotepad;
  document.getElementById("btnResetCanvas").onclick = resetCanvasTransform;

  // File Upload / Dropzone
  const dropZone = document.getElementById("dropZone");
  dropZone.onclick = () => document.getElementById("fileUpload").click();
  document.getElementById("fileUpload").onchange = (e) => {
    if (e.target.files[0]) handleFileUpload(e.target.files[0]);
  };

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => dropZone.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); }));
  ['dragenter', 'dragover'].forEach(evt => dropZone.addEventListener(evt, () => dropZone.classList.add('dragover')));
  ['dragleave', 'drop'].forEach(evt => dropZone.addEventListener(evt, () => dropZone.classList.remove('dragover')));
  dropZone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files[0]);
  });

  // Editör Değişim Takibi
  editor.on("change", () => {
    if (state.activeFilePath) {
      const activeNode = getNodeByPath(state.activeFilePath);
      if (activeNode && activeNode.content !== editor.getValue()) {
        activeNode.content = editor.getValue();
        state.isDirty = true;
      }
    }
  });

  window.addEventListener("message", (e) => {
    if (e.data && e.data.type === 'PREVIEW_LOG') {
      logToConsole(`[İçerik]: ${e.data.msg}`, e.data.logLevel);
    }
  });
}

function copyCodeToClipboard() {
  if (!editor) return;
  const content = editor.getValue();
  if (!content) {
    logToConsole("Kopyalanacak kod alanı boş.", "warn");
    return;
  }
  navigator.clipboard.writeText(content).then(() => {
    logToConsole("✅ Kod başarıyla panoya kopyalandı.", "success");
  }).catch(err => {
    console.error(err);
    logToConsole("Kopyalama işlemi başarısız: " + err, "error");
  });
}

async function toggleSidebar(id) {
  const target = document.getElementById(id);
  const isOpen = target.style.display === "flex";
  closeSidebars();
  if (!isOpen) {
    target.style.display = "flex";
    if (id === "projectsSidebar") await renderProjectList();
    if (id === "toolsSidebar") await renderProjectFiles();
  }
}

function closeSidebars() {
  document.getElementById("projectsSidebar").style.display = "none";
  document.getElementById("toolsSidebar").style.display = "none";
}

async function renderProjectList() {
  const listEl = document.getElementById("projectList");
  listEl.innerHTML = "";
  const projects = await getProjects();
  for (let name in projects) {
    const li = document.createElement("li");
    if (name === state.selectedProject) li.className = "selected";
    
    const titleSpan = document.createElement("span");
    titleSpan.textContent = name;
    titleSpan.style.flex = "1";
    titleSpan.onclick = () => selectProject(name);

    const delBtn = document.createElement("button");
    delBtn.className = "del-proj";
    delBtn.textContent = "✕";
    delBtn.onclick = (e) => { e.stopPropagation(); deleteProject(name); };

    li.appendChild(titleSpan);
    li.appendChild(delBtn);
    listEl.appendChild(li);
  }
}

async function selectProject(name) {
  if (state.selectedProject === name) {
    closeSidebars();
    return;
  }

  if (state.isDirty) {
    logToConsole(`⚠️ "${state.selectedProject}" projesinde kaydedilmeyen değişiklikler var!`, "warn");
    requestConsoleInput(
      `Devam etmek istiyor musunuz? (Evet/Hayır):`, "Hayır", async (ans) => {
        if (ans.toLowerCase() === "evet" || ans.toLowerCase() === "e") {
          state.isDirty = false;
          await loadProjectData(name);
        } else {
          logToConsole("Proje geçişi iptal edildi.", "info");
        }
      }
    );
  } else {
    await loadProjectData(name);
  }
}

async function loadProjectData(name) {
  state.selectedProject = name;
  const projects = await getProjects();
  if (projects[name]) {
    state.projectData = projects[name];
    if (!state.projectData.tree) {
      state.projectData.tree = {
        "index.html": { type: "file", content: state.projectData.html || "" },
        "style.css": { type: "file", content: state.projectData.css || "" },
        "script.js": { type: "file", content: state.projectData.js || "" }
      };
    }
    state.openTabs = [];
    state.activeFilePath = null;
    state.isDirty = false;

    if (editor) editor.setValue(""); 
    renderTabs();
    renderFileTree();

    document.getElementById("projectTitleDisplay").textContent = name;
    document.getElementById("toolsHeaderTitle").textContent = name + " - Araçlar";
    await renderProjectFiles();
    runCode();
    closeSidebars();
    logToConsole(`"${name}" projesi yüklendi.`, "success");
  }
}

async function saveProject() {
  if (state.activeFilePath) {
    const activeNode = getNodeByPath(state.activeFilePath);
    if (activeNode) activeNode.content = editor.getValue();
  }
  if (!state.selectedProject) { initSaveAsProject(); return; }
  const projects = await getProjects();
  projects[state.selectedProject] = state.projectData;
  await setProjects(projects);
  state.isDirty = false;
  logToConsole(`"${state.selectedProject}" başarıyla kaydedildi.`, "success");
}

function initSaveAsProject() {
  if (state.activeFilePath) {
    const activeNode = getNodeByPath(state.activeFilePath);
    if (activeNode) activeNode.content = editor.getValue();
  }
  const defaultName = state.selectedProject ? state.selectedProject + "_kopya" : "Yeni_Proje";
  requestConsoleInput("Proje İsmi:", defaultName, async (name) => {
    if (!name) return;
    const projects = await getProjects();
    projects[name] = JSON.parse(JSON.stringify(state.projectData));
    await setProjects(projects);
    state.selectedProject = name;
    state.isDirty = false;
    document.getElementById("projectTitleDisplay").textContent = name;
    document.getElementById("toolsHeaderTitle").textContent = name + " - Araçlar";
    await renderProjectFiles();
    logToConsole(`"${name}" projesi kaydedildi.`, "success");
  });
}

async function deleteProject(name) {
  requestConsoleInput(`"${name}" silinsin mi? (Evet/Hayır):`, "Evet", async (ans) => {
    if (ans.toLowerCase() === "evet" || ans.toLowerCase() === "e") {
      const projects = await getProjects();
      delete projects[name];
      await setProjects(projects);
      if (state.selectedProject === name) {
        state.selectedProject = null;
        state.isDirty = false;
        state.openTabs = [];
        state.activeFilePath = null;
        if (editor) editor.setValue("");
        renderTabs();
        document.getElementById("projectTitleDisplay").textContent = "Proje: Seçilmedi";
      }
      await renderProjectList();
      logToConsole(`"${name}" projesi silindi.`, "warn");
    }
  });
}

function handleFileUpload(file) {
  if (!state.selectedProject) { logToConsole("Önce bir proje seçin.", "error"); return; }
  const reader = new FileReader();
  reader.onload = async function(e) {
    if (!state.projectData.files) state.projectData.files = {};
    state.projectData.files[file.name] = e.target.result;
    state.isDirty = true;
    await renderProjectFiles();
    runCode();
    logToConsole(`"${file.name}" yüklendi.`, "info");
  };
  reader.readAsDataURL(file);
}

async function renderProjectFiles() {
  const container = document.getElementById("activeProjectFiles");
  container.innerHTML = "";
  if (!state.selectedProject) return;
  const files = state.projectData.files || {};
  for (let fname in files) {
    const chip = document.createElement("div");
    chip.className = "file-chip";
    chip.innerHTML = `<span>🖼️ ${fname}</span>`;
    const delBtn = document.createElement("button");
    delBtn.className = "del-btn";
    delBtn.textContent = "✕";
    delBtn.onclick = () => removeFileFromProject(fname);
    chip.appendChild(delBtn);
    container.appendChild(chip);
  }
}

async function removeFileFromProject(fileName) {
  if (!state.selectedProject) return;
  if (state.projectData.files && state.projectData.files[fileName]) {
    delete state.projectData.files[fileName];
    state.isDirty = true;
    await renderProjectFiles();
    runCode();
    logToConsole(`"${fileName}" kaldırıldı.`, "info");
  }
}

function openNotepadModal() {
  if (!state.selectedProject) { logToConsole("Önce bir proje seçin.", "error"); return; }
  document.getElementById("notepadTextarea").value = state.projectData.notes || "";
  document.getElementById("notepadModal").style.display = "flex";
}

async function saveNotepad() {
  if (!state.selectedProject) return;
  state.projectData.notes = document.getElementById("notepadTextarea").value;
  state.isDirty = true;
  document.getElementById("notepadModal").style.display = "none";
  logToConsole("Notlar güncellendi.", "info");
}

function openSchemaModal() {
  document.getElementById("schemaModal").style.display = "flex";
  renderCustomBlockSchema();
}

function clearCode() { 
  editor.setValue(''); 
  state.isDirty = true;
  logToConsole("Kod alanı temizlendi.", "info"); 
}

function saveCode() {
  runCode();
  const blob = new Blob([document.getElementById("preview").srcdoc], {type:'text/html'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (state.selectedProject || 'index') + '.html';
  a.click();
  logToConsole("HTML indirildi.", "success");
}

function openFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    state.projectData.tree[file.name] = { type: "file", content: e.target.result };
    state.isDirty = true;
    switchTab(file.name);
    runCode();
    logToConsole(`"${file.name}" eklendi.`, "info");
  };
  reader.readAsText(file);
}

// Tema Butonuyla Manuel Geçiş
function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark");
  
  if (editor) {
    editor.setOption("theme", isDark ? "dracula" : "default");
  }
  
  const topBarLogo = document.getElementById("siteLogo");
  if (topBarLogo) {
    topBarLogo.src = isDark ? "../assets/ondayelectronicslogo1.png" : "../assets/ondayelectronicslogo2.png";
  }
  
  const iconUrl = isDark ? '../assets/favicon-beyaz.png' : '../assets/favicon-siyah.png';
  const link = document.getElementById('dynamicFavicon');
  if (link) {
    link.href = iconUrl;
  }
}

function toggleEditor() {
  const ed = document.getElementById("editor");
  const prev = document.getElementById("preview");
  ed.style.display = ed.style.display === "none" ? "flex" : "none";
  prev.style.width = ed.style.display === "none" ? "100%" : "50%";
}

async function downloadProjectAsZip() {
  if (state.activeFilePath) {
    const activeNode = getNodeByPath(state.activeFilePath);
    if (activeNode) activeNode.content = editor.getValue();
  }
  if (!state.projectData || !state.projectData.tree) return;
  
  logToConsole("Proje ZIP olarak hazırlanıyor...", "info");
  try {
    const zip = new window.JSZip();
    function addTreeToZip(treeObj, currentFolder) {
      for (let name in treeObj) {
        const node = treeObj[name];
        if (node.type === "file") currentFolder.file(name, node.content || "");
        else if (node.type === "folder" && node.children) addTreeToZip(node.children, currentFolder.folder(name));
      }
    }
    addTreeToZip(state.projectData.tree, zip);
    if (state.projectData.files) {
      for (let fname in state.projectData.files) {
        const base64Data = state.projectData.files[fname].split(',')[1];
        if (base64Data) zip.file(fname, base64Data, { base64: true });
      }
    }
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = (state.selectedProject || "Yeni_Proje") + ".zip";
    a.click();
    URL.revokeObjectURL(url);
    logToConsole(`📦 Proje indirildi.`, "success");
  } catch (error) {
    console.error(error);
  }
}
