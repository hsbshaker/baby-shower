import { getItems } from "@/lib/items";
import { SiteHeader } from "@/components/SiteHeader";
import { Welcome } from "@/components/Welcome";
import { Registry } from "@/components/Registry";
import { SiteFooter } from "@/components/SiteFooter";

export const revalidate = 300;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;
  let items = await getItems();

  // `?demo=purchased` previews the purchased treatment without touching data.
  if (demo === "purchased") {
    items = items.map((it, i) =>
      i % 3 === 1 ? { ...it, qty_purchased: it.qty_needed } : it,
    );
  }

  return (
    <>
      <SiteHeader />
      <main>
        <Welcome />
        <Registry items={items} />
      </main>
      <SiteFooter />
    </>
  );
}
