import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, RefreshCw, TrendingUp, TrendingDown, BookOpen, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Market() {
  const [query, setQuery] = useState('');
  const [stockData, setStockData] = useState(null);
  const [news, setNews] = useState(null);
  const [tip, setTip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [loadingTip, setLoadingTip] = useState(false);

  const searchStock = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setStockData(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Give me detailed real-time stock data for the ticker symbol or company: "${query}". Include current price, open, high, low, 52-week high/low, market cap, P/E ratio, volume, and a brief 2-sentence company description. Use latest available data.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          symbol: { type: 'string' },
          company_name: { type: 'string' },
          price: { type: 'number' },
          change: { type: 'number' },
          change_pct: { type: 'number' },
          open: { type: 'number' },
          high: { type: 'number' },
          low: { type: 'number' },
          week52_high: { type: 'number' },
          week52_low: { type: 'number' },
          market_cap: { type: 'string' },
          pe_ratio: { type: 'number' },
          volume: { type: 'string' },
          description: { type: 'string' }
        }
      }
    });
    setStockData(res);
    setLoading(false);
  };

  const fetchNews = async () => {
    setLoadingNews(true);
    setNews(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: 'Give me the top 5 stock market and financial news headlines from today with a one-sentence summary each.',
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          articles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                headline: { type: 'string' },
                summary: { type: 'string' },
                sentiment: { type: 'string' }
              }
            }
          }
        }
      }
    });
    setNews(res);
    setLoadingNews(false);
  };

  const fetchTip = async () => {
    setLoadingTip(true);
    setTip(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: 'Give me one practical investing tip for a beginner student who is learning about the stock market. Make it actionable, clear, and educational. Include an example.',
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          tip: { type: 'string' },
          example: { type: 'string' }
        }
      }
    });
    setTip(res);
    setLoadingTip(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Market & Investing</h1>
        <p className="text-muted-foreground text-sm mt-1">Real stock data, market news, and investing tips</p>
      </div>

      {/* Stock Search */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Stock Lookup</h2>
        <div className="flex gap-3">
          <Input
            placeholder="Enter ticker or company name (e.g. AAPL, Tesla)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchStock()}
            className="flex-1"
          />
          <Button onClick={searchStock} disabled={loading} className="gap-2">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {stockData && (
          <div className="mt-2 space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-bold">{stockData.symbol}</h3>
                <p className="text-muted-foreground text-sm">{stockData.company_name}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">${stockData.price?.toFixed(2)}</p>
                <p className={`text-sm font-medium ${stockData.change_pct >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {stockData.change >= 0 ? '+' : ''}{stockData.change?.toFixed(2)} ({stockData.change_pct >= 0 ? '+' : ''}{stockData.change_pct?.toFixed(2)}%)
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Open', value: `$${stockData.open?.toFixed(2)}` },
                { label: 'High', value: `$${stockData.high?.toFixed(2)}` },
                { label: 'Low', value: `$${stockData.low?.toFixed(2)}` },
                { label: 'Volume', value: stockData.volume },
                { label: '52W High', value: `$${stockData.week52_high?.toFixed(2)}` },
                { label: '52W Low', value: `$${stockData.week52_low?.toFixed(2)}` },
                { label: 'Market Cap', value: stockData.market_cap },
                { label: 'P/E Ratio', value: stockData.pe_ratio?.toFixed(1) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold mt-0.5">{value || '—'}</p>
                </div>
              ))}
            </div>
            {stockData.description && (
              <p className="text-sm text-muted-foreground border-t border-border pt-3">{stockData.description}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Market News */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Market News</h2>
            <Button variant="ghost" size="sm" onClick={fetchNews} disabled={loadingNews} className="text-xs gap-1">
              <RefreshCw className={`w-3 h-3 ${loadingNews ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
          {loadingNews ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !news ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Click Refresh to load today's news</p>
            </div>
          ) : (
            <div className="space-y-3">
              {news.articles?.map((a, i) => (
                <div key={i} className="border-b border-border last:border-0 pb-3 last:pb-0">
                  <p className="text-sm font-medium leading-snug">{a.headline}</p>
                  <p className="text-xs text-muted-foreground mt-1">{a.summary}</p>
                  {a.sentiment && (
                    <span className={`text-xs font-medium mt-1 inline-block px-2 py-0.5 rounded-full ${a.sentiment === 'positive' ? 'bg-success/10 text-success' : a.sentiment === 'negative' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                      {a.sentiment}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Investing Tip */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Lightbulb className="w-4 h-4 text-accent" /> Investing Tip</h2>
            <Button variant="ghost" size="sm" onClick={fetchTip} disabled={loadingTip} className="text-xs gap-1">
              <RefreshCw className={`w-3 h-3 ${loadingTip ? 'animate-spin' : ''}`} /> New Tip
            </Button>
          </div>
          {loadingTip ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !tip ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Click "New Tip" to get an investing lesson</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold text-base">{tip.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{tip.tip}</p>
              {tip.example && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs font-medium text-foreground mb-1">Example:</p>
                  <p className="text-xs text-muted-foreground">{tip.example}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}