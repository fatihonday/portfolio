/**
 * Yatay Şema Modalı ve İnteraktif SVG Ağacı
 */
let canvasScale = 1;
let canvasPanX = 40;
let canvasPanY = 40;
let isPanning = false;
let startX = 0, startY = 0;

function updateViewportTransform() {
  const vp = document.getElementById("schemaViewport");
  if (vp) vp.style.transform = `translate(${canvasPanX}px, ${canvasPanY}px) scale(${canvasScale})`;
}

function resetCanvasTransform() {
  canvasScale = 1;
  canvasPanX = 40;
  canvasPanY = 40;
  updateViewportTransform();
}

function initCanvasInteractions() {
  const container = document.getElementById("schemaCanvasContainer");
  if (!container) return;

  container.addEventListener("wheel", (e) => {
    e.preventDefault();
    const zoomFactor = 0.1;
    if (e.deltaY < 0) {
      canvasScale = Math.min(canvasScale + zoomFactor, 2.5);
    } else {
      canvasScale = Math.max(canvasScale - zoomFactor, 0.4);
    }
    updateViewportTransform();
  }, { passive: false });

  container.addEventListener("mousedown", (e) => {
    if (e.target.tagName === "BUTTON") return;
    isPanning = true;
    startX = e.clientX - canvasPanX;
    startY = e.clientY - canvasPanY;
  });

  window.addEventListener("mousemove", (e) => {
    if (!isPanning) return;
    canvasPanX = e.clientX - startX;
    canvasPanY = e.clientY - startY;
    updateViewportTransform();
  });

  window.addEventListener("mouseup", () => { isPanning = false; });
}

function renderCustomBlockSchema() {
  const nodesContainer = document.getElementById("nodesLayer");
  const svgContainer = document.getElementById("connectionsLayer");

  nodesContainer.innerHTML = "";
  svgContainer.innerHTML = "";

  const nodeWidth = 140;
  const nodeHeight = 32;
  const levelGapX = 200; 
  const rowGapY = 48;    

  let currentY = 20;
  let nodesList = [];

  function buildHorizontalTree(treeObj, depth = 1, parentId = "node_root") {
    for (let name in treeObj) {
      const node = treeObj[name];
      const id = "node_" + Math.random().toString(36).substr(2, 8);
      
      const nodeData = {
        id, name, type: node.type, parentId, depth,
        x: depth * levelGapX, y: currentY
      };

      nodesList.push(nodeData);
      currentY += rowGapY;

      if (node.type === "folder" && node.children) {
        buildHorizontalTree(node.children, depth + 1, id);
      }
    }
  }

  const rootId = "node_root";
  nodesList.push({
    id: rootId,
    name: state.selectedProject || "KÖK DİZİN",
    type: "root",
    parentId: null,
    depth: 0,
    x: 20,
    y: 20
  });

  currentY += rowGapY;
  buildHorizontalTree(state.projectData.tree, 1, rootId);

  let nodeMap = {};
  nodesList.forEach(n => nodeMap[n.id] = n);

  nodesList.forEach(node => {
    const nodeDiv = document.createElement("div");
    let icon = node.type === "root" ? "🚀" : (node.type === "folder" ? "📁" : "📄");
    if (node.name.endsWith(".css")) icon = "🎨";
    if (node.name.endsWith(".js")) icon = "⚡";

    nodeDiv.className = `block-node ${node.type}`;
    nodeDiv.style.left = node.x + "px";
    nodeDiv.style.top = node.y + "px";
    nodeDiv.title = node.name;
    nodeDiv.innerHTML = `<span>${icon}</span> <span style="overflow:hidden; text-overflow:ellipsis;">${node.name}</span>`;

    nodesContainer.appendChild(nodeDiv);

    if (node.parentId && nodeMap[node.parentId]) {
      const parent = nodeMap[node.parentId];
      const parentX = parent.x + nodeWidth;
      const parentY = parent.y + (nodeHeight / 2);
      const childX = node.x;
      const childY = node.y + (nodeHeight / 2);

      const midX = parentX + (childX - parentX) / 2;
      const pathData = `M ${parentX} ${parentY} L ${midX} ${parentY} L ${midX} ${childY} L ${childX} ${childY}`;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      path.setAttribute("stroke", "#007acc");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-linejoin", "round");

      svgContainer.appendChild(path);
    }
  });

  resetCanvasTransform();
}
