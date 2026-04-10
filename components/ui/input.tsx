import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-claude-lg border border-claude-border-cream bg-white px-3 py-2 text-base transition-all outline-none placeholder:text-claude-stone-gray focus-visible:border-claude-focus-blue focus-visible:ring-2 focus-visible:ring-claude-focus-blue/20 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-claude-crimson md:text-sm shadow-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
