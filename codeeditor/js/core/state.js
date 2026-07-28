/**
 * Uygulamanın Global State Yapısı
 */
const state = {
  selectedProject: null,
  activeFilePath: "index.html",
  openTabs: ["index.html"],
  projectData: {
    tree: {
      "index.html": { 
        type: "file", 
        content: "\n<div class=\"container\">\n  <h1>Onday Electronics Proje Mimarisi</h1>\n  <button id=\"btn\">Tıkla</button>\n</div>" 
      },
      "css": {
        type: "folder",
        children: {
          "style.css": { type: "file", content: "/* Ana Stiller */" }
        }
      },
      "js": {
        type: "folder",
        children: {
          "app.js": { type: "file", content: "// Uygulama Mantığı" }
        }
      }
    },
    files: {},
    notes: ""
  }
};

function getNodeByPath(path) {
  if (!path) return null;
  const parts = path.split("/").filter(Boolean);
  let curr = state.projectData.tree;
  for (let i = 0; i < parts.length; i++) {
    if (curr[parts[i]]) {
      if (i === parts.length - 1) return curr[parts[i]];
      curr = curr[parts[i]].children;
    } else {
      return null;
    }
  }
  return null;
}