import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/60 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/50 backdrop-blur-md">
      {/* Subtle decorative glow */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-500/5 blur-2xl dark:bg-indigo-500/5" />
      <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-indigo-500/5 blur-2xl dark:bg-amber-500/5" />

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600 transition-colors group-hover:scale-110 dark:bg-slate-800/80 dark:text-slate-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.isPositive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 font-normal">
        {description}
      </p>
    </div>
  );
}
