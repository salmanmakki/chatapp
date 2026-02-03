import React, { useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { IoClose, IoTrashOutline, IoBanOutline } from "react-icons/io5";
import useConversation from "../../zustand/useConversation.js";
import { useAuth } from "../../context/AuthProvider.jsx";
import API_CONFIG from "../../config/api.js";

function ChatDetails({ onClose, onImageClick }) {
  const { selectedConversation, messages, setMessage } = useConversation();
  const [authUser, setAuthUser] = useAuth();
  const [busy, setBusy] = useState(false);

  const API_URL = API_CONFIG.BASE_URL;
  const getProfilePicUrl = (profilePic) => {
    if (!profilePic || profilePic === "/user.jpg") {
      return "/user.jpg";
    }
    if (profilePic.startsWith("http")) return profilePic;
    if (profilePic.startsWith("/uploads")) return `${API_URL}${profilePic}`;
    return profilePic;
  };

  const isBlocked = Boolean(
    authUser?.user?.blockedUsers?.includes(selectedConversation?._id)
  );

  const media = useMemo(() => {
    if (!Array.isArray(messages)) return [];

    const imgs = messages
      .map((m) => {
        const url =
          m?.attachments?.find((a) => a.kind === "image")?.url || m?.imageUrl;
        if (!url) return null;
        return { _id: m._id, url };
      })
      .filter(Boolean);

    // show newest first
    return imgs.slice().reverse();
  }, [messages]);

  const updateAuthBlockedUsers = (blockedUsers) => {
    if (!authUser?.user) return;
    const updatedAuth = {
      ...authUser,
      user: {
        ...authUser.user,
        blockedUsers: Array.isArray(blockedUsers) ? blockedUsers : [],
      },
    };

    localStorage.setItem("ChatApp", JSON.stringify(updatedAuth));
    setAuthUser(updatedAuth);
  };

  const handleClearChat = async () => {
    if (!selectedConversation?._id) return;

    const ok = window.confirm(
      `Clear chat with ${selectedConversation.fullname}?\n\nThis will delete messages only for you.`
    );
    if (!ok) return;

    setBusy(true);
    try {
      await axios.post(`/api/message/clear/${selectedConversation._id}`);
      setMessage([]);
      toast.success("Chat cleared");
    } catch (err) {
      console.log("Error clearing chat", err);
      toast.error("Failed to clear chat");
    } finally {
      setBusy(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedConversation?._id) return;

    setBusy(true);
    try {
      const endpoint = isBlocked
        ? `/api/user/unblock/${selectedConversation._id}`
        : `/api/user/block/${selectedConversation._id}`;

      const res = await axios.post(endpoint);
      updateAuthBlockedUsers(res.data?.blockedUsers);
      toast.success(isBlocked ? "User unblocked" : "User blocked");
    } catch (err) {
      console.log("Error blocking/unblocking", err);
      toast.error("Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (!selectedConversation) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-black/60"
        role="button"
        tabIndex={-1}
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 h-full w-full sm:w-[380px] bg-slate-950/95 border-l border-slate-800/80 backdrop-blur-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-800/80">
          <h2 className="text-sm font-semibold text-slate-50">Contact info</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-700/80 text-slate-200 hover:bg-slate-800/90 hover:text-slate-50 transition"
          >
            <IoClose className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Profile */}
          <div className="px-4 pt-5 pb-4 border-b border-slate-800/80">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden border border-slate-700/80 bg-slate-900/80">
                <img
                  src={getProfilePicUrl(selectedConversation.profilePic)}
                  alt={selectedConversation.fullname}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-50">
                {selectedConversation.fullname}
              </h3>
              <p className="text-sm text-slate-400">{selectedConversation.email}</p>
            </div>
          </div>

          {/* Media */}
          <div className="px-4 pt-4 pb-4 border-b border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Media
              </h4>
              <span className="text-xs text-slate-500">{media.length}</span>
            </div>

            {media.length === 0 ? (
              <p className="text-sm text-slate-500">No images yet</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {media.slice(0, 30).map((m) => (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => onImageClick && onImageClick(m.url)}
                    className="aspect-square rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900/80 hover:brightness-110 transition"
                    title="Open"
                  >
                    <img
                      src={m.url}
                      alt="media"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-4 py-4 space-y-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleClearChat}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800/80 transition disabled:opacity-60"
            >
              <IoTrashOutline className="text-lg" />
              <span>Clear chat</span>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={handleToggleBlock}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition disabled:opacity-60 border ${
                isBlocked
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                  : "border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
              }`}
            >
              <IoBanOutline className="text-lg" />
              <span>{isBlocked ? "Unblock" : "Block"}</span>
            </button>

            {isBlocked && (
              <p className="text-xs text-slate-500 pt-1">
                You can still see this user in your list. Blocking only prevents
                new messages.
              </p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default ChatDetails;
