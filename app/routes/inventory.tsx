import { apiFetch } from "../api";
import RowActions, { rowLinkClass } from "~/components/rowactions";
import AddItem from "~/components/additem";
import Modal from "~/components/modal";
import DisposeBatch from "~/components/disposebatch";
import React from "react";
import Pagination, { usePaged } from '~/components/pagination'
import { useNavigate } from "react-router";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { DEFAULT_REORDER_LEVEL, canManageStock, expiryLabel, stockStatus, withUnit } from "../inventory";
import { visitDateParts } from "../visitOutcomes";
import { SkeletonRows } from "~/components/skeleton";

interface AlertBatch {
  batch_id: number
  batch_number: string
  expiration_date: string
  stock_level: number
  supply_id: number
  supply_name: string
  unit?: string | null
}

interface Alerts {
  days: number
  expiring: AlertBatch[]
  to_dispose: AlertBatch[]
  reorder: any[]
}

const EXPIRY_WINDOWS = [30, 60, 90]

export default function Inventory() {
  const navigate = useNavigate();
  const canManage = canManageStock();
  const [showAddItem, setShowAddItem] = React.useState(false);
  const [supplies, setSupplies] = React.useState<any[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [alerts, setAlerts] = React.useState<Alerts>({ days: 60, expiring: [], to_dispose: [], reorder: [] });
  const [expiryDays, setExpiryDays] = React.useState(60);
  const [disposing, setDisposing] = React.useState<AlertBatch | null>(null);
  const [openList, setOpenList] = React.useState<"expiring" | "dispose" | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [chosenActive, setChosenActive] = React.useState(true);
  const [selectedCategory, setSelectedCategory] = React.useState("All Items");
  const [onlyReorder, setOnlyReorder] = React.useState(false);

  const refetchSupplies = React.useCallback(() => {
    apiFetch(`/getallsupplies`)
      .then(res => res.json())
      .then(data => { setSupplies(Array.isArray(data) ? data : []); setLoaded(true); });
  }, []);

  const refetchAlerts = React.useCallback(() => {
    apiFetch(`/getinventoryalerts?days=${expiryDays}`)
      .then(res => res.json())
      .then(data => data && Array.isArray(data.expiring) && setAlerts(data));
  }, [expiryDays]);

  React.useEffect(() => { refetchSupplies() }, [refetchSupplies]);
  React.useEffect(() => { refetchAlerts() }, [refetchAlerts]);

  async function setItemActive(supply: any, active: boolean) {
    if (!active && !window.confirm(`Delete ${supply.supply_name}? It moves to Deleted Supplies and can be brought back.`)) return
    await apiFetch(`/deleteitem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supply_id: supply.supply_id, is_active: active })
    })
    refetchSupplies();
    refetchAlerts();
  }

  const categories = ["All Items", ...Array.from(new Set(supplies.map(s => s.category_name)))];

  const term = searchTerm.toLowerCase()
  const filteredSupplies = supplies.filter(supply =>
    (supply.supply_name.toLowerCase().includes(term) || supply.category_name.toLowerCase().includes(term)) &&
    Boolean(supply.is_active) === chosenActive &&
    (selectedCategory === "All Items" || supply.category_name === selectedCategory) &&
    (!onlyReorder || supply.needs_reorder)
  );

  const activeCount = supplies.filter(s => s.is_active).length;

  const { pageRows: pagedSupplies, pager } = usePaged(filteredSupplies, "inventory");

  return (
    <div className="min-h-full font-sans text-sage-900">
      <div className="mx-auto max-w-full">

        {showAddItem && (
          <AddItem hideForm={() => setShowAddItem(false)} refetchSupplies={() => { refetchSupplies(); refetchAlerts() }} />
        )}
        {disposing && (
          <DisposeBatch batch={disposing} onClose={() => setDisposing(null)}
            onDone={() => { setDisposing(null); refetchSupplies(); refetchAlerts() }} />
        )}

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-[2rem] font-semibold tracking-tight m-0">Inventory</h1>
          <p className="text-sage-500 text-sm mt-1">Medicines, supplies and equipment: what is running low, and what expires soon.</p>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon="bi-box-seam" value={activeCount} label="Items" />
          <StatCard icon="bi-cart-plus" value={alerts.reorder.length} label="Need reordering" tone="amber"
            onClick={() => { setChosenActive(true); setOnlyReorder(true) }} />
          <StatCard icon="bi-hourglass-split" value={alerts.expiring.length} label={`Batches expiring in ${alerts.days} days`} tone="amber"
            onClick={() => setOpenList("expiring")} />
          <StatCard icon="bi-trash3" value={alerts.to_dispose.length} label="Expired, to dispose" tone="red"
            onClick={() => setOpenList("dispose")} />
        </div>

        {openList === "expiring" && (
          <Modal title="Expiring soon" onClose={() => setOpenList(null)} width={560}>
            <div className="overflow-y-auto px-6 py-5">
              <div role="group" aria-label="Expiry window" className="mb-3 inline-flex rounded-full bg-sage-100 p-1">
                {EXPIRY_WINDOWS.map(days => (
                  <button key={days} type="button" aria-pressed={expiryDays === days} onClick={() => setExpiryDays(days)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${expiryDays === days ? 'bg-white text-sage-900 shadow-sm' : 'text-sage-500'}`}>
                    {days} days
                  </button>
                ))}
              </div>
              {alerts.expiring.length === 0 ? (
                <p className="m-0 text-sm text-sage-400">Nothing expires in the next {alerts.days} days.</p>
              ) : (
                <ul className="m-0 list-none divide-y divide-sage-100 p-0">
                  {alerts.expiring.map(batch => (
                    <AlertRow key={batch.batch_id} batch={batch} onOpen={() => navigate(`/itemdetails/${batch.supply_id}`)}
                      detail={<span className="text-amber-800">{visitDateParts(batch.expiration_date).date} · {expiryLabel(batch.expiration_date)}</span>} />
                  ))}
                </ul>
              )}
              <p className="m-0 mt-3 text-xs text-sage-400">Medicines are always given from the batch that expires first.</p>
            </div>
          </Modal>
        )}

        {openList === "dispose" && !disposing && (
          <Modal title="Expired, to dispose" onClose={() => setOpenList(null)} width={560}>
            <div className="overflow-y-auto px-6 py-5">
              {alerts.to_dispose.length === 0 ? (
                <p className="m-0 text-sm text-sage-400">No expired stock on the shelf.</p>
              ) : (
                <ul className="m-0 list-none divide-y divide-sage-100 p-0">
                  {alerts.to_dispose.map(batch => (
                    <AlertRow key={batch.batch_id} batch={batch} onOpen={() => navigate(`/itemdetails/${batch.supply_id}`)}
                      detail={<span className="text-red-700">Expired {visitDateParts(batch.expiration_date).date}</span>}
                      action={canManage ? (
                        <button type="button" onClick={() => setDisposing(batch)}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">
                          Dispose<span className="sr-only"> of {batch.supply_name} batch {batch.batch_number}</span>
                        </button>
                      ) : null} />
                  ))}
                </ul>
              )}
              <p className="m-0 mt-3 text-xs text-sage-400">Expired batches are never given out. Disposing records the units removed.</p>
            </div>
          </Modal>
        )}

        {/* CONTROLS */}
        <div className="rounded-2xl border border-sage-200 bg-white shadow-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-sage-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-full bg-sage-100 p-1">
                {([[true, "Active Supplies"], [false, "Deleted Supplies"]] as const).map(([active, label]) => (
                  <button key={label} type="button" aria-pressed={chosenActive === active} onClick={() => setChosenActive(active)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${chosenActive === active ? 'bg-white text-sage-900 shadow-sm' : 'text-sage-500'}`}>
                    {label}
                  </button>
                ))}
              </div>

              <select
                aria-label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-full border border-sage-200 bg-sage-50 px-3.5 py-2 text-xs font-medium text-sage-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              >
                {categories.map(category => <option key={category} value={category}>{category}</option>)}
              </select>

              <label className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-600">
                <input type="checkbox" checked={onlyReorder} onChange={(e) => setOnlyReorder(e.target.checked)}
                  className="h-4 w-4 rounded border-sage-300 text-brand-800 focus:ring-brand-200" />
                Needs reordering only
              </label>
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <label className="flex w-full items-center gap-2 rounded-full border border-sage-200 bg-sage-50 px-3.5 py-2 text-sage-400 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100 sm:w-64">
                <i className="bi bi-search text-sm" aria-hidden="true" />
                <span className="sr-only">Search items</span>
                <input
                  type="text"
                  placeholder="Search item"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border-none bg-transparent text-sm text-sage-900 outline-none placeholder:text-sage-400"
                />
              </label>

              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowAddItem(true)}
                  className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-brand-900"
                >
                  <i className="bi bi-plus-lg" aria-hidden="true" /> Add Item
                </button>
              )}
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-sage-50/60">
                  {["Supply Name", "Category", "In stock", "Reorder at", "Next expiry", "Status", "Last updated"].map(label => (
                    <th key={label} className="border-b border-sage-100 px-5 py-3 text-left text-xs font-medium text-sage-400">{label}</th>
                  ))}
                  <th className="border-b border-sage-100 px-5 py-3 text-right text-xs font-medium text-sage-400"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {pagedSupplies.length > 0 ? pagedSupplies.map((supply) => {
                  const status = stockStatus(supply.total_stock, supply.reorder_level)
                  const days = expiryLabel(supply.nearest_expiry)
                  const updated = visitDateParts(supply.last_updated)
                  return (
                    <tr key={supply.supply_id} className="transition hover:bg-brand-50/40">
                      <td className="border-b border-sage-100 px-5 py-3 text-sm font-medium text-sage-900">
                        <button type="button" onClick={() => navigate(`/itemdetails/${supply.supply_id}`)} className={rowLinkClass}>
                          {supply.supply_name}
                        </button>
                      </td>
                      <td className="border-b border-sage-100 px-5 py-3 text-sm text-sage-500">{supply.category_name}</td>
                      <td className="whitespace-nowrap border-b border-sage-100 px-5 py-3 text-sm text-sage-700">
                        {withUnit(supply.total_stock > 0 ? supply.total_stock : 0, supply.unit)}
                      </td>
                      <td className="border-b border-sage-100 px-5 py-3 text-sm text-sage-500">
                        {supply.reorder_level ?? <span title="Default level; set the item's own on its page">{DEFAULT_REORDER_LEVEL}*</span>}
                      </td>
                      <td className="whitespace-nowrap border-b border-sage-100 px-5 py-3 text-sm text-sage-500">
                        {supply.nearest_expiry ? (
                          <>
                            <span className="block">{visitDateParts(supply.nearest_expiry).date}</span>
                            <span className="block text-xs text-sage-400">{days}</span>
                          </>
                        ) : "-"}
                      </td>
                      <td className="border-b border-sage-100 px-5 py-3">
                        <span className={`inline-flex w-[104px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium ${status.tone}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap border-b border-sage-100 px-5 py-3 text-sm text-sage-500">
                        {supply.last_updated ? `${updated.date}${updated.time ? ` ${updated.time}` : ""}` : "Never"}
                      </td>
                      <td className="border-b border-sage-100 px-5 py-3 text-right">
                        <RowActions label={`Actions for ${supply.supply_name}`} actions={[
                          { label: "Open item", icon: "bi-box-arrow-up-right", onSelect: () => navigate(`/itemdetails/${supply.supply_id}`) },
                          { label: "Reactivate item", icon: "bi-arrow-counterclockwise", hidden: !canManage || Boolean(supply.is_active), onSelect: () => setItemActive(supply, true) },
                          { label: "Delete item", icon: "bi-trash", danger: true, hidden: !canManage || !supply.is_active, onSelect: () => setItemActive(supply, false) },
                        ]} />
                      </td>
                    </tr>
                  )
                }) : !loaded ? <SkeletonRows cols={8} /> : (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <i className="bi bi-box-seam text-2xl text-sage-300" aria-hidden="true" />
                      <p className="mt-2 text-sm text-sage-400">No supplies found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination {...pager} />
          <p className="m-0 border-t border-sage-100 px-5 py-3 text-xs text-sage-400">
            * Default reorder level. Set each item's own level, and its unit, with Edit Details on its page.
          </p>
        </div>
      </div>
    </div>
  );
}

function AlertRow({ batch, detail, action, onOpen }: {
  batch: AlertBatch; detail: React.ReactNode; action?: React.ReactNode; onOpen: () => void
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0 text-sm">
        <button type="button" onClick={onOpen} className="text-left font-medium text-sage-900 hover:underline">{batch.supply_name}</button>
        <span className="block text-xs text-sage-500">
          Batch {batch.batch_number} · {withUnit(batch.stock_level, batch.unit)} · {detail}
        </span>
      </div>
      {action}
    </li>
  )
}

function StatCard({ icon, value, label, tone, onClick }: {
  icon: string; value: number; label: string; tone?: "amber" | "red"; onClick?: () => void
}) {
  const iconTone = value && tone === "red" ? "bg-red-50 text-red-700" : value && tone === "amber" ? "bg-amber-50 text-amber-800" : "bg-brand-50 text-brand-800"
  const body = (
    <>
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-lg ${iconTone}`}>
        <i className={`bi ${icon}`} aria-hidden="true" />
      </div>
      <div className="text-left">
        <div className="text-xl font-bold leading-none">{value}</div>
        <div className="mt-1 text-xs text-sage-400">{label}</div>
      </div>
    </>
  )
  const base = "flex items-center gap-3.5 rounded-2xl border border-sage-200 bg-white p-4 shadow-card"
  return onClick
    ? <button type="button" onClick={onClick} className={`${base} transition hover:border-brand-300`}>{body}</button>
    : <div className={base}>{body}</div>
}
