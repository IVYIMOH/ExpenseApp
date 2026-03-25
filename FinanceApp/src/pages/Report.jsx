import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Reports() {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    base44.entities.Expense.list('-date', 500).then(setExpenses);
  }, []);

  const now = new Date();

  // Category breakdown (this month)
  const thisMonthExp = expenses.filter(e => {
    const d = new Date(e.date);
    return e.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const byCategory = Object.entries(
    thisMonthExp.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));

  // Monthly comparison (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(now, 5 - i);
    const label = format(month, 'MMM');
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const spent = expenses
      .filter(e => e.type === 'expense' && new Date(e.date) >= start && new Date(e.date) <= end)
      .reduce((s, e) => s + e.amount, 0);
    const income = expenses
      .filter(e => e.type === 'income' && new Date(e.date) >= start && new Date(e.date) <= end)
      .reduce((s, e) => s + e.amount, 0);
    return { label, spent: parseFloat(spent.toFixed(2)), income: parseFloat(income.toFixed(2)) };
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Visual breakdown of your finances</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly bar chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Income vs Spending — Last 6 Months</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barGap={4}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={45} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => `$${v}`} />
              <Legend />
              <Bar dataKey="income" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="spent" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Spending by Category — This Month</h2>
          {byCategory.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byCategory} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => `$${v}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Summary table */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-4">Category Summary — This Month</h2>
        {byCategory.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No expenses logged this month.</p>
        ) : (
          <div className="space-y-2">
            {byCategory.sort((a, b) => b.value - a.value).map((c, i) => {
              const total = byCategory.reduce((s, x) => s + x.value, 0);
              const pct = ((c.value / total) * 100).toFixed(1);
              return (
                <div key={c.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-sm flex-1">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{pct}%</span>
                  <span className="text-sm font-semibold w-20 text-right">${c.value.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}