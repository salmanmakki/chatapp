import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { IoChevronDownOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider.jsx";

const ACCOUNTS_KEY = "ChatAppAccounts";

function AccountMenu() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useAuth();

  const current = authUser?.user;

  const savedAccounts = useMemo(() => {
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [current?.email]);

  const otherAccounts = useMemo(() => {
    const curEmail = (current?.email || "").toLowerCase();
    return savedAccounts.filter(
      (a) => (a?.email || "").toLowerCase() && (a.email || "").toLowerCase() !== curEmail
    );
  }, [savedAccounts, current?.email]);

  useEffect(() => {
    const handler = (e) => {
      if (!open) return;
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const doLogout = async () => {
    try {
      await axios.post("/api/user/logout");
    } catch (err) {
      // ignore
      console.log("Logout error", err);
    }

    localStorage.removeItem("ChatApp");
    Cookies.remove("jwt");
    Cookies.remove("token");
    setAuthUser(undefined);
  };

  const handleLogout = async () => {
    setOpen(false);
    await doLogout();
    window.location.reload();
  };

  const handleAddAccount = async () => {
    setOpen(false);
    await doLogout();
    navigate("/login");
  };

  const handleSwitchAccount = async (email) => {
    setOpen(false);
    await doLogout();
    navigate(`/login?email=${encodeURIComponent(email)}`);
  };

  if (!current) return null;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full px-2 py-2 hover:bg-slate-900/80 transition"
        title="Account"
      >
        <span className="text-sm font-bold text-slate-50 max-w-[160px] truncate">
          {current.fullname}
        </span>
        <IoChevronDownOutline className="text-slate-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+10px)] z-50 w-72 rounded-2xl border border-slate-800/80 bg-slate-950/95 shadow-2xl shadow-slate-950/70 overflow-hidden backdrop-blur-xl">
          <div className="px-4 py-3 border-b border-slate-800/80">
            <div className="text-xs text-slate-400">Signed in as</div>
            <div className="text-sm font-semibold text-slate-50 truncate">
              {current.email}
            </div>
          </div>

          {otherAccounts.length > 0 && (
            <div className="py-1 border-b border-slate-800/80">
              <div className="px-4 pt-2 pb-1 text-[11px] uppercase tracking-wider text-slate-500">
                Other accounts
              </div>
              {otherAccounts.slice(0, 5).map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => handleSwitchAccount(a.email)}
                  className="w-full px-4 py-2 text-left hover:bg-slate-800/80 transition"
                >
                  <div className="text-sm font-medium text-slate-100 truncate">
                    {a.fullname || a.email}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{a.email}</div>
                </button>
              ))}
            </div>
          )}

          <div className="py-1">
            <button
              type="button"
              onClick={handleAddAccount}
              className="w-full px-4 py-2.5 text-left text-sm text-slate-100 hover:bg-slate-800/80 transition"
            >
              Add account
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-4 py-2.5 text-left text-sm text-rose-200 hover:bg-rose-500/10 transition"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountMenu;
