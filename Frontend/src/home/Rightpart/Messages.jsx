import React, { useEffect, useRef } from "react";
import Message from "./Message";
import useGetMessage from "../../context/useGetMessage.js";
import Loading from "../../components/Loading.jsx";
import useGetSocketMessage from "../../context/useGetSocketMessage.js";
function Messages({ onImageClick }) {
  const { loading, messages } = useGetMessage();
  useGetSocketMessage(); // listing incoming messages
  console.log(messages);

  const lastMsgRef = useRef();
  useEffect(() => {
    setTimeout(() => {
      if (lastMsgRef.current) {
        lastMsgRef.current.scrollIntoView({
          behavior: "smooth",
        });
      }
    }, 100);
  }, [messages]);
  return (
    <div className="h-full overflow-y-auto px-3 py-4 space-y-1 bg-gradient-to-b from-slate-950/10 via-slate-950/40 to-slate-950/80">
      {loading ? (
        <Loading />
      ) : (
        messages.length > 0 &&
        messages.map((message) => (
          <div key={message._id} ref={lastMsgRef}>
            <Message message={message} onImageClick={onImageClick} />
          </div>
        ))
      )}

      {!loading && messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-slate-500 text-lg">
              Say! Hi to start the conversation
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;
