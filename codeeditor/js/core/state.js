/**
 * Global Uygulama Durumu (State) ve Ağaç Yardımcıları
 */
const state = {
  selectedProject: null,
  activeFilePath: null,
  selectedNodes: [],
  openTabs: [],
  isDirty: false, // Kaydedilmeyen değişiklik takibi
  projectData: {
    tree: {},
    files: {},
    notes: ""
  }
};

/**
 * Sanal Ağaç Üzerinde Yola (Path) Göre Düğüm Getirme
 */
function getNodeByPath(path) {
  if (!path || !state.projectData || !state.projectData.tree) return null;
  const parts = path.split("/");
  let current = state.projectData.tree;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!current[part]) return null;
    if (i === parts.length - 1) return current[part];
    if (current[part].type === "folder") {
      current = current[part].children;
    } else {
      return null;
    }
  }
  return null;
}

/**
 * Sanal Ağaçta Yola Göre Düğüm Oluşturma
 */
function createNodeByPath(path, type = "file", content = "") {
  if (!path || !state.projectData) return false;
  if (!state.projectData.tree) state.projectData.tree = {};

  const parts = path.split("/");
  let current = state.projectData.tree;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLast = (i === parts.length - 1);

    if (isLast) {
      if (type === "folder") {
        current[part] = { type: "folder", children: current[part]?.children || {} };
      } else {
        current[part] = { type: "file", content: content };
      }
    } else {
      if (!current[part] || current[part].type !== "folder") {
        current[part] = { type: "folder", children: {} };
      }
      current = current[part].children;
    }
  }
  return true;
}

/**
 * Sanal Ağaçtan Yola Göre Düğüm Silme
 */
function deleteNodeByPath(path) {
  if (!path || !state.projectData || !state.projectData.tree) return false;
  const parts = path.split("/");
  let current = state.projectData.tree;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || current[part].type !== "folder") return false;
    current = current[part].children;
  }

  const lastPart = parts[parts.length - 1];
  if (current[lastPart]) {
    delete current[lastPart];
    return true;
  }
  return false;
}

/**
 * Düğüm Yeniden Adlandırma
 */
function renameNode(oldPath, newName) {
  const node = getNodeByPath(oldPath);
  if (!node) return false;

  const parts = oldPath.split("/");
  parts.pop();
  const parentPath = parts.join("/");
  const newPath = parentPath ? `${parentPath}/${newName}` : newName;

  if (getNodeByPath(newPath)) return false; // Aynı isimde dosya var

  deleteNodeByPath(oldPath);
  
  if (node.type === "file") {
    createNodeByPath(newPath, "file", node.content);
  } else {
    createNodeByPath(newPath, "folder");
    const newNode = getNodeByPath(newPath);
    newNode.children = node.children;
  }

  // Açık sekmeleri ve aktif yolu güncelle
  state.openTabs = state.openTabs.map(p => p === oldPath ? newPath : p);
  if (state.activeFilePath === oldPath) state.activeFilePath = newPath;

  return true;
}

/**
 * Düğüm Taşıma
 */
function moveNode(srcPath, targetFolderPath) {
  const node = getNodeByPath(srcPath);
  if (!node) return false;

  const fileName = srcPath.split("/").pop();
  const newPath = targetFolderPath ? `${targetFolderPath}/${fileName}` : fileName;

  if (srcPath === newPath) return false;
  if (getNodeByPath(newPath)) return false;

  deleteNodeByPath(srcPath);

  if (node.type === "file") {
    createNodeByPath(newPath, "file", node.content);
  } else {
    createNodeByPath(newPath, "folder");
    const newNode = getNodeByPath(newPath);
    newNode.children = node.children;
  }

  state.openTabs = state.openTabs.map(p => p === srcPath ? newPath : p);
  if (state.activeFilePath === srcPath) state.activeFilePath = newPath;

  return true;
}

/**
 * Ağaç Düğüm Sırasını Yukarı / Aşağı Kaydırma
 */
function reorderNode(path, direction) {
  const parts = path.split("/");
  const nodeName = parts.pop();
  let parentObj = state.projectData.tree;

  for (let p of parts) {
    if (parentObj[p] && parentObj[p].type === "folder") {
      parentObj = parentObj[p].children;
    } else {
      return false;
    }
  }

  const keys = Object.keys(parentObj);
  const index = keys.indexOf(nodeName);
  if (index === -1) return false;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= keys.length) return false;

  // Sıralamayı yeniden dizayn et
  const newKeys = [...keys];
  const temp = newKeys[index];
  newKeys[index] = newKeys[targetIndex];
  newKeys[targetIndex] = temp;

  const newParentObj = {};
  newKeys.forEach(k => {
    newParentObj[k] = parentObj[k];
  });

  if (parts.length === 0) {
    state.projectData.tree = newParentObj;
  } else {
    let curr = state.projectData.tree;
    for (let i = 0; i < parts.length - 1; i++) {
      curr = curr[parts[i]].children;
    }
    curr[parts[parts.length - 1]].children = newParentObj;
  }

  return true;
}

/**
 * Tüm Klasör Yollarını Liste Yapar
 */
function getAllFolderPaths(treeObj = state.projectData.tree, currentPath = "", result = ["/"]) {
  for (let name in treeObj) {
    const node = treeObj[name];
    if (node.type === "folder") {
      const fullPath = currentPath ? `${currentPath}/${name}` : name;
      result.push(fullPath);
      if (node.children) {
        getAllFolderPaths(node.children, fullPath, result);
      }
    }
  }
  return result;
}