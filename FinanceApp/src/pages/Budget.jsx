import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Education', 'Shopping', 'Savings', 'Other'];

export default function Budget() {
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({ category: 'Food', limit: '', month: now.getMonth() + 1, year: now.getFullYear() });

  useEffect(() => {
    load();
    base44.entities.Expense.filter({ type: 'expense' }, '-date', 300).then(setExpenses);
  }, []);

  const load = () => base44.entities.Budget.filter({ month: now.getMonth() + 1, year: now.getFullYear() }).then(setBudgets);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const existing = budgets.find(b => b.category === form.category);
    if (existing) {
      await base44.entities.Budget.update(existing.id, { limit: parseFloat(form.limit) });
      toast.success('Budget updated!');
    } else {
      await base44.entities.Budget.create({ ...form, limit: parseFloat(form.limit) });
      toast.success('Budget created!');
    }
    setOpen(false);
    load();
  };

  const getSpent = (category) => {
    return expenses
      .filter(e => {
        const d = new Date(e.date);
        return e.category === category && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, e) => s + e.amount, 0);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budget Goals</h1>
          <p className="text-muted-foreground text-sm mt-1">{format(now, 'MMMM yyyy')} — set limits per category</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Set Budget</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Set Monthly Budget</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Monthly Limit ($)</Label>
                <Input required type="number" min="1" step="0.01" value={form.limit} onChange={e => setForm(p => ({ ...p, limit: e.target.value }))} placeholder="500.00" />
              </div>
              <Button type="submit" className="w-full">Save Budget</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground text-sm">No budgets set for this month yet.</p>
          <p className="text-muted-foreground text-xs mt-1">Click "Set Budget" to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {budgets.map(b => {
            const spent = getSpent(b.category);
            const pct = Math.min((spent / b.limit) * 100, 100);
            const over = spent > b.limit;
            const warning = pct >= 80 && !over;
            return (
              <div key={b.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{b.category}</span>
                  {over ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> Over budget
                    </span>
                  ) : warning ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> Near limit
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> On track
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>${spent.toFixed(2)} spent</span>
                    <span>${b.limit.toFixed(2)} limit</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-destructive' : warning ? 'bg-yellow-400' : 'bg-success'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {over ? `$${(spent - b.limit).toFixed(2)} over` : `$${(b.limit - spent).toFixed(2)} remaining`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}