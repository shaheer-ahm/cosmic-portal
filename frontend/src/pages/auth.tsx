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
    <main className="flex min-h-screen items-center justify-center bg-[#090b10] px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#303654] text-[#7180ff]">
            <LockKeyhole className="h-7 w-7" />
          </div>

          <p className="mt-5 font-mono text-xs uppercase tracking-[0.22em] text-[#777d98]">
            Cosmic Fit
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            FitPortal
          </h1>

          <p className="mt-2 text-sm text-[#777d92]">
            Sign in to access the portal
          </p>
        </div>

        <div className="rounded-3xl border border-[#292d39] bg-[#171a22] p-5">
          <div className="grid grid-cols-2 rounded-xl bg-[#101219] p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-[#303654] text-[#9ba4ff]"
                  : "text-[#777d92]"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                mode === "signup"
                  ? "bg-[#303654] text-[#9ba4ff]"
                  : "text-[#777d92]"
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
                className="mb-2 block text-xs font-medium text-[#a5a9b8]"
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
                className="w-full rounded-xl border border-[#2c303d] bg-[#101219] px-4 py-3 text-sm text-white outline-none placeholder:text-[#555b6e] focus:border-[#6675ff]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-medium text-[#a5a9b8]"
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
                className="w-full rounded-xl border border-[#2c303d] bg-[#101219] px-4 py-3 text-sm text-white outline-none placeholder:text-[#555b6e] focus:border-[#6675ff]"
              />

              {mode === "signup" && (
                <p className="mt-2 text-xs text-[#777d92]">
                  Minimum 8 characters and at least one number.
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl border border-green-400/25 bg-green-400/10 px-4 py-3 text-sm text-green-300">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#6675ff] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#7481ff] disabled:cursor-not-allowed disabled:opacity-60"
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