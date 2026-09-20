"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  Film,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { getAdminUsers, updateAdminUserRole, AdminUserData } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers();
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to fetch admin users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    setMessage(null);
    try {
      await updateAdminUserRole(userId, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setMessage({ text: "User role updated successfully.", type: "success" });
    } catch (err: any) {
      setMessage({ text: err?.message || "Failed to update role.", type: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUser?.id) {
      alert("You cannot deactivate your own administrative account.");
      return;
    }

    setUpdatingId(userId);
    setMessage(null);
    try {
      await updateAdminUserRole(userId, { is_active: !currentStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u))
      );
      setMessage({ text: "User status updated.", type: "success" });
    } catch (err: any) {
      setMessage({ text: err?.message || "Failed to update status.", type: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      u.email.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            User Accounts & Permissions
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage local creator accounts, assign administrator roles, and configure access.
          </p>
        </div>

        <button
          onClick={loadUsers}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
          }`}
        >
          {message.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        <div className="text-xs text-slate-400 font-medium">
          Total Users: <span className="text-white font-bold">{users.length}</span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Projects</th>
                <th className="px-5 py-3.5">Created</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const isBusy = updatingId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{u.name || "Unnamed"}</div>
                        <div className="font-mono text-slate-400 text-[11px]">{u.email}</div>
                        {isCurrent && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <select
                          value={u.role}
                          disabled={isBusy}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                        >
                          <option value="USER">USER (Creator)</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            u.is_active
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {u.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800 font-mono">
                          {u.projects_count ?? 0}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-400 text-[11px]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleStatusToggle(u.id, u.is_active)}
                          disabled={isBusy || isCurrent}
                          className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                            u.is_active
                              ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30"
                              : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

