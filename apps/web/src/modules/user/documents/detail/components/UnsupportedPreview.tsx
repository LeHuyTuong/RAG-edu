export function UnsupportedPreview(): React.JSX.Element {
  return (
    <div
      className="
        flex
        min-h-[500px]
        flex-col
        items-center
        justify-center
        gap-4
        rounded-2xl
        bg-surface
      "
    >
      <span
        className="
          material-symbols-outlined
          text-6xl
          text-outline
        "
      >
        description
      </span>

      <div className="text-center">
        <h3 className="text-lg font-semibold">Không hỗ trợ preview</h3>

        <p className="mt-2 text-sm text-on-surface-variant">
          Định dạng tài liệu hiện chưa được hỗ trợ.
        </p>
      </div>
    </div>
  );
}
