import React from "react";
import useConversation from "../../zustand/useConversation.js";
import { useSocketContext } from "../../context/SocketContext.jsx";
import { IoInformationCircleOutline } from "react-icons/io5";

function Chatuser({ onOpenDetails }) {
  const { selectedConversation, setSelectedConversation } = useConversation();
  const { onlineUsers } = useSocketContext();

  const isOnline = onlineUsers.includes(selectedConversation?._id);

  const handleBack = () => setSelectedConversation(null);

  return (
    <div className="flex items-center h-16 px-4 border-b bg-slate-950">
      <button onClick={handleBack} className="lg:hidden mr-2">←</button>

      <img
        src={selectedConversation.profilePic || "/user.jpg"}
        alt={selectedConversation.fullname}
        className="w-11 h-11 rounded-full object-cover"
      />

      <div className="ml-3">
        <h1 className="text-sm font-semibold text-white">
          {selectedConversation.fullname}
        </h1>
        <span className="text-xs text-slate-400">
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>

      <button
        onClick={onOpenDetails}
        className="ml-auto text-slate-300"
      >
        <IoInformationCircleOutline size={20} />
      </button>
    </div>
  );
}

export default Chatuser;
