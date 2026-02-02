import React, { useEffect, useState } from "react";
import Chatuser from "./Chatuser";
import ChatDetails from "./ChatDetails";
import Messages from "./Messages";
import Typesend from "./Typesend";
import useConversation from "../../zustand/useConversation.js";
import { useAuth } from "../../context/AuthProvider.jsx";
import { CiMenuFries } from "react-icons/ci";
import { IoArrowBackOutline } from "react-icons/io5";
import Left from "../Leftpart/Left";

function Right() {
  const { selectedConversation, setSelectedConversation } = useConversation();
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    return () => setSelectedConversation(null);
  }, [setSelectedConversation]);

  const handleImageClick = (url) => {
    if (!url) return;
    setFullscreenImage(url);
  };

  const handleCloseFullscreen = () => {
    setFullscreenImage(null);
  };

  return (
    <div className="w-full h-full text-slate-100 flex flex-col relative min-h-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950">
      {!selectedConversation ? (
        // Show contact list on mobile when no chat is selected
        <>
          {/* Mobile: show full-height sidebar-style layout so logout sits at bottom */}
          <div className="lg:hidden h-full">
            <Left />
          </div>
          {/* Desktop: show centered welcome state in main panel */}
          <div className="hidden lg:block h-full">
            <NoChatSelected />
          </div>
        </>
      ) : (
        // Show chat when a contact is selected
        <>
          <Chatuser onOpenDetails={() => setIsDetailsOpen(true)} />
          <div className="flex-1 min-h-0 overflow-hidden">
            <Messages onImageClick={handleImageClick} />
          </div>
          <Typesend />

          {isDetailsOpen && (
            <ChatDetails
              onClose={() => setIsDetailsOpen(false)}
              onImageClick={handleImageClick}
            />
          )}
        </>
      )}

      {fullscreenImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="p-4">
            <button
              type="button"
              onClick={handleCloseFullscreen}
              className="flex items-center text-white text-sm space-x-2"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/60 border border-white/20 mr-1">
                <IoArrowBackOutline className="text-xl" />
              </span>
              <span>Back</span>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-auto px-4 pb-6">
            <img
              src={fullscreenImage}
              alt="full"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Right;

const NoChatSelected = () => {
  const [authUser] = useAuth();
  console.log(authUser);
  return (
    <div className="relative h-full flex items-center justify-center">
      <label
        htmlFor="my-drawer-2"
        className="lg:hidden absolute left-5 top-5 inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-700/80 bg-slate-900/80 text-slate-200 hover:bg-slate-800/90 transition"
      >
        <CiMenuFries className="text-lg" />
      </label>
      <div className="text-center px-8">
        <div className="text-6xl mb-6">💬</div>
        <h1 className="text-2xl font-semibold mb-2 text-slate-50">
          Welcome, {authUser.user.fullname}!
        </h1>
        <p className="text-slate-400">
          Select a contact from the left to start chatting
        </p>
      </div>
    </div>
  );
};
