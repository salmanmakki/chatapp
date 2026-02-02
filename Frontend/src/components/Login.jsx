import axios from "axios";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthProvider";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

function Login() {
  const [, setAuthUser] = useAuth();
  const [searchParams] = useSearchParams();
  const prefillEmail = searchParams.get("email") || "";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (prefillEmail) {
      setValue("email", prefillEmail);
    }
  }, [prefillEmail, setValue]);

  const onSubmit = (data) => {
    const userInfo = {
      email: data.email,
      password: data.password,
    };
    axios
      .post("/api/user/login", userInfo)
      .then((response) => {
        if (response.data) {
          toast.success("Login successful");
        }
        localStorage.setItem("ChatApp", JSON.stringify(response.data));

        // Keep a small list for the account dropdown (UI-level multi-account)
        try {
          const key = "ChatAppAccounts";
          const raw = localStorage.getItem(key);
          const list = raw ? JSON.parse(raw) : [];
          const next = Array.isArray(list) ? list.slice() : [];
          const u = response.data.user;
          if (u?.email) {
            const idx = next.findIndex(
              (a) => (a?.email || "").toLowerCase() === u.email.toLowerCase()
            );
            const entry = {
              email: u.email,
              fullname: u.fullname,
              profilePic: u.profilePic,
            };
            if (idx >= 0) next[idx] = { ...next[idx], ...entry };
            else next.unshift(entry);
          }
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // ignore
        }

        setAuthUser(response.data);
      })
      .catch((error) => {
        if (error.response) {
          toast.error("Error: " + error.response.data.error);
        }
      });
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="glass-panel w-full max-w-md px-7 py-7 space-y-6"
      >
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="text-slate-50">Chat</span>
            <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent font-semibold ml-1">
              App
            </span>
          </h1>
          <p className="text-sm text-slate-400">
            Welcome back. Sign in to continue.
          </p>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/70"
            {...register("email", { required: true })}
          />
          {errors.email && (
            <span className="text-[11px] text-red-400 font-medium">
              This field is required
            </span>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/70"
            {...register("password", { required: true })}
          />
          {errors.password && (
            <span className="text-[11px] text-red-400 font-medium">
              This field is required
            </span>
          )}
        </div>

        {/* Text & Button */}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
          <p>
            New here?
            <Link
              to="/signup"
              className="ml-1 text-indigo-400 hover:text-indigo-300 underline-offset-2"
            >
              Create an account
            </Link>
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button type="submit" className="btn-primary-modern px-6 py-2">
            Login
          </button>
        </div>
      </form>
    </div>
  );
}

export default Login;
