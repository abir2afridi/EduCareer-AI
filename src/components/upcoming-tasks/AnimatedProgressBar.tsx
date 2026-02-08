import { useEffect, useState, useCallback } from "react";
import { motion, useAnimation, useMotionValue, animate } from "framer-motion";

interface AnimatedProgressBarProps {
  startDate: Date;
  endDate: Date;
  className?: string;
}

const calculateProgress = (start: Date, end: Date): { percent: number; remainingMs: number } => {
  const now = Date.now();
  const startTime = start.getTime();
  const endTime = end.getTime();
  const totalDuration = endTime - startTime;
  
  if (totalDuration <= 0) return { percent: 100, remainingMs: 0 };
  
  const elapsed = now - startTime;
  const percent = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  const remainingMs = Math.max(endTime - now, 0);
  
  return { percent, remainingMs };
};

export function AnimatedProgressBar({ startDate, endDate, className = "" }: AnimatedProgressBarProps) {
  const [progress, setProgress] = useState(() => calculateProgress(startDate, endDate));
  const controls = useAnimation();
  
  const updateProgress = useCallback(() => {
    const newProgress = calculateProgress(startDate, endDate);
    setProgress(newProgress);
    
    // Animate the progress bar smoothly
    controls.start({
      width: `${newProgress.percent}%`,
      transition: { duration: 0.5, ease: "easeInOut" }
    });
    
    // Continue animation if not complete
    if (newProgress.percent < 100) {
      const nextFrame = requestAnimationFrame(updateProgress);
      return () => cancelAnimationFrame(nextFrame);
    }
  }, [startDate, endDate, controls]);
  
  useEffect(() => {
    const nextFrame = requestAnimationFrame(updateProgress);
    
    // Update every second for smooth progress
    const interval = setInterval(updateProgress, 1000);
    
    return () => {
      cancelAnimationFrame(nextFrame);
      clearInterval(interval);
    };
  }, [updateProgress]);
  
  // Format time remaining
  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return "Time's up!";
    
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    if (minutes > 0) return `${minutes}m ${seconds}s left`;
    return `${seconds}s left`;
  };
  
  const isComplete = progress.percent >= 100;
  const isPast = new Date() > endDate;
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">
          {isComplete 
            ? isPast 
              ? "Completed" 
              : "In progress"
            : formatTimeRemaining(progress.remainingMs)}
        </span>
        <span className="font-semibold text-primary">{Math.round(progress.percent)}%</span>
      </div>
      
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`h-full rounded-full ${
            isComplete 
              ? isPast 
                ? "bg-emerald-500" 
                : "bg-primary"
              : "bg-gradient-to-r from-primary via-primary/80 to-primary/60"
          }`}
          initial={{ width: "0%" }}
          animate={controls}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <motion.div 
            className="absolute inset-0 bg-[length:20px_20px] opacity-20"
            style={{
              backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)',
              backgroundPositionX: useMotionValue(20)
            }}
            animate={{
              backgroundPositionX: [20, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: 'linear'
            }}
          />
        </motion.div>
      </div>
      
    </div>
  );
}
