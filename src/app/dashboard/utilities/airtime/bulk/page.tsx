// src/app/dashboard/utilities/airtime/bulk/page.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Save,
  FileText,
  Download,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

interface BulkItem {
  id: string;
  phone: string;
  amount: number;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  updatedAt: string;
}

export default function BulkAirtimePage() {
  const router = useRouter();
  const [items, setItems] = useState<BulkItem[]>([]);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate total
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  // Add manual entry
  const handleAddItem = () => {
    if (!phone || !amount) return;

    const newItem: BulkItem = {
      id: Date.now().toString(),
      phone: phone.trim(),
      amount: parseFloat(amount),
      status: 'draft',
      updatedAt: new Date().toLocaleString(),
    };

    setItems([...items, newItem]);
    setPhone('');
    setAmount('');
  };

  // Remove item
  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Save item (mark as ready)
  const handleSaveItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, status: 'processing' as const, updatedAt: new Date().toLocaleString() }
        : item
    ));
  };

  // Delete all items
  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all items?')) {
      setItems([]);
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim());
        
        // Skip header row if exists
        const startIndex = rows[0].toLowerCase().includes('phone') ? 1 : 0;
        
        const newItems: BulkItem[] = [];
        for (let i = startIndex; i < rows.length; i++) {
          const cols = rows[i].split(',').map(col => col.trim());
          if (cols.length >= 2) {
            const phoneNum = cols[0].replace(/[^0-9]/g, '');
            const amountNum = parseFloat(cols[1]);
            if (phoneNum && !isNaN(amountNum) && amountNum > 0) {
              newItems.push({
                id: Date.now() + i + '',
                phone: phoneNum,
                amount: amountNum,
                status: 'draft',
                updatedAt: new Date().toLocaleString(),
              });
            }
          }
        }

        setItems([...items, ...newItems]);
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        setIsUploading(false);
      }
    };

    reader.readAsText(file);
  };

  // Handle paste from clipboard
  const handlePasteSubmit = () => {
    if (!pasteData.trim()) return;

    const rows = pasteData.split('\n').filter(row => row.trim());
    const newItems: BulkItem[] = [];

    rows.forEach((row, index) => {
      const cols = row.split(',').map(col => col.trim());
      if (cols.length >= 2) {
        const phoneNum = cols[0].replace(/[^0-9]/g, '');
        const amountNum = parseFloat(cols[1]);
        if (phoneNum && !isNaN(amountNum) && amountNum > 0) {
          newItems.push({
            id: Date.now() + index + '',
            phone: phoneNum,
            amount: amountNum,
            status: 'draft',
            updatedAt: new Date().toLocaleString(),
          });
        }
      }
    });

    if (newItems.length > 0) {
      setItems([...items, ...newItems]);
      setPasteData('');
      setShowPasteModal(false);
    }
  };

  // Download template CSV
  const downloadTemplate = () => {
    const headers = 'Phone,Amount\n';
    const sample = '0712345678,100\n0723456789,200';
    const csv = headers + sample;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-airtime-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-600';
      case 'processing':
        return 'bg-yellow-100 text-yellow-600';
      case 'completed':
        return 'bg-green-100 text-green-600';
      case 'failed':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText size={14} />;
      case 'processing':
        return <AlertCircle size={14} />;
      case 'completed':
        return <Check size={14} />;
      case 'failed':
        return <X size={14} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bulk Airtime</h1>
            <p className="text-gray-500 text-sm">Total: <span className="font-semibold text-emerald-600">KES {totalAmount.toFixed(2)}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              <Download size={16} />
              Download Template
            </button>
          </div>
        </div>

        {/* Add Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Add numbers to this list</h2>
          <p className="text-xs text-gray-500 mb-4">Manual entry first, or paste / upload CSV. You can switch anytime.</p>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Manual Entry */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Manual entry</h3>
              <p className="text-xs text-gray-500 mb-3">Type phone and amount, then tap Add</p>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Phone (07...)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712345678"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Amount (KES)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100.00"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <button
                  onClick={handleAddItem}
                  disabled={!phone || !amount}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>

            {/* CSV Upload */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Paste or upload CSV</h3>
              <p className="text-xs text-gray-500 mb-3">Upload a file or paste rows below</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border-2 border-dashed border-gray-300 hover:border-emerald-400 text-sm font-medium"
                >
                  <Upload size={18} />
                  Upload CSV File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  onClick={() => setShowPasteModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-300"
                >
                  <FileText size={16} />
                  Paste CSV Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center px-4 py-8 text-gray-500">
                      No items added yet. Add numbers manually or upload a CSV.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">{item.phone}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">KES {item.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                          {getStatusIcon(item.status)}
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{item.updatedAt}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.status === 'draft' && (
                            <button
                              onClick={() => handleSaveItem(item.id)}
                              className="text-emerald-500 hover:text-emerald-600 transition-colors"
                              title="Save"
                            >
                              <Save size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {items.length > 0 && (
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-gray-600">Total Items: <span className="text-gray-900 font-semibold">{items.length}</span></span>
                          <span className="text-sm text-gray-600 ml-4">Total Amount: <span className="text-emerald-600 font-semibold">KES {totalAmount.toFixed(2)}</span></span>
                        </div>
                        <button
                          onClick={handleDeleteAll}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                        >
                          <Trash2 size={16} />
                          Delete list
                        </button>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Paste CSV Data</h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mb-3">
              Paste rows with phone and amount separated by comma. One per line.
            </p>
            <p className="text-xs text-gray-400 mb-3 font-mono">
              Example: 0712345678,100
            </p>
            
            <textarea
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              placeholder="0712345678,100&#10;0723456789,200&#10;0734567890,150"
              rows={6}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-mono"
            />
            
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handlePasteSubmit}
                disabled={!pasteData.trim()}
                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Add Items
              </button>
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}