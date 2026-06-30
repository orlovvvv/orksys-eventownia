import { cn } from "@orksys-eventownia/ui/lib/utils";

import { BRAND } from "@/lib/brand";

type BrandLogoProps = React.ComponentPropsWithoutRef<"span"> & {
  imageClassName?: string;
  nameClassName?: string;
  locationClassName?: string;
  showLocation?: boolean;
};

export function BrandLogo({
  className,
  imageClassName,
  nameClassName,
  locationClassName,
  showLocation = true,
  ...props
}: BrandLogoProps) {
  return (
    <span
      className={cn("inline-flex min-w-0 shrink-0 items-center gap-3 text-left", className)}
      {...props}
    >
      <img
        src="/brand/logo-mark-light.webp"
        alt=""
        width="560"
        height="420"
        className={cn("h-12 w-auto shrink-0 object-contain dark:hidden", imageClassName)}
        aria-hidden="true"
        decoding="async"
      />
      <img
        src="/brand/logo-mark-dark.webp"
        alt=""
        width="560"
        height="420"
        className={cn("hidden h-12 w-auto shrink-0 object-contain dark:block", imageClassName)}
        aria-hidden="true"
        decoding="async"
      />
      <span className="flex min-w-0 flex-col justify-center gap-1" translate="no">
        <span className={cn("text-lg font-bold leading-none text-foreground", nameClassName)}>
          {BRAND.name}
        </span>
        {showLocation ? (
          <span className={cn(" font-semibold leading-none text-primary", locationClassName)}>
            {BRAND.location}
          </span>
        ) : null}
      </span>
    </span>
  );
}
