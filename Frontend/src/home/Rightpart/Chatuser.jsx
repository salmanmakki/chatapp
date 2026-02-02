import React from "react";
import useConversation from "../../zustand/useConversation.js";
import { useSocketContext } from "../../context/SocketContext.jsx";
import { IoInformationCircleOutline } from "react-icons/io5";

function Chatuser({ onOpenDetails }) {
  const { selectedConversation, setSelectedConversation } = useConversation();
  const { onlineUsers } = useSocketContext();

  const API_URL = "http://localhost:4001";
  const getProfilePicUrl = (profilePic) => {
    if (!profilePic || profilePic === "/user.jpg") {
      return "/user.jpg";
    }
    if (profilePic.startsWith("http")) return profilePic;
    if (profilePic.startsWith("/uploads")) return `${API_URL}${profilePic}`;
    return profilePic;
  };

  const getOnlineUsersStatus = (userId) => {
    return onlineUsers.includes(userId) ? "Online" : "Offline";
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  return (
    <div className="relative flex items-center h-16 px-4 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      {/* Back button (mobile only) */}
      <button
        onClick={handleBack}
        className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-700/80 text-slate-200 hover:bg-slate-800/90 hover:text-slate-50 transition"
      >
        <span className="text-lg">←</span>
      </button>

      {/* User info */}
      <div className="flex items-center space-x-3 h-12 ml-2">
        <button
          type="button"
          onClick={() => onOpenDetails && onOpenDetails()}
          className="avatar online"
          title="View contact info"
        >
          <div className="w-11 h-11 rounded-full overflow-hidden border border-slate-700/80 bg-slate-900/80">
            <img
              src={getProfilePicUrl(selectedConversation.profilePic)}
              alt={selectedConversation.fullname}
              className="w-full h-full object-cover"
            />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onOpenDetails && onOpenDetails()}
          className="text-left"
          title="View contact info"
        >
          <h1 className="text-sm font-semibold text-slate-50">
            {selectedConversation.fullname}
          </h1>
          <span className="text-xs text-slate-400">
            {getOnlineUsersStatus(selectedConversation._id)}
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => onOpenDetails && onOpenDetails()}
        className="ml-auto inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-700/80 text-slate-200 hover:bg-slate-800/90 hover:text-slate-50 transition"
        title="Contact info"
      >
        <IoInformationCircleOutline className="text-xl" />
      </button>
    </div>
  );
}

export default Chatuser;
