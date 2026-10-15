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
    <header className="cf-top-header">
      <div className="cf-top-inner flex items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <MenuDrawer />

          <div className="cf-top-brand-icon">
            CF
          </div>

          <div>
            <p className="cf-eyebrow">
              Warehouse operations
            </p>

            <h1 className="cf-top-title">
              {title}
            </h1>
          </div>
        </div>

        {/* Logged-in user */}
        <div className="hidden items-center gap-3 sm:flex">
          <div className="rounded-lg border border-[#dbe5ee] bg-[#f7f9fc] px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />

              <div className="min-w-0">
                <p className="max-w-[160px] truncate text-xs font-semibold text-[#173353]">
                  {displayName}
                </p>

                {userEmail && (
                  <p className="max-w-[160px] truncate text-[10px] text-[#6a7f99]">
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
            className="grid h-10 w-10 place-items-center rounded-lg border border-[#dbe5ee] bg-white text-[#71849a] transition-colors hover:border-red-400/40 hover:text-[#b64641]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}