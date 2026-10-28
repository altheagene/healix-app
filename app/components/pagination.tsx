interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null

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

    return (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
                <i className="bi bi-arrow-left text-xs" /> Previous
            </button>

            <div className="flex items-center gap-1">
                {getPageNumbers().map((page, idx) =>
                    page === "..." ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-sm text-slate-400">
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition ${
                                page === currentPage
                                    ? "bg-slate-100 font-medium text-slate-900"
                                    : "text-slate-500 hover:bg-slate-50"
                            }`}
                        >
                            {page}
                        </button>
                    )
                )}
            </div>

            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
                Next <i className="bi bi-arrow-right text-xs" />
            </button>
        </div>
    )
}