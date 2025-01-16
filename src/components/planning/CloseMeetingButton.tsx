"use client";

import { Button } from "@/components/ui/button";
import { Check, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface CloseMeetingButtonProps {
  onClick: () => void;
  timeScale?: "week" | "month" | "quarter" | "year";
}

export function CloseMeetingButton({ onClick, timeScale = "week" }: CloseMeetingButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex flex-col items-center gap-2"
    >
      <Button
        size="lg"
        variant="outline"
        className="border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-6 rounded-xl shadow-lg"
        onClick={onClick}
      >
        <Check className="w-6 h-6 mr-2" />
        <span className="text-lg">Close Meeting</span>
      </Button>
      
      <Button
        size="lg"
        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-6 rounded-xl shadow-lg"
        onClick={onClick}
      >
        <span className="text-lg">Start {timeScale.charAt(0).toUpperCase() + timeScale.slice(1)}</span>
        <ChevronRight className="w-6 h-6 ml-2" />
      </Button>
    </motion.div>
  );
} 