import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmDeleteButtonProps = {
  ariaLabel: string;
  confirmMessage: string;
  disabled?: boolean;
  onConfirm: () => void;
};

export function ConfirmDeleteButton({
  ariaLabel,
  confirmMessage,
  disabled = false,
  onConfirm,
}: ConfirmDeleteButtonProps) {
  return (
    <Button
      type="button"
      size="icon"
      variant="destructive"
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={() => {
        if (window.confirm(confirmMessage)) onConfirm();
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
