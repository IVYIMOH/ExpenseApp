import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, DollarSign, Target, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [marketSnapshot, setMarketSnapshot] = useState(null);
  const [loadingMarket, setLoadingMarket] = useState(true);

  useEffect(() => {
    base44.entities.Expense.list('-date', 100).then(setExpenses);
    const now = new Date();
    base44.entities.Budget.filter({ month: now.getMonth() + 1, year: now.getFullYear() }).then(setBudgets);
    fetchMarket();
  }, []);

  const fetchMarket = async () => {
    setLoadingMarket(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: 'Give me the current price and daily change % for AAPL, TSLA, and MSFT. Also one short market headline.',
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          stocks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                symbol: { type: 'string' },
                price: { type: 'number' },
                change_pct: { type: 'number' }
              }
            }
          },
          headline: { type: 'string' }
        }
      }
    });
    setMarketSnapshot(res);
    setLoadingMarket(false);
  };

  const now = new Date();
  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && e.type === 'expense';
  });
  const thisMonthIncome = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && e.type === 'income';
  });

  const totalSpent = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = thisMonthIncome.reduce((s, e) => s + e.amount, 0);
  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);

  // Last 7 days spending chart data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(now, 6 - i);
    const label = format(day, 'MMM d');
    const total = expenses
      .filter(e => e.type === 'expense' && format(new Date(e.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
      .reduce((s, e) => s + e.amount, 0);
    return { label, total };
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">{format(now, 'EEEE, MMMM d yyyy')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Spent This Month', value: `$${totalSpent.toFixed(2)}`, icon: TrendingDown, color: 'text-destructive', bg: 'bg-destructive/10' },
          { label: 'Income This Month', value: `$${totalIncome.toFixed(2)}`, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Net Balance', value: `$${(totalIncome - totalSpent).toFixed(2)}`, icon: DollarSign, color: (totalIncome - totalSpent) >= 0 ? 'text-success' : 'text-destructive', bg: 'bg-primary/10' },
          { label: 'Budget Used', value: totalBudget ? `${Math.round((totalSpent / totalBudget) * 100)}%` : 'N/A', icon: Target, color: 'text-primary', bg: 'bg-primary/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-lg font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Spending chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Spending — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => [`$${v}`, 'Spent']} />
              <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#grad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Market snapshot */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Market Snapshot</h2>
            <Link to="/market" className="text-xs text-primary flex items-center gap-1 hover:underline">
              Full market <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loadingMarket ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : marketSnapshot ? (
            <div className="space-y-3">
              {marketSnapshot.stocks?.map(s => (
                <div key={s.symbol} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="font-semibold text-sm">{s.symbol}</span>
                  <div className="text-right">
                    <p className="text-sm font-medium">${s.price?.toFixed(2)}</p>
                    <p className={`text-xs font-medium ${s.change_pct >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {s.change_pct >= 0 ? '▲' : '▼'} {Math.abs(s.change_pct).toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
              {marketSnapshot.headline && (
                <p className="text-xs text-muted-foreground pt-1 italic">📰 {marketSnapshot.headline}</p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Recent Transactions</h2>
          <Link to="/expenses" className="text-xs text-primary flex items-center gap-1 hover:underline">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {expenses.slice(0, 5).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No transactions yet. <Link to="/expenses" className="text-primary underline">Add one</Link></p>
        ) : (
          <div className="space-y-2">
            {expenses.slice(0, 5).map(e => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.category} · {format(new Date(e.date), 'MMM d')}</p>
                </div>
                <span className={`text-sm font-semibold ${e.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                  {e.type === 'income' ? '+' : '-'}${e.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}