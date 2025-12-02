// app/(dashboard)/layout.js
"use client";

// Use relative path
import Sidebar from "../(dashboard)/components/Sidebar";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  
  // Simulated authentication check
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto h-screen">
        {children}
      </div>
    </div>
  );
}