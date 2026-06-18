import ModeratorDocumentDetailPage from "@/modules/moderator/pages/ModeratorDocumentDetailPage";

export default async function DocumentReviewDetailRoute({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const { id } = await params;

  return <ModeratorDocumentDetailPage documentId={id} />;
}
