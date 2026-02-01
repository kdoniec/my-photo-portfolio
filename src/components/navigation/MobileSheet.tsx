import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { MobileSheetProps } from "./types";

/**
 * MobileSheet component - slide-in mobile menu using Shadcn Sheet
 * Displays a hamburger icon that opens a sheet with navigation content
 */
export default function MobileSheet({ isOpen, onOpenChange, children, side = "right" }: MobileSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Otwórz menu nawigacyjne" className="md:hidden">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </SheetTrigger>
      <SheetContent side={side} className="w-[300px] sm:w-[400px]" aria-label="Menu nawigacyjne">
        <nav className="flex flex-col gap-4 mt-8">{children}</nav>
      </SheetContent>
    </Sheet>
  );
}
