import * as React from "react";
import { cn } from "@/utils/cn";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
        className,
      )}
      role="status"
      {...props}
    >
    </div>
  ),
);
Loader.displayName = "Loader";

export { Loader };
