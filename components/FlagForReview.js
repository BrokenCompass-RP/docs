"use client";

import { useState } from "react";

const REASONS = [
  ["outdated", "Outdated"], ["incorrect", "Incorrect"], ["unclear", "Unclear"],
  ["missing-information", "Missing information"], ["something-else", "Something else"]
];

export function FlagForReview({ documentId, sectionId = null, sectionHeading = null }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch("/api/reviews", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, sectionId, reason, initialComment: comment, website: event.currentTarget.website.value })
    });
    const payload = await response.json();
    if (response.ok) {
      setStatus("Thanks. This has been sent for review.");
      setReason(""); setComment(""); setOpen(false);
    } else setStatus(payload.error ?? "The flag could not be submitted.");
    setBusy(false);
  }

  return <div className="flag-review">
    <button type="button" className="flag-trigger" onClick={() => setOpen((value) => !value)}>Flag for review</button>
    {open ? <form onSubmit={submit}>
      <strong>{sectionHeading ? `Flag “${sectionHeading}”` : "Flag this document"}</strong>
      <label>Reason<select required value={reason} onChange={(event) => setReason(event.target.value)}><option value="">Choose a reason</option>{REASONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label>What should we review?<textarea required maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} /></label>
      <label className="review-honeypot" aria-hidden="true">Website<input name="website" tabIndex="-1" autoComplete="off" /></label>
      <div><button type="button" className="quiet-button" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={busy}>Submit</button></div>
    </form> : null}
    {status ? <small role="status">{status}</small> : null}
  </div>;
}
