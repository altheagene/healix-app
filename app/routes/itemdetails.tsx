import { apiFetch } from "../api";
import RowActions from '~/components/rowactions';
import AddBatch from '~/components/addbatch'
import EditItem from '~/components/edititem';
import React from 'react'
import Pagination, { usePaged } from '~/components/pagination'
import { useParams } from 'react-router';
import 'bootstrap-icons/font/bootstrap-icons.css';
import EditStock from '~/components/editstocks';
import EditBatch from '~/components/editbatch';
import { useNavigate } from 'react-router';
import DisposeBatch from '~/components/disposebatch';
import { DEFAULT_REORDER_LEVEL, canManageStock, daysUntil, expiryLabel, stockStatus, withUnit } from '../inventory';
import { visitDateParts } from '../visitOutcomes';
import { SkeletonRows } from '~/components/skeleton'

export default function ItemDetails(){

    const { id }  = useParams()
    const navigate = useNavigate()
    const [itemDetails, setItemDetails] = React.useState<any>({});
    const [currentBatch, setCurrentBatch] = React.useState()
    const [batches, setBatches] = React.useState<any[]>([]);
    const [loaded, setLoaded] = React.useState(false);
    const [showAddBatch, setShowAddBatch] = React.useState(false);
    const [showEditDetails, setShowEditDetails] = React.useState(false);
    const [showEditStock, setShowEditStock] = React.useState(false);
    const [showEditBatch, setShowEditBatch] = React.useState(false)
    const [chosenActive, setChosenActive] = React.useState(true)
    const [disposing, setDisposing] = React.useState<any>(null)
    const canManage = canManageStock()

    React.useEffect(() => {
        apiFetch(`/getsupplydetails?idnum=${id}`).
        then(res => res.json()).
        then(data => setItemDetails(data[0]))

    }, [])

    React.useEffect(() => {
        apiFetch(`/getbatches?idnum=${id}`)
        .then(res => res.json())
        .then(data => { setBatches(data); setLoaded(true) })
    }, [])

    function refetchBatches(){
        apiFetch(`/getbatches?idnum=${id}`)
        .then(res => res.json())
        .then(data => setBatches(data))
    }

    function editStockClick(batch:any){
        setCurrentBatch(batch)
        setShowEditStock(true)
    }

    function editBtnClick(batch:any){
        setCurrentBatch(batch)
        setShowEditBatch(true)
    }
    function hideform(){
        setShowEditStock(false)
    }

    function refetchDetails(){
        apiFetch(`/getsupplydetails?idnum=${id}`).
        then(res => res.json()).
        then(data => setItemDetails(data[0]))

    }

     async function removeBatch( id:any){
        const responses = await apiFetch(`/updatebatchactive`, {
          method: 'POST',
          headers: {
            'Content-Type' : 'application/json'
          },
          body: JSON.stringify({batch_id: id , is_active: false})
        })
    
        await responses.json()
        refetchBatches();
      }
    
      async function reactivateBatch( id:any){
        const responses = await apiFetch(`/updatebatchactive`, {
          method: 'POST',
          headers: {
            'Content-Type' : 'application/json'
          },
          body: JSON.stringify({batch_id: id , is_active: true})
        })
    
        await responses.json()
        refetchBatches();
      }

    const filteredBatches = batches.filter(batch => 
        batch.is_active == chosenActive
    )

    // A batch's status is about its expiry; whether the item needs reordering depends on
    // all its batches together, shown in the card above.
    function batchStatus(batch: any) {
        const days = daysUntil(batch.expiration_date)
        if (!(batch.stock_level > 0)) return { label: 'Empty', tone: 'bg-sage-100 text-sage-600 ring-1 ring-sage-200' }
        if (days !== null && days < 0) return { label: 'Expired', tone: 'bg-red-50 text-red-700 ring-1 ring-red-200/60' }
        if (days !== null && days <= 60) return { label: 'Expires soon', tone: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/60' }
        return { label: 'OK', tone: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60' }
    }

    const totalStock = batches.filter(b => b.is_active).reduce((sum, b) => sum + (b.stock_level || 0), 0)
    const itemStatus = stockStatus(totalStock, itemDetails?.reorder_level)
    const { pageRows: pagedBatches, pager } = usePaged(filteredBatches, 'batches')

    return(
        <div className="min-h-full font-sans text-sage-900">
            <div className="mx-auto max-w-full">

                {showEditBatch ? <EditBatch hideForm={() => setShowEditBatch(false)} batch={currentBatch} refetch={refetchBatches}  refetchDetails={refetchDetails}/> : null}
                {showEditStock ? <EditStock hideForm={hideform} batch={currentBatch} unit={itemDetails?.unit} refetch={refetchBatches} refetchDetails={refetchDetails}/> : null}
                {disposing && (
                    <DisposeBatch batch={{ ...disposing, supply_name: itemDetails?.supply_name, unit: itemDetails?.unit }}
                        onClose={() => setDisposing(null)} onDone={() => { setDisposing(null); refetchBatches() }} />
                )}
                {showEditDetails ? <EditItem  hideForm={() => setShowEditDetails(false)} itemDetails={itemDetails} refetch={refetchDetails}/> : null}
                {showAddBatch ? <AddBatch hideForm={() => setShowAddBatch(false)} name={itemDetails?.supply_name} refetch={refetchBatches}/> : null}

                {/* HEADER */}
                <div className="mb-6 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-sage-200 bg-white text-sage-500 transition hover:bg-sage-50"
                    >
                        <i className="bi bi-caret-left-fill" />
                    </button>
                    <h1 className="text-[2rem] font-semibold tracking-tight">Item Details</h1>
                </div>

                {/* ITEM INFO CARD */}
                <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-sage-200 bg-white p-6 shadow-card sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-lg font-semibold text-sage-900">{itemDetails?.supply_name}</p>
                        <span className="mt-1 inline-flex items-center rounded-full bg-citron-100 px-2.5 py-1 text-xs font-medium text-brand-800">
                            {itemDetails?.category_name}
                        </span>
                        <p className="mt-3 text-sm text-sage-500"><span className="font-medium text-sage-700">Brand:</span> {itemDetails?.brand || '-'}</p>
                        <p className="mt-1 text-sm text-sage-500"><span className="font-medium text-sage-700">Description:</span> {itemDetails?.description || '-'}</p>
                        <p className="mt-1 text-sm text-sage-500"><span className="font-medium text-sage-700">Unit:</span> {itemDetails?.unit || 'Not set'}</p>
                        <p className="mt-1 text-sm text-sage-500">
                            <span className="font-medium text-sage-700">Reorder at or below:</span>{' '}
                            {itemDetails?.reorder_level ?? `${DEFAULT_REORDER_LEVEL} (default)`}
                        </p>
                        <p className="mt-3 flex items-center gap-2 text-sm text-sage-700">
                            <span className="font-semibold">{withUnit(totalStock, itemDetails?.unit)}</span> in usable stock
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${itemStatus.tone}`}>{itemStatus.label}</span>
                        </p>
                    </div>
                    {canManage && <button
                        onClick={() => setShowEditDetails(true)}
                        className="inline-flex flex-shrink-0 items-center gap-2 self-start rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-brand-900"
                    >
                        <i className="bi bi-pencil" /> Edit Details
                    </button>}
                </div>

                {/* BATCHES */}
                <h2 className="mb-3 text-lg font-semibold text-sage-900">Batches</h2>

                <div className="rounded-2xl border border-sage-200 bg-white shadow-card overflow-hidden">
                    <div className="flex flex-col gap-3 border-b border-sage-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex rounded-full bg-sage-100 p-1">
                            <button
                                onClick={() => setChosenActive(true)}
                                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                                    chosenActive ? 'bg-white text-sage-900 shadow-sm' : 'text-sage-500'
                                }`}
                            >
                                Active batches
                            </button>
                            <button
                                onClick={() => setChosenActive(false)}
                                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                                    !chosenActive ? 'bg-white text-sage-900 shadow-sm' : 'text-sage-500'
                                }`}
                            >
                                Expired or switched off
                            </button>
                        </div>

                        {canManage && <button
                            onClick={() => setShowAddBatch(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-brand-900"
                        >
                            <i className="bi bi-plus-lg" /> Add New Batch
                        </button>}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-sage-50/60">
                                    <th className="border-b border-sage-100 px-5 py-3 text-left text-xs font-medium text-sage-400">Batch No.</th>
                                    <th className="border-b border-sage-100 px-5 py-3 text-left text-xs font-medium text-sage-400">Stock Level</th>
                                    <th className="border-b border-sage-100 px-5 py-3 text-left text-xs font-medium text-sage-400">Expiration Date</th>
                                    <th className="w-32 border-b border-sage-100 px-5 py-3 text-left text-xs font-medium text-sage-400">Status</th>
                                    <th className="border-b border-sage-100 px-5 py-3 text-left text-xs font-medium text-sage-400">Last Updated</th>
                                    <th className="border-b border-sage-100 px-5 py-3 text-right text-xs font-medium text-sage-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedBatches.length > 0 ? pagedBatches.map((batch) => (
                                    <tr key={batch.batch_id} className="transition hover:bg-brand-50/40">
                                        <td className="border-b border-sage-100 px-5 py-3 text-sm font-medium text-sage-900 last:border-none">
                                            {batch.batch_number}
                                        </td>
                                        <td className="border-b border-sage-100 px-5 py-3 text-sm text-sage-500 last:border-none">
                                            {withUnit(batch.stock_level, itemDetails?.unit)}
                                        </td>
                                        <td className="border-b border-sage-100 px-5 py-3 text-sm text-sage-500 last:border-none">
                                            {batch.expiration_date ? (
                                                <>
                                                    <span className="block">{visitDateParts(batch.expiration_date).date}</span>
                                                    <span className="block text-xs text-sage-400">{expiryLabel(batch.expiration_date)}</span>
                                                </>
                                            ) : 'None'}
                                        </td>
                                        <td className="border-b border-sage-100 px-5 py-3 last:border-none">
                                            <span className={`inline-flex w-[104px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium ${batchStatus(batch).tone}`}>
                                                {batchStatus(batch).label}
                                            </span>
                                        </td>
                                        <td className="border-b border-sage-100 px-5 py-3 text-sm text-sage-500 last:border-none">
                                            {batch.last_updated ? `${visitDateParts(batch.last_updated).date} ${visitDateParts(batch.last_updated).time}`.trim() : 'Never'}
                                        </td>
                                        <td className="border-b border-sage-100 px-5 py-3 text-right last:border-none">
                                            {canManage && (
                                                <RowActions label={`Actions for batch ${batch.batch_number}`} actions={[
                                                    { label: "Add or remove stock", icon: "bi-plus-slash-minus", hidden: !chosenActive, onSelect: () => editStockClick(batch) },
                                                    { label: "Edit batch", icon: "bi-pencil", onSelect: () => editBtnClick(batch) },
                                                    { label: "Switch batch back on", icon: "bi-arrow-counterclockwise", hidden: chosenActive, onSelect: () => reactivateBatch(batch.batch_id) },
                                                    { label: "Dispose of what's left", icon: "bi-trash3", danger: true, hidden: !(batch.stock_level > 0), onSelect: () => setDisposing(batch) },
                                                    { label: "Switch batch off", icon: "bi-slash-circle", danger: true, hidden: !chosenActive, onSelect: () => removeBatch(batch.batch_id) },
                                                ]} />
                                            )}
                                        </td>
                                    </tr>
                                )) : !loaded ? <SkeletonRows cols={6} /> : (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center">
                                            <i className="bi bi-box-seam text-2xl text-sage-300" />
                                            <p className="mt-2 text-sm text-sage-400">No Batches found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <Pagination {...pager} />
                    </div>
                </div>
            </div>
        </div>
    )
}