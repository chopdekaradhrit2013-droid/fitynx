import { LookCard } from "@/components/site/LookCard";
import { EmptyState, LinkButton, PageHeader } from "@/components/site/studio-ui";
import { useStore } from "@/lib/store";
import { Heart } from "lucide-react";

export default function Saved() {
  const looks = useStore(s => s.looks).filter(l => l.saved);
  const items = useStore(s => s.items);

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="The archive" title="Saved looks." text="The combinations worth remembering. Keep a small rotation of good ideas within reach." />
      {looks.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-7" />}
          title={items.length === 0 ? "No clothes uploaded yet" : "Nothing saved yet"}
          text={
            items.length === 0
              ? "You haven’t uploaded any clothes yet. Upload photos of your wardrobe pieces and generate outfits with the stylist to save your favourite looks here."
              : "Compose a look with the stylist, then tap the heart on the ones you want to keep."
          }
          action={
            items.length === 0 ? (
              <LinkButton href="/app">Upload clothes to wardrobe</LinkButton>
            ) : (
              <LinkButton href="/app/stylist">Open the stylist</LinkButton>
            )
          }
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">{looks.map(l => <LookCard key={l.id} look={l} />)}</div>
      )}
    </div>
  );
}
