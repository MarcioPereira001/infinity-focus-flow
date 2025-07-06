import { useEffect, useState } from "react";

interface FloatingLightProps {
  className?: string;
}

export function FloatingLight({ className = "" }: FloatingLightProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const updatePosition = () => {
      setPosition({
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    };

    const interval = setInterval(updatePosition, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`floating-light ${className}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
      }}
    />
  );
}