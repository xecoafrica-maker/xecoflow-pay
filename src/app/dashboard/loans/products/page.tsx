// src/app/dashboard/loans/products/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/lending/PageHeader';
import ProductTable from '@/components/lending/ProductTable';
import ProductForm from '@/components/lending/ProductForm';
import { listProducts, type LoanProduct } from '@/lib/lending-api';

export default function ProductsPage() {
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listProducts();
      setProducts(result.products);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader onRefresh={load} refreshing={loading} />

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Loan Products
          </h2>
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Product
          </button>
        </div>

        {error && (
          <div className="border border-red-200 bg-red-50 text-red-800 rounded-md px-4 py-3 text-sm mb-3">
            {error}
          </div>
        )}

        <ProductTable
          products={products}
          loading={loading}
          emptyAction={
            <button
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create your first product
            </button>
          }
        />
      </section>

      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(product) => {
          setProducts((prev) => [product, ...prev]);
        }}
      />
    </div>
  );
}