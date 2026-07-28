/**
 * Dosya Ağacı (FileTree) Bileşeni
 */

function renderFileTree() {
  const container = document.getElementById("fileTreeContainer");
  if (!container) return;
  container.innerHTML = "";

  if (!state.projectData || !state.projectData.tree) return;

  function buildTreeUI(treeObj, parentEl, currentPath = "") {
    const keys = Object.keys(treeObj);

    keys.forEach((name, idx) => {
      const node = treeObj[name];
      const fullPath = currentPath ? `${currentPath}/${name}` : name;

      const isSelected = state.selectedNodes.includes(fullPath);
      const isActive = (fullPath === state.activeFilePath);

      const nodeRow = document.createElement("div");
      nodeRow.className = `tree-row ${isActive ? "active" : ""} ${isSelected ? "selected" : ""}`;
      nodeRow.style.paddingLeft = (fullPath.split("/").length * 10) + "px";

      let icon = node.type === "folder" ? "📁" : "📄";
      if (name.endsWith(".css")) icon = "🎨";
      if (name.endsWith(".js")) icon = "⚡";

      const titleSpan = document.createElement("span");
      titleSpan.innerHTML = `${icon} ${name}`;
      titleSpan.style.flex = "1";
      titleSpan.style.overflow = "hidden";
      titleSpan.style.textOverflow = "ellipsis";
      titleSpan.style.whiteSpace = "nowrap";

      // Tıklama İşlemi (Ctrl / Cmd Seçim Desteği)
      nodeRow.onclick = (e) => {
        e.stopPropagation();

        if (e.ctrlKey || e.metaKey) {
          if (state.selectedNodes.includes(fullPath)) {
            state.selectedNodes = state.selectedNodes.filter(p => p !== fullPath);
          } else {
            state.selectedNodes.push(fullPath);
          }
        } else {
          state.selectedNodes = [fullPath];
          if (node.type === "file") switchTab(fullPath);
        }

        renderFileTree();
        handleSelectionActions();
      };

      const actionsDiv = document.createElement("div");
      actionsDiv.className = "node-actions";

      // 🔼 Görünüm Sırasını Yukarı Kaydır Butonu
      if (idx > 0) {
        const upBtn = document.createElement("button");
        upBtn.className = "node-btn";
        upBtn.textContent = "▲";
        upBtn.title = "Yukarı Taşı";
        upBtn.onclick = async (e) => {
          e.stopPropagation();
          if (reorderNode(fullPath, "up")) {
            renderFileTree();
            await saveProject();
          }
        };
        actionsDiv.appendChild(upBtn);
      }

      // 🔽 Görünüm Sırasını Aşağı Kaydır Butonu
      if (idx < keys.length - 1) {
        const downBtn = document.createElement("button");
        downBtn.className = "node-btn";
        downBtn.textContent = "▼";
        downBtn.title = "Aşağı Taşı";
        downBtn.onclick = async (e) => {
          e.stopPropagation();
          if (reorderNode(fullPath, "down")) {
            renderFileTree();
            await saveProject();
          }
        };
        actionsDiv.appendChild(downBtn);
      }

      // Klasör ise '+' butonu ekleyelim
      if (node.type === "folder") {
        const addBtn = document.createElement("button");
        addBtn.className = "node-btn";
        addBtn.textContent = "+";
        addBtn.title = "Klasör İçine Ekle";
        addBtn.onclick = (e) => {
          e.stopPropagation();
          promptAddIntoFolder(fullPath);
        };
        actionsDiv.appendChild(addBtn);
      }

      const delBtn = document.createElement("button");
      delBtn.className = "node-btn del-btn";
      delBtn.textContent = "✕";
      delBtn.title = "Sil";
      delBtn.onclick = (e) => {
        e.stopPropagation();
        deleteNodePrompt(fullPath);
      };

      actionsDiv.appendChild(delBtn);
      nodeRow.appendChild(titleSpan);
      nodeRow.appendChild(actionsDiv);
      parentEl.appendChild(nodeRow);

      if (node.type === "folder" && node.children) {
        buildTreeUI(node.children, parentEl, fullPath);
      }
    });
  }

  buildTreeUI(state.projectData.tree, container);
}

/**
 * Seçilen öğelere göre konsol panelinde işlem seçeneklerini sunar (Sadeleştirildi)
 */
function handleSelectionActions() {
  const count = state.selectedNodes.length;
  if (count === 0) return;

  if (count === 1) {
    const selectedPath = state.selectedNodes[0];
    logToConsole(`📌 Seçilen Öğe: "${selectedPath}" [1: Ad Değiştir, 2: Klasör Değiştir, 0: İptal]`, "info");
    
    requestConsoleInput(`İşlem seçin (1: Ad Değiştir, 2: Taşı):`, "2", (choice) => {
      if (choice === "1") {
        promptRenameNode(selectedPath);
      } else if (choice === "2") {
        promptMoveNodes([selectedPath]);
      } else {
        logToConsole("İşlem iptal edildi.", "info");
      }
    });
  } else {
    logToConsole(`📌 ${count} adet öğe seçildi. [1: Toplu Klasör Değiştir, 0: İptal]`, "info");
    
    requestConsoleInput(`İşlem seçin (1: Toplu Taşı):`, "1", (choice) => {
      if (choice === "1") {
        promptMoveNodes([...state.selectedNodes]);
      } else {
        logToConsole("İşlem iptal edildi.", "info");
      }
    });
  }
}

/**
 * Dosya/Klasör Adı Değiştirme Promptu
 */
function promptRenameNode(path) {
  const parts = path.split("/");
  const currentName = parts.pop();

  requestConsoleInput(`"${currentName}" için yeni isim girin:`, currentName, async (newName) => {
    if (!newName || newName === currentName) return;

    const success = renameNode(path, newName);
    if (success) {
      state.selectedNodes = [];
      renderFileTree();
      renderTabs();
      await saveProject();
      logToConsole(`"${currentName}" -> "${newName}" olarak değiştirildi.`, "success");
    }
  });
}

/**
 * Dosya/Klasör Taşıma İşlemi (Klasör Adı/Yolu ile)
 */
function promptMoveNodes(pathsToMove) {
  const folders = getAllFolderPaths();

  logToConsole("📂 Mevcut Klasörler:", "info");
  folders.forEach(f => {
    logToConsole(`  • ${f === "/" ? "/ (Kök Dizin)" : f}`, "info");
  });

  requestConsoleInput(`Hedef klasör adını/yolunu girin (Kök dizin için /):`, "/", async (targetInput) => {
    if (!targetInput) {
      logToConsole("Taşıma iptal edildi.", "info");
      return;
    }

    let trimmedTarget = targetInput.trim();
    
    if (trimmedTarget === "/") {
      trimmedTarget = "";
    } else {
      if (trimmedTarget.startsWith("/")) trimmedTarget = trimmedTarget.substring(1);
      if (trimmedTarget.endsWith("/")) trimmedTarget = trimmedTarget.slice(0, -1);
    }

    if (trimmedTarget !== "") {
      const targetNode = getNodeByPath(trimmedTarget);
      if (!targetNode || targetNode.type !== "folder") {
        logToConsole(`"${targetInput}" adında bir hedef klasör bulunamadı!`, "error");
        return;
      }
    }

    let movedCount = 0;

    for (let srcPath of pathsToMove) {
      if (moveNode(srcPath, trimmedTarget)) {
        movedCount++;
      }
    }

    if (movedCount > 0) {
      state.selectedNodes = [];
      renderFileTree();
      renderTabs();
      await saveProject();
      logToConsole(`✅ ${movedCount} öğe "${trimmedTarget || '/'}" konumuna taşındı.`, "success");
    } else {
      logToConsole("Öğeler taşınamadı.", "warn");
    }
  });
}

function promptAddIntoFolder(folderPath) {
  requestConsoleInput(`"${folderPath}" içine eklenecek dosya/klasör adı:`, "", (itemName) => {
    if (!itemName) return;
    const targetPath = `${folderPath}/${itemName}`;
    const isFile = itemName.includes(".");
    
    if (isFile) {
      createNodeByPath(targetPath, "file", "");
      switchTab(targetPath);
      logToConsole(`"${targetPath}" dosyası oluşturuldu.`, "success");
    } else {
      createNodeByPath(targetPath, "folder");
      logToConsole(`"${targetPath}" klasörü oluşturuldu.`, "success");
    }
    renderFileTree();
  });
}

function promptCreateFile() {
  requestConsoleInput("Dosya Adı (Örn: style.css veya components/header.js):", "", (path) => {
    if (!path) return;
    createNodeByPath(path, "file", "");
    renderFileTree();
    switchTab(path);
    logToConsole(`"${path}" dosyası oluşturuldu.`, "success");
  });
}

function promptCreateFolder() {
  requestConsoleInput("Klasör Adı (Örn: utils veya assets/icons):", "", (path) => {
    if (!path) return;
    createNodeByPath(path, "folder");
    renderFileTree();
    logToConsole(`"${path}" klasörü oluşturuldu.`, "success");
  });
}

function deleteNodePrompt(path) {
  requestConsoleInput(`"${path}" silinsin mi? (Evet/Hayır):`, "Evet", async (ans) => {
    if (ans.toLowerCase() === "evet" || ans.toLowerCase() === "e") {
      deleteNodeByPath(path);
      closeTab(path);
      state.selectedNodes = state.selectedNodes.filter(p => p !== path);
      renderFileTree();
      await saveProject();
      logToConsole(`"${path}" silindi.`, "warn");
    }
  });
}
