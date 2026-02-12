import React, { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

interface CountUpProps {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number; // seconds
  className?: string;
  startWhen?: boolean;
  separator?: string;
}

const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  className = "",
  startWhen = true,
  separator = ",",
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === "down" ? to : from);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (isInView && startWhen) {
      if (typeof delay === "number" && delay > 0) {
        const timer = setTimeout(() => {
          motionValue.set(direction === "down" ? from : to);
        }, delay * 1000);
        return () => clearTimeout(timer);
      } else {
        motionValue.set(direction === "down" ? from : to);
      }
    }
  }, [isInView, startWhen, motionValue, direction, from, to, delay]);

  useEffect(() => {
    springValue.on("change", (latest: any) => {
      if (ref.current) {
        const val = typeof latest === "string" ? parseFloat(latest) : latest;
        const formatted = Math.floor(val).toLocaleString();
        ref.current.textContent = separator ? formatted.replace(/,/g, separator) : formatted;
      }
    });
  }, [springValue, separator]);

  return <span ref={ref} className={className} />;
};

export default CountUp;
