import React from "react"

/*
 * The pager under every table: rows per page (10 by default, remembered per table on this
 * browser), "1–10 of 34", and page buttons. usePaged() pages a list in the browser;
 * server-paged tables use usePageSize() and pass the size to the API.
 */

export const PAGE_SIZES = [10, 25, 50, 100] as const
const DEFAULT_SIZE = 10

/** The rows-per-page choice for one table, remembered on this browser. */
export function usePageSize(table: string) {
    const storageKey = `healix.pageSize.${table}`
    const [pageSize, setPageSizeState] = React.useState<number>(DEFAULT_SIZE)

    // Read after the first render: the server cannot see localStorage.
    React.useEffect(() => {
        try {
            const saved = Number(localStorage.getItem(storageKey))
            if ((PAGE_SIZES as readonly number[]).includes(saved)) setPageSizeState(saved)
        } catch { /* storage may be blocked; the default is fine */ }
    }, [storageKey])

    const setPageSize = React.useCallback((size: number) => {
        setPageSizeState(size)
        try { localStorage.setItem(storageKey, String(size)) } catch { /* not remembered, still applied */ }
    }, [storageKey])

    return [pageSize, setPageSize] as const
}

/** Pages a list in the browser. Goes back to page 1 when the list or the page size changes. */
export function usePaged<T>(rows: T[], table: string) {
    const [pageSize, setPageSize] = usePageSize(table)
    const [page, setPage] = React.useState(1)
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))

    // A filter or search that shortens the list should not leave you on an empty page.
    React.useEffect(() => { setPage(current => Math.min(current, totalPages)) }, [totalPages])

    const start = (page - 1) * pageSize
    return {
        pageRows: rows.slice(start, start + pageSize),
        pager: {
            currentPage: page,
            totalPages,
            onPageChange: setPage,
            pageSize,
            onPageSizeChange: (size: number) => { setPageSize(size); setPage(1) },
            totalItems: rows.length,
        },
        resetPage: () => setPage(1),
    }
}

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    pageSize?: number
    onPageSizeChange?: (size: number) => void
    totalItems?: number
}

export default function Pagination({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange, totalItems }: PaginationProps) {
    const id = React.useId()
    const canResize = Boolean(pageSize && onPageSizeChange)
    // Nothing to page and nothing to choose: show nothing.
    if (totalPages <= 1 && (!canResize || (totalItems ?? 0) <= PAGE_SIZES[0])) return null

    function getPageNumbers(): (number | "...")[] {
        const pages: (number | "...")[] = []

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i)
            return pages
        }

        pages.push(1)

        if (currentPage <= 4) {
            pages.push(2, 3, 4, 5, "...", totalPages - 1, totalPages)
        } else if (currentPage >= totalPages - 3) {
            pages.push("...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
        } else {
            pages.push("...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages)
        }

        return pages
    }

    const first = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : 0
    const last = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : 0

    return (
        <nav aria-label="Pages" className="flex flex-col gap-3 border-t border-sage-100 px-5 py-3.5 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-sage-600">
                {totalItems !== undefined && totalItems > 0 && (
                    <span aria-live="polite">
                        <span className="font-medium text-sage-900">{first}–{last}</span> of {totalItems}
                    </span>
                )}
                {canResize && (
                    <label htmlFor={id} className="inline-flex items-center gap-2">
                        Rows per page
                        <select id={id} value={pageSize} onChange={(e) => onPageSizeChange!(Number(e.target.value))}
                            className="rounded-lg border border-sage-200 bg-white px-2 py-1 text-sm text-sage-900 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100">
                            {PAGE_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
                        </select>
                    </label>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between gap-2 md:justify-end">
                    <button
                        type="button"
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center gap-1.5 rounded-full border border-sage-200 px-3.5 py-1.5 text-sm text-sage-600 transition hover:bg-sage-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <i className="bi bi-arrow-left text-xs" aria-hidden="true" /> Previous
                    </button>

                    <div className="hidden items-center gap-1 sm:flex">
                        {getPageNumbers().map((page, idx) =>
                            page === "..." ? (
                                <span key={`ellipsis-${idx}`} className="px-2 text-sm text-sage-400" aria-hidden="true">
                                    ...
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    key={page}
                                    onClick={() => onPageChange(page)}
                                    aria-label={`Page ${page}`}
                                    aria-current={page === currentPage ? "page" : undefined}
                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition ${
                                        page === currentPage
                                            ? "bg-sage-100 font-medium text-sage-900"
                                            : "text-sage-500 hover:bg-sage-50"
                                    }`}
                                >
                                    {page}
                                </button>
                            )
                        )}
                    </div>
                    <span className="text-sm text-sage-600 sm:hidden">Page {currentPage} of {totalPages}</span>

                    <button
                        type="button"
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center gap-1.5 rounded-full border border-sage-200 px-3.5 py-1.5 text-sm text-sage-600 transition hover:bg-sage-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next <i className="bi bi-arrow-right text-xs" aria-hidden="true" />
                    </button>
                </div>
            )}
        </nav>
    )
}
