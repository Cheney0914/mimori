"use client";
import { useEffect } from "react"; import { useRouter } from "next/navigation"; import { preferencesRepository } from "@/lib/db";
export default function Home() { const router = useRouter(); useEffect(() => { preferencesRepository.get().then((p) => router.replace(p.onboardingComplete ? "/camera" : "/onboarding")); }, [router]); return null; }
