/**
 * Sanal Ağaçtaki Dosyaları Birleştirip İframe'e Derleyen Motor
 */
function runCode() {
  if (state.activeFilePath) {
    const activeNode = getNodeByPath(state.activeFilePath);
    if (activeNode) activeNode.content = editor.getValue();
  }

  let mergedCSS = "";
  let mergedJS = "";
  let mainHTML = "<h1>index.html bulunamadı!</h1>";

  function traverseAndBundle(treeObj) {
    for (let name in treeObj) {
      const node = treeObj[name];
      if (node.type === "folder" && node.children) {
        traverseAndBundle(node.children);
      } else if (node.type === "file") {
        if (name.endsWith(".css")) mergedCSS += `\n/* --- ${name} --- */\n` + (node.content || "");
        else if (name.endsWith(".js")) mergedJS += `\n// --- ${name} ---\n` + (node.content || "");
        else if (name === "index.html") mainHTML = node.content || "";
      }
    }
  }

  traverseAndBundle(state.projectData.tree);

  const files = state.projectData.files;
  if (files) {
    for (let fname in files) {
      const regex = new RegExp(`(["'])${fname}\\1`, "g");
      mainHTML = mainHTML.replace(regex, `"${files[fname]}"`);
      mergedCSS = mergedCSS.replace(regex, `"${files[fname]}"`);
      mergedJS = mergedJS.replace(regex, `"${files[fname]}"`);
    }
  }

  const consoleScript = `
    <script>
      (function(){
        function sendLog(type, args){
          window.parent.postMessage({ type: 'PREVIEW_LOG', logLevel: type, msg: Array.from(args).join(' ') }, '*');
        }
        console.log = function(){ sendLog('info', arguments); };
        console.error = function(){ sendLog('error', arguments); };
        console.warn = function(){ sendLog('warn', arguments); };
        window.onerror = function(msg, url, line){ sendLog('error', [msg + ' (Satır: ' + line + ')']); };
      })();
    <\/script>
  `;

  const fullDocument = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      ${consoleScript}
      <style>${mergedCSS}</style>
    </head>
    <body>
      ${mainHTML}
      <script>
        try { ${mergedJS} } catch(err) { console.error(err.message); }
      <\/script>
    </body>
    </html>
  `;

  document.getElementById("preview").srcdoc = fullDocument;
  logToConsole("Dinamik proje derlendi.", "info");
}
