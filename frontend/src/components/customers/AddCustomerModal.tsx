import { FormEvent, useEffect, useState } from 'react';
import { useToast } from '../ui/Toast';
import { createCustomer, updateCustomer, Customer } from '../../services/api';
import Modal from '../ui/Modal';

const segmentOptions = ['VIP', 'Lapsed', 'New', 'High Spender'];

interface AddCustomerModalProps {
  open: boolean;
  onClose: () => void;
  customer?: Customer;
  onCustomerSaved: (customer: Customer) => void;
}

export default function AddCustomerModal({ open, onClose, customer, onCustomerSaved }: AddCustomerModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [totalOrders, setTotalOrders] = useState('');
  const [totalSpend, setTotalSpend] = useState('');
  const [lastPurchase, setLastPurchase] = useState('');
  const [segment, setSegment] = useState(segmentOptions[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(customer?.name ?? '');
      setEmail(customer?.email ?? '');
      setPhone(customer?.phone ?? '');
      setCity(customer?.city ?? '');
      setTotalOrders(customer?.totalOrders != null ? String(customer.totalOrders) : '');
      setTotalSpend(customer?.totalSpend != null ? String(customer.totalSpend) : '');
      setLastPurchase(customer?.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toISOString().slice(0, 10) : '');
      setSegment(customer?.segment ?? segmentOptions[0]);
      setError(null);
      setSubmitting(false);
    }
  }, [open, customer]);

  const validate = () => {
    if (!name.trim()) return 'Name is required';
    if (!email.trim()) return 'Email is required';
    if (!phone.trim()) return 'Phone is required';
    if (!city.trim()) return 'City is required';
    if (totalOrders && (Number.isNaN(Number(totalOrders)) || Number(totalOrders) < 0)) return 'Total Orders must be a valid non-negative number';
    if (totalSpend && (Number.isNaN(Number(totalSpend)) || Number(totalSpend) < 0)) return 'Total Spend must be a valid non-negative number';
    if (!segment.trim()) return 'Segment is required';
    return null;
  };

  const isEditMode = Boolean(customer?._id);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        city: city.trim(),
        totalOrders: Number(totalOrders) || 0,
        totalSpend: Number(totalSpend) || 0,
        lastPurchaseDate: lastPurchase ? new Date(lastPurchase).toISOString() : undefined,
        segment: segment.trim(),
      };

      const savedCustomer = customer
        ? await updateCustomer(customer._id, payload)
        : await createCustomer(payload);

      onCustomerSaved(savedCustomer);
      toast('success', isEditMode ? 'Customer updated successfully' : 'Customer added successfully');
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save customer.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition';

  return (
    <Modal open={open} onClose={onClose} title={isEditMode ? 'Edit Customer' : 'Add Customer'}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Name</span>
            <input value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Full name" required />
          </label>
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Email</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="name@example.com" required />
          </label>
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Phone</span>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} placeholder="+91 98765 43210" required />
          </label>
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">City</span>
            <input value={city} onChange={e => setCity(e.target.value)} className={inputClass} placeholder="Mumbai" required />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Total Orders</span>
            <input type="number" min="0" value={totalOrders} onChange={e => setTotalOrders(e.target.value)} className={inputClass} placeholder="0" required />
          </label>
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Total Spend ($)</span>
            <input type="number" min="0" step="0.01" value={totalSpend} onChange={e => setTotalSpend(e.target.value)} className={inputClass} placeholder="0.00" required />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Last Purchase Date</span>
            <input type="date" value={lastPurchase} onChange={e => setLastPurchase(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Segment</span>
            <select value={segment} onChange={e => setSegment(e.target.value)} className={inputClass + ' cursor-pointer'} required>
              {segmentOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        {error ? (
          <div className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-2.5 text-xs font-semibold text-danger">{error}</div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end border-t border-[var(--border)] pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
