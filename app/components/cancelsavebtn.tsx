interface CancelSaveBtnProps {
    hideForm: () => void
    submit?: () => void
}

export default function CancelSaveBtn(props: CancelSaveBtnProps){

    return(
        <div className="flex justify-end gap-2 border-t border-sage-200 px-6 py-4">
            <button
                type="button"
                onClick={props.hideForm}
                className="rounded-xl border border-sage-200 bg-white px-4 py-2.5 text-sm font-medium text-sage-700 transition hover:bg-sage-50"
            >
                Cancel
            </button>
            <button
                type="button"
                onClick={props.submit}
                className="rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-900"
            >
                Save
            </button>
        </div>
    )
}
