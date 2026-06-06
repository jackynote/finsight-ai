import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Coins,
  Plus,
  RefreshCw,
  Save,
  Search,
} from 'lucide-react';
import { financeService } from '../features/finance/financeService';
import {
  AssetCategory,
  Currency,
  CurrencyRate,
  CurrencyRatePlatform,
} from '../types';

type RateFormState = {
  pair: string;
  ratio: string;
  is_auto_update: boolean;
  platform: CurrencyRatePlatform | '';
  coingecko_id: string;
};

const formatRatioInput = (ratio?: number | string | null) => {
  if (ratio === undefined || ratio === null) return '';

  const value = String(ratio).trim();
  if (!value) return '';

  if (!value.includes('.')) {
    return value;
  }

  return value
    .replace(/\.?0+$/, '')
    .replace(/\.$/, '');
};

const buildForm = (rate?: CurrencyRate): RateFormState => ({
  pair: rate?.pair ?? '',
  ratio: formatRatioInput(rate?.ratio),
  is_auto_update: rate?.is_auto_update ?? false,
  platform: rate?.platform ?? '',
  coingecko_id: rate?.coingecko_id ?? '',
});

const PLATFORM_OPTIONS: Array<{
  label: string;
  value: CurrencyRatePlatform | '';
}> = [
  { label: 'Manual', value: '' },
  { label: 'CoinGecko', value: CurrencyRatePlatform.COINGECKO },
];

const CurrencyRatesPage: React.FC = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | AssetCategory>('ALL');
  const [selectedPair, setSelectedPair] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<RateFormState>(buildForm());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [currencyData, rateData] = await Promise.all([
        financeService.getCurrencies(),
        financeService.getCurrencyRates(),
      ]);
      setCurrencies(currencyData);
      setRates(rateData);
      if (!selectedPair && rateData.length > 0) {
        setSelectedPair(rateData[0].pair);
      }
    } catch (error) {
      console.error('Error fetching currency rates:', error);
      setMessage({ type: 'error', text: 'Failed to load rate registry.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currencyTypeMap = useMemo(
    () =>
      new Map(currencies.map((currency) => [currency.code, currency.type])),
    [currencies],
  );

  const currencyNameMap = useMemo(
    () =>
      new Map(
        currencies.map((currency) => [
          currency.code,
          `${currency.code} · ${currency.name}`,
        ]),
      ),
    [currencies],
  );

  const filteredRates = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rates.filter((rate) => {
      const matchesCategory =
        categoryFilter === 'ALL'
          ? true
          : currencyTypeMap.get(rate.base_currency_code) === categoryFilter;
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : rate.pair.toLowerCase().includes(normalizedSearch) ||
            rate.base_currency_code.toLowerCase().includes(normalizedSearch) ||
            rate.quote_currency_code.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, currencyTypeMap, rates, search]);

  const selectedRate =
    filteredRates.find((rate) => rate.pair === selectedPair) ||
    rates.find((rate) => rate.pair === selectedPair);

  useEffect(() => {
    if (isCreating) {
      setForm(buildForm());
      return;
    }

    if (!selectedRate) return;
    setSelectedPair(selectedRate.pair);
    setForm(buildForm(selectedRate));
  }, [isCreating, selectedRate?.pair]);

  const stats = useMemo(
    () => ({
      totalRates: rates.length,
      manualRates: rates.filter((rate) => !rate.is_auto_update).length,
      autoRates: rates.filter((rate) => rate.is_auto_update).length,
    }),
    [rates],
  );

  const startCreate = () => {
    setIsCreating(true);
    setSelectedPair('');
    setMessage(null);
    setForm(buildForm());
  };

  const selectRate = (pair: string) => {
    setIsCreating(false);
    setSelectedPair(pair);
    setMessage(null);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedPair = form.pair.trim().toUpperCase();
    const ratio = Number(form.ratio);

    if (!normalizedPair) {
      setMessage({ type: 'error', text: 'Pair is required.' });
      return;
    }

    if (!Number.isFinite(ratio) || ratio <= 0) {
      setMessage({ type: 'error', text: 'Ratio must be a positive number.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await financeService.upsertCurrencyRateByPair(normalizedPair, {
        ratio,
        is_auto_update: form.is_auto_update,
        platform: form.platform || null,
        coingecko_id: form.coingecko_id.trim() || null,
      });

      await fetchData();
      setSelectedPair(normalizedPair);
      setIsCreating(false);
      setMessage({
        type: 'success',
        text: `Saved ${normalizedPair} directly to currency_rates.`,
      });
    } catch (error) {
      console.error('Error saving currency rate:', error);
      setMessage({ type: 'error', text: 'Failed to save rate. Pair must use known currency codes.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-slate-500">Loading currency rates...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#334155_100%)] p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-slate-200">
              <Coins size={14} />
              Pair Registry
            </p>
            <h2 className="text-3xl font-bold tracking-tight">Manage `currency_rates` as market pairs, not as one row per currency.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              BTC can now have `BTCUSD`, `BTCETH`, `BTCUSDT`, and any other valid pair built from known currency codes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Pairs</p>
              <p className="mt-2 text-3xl font-bold">{stats.totalRates}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Manual</p>
              <p className="mt-2 text-3xl font-bold">{stats.manualRates}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Auto</p>
              <p className="mt-2 text-3xl font-bold">{stats.autoRates}</p>
            </div>
          </div>
        </div>
      </section>

      {message && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
            message.type === 'success'
              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
              : 'border-rose-100 bg-rose-50 text-rose-700'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
        <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Rate pairs</h3>
              <p className="mt-1 text-sm text-slate-500">Browse every stored pair and select the exact row you want to edit.</p>
            </div>

            <div className="mt-5 rounded-[28px] border border-slate-100 bg-slate-50/80 p-4">
              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="ml-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Search
                  </span>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search pair or currency code"
                      className="w-full rounded-2xl border border-transparent bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-slate-200 focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </label>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <label className="block space-y-2 lg:min-w-[260px] lg:max-w-[320px] lg:flex-1">
                    <span className="ml-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Category
                    </span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value as 'ALL' | AssetCategory)}
                      className="w-full rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-slate-200 focus:ring-2 focus:ring-slate-900"
                    >
                      <option value="ALL">All categories</option>
                      {Object.values(AssetCategory).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">
                      <span className="font-semibold text-slate-900">{filteredRates.length}</span>{' '}
                      {filteredRates.length === 1 ? 'pair' : 'pairs'}
                      {(search || categoryFilter !== 'ALL') && <span> match current filters</span>}
                    </div>

                    <button
                      type="button"
                      onClick={startCreate}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800"
                    >
                      <Plus size={16} />
                      New Pair
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {filteredRates.length === 0 ? (
              <div className="md:col-span-2 rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                <p className="text-sm font-semibold text-slate-900">No rate pairs match these filters.</p>
                <p className="mt-2 text-sm text-slate-500">
                  Adjust the search or category selection, or create a new pair.
                </p>
              </div>
            ) : (
              filteredRates.map((rate) => {
                const isSelected = !isCreating && rate.pair === selectedRate?.pair;

                return (
                  <button
                    key={rate.id}
                    type="button"
                    onClick={() => selectRate(rate.pair)}
                    className={`rounded-[28px] border p-5 text-left transition-all ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xl'
                        : 'border-slate-100 bg-slate-50 text-slate-900 hover:border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-[0.2em] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {currencyTypeMap.get(rate.base_currency_code) ?? 'OTHER'}
                        </p>
                        <h4 className="mt-2 text-2xl font-bold">{rate.pair}</h4>
                        <p className={`mt-1 text-sm ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {currencyNameMap.get(rate.base_currency_code) ?? rate.base_currency_code} to{' '}
                          {currencyNameMap.get(rate.quote_currency_code) ?? rate.quote_currency_code}
                        </p>
                      </div>

                      <div className={`rounded-2xl px-3 py-2 text-right ${isSelected ? 'bg-white/10' : 'bg-white'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>Ratio</p>
                        <p className="mt-1 text-base font-bold">{Number(rate.ratio).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                    <div className={`text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        <p>
                          {rate.platform === CurrencyRatePlatform.COINGECKO
                            ? 'CoinGecko'
                            : 'Manual source'}
                        </p>
                        <p className="mt-1">
                          {rate.coingecko_id
                            ? `CoinGecko: ${rate.coingecko_id}`
                            : 'CoinGecko: not set'}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                        rate.is_auto_update
                          ? isSelected
                            ? 'bg-emerald-400/20 text-emerald-200'
                            : 'bg-emerald-50 text-emerald-700'
                          : isSelected
                            ? 'bg-white/10 text-slate-300'
                            : 'bg-slate-200 text-slate-600'
                      }`}>
                        {rate.is_auto_update ? 'Auto Update' : 'Manual'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  {isCreating ? 'New Pair' : 'Editing Pair'}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {isCreating ? 'Create Rate Pair' : selectedRate?.pair ?? 'Select a pair'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {isCreating
                    ? 'Use known currency codes, for example BTCUSD, BTCETH, or ETHUSDT.'
                    : 'This updates a single row in currency_rates.'}
                </p>
              </div>

              <div className="rounded-3xl bg-slate-50 px-4 py-3 text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Scope</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Pair-level record</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-6 space-y-5">
            <div className="space-y-2">
              <label className="ml-1 text-xs font-bold uppercase text-slate-400">Pair</label>
              <input
                value={form.pair}
                onChange={(e) => setForm((current) => ({ ...current, pair: e.target.value.toUpperCase() }))}
                placeholder="BTCUSD"
                className="w-full rounded-2xl bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-xs font-bold uppercase text-slate-400">Ratio</label>
              <input
                value={form.ratio}
                onChange={(e) => setForm((current) => ({ ...current, ratio: e.target.value }))}
                type="number"
                step="0.000001"
                min="0"
                placeholder="0.00"
                className="w-full rounded-2xl bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-xs font-bold uppercase text-slate-400">Source Platform</label>
              <select
                value={form.platform}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    platform: e.target.value as CurrencyRatePlatform | '',
                  }))
                }
                className="w-full rounded-2xl bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-slate-900"
              >
                {PLATFORM_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-xs font-bold uppercase text-slate-400">CoinGecko ID</label>
              <input
                value={form.coingecko_id}
                onChange={(e) =>
                  setForm((current) => ({ ...current, coingecko_id: e.target.value }))
                }
                placeholder="bitcoin, ethereum, solana"
                className="w-full rounded-2xl bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-slate-900"
              />
              <p className="ml-1 text-xs text-slate-500">
                Required for CoinGecko-backed auto updates. Use the CoinGecko API coin ID, not the ticker symbol.
              </p>
            </div>

            <label className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Auto update flag</p>
                <p className="mt-1 text-xs text-slate-500">Marks this exact pair as managed by an automated source.</p>
              </div>
              <input
                checked={form.is_auto_update}
                onChange={(e) =>
                  setForm((current) => ({ ...current, is_auto_update: e.target.checked }))
                }
                type="checkbox"
                className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
            </label>

            <div className="rounded-[28px] border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex items-start gap-3">
                <ArrowUpRight className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>
                  Valuation logic now resolves exact USD pairs such as `BTCUSD` or inverse pairs such as `USDTUSD`, and CoinGecko-backed rows use the stored CoinGecko ID.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm(buildForm(selectedRate))}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition-all hover:bg-slate-50"
              >
                <RefreshCw size={16} />
                Reset
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-70"
              >
                <Save size={16} />
                {isSaving ? 'Saving...' : 'Save Pair'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default CurrencyRatesPage;
