"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

interface SubmitButtonProps extends ButtonProps {
  pendingText: string;
}

/**
 * Must be rendered INSIDE the <form> it belongs to — useFormStatus only
 * reports the status of the nearest parent <form>, which is why this is
 * its own component rather than a prop on the form itself. Without this,
 * a person tapping "Sign in" or "Create account" sees nothing happen for
 * however long the server action takes, and has no way to tell whether
 * their tap even registered.
 */
export function SubmitButton({ pendingText, children, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}