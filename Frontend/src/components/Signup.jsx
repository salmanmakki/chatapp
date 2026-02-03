import React, { useState } from "react";

import { useForm } from "react-hook-form";

import axios from "axios";

import { useAuth } from "../context/AuthProvider";

import { Link } from "react-router-dom";

import toast from "react-hot-toast";

function Signup() {

  const [, setAuthUser] = useAuth();

  const [profilePic, setProfilePic] = useState("");

  const [previewProfilePic, setPreviewProfilePic] = useState("");

  const {

    register,

    handleSubmit,

    watch,

    formState: { errors },

  } = useForm();



  // watch the password and confirm password fields

  const password = watch("password", "");

  const confirmPassword = watch("confirmPassword", "");

  console.log(confirmPassword);



  const validatePasswordMatch = (value) => {

    return value === password || "Passwords do not match";

  };

  // handle profile picture upload
  const handleProfilePic = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
      setProfilePic(file);
    } else {
      // If no file selected, reset to default
      setPreviewProfilePic("/user.jpg");
      setProfilePic("");
    }
  };



  const onSubmit = async (data) => {

    const formData = new FormData();

    formData.append("fullname", data.fullname);

    formData.append("email", data.email);

    formData.append("password", data.password);

    formData.append("confirmPassword", data.confirmPassword);

    if (profilePic) {
      formData.append("profilePic", profilePic);
    }

    // console.log(userInfo);

    await axios

      .post("/api/user/signup", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      })

      .then((response) => {

        if (response.data) {

          toast.success("Signup successful");

        }

        localStorage.setItem("ChatApp", JSON.stringify(response.data));

        setAuthUser(response.data);

      })

      .catch((error) => {

        if (error.response) {

          toast.error("Error: " + error.response.data.error);

        }

      });

  };

  return (

    <>

      <div className="flex h-screen items-center justify-center bg-slate-950">

        <form

          onSubmit={handleSubmit(onSubmit)}

          className="w-full max-w-md rounded-2xl border border-slate-800/60 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-sm"

        >

          <div className="mb-8 text-center">

            <h1 className="text-3xl font-bold text-white">

              Chat

              <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent font-semibold ml-1">

                App

              </span>

            </h1>

            <p className="text-sm text-slate-400 mt-2">

              Create your account to get started.

            </p>

          </div>

          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="avatar">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-700 ring-2 ring-slate-600 ring-offset-2 ring-offset-slate-900">
                  <img
                    src={
                      previewProfilePic
                        ? previewProfilePic
                        : "/user.jpg"
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="absolute inset-0 w-24 h-24 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePic}
                className="absolute inset-0 w-24 h-24 rounded-full opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">Click to change profile picture</p>
          </div>

          {/* Fullname */}
          <div className="space-y-1 mb-4">
            <label className="text-xs font-medium text-slate-300">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/70"
              {...register("fullname", { required: true })}
            />
            {errors.fullname && (
              <span className="text-[11px] text-red-400 font-medium">
                This field is required
              </span>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1 mb-4">
            <label className="text-xs font-medium text-slate-300">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/70"
              {...register("email", { required: true })}
            />
            {errors.email && (
              <span className="text-[11px] text-red-400 font-medium">
                This field is required
              </span>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1 mb-4">
            <label className="text-xs font-medium text-slate-300">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/70"
              {...register("password", { required: true })}
            />
            {errors.password && (
              <span className="text-[11px] text-red-400 font-medium">
                This field is required
              </span>
            )}
          </div>

          {/*Confirm Password */}
          <div className="space-y-1 mb-6">
            <label className="text-xs font-medium text-slate-300">Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/70"
              {...register("confirmPassword", {
                required: true,
                validate: validatePasswordMatch,
              })}
            />
            {errors.confirmPassword && (
              <span className="text-[11px] text-red-400 font-medium">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          {/* Text & Button */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-400">
              Have an account?
              <Link
                to="/login"
                className="ml-1 text-indigo-400 hover:text-indigo-300 underline-offset-2"
              >
                Login
              </Link>
            </p>
            <input
              type="submit"
              value="Signup"
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 px-6 py-2.5 text-sm font-medium text-white transition-all hover:from-indigo-600 hover:to-sky-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 cursor-pointer"
            />
          </div>

        </form>

      </div>

    </>

  );

}



export default Signup;

