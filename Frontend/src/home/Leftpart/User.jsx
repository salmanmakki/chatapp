import React from "react";
import useConversation from "../../zustand/useConversation.js";
import { useSocketContext } from "../../context/SocketContext.jsx";
import API_CONFIG from "../../config/api.js";

function User({ user }) {
  const { selectedConversation, setSelectedConversation } = useConversation();
  const isSelected = selectedConversation?._id === user._id;
  const { onlineUsers } = useSocketContext();
  const isOnline = onlineUsers.includes(user._id);

  const API_URL = API_CONFIG.BASE_URL;
  const formatLastMessageTime = (time) => {
    if (!time) return "";
    const date = new Date(time);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getLastMessagePreview = (lastMessage) => {
    if (!lastMessage) return "No messages yet";
    
    if (lastMessage.type === 'image') {
      return "📷 Image";
    } else if (lastMessage.type === 'video') {
      return "🎥 Video";
    } else if (lastMessage.type === 'document') {
      return "📄 Document";
    } else if (lastMessage.message) {
      return lastMessage.message.length > 30 
        ? lastMessage.message.substring(0, 30) + "..." 
        : lastMessage.message;
    }
    
    return "New message";
  };

  const getProfilePicUrl = (profilePic) => {
    if (!profilePic || profilePic === "/user.jpg") {
      return "/user.jpg";
    }
    if (profilePic.startsWith("http")) return profilePic;
    if (profilePic.startsWith("/uploads")) return `${API_URL}${profilePic}`;
    return profilePic;
  };

  return (
    <div className="px-2" onClick={() => setSelectedConversation(user)}>
      <div
        className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 cursor-pointer transition border
        ${
          isSelected
            ? "bg-indigo-500/15 border-indigo-500/70 shadow-lg shadow-indigo-900/50"
            : "bg-transparent border-transparent hover:bg-slate-800/80 hover:border-slate-700/80"
        }`}
      >
        <div className={`avatar ${isOnline ? "online" : ""}`}>
          <div className="w-15 h-15 rounded-full overflow-hidden border border-slate-700/80 bg-slate-900/80">
            <img
              src={getProfilePicUrl(user.profilePic)}
              alt={user.fullname}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-semibold text-slate-50 truncate">
              {user.fullname}
            </h1>
            {user.lastMessageTime && (
              <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
                {formatLastMessageTime(user.lastMessageTime)}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 truncate block">
            {getLastMessagePreview(user.lastMessage)}
          </span>
        </div>
        <div className="ml-auto flex items-center">
          <span
            className={`inline-flex h-2.5 w-2.5 rounded-full ${
              isOnline ? "bg-emerald-400" : "bg-slate-600"
            }`}
          />
        </div>
      </div>
    </div>
  );
}

export default User;
