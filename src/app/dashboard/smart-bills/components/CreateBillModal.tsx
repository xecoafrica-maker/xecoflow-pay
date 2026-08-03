'use client';

import { useRouter } from 'next/navigation';
import { 
  CreditCard, 
  ShoppingCart, 
  X 
} from 'lucide-react';

interface CreateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateBillModal({ isOpen, onClose }: CreateBillModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSelectOption = (path: string) => {
    router.push(path);
    onClose(); // Close the modal after navigating
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <h2 className="text-lg font-semibold text-gray-800">New Smart Bill</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="p-6 space-y-4">

          {/* Option 1: One-Time Payment */}
          <button 
            onClick={() => handleSelectOption('/dashboard/smart-bills/create')}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">One-time Payment</h3>
                <p className="text-sm text-gray-500">Create a simple link to request a single payment.</p>
              </div>
            </div>
            <span className="text-sm font-medium text-emerald-600 group-hover:underline">Choose →</span>
          </button>

          {/* Option 2: Product Payment */}
          <button 
            onClick={() => handleSelectOption('/dashboard/smart-bills/create-product')}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Product Payment</h3>
                <p className="text-sm text-gray-500">Sell a digital file or product with auto-download.</p>
              </div>
            </div>
            <span className="text-sm font-medium text-emerald-600 group-hover:underline">Choose →</span>
          </button>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Select a bill type to get started. You can customize it in the next step.
          </p>
        </div>
      </div>
    </div>
  );
}