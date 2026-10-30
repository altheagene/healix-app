/** The Healix mark, and the name beside it unless `markOnly`. Used on the landing page,
 * the sign-in page and the sidebar, so it always looks the same. */
export default function Logo({ markOnly = false, size = "md" }: { markOnly?: boolean; size?: "md" | "lg" }) {
    const mark = size === "lg" ? "h-10 w-10 text-base" : "h-8 w-8 text-sm"
    return (
        <span className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-sage-900">
            <span className={`flex flex-shrink-0 items-center justify-center rounded-xl bg-brand-800 text-citron-300 ${mark}`} aria-hidden="true">
                <i className="bi bi-heart-pulse-fill" />
            </span>
            {markOnly ? <span className="sr-only">Healix</span> : "Healix"}
        </span>
    )
}
