export default function SidebarSkeleton() {
  return (
    <aside className="h-full w-16 lg:w-72 border-r-2 border-base-content/10 flex flex-col bg-base-100">
      <div className="border-b-2 border-base-content/10 flex">
        {[1,2,3].map(i => <div key={i} className="flex-1 h-12 animate-pulse bg-base-200/60" />)}
      </div>
      <div className="flex-1 p-2 space-y-2">
        {Array(7).fill(0).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="w-9 h-9 bg-base-300 shrink-0" />
            <div className="flex-1 hidden lg:block space-y-1.5">
              <div className="h-2.5 bg-base-300 rounded w-3/4" />
              <div className="h-2 bg-base-300 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
