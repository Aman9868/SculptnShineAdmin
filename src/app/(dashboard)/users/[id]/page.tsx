"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Loader2, Mail, Phone, Calendar, Clock, Edit2, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function UserDetailsPage() {
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get the admin's own profile to check permissions
    api.get("/users/me").then((res) => {
      setCurrentUser(res.data.data);
    }).catch(console.error);

    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/users/${userId}`);
      setUser(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load user details");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: '2-digit' });
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: '2-digit' })} ${d.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex flex-col items-center justify-center text-center">
          <ShieldAlert className="h-12 w-12 mb-4 opacity-50" />
          <h2 className="text-lg font-bold mb-2">Error Loading User</h2>
          <p className="text-sm font-medium opacity-80 mb-6">{error || "User not found"}</p>
          <Link href="/users" className="px-6 py-2.5 bg-white border border-red-200 text-red-700 rounded-xl font-bold hover:bg-red-50 transition-colors">
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  // Determine if the current admin is allowed to edit this user
  // (Either it's themselves, or the user was created by an admin)
  const isSelf = currentUser?.id === user.id;
  const canEdit = isSelf || user.isCreatedByAdmin;

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/users" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/users" className="hover:text-gold-600">User Management</Link>
            <span>›</span>
            <span className="text-gray-900 font-semibold">User Details</span>
          </div>
          <h1 className="text-3xl font-extrabold text-brandDark font-serif-luxury tracking-tight">User Details</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            View and manage user information and status.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-gold-50 text-gold-700 flex items-center justify-center text-3xl font-bold shadow-sm mb-4 overflow-hidden border-2 border-white ring-4 ring-gold-50/50">
              {user.profileImage ? (
                <img src={`http://localhost:5000${user.profileImage}`} alt={user.firstName} className="h-full w-full object-cover" />
              ) : (
                user.firstName.charAt(0) + user.lastName.charAt(0)
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{user.firstName} {user.lastName}</h2>
            <p className="text-sm font-semibold text-blue-600 mb-6">{user.role === 'ADMIN' ? 'Administrator' : 'Customer'}</p>
            
            <div className="w-full space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Status</span>
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {user.status || 'ACTIVE'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">User ID</span>
                <span className="text-gray-900 font-bold font-mono text-xs">{user.id.split('-')[0]}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Joined Date</span>
                <span className="text-gray-900 font-bold">{formatDate(user.createdAt)}</span>
              </div>
            </div>

            <div className="w-full mt-6 space-y-3">
              {canEdit ? (
                <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border-2 border-gold-500 text-gold-600 rounded-xl font-bold hover:bg-gold-50 transition-colors">
                  <Edit2 className="h-4 w-4" />
                  Edit User
                </button>
              ) : (
                <div className="w-full text-center p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-xs font-semibold text-gray-500">This user is self-registered and cannot be edited by admins.</p>
                </div>
              )}
              <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-colors">
                Reset Password
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">User Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Full Name</p>
                <p className="text-base font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Role</p>
                <p className="text-base font-semibold text-gray-900">{user.role === 'ADMIN' ? 'Administrator' : 'Customer'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Email Address</p>
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-gray-900">{user.email}</p>
                  <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">✓ Verified</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Phone Number</p>
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-gray-900">{user.phone || 'Not provided'}</p>
                  {user.phone && <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">✓ Verified</span>}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Created By</p>
                <p className="text-base font-semibold text-gray-900">
                  {user.isCreatedByAdmin ? 'System Administrator' : 'Self Registration'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Last Login</p>
                <p className="text-base font-semibold text-gray-900">{formatDateTime(user.updatedAt)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
              <button className="text-sm font-semibold text-gold-600 hover:text-gold-700 transition-colors">
                View all activity →
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Mock Activity Items */}
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 pb-6 border-b border-gray-100">
                  <div className="flex justify-between sm:items-center flex-col sm:flex-row gap-1">
                    <p className="text-sm font-semibold text-gray-900">Logged in to the system</p>
                    <p className="text-xs font-medium text-gray-500">{formatDateTime(user.updatedAt)}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-gold-50 flex items-center justify-center flex-shrink-0">
                  <Edit2 className="h-4 w-4 text-gold-600" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between sm:items-center flex-col sm:flex-row gap-1">
                    <p className="text-sm font-semibold text-gray-900">Updated profile information</p>
                    <p className="text-xs font-medium text-gray-500">{formatDate(user.createdAt)} 04:30 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
