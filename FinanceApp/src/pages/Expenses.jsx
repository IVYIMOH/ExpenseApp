import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Education', 'Shopping', 'Savings', 'Other'];

const categoryColors = {
  Food: 'bg-orange-100 text-orange-700',
  Transport: 'bg-blue-100 text-blue-700',
  Housing: 'bg-purple-100 text-purple-700',
  Entertainment: 'bg-pink-100 text-pink-700',
  Health: 'bg-green-100 text-green-700',
  Education: 'bg-indigo-100 text-indigo-700',
  Shopping: 'bg-yellow-100 text-yellow-700',
  Savings: 'bg-teal-100 text-teal-700',
  Other: 'bg-gray-100 text-gray-700',
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [open, setOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [form, setForm] = useState({ title: '', amount: '', category: 'Food', date: format(new Date(), 'yyyy-MM-dd'), notes: '', type: 'expense' });

  useEffect(() => {
    load();
  }, []);

  const load = () => base44.entities.Expense.list('-date', 100).then(setExpenses);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await base44.entities.Expense.create({ ...form, amount: parseFloat(form.amount) });
    toast.success('Transaction added!');
    setOpen(false);
    setForm({ title: '', amount: '', category: 'Food', date: format(new Date(), 'yyyy-MM-dd'), notes: '', type: 'expense' });
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Expense.delete(id);
    toast.success('Deleted');
    load();
  };

  const filtered = filterType === 'all' ? expenses : expenses.filter(e => e.type === filterType);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your income and spending</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Transaction</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Title</Label>
                <Input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Grocery run" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Amount ($)</Label>
                  <Input required type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input required type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any extra info..." />
              </div>
              <Button type="submit" className="w-full">Save Transaction</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'expense', 'income'].map(f => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No transactions found.</p>
        ) : filtered.map(e => (
          <div key={e.id} className="flex items-center justify-between px-5 py-4 group">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[e.category] || 'bg-muted text-muted-foreground'}`}>
                {e.category}
              </span>
              <div>
                <p className="text-sm font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(e.date), 'MMM d, yyyy')}{e.notes ? ` · ${e.notes}` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold ${e.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                {e.type === 'income' ? '+' : '-'}${e.amount.toFixed(2)}
              </span>
              <button onClick={() => handleDelete(e.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded-lg transition-all">
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}