/**
 * CodeMirror Editör ve Sekme Yönetimi
 */
let editor = null;

function initEditor() {
  editor = window.CodeMirror.fromTextArea(document.getElementById("code"), {
    mode: "htmlmixed",
    theme: "default",
    lineNumbers: true,
    lineWrapping: true,
    
    // --- YENİ EKLENEN KISIM: Dikey Referans Çizgileri İçin Tab Ayarları ---
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: true, // CSS ile şekillendireceğimiz Tab'ları zorunlu kılar
    extraKeys: {
      "Tab": function(cm) {
        // Tab tuşuna basıldığında CodeMirror boşluk(space) yerine 
        // gerçek bir \t (sekme) karakteri koyar, bu da dikey çizgiyi oluşturur.
        if (cm.somethingSelected()) {
          cm.indentSelection("add");
        } else {
          cm.replaceSelection("\t", "end", "+input");
        }
      }
    }
    // ---------------------------------------------------------------------
  });

  // Fare tekerleği hareketiyle sekmeleri yatayda kaydırma dinleyicisi
  const tabsContainer = document.getElementById("editorTabs");
  if (tabsContainer) {
    tabsContainer.addEventListener("wheel", (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        tabsContainer.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }
}

function switchTab(path) {
  if (state.activeFilePath) {
    const activeNode = getNodeByPath(state.activeFilePath);
    if (activeNode && activeNode.type === "file") {
      activeNode.content = editor.getValue();
    }
  }

  state.activeFilePath = path;
  if (path && !state.openTabs.includes(path)) {
    state.openTabs.push(path);
  }

  renderTabs();
  renderFileTree();

  if (path) {
    const targetNode = getNodeByPath(path);
    if (targetNode && targetNode.type === "file") {
      if (path.endsWith(".html")) editor.setOption("mode", "htmlmixed");
      else if (path.endsWith(".css")) editor.setOption("mode", "css");
      else if (path.endsWith(".js")) editor.setOption("mode", "javascript");
      else editor.setOption("mode", "text/plain");

      editor.setValue(targetNode.content || "");
    }
  } else {
    // Açık dosya yoksa editör alanını boşalt
    if (editor) editor.setValue("");
  }

  setTimeout(() => { 
    if (editor) editor.refresh(); 
  }, 10);
}

function closeTab(path, event) {
  if (event) event.stopPropagation();
  state.openTabs = state.openTabs.filter(p => p !== path);
  
  if (state.activeFilePath === path) {
    if (state.openTabs.length > 0) {
      switchTab(state.openTabs[state.openTabs.length - 1]);
    } else {
      state.activeFilePath = null;
      if (editor) editor.setValue("");
      renderTabs();
      renderFileTree();
    }
  } else {
    renderTabs();
  }
}

function renderTabs() {
  const container = document.getElementById("editorTabs");
  if (!container) return;
  container.innerHTML = "";

  state.openTabs.forEach(path => {
    const tabEl = document.createElement("div");
    tabEl.className = `tab-item ${path === state.activeFilePath ? "active" : ""}`;
    tabEl.onclick = () => switchTab(path);

    const fileName = path.split("/").pop();
    
    const titleSpan = document.createElement("span");
    titleSpan.textContent = fileName;

    const closeSpan = document.createElement("span");
    closeSpan.className = "tab-close";
    closeSpan.textContent = "✕";
    closeSpan.onclick = (e) => closeTab(path, e);

    tabEl.appendChild(titleSpan);
    tabEl.appendChild(closeSpan);
    container.appendChild(tabEl);
  });
}
