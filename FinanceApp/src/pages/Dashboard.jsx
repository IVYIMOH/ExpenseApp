import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, DollarSign, Target, ArrowRight, Wallet, BarChart3 } from 'lucide-react';
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
  const netBalance = totalIncome - totalSpent;

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(now, 6 - i);
    const label = format(day, 'MMM d');
    const total = expenses
      .filter(e => e.type === 'expense' && format(new Date(e.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
      .reduce((s, e) => s + e.amount, 0);
    return { label, total };
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-6 pt-8 pb-16">
        <p className="text-primary-foreground/70 text-sm font-medium mb-1">{format(now, 'EEEE, MMMM d yyyy')}</p>
        <h1 className="text-3xl font-bold text-primary-foreground">Welcome back 👋</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">Here's your financial overview</p>
      </div>

      <div className="px-6 -mt-10 max-w-6xl mx-auto space-y-6 pb-10">
        {/* Stats cards — pulled up over hero */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Spent', value: `$${totalSpent.toFixed(2)}`, icon: TrendingDown, gradient: 'from-red-500 to-red-600' },
            { label: 'Income', value: `$${totalIncome.toFixed(2)}`, icon: TrendingUp, gradient: 'from-emerald-500 to-emerald-600' },
            { label: 'Net Balance', value: `$${netBalance.toFixed(2)}`, icon: Wallet, gradient: netBalance >= 0 ? 'from-emerald-600 to-teal-600' : 'from-red-500 to-red-600' },
            { label: 'Budget Used', value: totalBudget ? `${Math.round((totalSpent / totalBudget) * 100)}%` : 'N/A', icon: Target, gradient: 'from-primary to-primary/80' },
          ].map(({ label, value, icon: Icon, gradient }) => (
            <div key={label} className="bg-card rounded-2xl shadow-lg border border-border p-4 flex flex-col gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className="text-xl font-bold text-foreground">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Spending chart — wider */}
          <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-foreground">Spending Trend</h2>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 px-3 py-1 rounded-full">
                <BarChart3 className="w-3 h-3" /> This Week
              </div>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={40} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 12 }}
                  formatter={v => [`$${v}`, 'Spent']}
                />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#grad)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Market snapshot */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-foreground">Markets</h2>
                <p className="text-xs text-muted-foreground">Live snapshot</p>
              </div>
              <Link to="/market" className="text-xs text-primary flex items-center gap-1 hover:underline font-medium">
                Full view <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {loadingMarket ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : marketSnapshot ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  {marketSnapshot.stocks?.map(s => (
                    <div key={s.symbol} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div>
                        <p className="font-bold text-sm">{s.symbol}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">${s.price?.toFixed(2)}</p>
                        <p className={`text-xs font-medium ${s.change_pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {s.change_pct >= 0 ? '▲' : '▼'} {Math.abs(s.change_pct).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {marketSnapshot.headline && (
                  <p className="text-xs text-muted-foreground italic mt-3 pt-3 border-t border-border">📰 {marketSnapshot.headline}</p>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h2 className="font-semibold text-foreground">Recent Transactions</h2>
              <p className="text-xs text-muted-foreground">Your latest activity</p>
            </div>
            <Link to="/expenses" className="text-xs text-primary flex items-center gap-1 hover:underline font-medium">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {expenses.slice(0, 5).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No transactions yet. <Link to="/expenses" className="text-primary underline">Add one</Link></p>
          ) : (
            <div className="divide-y divide-border">
              {expenses.slice(0, 5).map(e => (
                <div key={e.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${e.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {e.type === 'income' ? '↑' : '↓'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{e.category} · {format(new Date(e.date), 'MMM d')}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${e.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {e.type === 'income' ? '+' : '-'}${e.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}