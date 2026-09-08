import { notFound } from "next/navigation";
import { getAdminItems } from "@/app/admin/actions";
import { ItemForm } from "@/components/admin/ItemForm";

export const dynamic = "force-dynamic";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = (await getAdminItems()).find((i) => i.id === id);
  if (!item) notFound();
  return (
    <div className="max-w-2xl">
      <p className="eyebrow text-cognac">Edit item</p>
      <h1 className="mt-1 mb-8 font-display text-4xl font-medium text-navy">{item.name}</h1>
      {item.source === "amazon" && (
        <p className="mb-6 rounded-sm border border-brass/40 bg-ivory px-4 py-3 text-[0.8rem] font-light text-ink/70">
          This item is synced from Amazon. Price, image, and purchased counts are refreshed
          hourly; name, description, and category stay as you set them here.
        </p>
      )}
      <ItemForm item={item} />
    </div>
  );
}
