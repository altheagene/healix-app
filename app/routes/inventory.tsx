import { apiFetch } from "../api";
import AddItem from "~/components/additem";
import React from "react";
import { useNavigate } from "react-router";
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function Inventory() {
  const navigate = useNavigate();
  const [showAddItem, setShowAddItem] = React.useState(false);
  const [supplies, setSupplies] = React.useState<any[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [chosenActive, setChosenActive] = React.useState(true);
  const [selectedCategory, setSelectedCategory] = React.useState("All Items");
  const [openMenuId, setOpenMenuId] = React.useState<any>(null);

  React.useEffect(() => {
    apiFetch(`/getallsupplies`)
      .then(res => res.json())
      .then(data => setSupplies(data));

  }, []);

  async function removeItem(id: any) {
    const responses = await apiFetch(`/deleteitem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ supply_id: id, is_active: false })
    })

    await responses.json()
    refetchSupplies();
  }

  async function reactivateItem(id: any) {
    const responses = await apiFetch(`/deleteitem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ supply_id: id, is_active: true })
    })

    await responses.json()
    refetchSupplies();
  }

  function refetchSupplies() {
    apiFetch(`/getallsupplies`)
      .then(res => res.json())
      .then(data => setSupplies(data));
  }

  // Derive unique categories from supplies dynamically
  const categories = ["All Items", ...Array.from(new Set(supplies.map(s => s.category_name)))];

  // Filtered supplies based on search term + active status + category
  const filteredSupplies = supplies.filter(supply =>
    (supply.supply_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supply.category_name.toLowerCase().includes(searchTerm.toLowerCase())) &&
    supply.is_active == chosenActive &&
    (selectedCategory === "All Items" || supply.category_name === selectedCategory)
  );

  // Stats reflect the current Active/Deleted view, independent of search or category filter
  const activeScopedSupplies = supplies.filter(s => s.is_active == chosenActive);
  const totalItems = activeScopedSupplies.length;
  const categoryCount = new Set(activeScopedSupplies.map(s => s.category_name).filter(Boolean)).size;
  const lowStockCount = activeScopedSupplies.filter(s => s.total_stock > 0 && s.total_stock <= 20).length;
  const outOfStockCount = activeScopedSupplies.filter(s => !(s.total_stock > 0)).length;

  function stockBadgeClasses(stock: number) {
    if (stock > 20) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60'
    if (stock > 0) return 'bg-teal-50 text-teal-800 ring-1 ring-teal-200/60'
    return 'bg-red-50 text-red-700 ring-1 ring-red-200/60'
  }

  function stockLabel(stock: number) {
    if (stock > 20) return 'In Stock'
    if (stock > 0) return 'Low Stock'
    return 'Out-of-Stock'
  }

  return (
    <div className="min-h-full font-sans text-slate-900">
      <div className="mx-auto max-w-full">

        {showAddItem && (
          <AddItem hideForm={() => setShowAddItem(false)} refetchSupplies={refetchSupplies} />
        )}

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-[2rem] font-semibold tracking-tight m-0">Inventory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your clinic's inventory, supplies, and equipment.</p>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon="bi-box-seam" value={totalItems} label="Total Items" />
          <StatCard icon="bi-tags" value={categoryCount} label="Categories" />
          <StatCard icon="bi-exclamation-triangle" value={lowStockCount} label="Low Stock" />
          <StatCard icon="bi-x-octagon" value={outOfStockCount} label="Out of Stock" />
        </div>

        {/* CONTROLS */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
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
                  Deleted Supplies
                </button>
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <label className="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-400 focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100 sm:w-64">
                <i className="bi bi-search text-sm" />
                <input
                  type="text"
                  placeholder="Search item"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </label>

              <button
                onClick={() => setShowAddItem(true)}
                className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-teal-900"
              >
                <i className="bi bi-plus-lg" /> Add Item
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">Supply Name</th>
                  <th className="border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">Category</th>
                  <th className="border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">Total Stock</th>
                  <th className="w-32 border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">Status</th>
                  <th className="border-b border-slate-100 px-5 py-3 text-left text-xs font-medium text-slate-400">Last Updated</th>
                  <th className="border-b border-slate-100 px-5 py-3 text-right text-xs font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSupplies.length > 0 ? filteredSupplies.map((supply) => (
                  <tr key={supply.supply_id} className="transition hover:bg-teal-50/40">
                    <td className="border-b border-slate-100 px-5 py-3 text-sm font-medium text-slate-900 last:border-none">
                      {supply.supply_name}
                    </td>
                    <td className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500 last:border-none">
                      {supply.category_name}
                    </td>
                    <td className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500 last:border-none">
                      {supply.total_stock > 0 ? supply.total_stock : 0}
                    </td>
                    <td className="border-b border-slate-100 px-5 py-3 last:border-none">
                    <span className={`inline-flex w-[104px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium ${stockBadgeClasses(supply.total_stock)}`}>
                      {stockLabel(supply.total_stock)}
                    </span>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500 last:border-none">
                      {supply.last_updated || "None"}
                    </td>
                    <td className="border-b border-slate-100 px-5 py-3 text-right last:border-none">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === supply.supply_id ? null : supply.supply_id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          <i className="bi bi-three-dots-vertical" />
                        </button>

                        {openMenuId === supply.supply_id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                              <button
                                onClick={() => { navigate(`/itemdetails/${supply.supply_id}`); setOpenMenuId(null); }}
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                              >
                                <i className="bi bi-eye" /> View
                              </button>

                              {supply.is_active ? (
                                <button
                                  onClick={() => { removeItem(supply.supply_id); setOpenMenuId(null); }}
                                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                                >
                                  <i className="bi bi-trash" /> Delete
                                </button>
                              ) : (
                                <button
                                  onClick={() => { reactivateItem(supply.supply_id); setOpenMenuId(null); }}
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
                      <p className="mt-2 text-sm text-slate-400">No Supplies found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50 text-lg text-teal-800">
        <i className={`bi ${icon}`} />
      </div>
      <div>
        <div className="text-xl font-bold leading-none">{value}</div>
        <div className="mt-1 text-xs text-slate-400">{label}</div>
      </div>
    </div>
  )
}