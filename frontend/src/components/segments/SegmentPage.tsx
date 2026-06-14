import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Plus, Sparkles } from 'lucide-react';
import { getSegments, createSegment, Segment, deleteSegment, getCustomers, Customer } from '../../services/api';
import { useToast } from '../ui/Toast';

type Condition = {
  id: number;
  attribute: string;
  operator: string;
  value: string;
};

const attributes = ['Total Spend', 'Order Count', 'Last Purchase', 'City', 'Channel', 'Join Date'];
const operators = ['is', 'is not', 'greater than', 'less than', 'contains', 'in last X days'];
const metroCities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'];

const evaluateCondition = (customer: Customer, condition: Condition): boolean => {
  const { attribute, operator, value } = condition;

  switch (attribute) {
    case 'Total Spend': {
      const spend = customer.totalSpend || 0;
      const compareValue = parseFloat(value.replace(/[₹,]/g, '')) || 0;
      switch (operator) {
        case 'greater than': return spend > compareValue;
        case 'less than': return spend < compareValue;
        case 'is': return spend === compareValue;
        case 'is not': return spend !== compareValue;
        default: return false;
      }
    }
    case 'Order Count': {
      const orders = customer.totalOrders || 0;
      const compareValue = parseInt(value) || 0;
      switch (operator) {
        case 'greater than': return orders > compareValue;
        case 'less than': return orders < compareValue;
        case 'is': return orders === compareValue;
        case 'is not': return orders !== compareValue;
        default: return false;
      }
    }
    case 'Last Purchase': {
      if (!customer.lastPurchaseDate) return false;
      const lastPurchase = new Date(customer.lastPurchaseDate);
      const today = new Date();
      const daysAgo = Math.floor((today.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));
      const daysValue = parseInt(value) || 0;
      switch (operator) {
        case 'in last X days': return daysAgo <= daysValue;
        case 'greater than': return daysAgo > daysValue;
        case 'less than': return daysAgo < daysValue;
        default: return false;
      }
    }
    case 'City': {
      const city = (customer.city || '').toLowerCase();
      const searchValue = value.toLowerCase();
      switch (operator) {
        case 'contains': return city.includes(searchValue);
        case 'is': return city === searchValue;
        case 'is not': return city !== searchValue;
        default: return false;
      }
    }
    case 'Channel':
    case 'Join Date':
      return true;
    default:
      return false;
  }
};

const matchesConditions = (customer: Customer, conditions: Condition[], ruleMode: 'AND' | 'OR'): boolean => {
  if (conditions.length === 0) return true;
  const results = conditions.map(condition => evaluateCondition(customer, condition));
  if (ruleMode === 'AND') return results.every(r => r === true);
  return results.some(r => r === true);
};

const parseAiPrompt = (prompt: string): { conditions: Condition[]; interpretation: string[] } => {
  const normalized = prompt.trim().toLowerCase();
  const conditions: Condition[] = [];
  const interpretation: string[] = [];

  const parseNumber = (text: string) => {
    const match = text.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
  };

  const spendPatterns = [
    /(?:spent|spend|spending|total\s+spend).*?(?:more than|over|greater than|above|>)\s*₹?([\d,]+)/i,
    /₹?([\d,]+).*?(?:spent|spend|spending|total\s+spend)/i,
    /total\s+spend.*?([\d,]+)/i,
  ];

  let spendMatch = null;
  for (const pattern of spendPatterns) {
    spendMatch = normalized.match(pattern);
    if (spendMatch) break;
  }

  if (spendMatch) {
    const amount = parseNumber(spendMatch[1]);
    if (amount > 0) {
      conditions.push({ id: Date.now() + conditions.length, attribute: 'Total Spend', operator: 'greater than', value: `₹${amount}` });
      interpretation.push(`Total Spend > ₹${amount}`);
    }
  }

  const orderPatterns = [
    /(?:more than|over|greater than|above|>)\s*(\d+)\s*(?:order|purchase|buy)/i,
    /(\d+)\+?\s*(?:order|purchase|buy)/i,
  ];

  let orderMatch = null;
  for (const pattern of orderPatterns) {
    if (normalized.match(/order|purchase|buy/i)) {
      orderMatch = normalized.match(pattern);
      if (orderMatch && !normalized.match(/month|day|year|time/i)) break;
    }
  }

  if (orderMatch) {
    const count = parseInt(orderMatch[1], 10) || 0;
    if (count > 0 && !normalized.match(/days?.*order/i)) {
      conditions.push({ id: Date.now() + conditions.length, attribute: 'Order Count', operator: 'greater than', value: `${count}` });
      interpretation.push(`Order Count > ${count}`);
    }
  }

  const notPurchasedPatterns = [
    /(?:haven't|have\s+not|not)\s+(?:purchased|bought|ordered).*?(?:in\s+(?:the\s+)?last|within|for)\s+(\d+)\s*days?/i,
    /(?:no\s+(?:purchase|order|buy)).*?(?:in\s+(?:the\s+)?last|within|for)\s+(\d+)\s*days?/i,
    /(?:in\s+(?:the\s+)?last|within|for)\s+(\d+)\s*days?.*?(?:haven't|have\s+not|not)\s+(?:purchased|bought|ordered)/i,
  ];

  let lastPurchaseMatch = null;
  let isNegativePurchase = false;

  for (const pattern of notPurchasedPatterns) {
    lastPurchaseMatch = normalized.match(pattern);
    if (lastPurchaseMatch) {
      isNegativePurchase = true;
      break;
    }
  }

  if (!isNegativePurchase) {
    const inLastMatch = normalized.match(/(?:in\s+(?:the\s+)?last|within|for)\s+(\d+)\s*days?/i);
    if (inLastMatch) lastPurchaseMatch = inLastMatch;
  }

  if (lastPurchaseMatch) {
    const days = parseInt(lastPurchaseMatch[1], 10) || 0;
    if (isNegativePurchase) {
      conditions.push({ id: Date.now() + conditions.length, attribute: 'Last Purchase', operator: 'greater than', value: `${days}` });
      interpretation.push(`Last Purchase > ${days} days ago`);
    } else {
      conditions.push({ id: Date.now() + conditions.length, attribute: 'Last Purchase', operator: 'in last X days', value: `${days}` });
      interpretation.push(`Last Purchase in last ${days} days`);
    }
  }

  const cityPatterns = [
    /(?:live|located|based|city|cities?|metro)\s+(?:in|at)?\s*(mumbai|delhi|bangalore|chennai|hyderabad|metro)/i,
    /(?:mumbai|delhi|bangalore|chennai|hyderabad|metro)\s+(?:city|cities?|metro)?/i,
  ];

  let cityMatch = null;
  for (const pattern of cityPatterns) {
    cityMatch = normalized.match(pattern);
    if (cityMatch) break;
  }

  if (cityMatch) {
    const cityValue = cityMatch[1].toLowerCase();
    const isMetro = cityValue === 'metro' || normalized.includes('metro cities') || normalized.includes('metro city');
    const city = isMetro ? 'Metro' : cityValue.charAt(0).toUpperCase() + cityValue.slice(1);
    conditions.push({ id: Date.now() + conditions.length, attribute: 'City', operator: 'contains', value: city });
    interpretation.push(isMetro ? 'City in Metro areas' : `City is ${city}`);
  }

  if (conditions.length === 0) {
    interpretation.push('Could not parse any conditions from the prompt');
  }

  return { conditions, interpretation };
};

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

export default function SegmentPage() {
  const [activeTab, setActiveTab] = useState<'rule-builder' | 'ai'>('rule-builder');
  const [segments, setSegments] = useState<Segment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [segmentName, setSegmentName] = useState('Metro High Spenders');
  const [ruleMode, setRuleMode] = useState<'AND' | 'OR'>('AND');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conditions, setConditions] = useState<Condition[]>([
    { id: 1, attribute: 'Total Spend', operator: 'greater than', value: '₹5000' },
    { id: 2, attribute: 'Last Purchase', operator: 'in last X days', value: '45' },
    { id: 3, attribute: 'City', operator: 'contains', value: 'Metro' },
  ]);
  const [aiPrompt, setAiPrompt] = useState('Customers who spent more than ₹5000 but haven\'t purchased in the last 45 days and live in metro cities');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ interpretation: string[]; reach: string } | null>(null);
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const estimatedReach = useMemo(() => {
    if (customers.length === 0) return '~0 Customers';
    const matchingCustomers = customers.filter(customer => matchesConditions(customer, conditions, ruleMode));
    return `~${matchingCustomers.length} Customers`;
  }, [customers, conditions, ruleMode]);

  const addCondition = () => {
    setConditions(prev => [...prev, { id: Date.now(), attribute: 'Total Spend', operator: 'greater than', value: '' }]);
  };

  const updateCondition = (id: number, field: keyof Condition, value: string) => {
    setConditions(prev => prev.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const removeCondition = (id: number) => {
    setConditions(prev => prev.filter(item => item.id !== id));
  };

  const saveSegment = async () => {
    const matchingCustomers = customers.filter(customer => matchesConditions(customer, conditions, ruleMode));
    const payload = {
      name: segmentName,
      conditions: conditions.map(item => `${item.attribute} ${item.operator} ${item.value}`),
      estimatedReach: matchingCustomers.length,
    };

    try {
      await createSegment(payload);
      toast('success', 'Segment saved successfully.');
      const updatedSegments = await getSegments();
      setSegments(updatedSegments);
      try {
        window.dispatchEvent(new CustomEvent('segments:updated', { detail: { segments: updatedSegments } }));
      } catch (e) {
        // ignore
      }
    } catch (err) {
      toast('error', 'Failed to save segment.');
    }
  };

  const generateSegment = () => {
    setAiLoading(true);
    setAiResult(null);
    window.setTimeout(() => {
      const { conditions: aiConditions, interpretation } = parseAiPrompt(aiPrompt);
      const matchingCustomers = customers.filter(customer => matchesConditions(customer, aiConditions, 'AND'));
      setAiLoading(false);
      setAiResult({ interpretation, reach: `~${matchingCustomers.length} Customers` });
      setConditions(aiConditions);
    }, 1500);
  };

  const handleConfirmAndSave = () => {
    setActiveTab('rule-builder');
    saveSegment();
  };

  const handleEditRules = () => {
    setActiveTab('rule-builder');
  };

  useEffect(() => {
    let ignore = false;
    const loadData = async () => {
      try {
        const [segmentsData, customersData] = await Promise.all([getSegments(), getCustomers()]);
        if (!ignore) {
          setSegments(segmentsData);
          setCustomers(customersData);
        }
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadData();
    return () => { ignore = true; };
  }, []);

  const selectClass = 'min-w-0 rounded-lg border border-[var(--border)] bg-white px-2 py-2 text-xs outline-none cursor-pointer focus:border-accent focus:ring-2 focus:ring-accent/10 transition';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 ambient-page">
      <div className="premium-card p-6 ambient-section">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Segments</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Build targeted groups for high-converting messaging.</p>
          </div>
          <button onClick={addCondition} className="btn-primary inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Condition
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="premium-card p-6 h-fit ambient-panel">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Segment Library</h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Find your segments and preview recent impact.</p>
            </div>
            <span className="rounded-full bg-[var(--bg-card-soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border border-[var(--border)]">
              {segments.length} segments
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {loading ? (
              <div className="col-span-2 space-y-3">
                {[1, 2].map(i => <div key={i} className="skeleton h-24 w-full" />)}
              </div>
            ) : error ? (
              <div className="col-span-2 rounded-xl border border-[var(--border)] p-6 text-center text-xs text-danger font-semibold">{error}</div>
            ) : segments.length === 0 ? (
              <div className="col-span-2 rounded-xl border border-[var(--border)] p-6 text-center text-xs text-[var(--text-muted)]">No segments found yet.</div>
            ) : (
              segments.map((segment, index) => (
                <motion.div
                  key={segment._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="rounded-xl border border-[var(--border)] bg-white p-5 hover:border-accent/20 hover:shadow-md transition duration-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-[var(--text-primary)] tracking-tight">{segment.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-success/10 border border-success/20 px-2 py-0.5 text-[10px] font-bold text-success uppercase tracking-wider">Live</span>
                      <button
                        onClick={async () => {
                          const confirmed = window.confirm(`Delete segment "${segment.name}"?`);
                          if (!confirmed) return;
                          setDeletingId(segment._id!);
                          try {
                            await deleteSegment(segment._id!);
                            setSegments(prev => prev.filter(s => s._id !== segment._id));
                            toast('success', 'Segment deleted');
                          } catch (err) {
                            toast('error', 'Failed to delete segment');
                          } finally {
                            setDeletingId(null);
                          }
                        }}
                        className="delete-button"
                        disabled={deletingId === segment._id}
                        title="Delete segment"
                      >
                        <DeleteTrashIcon />
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-[var(--text-secondary)] leading-5">
                    Reusable audience segment configured with {segment.conditions?.length || 0} targeting rule(s).
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="premium-card p-6 ambient-section">
          <div className="mb-6 flex rounded-xl bg-[var(--bg-card-soft)] border border-[var(--border)] p-1">
            <button
              className={`flex-1 rounded-lg py-2 text-center text-xs font-bold transition duration-200 ${activeTab === 'rule-builder' ? 'bg-accent text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              onClick={() => setActiveTab('rule-builder')}
            >
              Rule Builder
            </button>
            <button
              className={`flex-1 rounded-lg py-2 text-center text-xs font-bold transition duration-200 ${activeTab === 'ai' ? 'bg-accent text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              onClick={() => setActiveTab('ai')}
            >
              AI NL Generator
            </button>
          </div>

          {activeTab === 'rule-builder' ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card-soft)] p-4 space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Segment Name</label>
                <input
                  value={segmentName}
                  onChange={e => setSegmentName(e.target.value)}
                  placeholder="Enter segment name"
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                />
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card-soft)] p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Targeting Rules</p>
                  <div className="flex rounded-lg bg-white border border-[var(--border)] p-0.5 text-xs">
                    <button onClick={() => setRuleMode('AND')} className={`rounded px-2.5 py-1 transition font-bold ${ruleMode === 'AND' ? 'bg-accent text-white' : 'text-[var(--text-muted)]'}`}>AND</button>
                    <button onClick={() => setRuleMode('OR')} className={`rounded px-2.5 py-1 transition font-bold ${ruleMode === 'OR' ? 'bg-accent text-white' : 'text-[var(--text-muted)]'}`}>OR</button>
                  </div>
                </div>

                <div className="space-y-3">
                  {conditions.map(condition => (
                    <div key={condition.id} className="grid gap-2.5 sm:grid-cols-[1.2fr_1.2fr_1.5fr_auto] items-center rounded-xl border border-[var(--border)] bg-white p-3">
                      <select value={condition.attribute} onChange={e => updateCondition(condition.id, 'attribute', e.target.value)} className={selectClass}>
                        {attributes.map(value => <option key={value} value={value}>{value}</option>)}
                      </select>
                      <select value={condition.operator} onChange={e => updateCondition(condition.id, 'operator', e.target.value)} className={selectClass}>
                        {operators.map(value => <option key={value} value={value}>{value}</option>)}
                      </select>
                      <input
                        value={condition.value}
                        onChange={e => updateCondition(condition.id, 'value', e.target.value)}
                        placeholder="Enter value"
                        className="min-w-0 rounded-lg border border-[var(--border)] bg-white px-2.5 py-2 text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                      />
                      <button onClick={() => removeCondition(condition.id)} className="delete-button justify-self-end" title="Remove condition">
                        <DeleteTrashIcon />
                      </button>
                    </div>
                  ))}
                </div>

                <button onClick={addCondition} className="btn-secondary inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Rule
                </button>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-white p-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Estimated Reach</p>
                  <motion.p key={estimatedReach} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-xl font-bold text-[var(--text-primary)] tracking-tight">{estimatedReach}</motion.p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>

              <button onClick={saveSegment} className="btn-primary w-full py-3">Save Segment Library</button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card-soft)] p-4 space-y-4">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Describe your target audience</span>
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Customers who spent more than ₹5000 but haven't purchased in the last 45 days and live in metro cities"
                  rows={4}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-2.5 text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition leading-relaxed"
                />
                <button onClick={generateSegment} className="btn-primary inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Generate Segment
                </button>
              </div>

              {aiLoading ? (
                <div className="rounded-xl border border-[var(--border)] bg-white p-6 text-center space-y-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 border border-accent/15 ai-pulse">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-accent" />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">AI interpreting your prompt and building query rules...</p>
                </div>
              ) : null}

              {aiResult ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 rounded-xl border border-accent/15 bg-accent/5 p-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">AI Rule Breakdown</p>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {aiResult.interpretation.map(item => (
                        <span key={item} className="rounded-lg bg-white border border-[var(--border)] px-2 py-1 text-[10px] font-semibold text-[var(--text-primary)]">{item}</span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg bg-white border border-[var(--border)] p-3.5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Calculated Reach</p>
                    <p className="mt-1 text-lg font-bold text-[var(--text-primary)] tracking-tight">{aiResult.reach}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button onClick={handleConfirmAndSave} className="btn-primary flex-1">Confirm & Save</button>
                    <button onClick={handleEditRules} className="btn-secondary flex-1">Edit Rules</button>
                  </div>
                </motion.div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
