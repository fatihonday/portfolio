/**
 * LocalForage Veritabanı Servisi
 */
async function getProjects() {
  return (await window.localforage.getItem("projects")) || {};
}

async function setProjects(projects) {
  await window.localforage.setItem("projects", projects);
}
