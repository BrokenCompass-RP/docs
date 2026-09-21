const keyFor = (segments) => segments.join("/");

export function ancestorFolderKeys(path = []) {
  return path.map((_, index) => keyFor(path.slice(0, index + 1)));
}

export function constructManagerTree(folderDefinitions, documents, filter = "") {
  const query = filter.trim().toLocaleLowerCase();
  const folders = new Map(folderDefinitions.map((folder) => [keyFor(folder.segments), {
    ...folder, key: keyFor(folder.segments), documents: [], children: []
  }]));

  for (const document of documents) {
    if (query && !document.title.toLocaleLowerCase().includes(query)) continue;
    folders.get(keyFor(document.browsePath))?.documents.push(document);
  }
  for (const folder of folders.values()) {
    if (folder.segments.length > 1) folders.get(keyFor(folder.segments.slice(0, -1)))?.children.push(folder);
  }

  const finalize = (folder) => {
    folder.documents.sort((a, b) => a.title.localeCompare(b.title));
    folder.children = folder.children.map(finalize).filter((child) => !query || child.hasMatches).sort((a, b) => a.name.localeCompare(b.name));
    folder.hasMatches = folder.documents.length > 0 || folder.children.some((child) => child.hasMatches);
    return folder;
  };

  return [...folders.values()]
    .filter((folder) => folder.segments.length === 1)
    .map(finalize)
    .filter((folder) => !query || folder.hasMatches);
}
