import React from "react";
import type { jsPDF } from "jspdf";
import Modal from "./modal";
import { primaryButton, secondaryButton } from "./form";
import { notify } from "../notify";
import { buildPdf, type PdfReport } from "../pdf";

/** "PDF": gathers the report, then shows it in a preview with a Download button. */
export default function PdfButton({ report, label = "PDF", className = "" }: {
    /** Collects the report's data. Runs when the button is pressed, not before. */
    report: () => PdfReport | Promise<PdfReport>
    label?: string
    className?: string
}) {
    const [busy, setBusy] = React.useState(false)
    const [ready, setReady] = React.useState<PdfReport | null>(null)
    async function onClick() {
        setBusy(true)
        try {
            setReady(await report())
        } catch {
            notify("Could not make the PDF. Please try again.", "error")
        } finally {
            setBusy(false)
        }
    }
    return (
        <>
            <button type="button" onClick={onClick} disabled={busy}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full border border-sage-200 bg-white px-3.5 text-sm font-medium text-sage-700 transition hover:bg-sage-50 disabled:cursor-wait disabled:opacity-70 ${className}`}>
                <i className={`bi ${busy ? "bi-arrow-repeat animate-spin" : "bi-file-earmark-pdf"}`} aria-hidden="true" />
                {busy ? "Preparing…" : label}
            </button>
            {ready && <PdfPreview report={ready} onClose={() => setReady(null)} />}
        </>
    )
}

/** The PDF exactly as it will download, in the browser's own viewer, before saving it. */
export function PdfPreview({ report, onClose, onBack }: { report: PdfReport; onClose: () => void; onBack?: () => void }) {
    const [doc, setDoc] = React.useState<jsPDF | null>(null)
    const [url, setUrl] = React.useState("")
    const [failed, setFailed] = React.useState(false)
    // Some browsers (and phones) can't show a PDF inside a page; they still download it fine.
    const canPreview = typeof navigator === "undefined" || navigator.pdfViewerEnabled !== false

    React.useEffect(() => {
        let objectUrl = ""
        let cancelled = false
        buildPdf(report).then(built => {
            if (cancelled) return
            objectUrl = URL.createObjectURL(built.output("blob"))
            setDoc(built)
            setUrl(objectUrl)
        }).catch(() => { if (!cancelled) setFailed(true) })
        return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl) }
    }, [report])

    const pages = doc?.getNumberOfPages() ?? 0
    return (
        <Modal title={`Preview: ${report.title}`} onClose={onClose} width={960}>
            <div className="flex min-h-0 flex-1 flex-col bg-sage-100">
                {failed ? (
                    <p role="alert" className="m-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Could not make the PDF. Please try again.</p>
                ) : !url ? (
                    <div className="flex h-[70vh] items-center justify-center text-sm text-sage-500" role="status">
                        <i className="bi bi-arrow-repeat mr-2 animate-spin" aria-hidden="true" /> Making the PDF…
                    </div>
                ) : canPreview ? (
                    <iframe title={`${report.title} preview`} src={`${url}#view=FitH`} className="h-[70vh] w-full border-0 bg-white" />
                ) : (
                    <div className="flex h-60 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-sage-600">
                        <i className="bi bi-file-earmark-pdf text-3xl text-sage-400" aria-hidden="true" />
                        This browser can't show PDFs inside the page. Download it to open it.
                    </div>
                )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sage-100 px-6 py-4">
                <p className="m-0 text-xs text-sage-500">
                    {report.filename}{pages ? ` · ${pages} page${pages === 1 ? "" : "s"}` : ""}
                </p>
                <div className="flex gap-2">
                    {onBack
                        ? <button type="button" onClick={onBack} className={secondaryButton}><i className="bi bi-arrow-left" aria-hidden="true" /> Back</button>
                        : <button type="button" onClick={onClose} className={secondaryButton}>Close</button>}
                    <button type="button" disabled={!doc} onClick={() => { doc?.save(report.filename); onClose() }} className={primaryButton}>
                        <i className="bi bi-download" aria-hidden="true" /> Download PDF
                    </button>
                </div>
            </div>
        </Modal>
    )
}
