/**
 * Ana Uygulama Girişi ve Event Listeners
 */

document.addEventListener("DOMContentLoaded", () => {
  initEditor();
  initCanvasInteractions();
  bindEvents();
});

function bindEvents() {
  // TopBar Butonları
  document.getElementById("btnToggleProjects").onclick = () => toggleSidebar("projectsSidebar");
  document.getElementById("projectTitleDisplay").onclick = () => toggleSidebar("toolsSidebar");
  document.getElementById("btnOpenFile").onclick = () => document.getElementById("fileInput").click();
  document.getElementById("fileInput").onchange = openFile;
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

  // Sadece aktif dosyanın bellekteki içeriğini günceller & isDirty takibi yapar
  editor.on("change", () => {
    if (state.activeFilePath) {
      const activeNode = getNodeByPath(state.activeFilePath);
      if (activeNode && activeNode.content !== editor.getValue()) {
        activeNode.content = editor.getValue();
        state.isDirty = true;
      }
    }
  });

  // Preview Iframe loglarını dinleme
  window.addEventListener("message", (e) => {
    if (e.data && e.data.type === 'PREVIEW_LOG') {
      logToConsole(`[İçerik]: ${e.data.msg}`, e.data.logLevel);
    }
  });
}

/* YARDIMCI FONKSİYONLAR */
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
      `Kaydedilmeyen değişiklikler var, devam etmek istiyor musunuz? (Evet/Hayır):`,
      "Hayır",
      async (ans) => {
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

    // Hiçbir sekme veya dosya otomatik açılmasın
    state.openTabs = [];
    state.activeFilePath = null;
    state.isDirty = false;

    if (editor) {
      editor.setValue(""); // Editörü temizle
    }

    renderTabs();
    renderFileTree();

    document.getElementById("projectTitleDisplay").textContent = name;
    document.getElementById("toolsHeaderTitle").textContent = name + " - Araçlar";
    await renderProjectFiles();
    runCode();
    closeSidebars();
    logToConsole(`"${name}" projesi yüklendi. Hiçbir dosya açık değil.`, "success");
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
    logToConsole(`"${file.name}" yüklendi (Kaydetmek için Kaydet butonuna basın).`, "info");
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
    logToConsole(`"${fileName}" kaldırıldı (Kaydetmek için Kaydet butonuna basın).`, "info");
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
  logToConsole("Notlar güncellendi (Kaydetmek için Projeyi Kaydet butonuna basın).", "info");
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

function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark");
  editor.setOption("theme", isDark ? "dracula" : "default");
  const logoImg = document.getElementById("siteLogo");
  logoImg.src = isDark ? "assets/ondayelectronicslogo1.png" : "assets/ondayelectronicslogo2.png";
}

function toggleEditor() {
  const ed = document.getElementById("editor");
  const prev = document.getElementById("preview");
  ed.style.display = ed.style.display === "none" ? "flex" : "none";
  prev.style.width = ed.style.display === "none" ? "100%" : "50%";
}

/**
 * Projeyi Klasör Yapısını Koruyarak ZIP Olarak İndirme
 */
async function downloadProjectAsZip() {
  // Eğer editörde açık bir dosya varsa önce onun güncel halini belleğe al
  if (state.activeFilePath) {
    const activeNode = getNodeByPath(state.activeFilePath);
    if (activeNode) activeNode.content = editor.getValue();
  }

  if (!state.projectData || !state.projectData.tree) {
    logToConsole("İndirilecek proje verisi bulunamadı.", "error");
    return;
  }

  logToConsole("Proje ZIP olarak hazırlanıyor, lütfen bekleyin...", "info");

  try {
    const zip = new window.JSZip();

    // 1. Ağaç yapısındaki (Tree) dosya ve klasörleri ZIP'e ekleyen özyineli (recursive) fonksiyon
    function addTreeToZip(treeObj, currentFolder) {
      for (let name in treeObj) {
        const node = treeObj[name];
        if (node.type === "file") {
          currentFolder.file(name, node.content || "");
        } else if (node.type === "folder" && node.children) {
          const subFolder = currentFolder.folder(name);
          addTreeToZip(node.children, subFolder);
        }
      }
    }

    addTreeToZip(state.projectData.tree, zip);

    // 2. Yüklü varlıkları (Medya/Assets) ZIP'e Ekle
    // Varlıklar veritabanında Base64 Data URL (data:image/png;base64,...) olarak tutuluyor.
    if (state.projectData.files) {
      for (let fname in state.projectData.files) {
        const dataUrl = state.projectData.files[fname];
        // Sadece virgülden sonraki gerçek base64 verisini alıyoruz
        const base64Data = dataUrl.split(',')[1];
        if (base64Data) {
          zip.file(fname, base64Data, { base64: true });
        }
      }
    }

    // 3. ZIP Dosyasını Oluştur ve İndir
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = (state.selectedProject || "Yeni_Proje") + ".zip";
    a.click();
    
    URL.revokeObjectURL(url);
    logToConsole(`📦 Proje "${a.download}" olarak başarıyla indirildi.`, "success");

  } catch (error) {
    console.error(error);
    logToConsole("ZIP oluşturulurken hata oluştu: " + error.message, "error");
  }
}
