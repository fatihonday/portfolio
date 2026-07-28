/**
 * Sol Taraf Sanal Dosya Mimarisi Ağacı ve Asset Yöneticisi
 */
function renderFileTree() {
  const container = document.getElementById("fileTreeContainer");
  if (!container) return;
  container.innerHTML = "";

  function buildTreeUI(treeObj, currentPath) {
    const fragment = document.createDocumentFragment();

    for (let name in treeObj) {
      const node = treeObj[name];
      const fullPath = currentPath ? `${currentPath}/${name}` : name;
      const nodeEl = document.createElement("div");
      nodeEl.className = "tree-node";

      if (node.type === "folder") {
        const row = document.createElement("div");
        row.className = "tree-row";
        row.innerHTML = `<span>📁 <b>${name}</b></span>`;
        
        const actions = document.createElement("div");
        actions.className = "node-actions";
        
        const addBtn = document.createElement("button");
        addBtn.className = "node-btn";
        addBtn.textContent = "+";
        addBtn.onclick = (e) => { e.stopPropagation(); promptFolderAddChoice(fullPath); };

        const delBtn = document.createElement("button");
        delBtn.className = "node-btn";
        delBtn.textContent = "✕";
        delBtn.onclick = (e) => { e.stopPropagation(); deleteNode(fullPath); };

        actions.appendChild(addBtn);
        actions.appendChild(delBtn);
        row.appendChild(actions);

        const childrenContainer = document.createElement("div");
        childrenContainer.className = "tree-children";
        if (node.children) childrenContainer.appendChild(buildTreeUI(node.children, fullPath));

        nodeEl.appendChild(row);
        nodeEl.appendChild(childrenContainer);
      } else {
        const row = document.createElement("div");
        row.className = `tree-row ${fullPath === state.activeFilePath ? "active" : ""}`;
        row.onclick = () => switchTab(fullPath);

        let icon = "📄";
        if (name.endsWith(".css")) icon = "🎨";
        if (name.endsWith(".js")) icon = "⚡";

        row.innerHTML = `<span>${icon} ${name}</span>`;

        const actions = document.createElement("div");
        actions.className = "node-actions";
        const delBtn = document.createElement("button");
        delBtn.className = "node-btn";
        delBtn.textContent = "✕";
        delBtn.onclick = (e) => { e.stopPropagation(); deleteNode(fullPath); };

        actions.appendChild(delBtn);
        row.appendChild(actions);
        nodeEl.appendChild(row);
      }

      fragment.appendChild(nodeEl);
    }
    return fragment;
  }

  container.appendChild(buildTreeUI(state.projectData.tree, ""));
}

function promptFolderAddChoice(parentPath) {
  requestConsoleInput(`"${parentPath}" içine ekle (1: Dosya, 2: Klasör):`, "1", (choice) => {
    if (choice === "1") promptCreateFile(parentPath);
    else if (choice === "2") promptCreateFolder(parentPath);
  });
}

function promptCreateFile(parentPath = "") {
  requestConsoleInput("Dosya Adı (Örn: style.css):", "", (fileName) => {
    if (!fileName) return;
    let targetObj = state.projectData.tree;
    if (parentPath) {
      const parentNode = getNodeByPath(parentPath);
      if (parentNode && parentNode.type === "folder") {
        if (!parentNode.children) parentNode.children = {};
        targetObj = parentNode.children;
      }
    }
    if (targetObj[fileName]) { logToConsole("Bu dosya zaten mevcut.", "error"); return; }
    targetObj[fileName] = { type: "file", content: `/* ${fileName} */` };
    const newPath = parentPath ? `${parentPath}/${fileName}` : fileName;
    switchTab(newPath);
    logToConsole(`"${newPath}" oluşturuldu.`, "success");
  });
}

function promptCreateFolder(parentPath = "") {
  requestConsoleInput("Klasör Adı (Örn: utils):", "", (folderName) => {
    if (!folderName) return;
    let targetObj = state.projectData.tree;
    if (parentPath) {
      const parentNode = getNodeByPath(parentPath);
      if (parentNode && parentNode.type === "folder") {
        if (!parentNode.children) parentNode.children = {};
        targetObj = parentNode.children;
      }
    }
    if (targetObj[folderName]) { logToConsole("Bu klasör zaten mevcut.", "error"); return; }
    targetObj[folderName] = { type: "folder", children: {} };
    renderFileTree();
    logToConsole(`"${folderName}" klasörü oluşturuldu.`, "success");
  });
}

function deleteNode(path) {
  requestConsoleInput(`"${path}" silinsin mi? (Evet/Hayır):`, "Evet", (ans) => {
    if (ans.toLowerCase() === "evet" || ans.toLowerCase() === "e") {
      const parts = path.split("/").filter(Boolean);
      let curr = state.projectData.tree;
      for (let i = 0; i < parts.length - 1; i++) curr = curr[parts[i]].children;
      delete curr[parts[parts.length - 1]];
      closeTab(path);
      renderFileTree();
      logToConsole(`"${path}" silindi.`, "warn");
    }
  });
}