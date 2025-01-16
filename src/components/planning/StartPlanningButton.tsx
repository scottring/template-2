"use client";

import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

interface StartPlanningButtonProps {
  onClick: () => void;
  timeScale?: "week" | "month" | "quarter" | "year";
}

export function StartPlanningButton({ onClick, timeScale = "week" }: StartPlanningButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        size="lg"
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 rounded-xl shadow-lg"
        onClick={onClick}
      >
        <CalendarDays className="w-6 h-6 mr-2" />
        <span className="text-lg">Start {timeScale.charAt(0).toUpperCase() + timeScale.slice(1)}ly Planning</span>
      </Button>
    </motion.div>
  );
} 