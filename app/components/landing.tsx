import React from "react"
import Logo from "~/components/logo";

/*
 * What a visitor sees before signing in: what Healix is, what it does, and a way in.
 * Built from the app's own palette (app.css). No photos: the hero shows the clinic
 * board itself, so the page says what Healix does rather than what clinics look like.
 */

const pill = "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
const limePill = `${pill} bg-citron-300 text-brand-900 hover:bg-citron-400`
const outlinePill = `${pill} border border-citron-400 bg-white text-brand-900 hover:bg-citron-100`
const arrowChip = "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-citron-300 text-brand-900"

const ROLES = [
    { title: "Nurses", icon: "bi-heart-pulse", text: "Record visits, give medicine, close visits and call parents." },
    { title: "Doctors", icon: "bi-clipboard2-pulse", text: "Assess, treat and refer, with the full history in front of them." },
    { title: "Staff and working scholars", icon: "bi-person-badge", text: "Check students in and keep appointments moving." },
    { title: "Admins", icon: "bi-shield-lock", text: "Manage accounts and roles, and see the audit log." },
]

const COMPLAINTS = [
    ["Fever", "-rotate-6", "sm:left-[4%] sm:bottom-[22%]"],
    ["First aid", "rotate-3", "sm:left-[30%] sm:bottom-[30%]"],
    ["Headache", "-rotate-3", "sm:right-[8%] sm:bottom-[27%]"],
    ["Dysmenorrhea", "rotate-6", "sm:left-[6%] sm:bottom-[6%]"],
    ["Medical clearance", "-rotate-2", "sm:left-[36%] sm:bottom-[11%]"],
    ["Sprained ankle", "rotate-[8deg]", "sm:right-[4%] sm:bottom-[8%]"],
]

const FEATURES = [
    { icon: "bi-person-vcard", title: "Student records", text: "Every student's allergies, conditions, emergency contact and visit history on one page, with an allergy warning wherever medicine is given." },
    { icon: "bi-upc-scan", title: "Scan-to-check-in", text: "Type or scan a student ID to open their record ready for a visit, or register them straight from the school roster." },
    { icon: "bi-hospital", title: "Clinic board", text: "See who is in the clinic right now and for how long, and close each visit with how it ended." },
    { icon: "bi-telephone", title: "Parent notification", text: "Sent home or referred? Healix asks who picked the student up and keeps a record of how the parent was told." },
    { icon: "bi-capsule", title: "Medicine inventory", text: "Batches with expiry dates, the oldest given first, reorder levels per item, and every tablet accounted for with a reason." },
    { icon: "bi-calendar-check", title: "Appointments", text: "Book clearances, dental check-ups and follow-ups in open time slots, and mark them done in one tap." },
    { icon: "bi-bar-chart-line", title: "Reports", text: "Visits, top complaints, busiest hours and repeat visitors for any period, ready to print or download for the school office." },
    { icon: "bi-people", title: "Staff and roles", text: "Nurses, doctors, front-desk staff and admins each see what their role needs. Switch an account off when someone leaves." },
]

const STEPS = [
    { title: "Check in", text: "Scan the student's ID. Their record opens with allergies and conditions in view." },
    { title: "Record the visit", text: "Complaint, vitals, assessment, treatment and any medicine, taken off stock as you save." },
    { title: "Close it", text: "Back to class, sent home, referred or an emergency, with who picked them up." },
    { title: "Tell the parent", text: "Call from the visit and note it, so nobody wonders whether home was told." },
]

/** Delay for one item in a staggered animation, read by the CSS as --d. */
function delay(seconds: number) {
    return { "--d": `${seconds}s` } as React.CSSProperties
}

/** Fades in each [data-reveal] element the first time it scrolls into view. */
function useScrollReveal(root: React.RefObject<HTMLDivElement | null>) {
    React.useEffect(() => {
        const container = root.current
        if (!container || typeof IntersectionObserver === "undefined") return
        container.classList.add("reveal-ready")
        const observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue
                entry.target.classList.add("is-visible")
                observer.unobserve(entry.target)
            }
        }, { root: container, threshold: 0.15, rootMargin: "0px 0px -40px 0px" })
        container.querySelectorAll("[data-reveal]").forEach(el => observer.observe(el))
        return () => observer.disconnect()
    }, [root])
}

export default function Landing({ onSignIn }: { onSignIn: () => void }) {
    const scroller = React.useRef<HTMLDivElement>(null)
    useScrollReveal(scroller)
    // The bar gets a soft edge once the page has scrolled under it.
    const [scrolled, setScrolled] = React.useState(false)
    const [activeSection, setActiveSection] = React.useState("")

    function onScroll(event: React.UIEvent<HTMLDivElement>) {
        const container = event.currentTarget
        setScrolled(container.scrollTop > 8)
        setActiveSection(sectionInView(container))
    }

    return (
        // The app pins <body> to the screen for its own layout, so this page scrolls itself.
        <div ref={scroller} onScroll={onScroll} className="h-full overflow-y-auto scroll-smooth bg-white font-sans text-sage-900">
            <style>{"@media (prefers-reduced-motion: reduce) { .scroll-smooth { scroll-behavior: auto; } }"}</style>
            <div className="overflow-x-clip bg-white">
                <Header onSignIn={onSignIn} scrolled={scrolled} active={activeSection} />
                <main>
                    <Hero onSignIn={onSignIn} />
                    <WhyHealix onSignIn={onSignIn} />
                    <Features />
                    <HowItWorks />
                    <Privacy />
                    <Closing onSignIn={onSignIn} />
                </main>
                <footer className="flex flex-col gap-2 border-t border-sage-100 px-6 py-6 text-xs text-sage-500 sm:flex-row sm:items-center sm:justify-between sm:px-10">
                    <Logo />
                    <p className="m-0">A clinic management system for schools. For the clinic's staff only; students and parents don't sign in.</p>
                </footer>
            </div>
        </div>
    )
}


const NAV_LINKS = [["features", "Features"], ["how-it-works", "How it works"], ["privacy", "Privacy"]]

/**
 * The section whose top has passed just under the sticky bar, or "" while the hero is in view.
 * At the very bottom the last section counts, even if it is too short to reach the bar.
 */
function sectionInView(container: HTMLElement) {
    const line = container.getBoundingClientRect().top + 120
    const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 4
    let current = ""
    for (const [id] of NAV_LINKS) {
        const section = container.querySelector<HTMLElement>(`#${id}`)
        if (section && (section.getBoundingClientRect().top <= line || atBottom)) current = id
    }
    return current
}

function Header({ onSignIn, scrolled, active }: { onSignIn: () => void; scrolled: boolean; active: string }) {
    return (
        <header className={`rise sticky top-0 z-30 flex items-center justify-between gap-4 px-6 py-4 backdrop-blur-md transition-[background-color,box-shadow] duration-300 sm:px-10 ${scrolled ? "bg-white/85 shadow-[0_1px_0_var(--color-sage-100),0_8px_24px_-12px_rgb(11_61_58_/_0.18)]" : "bg-white/0 pt-6"}`}>
            <Logo />
            <nav aria-label="On this page" className="hidden items-center gap-6 text-sm md:flex">
                {NAV_LINKS.map(([id, text]) => {
                    const current = id === active
                    return (
                        <a key={id} href={`#${id}`} aria-current={current ? "location" : undefined}
                            className={`inline-flex items-center no-underline transition-colors duration-300 hover:text-sage-900 ${current ? "font-medium text-sage-900" : "text-sage-500"}`}>
                            <span aria-hidden="true"
                                className={`inline-block h-1.5 rounded-full bg-sage-900 transition-all duration-300 ${current ? "mr-1.5 w-1.5 opacity-100" : "mr-0 w-0 opacity-0"}`} />
                            {text}
                        </a>
                    )
                })}
            </nav>
            <button type="button" onClick={onSignIn} className={limePill}>Sign in</button>
        </header>
    )
}

function Hero({ onSignIn }: { onSignIn: () => void }) {
    return (
        <section aria-labelledby="hero-heading" className="grid grid-cols-1 gap-8 px-6 pb-12 pt-8 sm:px-10 lg:grid-cols-[1fr_1.05fr] lg:gap-10">
            <div className="flex flex-col">
                <h1 id="hero-heading" style={delay(0.08)} className="rise m-0 text-[2.6rem] font-medium leading-[1.08] tracking-tight text-sage-900 sm:text-[3.4rem]">
                    Your school clinic, in one calm place
                </h1>
                <p style={delay(0.18)} className="rise m-0 mt-5 max-w-md text-[15px] leading-relaxed text-sage-600">
                    Healix keeps every student visit, medicine and parent call on record, so the nurse can focus on the
                    student in front of them, not the paperwork behind them.
                </p>
                <div style={delay(0.28)} className="rise mt-7 flex flex-wrap gap-3">
                    <button type="button" onClick={onSignIn} className={limePill}>Sign in to Healix</button>
                    <a href="#features" className={`${outlinePill} no-underline`}>Explore features</a>
                </div>

                <div className="mt-auto pt-12">
                    <p style={delay(0.38)} className="rise m-0 mb-3 text-sm font-medium text-sage-900">Made for everyone<br />in the clinic</p>
                    <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 sm:grid-cols-4">
                        {ROLES.map((role, i) => (
                            <li key={role.title} style={delay(0.45 + i * 0.08)}
                                className={`rise flex flex-col justify-between rounded-2xl p-3.5 transition ${i === 0 ? "bg-citron-200 sm:-translate-y-3" : "bg-sage-100"}`}>
                                <span className={`flex h-9 w-9 items-center justify-center rounded-full text-base ${i === 0 ? "bg-white text-brand-800" : "bg-white text-sage-700"}`} aria-hidden="true">
                                    <i className={`bi ${role.icon}`} />
                                </span>
                                <span className="mt-5 text-xs font-semibold leading-snug text-sage-900">{role.title}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <HeroVisual />
        </section>
    )
}

/** The lime panel: a live-looking clinic board, a floating notice, and the day's complaints. */
function HeroVisual() {
    return (
        <div aria-hidden="true" className="rise hero-visual relative overflow-hidden rounded-[28px] p-5 sm:min-h-[520px]"
            style={{
                ...delay(0.15),
                background:
                    "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.55) 0 2px, transparent 3px) 0 0 / 22px 22px," +
                    "linear-gradient(160deg, var(--color-citron-200), var(--color-leaf-200))",
            }}>
            {/* Contour rings, like the topographic lines in the reference */}
            <div className="float pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/50" />
            <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full border border-white/50" />
            <div className="float pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full border border-white/40" style={{ animationDelay: "2.5s" }} />

            <div className="relative h-full rounded-[22px] bg-white/45 p-5 backdrop-blur-[1px] sm:min-h-[480px]">
                {/* Side rail of tools */}
                <div style={delay(0.55)} className="pop absolute -left-2 top-16 flex flex-col gap-2 rounded-full bg-white p-1.5 shadow-card sm:-left-3">
                    {["bi-hospital", "bi-capsule", "bi-bar-chart-line"].map(icon => (
                        <span key={icon} className="flex h-8 w-8 items-center justify-center rounded-full text-sm text-sage-800"><i className={`bi ${icon}`} /></span>
                    ))}
                </div>

                {/* The clinic board */}
                <div style={delay(0.4)} className="rise ml-8 max-w-[19rem] rounded-2xl bg-white p-4 shadow-card sm:ml-10">
                    <div className="flex items-center justify-between">
                        <p className="m-0 text-xs font-semibold text-sage-900"><span className="live-dot mr-1.5 inline-block h-2 w-2 rounded-full bg-leaf-500" />In the clinic now</p>
                        <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[10px] font-semibold text-sage-700">2</span>
                    </div>
                    {[["AB", "Andrea B.", "Grade 5 · Headache", "12 min"], ["RM", "Rafael M.", "Grade 11 STEM · Fever", "28 min"]].map(([initials, name, detail, time], i) => (
                        <div key={name} style={delay(0.6 + i * 0.12)} className="rise mt-3 flex items-center gap-3 rounded-xl bg-sage-50 p-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-800">{initials}</span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-xs font-semibold text-sage-900">{name}</span>
                                <span className="block truncate text-[11px] text-sage-500">{detail}</span>
                            </span>
                            <span className="text-[10px] font-medium text-sage-500">{time}</span>
                        </div>
                    ))}
                    <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-sage-200 px-3 py-2 text-[11px] text-sage-500">
                        <span><i className="bi bi-upc-scan mr-1.5" />Scan a student ID</span>
                        <i className="bi bi-arrow-right" />
                    </div>
                </div>

                {/* Floating notice, like the "Psychologist" card in the reference */}
                <div style={delay(0.95)} className="pop-float relative ml-8 mt-4 w-56 rounded-2xl bg-white p-3.5 shadow-lg sm:absolute sm:right-5 sm:top-[44%] sm:ml-0 sm:mt-0">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-leaf-100 text-leaf-700"><i className="bi bi-telephone-fill" /></span>
                        <span>
                            <span className="block text-xs font-semibold text-sage-900">Parent notified</span>
                            <span className="block text-[11px] text-sage-500">Phone call · 10:42 AM</span>
                        </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                        <span className="text-[10px] text-sage-500"><i className="bi bi-person-check mr-1" />Picked up by mother</span>
                        <span className="rounded-full bg-brand-800 px-2 py-0.5 text-[10px] font-semibold text-white">Sent home</span>
                    </div>
                </div>

                {/* Today's complaints, as the reference's cloud of tilted pills; in rows on phones */}
                <div className="mt-6 flex flex-wrap gap-2.5 sm:mt-0 sm:block">
                    {COMPLAINTS.map(([text, tilt, place], i) => (
                        <span key={text} style={delay(1.1 + i * 0.1)} className={`pop-drift inline-block sm:absolute ${place} ${tilt} rounded-full bg-white px-4 py-2 text-xs font-medium text-sage-800 shadow-card sm:text-sm`}>
                            {text}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}

function WhyHealix({ onSignIn }: { onSignIn: () => void }) {
    return (
        <section aria-labelledby="why-heading" className="bg-sage-100/70 px-6 py-14 sm:px-10">
            <div data-reveal className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
                <h2 id="why-heading" className="m-0 text-[2rem] font-medium leading-[1.12] tracking-tight sm:text-[2.4rem]">
                    <span className="mr-2 align-middle text-xs font-medium tracking-normal text-sage-500">Why Healix?</span>{" "}
                    Because every clinic visit should be on record
                </h2>
                <div>
                    <p className="m-0 max-w-md text-sm leading-relaxed text-sage-600">
                        Paper logbooks get lost, stock runs out unnoticed, and nobody is sure the parent was called.
                        Healix gives a school clinic one place for all of it, built around how a clinic day actually runs.
                    </p>
                    <button type="button" onClick={onSignIn} className={`${limePill} mt-5`}>Get started</button>
                </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
                <WhyCard index={0} title="Visits in seconds" icon="bi-lightning-charge"
                    text="Scan an ID, record what happened, save. Medicine comes off stock on its own, oldest batch first." />
                <WhyCard index={1} title="Nobody falls through" icon="bi-telephone" highlight
                    text="Every student sent home or referred has who took them, and whether home was told, on record." />
                <WhyCard index={2} title="Stock you can trust" icon="bi-capsule"
                    text="Warnings before medicine expires, reorder levels per item, and a reason for every unit in or out." />
            </div>
        </section>
    )
}

function WhyCard({ title, text, icon, highlight, index }: { title: string; text: string; icon: string; highlight?: boolean; index: number }) {
    return (
        <article data-reveal className={`group relative flex min-h-[15rem] flex-col overflow-hidden rounded-[22px] p-5 ${highlight ? "" : "bg-white shadow-card"}`}
            style={{ ...delay(index * 0.12), ...(highlight ? { background: "linear-gradient(160deg, var(--color-citron-200), var(--color-leaf-300))" } : {}) }}>
            <div className="flex items-start justify-between gap-3">
                <h3 className={`m-0 text-base font-semibold ${highlight ? "rounded-full bg-white px-3.5 py-1.5 text-sm" : ""}`}>{title}</h3>
                <span className={highlight ? "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-brand-900" : arrowChip} aria-hidden="true">
                    <i className="bi bi-arrow-right inline-block transition-transform duration-300 group-hover:-rotate-45" />
                </span>
            </div>
            <i className={`bi ${icon} pointer-events-none transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105 absolute -bottom-6 -right-2 text-[8rem] leading-none ${highlight ? "text-white/45" : "text-sage-100"}`} aria-hidden="true" />
            <p className="relative m-0 mt-auto max-w-[17rem] pt-10 text-sm leading-relaxed text-sage-700">{text}</p>
        </article>
    )
}

function Features() {
    return (
        <section id="features" aria-labelledby="features-heading" className="scroll-mt-20 px-6 py-16 sm:px-10">
            <div data-reveal className="mb-10 max-w-2xl">
                <p className="m-0 text-xs font-semibold uppercase tracking-wider text-brand-700">Features</p>
                <h2 id="features-heading" className="m-0 mt-2 text-[2rem] font-medium leading-tight tracking-tight">Everything the clinic does in a day</h2>
                <p className="m-0 mt-3 text-sm leading-relaxed text-sage-600">From the first headache of the morning to the report the principal asks for at the end of the month.</p>
            </div>
            <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
                {FEATURES.map((f, i) => (
                    <li key={f.title} data-reveal style={delay((i % 4) * 0.08)} className="group rounded-[22px] border border-sage-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-citron-200 text-lg text-brand-900 transition duration-300 group-hover:scale-110 group-hover:bg-citron-300" aria-hidden="true">
                            <i className={`bi ${f.icon}`} />
                        </span>
                        <h3 className="m-0 mt-4 text-base font-semibold">{f.title}</h3>
                        <p className="m-0 mt-2 text-sm leading-relaxed text-sage-600">{f.text}</p>
                    </li>
                ))}
            </ul>
        </section>
    )
}

function HowItWorks() {
    return (
        <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-20 bg-sage-100/70 px-6 py-16 sm:px-10">
            <div data-reveal className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="m-0 text-xs font-semibold uppercase tracking-wider text-brand-700">How it works</p>
                    <h2 id="how-heading" className="m-0 mt-2 text-[2rem] font-medium leading-tight tracking-tight">One visit, start to finish</h2>
                </div>
                <p className="m-0 max-w-sm text-sm text-sage-600">A student walks in with a fever. Here is what the nurse does in Healix.</p>
            </div>
            <ol className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-4">
                {STEPS.map((step, i) => (
                    <li key={step.title} data-reveal style={delay(i * 0.12)} className="relative rounded-[22px] bg-white p-5 shadow-card">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${i === STEPS.length - 1 ? "bg-brand-800 text-white" : "bg-citron-300 text-brand-900"}`}>
                            {i + 1}
                        </span>
                        <h3 className="m-0 mt-4 text-base font-semibold">{step.title}</h3>
                        <p className="m-0 mt-2 text-sm leading-relaxed text-sage-600">{step.text}</p>
                    </li>
                ))}
            </ol>
        </section>
    )
}

function Privacy() {
    const points = [
        ["bi-person-lock", "Each role does what it needs", "Front-desk staff can check students in and book appointments, but can't record visits, change stock, or see reports and exports."],
        ["bi-journal-check", "Every look is logged", "Opening a record, a report or an export is written to an audit log admins can read."],
        ["bi-eye-slash", "Contacts stay private", "Staff phone numbers and emails are visible only to admins and to each person themselves."],
        ["bi-person-slash", "Accounts switch off", "When someone leaves, an admin switches their account off; their name stays on past visits."],
    ]
    return (
        <section id="privacy" aria-labelledby="privacy-heading" className="scroll-mt-20 px-6 py-16 sm:px-10">
            <div data-reveal className="grid grid-cols-1 gap-8 overflow-hidden rounded-[28px] bg-brand-800 p-7 text-white sm:p-10 lg:grid-cols-[1fr_1.4fr]">
                <div>
                    <p className="m-0 text-xs font-semibold uppercase tracking-wider text-citron-300">Privacy</p>
                    <h2 id="privacy-heading" className="m-0 mt-2 text-[2rem] font-medium leading-tight tracking-tight">Health records are sensitive. Healix treats them that way.</h2>
                    <p className="m-0 mt-4 text-sm leading-relaxed text-white/75">Students' health information is visible only to the clinic staff who need it, and every access leaves a trace.</p>
                </div>
                <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
                    {points.map(([icon, title, text]) => (
                        <li key={title} className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
                            <i className={`bi ${icon} text-xl text-citron-300`} aria-hidden="true" />
                            <h3 className="m-0 mt-2.5 text-sm font-semibold">{title}</h3>
                            <p className="m-0 mt-1 text-[13px] leading-relaxed text-white/75">{text}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

function Closing({ onSignIn }: { onSignIn: () => void }) {
    return (
        <section aria-labelledby="closing-heading" className="px-6 pb-14 sm:px-10">
            <div data-reveal className="flex flex-col items-start gap-5 rounded-[28px] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10"
                style={{ background: "linear-gradient(120deg, var(--color-citron-200), var(--color-leaf-200))" }}>
                <div>
                    <h2 id="closing-heading" className="m-0 text-[1.75rem] font-medium leading-tight tracking-tight">Ready for today's first visit?</h2>
                    <p className="m-0 mt-2 text-sm text-sage-700">Sign in with the account your clinic admin gave you.</p>
                </div>
                <button type="button" onClick={onSignIn} className={`${pill} group bg-brand-800 text-white hover:bg-brand-900`}>
                    Sign in <i className="bi bi-arrow-right transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </button>
            </div>
        </section>
    )
}
