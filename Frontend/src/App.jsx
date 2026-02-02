import React from "react";
import Left from "./home/Leftpart/Left";
import Right from "./home/Rightpart/Right";
import Signup from "./components/Signup";
import Login from "./components/Login";
import MessageRequests from "./components/MessageRequests";
import { useAuth } from "./context/AuthProvider";
import { Toaster } from "react-hot-toast";

import { Navigate, Route, Routes } from "react-router-dom";
function App() {
  const [authUser] = useAuth();

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            authUser ? (
              <div className="h-screen w-screen bg-transparent flex">
                <div className="flex w-full h-full">
                  {/* Left sidebar - Chat list (Desktop only) */}
                  <div className="hidden lg:flex w-[290px] xl:w-[320px] flex-col h-full bg-slate-950/70 backdrop-blur-xl border-r border-slate-800/80">
                    <Left />
                  </div>

                  {/* Right side - Chat Section */}
                  <div className="flex-1 flex flex-col overflow-hidden h-full bg-slate-950/70 backdrop-blur-xl">
                    <Right />
                  </div>
                </div>
              </div>
            ) : (
              <Navigate to={"/login"} />
            )
          }
        />
        <Route
          path="/login"
          element={authUser ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/signup"
          element={authUser ? <Navigate to="/" /> : <Signup />}
        />
      </Routes>
      <Toaster />
      {authUser && <MessageRequests />}
    </>
  );
}

export default App;
