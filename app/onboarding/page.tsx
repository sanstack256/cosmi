"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { updateProfile, getAuth } from "firebase/auth";

export default function Onboarding() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(0);

    const [companyName, setCompanyName] = useState("");
    const [fullName, setFullName] = useState("");

    const [currency, setCurrency] = useState("INR");

    const [invoiceMode, setInvoiceMode] = useState<"blank" | "sample">(
        "blank"
    );

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/signin");
        }
    }, [user, loading, router]);

    async function handleFinish() {
        if (!user) return;

        setSaving(true);

        try {
            const auth = getAuth();

            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: fullName,
                });
            }

            await setDoc(
                doc(db, "users", user.uid),
                {
                    company: {
                        name: companyName,
                        currency,
                    },

                    onboardingComplete: true,
                },
                { merge: true }
            );

            router.replace(`/invoice-editor?mode=${invoiceMode}`);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white px-6">

            <div className="w-full max-w-md">

                {/* CARD */}
                <div className="bg-[#0b0b0f]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 transition-all">

                    {/* PROGRESS */}
                    <div className="flex items-center gap-2 mb-8"> {[0, 1, 2].map((s) => (<div key={s} className={` flex-1 h-1 rounded-full transition-all duration-300 ${step >= s ? "bg-indigo-600" : "bg-white/10"} `} />))} </div>

                    {/* STEP 1 */}
                    {step === 0 && (
                        <div className="space-y-6 animate-fade-in">

                            <div>
                                <h2 className="text-2xl font-semibold mb-2">
                                    What’s your business name?
                                </h2>

                                <p className="text-white/50 text-sm">
                                    This will appear on your invoices
                                </p>
                            </div>

                            <input
                                type="text"
                                placeholder="e.g. Cosmi Labs"
                                value={companyName}
                                onChange={(e) =>
                                    setCompanyName(e.target.value)
                                }
                                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg focus:border-indigo-400 outline-none"
                                autoFocus
                            />

                            <button
                                onClick={() => setStep(1)}
                                disabled={!companyName}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-40"
                            >
                                Continue
                            </button>

                        </div>
                    )}



                    {/* STEP 2 */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in">

                            <div>
                                <h2 className="text-2xl font-semibold mb-2">
                                    What should clients call you?
                                </h2>

                                <p className="text-white/50 text-sm">
                                    This appears on invoices and client communication.
                                </p>
                            </div>

                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={fullName}
                                onChange={(e) =>
                                    setFullName(e.target.value)
                                }
                                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg focus:border-indigo-400 outline-none"
                                autoFocus
                            />

                            <button
                                onClick={() => setStep(2)}
                                disabled={!fullName}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-40"
                            >
                                Continue
                            </button>

                        </div>
                    )}



                    {/* STEP 3 */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">

                            <div>
                                <h2 className="text-2xl font-semibold mb-2">
                                    What currency do you usually invoice in?
                                </h2>

                                <p className="text-white/50 text-sm">
                                    This will be used as default currency in your invoices.
                                    You can change this anytime later.
                                </p>
                            </div>

                            {/* CURRENCY */}
                            <div className="flex gap-3">

                                <button
                                    onClick={() => setCurrency("INR")}
                                    className={`flex-1 py-3 rounded-lg border transition ${currency === "INR"
                                        ? "bg-indigo-600 border-indigo-500"
                                        : "border-white/10 hover:bg-white/5"
                                        }`}
                                >
                                    INR ₹
                                </button>

                                <button
                                    onClick={() => setCurrency("USD")}
                                    className={`flex-1 py-3 rounded-lg border transition ${currency === "USD"
                                        ? "bg-indigo-600 border-indigo-500"
                                        : "border-white/10 hover:bg-white/5"
                                        }`}
                                >
                                    USD $
                                </button>

                            </div>


                            {/* INVOICE MODE */}
                            <div className="pt-2">

                                <h3 className="text-lg font-semibold mb-2">
                                    Create your first invoice
                                </h3>

                                <p className="text-sm text-slate-400 mb-4">
                                    Start from scratch or use a sample to explore how Cosmi works
                                </p>

                                <div className="flex flex-col gap-3">

                                    <button
                                        onClick={() =>
                                            setInvoiceMode("blank")
                                        }
                                        className={`w-full py-2.5 rounded-xl border transition ${invoiceMode === "blank"
                                            ? "bg-white text-black border-white"
                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                            }`}
                                    >
                                        Start from scratch
                                    </button>

                                    <button
                                        onClick={() =>
                                            setInvoiceMode("sample")
                                        }
                                        className={`w-full py-2.5 rounded-xl border transition ${invoiceMode === "sample" ? "bg-white text-black border-white"
                                            : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                                    >
                                        Use a sample invoice
                                    </button>

                                </div>

                            </div>

                            {/* FINISH */}
                            <button
                                onClick={handleFinish}
                                disabled={saving}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
                            >
                                {saving ? "Setting up..." : "Finish"}
                            </button>

                        </div>
                    )}

                </div>

            </div>

        </div>
    );
}

