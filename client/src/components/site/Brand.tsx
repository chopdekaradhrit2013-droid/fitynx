import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function Brand({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("font-serif text-2xl font-semibold tracking-[-0.08em]", className)} aria-label="FITYNX home">
      FITYNX<span className="ml-0.5 text-[#F26A4B]">•</span>
    </Link>
  );
}
