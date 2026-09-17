// src/app/dashboard/settings/team/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Edit2,
  Trash2,
  X,
  Save,
  AlertCircle,
  Search,
  Loader2,
} from 'lucide-react';
import { getStoredMerchant } from '@/lib/auth';
import SettingsTabs from '@/components/settings/SettingsTabs';

// ─── Types ──────────────────────────────────────────────────────────
interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: 'Admin';
  status: 'Active' | 'Pending' | 'Inactive';
  lastActive: string;
  avatar: string;
  permissions: string[];
}

const roleColors: Record<string, string> = {
  Admin: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const statusColors: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700',
  Pending: 'bg-amber-50 text-amber-700',
  Inactive: 'bg-red-50 text-red-700',
};

export default function TeamManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<TeamMember[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ─── Load — cache-first, no token check ─────────────────────────
  useEffect(() => {
    const cached = getStoredMerchant();
    const id = cached?.merchant_id || cached?.merchantId;

    if (!id) {
      console.warn('⚠️ No merchant — redirecting to login');
      router.push('/login?session=expired');
      return;
    }

    // Build team from cache (owner = single admin for now)
    const ownerName =
      `${cached?.first_name || ''} ${cached?.last_name || ''}`.trim() ||
      cached?.business_name ||
      'Account Owner';
    const ownerEmail = cached?.email || '';
    const initials =
      ownerName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'AO';

    setTeamData([
      {
        id: 1,
        name: ownerName,
        email: ownerEmail,
        role: 'Admin',
        status: 'Active',
        lastActive: 'Active now',
        avatar: initials,
        permissions: ['Full Access'],
      },
    ]);
    setLoading(false);
  }, [router]);

  const filteredTeam = teamData.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── Handlers ───────────────────────────────────────────────────
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to real endpoint when ready
    await new Promise((r) => setTimeout(r, 600));
    setShowAddModal(false);
    alert('Invitation sent. (Wire to real endpoint to persist.)');
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to real endpoint when ready
    await new Promise((r) => setTimeout(r, 600));
    setShowEditModal(false);
    alert('Member updated. (Wire to real endpoint to persist.)');
  };

  const handleRemoveMember = (member: TeamMember) => {
    if (confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
      // TODO: wire to real endpoint
      setTeamData((prev) => prev.filter((m) => m.id !== member.id));
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
    <div className="max-w-5xl mx-auto space-y-5">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm shadow-indigo-200">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">
            Team & Access
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Manage team members and their permissions.
          </p>
        </div>
      </div>

      {/* ─── Settings Tabs ─────────────────────────────────────────── */}
      <SettingsTabs />

      {/* ─── Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Members</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{teamData.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Active</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {teamData.filter((m) => m.status === 'Active').length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {teamData.filter((m) => m.status === 'Pending').length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Roles</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {new Set(teamData.map((m) => m.role)).size}
          </p>
        </div>
      </div>

      {/* ─── Header Actions + Search ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm outline-none"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Add Team Member
        </button>
      </div>

      {/* ─── Team List ─────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeam.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500 font-medium">No team members found</p>
                      <p className="text-sm text-gray-400">Try adjusting your search or add a new member</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTeam.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                          {member.avatar}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{member.email || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleColors[member.role]}`}>
                        <Shield className="w-3 h-3" />
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[member.status]}`}>
                        {member.status === 'Active' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : member.status === 'Pending' ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{member.lastActive}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowEditModal(true);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                          title="Edit Member"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member)}
                          disabled={member.id === 1}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={member.id === 1 ? 'Cannot remove account owner' : 'Remove Member'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {teamData.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-400">
              Showing {filteredTeam.length} of {teamData.length} members
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Team Active
            </span>
          </div>
        )}
      </div>

      {/* ─── Add Member Modal ─────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Add Team Member</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none">
                    <option value="Admin">Admin - Full Management</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Only Admin role is available for now</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">The new member will receive an email invitation to join your team.</p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Member Modal ────────────────────────────────────── */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <Edit2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Edit Team Member</h3>
                <span className="text-xs text-gray-400 font-mono">#{selectedMember.id}</span>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleEditMember} className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-semibold text-lg">
                    {selectedMember.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedMember.name}</p>
                    <p className="text-xs text-gray-500">{selectedMember.email || '—'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Status</label>
                  <select
                    defaultValue={selectedMember.status}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}