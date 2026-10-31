/*
 * Placeholders shown while a page's data is on its way, so a table doesn't flash
 * "No ... found" before the first answer arrives.
 */

const WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-5/12", "w-3/5"]

function Bar({ className = "" }: { className?: string }) {
    return <span className={`block h-3.5 animate-pulse rounded-full bg-sage-100 ${className}`} />
}

/** Grey rows for a table body. */
export function SkeletonRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }, (_, row) => (
                <tr key={row} aria-hidden="true">
                    {Array.from({ length: cols }, (_, col) => (
                        <td key={col} className="border-b border-sage-100 px-5 py-4">
                            <Bar className={WIDTHS[(row + col) % WIDTHS.length]} />
                        </td>
                    ))}
                </tr>
            ))}
            <tr className="sr-only"><td colSpan={cols} role="status">Loading…</td></tr>
        </>
    )
}

/** Grey lines for a list or card that isn't a table. */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
    return (
        <div className="space-y-4 px-5 py-5" role="status" aria-label="Loading">
            {Array.from({ length: rows }, (_, row) => (
                <div key={row} className="flex items-center gap-3">
                    <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-sage-100" />
                    <Bar className={WIDTHS[row % WIDTHS.length]} />
                </div>
            ))}
        </div>
    )
}
