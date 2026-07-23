interface Props {
  readonly content: string;
}

export function TxtPreview({ content }: Props): React.JSX.Element {
  return (
    <div
      className="
        overflow-auto
        rounded-2xl
        bg-white
        p-8
        font-mono
        text-sm
        leading-7
      "
    >
      <pre className="whitespace-pre-wrap">{content}</pre>
    </div>
  );
}
