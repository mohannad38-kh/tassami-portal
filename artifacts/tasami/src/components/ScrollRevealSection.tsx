import { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  animation?: "fade-up" | "fade-in" | "slide-right" | "slide-left" | "zoom-in";
  delay?: number;
}

export default function ScrollRevealSection({
  children,
  className = "",
  animation = "fade-up",
  delay = 0,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // يتم التفعيل عندما يظهر العنصر أو يختفي أثناء الصعود والنزول
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.15, // يبدأ التفاعل عندما يظهر 15% من العنصر
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  const getAnimationClasses = () => {
    switch (animation) {
      case "fade-up":
        return `transition-all duration-700 ease-out transform ${
          isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95"
        }`;
      case "fade-in":
        return `transition-all duration-700 ease-out ${
          isVisible ? "opacity-100" : "opacity-0"
        }`;
      case "slide-right":
        return `transition-all duration-700 ease-out transform ${
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
        }`;
      case "slide-left":
        return `transition-all duration-700 ease-out transform ${
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
        }`;
      case "zoom-in":
        return `transition-all duration-700 ease-out transform ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
        }`;
      default:
        return "";
    }
  };

  return (
    <div
      ref={ref}
      className={`${getAnimationClasses()} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}