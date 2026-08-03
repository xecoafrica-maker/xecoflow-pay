// src/app/dashboard/business/reports/page.tsx
'use client';

import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  Download,
  Calendar,
  ChevronDown,
  DollarSign,
  Users,
  ShoppingCart,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Printer,
  Mail,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────
interface MonthlyData {
  month: string;
  revenue: number;
  transactions: number;
  customers: number;
}

interface ReportData {
  summary: {
    totalRevenue: string;
    totalTransactions: number;
    activeCustomers: number;
    averageTransaction: string;
    successRate: string;
    chargebacks: number;
    conversionRate: string;
    growthRate: string;
  };
  monthlyData: MonthlyData[];
  topProducts: { name: string; revenue: number; percentage: number }[];
  paymentMethods: { name: string; percentage: number; color: string }[];
  weeklyActivity: { day: string; transactions: number; revenue: number }[];
}

// ─── Mock Report Data (Empty) ──────────────────────────────────────
const reportData: ReportData = {
  summary: {
    totalRevenue: '0',
    totalTransactions: 0,
    activeCustomers: 0,
    averageTransaction: '0',
    successRate: '0%',
    chargebacks: 0,
    conversionRate: '0%',
    growthRate: '0%',
  },
  monthlyData: [],
  topProducts: [],
  paymentMethods: [],
  weeklyActivity: [],
};

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [reportType, setReportType] = useState('All');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const hasData = reportData.monthlyData.length > 0 || reportData.topProducts.length > 0;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-sm shadow-emerald-200">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-500">View your business performance and financial insights</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* ─── Filters ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {dateRange}
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
        <div className="flex gap-2 ml-auto">
          <button className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-all flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </button>
          <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Growth
          </button>
          <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Distribution
          </button>
        </div>
      </div>

      {/* ─── Summary Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Revenue</p>
            <div className="p-1.5 bg-emerald-50 rounded-lg">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">KES 0</p>
          <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-1">
            <Activity className="w-3 h-3" />
            No data yet
          </span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Transactions</p>
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
          <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-1">
            <Activity className="w-3 h-3" />
            No data yet
          </span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Customers</p>
            <div className="p-1.5 bg-purple-50 rounded-lg">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
          <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-1">
            <Activity className="w-3 h-3" />
            No data yet
          </span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Success Rate</p>
            <div className="p-1.5 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">0%</p>
          <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-1">
            <Activity className="w-3 h-3" />
            No data yet
          </span>
        </div>
      </div>

      {/* ─── Main Charts ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Revenue Trend</h3>
              <p className="text-xs text-gray-400">Monthly revenue performance</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg">Monthly</button>
              <button className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-lg">Weekly</button>
              <button className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-lg">Yearly</button>
            </div>
          </div>
          {hasData && reportData.monthlyData.length > 0 ? (
            <div className="h-64 flex items-end justify-between gap-2">
              {reportData.monthlyData.map((item, index) => {
                const maxRevenue = Math.max(...reportData.monthlyData.map(d => d.revenue));
                const height = (item.revenue / maxRevenue) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full flex flex-col items-center">
                      <div
                        className="w-full max-w-[40px] bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-lg transition-all duration-500 hover:from-emerald-600 hover:to-emerald-500"
                        style={{ height: `${Math.max(height, 10)}px` }}
                      />
                      <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded">
                        {formatCurrency(item.revenue)}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{item.month}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg">
              <BarChart3 className="w-14 h-14 text-gray-300" />
              <p className="text-gray-400 font-medium mt-3">No revenue data available</p>
              <p className="text-sm text-gray-400">Start processing transactions to see insights</p>
            </div>
          )}
          <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-400">Revenue (KES)</span>
            <span className="text-xs text-gray-400">Last 12 months</span>
          </div>
        </div>

        {/* Growth Metrics */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Growth Metrics</h3>
          {hasData ? (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Revenue Growth</span>
                  <span className="font-medium text-emerald-600">+0%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full mt-1">
                  <div className="h-2 bg-emerald-500 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Customer Growth</span>
                  <span className="font-medium text-emerald-600">+0%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full mt-1">
                  <div className="h-2 bg-blue-500 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Transaction Volume</span>
                  <span className="font-medium text-emerald-600">+0%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full mt-1">
                  <div className="h-2 bg-purple-500 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Conversion Rate</span>
                  <span className="font-medium text-amber-600">0%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full mt-1">
                  <div className="h-2 bg-amber-500 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-300" />
              <p className="text-gray-400 text-sm mt-3">No growth data yet</p>
            </div>
          )}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Last updated: Today, 10:00 AM</p>
          </div>
        </div>
      </div>

      {/* ─── Analytics Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-500" />
            Payment Methods Distribution
          </h3>
          {hasData && reportData.paymentMethods.length > 0 ? (
            <div className="space-y-4">
              {reportData.paymentMethods.map((method, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${method.color}`} />
                      <span className="text-gray-600">{method.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{method.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full mt-1">
                    <div className={`h-2 rounded-full ${method.color}`} style={{ width: `${method.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <PieChart className="w-14 h-14 text-gray-300" />
              <p className="text-gray-400 font-medium mt-3">No payment data</p>
              <p className="text-sm text-gray-400">Payment method insights will appear here</p>
            </div>
          )}
        </div>

        {/* Weekly Activity */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            Weekly Activity
          </h3>
          {hasData && reportData.weeklyActivity.length > 0 ? (
            <div className="space-y-4">
              {reportData.weeklyActivity.map((day, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-16 text-sm text-gray-600">{day.day}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full">
                        <div 
                          className="h-2 bg-emerald-500 rounded-full" 
                          style={{ width: `${(day.transactions / Math.max(...reportData.weeklyActivity.map(d => d.transactions))) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{day.transactions}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{formatCurrency(day.revenue)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Activity className="w-14 h-14 text-gray-300" />
              <p className="text-gray-400 font-medium mt-3">No activity data</p>
              <p className="text-sm text-gray-400">Weekly activity insights will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Top Products / Categories ──────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-500" />
            Top Products & Services
          </h3>
        </div>

        {hasData && reportData.topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product/Service</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Percentage</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody>
                {reportData.topProducts.map((product, index) => (
                  <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{product.name}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(product.revenue)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-gray-600">{product.percentage}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <TrendingUp className="w-3 h-3" />
                        Growing
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-gray-50 rounded-full">
                <Zap className="w-12 h-12 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium text-lg">No product data available</p>
              <p className="text-sm text-gray-400">Product performance insights will appear here</p>
            </div>
          </div>
        )}

        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <span className="text-xs text-gray-400">
            {reportData.topProducts.length > 0 ? `Showing ${reportData.topProducts.length} top products` : 'No products to show'}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Last updated: {new Date().toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}