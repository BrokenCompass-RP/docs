function folderKey(segments) { return segments.join("/"); }

export function constructBrowse(identity, folderDefinitions, authorizedDocuments) {
  const byKey = new Map(folderDefinitions.map((folder) => [folderKey(folder.segments), {
    name: folder.name,
    slug: folder.segments.at(-1),
    segments: [...folder.segments],
    url: `/browse/${folder.segments.join("/")}`,
    documents: [],
    children: []
  }]));

  for (const document of authorizedDocuments) byKey.get(folderKey(document.browsePath))?.documents.push(document);
  for (const folder of byKey.values()) {
    if (folder.segments.length > 1) byKey.get(folderKey(folder.segments.slice(0, -1)))?.children.push(folder);
  }

  const finalize = (folder) => {
    folder.documents.sort((a, b) => a.title.localeCompare(b.title));
    folder.children = folder.children.map(finalize).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
    folder.documentCount = folder.documents.length + folder.children.reduce((sum, child) => sum + child.documentCount, 0);
    if (folder.documentCount === 0) return null;
    folder.preview = [...folder.documents.map((document) => document.title), ...folder.children.flatMap((child) => child.preview)].slice(0, 3);
    return folder;
  };

  const folders = [...byKey.values()]
    .filter((folder) => folder.segments.length === 1)
    .map(finalize)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
  return { identity, folders };
}

export function findBrowseFolder(browse, segments) {
  let folders = browse.folders;
  let current = null;
  for (const segment of segments) {
    current = folders.find((folder) => folder.slug === segment) ?? null;
    if (!current) return null;
    folders = current.children;
  }
  return current;
}
