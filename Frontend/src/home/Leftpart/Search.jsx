import React, { useState, useEffect, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import useGetAllUsers from "../../context/useGetAllUsers";
import useConversation from "../../zustand/useConversation";
import toast from "react-hot-toast";

function Search() {
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allUsers] = useGetAllUsers();
  const { setSelectedConversation } = useConversation();
  const searchRef = useRef(null);

  // Filter users based on search input
  const filteredUsers = allUsers.filter((user) =>
    user.fullname.toLowerCase().startsWith(search.toLowerCase())
  );

  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedConversation(user);
    setSearch("");
    setShowSuggestions(false);
  };

  // Handle form submission (for exact search)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    const user = allUsers.find(
      (u) =>
        u.fullname.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    if (user) {
      setSelectedConversation(user);
      setSearch("");
      setShowSuggestions(false);
    } else {
      toast.error("User not found");
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show suggestions when typing
  useEffect(() => {
    if (search.trim() && filteredUsers.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [search, filteredUsers]);

  return (
    <div className="px-4 pt-3 pb-2 relative" ref={searchRef}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 shadow-sm shadow-slate-950/70 focus-within:ring-2 focus-within:ring-indigo-500/70 focus-within:border-indigo-500/80 transition">
            <FaSearch className="text-xs text-slate-500" />
            <input
              type="text"
              className="w-full bg-transparent outline-none placeholder:text-slate-500"
              placeholder="Search people"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => search.trim() && setShowSuggestions(true)}
            />
          </div>
        </div>
      </form>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-4 right-4 mt-1 bg-slate-900/95 backdrop-blur-sm border border-slate-700/70 rounded-xl shadow-xl shadow-slate-950/50 z-50 max-h-60 overflow-y-auto">
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              onClick={() => handleUserSelect(user)}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800/80 cursor-pointer transition first:rounded-t-xl last:rounded-b-xl"
            >
              <div className="avatar">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700/80 bg-slate-900/80">
                  <img
                    src={
                      user.profilePic?.startsWith("http")
                        ? user.profilePic
                        : user.profilePic?.startsWith("/uploads")
                        ? `http://localhost:4001${user.profilePic}`
                        : user.profilePic || "/user.jpg"
                    }
                    alt={user.fullname}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-50 truncate">
                  {user.fullname}
                </div>
                {user.lastMessage && (
                  <div className="text-xs text-slate-500 truncate">
                    {user.lastMessage.type === "image"
                      ? "📷 Image"
                      : user.lastMessage.type === "video"
                      ? "🎥 Video"
                      : user.lastMessage.type === "document"
                      ? "📄 Document"
                      : user.lastMessage.message?.length > 20
                      ? user.lastMessage.message.substring(0, 20) + "..."
                      : user.lastMessage.message || "New message"}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {filteredUsers.length === 0 && search.trim() && (
            <div className="px-3 py-4 text-center text-slate-500 text-sm">
              No users found matching "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Search;
