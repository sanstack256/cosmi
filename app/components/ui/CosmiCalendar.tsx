"use client";

import { useState } from "react";

type Props = {
    value?: string; // YYYY-MM-DD
    onChange: (date: string) => void;
};

export default function CosmiCalendar({ value, onChange }: Props) {
    const today = new Date();

    const [currentMonth, setCurrentMonth] = useState(
        value ? new Date(value) : today
    );

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];

    // padding before month starts
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }

    // actual days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const isSelected = (day: number) => {
        if (!value) return false;
        const d = new Date(value);
        return (
            d.getDate() === day &&
            d.getMonth() === month &&
            d.getFullYear() === year
        );
    };

    const selectDay = (day: number) => {
        const selected = new Date(year, month, day);
        const yyyy = selected.getFullYear();
        const mm = String(selected.getMonth() + 1).padStart(2, "0");
        const dd = String(selected.getDate()).padStart(2, "0");

        onChange(`${yyyy}-${mm}-${dd}`);
    };

    return (
        <div className="w-[280px] bg-[#0b0b12] border border-white/10 rounded-xl p-3 shadow-[0_0_30px_rgba(124,58,237,0.25)]">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-3">
                <button
                    onClick={() =>
                        setCurrentMonth(new Date(year, month - 1, 1))
                    }
                    className="text-white/60 hover:text-white"
                >
                    ‹
                </button>

                <span className="text-sm font-medium text-white">
                    {currentMonth.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                    })}
                </span>

                <button
                    onClick={() =>
                        setCurrentMonth(new Date(year, month + 1, 1))
                    }
                    className="text-white/60 hover:text-white"
                >
                    ›
                </button>
            </div>

            {/* WEEKDAYS */}
            <div className="grid grid-cols-7 text-xs text-slate-500 mb-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d} className="text-center">
                        {d}
                    </div>
                ))}
            </div>

            {/* DAYS */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) =>
                    day ? (
                        <button
                            key={i}
                            onClick={() => selectDay(day)}
                            className={`
                h-9 rounded-lg text-sm flex items-center justify-center
                transition-all
                ${isSelected(day)
                                    ? "bg-violet-600 text-white shadow-md"
                                    : "text-slate-300 hover:bg-violet-500/20"
                                }
              `}
                        >
                            {day}
                        </button>
                    ) : (
                        <div key={i} />
                    )
                )}
            </div>
        </div>
    );
}