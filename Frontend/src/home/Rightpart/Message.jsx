import React, { useMemo, useState } from "react";
import axios from "axios";
import { BsCheck, BsCheckAll } from "react-icons/bs";
import useConversation from "../../zustand/useConversation.js";

function Message({ message, onImageClick }) {
  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const myId = authUser?.user?._id;
  const itsMe = message.senderId === myId;
  const { messages, setMessage } = useConversation();
  const [isVoting, setIsVoting] = useState(false);

  const createdAt = new Date(message.createdAt);
  const formattedTime = createdAt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const type = message.type || (message.imageUrl ? "image" : "text");

  const attachment = message?.attachments?.[0];

  // ✅ Cloudinary-only URLs (no BASE_URL, no /uploads)
  const mediaUrl =
    type === "image" || type === "video" || type === "document"
      ? attachment?.url || message.imageUrl
      : null;

  const hasText = Boolean(message.message?.trim());

  const status =
    message.status ||
    message.deliveryStatus ||
    (message.seen ? "seen" : "sent");

  const googleMapsUrl = useMemo(() => {
    if (type !== "location") return null;
    const { lat, lng } = message?.location || {};
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }, [message?.location, type]);

  const renderBody = () => {
    if (type === "image" && mediaUrl) {
      return (
        <>
          <img
            src={mediaUrl}
            alt="sent"
            onClick={() => onImageClick?.(mediaUrl)}
            className="rounded-xl max-h-64 object-cover cursor-pointer"
          />
          {hasText && <p className="text-sm">{message.message}</p>}
        </>
      );
    }

    if (type === "video" && mediaUrl) {
      return (
        <>
          <video src={mediaUrl} controls className="rounded-xl max-h-64 w-full" />
          {hasText && <p className="text-sm">{message.message}</p>}
        </>
      );
    }

    if (type === "document" && mediaUrl) {
      return (
        <>
          <a
            href={mediaUrl}
            target="_blank"
            rel="noreferrer"
            className="block rounded-xl border border-slate-700/60 px-2 py-1.5 text-sm"
          >
            <div className="font-medium">
              {attachment?.name || "Document"}
            </div>
            <div className="text-[11px] opacity-80">
              Click to open / download
            </div>
          </a>
          {hasText && <p className="text-sm mt-1">{message.message}</p>}
        </>
      );
    }

    if (type === "location") {
      return (
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl border border-slate-700/60 px-3 py-2 text-sm"
        >
          Shared location
        </a>
      );
    }

    if (hasText) return <p className="text-sm">{message.message}</p>;

    return null;
  };

  return itsMe ? (
    <div className="flex justify-end px-4 py-1.5">
      <div className="max-w-xs lg:max-w-md text-right">
        <div className="bg-indigo-500 text-white rounded-2xl px-2 py-1.5">
          {renderBody()}
        </div>
        <div className="flex justify-end items-center gap-1 text-xs mt-1">
          {formattedTime}
          {status === "sent" && <BsCheck />}
          {status === "delivered" && <BsCheckAll />}
          {status === "seen" && <BsCheckAll className="text-sky-400" />}
        </div>
      </div>
    </div>
  ) : (
    <div className="flex justify-start px-4 py-1.5">
      <div className="max-w-xs lg:max-w-md">
        <div className="bg-slate-800 text-white rounded-2xl px-2 py-1.5">
          {renderBody()}
        </div>
        <span className="text-xs text-slate-400 mt-1 inline-block">
          {formattedTime}
        </span>
      </div>
    </div>
  );
}

export default Message;
