// app/admin/layout.tsx
'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import {
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  ClockIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  FolderIcon,
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon,
  BellIcon,
  LockClosedIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/admin/dashboard', 
    icon: HomeIcon,
    description: 'Overview and statistics'
  },
  { 
    name: 'Employee Management', 
    href: '/admin/employees', 
    icon: UserGroupIcon,
    description: 'Manage employees'
  },
  { 
    name: 'Departments', 
    href: '/admin/departments', 
    icon: BuildingOfficeIcon,
    description: 'Manage departments',
    badge: 'New'
  },
  { 
    name: 'Attendance', 
    href: '/admin/attendance', 
    icon: ClockIcon,
    description: 'Track attendance'
  },
  { 
    name: 'Leave Management', 
    href: '/admin/leave', 
    icon: CalendarIcon,
    description: 'Approve leave requests'
  },
  { 
    name: 'Payroll', 
    href: '/admin/payroll', 
    icon: CurrencyDollarIcon,
    description: 'Process payroll'
  },
  { 
    name: 'Projects', 
    href: '/admin/projects', 
    icon: FolderIcon,
    description: 'Manage projects'
  },
  { 
    name: 'Reports & Analytics', 
    href: '/admin/reports', 
    icon: ChartBarIcon,
    description: 'View reports'
  },
  { 
    name: 'Roles & Access', 
    href: '/admin/roles', 
    icon: ShieldCheckIcon,
    description: 'Manage permissions'
  },
  { 
    name: 'Communication', 
    href: '/admin/communication', 
    icon: BellIcon,
    description: 'Announcements'
  },
  { 
    name: 'Security', 
    href: '/admin/security', 
    icon: LockClosedIcon,
    description: 'Security settings'
  },
  { 
    name: 'System Settings', 
    href: '/admin/settings', 
    icon: CogIcon,
    description: 'Configure system'
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect if not admin
  if (user && user.role !== 'admin') {
    router.push('/unauthorized');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between h-16 px-4 bg-indigo-600">
              <div className="flex items-center space-x-2">
                <BuildingOfficeIcon className="w-8 h-8 text-white" />
                <span className="text-xl font-bold text-white">HRMS</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    title={item.description}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                        {item.badge}
                      </span>
                    )}
                  </a>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center">
                <UserCircleIcon className="w-10 h-10 text-gray-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user?.firstName || 'Admin'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200 shadow-sm">
          <div className="flex items-center h-16 px-4 bg-indigo-600">
            <BuildingOfficeIcon className="w-8 h-8 text-white" />
            <span className="ml-2 text-xl font-bold text-white">HRMS Admin</span>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={item.description}
                >
                  <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* User info at bottom */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center">
              <UserCircleIcon className="w-10 h-10 text-gray-400" />
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName || 'Admin'} {user?.lastName || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 lg:hidden"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
            <span>Admin</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">
              {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center ml-auto space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <BellIcon className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdown(!profileDropdown)}
                className="flex items-center space-x-2 text-sm hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
              >
                <UserCircleIcon className="w-8 h-8 text-gray-500" />
                <span className="hidden md:block font-medium text-gray-700">
                  {user?.firstName || 'Admin'}
                </span>
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              </button>

              {profileDropdown && (
                <div className="absolute right-0 w-56 mt-2 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <a
                      href="/admin/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <UserCircleIcon className="w-4 h-4 mr-2" />
                      Profile
                    </a>
                    <a
                      href="/admin/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <CogIcon className="w-4 h-4 mr-2" />
                      Settings
                    </a>
                    <a
                      href="/admin/security"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LockClosedIcon className="w-4 h-4 mr-2" />
                      Security
                    </a>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={logout}
                      className="flex items-center w-full px-4 py-2 text-sm text-left text-red-700 hover:bg-red-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
        
       
      </div>
    </div>
  );
}