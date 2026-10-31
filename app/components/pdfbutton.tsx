import React from "react";
import { notify } from "../notify";

/** "Download PDF", with a moment of "Preparing…" while the file is built. */
export default function PdfButton({ build, label = "Download PDF", className = "" }: {
    build: () => Promise<void>
    label?: string
    className?: string
}) {
    const [busy, setBusy] = React.useState(false)
    async function onClick() {
        setBusy(true)
        try {
            await build()
        } catch {
            notify("Could not make the PDF. Please try again.", "error")
        } finally {
            setBusy(false)
        }
    }
    return (
        <button type="button" onClick={onClick} disabled={busy}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full border border-sage-200 bg-white px-3.5 text-sm font-medium text-sage-700 transition hover:bg-sage-50 disabled:cursor-wait disabled:opacity-70 ${className}`}>
            <i className={`bi ${busy ? "bi-arrow-repeat animate-spin" : "bi-file-earmark-pdf"}`} aria-hidden="true" />
            {busy ? "Preparing…" : label}
        </button>
    )
}
