/**
 * Global Uygulama Durumu (State) ve Ağaç Yardımcıları
 */
const state = {
  selectedProject: null,
  activeFilePath: null,
  selectedNodes: [], // Çoklu seçim için seçili dosya/klasör path'leri dizisi
  openTabs: [],
  projectData: {
    tree: {},
    files: {},
    notes: ""
  }
};

/**
 * Sanal ağaç üzerinde dosya yoluna (path) göre düğüm bulma
 */
function getNodeByPath(path) {
  if (!path) return null;
  const parts = path.split("/");
  let current = state.projectData.tree;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!current || !current[part]) return null;
    if (i === parts.length - 1) return current[part];
    current = current[part].children;
  }
  return null;
}

/**
 * Sanal ağaca yeni dosya veya klasör ekleme
 */
function createNodeByPath(path, type = "file", content = "") {
  const parts = path.split("/");
  let current = state.projectData.tree;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLast = (i === parts.length - 1);

    if (isLast) {
      if (type === "folder") {
        current[part] = current[part] || { type: "folder", children: {} };
      } else {
        current[part] = { type: "file", content: content };
      }
    } else {
      if (!current[part] || current[part].type !== "folder") {
        current[part] = { type: "folder", children: {} };
      }
      if (!current[part].children) {
        current[part].children = {};
      }
      current = current[part].children;
    }
  }
}

/**
 * Sanal ağaçtan dosya veya klasör silme
 */
function deleteNodeByPath(path) {
  const parts = path.split("/");
  const fileName = parts.pop();
  let current = state.projectData.tree;

  for (let part of parts) {
    if (!current[part] || !current[part].children) return;
    current = current[part].children;
  }

  delete current[fileName];
}

/**
 * Dosya veya Klasörü Yeniden Adlandırma
 */
function renameNode(oldPath, newName) {
  if (!oldPath || !newName) return false;
  const parts = oldPath.split("/");
  const oldName = parts.pop();
  if (oldName === newName) return false;

  const parentPath = parts.join("/");
  let parentObj = state.projectData.tree;
  if (parentPath) {
    const parentNode = getNodeByPath(parentPath);
    if (parentNode && parentNode.children) parentObj = parentNode.children;
  }

  if (parentObj[newName]) {
    logToConsole(`"${newName}" adında bir öğe zaten var.`, "warn");
    return false;
  }

  const targetNode = parentObj[oldName];
  delete parentObj[oldName];
  parentObj[newName] = targetNode;

  const newPath = parentPath ? `${parentPath}/${newName}` : newName;

  // Açık sekmeleri güncelle
  state.openTabs = state.openTabs.map(p => {
    if (p === oldPath) return newPath;
    if (p.startsWith(oldPath + "/")) return p.replace(oldPath, newPath);
    return p;
  });

  if (state.activeFilePath) {
    if (state.activeFilePath === oldPath) state.activeFilePath = newPath;
    else if (state.activeFilePath.startsWith(oldPath + "/")) {
      state.activeFilePath = state.activeFilePath.replace(oldPath, newPath);
    }
  }

  return true;
}

/**
 * Sanal ağaç üzerinde dosya/klasör taşıma işlemi (Mimari taşıma)
 */
function moveNode(srcPath, targetFolderPath) {
  if (srcPath === targetFolderPath) return false;
  if (targetFolderPath && targetFolderPath.startsWith(srcPath + "/")) return false;

  const srcParts = srcPath.split("/");
  const nodeName = srcParts.pop();
  
  const parentPath = srcParts.join("/");
  let parentObj = state.projectData.tree;
  if (parentPath) {
    const parentNode = getNodeByPath(parentPath);
    if (parentNode && parentNode.children) parentObj = parentNode.children;
  }

  const targetNode = parentObj[nodeName];
  if (!targetNode) return false;

  let targetObj = state.projectData.tree;
  if (targetFolderPath) {
    const destFolderNode = getNodeByPath(targetFolderPath);
    if (destFolderNode && destFolderNode.type === "folder") {
      if (!destFolderNode.children) destFolderNode.children = {};
      targetObj = destFolderNode.children;
    } else {
      return false;
    }
  }

  if (targetObj[nodeName]) {
    logToConsole(`"${nodeName}" zaten bu hedefte var.`, "warn");
    return false;
  }

  delete parentObj[nodeName];
  targetObj[nodeName] = targetNode;

  const oldPrefix = srcPath;
  const newPrefix = targetFolderPath ? `${targetFolderPath}/${nodeName}` : nodeName;

  state.openTabs = state.openTabs.map(p => {
    if (p === oldPrefix) return newPrefix;
    if (p.startsWith(oldPrefix + "/")) return p.replace(oldPrefix, newPrefix);
    return p;
  });

  if (state.activeFilePath) {
    if (state.activeFilePath === oldPrefix) state.activeFilePath = newPrefix;
    else if (state.activeFilePath.startsWith(oldPrefix + "/")) {
      state.activeFilePath = state.activeFilePath.replace(oldPrefix, newPrefix);
    }
  }

  return true;
}

/**
 * Sadece Görünüm/Sıralama Değiştirme (Aşağı/Yukarı Kaydırma)
 * @param {string} path - Kaydırılacak öğenin yolu
 * @param {string} direction - 'up' (yukarı) veya 'down' (aşağı)
 */
function reorderNode(path, direction) {
  const parts = path.split("/");
  const nodeName = parts.pop();
  const parentPath = parts.join("/");

  let parentObj = state.projectData.tree;
  if (parentPath) {
    const parentNode = getNodeByPath(parentPath);
    if (parentNode && parentNode.children) parentObj = parentNode.children;
  }

  const keys = Object.keys(parentObj);
  const index = keys.indexOf(nodeName);

  if (index === -1) return false;

  if (direction === "up" && index > 0) {
    const temp = keys[index];
    keys[index] = keys[index - 1];
    keys[index - 1] = temp;
  } else if (direction === "down" && index < keys.length - 1) {
    const temp = keys[index];
    keys[index] = keys[index + 1];
    keys[index + 1] = temp;
  } else {
    return false; // Sıra değişmedi (en üstte veya en altta)
  }

  // Nesneyi yeni key sırasıyla yeniden oluşturup ebeveyne ata
  const reorderedObj = {};
  keys.forEach(k => {
    reorderedObj[k] = parentObj[k];
  });

  if (parentPath) {
    const parentNode = getNodeByPath(parentPath);
    parentNode.children = reorderedObj;
  } else {
    state.projectData.tree = reorderedObj;
  }

  return true;
}

/**
 * Projedeki tüm klasörlerin path listesini döndüren yardımcı fonksiyon
 */
function getAllFolderPaths() {
  const folders = ["/"]; // Kök dizin
  
  function traverse(treeObj, currentPath = "") {
    for (let name in treeObj) {
      const node = treeObj[name];
      if (node.type === "folder") {
        const fullPath = currentPath ? `${currentPath}/${name}` : name;
        folders.push(fullPath);
        if (node.children) traverse(node.children, fullPath);
      }
    }
  }

  traverse(state.projectData.tree);
  return folders;
}
