import { useQuery } from '@tanstack/react-query';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

function StatCard({ title, value, change, type = 'neutral' }) {
  const isPositive = change > 0;
  const Arrow = isPositive ? ArrowUpIcon : ArrowDownIcon;
  const colors = {
    success: 'bg-green-50 text-green-700',
    danger: 'bg-red-50 text-red-700',
    neutral: 'bg-blue-50 text-blue-700'
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
        {change !== undefined && (
          <div className="mt-4">
            <div className={`flex items-center text-sm ${colors[type]}`}>
              <Arrow className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="font-medium">{Math.abs(change)}% from last import</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SourceStats({ data }) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Source Distribution</h3>
        <div className="mt-5">
          <div className="flow-root">
            <ul className="-mb-8">
              {data.map((item, itemIdx) => (
                <li key={item.source}>
                  <div className="relative pb-8">
                    {itemIdx !== data.length - 1 ? (
                      <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex items-center space-x-3">
                      <div>
                        <span className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                          <span className="text-sm text-white font-medium">{item.percentage}%</span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div>
                          <p className="text-sm text-gray-500">
                            {item.source}
                          </p>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {item.totalJobs} jobs
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentActivity({ data }) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
        <div className="mt-5">
          <div className="flow-root">
            <ul className="-mb-8">
              {data.map((activity, activityIdx) => (
                <li key={activity._id}>
                  <div className="relative pb-8">
                    {activityIdx !== data.length - 1 ? (
                      <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex items-center space-x-3">
                      <div>
                        <span 
                          className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white ${
                            activity.status === 'completed' ? 'bg-green-500' :
                            activity.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                        >
                          <span className="text-sm text-white font-medium">
                            {activity.status === 'completed' ? '✓' : 
                             activity.status === 'failed' ? '✕' : '⟳'}
                          </span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div>
                          <p className="text-sm text-gray-500">
                            {activity.source} - {activity.totalFetched} jobs
                          </p>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/jobs/dashboard').then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard data</h3>
            <div className="mt-2 text-sm text-red-700">
              {error.message || 'An unexpected error occurred'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { stats, sourceStats, recentActivity } = dashboardData || {};

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Overview of job import statistics and recent activity
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard 
          title="Total Jobs" 
          value={stats?.totalJobs || 0}
          change={stats?.jobsGrowth}
          type="neutral"
        />
        <StatCard 
          title="Success Rate" 
          value={`${stats?.successRate || 0}%`}
          change={stats?.successRateChange}
          type="success"
        />
        <StatCard 
          title="Failed Jobs" 
          value={stats?.failedJobs || 0}
          change={stats?.failureRateChange}
          type="danger"
        />
        <StatCard 
          title="Active Sources" 
          value={stats?.activeSources || 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SourceStats data={sourceStats || []} />
        <RecentActivity data={recentActivity || []} />
      </div>
    </div>
  );
} 