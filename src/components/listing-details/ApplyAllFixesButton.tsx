"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ApplyAllFixesButtonProps = {
  onApply: () => void;
  disabled?: boolean;
};

export default function ApplyAllFixesButton({
  onApply,
  disabled = false,
}: ApplyAllFixesButtonProps) {
  const [open, setOpen] = useState(false);

  function handleApply() {
    onApply();
    setOpen(false);
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
    >
      <AlertDialogTrigger
        render={
          <Button
            className="w-full sm:w-auto"
            disabled={disabled}
          >
            <Sparkles className="size-4 shrink-0" />
            <span className="wrap-break-words">
              {disabled
                ? "All fixes applied"
                : "Apply all AI fixes"}
            </span>
          </Button>
        }
      />

      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="wrap-break-words">
            Apply all AI recommendations?
          </AlertDialogTitle>

          <AlertDialogDescription className="wrap-break-words">
            This will apply the suggested title,
            pricing, tags, and description changes
            to the current mock listing.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className="w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            className="w-full sm:w-auto"
            onClick={handleApply}
          >
            <Sparkles className="size-4 shrink-0" />
            Apply recommendations
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}