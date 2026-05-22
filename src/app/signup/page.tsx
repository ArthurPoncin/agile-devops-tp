"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Home } from "lucide-react";
import { EyeBall, Pupil } from "@/components/auth/animated-eyes";
import { signup } from "@/lib/auth/actions";

function useRandomBlink() {
  const [isBlinking, setIsBlinking] = useState(false);
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          schedule();
        }, 150);
      }, Math.random() * 4000 + 3000);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, []);
  return isBlinking;
}

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPeeking, setIsPeeking] = useState(false);
  const [pending, setPending] = useState(false);
  const goldRef = useRef<HTMLDivElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);
  const bronzeRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isGoldBlinking = useRandomBlink();
  const isDarkBlinking = useRandomBlink();

  const [positions, setPositions] = useState({
    goldPos: { faceX: 0, faceY: 0, bodySkew: 0 },
    darkPos: { faceX: 0, faceY: 0, bodySkew: 0 },
    bronzePos: { faceX: 0, faceY: 0, bodySkew: 0 },
    yellowPos: { faceX: 0, faceY: 0, bodySkew: 0 },
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const calc = (ref: React.RefObject<HTMLDivElement | null>) => {
        if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
        const rect = ref.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 3;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        return {
          faceX: Math.max(-15, Math.min(15, dx / 20)),
          faceY: Math.max(-10, Math.min(10, dy / 30)),
          bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
        };
      };
      setPositions({
        goldPos: calc(goldRef),
        darkPos: calc(darkRef),
        bronzePos: calc(bronzeRef),
        yellowPos: calc(yellowRef),
      });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  useEffect(() => {
    if (!isLookingAtEachOther) return;
    const t = setTimeout(() => setIsLookingAtEachOther(false), 800);
    return () => clearTimeout(t);
  }, [isLookingAtEachOther]);

  useEffect(() => {
    if (!(password.length > 0 && showPassword)) return;
    const t = setTimeout(() => {
      setIsPeeking(true);
      setTimeout(() => setIsPeeking(false), 800);
    }, Math.random() * 3000 + 2000);
    return () => clearTimeout(t);
  }, [password, showPassword, isPeeking]);

  const { goldPos, darkPos, bronzePos, yellowPos } = positions;

  const hideEyes = password.length > 0 && !showPassword;
  const peekMode = password.length > 0 && showPassword;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;
    setPending(true);
    setError("");
    const fd = new FormData(formRef.current);
    signup(fd).then((result) => {
      if (result && "error" in result) {
        setError(result.error);
      }
      setPending(false);
    }).catch(() => {
      setError("Une erreur est survenue.");
      setPending(false);
    });
  }

  return (
    <div className="flex flex-1 lg:grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between bg-[#1a1a1a] p-12 text-[#d4a843]">
        <div className="relative z-20">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#d4a843]/10 backdrop-blur-sm">
              <Home className="size-4" />
            </div>
            <span>ImmoMatch</span>
          </Link>
        </div>

        <div className="relative z-20 flex items-end justify-center h-[500px]">
          <div className="relative" style={{ width: "550px", height: "400px" }}>
            <div
              ref={goldRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: "70px", width: "180px",
                height: (isTyping || hideEyes) ? "440px" : "400px",
                backgroundColor: "#d4a843",
                borderRadius: "10px 10px 0 0",
                zIndex: 1,
                transform: peekMode ? "skewX(0deg)" : (isTyping || hideEyes) ? `skewX(${(goldPos.bodySkew || 0) - 12}deg) translateX(40px)` : `skewX(${goldPos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div className="absolute flex gap-8 transition-all duration-700 ease-in-out" style={{ left: peekMode ? "20px" : isLookingAtEachOther ? "55px" : `${45 + goldPos.faceX}px`, top: peekMode ? "35px" : isLookingAtEachOther ? "65px" : `${40 + goldPos.faceY}px` }}>
                <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isGoldBlinking} forceLookX={peekMode ? (isPeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={peekMode ? (isPeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
                <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isGoldBlinking} forceLookX={peekMode ? (isPeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={peekMode ? (isPeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
              </div>
            </div>

            <div ref={darkRef} className="absolute bottom-0 transition-all duration-700 ease-in-out" style={{ left: "240px", width: "120px", height: "310px", backgroundColor: "#8b7355", borderRadius: "8px 8px 0 0", zIndex: 2, transform: peekMode ? "skewX(0deg)" : isLookingAtEachOther ? `skewX(${(darkPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)` : (isTyping || hideEyes) ? `skewX(${(darkPos.bodySkew || 0) * 1.5}deg)` : `skewX(${darkPos.bodySkew || 0}deg)`, transformOrigin: "bottom center" }}>
              <div className="absolute flex gap-6 transition-all duration-700 ease-in-out" style={{ left: peekMode ? "10px" : isLookingAtEachOther ? "32px" : `${26 + darkPos.faceX}px`, top: peekMode ? "28px" : isLookingAtEachOther ? "12px" : `${32 + darkPos.faceY}px` }}>
                <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isDarkBlinking} forceLookX={peekMode ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={peekMode ? -4 : isLookingAtEachOther ? -4 : undefined} />
                <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isDarkBlinking} forceLookX={peekMode ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={peekMode ? -4 : isLookingAtEachOther ? -4 : undefined} />
              </div>
            </div>

            <div ref={bronzeRef} className="absolute bottom-0 transition-all duration-700 ease-in-out" style={{ left: "0px", width: "240px", height: "200px", backgroundColor: "#c9956a", borderRadius: "120px 120px 0 0", zIndex: 3, transform: peekMode ? "skewX(0deg)" : `skewX(${bronzePos.bodySkew || 0}deg)`, transformOrigin: "bottom center" }}>
              <div className="absolute flex gap-8 transition-all duration-200 ease-out" style={{ left: peekMode ? "50px" : `${82 + (bronzePos.faceX || 0)}px`, top: peekMode ? "85px" : `${90 + (bronzePos.faceY || 0)}px` }}>
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={peekMode ? -5 : undefined} forceLookY={peekMode ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={peekMode ? -5 : undefined} forceLookY={peekMode ? -4 : undefined} />
              </div>
            </div>

            <div ref={yellowRef} className="absolute bottom-0 transition-all duration-700 ease-in-out" style={{ left: "310px", width: "140px", height: "230px", backgroundColor: "#e8d754", borderRadius: "70px 70px 0 0", zIndex: 4, transform: peekMode ? "skewX(0deg)" : `skewX(${yellowPos.bodySkew || 0}deg)`, transformOrigin: "bottom center" }}>
              <div className="absolute flex gap-6 transition-all duration-200 ease-out" style={{ left: peekMode ? "20px" : `${52 + (yellowPos.faceX || 0)}px`, top: peekMode ? "35px" : `${40 + (yellowPos.faceY || 0)}px` }}>
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={peekMode ? -5 : undefined} forceLookY={peekMode ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={peekMode ? -5 : undefined} forceLookY={peekMode ? -4 : undefined} />
              </div>
              <div className="absolute h-1 w-20 rounded-full bg-[#2D2D2D] transition-all duration-200 ease-out" style={{ left: peekMode ? "10px" : `${40 + (yellowPos.faceX || 0)}px`, top: peekMode ? "88px" : `${88 + (yellowPos.faceY || 0)}px` }} />
            </div>
          </div>
        </div>

        <div className="relative z-20 text-sm text-[#d4a843]/50">
          ImmoMatch - La plateforme immobiliere simple et efficace
        </div>
        <div className="absolute inset-0 bg-[length:20px_20px] bg-[image:linear-gradient(to_right,rgba(212,168,67,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(212,168,67,0.03)_1px,transparent_1px)]" />
        <div className="absolute top-1/4 right-1/4 size-64 rounded-full bg-[#d4a843]/10 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 size-96 rounded-full bg-[#d4a843]/5 blur-3xl" />
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-12 flex items-center justify-center gap-2 text-lg font-bold lg:hidden">
            <div className="flex size-8 items-center justify-center rounded-lg bg-accent/10">
              <Home className="size-4 text-accent" />
            </div>
            <span>ImmoMatch</span>
          </div>

          <div className="mb-10 text-center">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">Creer un compte</h1>
            <p className="text-sm text-muted-foreground">Renseignez vos informations pour rejoindre la plateforme.</p>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nom</Label>
              <Input id="name" name="name" type="text" autoComplete="name" required onFocus={() => { setIsTyping(true); setIsLookingAtEachOther(true); }} onBlur={() => { setIsTyping(false); setIsLookingAtEachOther(false); }} className="h-12 border-border/60 bg-background focus:border-ring" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input id="email" name="email" type="email" placeholder="vous@exemple.com" autoComplete="email" required onFocus={() => { setIsTyping(true); setIsLookingAtEachOther(true); }} onBlur={() => { setIsTyping(false); setIsLookingAtEachOther(false); }} className="h-12 border-border/60 bg-background focus:border-ring" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Mot de passe</Label>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="--------" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 border-border/60 bg-background pr-10 focus:border-ring" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground">
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmer le mot de passe</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="--------" autoComplete="new-password" required className="h-12 border-border/60 bg-background focus:border-ring" />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="h-12 w-full text-base font-medium" size="lg" disabled={pending}>
              {pending ? "Inscription..." : "S'inscrire"}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Deja inscrit ?{" "}
            <Link href="/login" className="font-medium text-foreground hover:underline">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
