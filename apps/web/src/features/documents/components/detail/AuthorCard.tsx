import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Author {
  readonly name: string;
  readonly email: string;
  readonly avatarUrl: string | null;
}

interface Props {
  readonly author: Author;
}

/**
 * Sidebar card showing the document author's profile.
 * Uses the Cloudinary avatarUrl when available; falls back to an
 * initial-based avatar (first character of the author's name).
 */
export function AuthorCard({ author }: Props): React.JSX.Element {
  const avatarContent = author.avatarUrl ? (
    <img
      src={author.avatarUrl}
      alt={author.name}
      className="h-full w-full rounded-full object-cover"
    />
  ) : (
    <span className="text-lg font-bold text-white">
      {author.name.charAt(0).toUpperCase()}
    </span>
  );

  return (
    <Card className="space-y-4 p-5">
      {/* Avatar + name row */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary">
          {avatarContent}
        </div>
        <div>
          <h3 className="font-semibold text-on-surface">{author.name}</h3>
          <p className="text-sm text-on-surface-variant">{author.email}</p>
        </div>
      </div>

      {/* Static motivational quote — placeholder until the API exposes a bio field */}
      <blockquote className="border-l-2 border-primary pl-3 text-sm italic text-on-surface-variant">
        "Chia sẻ kiến thức là cách tốt nhất để học tập."
      </blockquote>

      <Button variant="outline" className="w-full" type="button">
        Theo dõi tác giả
      </Button>
    </Card>
  );
}
