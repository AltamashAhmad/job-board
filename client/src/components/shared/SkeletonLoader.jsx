export default function SkeletonLoader() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-1/4 bg-gray-200 rounded mb-4"></div>
      <div className="h-4 w-1/2 bg-gray-200 rounded mb-8"></div>
      
      <div className="space-y-4">
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          </div>
        ))}
      </div>
    </div>
  );
} 