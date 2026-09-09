import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";

import { MenuDrawer } from "./MenuDrawer";
import { supabase } from "../../lib/supabase";

export function BrandHeader({
  title,
}: {
  title: string;
}) {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserName("");
        setUserEmail("");
        return;
      }

      const metadata = user.user_metadata ?? {};

      const name =
        metadata.full_name ||
        metadata.name ||
        metadata.display_name ||
        "";

      setUserName(name);
      setUserEmail(user.email ?? "");
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user;

        if (!user) {
          setUserName("");
          setUserEmail("");
          return;
        }

        const metadata =
          user.user_metadata ?? {};

        setUserName(
          metadata.full_name ||
            metadata.name ||
            metadata.display_name ||
            "",
        );

        setUserEmail(user.email ?? "");
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "Logout failed:",
        error,
      );
      return;
    }

    // Your auth guard should send a logged-out
    // user back to the authentication page.
    window.location.href = "/";
  };

  const displayName =
    userName ||
    userEmail.split("@")[0] ||
    "User";

  return (
    <header className="border-b border-[#242730] px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <MenuDrawer />

          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#6675ff] text-sm font-bold text-white">
            CF
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.23em] text-[#747b98]">
              Cosmic Fit
            </p>

            <h1 className="text-2xl font-bold text-white">
              {title}
            </h1>
          </div>
        </div>

        {/* Logged-in user */}
        <div className="hidden items-center gap-3 sm:flex">
          <div className="rounded-full border border-[#383b44] bg-[#23252b] px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />

              <div className="min-w-0">
                <p className="max-w-[160px] truncate text-xs font-semibold text-[#e5e7eb]">
                  {displayName}
                </p>

                {userEmail && (
                  <p className="max-w-[160px] truncate text-[10px] text-[#777d92]">
                    {userEmail}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className="grid h-10 w-10 place-items-center rounded-full border border-[#383b44] bg-[#23252b] text-[#9ba0b3] transition-colors hover:border-red-400/40 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}