export default function MessageSkeleton() {
  return (
    <div className="flex-1 p-4 space-y-4 overflow-hidden">
      {[false,true,false,false,true,true].map((mine, i) => (
        <div key={i} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}
          style={{ animationDelay: `${i * 80}ms` }}>
          <div className="w-6 h-6 bg-base-300 animate-pulse shrink-0" />
          <div className={`h-8 bg-base-300 animate-pulse ${mine ? "w-36" : "w-44"}`} style={{ borderRadius: "2px" }} />
        </div>
      ))}
    </div>
  );
}
