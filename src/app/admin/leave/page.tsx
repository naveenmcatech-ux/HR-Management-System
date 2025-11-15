// app/admin/leave/page.tsx
'use client';
import { useEffect, useState } from 'react';
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface LeaveRequest {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

interface LeaveStats {
  totalRequests: number;
  pendingRequests: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  leaveBalance: {
    sick: number;
    casual: number;
    earned: number;
  };
}

export default function LeaveManagement() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState<LeaveStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedThisMonth: 0,
    rejectedThisMonth: 0,
    leaveBalance: { sick: 0, casual: 0, earned: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [view, setView] = useState<'requests' | 'calendar'>('requests');

  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveStats();
  }, [statusFilter, typeFilter, dateFilter]);

  const fetchLeaveRequests = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const params = new URLSearchParams({
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(dateFilter && { date: dateFilter }),
      });

      const response = await fetch(`/api/admin/leave?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data.leaveRequests);
      }
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveStats = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/admin/leave/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch leave stats:', error);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm('Are you sure you want to approve this leave request?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/admin/leave/${requestId}/approve`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchLeaveRequests();
        fetchLeaveStats();
        alert('Leave request approved successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to approve leave request');
      }
    } catch (error) {
      console.error('Failed to approve leave request:', error);
      alert('Failed to approve leave request');
    }
  };

  const handleReject = async (requestId: string, reason?: string) => {
    const rejectReason = prompt('Please enter rejection reason:', 'Business requirements');
    if (rejectReason === null) return;

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/admin/leave/${requestId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (response.ok) {
        fetchLeaveRequests();
        fetchLeaveStats();
        alert('Leave request rejected successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to reject leave request');
      }
    } catch (error) {
      console.error('Failed to reject leave request:', error);
      alert('Failed to reject leave request');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sick':
        return 'bg-blue-100 text-blue-800';
      case 'casual':
        return 'bg-purple-100 text-purple-800';
      case 'earned':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = leaveRequests.filter(request =>
    request.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage employee leave requests and approvals
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setView('requests')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              view === 'requests'
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Leave Requests
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              view === 'calendar'
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Calendar View
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalRequests}</p>
            </div>
            <ClockIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.pendingRequests}</p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved (Month)</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.approvedThisMonth}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected (Month)</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.rejectedThisMonth}</p>
            </div>
            <XCircleIcon className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Leave Balance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Leave Balance Overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.leaveBalance.sick}</div>
            <div className="text-sm text-gray-600">Sick Leave Days</div>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.leaveBalance.casual}</div>
            <div className="text-sm text-gray-600">Casual Leave Days</div>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.leaveBalance.earned}</div>
            <div className="text-sm text-gray-600">Earned Leave Days</div>
          </div>
        </div>
      </div>

      {view === 'requests' ? (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Types</option>
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="earned">Earned Leave</option>
                <option value="maternity">Maternity Leave</option>
                <option value="paternity">Paternity Leave</option>
              </select>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <input
                  type="month"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Leave Requests Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Range
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {request.firstName[0]}{request.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {request.firstName} {request.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.departmentName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLeaveTypeColor(request.leaveType)}`}>
                          {request.leaveType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {new Date(request.startDate).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500">to</div>
                        <div>
                          {new Date(request.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.days} day{request.days > 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {request.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(request.status)}
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(request.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Approve"
                              >
                                <CheckCircleIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleReject(request.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Reject"
                              >
                                <XCircleIcon className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRequests.length === 0 && (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No leave requests found
                </h3>
                <p className="text-gray-600">
                  {searchQuery || statusFilter || typeFilter || dateFilter
                    ? 'Try adjusting your search criteria'
                    : 'No leave requests available'}
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Calendar View */
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Leave Calendar</h2>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, i) => {
              const date = new Date();
              date.setDate(i - date.getDay() + 1);
              const dateStr = date.toISOString().split('T')[0];
              const dayLeaves = leaveRequests.filter(req => 
                req.status === 'approved' &&
                dateStr >= req.startDate.split('T')[0] &&
                dateStr <= req.endDate.split('T')[0]
              );

              return (
                <div
                  key={i}
                  className={`min-h-24 p-2 border border-gray-200 rounded ${
                    date.getMonth() === new Date().getMonth() ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayLeaves.slice(0, 2).map(leave => (
                      <div
                        key={leave.id}
                        className="text-xs p-1 rounded bg-blue-100 text-blue-800 truncate"
                        title={`${leave.firstName} ${leave.lastName} - ${leave.leaveType}`}
                      >
                        {leave.firstName[0]}{leave.lastName[0]} - {leave.leaveType}
                      </div>
                    ))}
                    {dayLeaves.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayLeaves.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leave Request Details Modal */}
      {selectedRequest && (
        <LeaveDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}

// Leave Details Modal Component
function LeaveDetailsModal({ request, onClose, onApprove, onReject }: {
  request: LeaveRequest;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Leave Request Details</h2>
        
        <div className="space-y-4">
          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee</label>
              <p className="mt-1 text-sm text-gray-900">
                {request.firstName} {request.lastName}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <p className="mt-1 text-sm text-gray-900">{request.departmentName}</p>
            </div>
          </div>

          {/* Leave Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Leave Type</label>
              <p className="mt-1 text-sm text-gray-900">{request.leaveType}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration</label>
              <p className="mt-1 text-sm text-gray-900">{request.days} day{request.days > 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(request.startDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(request.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Reason</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
              {request.reason}
            </p>
          </div>

          {/* Status and Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <p className="mt-1 text-sm">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  request.status === 'approved' ? 'bg-green-100 text-green-800' :
                  request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {request.status.toUpperCase()}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Applied On</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {request.approvedBy && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Approved By</label>
                <p className="mt-1 text-sm text-gray-900">{request.approvedBy}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Approved At</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(request.approvedAt!).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {request.status === 'pending' && (
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => onReject(request.id)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Reject
            </button>
            <button
              onClick={() => onApprove(request.id)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Approve
            </button>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}