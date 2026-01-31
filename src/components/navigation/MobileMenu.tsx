import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface MobileMenuProps {
  siteName: string;
  currentPath: string;
}

const navLinks = [
  { label: "Galeria", href: "/" },
  { label: "O mnie", href: "/o-mnie" },
];

export default function MobileMenu({ siteName, currentPath }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Otwórz menu" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>{siteName}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-8" aria-label="Mobile navigation">
          {navLinks.map((link) => {
            const isActive = currentPath === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`text-lg font-medium transition-colors hover:text-foreground py-2 ${
                  isActive ? "text-foreground border-l-2 border-foreground pl-4" : "text-muted-foreground pl-4"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </a>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
