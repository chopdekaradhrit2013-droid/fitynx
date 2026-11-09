import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Error 404</p>
      <h1 className="mt-5 font-serif text-6xl tracking-[-0.06em] md:text-8xl">Nothing hanging here.</h1>
      <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">The page you’re looking for has moved or never existed. Let’s get you back to the studio.</p>
      <Button asChild className="mt-8"><Link href="/"><ArrowLeft className="size-4" /> Back home</Link></Button>
    </main>
  );
}
