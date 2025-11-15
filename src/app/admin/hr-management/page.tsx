// app/admin/hr-management/page.tsx
'use client';
import { useEffect, useState } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserCircleIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface HRManager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentName: string;
  departmentId: string;
  permissions: any;
  isActive: boolean;
  createdAt: string;
}

interface Department {
  id: string;
  name: string;
}

export default function HRManagement() {
  const [hrManagers, setHrManagers] = useState<HRManager[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHR, setSelectedHR] = useState<HRManager | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    fetchHRManagers();
    fetchDepartments();
  }, []);

  const fetchHRManagers = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/admin/hr-managers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setHrManagers(data.hrManagers);
      } else {
        console.error('Failed to fetch HR managers');
      }
    } catch (error) {
      console.error('Failed to fetch HR managers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/admin/departments', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const handleDelete = async (hrId: string) => {
    if (!confirm('Are you sure you want to deactivate this HR manager?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/admin/hr-managers/${hrId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchHRManagers();
        alert('HR manager deactivated successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to deactivate HR manager');
      }
    } catch (error) {
      console.error('Failed to delete HR manager:', error);
      alert('Failed to deactivate HR manager');
    }
  };

  const handleStatusToggle = async (hrId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/admin/hr-managers/${hrId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: !currentStatus
        }),
      });

      if (response.ok) {
        fetchHRManagers();
        alert(`HR manager ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update HR manager status');
      }
    } catch (error) {
      console.error('Failed to toggle HR manager status:', error);
      alert('Failed to update HR manager status');
    }
  };

  const filteredHRs = hrManagers.filter((hr) => {
    const matchesSearch = 
      hr.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hr.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hr.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = !departmentFilter || hr.departmentId === departmentFilter;
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && hr.isActive) ||
      (statusFilter === 'inactive' && !hr.isActive);

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading HR managers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HR Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage all HR managers and their permissions
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <div className="flex bg-white rounded-lg border border-gray-300 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                viewMode === 'grid'
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                viewMode === 'table'
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Table
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add HR Manager
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search HR managers by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select 
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* HR Managers Display */}
      {viewMode === 'grid' ? (
        <HRGridDisplay 
          hrManagers={filteredHRs}
          onEdit={setSelectedHR}
          onDelete={handleDelete}
          onStatusToggle={handleStatusToggle}
        />
      ) : (
        <HRTableDisplay 
          hrManagers={filteredHRs}
          onEdit={setSelectedHR}
          onDelete={handleDelete}
          onStatusToggle={handleStatusToggle}
        />
      )}

      {filteredHRs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <UserCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No HR managers found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || departmentFilter || statusFilter
              ? 'Try adjusting your search criteria'
              : 'Get started by adding your first HR manager'}
          </p>
          {!searchQuery && !departmentFilter && !statusFilter && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add HR Manager
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <HRModal
          hrManager={null}
          departments={departments}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchHRManagers();
          }}
        />
      )}

      {selectedHR && (
        <HRModal
          hrManager={selectedHR}
          departments={departments}
          onClose={() => setSelectedHR(null)}
          onSuccess={() => {
            setSelectedHR(null);
            fetchHRManagers();
          }}
        />
      )}
    </div>
  );
}

// HR Grid Display Component
function HRGridDisplay({ hrManagers, onEdit, onDelete, onStatusToggle }: {
  hrManagers: HRManager[];
  onEdit: (hr: HRManager) => void;
  onDelete: (id: string) => void;
  onStatusToggle: (id: string, currentStatus: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {hrManagers.map((hr) => (
        <div
          key={hr.id}
          className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <UserCircleIcon className="w-12 h-12 text-gray-400" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {hr.firstName} {hr.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{hr.email}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => onEdit(hr)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(hr.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {hr.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium mr-2">Phone:</span>
                  {hr.phone}
                </div>
              )}
              
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium mr-2">Department:</span>
                {hr.departmentName || 'Not assigned'}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <button
                  onClick={() => onStatusToggle(hr.id, hr.isActive)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    hr.isActive ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      hr.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Joined {new Date(hr.createdAt).toLocaleDateString()}
              </span>
              <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                View Permissions →
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// HR Table Display Component
function HRTableDisplay({ hrManagers, onEdit, onDelete, onStatusToggle }: {
  hrManagers: HRManager[];
  onEdit: (hr: HRManager) => void;
  onDelete: (id: string) => void;
  onStatusToggle: (id: string, currentStatus: boolean) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                HR Manager
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Join Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {hrManagers.map((hr) => (
              <tr key={hr.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <UserCircleIcon className="w-8 h-8 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {hr.firstName} {hr.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {hr.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {hr.phone || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {hr.departmentName || 'Not assigned'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onStatusToggle(hr.id, hr.isActive)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      hr.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {hr.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(hr.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(hr)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(hr.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// HR Modal Component
function HRModal({ hrManager, departments, onClose, onSuccess }: {
  hrManager: HRManager | null;
  departments: Department[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    firstName: hrManager?.firstName || '',
    lastName: hrManager?.lastName || '',
    email: hrManager?.email || '',
    phone: hrManager?.phone || '',
    departmentId: hrManager?.departmentId || '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!hrManager && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (!hrManager && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!hrManager && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.departmentId) {
      newErrors.departmentId = 'Department is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('auth-token');
      const url = hrManager 
        ? `/api/admin/hr-managers/${hrManager.id}`
        : '/api/admin/hr-managers';
      
      const method = hrManager ? 'PUT' : 'POST';

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        departmentId: formData.departmentId,
        ...(!hrManager && { password: formData.password }),
        permissions: {
          employeeManagement: true,
          attendanceManagement: true,
          leaveManagement: true,
          payrollView: true,
        }
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSuccess();
        alert(hrManager ? 'HR manager updated successfully' : 'HR manager added successfully');
      } else {
        const error = await response.json();
        setErrors({ submit: error.error || 'Failed to save HR manager' });
      }
    } catch (error) {
      console.error('Failed to save HR manager:', error);
      setErrors({ submit: 'Failed to save HR manager' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {hrManager ? 'Edit HR Manager' : 'Add HR Manager'}
        </h2>
        
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {!hrManager && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department *
            </label>
            <select
              required
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.departmentId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {errors.departmentId && (
              <p className="mt-1 text-sm text-red-600">{errors.departmentId}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : hrManager ? 'Update HR Manager' : 'Add HR Manager'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}