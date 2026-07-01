import { cn } from "@orksys-eventownia/ui/lib/utils";

function AdminSection({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("overflow-hidden rounded-lg border border-border/70 bg-card", className)}
      {...props}
    />
  );
}

function AdminSectionHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border/70 px-4 py-3 md:flex-row md:items-start md:justify-between",
        className,
      )}
      {...props}
    />
  );
}

function AdminSectionTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-base font-semibold leading-snug", className)} {...props} />;
}

function AdminSectionDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm/relaxed text-muted-foreground", className)} {...props} />;
}

function AdminSectionActions({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex shrink-0 flex-wrap gap-2", className)} {...props} />;
}

function AdminSectionContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-4", className)} {...props} />;
}

function AdminSectionFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("border-t border-border/70 px-4 py-3", className)} {...props} />;
}

export {
  AdminSection,
  AdminSectionActions,
  AdminSectionContent,
  AdminSectionDescription,
  AdminSectionFooter,
  AdminSectionHeader,
  AdminSectionTitle,
};
