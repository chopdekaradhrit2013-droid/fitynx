import { Brand } from "@/components/site/Brand";
import { Reveal } from "@/components/site/Reveal";
import { UserMenu } from "@/components/site/UserMenu";
import { Button } from "@/components/ui/button";
import ClothingRailHero, { type RailGarment } from "@/components/ui/product-rail-gallery";
import { useAuth } from "@/contexts/AuthContext";
import { garmentDataUrl } from "@/lib/garments";
import { buildSampleWardrobe } from "@/lib/sample";
import type { GarmentType } from "@/lib/types";
import { ArrowRight, CalendarDays, CloudSun, Droplets, EyeOff, HardDrive, Layers, LogIn, Menu, Palette, Scissors, ShieldCheck, Shirt, Sparkles, UserPlus, X } from "lucide-react";
import * as React from "react";
import { Link } from "wouter";

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#closet", label: "The closet" },
  { href: "#privacy", label: "Privacy" },
  { href: "#faq", label: "FAQ" },
];

const KIND: Partial<Record<GarmentType, RailGarment["kind"]>> = { tee: "tee", shirt: "shirt", knit: "knit", hoodie: "hoodie", jacket: "jacket", coat: "coat" };
const sample = buildSampleWardrobe();
const railItems: RailGarment[] = sample.filter(i => ["tee", "shirt", "knit", "hoodie", "jacket", "coat", "blazer"].includes(i.type)).map((i, n) => ({
  id: i.id, name: i.name, category: i.type, kind: KIND[i.type] ?? "jacket", color: i.colorHex, image: i.image, tag: String(n + 1).padStart(2, "0"), description: i.notes, details: [i.colorName, i.type],
}));
const img = (t: GarmentType, c: string) => garmentDataUrl(t, c);

const FEATURES = [
  { icon: Shirt, title: "A digital wardrobe", text: "Photograph what you own once. Every piece is catalogued by type, colour and name — searchable, filterable and always with you." },
  { icon: Scissors, title: "Automatic cut-outs", text: "FITYNX lifts garments off plain backgrounds, so your closet looks like a considered catalogue rather than a camera roll." },
  { icon: Palette, title: "Colour intelligence", text: "Dominant colours are read straight from your photos and checked against real harmony rules: tonal, neutral-plus-accent, complementary." },
  { icon: Sparkles, title: "A stylist that explains", text: "Every look comes with the reasoning — why the palette works, how formal it is, what to finish with — and a transparent score." },
  { icon: CloudSun, title: "Weather & occasion aware", text: "Tell it where you’re going and what the sky is doing. It chooses the right layers and the right level of polish." },
  { icon: CalendarDays, title: "Plan the week", text: "Save the looks you love and assign them to days. Stop deciding at 7:45 a.m." },
];

const FAQ = [
  { q: "How do sign up and sign in work?", a: "FITYNX supports fast, secure sign-in with Google OAuth or email and password. Your personal account securely keeps your wardrobe, saved outfits, and styling history accessible to you." },
  { q: "Can I use Google OAuth to sign in?", a: "Yes. Google OAuth is available as a one-click option. Simply click 'Continue with Google' to sign up or sign in instantly with your Google account." },
  { q: "Where do my photos go?", a: "Nowhere. Images are processed and stored locally in your browser. FITYNX has no upload server, so your photos are never transmitted, stored by us, or used to train anything." },
  { q: "Is the stylist really “AI”?", a: "FITYNX combines on-device image analysis (colour extraction, background removal) with a transparent styling engine that scores colour harmony, formality and weather suitability. It does not send your wardrobe to a third-party model, and it will only ever recommend pieces you actually own." },
  { q: "What kind of photos work best?", a: "A single garment laid flat or hung against a plain, evenly lit surface. That gives the cleanest cut-out and the most accurate colour. You can always correct the type and colour before saving." },
  { q: "What happens if I clear my browser data?", a: "Your wardrobe lives in browser storage, so clearing site data removes it. Use Settings → Export to keep a JSON backup of your pieces, looks and calendar." },
  { q: "Does it cost anything?", a: "FITYNX is free to use." },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  React.useEffect(() => { document.title = "FITYNX — Private AI Wardrobe Studio"; }, []);

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">Skip to content</a>

      <header className={`sticky top-0 z-40 transition-all ${scrolled ? "border-b border-border bg-background/85 backdrop-blur-md" : "border-b border-transparent"}`}>
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-5 md:px-10">
          <Brand />
          <nav className="hidden items-center gap-8 text-sm md:flex" aria-label="Primary">
            {NAV.map(n => <a key={n.href} href={n.href} className="text-muted-foreground transition-colors hover:text-foreground">{n.label}</a>)}
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <UserMenu />
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link href="/app">Studio <ArrowRight className="size-4" /></Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link href="/signup">Create account <ArrowRight className="size-4" /></Link>
                </Button>
              </>
            )}
            <button className="rounded-full p-2 text-muted-foreground md:hidden" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label="Toggle navigation">{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-border bg-background px-5 pb-5 pt-3 md:hidden" aria-label="Mobile">
            {NAV.map(n => <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="block border-b border-border py-3 text-sm">{n.label}</a>)}
            <div className="mt-4 space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm font-medium">{user?.name}</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{user?.provider}</span>
                  </div>
                  <Button asChild className="w-full">
                    <Link href="/app">Open studio <ArrowRight className="size-4" /></Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/signup">Create account <ArrowRight className="size-4" /></Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      <main id="main">
        {/* HERO */}
        <section className="relative mx-auto grid max-w-[1320px] gap-14 px-5 pb-20 pt-12 md:grid-cols-[1.05fr_.95fr] md:items-center md:px-10 md:pb-32 md:pt-20">
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"><span className="size-1.5 rounded-full bg-[#F26A4B]" /> Private wardrobe studio</p>
            <h1 className="mt-7 font-serif text-[clamp(3.2rem,7.4vw,7.2rem)] leading-[0.88] tracking-[-0.07em]">Dress from<br /><em className="not-italic text-[#F26A4B]">what’s yours.</em></h1>
            <p className="mt-8 max-w-lg text-base leading-8 text-muted-foreground md:text-lg">FITYNX turns the clothes you already own into a digital wardrobe, then composes complete, weather-aware outfits from it — with the reasoning behind every choice.</p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              {isAuthenticated ? (
                <Button asChild size="lg">
                  <Link href="/app">Open the studio <ArrowRight className="size-4" /></Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link href="/signup">Get started free <ArrowRight className="size-4" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/login">Sign in</Link>
                  </Button>
                </>
              )}
              <Button asChild size="lg" variant="ghost"><a href="#how">See how it works</a></Button>
            </div>
            <ul className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-border pt-6 text-xs text-muted-foreground">
              {["Google OAuth & email sign-in", "Photos stay on your device", "Free to use"].map(t => <li key={t} className="inline-flex items-center gap-2"><span className="size-1 rounded-full bg-[#F26A4B]" />{t}</li>)}
            </ul>
          </div>
          <HeroVisual />
        </section>

        {/* PILLARS */}
        <section className="border-y border-border bg-card/60">
          <div className="mx-auto grid max-w-[1320px] gap-px bg-border md:grid-cols-3">
            {[
              { icon: Layers, t: "Your wardrobe first", d: "No imaginary pieces and no endless shopping loop. Every look starts with what is already in your closet." },
              { icon: HardDrive, t: "Private by architecture", d: "Everything runs in your browser. There is no server to receive your photos, because there isn’t one." },
              { icon: Droplets, t: "More wear, less waste", d: "The most sustainable garment is the one you already own, waiting for its next good day." },
            ].map(p => (
              <div key={p.t} className="bg-background px-6 py-9 md:px-10 md:py-12">
                <p.icon className="size-5 text-[#F26A4B]" />
                <h3 className="mt-5 font-serif text-2xl tracking-[-0.03em]">{p.t}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="mx-auto max-w-[1320px] scroll-mt-20 px-5 py-20 md:px-10 md:py-32">
          <Reveal className="max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Capabilities</p>
            <h2 className="mt-4 font-serif text-4xl leading-[1.02] tracking-[-0.05em] md:text-6xl">Everything a stylist does,<br /><em className="not-italic text-[#F26A4B]">built around your closet.</em></h2>
          </Reveal>
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 60} className="bg-card p-7 md:p-9">
                <span className="flex size-10 items-center justify-center rounded-full border border-border bg-background"><f.icon className="size-4" /></span>
                <h3 className="mt-8 font-serif text-2xl tracking-[-0.03em]">{f.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{f.text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* HOW */}
        <section id="how" className="scroll-mt-20 bg-primary text-primary-foreground">
          <div className="mx-auto max-w-[1320px] px-5 py-20 md:px-10 md:py-32">
            <Reveal className="max-w-2xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary-foreground/60">The ritual</p>
              <h2 className="mt-4 font-serif text-4xl leading-[1.02] tracking-[-0.05em] md:text-6xl">Three steps from<br />closet to <em className="not-italic text-[#F26A4B]">composed.</em></h2>
            </Reveal>
            <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
              {[
                { n: "01", t: "Add what’s yours", d: "Drop in photos of your clothes. FITYNX removes the background, reads the colour and suggests a type — you confirm in a click." },
                { n: "02", t: "Brief your stylist", d: "Choose an occasion, a feeling and the weather. Add colours you’re drawn to if you like." },
                { n: "03", t: "Wear the look", d: "Get up to three complete outfits with a clear rationale. Save favourites and plan them on your calendar." },
              ].map((s, i) => (
                <Reveal key={s.n} delay={i * 90}>
                  <li className="list-none border-t border-primary-foreground/25 pt-6">
                    <span className="font-mono text-xs tracking-[0.18em] text-[#F26A4B]">{s.n}</span>
                    <h3 className="mt-10 font-serif text-3xl tracking-[-0.03em]">{s.t}</h3>
                    <p className="mt-4 max-w-sm text-sm leading-7 text-primary-foreground/70">{s.d}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* CLOSET RAIL */}
        <section id="closet" className="mx-auto max-w-[1320px] scroll-mt-20 px-5 py-20 md:px-10 md:py-32">
          <ClothingRailHero items={railItems} eyebrow="The interactive closet" heading="See your wardrobe in a new light." caption="Brush along the rail, then open a piece." autoplay interval={3200}
            action={<span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:inline">Hover · select · open</span>} />
        </section>

        {/* STYLIST PREVIEW */}
        <section className="border-y border-border bg-card/60">
          <div className="mx-auto grid max-w-[1320px] gap-14 px-5 py-20 md:grid-cols-[.85fr_1.15fr] md:items-center md:px-10 md:py-32">
            <Reveal>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">The stylist</p>
              <h2 className="mt-4 font-serif text-4xl leading-[1.02] tracking-[-0.05em] md:text-6xl">Good taste,<br /><em className="not-italic text-[#F26A4B]">explained.</em></h2>
              <p className="mt-6 max-w-md text-base leading-8 text-muted-foreground">Recommendations are never a black box. Each look shows how the palette was balanced, how well it fits the occasion and the weather, and what would finish it.</p>
              <Button asChild className="mt-8"><Link href="/app/stylist">Try the stylist <ArrowRight className="size-4" /></Link></Button>
            </Reveal>
            <Reveal delay={120}><LookPreview /></Reveal>
          </div>
        </section>

        {/* PRIVACY */}
        <section id="privacy" className="mx-auto grid max-w-[1320px] scroll-mt-20 gap-12 px-5 py-20 md:grid-cols-[.9fr_1.1fr] md:px-10 md:py-32">
          <Reveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Privacy</p>
            <h2 className="mt-4 font-serif text-4xl leading-[1.02] tracking-[-0.05em] md:text-6xl">Your closet is<br /><em className="not-italic text-[#F26A4B]">nobody’s business.</em></h2>
          </Reveal>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
            {[
              { icon: HardDrive, t: "On-device storage", d: "Photos and data are saved in your browser, not on a remote database." },
              { icon: EyeOff, t: "No tracking of your wardrobe", d: "We don’t see what you own, what you save or what you plan." },
              { icon: ShieldCheck, t: "Personal account security", d: "Sign in with Google OAuth or email — your wardrobe data is isolated securely for your personal account." },
              { icon: Droplets, t: "You’re in control", d: "Export a backup or erase everything in one click from Settings." },
            ].map(p => (
              <div key={p.t} className="bg-card p-6 md:p-8">
                <p.icon className="size-5 text-[#F26A4B]" />
                <h3 className="mt-5 text-sm font-semibold">{p.t}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-border">
          <div className="mx-auto grid max-w-[1320px] gap-12 px-5 py-20 md:grid-cols-[.7fr_1.3fr] md:px-10 md:py-32">
            <Reveal><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Questions</p><h2 className="mt-4 font-serif text-4xl leading-[1.02] tracking-[-0.05em] md:text-5xl">Good to know.</h2></Reveal>
            <div className="divide-y divide-border border-y border-border">
              {FAQ.map(f => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left font-serif text-xl tracking-[-0.02em] marker:hidden [&::-webkit-details-marker]:hidden">
                    {f.q}<span aria-hidden className="text-2xl text-[#F26A4B] transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-[1320px] px-5 pb-20 md:px-10 md:pb-32">
          <Reveal>
            <div className="grain relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground md:px-12 md:py-24">
              <h2 className="mx-auto max-w-3xl font-serif text-4xl leading-[1.02] tracking-[-0.05em] md:text-7xl">Open your closet.<br /><em className="not-italic text-[#F26A4B]">Start dressing.</em></h2>
              <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-primary-foreground/70">
                {isAuthenticated
                  ? "Welcome back. Your personal wardrobe and stylist are ready."
                  : "Sign in with Google OAuth or create a free account to compose your first look in under a minute."}
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                {isAuthenticated ? (
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/app">Open the studio <ArrowRight className="size-4" /></Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" variant="secondary">
                      <Link href="/signup">Create free account <ArrowRight className="size-4" /></Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                      <Link href="/login">Sign in</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border bg-sidebar">
        <div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-8 px-5 py-12 md:flex-row md:items-end md:px-10">
          <div><Brand /><p className="mt-3 max-w-xs text-xs leading-5 text-muted-foreground">A private wardrobe studio for more intentional dressing.</p></div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground" aria-label="Footer">
            {NAV.map(n => <a key={n.href} href={n.href} className="hover:text-foreground">{n.label}</a>)}
            <Link href="/app" className="hover:text-foreground">Studio</Link>
            {!isAuthenticated ? (
              <>
                <Link href="/login" className="hover:text-foreground">Sign In</Link>
                <Link href="/signup" className="hover:text-foreground">Sign Up</Link>
              </>
            ) : null}
          </nav>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">© {new Date().getFullYear()} FITYNX</p>
        </div>
      </footer>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-[5/6] w-full max-w-[520px]" aria-hidden>
      <div className="absolute inset-x-6 top-0 h-[82%] rounded-[2rem] border border-border bg-secondary" />
      <div className="float-slow absolute left-[2%] top-[7%] w-[40%] rounded-2xl border border-border bg-card p-3 shadow-[0_20px_50px_rgba(30,30,30,0.12)]" style={{ "--r": "-4deg" } as React.CSSProperties}>
        <img src={img("knit", "#758151")} alt="" className="aspect-[200/310] w-full object-contain" /><p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Merino knit · Olive</p>
      </div>
      <div className="float-slow-2 absolute right-[4%] top-[16%] w-[40%] rounded-2xl border border-border bg-card p-3 shadow-[0_20px_50px_rgba(30,30,30,0.12)]" style={{ "--r": "3deg" } as React.CSSProperties}>
        <img src={img("trousers", "#2E3340")} alt="" className="aspect-[200/310] w-full object-contain" /><p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Trousers · Navy</p>
      </div>
      <div className="absolute inset-x-0 bottom-0 rounded-2xl border border-border bg-card p-5 shadow-[0_24px_60px_rgba(30,30,30,0.14)] md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Composed for · Dinner out</p><p className="mt-2 font-serif text-2xl tracking-[-0.03em]">Quiet authority</p></div>
          <div className="text-right"><p className="font-serif text-3xl leading-none tracking-[-0.04em]">9.1</p><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">/ 10</p></div>
        </div>
        <div className="mt-4 flex items-center gap-2">{["#758151", "#2E3340", "#5A3D2B", "#E7E1D5"].map(c => <i key={c} className="size-5 rounded-full border border-border" style={{ background: c }} />)}<span className="ml-1 text-xs text-muted-foreground">Neutral base, one accent</span></div>
      </div>
    </div>
  );
}

function LookPreview() {
  const pieces: Array<[GarmentType, string, string, string]> = [["shirt", "#9DB4CE", "Top", "Oxford shirt"], ["trousers", "#2E3340", "Bottom", "Tailored trousers"], ["blazer", "#2E2E2E", "Layer", "Blazer"], ["loafers", "#5A3D2B", "Shoes", "Leather loafers"]];
  return (
    <article className="rounded-2xl border border-border bg-background p-5 shadow-[0_24px_60px_rgba(30,30,30,0.08)] md:p-7">
      <div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Brief · Office · Polished · Cool</p><span className="rounded-full bg-primary px-2.5 py-1 font-mono text-[10px] text-primary-foreground">9.3 / 10</span></div>
      <p className="mt-5 font-serif text-3xl tracking-[-0.03em]">The considered edit</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Oxford shirt, tailored trousers and blazer come together as a complete outfit for office. Layering gives you control as the temperature shifts.</p>
      <div className="mt-6 grid grid-cols-4 gap-3">{pieces.map(([t, c, role, name]) => <figure key={name}><div className="aspect-[4/5] rounded-lg border border-border bg-card p-1.5"><img src={img(t, c)} alt={name} className="h-full w-full object-contain" /></div><figcaption className="mt-2"><span className="block font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">{role}</span><span className="block truncate text-[11px]">{name}</span></figcaption></figure>)}</div>
      <dl className="mt-6 grid gap-4 border-t border-border pt-5 text-xs leading-5 sm:grid-cols-2">
        <div><dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Colour &amp; fit</dt><dd className="mt-1.5">Blue is the single accent, supported by neutrals so it reads as intentional.</dd></div>
        <div><dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Score breakdown</dt><dd className="mt-1.5">Palette 95% · Occasion 90% · Weather 92%</dd></div>
      </dl>
    </article>
  );
}
