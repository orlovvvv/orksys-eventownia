import { cn } from "@orksys-eventownia/ui/lib/utils";
import * as React from "react";

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field-group" className={cn("flex flex-col gap-5", className)} {...props} />;
}

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field" className={cn("flex flex-col gap-2", className)} {...props} />;
}

function FieldLabel({ className, ...props }: React.ComponentProps<"label">) {
  return <label data-slot="field-label" className={cn("text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground", className)} {...props} />;
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-sm/relaxed text-muted-foreground", className)}
      {...props}
    />
  );
}

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn("flex flex-col gap-4 rounded-lg border border-border/70 bg-card p-5", className)}
      {...props}
    />
  );
}

function FieldLegend({ className, ...props }: React.ComponentProps<"legend">) {
  return <legend data-slot="field-legend" className={cn("px-1 text-lg font-semibold text-foreground", className)} {...props} />;
}

export { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet };
