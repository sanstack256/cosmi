"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Shield, LogOut, Camera } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ProfilePage() {
  const router = useRouter();
  const { user, plan, signOut, sendPasswordReset } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);


  if (!user) return null;

  /* ---------------- Sync User Data ---------------- */

  useEffect(() => {
    if (user.photoURL) setPreview(user.photoURL);
    if (user.displayName) setNewName(user.displayName);
  }, [user]);

  const workspaceId = "COS-" + user.uid.slice(0, 6).toUpperCase();


  /* ---------------- Name Update ---------------- */

  const handleSaveName = async () => {
    if (!auth.currentUser || !newName.trim()) return;

    try {
      setSavingName(true);
      await updateProfile(auth.currentUser, {
        displayName: newName,
      });
      setEditingName(false);
    } catch (error) {
      console.error("Name update failed:", error);
    } finally {
      setSavingName(false);
    }
  };

  /* ---------------- Image Upload ---------------- */

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const storage = getStorage();
      const storageRef = ref(storage, `profilePictures/${user.uid}`);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateProfile(user, {
        photoURL: downloadURL,
      });

      setPreview(downloadURL);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#050509] text-slate-100 px-6 py-10 relative overflow-hidden">
      {/* BACK BUTTON */}
      <button
        onClick={() => router.push("/dashboard")}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/40 text-sm text-violet-200 shadow-[0_0_18px_rgba(139,92,246,0.45)] hover:from-violet-500/30 hover:to-fuchsia-500/30 transition"
      >
        <ChevronLeft className="h-4 w-4" />
        Dashboard
      </button>

      <div className="relative max-w-5xl mx-auto space-y-14">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-semibold">Profile & Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your account, security, and preferences
          </p>
        </div>

        {/* USER CARD */}
        <div className="rounded-3xl p-8 bg-gradient-to-br from-[#0b0b18] to-[#14142f] border border-violet-500/20 shadow-[0_0_50px_rgba(124,58,237,0.15)] flex items-center justify-between gap-8">

          {/* LEFT SECTION */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={handleImageClick}
                className="h-20 w-20 rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center"
              >
                {preview || user.photoURL ? (
                  <img
                    src={preview || user.photoURL || ""}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src="/user.png"
                    alt="Default Avatar"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <button
                onClick={handleImageClick}
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-[#0b0b18] border border-violet-500/40 flex items-center justify-center text-violet-300 shadow-[0_0_12px_rgba(124,58,237,0.5)] hover:bg-violet-600 hover:text-white transition-all duration-200"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* NAME + EMAIL */}
            <div>
              <div className="flex items-center gap-3">
                {editingName ? (
                  <>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-[#0f0f1a] border border-violet-500/30 rounded-lg px-3 py-1 text-sm"
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="px-3 py-1 text-xs rounded-lg bg-violet-600 hover:bg-violet-700 transition"
                    >
                      {savingName ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingName(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold">
                      {user.displayName || "User"}
                    </h2>
                    <button
                      onClick={() => setEditingName(true)}
                      className="text-xs text-violet-400 hover:text-violet-300"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>

              <p className="text-sm text-slate-400 mt-1">{user.email}</p>

              <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Active account
              </span>
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div className="text-right">
            <p className="text-xs text-slate-400">Plan</p>
            <p className="font-semibold capitalize text-violet-300">
              {plan}
            </p>
            <button
              onClick={() => router.push("/pricing")}
              className="mt-2 text-xs text-violet-400 hover:text-violet-300 transition"
            >
              Manage Plan →
            </button>
          </div>
        </div>

        {/* INFO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* PERSONAL INFO */}
          <div className="rounded-2xl p-6 bg-gradient-to-br from-[#12121a] via-[#0c0c14] to-[#08080f] ring-1 ring-violet-600/20">
            <h3 className="text-base font-semibold mb-5 tracking-wide">

              Personal Information
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>

              <div>
                <p className="text-slate-400 text-xs">Workspace ID</p>
                <p className="font-mono text-xs text-violet-300">
                  {workspaceId}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-xs">Account Created</p>
                <p className="text-xs text-slate-300">
                  {new Date(user.metadata.creationTime || "").toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-xs">Last Login</p>
                <p className="text-xs text-slate-300">
                  {new Date(user.metadata.lastSignInTime || "").toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* SECURITY */}
          <div className="rounded-2xl p-6 bg-gradient-to-br from-[#12121a] via-[#0c0c14] to-[#08080f] border border-white/5 shadow-[0_0_30px_rgba(124,58,237,0.08)]
">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-violet-400" />
              Security
            </h3>

            <button
              onClick={async () => {
                try {
                  setResetLoading(true);
                  await sendPasswordReset();
                  setResetSuccess(true);
                  setTimeout(() => setResetSuccess(false), 3000);
                } catch {
                  alert("Failed to send reset email.");
                } finally {
                  setResetLoading(false);
                }
              }}
              disabled={resetLoading}
              className="w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-sm font-semibold shadow-[0_0_18px_rgba(139,92,246,0.5)] disabled:opacity-60"
            >
              {resetLoading ? "Sending..." : "Send Password Reset Email"}
            </button>

            {resetSuccess && (
              <p className="text-xs text-emerald-400 mt-2">
                ✔ Reset email sent successfully
              </p>
            )}

            <button
              onClick={signOut}
              className="w-full mt-3 py-3 rounded-xl border border-white/20 flex items-center justify-center gap-2 hover:bg-white/10 text-sm"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>



          {/* DELETE ACCOUNT MODAL */}
          {showDeleteModal && (
            <div
              className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-200 ${showDeleteModal
                ? "bg-black/70 backdrop-blur-sm opacity-100"
                : "opacity-0 pointer-events-none"
                }`}
            >

              <div
                className={`w-full max-w-md rounded-2xl bg-[#0f0f1a] border border-red-500/30 p-6 shadow-[0_0_40px_rgba(239,68,68,0.15)] transition-all duration-200 ${showDeleteModal
                  ? "scale-100 opacity-100"
                  : "scale-95 opacity-0"
                  }`}
              >

                <h3 className="text-lg font-semibold text-red-400 mb-2">
                  Delete Account
                </h3>

                <p className="text-sm text-slate-400 mb-4">
                  Are you sure you want to permanently delete your account?
                  This action cannot be undone. All your data will be lost.
                </p>

                <p className="text-xs text-slate-500 mb-2">
                  Type <span className="text-red-400 font-semibold">DELETE</span> to confirm.
                </p>

                <input
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  className="w-full mb-4 px-3 py-2 rounded-lg bg-[#12121f] border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteInput("");
                    }}
                    className="px-4 py-2 text-sm rounded-lg border border-white/20 hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>

                  <button
                    disabled={deleteInput !== "DELETE" || deleteLoading}
                    onClick={async () => {
                      try {
                        setDeleteLoading(true);
                        await auth.currentUser?.delete();
                        router.push("/");
                      } catch {
                        alert("Please re-login before deleting your account.");
                      } finally {
                        setDeleteLoading(false);
                      }
                    }}
                    className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    {deleteLoading ? "Deleting..." : "Delete Permanently"}
                  </button>
                </div>
              </div>
            </div>
          )}


        </div>




        {/* DANGER ZONE */}
        <div className="rounded-2xl p-6 border border-red-500/30 bg-red-500/5">
          <h3 className="text-sm font-semibold text-red-400 mb-2">
            Danger Zone
          </h3>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-sm rounded-xl bg-red-600 hover:bg-red-700 transition"
          >
            Delete Account
          </button>

        </div>
      </div>
    </div>
  );
}
