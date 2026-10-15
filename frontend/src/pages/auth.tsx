import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";

import { supabase } from "../lib/supabase";

type AuthMode = "login" | "signup";

export default function AuthPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const passwordIsValid = (value: string) => {
    return value.length >= 8 && /\d/.test(value);
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
      if (mode === "signup") {
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
            FitPortal
          </h1>

          <p className="mt-2 text-sm text-[#6a7f99]">
            Sign in to access the portal
          </p>
        </div>

        <div className="rounded-3xl border border-[#dce5ee] bg-white p-5">
          <div className="grid grid-cols-2 rounded-xl bg-[#eef3f8] p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-[#e7f3ff] text-[#2279c4]"
                  : "text-[#6a7f99]"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                mode === "signup"
                  ? "bg-[#e7f3ff] text-[#2279c4]"
                  : "text-[#6a7f99]"
              }`}
            >
              Sign Up
            </button>
          </div>

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
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#dfe7f1] bg-[#eef3f8] px-4 py-3 text-sm text-[#172f50] outline-none placeholder:text-[#94a5b8] focus:border-[#2686d5]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-medium text-[#71849a]"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                className="w-full rounded-xl border border-[#dfe7f1] bg-[#eef3f8] px-4 py-3 text-sm text-[#172f50] outline-none placeholder:text-[#94a5b8] focus:border-[#2686d5]"
              />

              {mode === "signup" && (
                <p className="mt-2 text-xs text-[#6a7f99]">
                  Minimum 8 characters and at least one number.
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-[#f1ccc6] bg-[#fff1ef] px-4 py-3 text-sm text-[#b64641]">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl border border-[#bfe9d2] bg-[#eaf9f0] px-4 py-3 text-sm text-[#137452]">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#2686d5] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#176caf] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Login"
                  : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}