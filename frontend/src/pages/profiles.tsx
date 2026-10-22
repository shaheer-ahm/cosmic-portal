
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { AppShell } from "../components/layout/AppShell";
import { PageHeader } from "../components/layout/PageHeader";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/useAuth";

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
  const { user, role } = useAuth();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isSupervisor = role === "supervisor";

  useEffect(() => {
    if (!isSupervisor) {
      setLoading(false);
      return;
    }

    void fetchProfiles();
  }, [isSupervisor]);

  const fetchProfiles = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<ApiUser[]>("/users/");
      setProfiles(data.map(toProfile));
    } catch (err) {
      console.error("Error fetching profiles:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load user profiles.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (
    userId: string,
    newRole: UserRole,
  ) => {
    if (!isSupervisor || userId === user?.id) return;

    setUpdatingId(userId);

    try {
      const updated = await apiFetch<ApiUser>(
        `/users/${userId}/role`,
        {
          method: "PUT",
          body: JSON.stringify({
            role: newRole.toUpperCase(),
          }),
        },
      );

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === userId ? toProfile(updated) : p,
        ),
      );
    } catch (err) {
      alert(
        "Failed to update role: " +
          (err instanceof Error
            ? err.message
            : "Unknown error"),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (profile: UserProfile) => {
    if (!isSupervisor || profile.id === user?.id) return;

    const email = profile.email || profile.id;

    const confirmed = window.prompt(
      `Delete account ${email}?\n\n` +
        "This permanently deletes the user's Supabase login " +
        "and removes their Portal access.\n\n" +
        "Existing orders may be retained without an owner.\n\n" +
        "Type DELETE to confirm:",
    );

    if (confirmed !== "DELETE") return;

    setDeletingId(profile.id);

    try {
      await apiFetch<void>(`/users/${profile.id}`, {
        method: "DELETE",
      });

      setProfiles((prev) =>
        prev.filter((p) => p.id !== profile.id),
      );
    } catch (err) {
      alert(
        "Failed to delete user: " +
          (err instanceof Error
            ? err.message
            : "Unknown error"),
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (!isSupervisor) {
    return (
      <AppShell>
        <div className="cf-page">
          <p className="text-sm text-[#b64641]">
            Only supervisors can manage user accounts.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="cf-page">
        <PageHeader title="Supervisor Dashboard" />

        <div className="mt-6 rounded-xl border border-[#dce5ee] bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-[#172f50]">
            User Access Management
          </h2>

          <p className="mt-2 text-sm text-[#72859d]">
            Manage account roles and remove user access.
          </p>

          {loading ? (
            <p className="mt-6 text-sm text-[#72859d]">
              Loading user profiles...
            </p>
          ) : error ? (
            <div className="mt-5">
              <p className="text-sm text-[#b64641]">{error}</p>
              <button
                type="button"
                onClick={() => void fetchProfiles()}
                className="mt-3 text-sm font-semibold text-[#227cbd]"
              >
                Retry
              </button>
            </div>
          ) : profiles.length === 0 ? (
            <p className="mt-6 text-sm text-[#72859d]">
              No profiles found.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {profiles.map((profile) => {
                const isSelf = profile.id === user?.id;
                const isBusy =
                  deletingId === profile.id ||
                  updatingId === profile.id;

                return (
                  <div
                    key={profile.id}
                    className="rounded-xl border border-[#dce5ee] bg-[#f9fbfd] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-all text-sm font-semibold text-[#172f50]">
                          {profile.email || "Unknown email"}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              profile.role === "supervisor"
                                ? "border border-[#cce4f6] bg-[#e7f3ff] text-[#227cbd]"
                                : "border border-[#d3e6f6] bg-[#edf6ff] text-[#226aa6]"
                            }`}
                          >
                            {profile.role}
                          </span>

                          {isSelf && (
                            <span className="text-xs text-[#72859d]">
                              Your account
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          aria-label={`Role for ${profile.email}`}
                          value={profile.role}
                          disabled={isBusy || isSelf}
                          onChange={(e) =>
                            void handleRoleChange(
                              profile.id,
                              e.target.value as UserRole,
                            )
                          }
                          className="min-w-0 rounded-lg border border-[#dce5ee] bg-white px-3 py-2 text-sm text-[#172f50] disabled:opacity-50"
                        >
                          <option value="user">User</option>
                          <option value="supervisor">
                            Supervisor
                          </option>
                        </select>

                        {!isSelf && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void handleDeleteUser(profile)
                            }
                            className="flex items-center gap-2 rounded-lg border border-[#e7c1bf] bg-white px-3 py-2 text-sm font-semibold text-[#b64641] transition-colors hover:bg-[#fff1f0] disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            {deletingId === profile.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
