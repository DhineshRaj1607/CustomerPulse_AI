import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart2,
  ChevronDown,
  Clock,
  Filter,
  LayoutDashboard,
  Megaphone,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getCustomers } from '../../services/api';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Customers',
    path: '/customers',
    icon: Users,
    children: [
      { label: 'All Customers', segment: 'All', icon: UserCheck },
      { label: 'VIP Customers', segment: 'VIP', icon: Star },
      { label: 'High Spenders', segment: 'High Spender', icon: TrendingUp },
      { label: 'New Customers', segment: 'New', icon: Sparkles },
      { label: 'Lapsed Customers', segment: 'Lapsed', icon: Clock },
    ],
  },
  { label: 'Segments', path: '/segments', icon: Filter },
  { label: 'Campaigns', path: '/campaigns', icon: Megaphone },
  { label: 'Analytics', path: '/analytics', icon: BarChart2 },
];

export default function Sidebar({ onOpenAssistant }: { onOpenAssistant: () => void }) {
  const location = useLocation();
  const [customers, setCustomers] = useState<number>(0);
  const [vipCount, setVipCount] = useState<number>(0);
  const [highSpenderCount, setHighSpenderCount] = useState<number>(0);
  const [newCount, setNewCount] = useState<number>(0);
  const [lapsedCount, setLapsedCount] = useState<number>(0);
  const [customersExpanded, setCustomersExpanded] = useState(false);

  const currentSegment = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('segment') || 'All';
  }, [location.search]);

  const isCustomersPath = location.pathname === '/customers';
  const isCustomersSection = location.pathname === '/customers';

  useEffect(() => {
    if (isCustomersSection) {
      setCustomersExpanded(true);
    }
  }, [isCustomersSection]);

  useEffect(() => {
    let ignore = false;
    getCustomers()
      .then(data => {
        if (ignore) return;
        setCustomers(data.length);
        setVipCount(data.filter(customer => (customer.segment || '').toLowerCase().includes('vip')).length);
        setHighSpenderCount(data.filter(customer => (customer.segment || '').toLowerCase().includes('high spender')).length);
        setNewCount(data.filter(customer => (customer.segment || '').toLowerCase().includes('new')).length);
        setLapsedCount(data.filter(customer => (customer.segment || '').toLowerCase().includes('lapsed')).length);
      })
      .catch(() => {
        if (ignore) return;
      });
    return () => {
      ignore = true;
    };
  }, []);

  const submenuCounts = useMemo(
    () => ({
      All: customers,
      VIP: vipCount,
      'High Spender': highSpenderCount,
      New: newCount,
      Lapsed: lapsedCount,
    }),
    [customers, vipCount, highSpenderCount, newCount, lapsedCount]
  );

  const submenuChildrenVariant = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <aside className="app-sidebar w-[260px] shrink-0 px-5 py-7 text-sm flex flex-col min-h-screen">
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-7 rounded-2xl bg-[rgba(255,255,255,0.06)] p-5 border border-[rgba(255,255,255,0.12)] shadow-[0_18px_40px_rgba(15,23,42,0.18)] ring-1 ring-white/10 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-lg text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)] font-bold">✦</span>
          <div>
            <p className="text-base font-bold tracking-tight text-white">CustomerPulse</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200">AI Mini CRM</p>
          </div>
        </div>
      </motion.div>

      <nav className="mt-2 space-y-1 flex-1">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isCustomerParent = !!item.children;
          const customersActive = location.pathname === '/customers';
          const currentSegment = new URLSearchParams(location.search).get('segment') || 'All';
          const active = isCustomerParent ? customersActive : location.pathname === item.path;

          if (!isCustomerParent) {
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <Link
                  to={item.path}
                  className={`sidebar-link group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium transition duration-200 ${
                    active
                      ? 'sidebar-item-active'
                      : 'sidebar-link-inactive'
                  }`}
                >
                  <span className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-gradient-to-b from-sky-400 via-cyan-300 to-blue-200 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="sidebar-active-indicator absolute left-0 top-1/2 -translate-y-1/2"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon className={`h-5 w-5 transition-colors ${active ? 'text-accent' : 'text-[var(--text-muted)]'}`} />
                  <span>{item.label}</span>
                </Link>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <div className="relative rounded-2xl border border-transparent">
                <div
                  className={`sidebar-link relative flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 font-medium transition duration-200 ${
                    active ? 'sidebar-item-active' : 'sidebar-link-inactive'
                  }`} 
                >
                  <Link
                    to="/customers"
                    onClick={() => setCustomersExpanded(true)}
                    className="flex items-center gap-3 group"
                  >
                    <Icon className={`h-5 w-5 transition-colors ${active ? 'text-accent' : 'text-[var(--text-muted)]'}`} />
                    <span>Customers</span>
                  </Link>
                  <motion.button
                    type="button"
                    onClick={() => setCustomersExpanded(prev => !prev)}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                      active ? 'bg-accent/10 text-accent' : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-soft)]'
                    }`}
                    aria-label="Toggle customer submenu"
                  >
                    <ChevronDown className={`h-4.5 w-4.5 transition-transform ${customersExpanded ? 'rotate-180' : 'rotate-0'}`} />
                  </motion.button>
                </div>

                <AnimatePresence initial={false}>
                  {customersExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                      className="overflow-hidden submenu-wrapper"
                    >
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                        className="mt-2 space-y-1 px-2 submenu-container"
                      >
                        {item.children.map(child => {
                          const childActive = customersActive && currentSegment === child.segment;
                          const count = submenuCounts[child.segment] ?? 0;
                          const ChildIcon = child.icon;
                          return (
                            <motion.div key={child.segment} variants={submenuChildrenVariant}>
                              <Link
                                to={`/customers?segment=${encodeURIComponent(child.segment)}`}
                                className={`sidebar-sublink flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition duration-200 ${
                                  childActive
                                    ? 'sidebar-sublink-active'
                                    : 'sidebar-sublink-inactive'
                                }`}
                              >
                                <ChildIcon className={`h-4 w-4 transition-colors ${childActive ? 'text-accent' : 'text-[var(--text-muted)]'}`} />
                                <span className="flex-1">{child.label}</span>
                                <span className="count-badge">{count}</span>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </nav>

      <div className="pt-6 mt-auto border-t border-[var(--border)]">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenAssistant}
          className="ai-pulse flex w-full items-center justify-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm font-semibold text-accent transition duration-200 hover:bg-accent hover:text-white hover:shadow-[0_4px_16px_rgba(37,99,235,0.3)]"
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          AI Assistant
        </motion.button>
      </div>
    </aside>
  );
}
