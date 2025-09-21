import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface BackButtonProps {
  /** Custom text to show next to the arrow icon */
  text?: string;
  /** Explicit route to navigate to instead of browser back */
  to?: string;
  /** Custom click handler instead of default navigation */
  onClick?: () => void;
  /** Show only icon for mobile view */
  mobileIconOnly?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  "data-testid"?: string;
}

export function BackButton({ 
  text = "Back", 
  to, 
  onClick, 
  mobileIconOnly = false,
  className = "",
  "data-testid": testId = "button-back"
}: BackButtonProps) {
  const [, navigate] = useLocation();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      // Use browser back navigation
      window.history.back();
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`gap-2 ${className}`}
      data-testid={testId}
      aria-label={text}
    >
      <ArrowLeft className="h-4 w-4" />
      {/* Show text on desktop, hide on mobile if mobileIconOnly is true */}
      <span className={mobileIconOnly ? "hidden sm:inline" : ""}>
        {text}
      </span>
    </Button>
  );
}