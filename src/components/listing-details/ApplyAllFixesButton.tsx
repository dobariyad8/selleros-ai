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
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button disabled={disabled}>
            <Sparkles className="size-4" />
            {disabled ? "All fixes applied" : "Apply all AI fixes"}
          </Button>
        }
      />

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Apply all AI recommendations?
          </AlertDialogTitle>

          <AlertDialogDescription>
            This will apply the suggested title, pricing, tags,
            and description changes to the current mock listing.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>

          <AlertDialogAction onClick={handleApply}>
            <Sparkles className="size-4" />
            Apply recommendations
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}