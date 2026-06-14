import { motion } from 'framer-motion';
import Modal from '../ui/Modal';
import { Customer } from '../../services/api';

interface ViewCustomerModalProps {
  open: boolean;
  onClose: () => void;
  customer?: Customer;
}

export default function ViewCustomerModal({ open, onClose, customer }: ViewCustomerModalProps) {
  if (!customer) return null;

  return (
    <Modal open={open} onClose={onClose} title="Customer details">
      <div className="space-y-5">
        <div className="flex items-center gap-4 border-b border-[var(--border)] pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-sm font-bold text-accent border border-accent/15">
            {customer.name.split(' ').map(p => p[0]).join('')}
          </div>
          <div>
            <p className="text-base font-bold text-[var(--text-primary)] tracking-tight">{customer.name}</p>
            <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-0.5">
              Joined {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: 'Email', value: customer.email },
            { label: 'Phone', value: customer.phone },
            { label: 'City', value: customer.city },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-card-soft)] p-4"
            >
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">{item.label}</p>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-1 break-all">{item.value}</p>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-card-soft)] p-4"
          >
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Segment</p>
            <p className="text-sm font-semibold mt-1">
              <span className="inline-flex rounded-lg bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-xs text-accent font-bold uppercase tracking-wider">
                {customer.segment}
              </span>
            </p>
          </motion.div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 border-t border-[var(--border)] pt-4">
          {[
            { label: 'Total Orders', value: customer.totalOrders, accent: false },
            { label: 'Total Spend', value: `$${Number(customer.totalSpend).toFixed(2)}`, accent: true },
            {
              label: 'Last Purchase',
              value: (customer.lastPurchaseDate ?? customer.lastPurchase)
                ? new Date((customer.lastPurchaseDate ?? customer.lastPurchase) as string).toLocaleDateString()
                : '—',
              accent: false,
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="rounded-xl border border-[var(--border)] bg-white p-4 text-center shadow-sm"
            >
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">{stat.label}</p>
              <p className={`text-lg font-bold mt-1 ${stat.accent ? 'text-accent' : 'text-[var(--text-primary)]'}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
