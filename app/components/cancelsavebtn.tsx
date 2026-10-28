interface CancelSaveBtnProps {
    hideForm: () => void
    submit?: () => void
}

export default function CancelSaveBtn(props: CancelSaveBtnProps){

    return(
        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
            <button
                type="button"
                onClick={props.hideForm}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
                Cancel
            </button>
            <button
                type="button"
                onClick={props.submit}
                className="rounded-xl bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-900"
            >
                Save
            </button>
        </div>
    )
}
