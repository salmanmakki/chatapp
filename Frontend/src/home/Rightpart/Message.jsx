import React from "react";
import { useSocketContext } from "../../context/SocketContext.jsx";
import useConversation from "../../zustand/useConversation.js";
import API_CONFIG from "../../config/api.js";

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
  const API_URL = API_CONFIG.BASE_URL;
  
  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    if (url.startsWith("/")) return `${API_URL}${url}`;
    return `${API_URL}/${url}`;
  };

  const mediaUrl =
    (type === "image" || type === "video" || type === "document")
      ? getFullUrl(attachment?.url || message.imageUrl)
      : null;

  const hasText = Boolean(message.message && message.message.trim().length > 0);

  // Try to infer a status field; default to "sent" so we at least show one tick
  const rawStatus =
    message.status ||
    message.deliveryStatus ||
    (message.seen ? "seen" : undefined);
  const status = rawStatus || "sent"; // "sent" | "delivered" | "seen"

  const googleMapsUrl = useMemo(() => {
    if (type !== "location") return null;
    const lat = message?.location?.lat;
    const lng = message?.location?.lng;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }, [message?.location?.lat, message?.location?.lng, type]);

  const renderBody = () => {
    if (type === "image" && mediaUrl) {
      return (
        <>
          <img
            src={mediaUrl}
            alt="sent"
            onClick={() => onImageClick && onImageClick(mediaUrl)}
            className="rounded-xl max-h-64  object-cover cursor-pointer"
          />
          {hasText && <p className="text-sm break-words">{message.message}</p>}
        </>
      );
    }

    if (type === "video" && mediaUrl) {
      return (
        <>
          <video
            src={mediaUrl}
            controls
            className="rounded-xl max-h-64  w-full"
          />
          {hasText && <p className="text-sm break-words">{message.message}</p>}
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
            className="block rounded-xl border border-slate-700/60 bg-black/10 px-2 py-1.5 text-sm hover:bg-black/20 transition"
          >
            <div className="font-medium">{attachment?.name || "Document"}</div>
            <div className="text-[11px] opacity-80">
              Click to open / download
            </div>
          </a>
          {hasText && <p className="text-sm break-words mt-1">{message.message}</p>}
        </>
      );
    }

    if (type === "location") {
      return (
        <a
          href={googleMapsUrl || undefined}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl border border-slate-700/60 bg-black/10 px-3 py-2 text-sm hover:bg-black/20 transition"
        >
          <div className="font-medium">Shared location</div>
          <div className="text-[11px] opacity-80 truncate">
            {googleMapsUrl || "(invalid location)"}
          </div>
        </a>
      );
    }

    if (type === "contact") {
      const c = message.contact || {};
      return (
        <div className="rounded-xl border border-slate-700/60 bg-black/10 px-3 py-2">
          <div className="font-medium text-sm">{c.name || "Contact"}</div>
          {c.phone && <div className="text-sm opacity-90">{c.phone}</div>}
          {c.email && <div className="text-xs opacity-80">{c.email}</div>}
        </div>
      );
    }

    if (type === "poll") {
      const poll = message.poll;
      const opts = poll?.options || [];
      const totalVotes = opts.reduce((sum, o) => sum + (o.votes?.length || 0), 0);

      const handleVote = async (optionId) => {
        if (isVoting) return;
        setIsVoting(true);
        try {
          const res = await axios.post(`/api/message/vote/${message._id}`, {
            optionId,
          });

          const updated = res.data;
          const next = messages.map((m) => (m._id === updated._id ? updated : m));
          setMessage(next);
        } catch (err) {
          console.log("Error voting", err);
        } finally {
          setIsVoting(false);
        }
      };

      return (
        <div className="space-y-2">
          <div className="text-sm font-semibold">{poll?.question || "Poll"}</div>
          <div className="space-y-2">
            {opts.map((o) => {
              const count = o.votes?.length || 0;
              const percent = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
              const iVoted = Boolean(
                myId && o.votes?.some((v) => v.toString() === myId.toString())
              );
              return (
                <button
                  key={o.id}
                  type="button"
                  disabled={isVoting}
                  onClick={() => handleVote(o.id)}
                  className={`w-full text-left rounded-xl border px-3 py-2 transition ${
                    iVoted
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : "border-slate-700/60 bg-black/10 hover:bg-black/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium truncate">{o.text}</div>
                    <div className="text-[11px] opacity-80">{count}</div>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                    <div
                      className="h-full bg-sky-400/80"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          <div className="text-[11px] opacity-80">Total votes: {totalVotes}</div>
        </div>
      );
    }

    // text fallback
    if (hasText) {
      return <p className="text-sm break-words">{message.message}</p>;
    }

    return null;
  };

  if (itsMe) {
    // Sent message - right side with accent color
    return (
      <div className="flex justify-end px-4 py-1.5">
        <div className="flex flex-col items-end max-w-xs lg:max-w-md">
          <div className="bg-gradient-to-tr from-indigo-500 via-indigo-400 to-sky-400 text-slate-50 rounded-2xl rounded-br-md px-1.5 py-1.5 shadow-lg shadow-indigo-900/40">
            {renderBody()}
          </div>
          <div className="flex items-center gap-1 mt-1 mr-1 text-[11px] text-slate-400">
            <span>{formattedTime}</span>
            <span className="inline-flex items-center">
              {status === "sent" && (
                <BsCheck className="w-3 h-3 text-slate-400" />
              )}
              {status === "delivered" && (
                <BsCheckAll className="w-3 h-3 text-slate-400" />
              )}
              {status === "seen" && (
                <BsCheckAll className="w-3 h-3 text-sky-400" />
              )}
            </span>
          </div>
        </div>
      </div>
    );
  } else {
    // Received message - left side with neutral dark tone
    return (
      <div className="flex justify-start px-4 py-1.5">
        <div className="flex flex-col items-start max-w-xs lg:max-w-md">
          <div className="bg-slate-800/90 text-slate-50 rounded-2xl rounded-bl-md px-1.5 py-1.5 border border-slate-700/80 shadow-md shadow-slate-950/40">
            {renderBody()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 ml-1">
            {formattedTime}
          </span>
        </div>
      </div>
    );
  }
}

export default Message;
