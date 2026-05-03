export default function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div
        className="h-8 w-8 rounded-full border-2 border-t-transparent"
        style={{
          borderColor: "var(--rule)",
          borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite",
        }}
      />
    </div>
  );
}
