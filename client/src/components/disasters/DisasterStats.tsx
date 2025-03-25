import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DisasterStats as DisasterStatsType } from '@/lib/types';
import { getDisasterStats } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

const DisasterStats = () => {
  const { data, isLoading, refetch } = useQuery<DisasterStatsType>({
    queryKey: ['/api/disasters/stats'],
    queryFn: () => getDisasterStats(),
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Current Statistics</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => refetch()}
        >
          <span className="material-icons text-primary">refresh</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {isLoading ? (
          // Skeleton loaders
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-12" />
              </div>
            ))}
          </>
        ) : (
          // Actual data 
          <>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <p className="text-sm text-gray-500 dark:text-gray-400">Warnings</p>
              <p className="text-2xl font-semibold text-red-500">{data?.warnings || 0}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <p className="text-sm text-gray-500 dark:text-gray-400">Watches</p>
              <p className="text-2xl font-semibold text-amber-500">{data?.watches || 0}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <p className="text-sm text-gray-500 dark:text-gray-400">Advisories</p>
              <p className="text-2xl font-semibold text-green-500">{data?.advisories || 0}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <p className="text-sm text-gray-500 dark:text-gray-400">Affected Areas</p>
              <p className="text-2xl font-semibold text-blue-500">{data?.affectedAreas || 0}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DisasterStats;
