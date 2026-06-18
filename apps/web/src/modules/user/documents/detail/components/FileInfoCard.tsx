import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatFileSize } from "@/utils";

interface Props {
  /** File extension as returned by the API (e.g. "pdf", "docx") */
  readonly format: string;
  /** Raw file size in bytes from the API */
  readonly sizeInBytes: number;
}

/**
 * Sidebar card showing technical metadata about the document file.
 *
 * Note: page count and language are not returned by the current API.
 * Those rows are intentionally omitted rather than shown as "—" to keep
 * the UI honest about what data is actually available.
 */
export function FileInfoCard({
  format,
  sizeInBytes,
}: Props): React.JSX.Element {
  return (
    <Card className="p-5">
      <h3 className="mb-5 text-lg font-semibold">Thông tin tệp</h3>

      <div className="space-y-4 text-sm">
        {/* Format badge */}
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant">Định dạng</span>
          <Badge tone="neutral" className="uppercase">
            {format}
          </Badge>
        </div>

        {/* Human-readable file size (formatFileSize converts bytes → KB/MB/GB) */}
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant">Dung lượng</span>
          <span className="font-medium">{formatFileSize(sizeInBytes)}</span>
        </div>
      </div>
    </Card>
  );
}
