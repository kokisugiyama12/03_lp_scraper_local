export default function Header() {
  return (
    <header
      className="sticky top-0 z-50 border-b px-4 py-3"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--rule)",
      }}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ background: "var(--accent)" }}
        >
          T
        </div>
        <div>
          <h1 className="text-base font-bold" style={{ color: "var(--ink)" }}>
            テレアポリスト生成ツール
          </h1>
          <p className="text-xs" style={{ color: "var(--ink-3)" }}>
            リスティング広告から営業リストを自動作成
          </p>
        </div>
      </div>
    </header>
  );
}
