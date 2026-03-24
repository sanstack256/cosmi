"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function Onboarding() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(0);
    const [companyName, setCompanyName] = useState("");
    const [currency, setCurrency] = useState("INR");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/signin");
        }
    }, [user, loading]);

    async function handleFinish() {
        if (!user) return;

        setSaving(true);

        try {
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

            router.replace("/invoice-editor");
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
                    <div className="h-1 bg-white/10 rounded-full mb-6 overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 transition-all duration-300"
                            style={{ width: step === 0 ? "50%" : "100%" }}
                        />
                    </div>

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
                                onChange={(e) => setCompanyName(e.target.value)}
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
                                    What currency do you usually invoice in?
                                </h2>
                                <p className="text-white/50 text-sm">
                                    This will be used as default currency in your invoices. You can change this anytime later.
                                </p>
                            </div>

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