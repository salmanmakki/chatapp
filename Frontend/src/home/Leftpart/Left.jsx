import React from "react";
import Search from "./Search";
import Users from "./Users";
import AccountMenu from "./AccountMenu";

function Left() {
  return (
    <div className="flex h-full flex-col text-slate-100">
      <div className="px-4 pt-4 pb-3 border-b border-slate-800/80 flex items-center justify-between">
        <AccountMenu />
      </div>
      <Search />
      <div className="flex-1 overflow-y-auto pb-2">
        <Users />
      </div>
    </div>
  );
}

export default Left;
