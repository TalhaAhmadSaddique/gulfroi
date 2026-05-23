"use client";

import { useEffect, useRef } from "react";

type Direction = "up" | "left" | "right";

export default function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
  threshold = 0.12,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: Direction;
  threshold?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const baseClass =
    direction === "left" ? "reveal-left" : direction === "right" ? "reveal-right" : "reveal";

  return (
    <div
      ref={ref}
      className={`${baseClass} ${className ?? ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
