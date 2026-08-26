'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getToken } from '@/lib/auth';

export default function EditPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchPageData();
    }
  }, [id]);

  const fetchPageData = async () => {
    try {
      const token = getToken();
      const response = await fetch(`/api/payment-pages/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setPageData(data.data);
      }
    } catch (error) {
      console.error('Error fetching page:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <button
        onClick={() => router.push('/dashboard/payment-pages')}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      
      <h1 className="text-2xl font-bold text-gray-900">Edit Payment Page</h1>
      <p className="text-gray-500 mt-2">Edit: {pageData?.name || 'Loading...'}</p>
      
      <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <p className="text-gray-500">Edit functionality coming soon...</p>
      </div>
    </div>
  );
}