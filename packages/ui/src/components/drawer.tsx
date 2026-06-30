import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";

import { cn } from "@orksys-eventownia/ui/lib/utils";

function Drawer({ ...props }: DrawerPrimitive.Root.Props) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerOverlay({ className, ...props }: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

function DrawerContent({ className, ...props }: DrawerPrimitive.Popup.Props) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Popup
        data-slot="drawer-content"
        className={cn(
          "fixed right-0 top-0 z-50 flex h-dvh w-[min(22rem,calc(100vw-2rem))] flex-col bg-popover text-popover-foreground shadow-floating ring-1 ring-white/70 duration-150 outline-none data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-right dark:ring-white/10",
          className,
        )}
        {...props}
      />
    </DrawerPortal>
  );
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return <DrawerPrimitive.Title data-slot="drawer-title" className={cn(className)} {...props} />;
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

export { Drawer, DrawerClose, DrawerContent, DrawerOverlay, DrawerPortal, DrawerTitle, DrawerTrigger };
