import { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { PageHeader } from "../components/layout/PageHeader";
import { supabase } from "../lib/supabase";
import type { UserProfile, UserRole } from "../types/domain";

export default function ProfileManagementPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("*");
    if (!error && data) {
      setProfiles(data as UserProfile[]);
    } else if (error) {
      console.error("Error fetching profiles:", error.message);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);

    // Update role in public profiles table
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      alert("Failed to update role: " + error.message);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p))
      );
    }
    setUpdatingId(null);
  };

  return (
    <AppShell>
      <div className="p-6">
        <PageHeader
          title="Supervisor Dashboard"
        //   description="Manage user roles and permissions"
        />

        <div className="mt-6 rounded-xl border border-white/10 bg-[#12161f] p-6 text-white shadow-xl">
          <h2 className="mb-4 text-xl font-bold">User Access Management</h2>

          {loading ? (
            <p className="text-gray-400">Loading user profiles...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="border-b border-white/10 text-xs uppercase text-gray-400 bg-white/5">
                  <tr>
                    <th className="px-4 py-3">User Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {profiles.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                        No profiles found.
                      </td>
                    </tr>
                  ) : (
                    profiles.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 font-medium text-white">{p.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                              p.role === "supervisor"
                                ? "bg-purple-900/40 text-purple-300 border border-purple-500/30"
                                : "bg-blue-900/40 text-blue-300 border border-blue-500/30"
                            }`}
                          >
                            {p.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <select
                            value={p.role}
                            disabled={updatingId === p.id}
                            onChange={(e) =>
                              handleRoleChange(p.id, e.target.value as UserRole)
                            }
                            className="rounded border border-white/20 bg-[#090b10] px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="user">User</option>
                            <option value="supervisor">Supervisor</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}