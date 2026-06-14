import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, ChevronDown, Eye, Mail, Phone } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getCustomers, deleteCustomer, Customer } from '../../services/api';
import AddCustomerModal from './AddCustomerModal';
import ViewCustomerModal from './ViewCustomerModal';

const segmentTagMap: Record<string, { className: string; icon?: string }> = {
  'VIP Customers': { className: 'segment-vip-customers', icon: '' },
  VIP: { className: 'segment-vip-customers', icon: '' },
  'High Spenders': { className: 'segment-high-spenders', icon: '' },
  'High Spender': { className: 'segment-high-spenders', icon: '' },
  'New Customers': { className: 'segment-new-customers', icon: '' },
  New: { className: 'segment-new-customers', icon: '' },
  'Lapsed Customers': { className: 'segment-lapsed-customers', icon: '' },
  Lapsed: { className: 'segment-lapsed-customers', icon: '' },
  'Premium Customers': { className: 'segment-premium-customers', icon: '' },
};

const cityOptions = ['All', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'];
const segmentOptions = ['All', 'VIP', 'Lapsed', 'New', 'High Spender'];
const sortOptions = ['Last Purchase', 'Total Spend', 'Join Date'];

function DeleteTrashIcon() {
  return (
    <svg className="trash-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="lid-group">
        <path d="M4 7h16" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
      </g>
      <path d="M6 7l1 12a1 1 0 001 1h8a1 1 0 001-1l1-12" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="edit-svgIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" fill="white" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" fill="white" />
    </svg>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
  const [viewCustomer, setViewCustomer] = useState<Customer | undefined>(undefined);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const search = searchParams.get('search') || '';
  const city = searchParams.get('city') || 'All';
  const segment = searchParams.get('segment') || 'All';
  const sortBy = searchParams.get('sort') || 'Last Purchase';

  useEffect(() => {
    let ignore = false;

    getCustomers()
      .then(data => {
        if (!ignore) setCustomers(data);
      })
      .catch(err => {
        if (!ignore) setError(err.message || 'Failed to load customers');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const updateParams = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'All' || value === 'Last Purchase' || !value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const filtered = useMemo(() => {
    return customers
      .filter(row => {
        const query = search.toLowerCase();
        const matchesSearch = [row.name, row.email, row.phone].some(value => value.toLowerCase().includes(query));
        const matchesCity = city === 'All' || row.city === city;
        const matchesSegment =
          segment === 'All' || (row.segment && row.segment.toLowerCase().includes(segment.toLowerCase().trim()));
        return matchesSearch && matchesCity && matchesSegment;
      })
      .sort((a, b) => {
        if (sortBy === 'Total Spend') return b.totalSpend - a.totalSpend;
        if (sortBy === 'Join Date') return String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''));
        const aLast = a.lastPurchaseDate ?? a.lastPurchase ?? '';
        const bLast = b.lastPurchaseDate ?? b.lastPurchase ?? '';
        return String(bLast).localeCompare(String(aLast));
      });
  }, [customers, search, city, segment, sortBy]);

  const handleViewCustomer = (customer: Customer) => {
    setViewCustomer(customer);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowAddModal(true);
  };

  const handleDeleteCustomer = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this customer?');
    if (!confirmed) return;

    try {
      setActionLoading(id);
      await deleteCustomer(id);
      setCustomers(prev => prev.filter(customer => customer._id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete customer';
      setError(message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 ambient-page"
    >
      <div className="grid gap-6 premium-card p-6 lg:grid-cols-[1.8fr_auto]">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-accent font-bold">Customer Directory</p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Customers</h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Keep your customer records clear, follow buying behavior, and segment your best audiences for smarter campaigns.
          </p>
        </div>
        <div className="flex items-center justify-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card-soft)] p-4 self-center">
          <button className="cssbuttons-io-button" onClick={() => setShowAddModal(true)}>
            Add Customer
          </button>
          {selectedIds.length > 0 ? (
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-danger/10 text-danger border border-danger/25 px-4 py-2 text-xs font-bold transition hover:bg-danger/15 active:scale-95"
              onClick={async () => {
                const confirmed = window.confirm(`Delete ${selectedIds.length} selected customer(s)?`);
                if (!confirmed) return;
                setBulkDeleting(true);
                try {
                  await Promise.all(selectedIds.map(id => deleteCustomer(id)));
                  setCustomers(prev => prev.filter(c => !selectedIds.includes(c._id)));
                  setSelectedIds([]);
                } catch (err) {
                  const message = err instanceof Error ? err.message : 'Failed to delete selected customers';
                  setError(message);
                } finally {
                  setBulkDeleting(false);
                }
              }}
              disabled={bulkDeleting}
            >
              <DeleteTrashIcon />
              {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 premium-card p-4 xl:grid-cols-[1.6fr_1fr_1fr_1fr] ambient-panel">
        <label className="flex w-full items-center gap-2.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-[var(--text-muted)] focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/10 transition duration-200">
          <Search className="h-4 w-4 shrink-0" />
          <input
            value={search}
            onChange={e => updateParams('search', e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </label>
        <select value={city} onChange={e => updateParams('city', e.target.value)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none cursor-pointer">
          {cityOptions.map(option => (
            <option key={option} value={option}>{option === 'All' ? 'All Cities' : option}</option>
          ))}
        </select>
        <select value={segment} onChange={e => updateParams('segment', e.target.value)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none cursor-pointer">
          {segmentOptions.map(option => (
            <option key={option} value={option}>{option === 'All' ? 'All Segments' : option}</option>
          ))}
        </select>
        <select value={sortBy} onChange={e => updateParams('sort', e.target.value)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none cursor-pointer">
          {sortOptions.map(option => (
            <option key={option} value={option}>{`Sort: ${option}`}</option>
          ))}
        </select>
      </div>

      <div className="premium-card p-6 ambient-section">
        <div className="overflow-x-auto">
          <table className="table-sticky min-w-full text-left text-sm text-[var(--text-secondary)]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-4 w-12">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[var(--border)] text-accent focus:ring-accent/20 cursor-pointer"
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={e => {
                      if (e.target.checked) setSelectedIds(filtered.map(r => r._id));
                      else setSelectedIds([]);
                    }}
                  />
                </th>
                <th className="px-4 py-4 min-w-[160px] text-[12px] uppercase tracking-[0.06em] font-semibold text-[var(--text-muted)]">Customer</th>
                <th className="px-4 py-4 w-[90px] text-[12px] uppercase tracking-[0.06em] font-semibold text-[var(--text-muted)]">City</th>
                <th className="px-4 py-4 w-[80px] text-center text-[12px] uppercase tracking-[0.06em] font-semibold text-[var(--text-muted)]">Total Orders</th>
                <th className="px-4 py-4 w-[100px] text-right text-[12px] uppercase tracking-[0.06em] font-semibold text-[var(--text-muted)]">Total Spend</th>
                <th className="px-4 py-4 w-[100px] text-[12px] uppercase tracking-[0.06em] font-semibold text-[var(--text-muted)]">Last Purchase</th>
                <th className="px-4 py-4 w-[130px] text-[12px] uppercase tracking-[0.06em] font-semibold text-[var(--text-muted)]">Segment</th>
                <th className="px-4 py-4 w-[90px] text-[12px] uppercase tracking-[0.06em] font-semibold text-[var(--text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-6">
                    <div className="space-y-3">
                      {[1, 2, 4, 5].map(i => (
                        <div key={i} className="skeleton h-12 w-full" />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row, index) => {
                  const tagKey = Object.keys(segmentTagMap).find(key => key.toLowerCase() === (row.segment || '').toLowerCase());
                  const tagClass = tagKey ? segmentTagMap[tagKey] : { className: 'segment-default' };
                  const isExpanded = expandedCustomerId === row._id;
                  return (
                    <>
                      <motion.tr
                        key={row._id ?? index}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.25 }}
                        onClick={() => setExpandedCustomerId(prev => (prev === row._id ? null : row._id))}
                        className="hover:bg-[var(--bg-card-soft)] transition-colors group cursor-pointer"
                      >
                        <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-[var(--border)] text-accent focus:ring-accent/20 cursor-pointer"
                            checked={selectedIds.includes(row._id)}
                            onChange={e => {
                              if (e.target.checked) setSelectedIds(prev => [...prev, row._id]);
                              else setSelectedIds(prev => prev.filter(id => id !== row._id));
                            }}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3 min-w-[160px]">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setExpandedCustomerId(prev => (prev === row._id ? null : row._id));
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors duration-150 hover:bg-[var(--bg-card-soft)] hover:text-[var(--text-primary)]"
                              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                            >
                              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-xs font-bold text-accent border border-accent/15">
                                {row.name.split(' ').map(part => part[0]).join('')}
                              </div>
                              <div>
                                <p className="font-semibold text-[var(--text-primary)] group-hover:text-accent transition-colors">{row.name}</p>
                                <p className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">Joined {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 w-[90px]">{row.city}</td>
                        <td className="px-4 py-4 w-[80px] text-center font-medium">{row.totalOrders}</td>
                        <td className="px-4 py-4 w-[100px] text-right font-semibold text-[var(--text-primary)]">${row.totalSpend.toFixed(2)}</td>
                        <td className="px-4 py-4 w-[100px] font-medium">{(row.lastPurchaseDate ?? row.lastPurchase) ? new Date((row.lastPurchaseDate ?? row.lastPurchase) as string).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-4 w-[130px]">
                          <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-bold tracking-wide ${tagClass.className}`}>
                            {tagClass.icon ? <span className="segment-icon" aria-hidden="true">{tagClass.icon}</span> : null}
                            <span>{row.segment}</span>
                          </span>
                        </td>
                        <td className="px-4 py-4 w-[90px]">
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleViewCustomer(row)}
                              className="btn-secondary !p-2 !min-w-0"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </motion.button>
                            <button
                              type="button"
                              onClick={() => handleEditCustomer(row)}
                              className="edit-button"
                              title="Edit Customer"
                            >
                              <EditIcon />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomer(row._id)}
                              className="delete-button"
                              title="Delete Customer"
                              disabled={actionLoading === row._id}
                            >
                              <DeleteTrashIcon />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                      <AnimatePresence initial={false}>
                        {isExpanded ? (
                          <tr key={`detail-${row._id}`} className="overflow-hidden">
                            <td colSpan={8} className="px-4 py-0">
                              <motion.div
                                initial={{ opacity: 0, maxHeight: 0 }}
                                animate={{ opacity: 1, maxHeight: 120 }}
                                exit={{ opacity: 0, maxHeight: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="customer-detail-panel rounded-[6px] bg-[var(--bg-card-soft)] px-4 py-[10px] text-[var(--text-secondary)]">
                                  <div className="flex flex-wrap items-center gap-6">
                                    <div className="inline-flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-[var(--text-muted)]" />
                                      <span className="text-sm font-medium text-[var(--text-primary)]">{row.email}</span>
                                    </div>
                                    <div className="inline-flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-[var(--text-muted)]" />
                                      <span className="text-sm font-medium text-[var(--text-primary)]">{row.phone}</span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        ) : null}
                      </AnimatePresence>
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-col gap-4 border-t border-[var(--border)] pt-4 text-xs font-semibold text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>Showing {filtered.length ? `1–${filtered.length}` : '0'} of {customers.length} records</p>
          <div className="inline-flex items-center gap-1 bg-[var(--bg-card-soft)] border border-[var(--border)] p-1 rounded-xl">
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] transition hover:border-accent hover:text-accent hover:bg-white disabled:cursor-not-allowed disabled:opacity-30" disabled>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] transition hover:border-accent hover:text-accent hover:bg-white">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <AddCustomerModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingCustomer(undefined);
        }}
        customer={editingCustomer}
        onCustomerSaved={savedCustomer => {
          setCustomers(prev => {
            const existingIndex = prev.findIndex(item => item._id === savedCustomer._id);
            if (existingIndex >= 0) {
              const next = [...prev];
              next[existingIndex] = savedCustomer;
              return next;
            }
            return [savedCustomer, ...prev];
          });
        }}
      />
      <ViewCustomerModal
        open={Boolean(viewCustomer)}
        onClose={() => setViewCustomer(undefined)}
        customer={viewCustomer}
      />
    </motion.div>
  );
}
