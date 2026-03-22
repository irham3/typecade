"use client";

import React from "react";
import { Icon } from "@iconify/react";
import * as LucideIcons from "lucide-react";

// The mapped pixelarticons names based on standard matches.
const pixelMap: Record<string, string> = {
  Settings: "pixelarticons:sliders",
  Flame: "pixelarticons:fire",
  FileText: "pixelarticons:script",
  Eye: "pixelarticons:eye",
  Camera: "pixelarticons:camera",
  TrendingUp: "pixelarticons:trending-up",
  Target: "pixelarticons:sun", // fallback
  Hash: "pixelarticons:section",
  Clock: "pixelarticons:clock",
  Activity: "pixelarticons:activity",
  ChevronDown: "pixelarticons:chevron-down",
  X: "pixelarticons:close",
  Loader2: "pixelarticons:loader",
  Zap: "pixelarticons:zap",
  Medal: "pixelarticons:medal",
  Copy: "pixelarticons:copy",
  Check: "pixelarticons:check",
  Trophy: "pixelarticons:trophy",
  Home: "pixelarticons:home",
  RotateCcw: "pixelarticons:reload",
  Plus: "pixelarticons:plus",
  Shield: "pixelarticons:shield",
  Search: "pixelarticons:search",
  Gamepad2: "pixelarticons:gamepad",
  Crown: "pixelarticons:crown",
  ArrowLeft: "pixelarticons:arrow-left",
  ArrowRight: "pixelarticons:arrow-right",
  CheckCircle: "pixelarticons:checkbox-on",
  Star: "pixelarticons:star",
  Globe: "pixelarticons:earth",
  PenLine: "pixelarticons:edit",
  ChevronRight: "pixelarticons:chevron-right",
  Keyboard: "pixelarticons:keyboard",
  User: "pixelarticons:user",
  Palette: "pixelarticons:paint",
  Users: "pixelarticons:users",
  GraduationCap: "pixelarticons:book-open",
  Menu: "pixelarticons:menu",
  Lock: "pixelarticons:lock",
  Mail: "pixelarticons:mail",
  ShieldCheck: "pixelarticons:shield",
  Info: "pixelarticons:info-box",
  AlertTriangle: "pixelarticons:alert"
};

const createArcadeIcon = (name: string) => {
  const IconComponent = ({ size = 24, className = "", ...props }: React.ComponentProps<"svg"> & { size?: number | string }) => {
    const pixelIconName = pixelMap[name];
    if (pixelIconName) {
      return <Icon icon={pixelIconName} width={size} height={size} className={className} {...(props as Record<string, unknown>)} />;
    }
    // Fallback exactly to lucide if no mapping exists
    const FallbackIcon = (LucideIcons as unknown as Record<string, React.ElementType>)[name];
    if (!FallbackIcon) return null;
    return <FallbackIcon size={size} className={className} {...props} />;
  };
  IconComponent.displayName = `ArcadeIcon(${name})`;
  return IconComponent;
};

export const Flame = createArcadeIcon("Flame");
export const FileText = createArcadeIcon("FileText");
export const Eye = createArcadeIcon("Eye");
export const Camera = createArcadeIcon("Camera");
export const TrendingUp = createArcadeIcon("TrendingUp");
export const Target = createArcadeIcon("Target");
export const Hash = createArcadeIcon("Hash");
export const Clock = createArcadeIcon("Clock");
export const Activity = createArcadeIcon("Activity");
export const ChevronDown = createArcadeIcon("ChevronDown");
export const X = createArcadeIcon("X");
export const Loader2 = createArcadeIcon("Loader2");
export const Zap = createArcadeIcon("Zap");
export const Medal = createArcadeIcon("Medal");
export const Copy = createArcadeIcon("Copy");
export const Check = createArcadeIcon("Check");
export const Trophy = createArcadeIcon("Trophy");
export const Home = createArcadeIcon("Home");
export const RotateCcw = createArcadeIcon("RotateCcw");
export const Plus = createArcadeIcon("Plus");
export const Shield = createArcadeIcon("Shield");
export const Search = createArcadeIcon("Search");
export const Gamepad2 = createArcadeIcon("Gamepad2");
export const Crown = createArcadeIcon("Crown");
export const ArrowLeft = createArcadeIcon("ArrowLeft");
export const ArrowRight = createArcadeIcon("ArrowRight");
export const CheckCircle = createArcadeIcon("CheckCircle");
export const Star = createArcadeIcon("Star");
export const Globe = createArcadeIcon("Globe");
export const PenLine = createArcadeIcon("PenLine");
export const Settings = createArcadeIcon("Settings");
export const ChevronRight = createArcadeIcon("ChevronRight");
export const Keyboard = createArcadeIcon("Keyboard");
export const User = createArcadeIcon("User");
export const Palette = createArcadeIcon("Palette");
export const Users = createArcadeIcon("Users");
export const GraduationCap = createArcadeIcon("GraduationCap");
export const Menu = createArcadeIcon("Menu");
export const Lock = createArcadeIcon("Lock");
export const Mail = createArcadeIcon("Mail");
export const ShieldCheck = createArcadeIcon("ShieldCheck");
export const Info = createArcadeIcon("Info");
export const AlertTriangle = createArcadeIcon("AlertTriangle");
