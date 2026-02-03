import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  showStatus?: boolean;
  isOnline?: boolean;
  borderColor?: "white" | "gradient";
  size?: "sm" | "md" | "lg" | "xl";
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, showStatus = false, isOnline = false, borderColor = "white", size = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
    xl: "h-20 w-20",
  };

  const statusSizeClasses = {
    sm: "h-2 w-2 bottom-0 right-0 border-[1.5px]",
    md: "h-2.5 w-2.5 bottom-0 right-0 border-2",
    lg: "h-3 w-3 bottom-0.5 right-0.5 border-2",
    xl: "h-3.5 w-3.5 bottom-1 right-1 border-[2.5px]",
  };

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex shrink-0",
        "rounded-full",
        borderColor === "white"
          ? cn(
            "border-2 border-white dark:border-[#0E1621] shadow-sm",
            "overflow-hidden",
            sizeClasses[size]
          )
          : cn(
            "p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500",
            "overflow-visible",
            sizeClasses[size]
          ),
        "hover:scale-105 transition-transform duration-200 cursor-pointer",
        "instagram-avatar",
        className
      )}
      {...props}
    >
      <div className={cn(
        "w-full h-full rounded-full overflow-hidden",
        borderColor === "gradient" && "bg-background"
      )}>
        {props.children}
      </div>
      {showStatus && (
        <div
          className={cn(
            "absolute rounded-full",
            statusSizeClasses[size],
            isOnline
              ? "bg-[#31A24C] border-white dark:border-[#0E1621]"
              : "bg-gray-400 border-white dark:border-[#0E1621]",
            "shadow-sm z-10"
          )}
        />
      )}
    </AvatarPrimitive.Root>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full",
      "bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
