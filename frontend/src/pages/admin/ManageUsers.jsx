// ManageUsers.jsx
import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Search, Edit, UserCheck, UserX, AlertCircle, Users, Eye, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';
import AdminPageSkeleton from '../../components/admin/AdminPageSkeleton';

export const ManageUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);
  // View user modal
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewUser, setViewUser] = useState(null);

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/admin/users');
      const usersData = response.data.data || [];
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      console.error('Error response:', error.response);
      if (error.response?.status === 403) {
        toast.error('Access denied. Admin privileges required.');
      } else if (error.response?.status === 401) {
        toast.error('Please log in as an admin.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editForm.name || !editForm.email || !editForm.role) {
      toast.error('All fields are required');
      return;
    }

    try {
      await api.put(`/api/v1/admin/users/${editingUser.id}`, editForm);
      toast.success('User updated successfully');
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleToggleUserStatus = (id) => {
    const user = users.find(u => u.id === id);
    setUserToToggle(user);
    setConfirmDialogOpen(true);
  };

  const handleViewUser = (user) => {
    setViewUser(user);
    setViewDialogOpen(true);
  };

  const confirmToggleUserStatus = async () => {
    if (!userToToggle) return;

    try {
      const response = await api.patch(`/api/v1/admin/users/${userToToggle.id}/toggle-status`);
      toast.success(response.data.message);
      fetchUsers();
      setConfirmDialogOpen(false);
      setUserToToggle(null);
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error(error.response?.data?.message || 'Failed to toggle user status');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const usersPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'border-blue-200 bg-blue-50 text-blue-700',
      clinician: 'border-cyan-200 bg-cyan-50 text-cyan-700',
      patient: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      default: 'border-slate-200 bg-slate-100 text-slate-700'
    };
    return colors[role] || colors.default;
  };

  if (loading) {
    return <AdminPageSkeleton variant="table" rows={5} />;
  }

  return (
    <div className="min-h-screen space-y-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-4 hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm md:flex md:items-center md:justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
            <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
            Identity management panel
          </div>
          <p className="text-xs text-slate-500">Review account access and status quickly</p>
        </div>

        <div className="relative mb-6 overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 p-5 text-white shadow-lg">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 left-20 h-36 w-36 rounded-full bg-cyan-300/20 blur-2xl" />
          <h2 className="text-2xl font-semibold">Manage Users</h2>
          <p className="max-w-2xl text-sm text-cyan-100/90">Manage account roles, activation status, and user details with a cleaner and more focused admin workspace.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-4">
          <Card className="border-slate-200/80 bg-white/95 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Users</p>
                  <p className="text-3xl font-bold text-slate-900">{users.length}</p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/95 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Patients</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {users.filter(u => u.role === 'patient').length}
                  </p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/95 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Clinicians</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {users.filter(u => u.role === 'clinician').length}
                  </p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50">
                  <Users className="h-5 w-5 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/95 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Admins</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50">
                  <Users className="h-5 w-5 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="border-slate-200/80 bg-white/95 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-slate-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 border-slate-200 bg-white pl-10 text-sm focus:border-cyan-500 focus:ring-cyan-500"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="mb-4 h-12 w-12 text-slate-300" />
                <p className="text-lg font-medium text-slate-900">No users found</p>
                <p className="text-slate-500">Try adjusting your search query</p>
              </div>
            ) : (
              <div className="px-3 py-3">
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/40 p-3">
                  <div className="mb-2 hidden px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 md:grid md:grid-cols-[minmax(0,2.6fr)_120px_120px_110px_130px] md:gap-3">
                    <span className="text-left">User</span>
                    <span className="text-center">Role</span>
                    <span className="text-center">Status</span>
                    <span className="text-center">Joined</span>
                    <span className="text-center">Actions</span>
                  </div>

                  <div className="space-y-2">
                    {paginatedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-3 transition-all hover:border-cyan-200 hover:shadow-sm md:grid-cols-[minmax(0,2.6fr)_120px_120px_110px_130px] md:items-center"
                      >
                        <div className="col-span-2 mb-2 md:col-span-1 md:mb-0 md:justify-self-start">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 md:hidden">User</p>
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-600">
                              {(user.name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">{user.name}</p>
                              <p className="truncate text-sm text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-0 rounded-lg bg-slate-50 p-2 text-center md:mb-0 md:justify-self-center md:rounded-none md:bg-transparent md:p-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 md:hidden">Role</p>
                          <Badge className={`${getRoleBadgeColor(user.role)} rounded-full border px-2.5 py-0.5 text-xs capitalize md:mx-auto`}>
                            {user.role}
                          </Badge>
                        </div>

                        <div className="mb-0 rounded-lg bg-slate-50 p-2 text-center md:mb-0 md:justify-self-center md:rounded-none md:bg-transparent md:p-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 md:hidden">Status</p>
                          <Badge className={user.is_active ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700 capitalize md:mx-auto" : "rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs text-rose-700 capitalize md:mx-auto"}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        <div className="mb-0 rounded-lg bg-slate-50 p-2 text-center md:mb-0 md:justify-self-center md:rounded-none md:bg-transparent md:p-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 md:hidden">Joined</p>
                          <p className="text-sm text-slate-600">{new Date(user.created_at).toLocaleDateString()}</p>
                        </div>

                        <div className="col-span-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-50 p-2 md:col-span-1 md:justify-self-center md:rounded-none md:bg-transparent md:p-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewUser(user)}
                            className="h-8 w-8 rounded-lg p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            className="h-8 w-8 rounded-lg p-0 text-cyan-700 hover:bg-cyan-100"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleUserStatus(user.id)}
                            className={user.is_active ? "h-8 w-8 rounded-lg p-0 text-rose-700 hover:bg-rose-100" : "h-8 w-8 rounded-lg p-0 text-emerald-700 hover:bg-emerald-100"}
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {user.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {filteredUsers.length > 0 && (
                  <div className="mt-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                      Showing {startIndex + 1}-{Math.min(startIndex + usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="h-8 border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      >
                        <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                        Previous
                      </Button>
                      <span className="text-xs text-slate-500">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      >
                        Next
                        <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-[#01377D]">Edit User</DialogTitle>
              <DialogDescription className="text-[#009DD1]">
                Update user account information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-[#01377D] font-semibold">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="John Doe"
                  className="border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-[#01377D] font-semibold">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="john@example.com"
                  className="border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role" className="text-[#01377D] font-semibold">Role</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                  <SelectTrigger className="border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="clinician">Clinician</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                  className="border-[#97E7F5] text-[#01377D] hover:bg-[#97E7F5]/20"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateUser}
                  className="bg-[#26B170] hover:bg-[#7ED348] text-white"
                >
                  Update User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-[#01377D]">
                {userToToggle?.is_active ? 'Deactivate User' : 'Activate User'}
              </DialogTitle>
              <DialogDescription className="text-[#009DD1]">
                Are you sure you want to {userToToggle?.is_active ? 'deactivate' : 'activate'} the user "{userToToggle?.name}"?
                {userToToggle?.is_active ? 
                  ' This will prevent them from logging into the system.' : 
                  ' This will allow them to log back into the system.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setConfirmDialogOpen(false);
                  setUserToToggle(null);
                }}
                className="border-[#97E7F5] text-[#01377D] hover:bg-[#97E7F5]/20"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmToggleUserStatus}
                className={userToToggle?.is_active ? 
                  "bg-red-600 hover:bg-red-700 text-white" : 
                  "bg-[#26B170] hover:bg-[#7ED348] text-white"
                }
              >
                {userToToggle?.is_active ? 'Deactivate' : 'Activate'} User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {/* View User Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="bg-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#01377D]">User Information</DialogTitle>
              <DialogDescription className="text-[#009DD1]">Read-only details for the selected user</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-sm text-[#01377D]">Full Name</Label>
                <div className="text-[#01377D]">{viewUser?.name || '-'}</div>
              </div>
              <div>
                <Label className="text-sm text-[#01377D]">Email</Label>
                <div className="text-[#009DD1]">{viewUser?.email || '-'}</div>
              </div>
              <div>
                <Label className="text-sm text-[#01377D]">Phone</Label>
                <div className="text-[#01377D]">{viewUser?.phone || viewUser?.patient?.phone || '-'}</div>
              </div>
              <div>
                <Label className="text-sm text-[#01377D]">Program</Label>
                <div className="text-[#01377D]">{viewUser?.patient?.program || '-'}</div>
              </div>
              <div>
                <Label className="text-sm text-[#01377D]">Student Number</Label>
                <div className="text-[#01377D]">{viewUser?.patient?.student_number || '-'}</div>
              </div>
              <div>
                <Label className="text-sm text-[#01377D]">Date of Birth</Label>
                <div className="text-[#01377D]">{viewUser?.patient?.date_of_birth ? new Date(viewUser.patient.date_of_birth).toLocaleDateString() : '-'}</div>
              </div>
              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => { setViewDialogOpen(false); setViewUser(null); }} className="border-[#97E7F5] text-[#01377D]">Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ManageUsers;