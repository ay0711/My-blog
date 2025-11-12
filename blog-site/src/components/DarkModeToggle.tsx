"use client";
import { useEffect, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";

export default function DarkModeToggle() {
  const [theme, setTheme] = useState<"light"|"dark">("light");

  useEffect(() => {
    const el = document.documentElement;
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial: "light"|"dark" = stored === "dark" || (!stored && prefersDark) ? "dark" : "light";
    setTheme(initial);
    if (initial === "dark") el.classList.add("dark");
  }, []);

  const toggle = () => {
    const el = document.documentElement;
    if (theme === "dark") {
      el.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      el.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-100 text-indigo-900 hover:bg-indigo-200 dark:bg-[#1b2150] dark:text-slate-100 dark:hover:bg-[#222a66] transition"
    >
      {theme === "dark" ? <FiSun /> : <FiMoon />} <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
