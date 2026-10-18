import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, KeyRound } from "lucide-react";

import { supabase } from "../lib/supabase";
import { apiFetch } from "../lib/api";

type LinkState = "checking" | "ready" | "invalid" | "done";

const inputClass =
    "w-full rounded-xl border border-[#dfe7f1] bg-[#eef3f8] px-4 py-3 text-sm text-[#172f50] outline-none placeholder:text-[#94a5b8] focus:border-[#2686d5]";


function readLinkError(): string | null {
    const params = new URLSearchParams(
        window.location.hash.replace(/^#/, "") || window.location.search,
    );
    const description = params.get("error_description");
    if (description) return description.replace(/\+/g, " ");
    return params.get("error") ? "This reset link is invalid or has expired." : null;
}

export default function ResetPasswordPage() {
    const navigate = useNavigate();

    const [linkState, setLinkState] = useState<LinkState>("checking");
    const [linkError, setLinkError] = useState<string | null>(() => readLinkError());

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (!active) return;
            if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
                setLinkState((current) => (current === "done" ? current : "ready"));
            }
        });

        supabase.auth.getSession().then(({ data }) => {
            if (!active) return;
            setLinkState((current) => {
                if (current === "done") return current;
                return data.session ? "ready" : "invalid";
            });
        });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError("");

        if (password.length < 8 || !/\d/.test(password)) {
            setError(
                "Password must be at least 8 characters long and contain at least one number.",
            );
            return;
        }

        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }

        setSaving(true);
        try {
            await apiFetch<{ message: string }>("/auth/reset-password", {
                method: "POST",
                body: JSON.stringify({ new_password: password }),
            });

            // End the recovery session everywhere so the user logs in fresh
            // with the new password.
            await supabase.auth.signOut();
            setLinkState("done");
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Could not update your password.";

            if (/expired|invalid/i.test(message)) {
                setLinkError(message);
                setLinkState("invalid");
            } else {
                setError(message);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="cf-auth-screen">
            <div className="cf-auth-container">
                <div className="mb-8 text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e7f3ff] text-[#2582ce]">
                        <KeyRound className="h-7 w-7" />
                    </div>

                    <p className="mt-5 font-mono text-xs uppercase tracking-[0.22em] text-[#7187a0]">
                        Cosmic Fit
                    </p>

                    <h1 className="mt-2 text-3xl font-bold text-[#172f50]">
                        Set a new password
                    </h1>

                    <p className="mt-2 text-sm text-[#6a7f99]">
                        Choose a new password for your account
                    </p>
                </div>

                <div className="rounded-3xl border border-[#dce5ee] bg-white p-5">
                    {linkState === "checking" && (
                        <p role="status" className="text-center text-sm text-[#6a7f99]">
                            Checking your reset link...
                        </p>
                    )}

                    {linkState === "invalid" && (
                        <div className="space-y-4">
                            <div
                                role="alert"
                                className="rounded-xl border border-[#f1ccc6] bg-[#fff1ef] px-4 py-3 text-sm text-[#b64641]"
                            >
                                {linkError ??
                                    "This reset link is invalid or has expired. Reset links can only be used once."}
                            </div>

                            <Link
                                to="/auth"
                                className="block w-full rounded-xl bg-[#2686d5] px-4 py-3.5 text-center text-sm font-bold text-white transition hover:bg-[#176caf]"
                            >
                                Back to login to request a new link
                            </Link>
                        </div>
                    )}

                    {linkState === "done" && (
                        <div className="space-y-4 text-center">
                            <CheckCircle2 className="mx-auto h-10 w-10 text-[#137452]" />
                            <p className="text-sm text-[#137452]">
                                Your password has been updated.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate("/auth?reset=success", { replace: true })}
                                className="w-full rounded-xl bg-[#2686d5] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#176caf]"
                            >
                                Go to login
                            </button>
                        </div>
                    )}

                    {linkState === "ready" && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="new-password"
                                    className="mb-2 block text-xs font-medium text-[#71849a]"
                                >
                                    New password
                                </label>
                                <input
                                    id="new-password"
                                    type="password"
                                    required
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Enter a new password"
                                    className={inputClass}
                                />
                                <p className="mt-2 text-xs text-[#6a7f99]">
                                    Minimum 8 characters and at least one number.
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="confirm-password"
                                    className="mb-2 block text-xs font-medium text-[#71849a]"
                                >
                                    Confirm new password
                                </label>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    required
                                    autoComplete="new-password"
                                    value={confirm}
                                    onChange={(event) => setConfirm(event.target.value)}
                                    placeholder="Re-enter the new password"
                                    className={inputClass}
                                />
                            </div>

                            {error && (
                                <div
                                    role="alert"
                                    className="rounded-xl border border-[#f1ccc6] bg-[#fff1ef] px-4 py-3 text-sm text-[#b64641]"
                                >
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full rounded-xl bg-[#2686d5] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#176caf] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? "Updating..." : "Update password"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </main>
    );
}