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
        upBtn.onclick = (e) => {
          e.stopPropagation();
          if (reorderNode(fullPath, "up")) {
            state.isDirty = true;
            renderFileTree();
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
        downBtn.onclick = (e) => {
          e.stopPropagation();
          if (reorderNode(fullPath, "down")) {
            state.isDirty = true;
            renderFileTree();
          }
        };
        actionsDiv.appendChild(downBtn);
      }

      // 📥 Bilgisayardaki Klasöre İndir / Kaydet Butonu
      const exportBtn = document.createElement("button");
      exportBtn.className = "node-btn";
      exportBtn.textContent = "💾";
      exportBtn.title = "Bilgisayarda Klasöre Kaydet";
      exportBtn.onclick = (e) => {
        e.stopPropagation();
        exportNodeToDirectory(fullPath);
      };
      actionsDiv.appendChild(exportBtn);

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
 * Belirli Bir Dosya ya da Klasörü Bilgisayardaki Seçilen Klasöre Kaydeder
 */
async function exportNodeToDirectory(path) {
  // Eğer editörde açık olan dosya kaydediliyorsa güncel içeriği al
  if (state.activeFilePath) {
    const activeNode = getNodeByPath(state.activeFilePath);
    if (activeNode) activeNode.content = editor.getValue();
  }

  const targetNode = getNodeByPath(path);
  if (!targetNode) {
    logToConsole(`"${path}" bulunamadı.`, "error");
    return;
  }

  const nodeName = path.split("/").pop();

  // Tarayıcı File System Access API desteği kontrolü
  if (!window.showDirectoryPicker) {
    // Fallback: Tek dosya ise doğrudan tarayıcı indirmesi yap
    if (targetNode.type === "file") {
      const blob = new Blob([targetNode.content || ""], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = nodeName;
      a.click();
      URL.revokeObjectURL(a.href);
      logToConsole(`"${nodeName}" indirildi.`, "success");
    } else {
      logToConsole("Tarayıcınız klasör dışa aktarmayı desteklemiyor. Lütfen ZIP İndir seçeneğini kullanın.", "warn");
    }
    return;
  }

  try {
    logToConsole(`"${nodeName}" öğesinin kaydedileceği bilgisayar klasörünü seçin...`, "info");
    const dirHandle = await window.showDirectoryPicker();

    if (targetNode.type === "file") {
      // Tek Dosya Yazımı
      const fileHandle = await dirHandle.getFileHandle(nodeName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(targetNode.content || "");
      await writable.close();
      logToConsole(`✅ "${nodeName}" dosyası "${dirHandle.name}" klasörüne kaydedildi.`, "success");
    } else if (targetNode.type === "folder") {
      // Klasör ve Alt Öğeleri Özyineli (Recursive) Yazma
      async function writeFolderRecursively(folderNode, parentDirHandle, folderName) {
        const subDirHandle = await parentDirHandle.getDirectoryHandle(folderName, { create: true });
        if (folderNode.children) {
          for (let childName in folderNode.children) {
            const child = folderNode.children[childName];
            if (child.type === "file") {
              const fHandle = await subDirHandle.getFileHandle(childName, { create: true });
              const writable = await fHandle.createWritable();
              await writable.write(child.content || "");
              await writable.close();
            } else if (child.type === "folder") {
              await writeFolderRecursively(child, subDirHandle, childName);
            }
          }
        }
      }

      await writeFolderRecursively(targetNode, dirHandle, nodeName);
      logToConsole(`✅ "${nodeName}" klasörü ve alt öğeleri "${dirHandle.name}" klasörüne kaydedildi.`, "success");
    }
  } catch (err) {
    if (err.name === "AbortError") {
      logToConsole("Klasör seçimi iptal edildi.", "info");
    } else {
      console.error(err);
      logToConsole("Kaydetme hatası: " + err.message, "error");
    }
  }
}

/**
 * Seçilen öğelere göre konsol panelinde işlem seçeneklerini sunar
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

  requestConsoleInput(`"${currentName}" için yeni isim girin:`, currentName, (newName) => {
    if (!newName || newName === currentName) return;

    const success = renameNode(path, newName);
    if (success) {
      state.selectedNodes = [];
      state.isDirty = true;
      renderFileTree();
      renderTabs();
      logToConsole(`"${currentName}" -> "${newName}" olarak değiştirildi.`, "info");
    }
  });
}

/**
 * Dosya/Klasör Taşıma İşlemi
 */
function promptMoveNodes(pathsToMove) {
  const folders = getAllFolderPaths();

  logToConsole("📂 Mevcut Klasörler:", "info");
  folders.forEach(f => {
    logToConsole(`  • ${f === "/" ? "/ (Kök Dizin)" : f}`, "info");
  });

  requestConsoleInput(`Hedef klasör adını/yolunu girin (Kök dizin için /):`, "/", (targetInput) => {
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
      state.isDirty = true;
      renderFileTree();
      renderTabs();
      logToConsole(`✅ ${movedCount} öğe "${trimmedTarget || '/'}" konumuna taşındı.`, "info");
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
      logToConsole(`"${targetPath}" dosyası oluşturuldu.`, "info");
    } else {
      createNodeByPath(targetPath, "folder");
      logToConsole(`"${targetPath}" klasörü oluşturuldu.`, "info");
    }
    state.isDirty = true;
    renderFileTree();
  });
}

function promptCreateFile() {
  requestConsoleInput("Dosya Adı (Örn: style.css veya components/header.js):", "", (path) => {
    if (!path) return;
    createNodeByPath(path, "file", "");
    state.isDirty = true;
    renderFileTree();
    switchTab(path);
    logToConsole(`"${path}" dosyası oluşturuldu.`, "info");
  });
}

function promptCreateFolder() {
  requestConsoleInput("Klasör Adı (Örn: utils veya assets/icons):", "", (path) => {
    if (!path) return;
    createNodeByPath(path, "folder");
    state.isDirty = true;
    renderFileTree();
    logToConsole(`"${path}" klasörü oluşturuldu.`, "info");
  });
}

function deleteNodePrompt(path) {
  requestConsoleInput(`"${path}" silinsin mi? (Evet/Hayır):`, "Evet", (ans) => {
    if (ans.toLowerCase() === "evet" || ans.toLowerCase() === "e") {
      deleteNodeByPath(path);
      closeTab(path);
      state.selectedNodes = state.selectedNodes.filter(p => p !== path);
      state.isDirty = true;
      renderFileTree();
      logToConsole(`"${path}" silindi.`, "warn");
    }
  });
}
