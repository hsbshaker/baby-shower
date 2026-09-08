import { ItemForm } from "@/components/admin/ItemForm";

export default function NewItemPage() {
  return (
    <div className="max-w-2xl">
      <p className="eyebrow text-cognac">New item</p>
      <h1 className="mt-1 mb-8 font-display text-4xl font-medium text-navy">Add to the registry</h1>
      <ItemForm />
    </div>
  );
}
