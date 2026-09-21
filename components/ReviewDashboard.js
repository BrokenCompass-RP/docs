"use client";

import { useState } from "react";

export function ReviewDashboard({ initialReviews }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [status, setStatus] = useState("open");
  const [bodies, setBodies] = useState({});
  const [message, setMessage] = useState("");

  async function addComment(review) {
    const body = bodies[review.flagId] ?? "";
    if (!body.trim()) return;
    const response = await fetch(`/api/manager/documents/${review.documentSlug}/reviews/${review.flagId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
    const payload = await response.json();
    if (response.ok) {
      setReviews((items) => items.map((item) => item.flagId === review.flagId ? { ...item, comments: [...item.comments, payload.comment] } : item));
      setBodies((items) => ({ ...items, [review.flagId]: "" }));
      setMessage("Review comment added.");
    } else setMessage(`Comment failed: ${payload.error}`);
  }

  async function resolve(review) {
    if (!window.confirm("Resolve this flag? Publishing does not happen automatically.")) return;
    const response = await fetch(`/api/manager/documents/${review.documentSlug}/reviews/${review.flagId}/resolve`, { method: "POST" });
    const payload = await response.json();
    if (response.ok) {
      setReviews((items) => items.map((item) => item.flagId === review.flagId ? { ...item, ...payload.review } : item));
      setMessage("Flag resolved.");
    } else setMessage(`Resolution failed: ${payload.error}`);
  }

  const visible = reviews.filter((review) => review.status === status);
  return <section className="review-dashboard">
    <header className="review-dashboard-header">
      <div><p className="eyebrow">Knowledge maintenance</p><h1>Review flags</h1></div>
      <div className="review-filter" role="group" aria-label="Review status">
        <button className={status === "open" ? "active" : ""} type="button" onClick={() => setStatus("open")}>Open</button>
        <button className={status === "resolved" ? "active" : ""} type="button" onClick={() => setStatus("resolved")}>Resolved</button>
      </div>
    </header>
    {visible.length ? visible.map((review) => <article className="review-item" key={review.flagId}>
      <header><div><strong>{review.documentTitle}</strong><span className={`review-status ${review.status}`}>{review.status}</span></div><small>{review.sectionHeading ?? "Whole document"} · {review.reason.replaceAll("-", " ")} · {new Date(review.createdAt).toLocaleString()}</small></header>
      <p><a href={`${review.documentUrl}${review.sectionId ? `#${review.sectionId}` : ""}`}>Open affected knowledge</a></p>
      {review.reporterIdentity ? <small>Reported by {review.reporterIdentity}</small> : null}
      <blockquote>{review.initialComment}</blockquote>
      {review.comments.length ? <ol>{review.comments.map((comment) => <li key={comment.commentId}><strong>{comment.authorIdentity}</strong> <small>{new Date(comment.createdAt).toLocaleString()}</small><p>{comment.body}</p></li>)}</ol> : null}
      {review.status === "open" ? <div className="review-actions"><label>Add comment<textarea maxLength={2000} value={bodies[review.flagId] ?? ""} onChange={(event) => setBodies((items) => ({ ...items, [review.flagId]: event.target.value }))} /></label><button type="button" className="quiet-button" onClick={() => addComment(review)}>Add comment</button><button type="button" className="primary-button" onClick={() => resolve(review)}>Resolve</button></div> : null}
    </article>) : <p className="review-empty">No {status} flags in the current authorized view.</p>}
    <p className="manager-status" aria-live="polite">{message}</p>
  </section>;
}
