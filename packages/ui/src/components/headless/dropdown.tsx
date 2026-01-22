import { Menu } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { cn } from "../../lib/utils";

interface DropdownProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  chevronIcon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function Dropdown({ children, trigger, chevronIcon: ChevronIcon, className }: DropdownProps) {
  const Icon = ChevronIcon ?? ChevronDownIcon;

  return (
    <Menu as="div" className={cn("relative", className)}>
      <Menu.Button
        className={cn(
          "flex items-center gap-2",
          "bg-[var(--color-bg-card)]",
          "text-[var(--color-text-primary)]",
          "border border-[var(--color-border)]",
          "rounded-lg px-4 py-2",
          "hover:bg-[var(--color-bg-secondary)]",
          "transition-colors",
        )}
      >
        {trigger}
        <Icon className="h-4 w-4" />
      </Menu.Button>
      <Menu.Items
        className={cn(
          "absolute mt-2 w-56 rounded-lg",
          "bg-[var(--color-bg-card)]",
          "border border-[var(--color-border)]",
          "shadow-lg",
          "z-50",
        )}
      >
        {children}
      </Menu.Items>
    </Menu>
  );
}
