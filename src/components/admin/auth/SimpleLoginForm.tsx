import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SimpleLoginForm() {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="test-email">Email (test)</Label>
        <Input id="test-email" type="email" placeholder="test@example.com" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="test-password">Hasło (test)</Label>
        <Input id="test-password" type="password" placeholder="••••••••" />
      </div>

      <Button type="button" className="w-full" onClick={() => alert("Formularz działa!")}>
        Test Zaloguj
      </Button>
    </form>
  );
}
