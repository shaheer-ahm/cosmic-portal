import { FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, LockKeyhole } from "lucide-react";

import { supabase } from "../lib/supabase";
import { apiFetch } from "../lib/api";

type AuthMode = "login" | "signup" | "forgot";

const inputClass =
  "w-full rounded-xl border border-[#dfe7f1] bg-[#eef3f8] px-4 py-3 text-sm text-[#172f50] outline-none placeholder:text-[#94a5b8] focus:border-[#2686d5]";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    searchParams.get("reset") === "success"
      ? "Your password has been updated. Log in with your new password."
      : "",
  );

  const passwordIsValid = (value: string) => {
    return value.length >= 8 && /\d/.test(value);
  };

  const requestPasswordReset = async () => {
    const result = await apiFetch<{ message: string }>(
      "/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          redirect_to: `${window.location.origin}/reset-password`,
        }),
      },
    );
    setMessage(result.message);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (mode === "signup" && !passwordIsValid(password)) {
      setError(
        "Password must be at least 8 characters long and contain at least one number.",
      );
      return;
    }

    setLoading(true);

    try {
      if (mode === "forgot") {
        await requestPasswordReset();
      } else if (mode === "signup") {
        const { data, error: signUpError } =
          await supabase.auth.signUp({
            email,
            password,
          });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (data.session) {
          navigate("/dashboard");
          return;
        }

        setMessage(
          "Account created. Check your email if confirmation is required.",
        );
      } else {
        const { error: loginError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (loginError) {
          setError(loginError.message);
          return;
        }

        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
    setMessage("");
    setPassword("");
  };

  const subtitle =
    mode === "forgot"
      ? "Enter your email and we'll send you a link to reset your password"
      : "Sign in to access the portal";

  const submitLabel = loading
    ? "Please wait..."
    : mode === "login"
      ? "Login"
      : mode === "signup"
        ? "Create Account"
        : "Send reset link";

  return (
    <main className="cf-auth-screen">
      <div className="cf-auth-container">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e7f3ff] text-[#2582ce]">
            <LockKeyhole className="h-7 w-7" />
          </div>

          <p className="mt-5 font-mono text-xs uppercase tracking-[0.22em] text-[#7187a0]">
            Cosmic Fit
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#172f50]">
            {mode === "forgot" ? "Reset password" : "FitPortal"}
          </h1>

          <p className="mt-2 text-sm text-[#6a7f99]">{subtitle}</p>
        </div>

        <div className="rounded-3xl border border-[#dce5ee] bg-white p-5">
          {mode === "forgot" ? (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="flex items-center gap-2 text-sm font-semibold text-[#2279c4] hover:text-[#176caf]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </button>
          ) : (
            <div className="grid grid-cols-2 rounded-xl bg-[#eef3f8] p-1">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${mode === "login"
                    ? "bg-[#e7f3ff] text-[#2279c4]"
                    : "text-[#6a7f99]"
                  }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${mode === "signup"
                    ? "bg-[#e7f3ff] text-[#2279c4]"
                    : "text-[#6a7f99]"
                  }`}
              >
                Sign Up
              </button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-medium text-[#71849a]"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-[#71849a]"
                  >
                    Password
                  </label>

                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-xs font-semibold text-[#2279c4] hover:text-[#176caf] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <input
                  id="password"
                  type="password"
                  required
                  autoComplete={
                    mode === "signup"
                      ? "new-password"
                      : "current-password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  className={inputClass}
                />

                {mode === "signup" && (
                  <p className="mt-2 text-xs text-[#6a7f99]">
                    Minimum 8 characters and at least one number.
                  </p>
                )}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-[#f1ccc6] bg-[#fff1ef] px-4 py-3 text-sm text-[#b64641]"
              >
                {error}
              </div>
            )}

            {message && (
              <div
                role="status"
                className="rounded-xl border border-[#bfe9d2] bg-[#eaf9f0] px-4 py-3 text-sm text-[#137452]"
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#2686d5] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#176caf] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitLabel}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}