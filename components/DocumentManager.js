"use client";

import { useMemo, useState } from "react";
import { normalizeRichTextToMarkdown } from "../lib/paste-normalizer.js";
import { VISIBILITIES } from "../lib/visibility-policy.js";

const LABELS = {
  public: "Public",
  moderator: "Moderator",
  developer: "Developer",
  administrator: "Administrator"
};

function freshSection(defaultVisibility) {
  return {
    id: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    visibility: defaultVisibility,
    markdown: "## New section\n\nStart writing here."
  };
}

export function DocumentManager({ identity, documents, selectedSlug, initialDocument, initialHasDraft, initialCurrentVersion, initialVersions, initialReviews, browseLocations }) {
  const [document, setDocument] = useState(initialDocument);
  const [hasDraft, setHasDraft] = useState(initialHasDraft);
  const [filter, setFilter] = useState("");
  const [previewVisibility, setPreviewVisibility] = useState("public");
  const [previewHtml, setPreviewHtml] = useState("");
  const [status, setStatus] = useState(initialHasDraft ? "Unpublished draft loaded." : "Editing the canonical source as a new draft.");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(initialCurrentVersion);
  const [versions, setVersions] = useState(initialVersions);
  const [reviews, setReviews] = useState(initialReviews);
  const [showResolved, setShowResolved] = useState(false);
  const [commentBodies, setCommentBodies] = useState({});
  const [showNewDocument, setShowNewDocument] = useState(false);
  const [newDocument, setNewDocument] = useState({ title: "", description: "", browsePath: browseLocations[0]?.path.join("/") ?? "", defaultVisibility: "public" });
  const [imageForms, setImageForms] = useState({});

  const visibleDocuments = useMemo(() => documents.filter((item) =>
    item.title.toLowerCase().includes(filter.toLowerCase())
  ), [documents, filter]);

  const summary = useMemo(() => {
    const counts = { public: 0, moderator: 0, developer: 0, administrator: 0 };
    for (const section of document.sections) counts[section.visibility] += 1;
    return counts;
  }, [document.sections]);

  function updateSection(id, patch) {
    setDocument((current) => ({
      ...current,
      sections: current.sections.map((section) => section.id === id ? { ...section, ...patch } : section)
    }));
    setStatus("Unsaved draft changes.");
    setDirty(true);
  }

  function insertMarkup(id, before, after, placeholder) {
    const textarea = window.document.getElementById(`editor-${id}`);
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const section = document.sections.find((item) => item.id === id);
    const selected = section.markdown.slice(start, end) || placeholder;
    const replacement = `${before}${selected}${after}`;
    updateSection(id, { markdown: `${section.markdown.slice(0, start)}${replacement}${section.markdown.slice(end)}` });
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  function handlePaste(event, id) {
    const html = event.clipboardData.getData("text/html");
    if (!html) return;
    event.preventDefault();
    const markdown = normalizeRichTextToMarkdown(html, event.clipboardData.getData("text/plain"));
    const textarea = event.currentTarget;
    const section = document.sections.find((item) => item.id === id);
    updateSection(id, {
      markdown: `${section.markdown.slice(0, textarea.selectionStart)}${markdown}${section.markdown.slice(textarea.selectionEnd)}`
    });
  }

  async function saveDraft() {
    setBusy(true);
    const response = await fetch(`/api/manager/documents/${selectedSlug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(document)
    });
    const payload = await response.json();
    if (response.ok) {
      setDocument(payload.document);
      setHasDraft(true);
      setDirty(false);
      setStatus("Draft saved locally. Published content is unchanged.");
    } else {
      setStatus(`Draft not saved: ${payload.error}`);
    }
    setBusy(false);
  }

  async function createDocument(event) {
    event.preventDefault(); setBusy(true);
    const response = await fetch("/api/manager/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newDocument, browsePath: newDocument.browsePath.split("/") }) });
    const payload = await response.json();
    if (response.ok) window.location.assign(`/manager?document=${payload.document.slug}`);
    else { setStatus(`Document not created: ${payload.error}`); setBusy(false); }
  }

  async function uploadImage(event, section) {
    event.preventDefault(); const values = imageForms[section.id] ?? {}; const file = values.file;
    if (!file) { setStatus("Choose an image to upload."); return; }
    const form = new FormData(); form.set("image", file); form.set("alt", values.alt ?? ""); form.set("caption", values.caption ?? ""); form.set("visibility", section.visibility);
    setBusy(true);
    const response = await fetch(`/api/manager/documents/${selectedSlug}/assets`, { method: "POST", body: form });
    const payload = await response.json();
    if (response.ok) {
      updateSection(section.id, { markdown: `${section.markdown.trimEnd()}\n\n${payload.markdown}` });
      setImageForms((current) => ({ ...current, [section.id]: {} }));
      setStatus("Image uploaded and inserted. Save the draft to preserve the reference.");
    } else setStatus(`Image not uploaded: ${payload.error}`);
    setBusy(false);
  }

  async function discardDraft() {
    if (!window.confirm("Discard this unpublished draft and restore the canonical document?")) return;
    setBusy(true);
    await fetch(`/api/manager/documents/${selectedSlug}`, { method: "DELETE" });
    window.location.reload();
  }

  async function previewAs(visibility) {
    setPreviewVisibility(visibility);
    setBusy(true);
    const response = await fetch("/api/manager/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document, visibility, slug: selectedSlug })
    });
    const payload = await response.json();
    setPreviewHtml(response.ok ? payload.html : `<p>${payload.error}</p>`);
    setBusy(false);
  }

  async function publishDraft() {
    if (!window.confirm("Publish this saved draft immediately?")) return;
    setBusy(true);
    const response = await fetch(`/api/manager/documents/${selectedSlug}/publish`, { method: "POST" });
    const payload = await response.json();
    if (response.ok) {
      setCurrentVersion(payload.version);
      setVersions((items) => [payload.version, ...items]);
      setHasDraft(false);
      setDirty(false);
      setStatus(`${payload.version.versionId} published. Readers and search now use it.`);
      window.setTimeout(() => window.location.reload(), 500);
    } else setStatus(`Publish failed: ${payload.error}`);
    setBusy(false);
  }

  async function recoverVersion(versionId) {
    if (!window.confirm(`Recover ${versionId} as a new published version?`)) return;
    setBusy(true);
    const response = await fetch(`/api/manager/documents/${selectedSlug}/versions`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ versionId })
    });
    const payload = await response.json();
    if (response.ok) {
      setCurrentVersion(payload.version);
      setVersions((items) => [payload.version, ...items]);
      setStatus(`${versionId} recovered as ${payload.version.versionId}.`);
    } else setStatus(`Recovery failed: ${payload.error}`);
    setBusy(false);
  }

  async function addReviewComment(flagId) {
    const body = commentBodies[flagId] ?? "";
    if (!body.trim()) return;
    setBusy(true);
    const response = await fetch(`/api/manager/documents/${selectedSlug}/reviews/${flagId}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body })
    });
    const payload = await response.json();
    if (response.ok) {
      setReviews((items) => items.map((item) => item.flagId === flagId ? { ...item, comments: [...item.comments, payload.comment] } : item));
      setCommentBodies((items) => ({ ...items, [flagId]: "" }));
      setStatus("Review comment added.");
    } else setStatus(`Comment failed: ${payload.error}`);
    setBusy(false);
  }

  async function resolveReview(flagId) {
    if (!window.confirm("Resolve this flag? Publishing does not happen automatically.")) return;
    setBusy(true);
    const response = await fetch(`/api/manager/documents/${selectedSlug}/reviews/${flagId}/resolve`, { method: "POST" });
    const payload = await response.json();
    if (response.ok) {
      setReviews((items) => items.map((item) => item.flagId === flagId ? payload.review : item));
      setStatus("Flag resolved.");
    } else setStatus(`Resolution failed: ${payload.error}`);
    setBusy(false);
  }

  return (
    <main className="manager-shell">
      <header className="manager-header">
        <div>
          <p className="eyebrow">Broken Compass knowledge</p>
          <strong>Document Manager</strong>
        </div>
        <div className="manager-identity"><span>Development author</span><strong>{LABELS[identity]}</strong></div>
      </header>

      <aside className="manager-sidebar">
        <label htmlFor="document-filter">Documents</label>
        <input id="document-filter" type="search" placeholder="Filter documents" value={filter} onChange={(event) => setFilter(event.target.value)} />
        <button type="button" className="new-document-button" onClick={() => setShowNewDocument((value) => !value)}>+ New document</button>
        <nav aria-label="Managed documents">
          {visibleDocuments.map((item) => (
            <a className={item.slug === selectedSlug ? "manager-doc active" : "manager-doc"} href={`/manager?document=${item.slug}`} key={item.slug}>
              <span>{item.title}</span>
              <small>{LABELS[item.defaultVisibility]}{item.hasDraft ? " · Draft" : ""}{item.openFlags ? ` · ${item.openFlags} open flag${item.openFlags === 1 ? "" : "s"}` : ""}</small>
            </a>
          ))}
        </nav>
        <a className="manager-back" href="/search">← Return to reader</a>
      </aside>

      <section className="manager-workspace">
        {showNewDocument ? <form className="new-document-panel" onSubmit={createDocument}>
          <div><p className="eyebrow">Canonical document</p><h2>New document</h2></div>
          <label>Title<input required value={newDocument.title} onChange={(event) => setNewDocument({ ...newDocument, title: event.target.value })} /></label>
          <label>Description<input value={newDocument.description} onChange={(event) => setNewDocument({ ...newDocument, description: event.target.value })} /></label>
          <label>Browse location<select required value={newDocument.browsePath} onChange={(event) => setNewDocument({ ...newDocument, browsePath: event.target.value })}>{browseLocations.map((location) => <option value={location.path.join("/")} key={location.path.join("/")}>{location.path.map((part) => part.replaceAll("-", " ")).join(" → ")}</option>)}</select></label>
          <label>Default visibility<select value={newDocument.defaultVisibility} onChange={(event) => setNewDocument({ ...newDocument, defaultVisibility: event.target.value })}>{VISIBILITIES.map((value) => <option value={value} key={value}>{LABELS[value]}</option>)}</select></label>
          <div><button className="primary-button" disabled={busy} type="submit">Create draft</button><button className="quiet-button" type="button" onClick={() => setShowNewDocument(false)}>Cancel</button></div>
        </form> : null}
        <div className="manager-title-row">
          <div>
            <p className="eyebrow">{hasDraft ? "Unpublished changes" : "Draft changes"}</p>
            <h1>{document.title}</h1>
          </div>
          <div className="manager-actions">
            <button type="button" className="quiet-button" onClick={discardDraft} disabled={busy || !hasDraft}>Discard draft</button>
            <button type="button" className="primary-button" onClick={saveDraft} disabled={busy}>Save draft</button>
            <button type="button" className="primary-button" onClick={publishDraft} disabled={busy || !hasDraft || dirty} title={dirty ? "Save changes before publishing" : undefined}>Publish draft</button>
          </div>
        </div>

        <div className="document-fields">
          <label>Title<input value={document.title} onChange={(event) => { setDocument({ ...document, title: event.target.value }); setDirty(true); setStatus("Unsaved draft changes."); }} /></label>
          <label>Description<input value={document.description} onChange={(event) => { setDocument({ ...document, description: event.target.value }); setDirty(true); setStatus("Unsaved draft changes."); }} /></label>
          <label>Default visibility<select value={document.defaultVisibility} onChange={(event) => { setDocument({ ...document, defaultVisibility: event.target.value }); setDirty(true); setStatus("Unsaved draft changes."); }}>{VISIBILITIES.map((value) => <option value={value} key={value}>{LABELS[value]}</option>)}</select></label>
          <label>Browse location<select value={document.browsePath.join("/")} onChange={(event) => { setDocument({ ...document, browsePath: event.target.value.split("/") }); setDirty(true); setStatus("Unsaved draft changes."); }}>{browseLocations.map((location) => <option value={location.path.join("/")} key={location.path.join("/")}>{location.path.map((part) => part.replaceAll("-", " ")).join(" → ")}</option>)}</select></label>
        </div>

        <div className="visibility-summary" aria-label="Visibility summary">
          {VISIBILITIES.map((value) => <div key={value}><span>{LABELS[value]}</span><strong>{summary[value]}</strong><small>{value === document.defaultVisibility ? "default sections" : "additional sections"}</small></div>)}
        </div>

        <div className="section-stack">
          {document.sections.map((section, index) => (
            <section className={`editor-section visibility-${section.visibility}`} key={section.id}>
              <header>
                <span>Section {index + 1}</span>
                <label>Visibility<select value={section.visibility} onChange={(event) => updateSection(section.id, { visibility: event.target.value })}>{VISIBILITIES.map((value) => <option key={value} value={value}>{LABELS[value]}</option>)}</select></label>
                <button type="button" className="text-button" disabled={document.sections.length === 1} onClick={() => setDocument({ ...document, sections: document.sections.filter((item) => item.id !== section.id) })}>Remove</button>
              </header>
              <div className="format-toolbar" aria-label={`Formatting tools for section ${index + 1}`}>
                <button type="button" onClick={() => insertMarkup(section.id, "## ", "", "Heading")}>H2</button>
                <button type="button" onClick={() => insertMarkup(section.id, "**", "**", "bold text")}><strong>B</strong></button>
                <button type="button" onClick={() => insertMarkup(section.id, "*", "*", "italic text")}><em>I</em></button>
                <button type="button" onClick={() => insertMarkup(section.id, "- ", "", "list item")}>• List</button>
                <button type="button" onClick={() => insertMarkup(section.id, "1. ", "", "list item")}>1. List</button>
                <button type="button" onClick={() => insertMarkup(section.id, "[", "](https://example.com)", "link text")}>Link</button>
                <button type="button" onClick={() => insertMarkup(section.id, "`", "`", "code")}>Code</button>
                <button type="button" onClick={() => insertMarkup(section.id, "```\n", "\n```", "code block")}>Code block</button>
              </div>
              <textarea id={`editor-${section.id}`} value={section.markdown} onChange={(event) => updateSection(section.id, { markdown: event.target.value })} onPaste={(event) => handlePaste(event, section.id)} spellCheck="true" />
              <form className="image-insert" onSubmit={(event) => uploadImage(event, section)}>
                <label>Image<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => setImageForms((current) => ({ ...current, [section.id]: { ...(current[section.id] ?? {}), file: event.target.files?.[0] } }))} /></label>
                <label>Alt text <span>(required)</span><input required value={imageForms[section.id]?.alt ?? ""} onChange={(event) => setImageForms((current) => ({ ...current, [section.id]: { ...(current[section.id] ?? {}), alt: event.target.value } }))} /></label>
                <label>Caption <span>(optional)</span><input value={imageForms[section.id]?.caption ?? ""} onChange={(event) => setImageForms((current) => ({ ...current, [section.id]: { ...(current[section.id] ?? {}), caption: event.target.value } }))} /></label>
                <button type="submit" className="quiet-button" disabled={busy}>Upload and insert</button>
              </form>
            </section>
          ))}
          <button type="button" className="add-section" onClick={() => setDocument({ ...document, sections: [...document.sections, freshSection(document.defaultVisibility)] })}>+ Add coherent section</button>
        </div>

        <p className="manager-status" aria-live="polite">{status}</p>

        <section className="review-panel">
          <header><div><p className="eyebrow">Document review</p><h2>Open flags</h2></div><button type="button" className="quiet-button" onClick={() => setShowResolved((value) => !value)}>{showResolved ? "Hide resolved" : "Show resolved"}</button></header>
          {reviews.filter((review) => review.status === "open" || showResolved).length ? reviews.filter((review) => review.status === "open" || showResolved).map((review) => <article className="review-item" key={review.flagId}>
            <header><div><strong>{review.sectionHeading ?? "Whole document"}</strong><span className={`review-status ${review.status}`}>{review.status === "open" ? "Open" : "Resolved"}</span></div><small>{review.reason.replaceAll("-", " ")} · Reported {new Date(review.createdAt).toLocaleString()} against {review.versionAtReport}</small></header>
            <blockquote>{review.initialComment}</blockquote>
            {review.comments.length ? <ol>{review.comments.map((comment) => <li key={comment.commentId}><strong>{LABELS[comment.authorIdentity] ?? comment.authorIdentity}</strong> <small>{new Date(comment.createdAt).toLocaleString()}</small><p>{comment.body}</p></li>)}</ol> : null}
            {review.resolution ? <p className="resolution-note">Resolved by {LABELS[review.resolution.resolvedBy] ?? review.resolution.resolvedBy} on {new Date(review.resolution.resolvedAt).toLocaleString()} against {review.resolution.versionAtResolution}.</p> : <div className="review-actions"><label>Add comment<textarea value={commentBodies[review.flagId] ?? ""} onChange={(event) => setCommentBodies((items) => ({ ...items, [review.flagId]: event.target.value }))} maxLength={2000} /></label><button type="button" className="quiet-button" disabled={busy || !(commentBodies[review.flagId] ?? "").trim()} onClick={() => addReviewComment(review.flagId)}>Add comment</button><button type="button" className="primary-button" disabled={busy} onClick={() => resolveReview(review.flagId)}>Resolve</button></div>}
          </article>) : <p className="review-empty">No open flags for this document.</p>}
        </section>

        <section className="version-panel">
          <div><p className="eyebrow">Published record</p><h2>Version history</h2></div>
          {currentVersion ? <p>Current <strong>{currentVersion.versionId}</strong> · First published {currentVersion.firstPublished ? new Date(currentVersion.firstPublished).toLocaleString() : "Unknown"} · Last updated {new Date(currentVersion.publishedAt).toLocaleString()}</p> : <p>This document has not been published.</p>}
          <ol>
            {versions.map((version) => <li key={version.versionId}>
              <span><strong>{version.versionId}</strong> · {version.publicationKind} by {version.publishedBy} · {new Date(version.publishedAt).toLocaleString()}</span>
              <button type="button" className="quiet-button" disabled={busy || version.versionId === currentVersion?.versionId} onClick={() => recoverVersion(version.versionId)}>Recover</button>
            </li>)}
          </ol>
        </section>

        <section className="preview-panel">
          <header>
            <div><p className="eyebrow">Server-authorized projection</p><h2>Preview</h2></div>
            <div className="preview-tabs" role="group" aria-label="Preview visibility">
              {VISIBILITIES.map((value) => <button type="button" className={previewVisibility === value ? "active" : ""} onClick={() => previewAs(value)} key={value}>{LABELS[value]}</button>)}
            </div>
          </header>
          {previewHtml ? <div className="markdown preview-content" dangerouslySetInnerHTML={{ __html: previewHtml }} /> : <div className="preview-empty">Choose an audience to render the current unsaved draft through the canonical authorization system.</div>}
        </section>
      </section>
    </main>
  );
}
