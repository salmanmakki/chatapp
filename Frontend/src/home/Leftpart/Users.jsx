import React from "react";
import User from "./User";
import useGetAllUsers from "../../context/useGetAllUsers";

function Users() {
  const [allUsers, loading] = useGetAllUsers();

  if (loading) {
    return (
      <p className="px-4 py-2 text-sm text-slate-400">
        Loading conversations...
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {Array.isArray(allUsers) && allUsers.length > 0 ? (
        allUsers.map((user) => <User key={user._id} user={user} />)
      ) : (
        <p className="px-4 text-sm text-slate-500">No users found</p>
      )}
    </div>
  );
}

export default Users;
