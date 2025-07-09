import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';
import SkeletonLoader from '../components/shared/SkeletonLoader';

const statusIcons = {
  completed: CheckCircleIcon,
  failed: XCircleIcon,
  in_progress: ClockIcon,
};

const statusColors = {
  completed: 'text-green-400 bg-green-400/10 ring-green-400/20',
  failed: 'text-red-400 bg-red-400/10 ring-red-400/20',
  in_progress: 'text-blue-400 bg-blue-400/10 ring-blue-400/20',
};

export default function ImportHistory() {
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: importLogs, isLoading, error } = useQuery({
    queryKey: ['importLogs', currentPage],
    queryFn: () => api.get(`/api/imports?page=${currentPage}`).then(res => res.data),
  });

  function formatDate(dateString) {
    return format(new Date(dateString), 'MMM d, yyyy HH:mm');
  }

  if (isLoading) {
    return (
      <div className="animate-fadeIn">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Import History</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all job imports including their status, source, and metrics.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mt-4 animate-fadeIn">
        <div className="flex">
          <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading import history</h3>
            <div className="mt-2 text-sm text-red-700">
              {error.message || 'An unexpected error occurred'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Early return if no data
  if (!importLogs?.imports) {
    return (
      <div className="text-center py-12 animate-fadeIn">
        <p className="text-gray-500">No import history available</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Import History</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all job imports including their status, source, and metrics.
          </p>
        </div>
      </div>
      
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Source
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Total Jobs
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      New Records
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Updated
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Failed
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {importLogs.imports.map((log) => {
                    const StatusIcon = statusIcons[log.status] || ClockIcon;
                    return (
                      <tr key={log._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {log.source}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.totalFetched || 0}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.newJobs || 0}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.updatedJobs || 0}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.failedJobs || 0}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span 
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[log.status]} transition-all duration-150`}
                          >
                            <StatusIcon className="mr-1 h-4 w-4" />
                            {log.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(log.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {importLogs.pagination?.pages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(page => Math.min(importLogs.pagination.pages, page + 1))}
              disabled={currentPage === importLogs.pagination.pages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{importLogs.pagination.pages}</span>
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(page => Math.min(importLogs.pagination.pages, page + 1))}
                  disabled={currentPage === importLogs.pagination.pages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 