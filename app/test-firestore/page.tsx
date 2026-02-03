"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

export default function TestFirestorePage() {
  const [result, setResult] = useState<any>("Testing...");
  const auth = getAuth();

  useEffect(() => {
    async function run() {
      try {
        const user = auth.currentUser;

        if (!user) {
          setResult("No user logged in");
          return;
        }

        const ref = collection(db, "users", user.uid, "companies");
        const snap = await getDocs(ref);

        setResult(`SUCCESS → ${snap.docs.length} companies found`);
      } catch (err: any) {
        setResult("ERROR → " + err.message);
        console.error(err);
      }
    }

    run();
  }, []);

  return (
    <div className="text-white p-10">
      <h1 className="text-xl mb-4">Firestore Test</h1>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
