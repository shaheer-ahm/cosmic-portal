import { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { PageHeader } from "../components/layout/PageHeader";
import { apiFetch } from "../lib/api";
import type { UserProfile, UserRole } from "../types/domain";

interface ApiUser {
  user_id: string;
  email: string | null;
  role: string;
  created_at: string;
}

const toProfile = (u: ApiUser): UserProfile => ({
  id: u.user_id,
  email: u.email ?? "",
  role: u.role.toLowerCase() as UserRole,
  created_at: u.created_at,
});

export default function ProfileManagementPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ApiUser[]>("/users/");
      setProfiles(data.map(toProfile));
    } catch (err) {
      console.error("Error fetching profiles:", err);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);

    try {
      const updated = await apiFetch<ApiUser>(`/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole.toUpperCase() }),
      });
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? toProfile(updated) : p))
      );
    } catch (err) {
      alert(
        "Failed to update role: " +
        (err instanceof Error ? err.message : "unknown error")
      );
    }
    setUpdatingId(null);
  };

  return (
    <AppShell>
      <div className="cf-page">
        <PageHeader
          title="Supervisor Dashboard"
        //   description="Manage user roles and permissions"
        />

        <div className="mt-6 rounded-xl border border-[#dce5ee] bg-white p-6 text-[#172f50] shadow-xl">
          <h2 className="mb-4 text-xl font-bold">User Access Management</h2>

          {loading ? (
            <p className="text-[#72859d]">Loading user profiles...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#49637e]">
                <thead className="border-b border-[#dce5ee] text-xs uppercase text-[#72859d] bg-[#f4f7fa]">
                  <tr>
                    <th className="px-4 py-3">User Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {profiles.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-[#72859d]">
                        No profiles found.
                      </td>
                    </tr>
                  ) : (
                    profiles.map((p) => (
                      <tr key={p.id} className="hover:bg-[#f4f7fa]">
                        <td className="px-4 py-3 font-medium text-[#172f50]">{p.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                              p.role === "supervisor"
                                ? "bg-[#e7f3ff] text-[#227cbd] border border-[#cce4f6]"
                                : "bg-[#edf6ff] text-[#226aa6] border border-[#d3e6f6]"
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
                            className="rounded border border-[#dce5ee] bg-[#f3f6fa] px-3 py-1.5 text-xs text-[#172f50] focus:outline-none focus:ring-2 focus:ring-[#60b0e8]"
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