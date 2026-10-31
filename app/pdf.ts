/*
 * Builds a report as a real PDF file, in the browser, with the same look for every report:
 * a Healix header, the title and period, a row of headline numbers, then tables.
 * jsPDF is loaded only when someone asks for a PDF, so it doesn't slow down page loads.
 */

export type PdfCell = string | number | null | undefined

export interface PdfTable {
    title: string
    columns: string[]
    rows: PdfCell[][]
    /** Columns holding numbers, aligned right. */
    numeric?: number[]
    /** A numeric column to also draw as a bar, for "top complaints" style rankings. */
    bar?: number
    /** Shown instead of an empty table. */
    empty?: string
    note?: string
}

export interface PdfReport {
    title: string
    /** Usually the period, e.g. "Oct 1, 2026 – Oct 31, 2026". */
    subtitle?: string
    /** Headline numbers along the top. */
    summary?: [string, PdfCell][]
    /** Short lines under the summary, e.g. which filters were on. */
    notes?: string[]
    tables: PdfTable[]
    filename: string
    landscape?: boolean
    /** The confidentiality line at the foot of each page. */
    footer?: string
}

// The app's palette (app.css), as RGB for jsPDF.
const BRAND: [number, number, number] = [11, 61, 58]
const SAGE_900: [number, number, number] = [30, 41, 38]
const SAGE_500: [number, number, number] = [106, 122, 116]
const SAGE_100: [number, number, number] = [234, 239, 236]
const CITRON: [number, number, number] = [216, 239, 122]
const LEAF: [number, number, number] = [91, 181, 106]

export async function downloadPdf(report: PdfReport) {
    const doc = await buildPdf(report)
    doc.save(report.filename)
}

/** The report as a jsPDF document, not yet saved. */
export async function buildPdf(report: PdfReport) {
    const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")])
    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: report.landscape ? "landscape" : "portrait" })
    const page = { width: doc.internal.pageSize.getWidth(), height: doc.internal.pageSize.getHeight(), margin: 40 }
    const contentWidth = page.width - page.margin * 2
    doc.setProperties({ title: report.title, subject: report.subtitle || "", creator: "Healix" })

    // Header band
    doc.setFillColor(...BRAND)
    doc.rect(0, 0, page.width, 64, "F")
    doc.setFillColor(...CITRON)
    doc.roundedRect(page.margin, 20, 24, 24, 6, 6, "F")
    doc.setTextColor(...BRAND)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text("H", page.margin + 12, 37, { align: "center" })
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(15)
    doc.text("Healix", page.margin + 34, 37)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text("School clinic", page.margin + 34, 49)
    doc.text(`Generated ${new Date().toLocaleString()}`, page.width - page.margin, 37, { align: "right" })

    let y = 96
    doc.setTextColor(...SAGE_900)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(20)
    doc.text(report.title, page.margin, y)
    if (report.subtitle) {
        y += 18
        doc.setFont("helvetica", "normal")
        doc.setFontSize(11)
        doc.setTextColor(...SAGE_500)
        doc.text(report.subtitle, page.margin, y)
    }
    y += 18

    // Headline numbers, as a row of boxes (wrapping onto a second row if there are many)
    if (report.summary?.length) {
        const perRow = Math.min(report.summary.length, report.landscape ? 6 : 4)
        const gap = 10
        const boxWidth = (contentWidth - gap * (perRow - 1)) / perRow
        const boxHeight = 58
        report.summary.forEach(([label, value], i) => {
            const col = i % perRow
            const row = Math.floor(i / perRow)
            const x = page.margin + col * (boxWidth + gap)
            const top = y + row * (boxHeight + gap)
            doc.setFillColor(...SAGE_100)
            doc.roundedRect(x, top, boxWidth, boxHeight, 8, 8, "F")
            doc.setTextColor(...SAGE_900)
            doc.setFont("helvetica", "bold")
            doc.setFontSize(16)
            doc.text(String(value ?? "-"), x + 12, top + 24)
            doc.setFont("helvetica", "normal")
            doc.setFontSize(8.5)
            doc.setTextColor(...SAGE_500)
            // Up to two lines, so longer labels aren't cut off.
            doc.text(doc.splitTextToSize(label, boxWidth - 24).slice(0, 2), x + 12, top + 39)
        })
        y += Math.ceil(report.summary.length / perRow) * (boxHeight + gap) + 4
    }

    if (report.notes?.length) {
        doc.setFontSize(9)
        doc.setTextColor(...SAGE_500)
        for (const note of report.notes) {
            const lines = doc.splitTextToSize(note, contentWidth)
            doc.text(lines, page.margin, y + 8)
            y += lines.length * 12
        }
        y += 6
    }

    for (const table of report.tables) {
        // Keep a section title with at least a few rows of its table.
        if (y > page.height - 120) { doc.addPage(); y = page.margin + 10 }
        doc.setTextColor(...SAGE_900)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(12)
        doc.text(table.title, page.margin, y + 14)
        y += 22

        if (!table.rows.length) {
            doc.setFont("helvetica", "normal")
            doc.setFontSize(9.5)
            doc.setTextColor(...SAGE_500)
            doc.text(table.empty || "Nothing to show.", page.margin, y + 10)
            y += 30
            continue
        }

        const max = table.bar === undefined ? 0 : Math.max(...table.rows.map(r => Number(r[table.bar!]) || 0), 1)
        const columnStyles: Record<number, { halign: "right"; cellWidth?: number }> = {}
        for (const index of table.numeric || []) columnStyles[index] = { halign: "right" }
        autoTable(doc, {
            startY: y,
            margin: { left: page.margin, right: page.margin, top: page.margin },
            // Label/value tables (all-blank headings) go without a heading row.
            head: table.columns.some(Boolean) ? [table.bar === undefined ? table.columns : [...table.columns, ""]] : [],
            body: table.rows.map(row => {
                const cells = row.map(cell => (cell === null || cell === undefined || cell === "" ? "-" : String(cell)))
                return table.bar === undefined ? cells : [...cells, ""]
            }),
            theme: "plain",
            styles: { font: "helvetica", fontSize: 9, textColor: SAGE_900, cellPadding: { top: 5, bottom: 5, left: 6, right: 6 }, lineColor: SAGE_100, lineWidth: { bottom: 0.6 } },
            headStyles: { fontStyle: "bold", fontSize: 8.5, textColor: SAGE_500, fillColor: [246, 248, 247] },
            columnStyles: table.bar === undefined ? columnStyles : { ...columnStyles, [table.columns.length]: { halign: "right", cellWidth: contentWidth * 0.3 } },
            // Number columns' headings line up with their numbers.
            didParseCell: data => {
                if (data.section === "head" && table.numeric?.includes(data.column.index)) data.cell.styles.halign = "right"
            },
            didDrawCell: data => {
                if (table.bar === undefined || data.section !== "body" || data.column.index !== table.columns.length) return
                const value = Number(table.rows[data.row.index][table.bar]) || 0
                const width = (data.cell.width - 12) * (value / max)
                doc.setFillColor(...LEAF)
                doc.roundedRect(data.cell.x + 6, data.cell.y + data.cell.height / 2 - 3.5, Math.max(width, 2), 7, 3, 3, "F")
            },
        })
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
        if (table.note) {
            doc.setFont("helvetica", "normal")
            doc.setFontSize(8.5)
            doc.setTextColor(...SAGE_500)
            doc.text(doc.splitTextToSize(table.note, contentWidth), page.margin, y + 8)
            y += 16
        }
        y += 14
    }

    // Footer on every page
    const pages = doc.getNumberOfPages()
    for (let i = 1; i <= pages; i++) {
        doc.setPage(i)
        doc.setDrawColor(...SAGE_100)
        doc.line(page.margin, page.height - 34, page.width - page.margin, page.height - 34)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        doc.setTextColor(...SAGE_500)
        doc.text(report.footer || "Confidential: student health information for clinic staff only.", page.margin, page.height - 20)
        doc.text(`Page ${i} of ${pages}`, page.width - page.margin, page.height - 20, { align: "right" })
    }

    return doc
}
