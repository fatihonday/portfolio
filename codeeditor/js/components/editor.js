/**
 * CodeMirror Editör ve Sekme Yönetimi
 */
let editor = null;
let searchMatches = [];
let currentSearchIndex = -1;
let activeSearchMark = null;
let searchOverlay = null;

function initEditor() {
  editor = window.CodeMirror.fromTextArea(document.getElementById("code"), {
    mode: "htmlmixed",
    theme: "default",
    lineNumbers: true,
    lineWrapping: true,
    
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: true, 
    extraKeys: {
      "Tab": function(cm) {
        if (cm.somethingSelected()) {
          cm.indentSelection("add");
        } else {
          cm.replaceSelection("\t", "end", "+input");
        }
      },
      // YENİ EKLENEN KISIM: Arama Kutusu Kısayolu (Windows: Ctrl+F, Mac: Cmd+F)
      "Ctrl-F": openSearchPanel,
      "Cmd-F": openSearchPanel
    }
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

// ----------------------------------------------------------------------
// ÖZEL ARAMA (SEARCH) PANELİ FONKSİYONLARI
// ----------------------------------------------------------------------

function openSearchPanel(cm) {
  document.getElementById('searchPanel').style.display = 'flex';
  const input = document.getElementById('searchInput');
  input.focus();
  
  // Eğer kullanıcı editörde bir metin seçip Ctrl+F'ye bastıysa, o metni arama kutusuna yazdır
  if (cm.somethingSelected()) {
    input.value = cm.getSelection();
  }
  performSearch(input.value);
}

function closeSearchPanel() {
  document.getElementById('searchPanel').style.display = 'none';
  if (activeSearchMark) { activeSearchMark.clear(); activeSearchMark = null; }
  if (searchOverlay) { editor.removeOverlay(searchOverlay); searchOverlay = null; }
  searchMatches = [];
  editor.focus();
}

function performSearch(query) {
  // Önceki izleri temizle
  if (activeSearchMark) { activeSearchMark.clear(); activeSearchMark = null; }
  if (searchOverlay) { editor.removeOverlay(searchOverlay); searchOverlay = null; }
  
  searchMatches = [];
  currentSearchIndex = -1;
  const countEl = document.getElementById('searchCount');
  
  if (!query) {
    countEl.textContent = "0/0";
    return;
  }

  // 1. Tüm bulunan eşleşmeleri hafif sarı ile vurgulamak için CodeMirror Overlay ekle
  searchOverlay = {
    token: function(stream) {
      const escapedQuery = query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
      const regex = new RegExp(escapedQuery, "i"); // case-insensitive arama
      if (stream.match(regex)) return "searching"; // .cm-searching CSS sınıfını tetikler
      while (stream.next() != null && !stream.match(regex, false)) {}
      return null;
    }
  };
  editor.addOverlay(searchOverlay);

  // 2. Gezinme işlemleri için tüm eşleşmelerin pozisyonlarını bulup diziye ekle
  const cursor = editor.getSearchCursor(query, {line: 0, ch: 0}, {caseFold: true});
  while (cursor.findNext()) {
    searchMatches.push({ from: cursor.from(), to: cursor.to() });
  }

  // 3. Eşleşme bulunduysa ilkine odaklan
  if (searchMatches.length > 0) {
    currentSearchIndex = 0;
    highlightActiveSearchMatch();
  } else {
    countEl.textContent = "0/0";
  }
}

function highlightActiveSearchMatch() {
  if (activeSearchMark) { activeSearchMark.clear(); }
  
  const match = searchMatches[currentSearchIndex];
  if (match) {
    // Aktif eşleşmeyi turuncu yapmak için işaretle
    activeSearchMark = editor.markText(match.from, match.to, { className: "cm-search-match-active" });
    // Bulunan koda kaydır
    editor.scrollIntoView(match.from, 100);
    // Sayacı güncelle (örneğin: 1/5)
    document.getElementById('searchCount').textContent = `${currentSearchIndex + 1}/${searchMatches.length}`;
  }
}

function nextSearchMatch() {
  if (searchMatches.length === 0) return;
  currentSearchIndex = (currentSearchIndex + 1) % searchMatches.length;
  highlightActiveSearchMatch();
}

function prevSearchMatch() {
  if (searchMatches.length === 0) return;
  currentSearchIndex = (currentSearchIndex - 1 + searchMatches.length) % searchMatches.length;
  highlightActiveSearchMatch();
}
// ----------------------------------------------------------------------


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
    if (editor) editor.setValue("");
  }

  // Sekme değişince aramayı kapatıp sıfırla
  closeSearchPanel();

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
