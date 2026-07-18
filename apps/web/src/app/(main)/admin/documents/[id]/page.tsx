import AdminDocumentDetailPage from "@/modules/admin/pages/AdminDocumentDetailPage";

export default async function AdminDocumentDetailRoute({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const { id } = await params;

  return <AdminDocumentDetailPage documentId={id} />;
}
