import React, { useRef, useState } from "react";
import {
  IoAttachOutline,
  IoDocumentTextOutline,
  IoImageOutline,
  IoLocationOutline,
  IoSend,
  IoVideocamOutline,
} from "react-icons/io5";
import useSendMessage from "../../context/useSendMessage.js";
import useConversation from "../../zustand/useConversation.js";
import { useAuth } from "../../context/AuthProvider.jsx";

function Typesend() {
  const [message, setMessage] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentKind, setAttachmentKind] = useState(null); // "image" | "video" | "document"
  const [previewUrl, setPreviewUrl] = useState(null); // only for images
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const docInputRef = useRef(null);

  const { loading, sendMessages, sendLocation, sendContact, sendPoll } =
    useSendMessage();
  const { selectedConversation } = useConversation();
  const [authUser] = useAuth();

  const isBlocked = Boolean(
    authUser?.user?.blockedUsers?.includes(selectedConversation?._id)
  );

  const resetAttachment = () => {
    setAttachmentFile(null);
    setAttachmentKind(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim() && !attachmentFile) return; // avoid empty sends

    await sendMessages(message, attachmentFile, attachmentKind);

    setMessage("");
    resetAttachment();
    setIsMenuOpen(false);
  };

  const handleFileChange = (kind) => (e) => {
    const file = e.target.files?.[0];

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (!file) {
      setAttachmentFile(null);
      setAttachmentKind(null);
      return;
    }

    setAttachmentFile(file);
    setAttachmentKind(kind);

    if (kind === "image") {
      setPreviewUrl(URL.createObjectURL(file));
    }

    setIsMenuOpen(false);
  };

  const handleSendLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported on this device.");
      return;
    }

    setIsMenuOpen(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        await sendLocation({ lat, lng, label: "" });
      },
      (err) => {
        console.log(err);
        alert("Unable to fetch location. Please allow location permission.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSendContact = async () => {
    setIsMenuOpen(false);
    const name = window.prompt("Contact name?");
    if (!name) return;
    const phone = window.prompt("Phone number?");
    if (!phone) return;
    const email = window.prompt("Email (optional)?") || "";
    await sendContact({ name, phone, email });
  };

  const handleSendPoll = async () => {
    setIsMenuOpen(false);
    const question = window.prompt("Poll question?");
    if (!question) return;
    const raw = window.prompt(
      "Poll options (comma separated, min 2, max 10)?"
    );
    if (!raw) return;
    const options = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);

    if (options.length < 2) {
      alert("Please provide at least 2 options.");
      return;
    }

    const allowMultiple = window.confirm("Allow multiple answers?");
    await sendPoll({ question, options, allowMultiple });
  };

  if (isBlocked) {
    return (
      <div className="px-4 py-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent border-t border-slate-800/80">
        <p className="text-sm text-slate-400">
          You blocked {selectedConversation?.fullname}. Unblock to send messages.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="px-4 pb-2 pt-2 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="relative flex items-center gap-3 rounded-full border border-slate-700/80 bg-slate-950/80 px-4 py-2.5 shadow-2xl shadow-slate-950/80 backdrop-blur-xl">
              <input
                type="text"
                placeholder="Type a message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
              />

              {/* Hidden file inputs */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange("image")}
                className="hidden"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange("video")}
                className="hidden"
              />
              <input
                ref={docInputRef}
                type="file"
                onChange={handleFileChange("document")}
                className="hidden"
              />

              <div className="flex items-center gap-3">
                {/* Attachment menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen((v) => !v)}
                    className="cursor-pointer text-xl text-slate-300 hover:text-slate-50 transition"
                    title="Attach"
                  >
                    <IoAttachOutline />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute bottom-12 right-0 w-56 rounded-2xl border border-slate-700/80 bg-slate-950/95 shadow-2xl shadow-slate-950/70 overflow-hidden">
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-800/80 flex items-center gap-2"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        <IoImageOutline className="text-lg" />
                        <span>Photo</span>
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-800/80 flex items-center gap-2"
                        onClick={() => videoInputRef.current?.click()}
                      >
                        <IoVideocamOutline className="text-lg" />
                        <span>Video</span>
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-800/80 flex items-center gap-2"
                        onClick={() => docInputRef.current?.click()}
                      >
                        <IoDocumentTextOutline className="text-lg" />
                        <span>Document</span>
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-800/80 flex items-center gap-2"
                        onClick={handleSendLocation}
                      >
                        <IoLocationOutline className="text-lg" />
                        <span>Location</span>
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-800/80 flex items-center gap-2"
                        onClick={handleSendContact}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-slate-800 text-xs">
                          @
                        </span>
                        <span>Contact</span>
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-800/80 flex items-center gap-2"
                        onClick={handleSendPoll}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-slate-800 text-xs">
                          ☑
                        </span>
                        <span>Poll</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Attachment preview */}
                {attachmentFile && (
                  <button
                    type="button"
                    onClick={resetAttachment}
                    className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 max-w-[110px] sm:max-w-[160px] whitespace-nowrap overflow-hidden"
                    title="Remove attachment"
                  >
                    {attachmentKind === "image" && previewUrl ? (
                      <span className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700/80 flex-shrink-0">
                        <img
                          src={previewUrl}
                          alt="selected"
                          className="w-full h-full object-cover"
                        />
                      </span>
                    ) : attachmentKind === "video" ? (
                      <IoVideocamOutline className="text-lg flex-shrink-0" />
                    ) : (
                      <IoDocumentTextOutline className="text-lg flex-shrink-0" />
                    )}

                    <span className="truncate">{attachmentFile.name}</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 via-indigo-400 to-sky-400 text-slate-50 text-lg shadow-md shadow-indigo-900/60 hover:shadow-lg hover:brightness-110 disabled:opacity-60 disabled:cursor-default transition"
                  title="Send"
                >
                  <IoSend />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default Typesend;
