import React, { useState } from "react";
import { BiLogOutCircle } from "react-icons/bi";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
function Logout() {
  const [loading, setLoading] = useState(false);
  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await axios.post("/api/user/logout");
      localStorage.removeItem("ChatApp");
      Cookies.remove("jwt");
      toast.success("Logged out successfully");
      window.location.reload();
    } catch (error) {
      console.log("Error in Logout", error);
      toast.error("Error in logging out");
      setLoading(false);
    }
  };
  return (
    <div className="border-t border-slate-800/80 px-3 py-3 mt-1">
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 rounded-full px-3 py-2 transition disabled:opacity-60"
        disabled={loading}
      >
        <BiLogOutCircle className="text-lg" />
        <span>Logout</span>
      </button>
    </div>
  );
}

export default Logout;
