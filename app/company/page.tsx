"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/app/providers/AuthProvider";
import { ChevronLeft, Building2 } from "lucide-react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const storage = getStorage();

type Company = {
    name: string;
    email: string;
    phone: string;
    address: string;
    gstin?: string;
    logoURL?: string;
};

/* ---------------- Page ---------------- */

export default function CompanyPage() {
    const router = useRouter();
    const { user, plan } = useAuth();

    const [company, setCompany] = useState<Company>({
        name: "",
        email: "",
        phone: "",
        address: "",
        gstin: "",
        logoURL: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    /* -------- Load company -------- */
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const uid = user.uid;

        async function loadCompany() {
            try {
                const refDoc = doc(db, "users", uid);
                const snap = await getDoc(refDoc);

                if (snap.exists() && snap.data().company) {
                    setCompany((prev) => ({
                        ...prev,
                        ...snap.data().company,
                    }));
                }
            } catch (err) {
                console.error("Failed to load company:", err);
            } finally {
                setLoading(false);
            }
        }

        loadCompany();
    }, [user]);

    /* -------- Logo upload -------- */
    async function handleLogoUpload(file: File) {
        if (!user) return;

        try {
            const logoRef = ref(storage, `company-logos/${user.uid}`);

            // Upload
            await uploadBytes(logoRef, file);

            // Get URL
            const url = await getDownloadURL(logoRef);

            // Save to Firestore
            await setDoc(
                doc(db, "users", user.uid),
                {
                    company: {
                        ...company,
                        logoURL: url,
                    },
                },
                { merge: true }
            );

            // Update local state (this triggers preview update)
            setCompany((prev) => ({
                ...prev,
                logoURL: url,
            }));

        } catch (err) {
            console.error("Logo upload failed:", err);
        }
    }


    /* -------- Save company -------- */
    async function saveCompany() {
        if (!user) return;

        setSaving(true);
        await setDoc(doc(db, "users", user.uid), { company }, { merge: true });
        setSaving(false);
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#050509] text-slate-100 px-6 py-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#7c3aed33,transparent_60%)] pointer-events-none" />

            <button
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-xl 
        bg-black/40 border border-violet-500/30 
        text-sm text-violet-300 hover:bg-black/60"
            >
                <ChevronLeft className="h-4 w-4" />
                Dashboard
            </button>

            <div className="flex items-center gap-3 mb-8">
                <div
                    className="h-10 w-10 rounded-xl bg-violet-500/20 
          flex items-center justify-center text-violet-300
          shadow-[0_0_25px_rgba(139,92,246,0.5)]"
                >
                    <Building2 className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold">Company Profile</h1>
                    <p className="text-sm text-slate-400">
                        Auto-filled on invoices and documents
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div
                    className="rounded-2xl p-6
          bg-gradient-to-br from-[#0e0e14] to-[#06060a]
          border border-violet-500/20
          shadow-[0_0_60px_rgba(139,92,246,0.25)]"
                >
                    {loading ? (
                        <p className="text-slate-400 text-sm">Loading…</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-24 w-24 rounded-xl bg-black/40 border border-white/10 
                flex items-center justify-center overflow-hidden">
                                    {company.logoURL ? (
                                        <img
                                            src={company.logoURL}
                                            alt="Company logo"
                                            className="h-full w-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-xs text-slate-400">Logo</span>
                                    )}
                                </div>

                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleLogoUpload(file);
                                        }}
                                        className="hidden"
                                    />

                                    <div className="px-4 py-2 rounded-xl text-sm font-medium
                  bg-violet-500/20 border border-violet-500/30
                  text-violet-300 hover:bg-violet-500/30">
                                        Upload Logo
                                    </div>
                                </label>
                            </div>

                            <Input label="Company Name" value={company.name}
                                onChange={(v) => setCompany({ ...company, name: v })} />

                            <Input label="Business Email" value={company.email}
                                onChange={(v) => setCompany({ ...company, email: v })} />

                            <Input label="Phone" value={company.phone}
                                onChange={(v) => setCompany({ ...company, phone: v })} />

                            <Textarea label="Address" value={company.address}
                                onChange={(v) => setCompany({ ...company, address: v })} />

                            <Input
                                label="GSTIN"
                                value={company.gstin || ""}
                                disabled={plan === "free"}
                                hint={plan === "free" ? "Upgrade to Pro to add GST & branding" : undefined}
                                onChange={(v) => setCompany({ ...company, gstin: v })}
                            />

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={saveCompany}
                                    disabled={saving}
                                    className="px-6 py-2 rounded-xl font-semibold
                  bg-emerald-500 hover:bg-emerald-600 text-black
                  shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                                >
                                    {saving ? "Saving…" : "Save Company"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <InvoicePreview company={company} />
            </div>
        </div>
    );
}

/* ---------------- Invoice Preview ---------------- */

function InvoicePreview({ company }: { company: Company }) {
    return (
        <div className="relative rounded-2xl p-6
    bg-gradient-to-br from-[#0e0e14] to-[#050509]
    ring-1 ring-violet-500/20
    shadow-[0_0_60px_rgba(139,92,246,0.12)]">
            <p className="text-sm font-semibold mb-1">Invoice Preview</p>
            <p className="text-xs text-slate-400 mb-4">
                This is how your details appear on invoices
            </p>

            <div className="rounded-xl bg-white text-black p-4 text-sm shadow">
                <div className="flex items-start gap-3 mb-2">
                    {company.logoURL && (
                        <img
                            src={company.logoURL}
                            alt="Company logo"
                            className="h-10 w-10 object-contain"
                        />
                    )}

                    <p className="font-bold text-lg">INVOICE</p>
                </div>
                <p className="font-semibold">{company.name || "Your Company Name"}</p>
                <p className="text-xs text-slate-600">
                    {company.address || "Company address"}
                </p>
            </div>
        </div>
    );
}

/* ---------------- UI helpers ---------------- */

function Input({
    label,
    value,
    onChange,
    disabled,
    hint,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    hint?: string;
}) {
    return (
        <div>
            <label className="text-xs text-slate-400">{label}</label>
            <input
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl
        bg-black/60 border border-white/10
        disabled:opacity-40"
            />
            {hint && <p className="text-xs text-amber-400 mt-1">{hint}</p>}
        </div>
    );
}

function Textarea({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div>
            <label className="text-xs text-slate-400">{label}</label>
            <textarea
                rows={3}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl
        bg-black/60 border border-white/10"
            />
        </div>
    );
}
