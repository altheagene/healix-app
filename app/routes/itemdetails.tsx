import { apiFetch } from "../api";
import AddBatch from '~/components/addbatch'
import UpdateStocks from '~/components/updatestocks';
import EditItem from '~/components/edititem';
import React from 'react'
import { useParams } from 'react-router';
import 'bootstrap-icons/font/bootstrap-icons.css';
import EditStock from '~/components/editstocks';
import EditBatch from '~/components/editbatch';
import { useNavigate } from 'react-router';

export default function ItemDetails(){

    const { id }  = useParams()
    const navigate = useNavigate()
    const [itemDetails, setItemDetails] = React.useState<any>({});
    const [currentBatch, setCurrentBatch] = React.useState()
    const [batches, setBatches] = React.useState<any[]>([]);
    const [showAddBatch, setShowAddBatch] = React.useState(false);
    const [showUpdateStock, setShowUpdateStock] = React.useState(false);
    const [showEditDetails, setShowEditDetails] = React.useState(false);
    const [showEditStock, setShowEditStock] = React.useState(false);
    const [showEditBatch, setShowEditBatch] = React.useState(false)
    const [chosenActive, setChosenActive] = React.useState(true)
    const [openMenuId, setOpenMenuId] = React.useState<any>(null);

    console.log(batches)

    React.useEffect(() => {
        apiFetch(`/getsupplydetails?idnum=${id}`).
        then(res => res.json()).
        then(data => setItemDetails(data[0]))

    }, [])

    React.useEffect(() => {
        apiFetch(`/getbatches?idnum=${id}`)
        .then(res => res.json())
        .then(data => setBatches(data))
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
    
        const result = await responses.json()
        console.log(result);
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
    
        const result = await responses.json()
        console.log(result);
        refetchBatches();
      }

    const filteredBatches = batches.filter(batch => 
        batch.is_active == chosenActive
    )

    function batchStatusClasses(batch: any) {
        if (new Date(batch.expiration_date) < new Date() && batch.expiration_date) return 'bg-red-50 text-red-700 ring-1 ring-red-200/60'
        if (batch.stock_level > 20) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60'
        return 'bg-teal-50 text-teal-800 ring-1 ring-teal-200/60'
    }

    function batchStatusLabel(batch: any) {
        if (new Date(batch.expiration_date) < new Date() && batch.expiration_date) return 'Expired'
        if (batch.stock_level > 20) return 'In Stock'
        return 'Low Stock'
    }

    console.log(filteredBatches)
    return(
        <div className="min-h-full font-sans text-slate-900">
            <div className="mx-auto max-w-full">

                {showEditBatch ? <EditBatch hideForm={() => setShowEditBatch(false)} batch={currentBatch} refetch={refetchBatches}  refetchDetails={refetchDetails}/> : null}
                {showEditStock ? <EditStock hideForm={hideform} batch={currentBatch} refetch={refetchBatches} refetchDetails={refetchDetails}/> : null}
                {showEditDetails ? <EditItem  hideForm={() => setShowEditDetails(false)} itemDetails={itemDetails} refetch={refetchDetails}/> : null}
                {showUpdateStock ? <UpdateStocks hideForm={() => setShowUpdateStock(false)}/> : null}
                {showAddBatch ? <AddBatch hideForm={() => setShowAddBatch(false)} name={itemDetails?.supply_name} refetch={refetchBatches}/> : null}

                {/* HEADER */}
                <div className="mb-6 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                    >
                        <i className="bi bi-caret-left-fill" />
                    </button>
                    <h1 className="text-[2rem] font-semibold tracking-tight">Item Details</h1>
                </div>

                {/* ITEM INFO CARD */}
                <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-lg font-semibold text-slate-900">{itemDetails?.supply_name}</p>
                        <span className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {itemDetails?.category_name}
                        </span>
                        <p className="mt-3 text-sm text-slate-500"><span className="font-medium text-slate-700">Brand:</span> {itemDetails?.brand || '-'}</p>
                        <p className="mt-1 text-sm text-slate-500"><span className="font-medium text-slate-700">Description:</span> {itemDetails?.description || '-'}</p>
                    </div>
                    <button
                        onClick={() => setShowEditDetails(true)}
                        className="inline-flex flex-shrink-0 items-center gap-2 self-start rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-teal-900"
                    >
                        <i className="bi bi-pencil" /> Edit Details
                    </button>
                </div>

                {/* BATCHES */}
                <h2 className="mb-3 text-lg font-semibold text-slate-900">Batches</h2>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex rounded-full bg-slate-100 p-1">
                            <button
                                onClick={() => setChosenActive(true)}
                                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                                    chosenActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                                }`}
                            >
                                Active Supplies
                            </button>
                            <button
                                onClick={() => setChosenActive(false)}
                                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                                    !chosenActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                                }`}
                            >
                                Inactive Supplies
                            </button>
                        </div>

                        <button
                            onClick={() => setShowAddBatch(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-teal-900"
                        >
                            <i className="bi bi-plus-lg" /> Add New Batch
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/60">
                                    <th className="border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">Batch No.</th>
                                    <th className="border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">Stock Level</th>
                                    <th className="border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">Expiration Date</th>
                                    <th className="w-32 border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">Status</th>
                                    <th className="border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">Last Updated</th>
                                    <th className="border-b border-slate-100 px-5 py-3 text-right text-xs font-medium text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBatches.length > 0 ? filteredBatches.map((batch) => (
                                    <tr key={batch.batch_id} className="transition hover:bg-teal-50/40">
                                        <td className="border-b border-slate-100 px-5 py-3 text-sm font-medium text-slate-900 last:border-none">
                                            {batch.batch_number}
                                        </td>
                                        <td className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500 last:border-none">
                                            {batch.stock_level}
                                        </td>
                                        <td className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500 last:border-none">
                                            {batch.expiration_date === '' ? 'None' : batch.expiration_date}
                                        </td>
                                        <td className="border-b border-slate-100 px-5 py-3 last:border-none">
                                            <span className={`inline-flex w-[104px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium ${batchStatusClasses(batch)}`}>
                                                {batchStatusLabel(batch)}
                                            </span>
                                        </td>
                                        <td className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500 last:border-none">
                                            {batch.last_updated || 'None'}
                                        </td>
                                        <td className="border-b border-slate-100 px-5 py-3 text-right last:border-none">
                                            <div className="relative inline-block text-left">
                                                <button
                                                    onClick={() => setOpenMenuId(openMenuId === batch.batch_id ? null : batch.batch_id)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                                >
                                                    <i className="bi bi-three-dots-vertical" />
                                                </button>

                                                {openMenuId === batch.batch_id && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setOpenMenuId(null)}
                                                        />
                                                        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                                                            <button
                                                                onClick={() => { editStockClick(batch); setOpenMenuId(null); }}
                                                                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                                            >
                                                                <i className="bi bi-pen-fill" /> Edit Stock
                                                            </button>

                                                            <button
                                                                onClick={() => { editBtnClick(batch); setOpenMenuId(null); }}
                                                                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                                            >
                                                                <i className="bi bi-pencil-square" /> Edit Batch
                                                            </button>

                                                            {chosenActive ? (
                                                                <button
                                                                    onClick={() => { removeBatch(batch.batch_id); setOpenMenuId(null); }}
                                                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                                                                >
                                                                    <i className="bi bi-trash" /> Deactivate
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => { reactivateBatch(batch.batch_id); setOpenMenuId(null); }}
                                                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-emerald-600 transition hover:bg-emerald-50"
                                                                >
                                                                    <i className="bi bi-arrow-clockwise" /> Reactivate
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center">
                                            <i className="bi bi-box-seam text-2xl text-slate-300" />
                                            <p className="mt-2 text-sm text-slate-400">No Batches found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <div className="border-t border-slate-100 px-5 py-3 text-center text-xs text-slate-400">
                            End of table
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}