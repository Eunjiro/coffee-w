"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Shield,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";

import AdminLayout from "../components/AdminLayout";
import UserModal from "../components/modals/UserModal";
import PageHeader from "../components/ui/PageHeader";
import SearchAndFilters from "../components/ui/SearchAndFilters";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/Table";
import { Button } from "@/components/ui/button";

interface User {
  id: number;
  email: string;
  username?: string;
  name: string;
  role: "admin" | "cashier";
  status: "active" | "inactive";
  phone: string;
  createdAt: string;
  hireDate: string;
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  void loading;

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/user");
      const data = await res.json();
      setUsers(data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (payload: {
    email: string;
    username: string;
    password?: string;
    name: string;
    role: "admin" | "cashier" | "barista";
    status: "active" | "inactive";
    phone?: string;
    hireDate?: string;
  }) => {
    try {
      const method = editingUser ? "PUT" : "POST";
      const url = editingUser ? `/api/admin/user/${editingUser.id}` : "/api/admin/user";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save user");
      toast.success(editingUser ? "User updated" : "User created");

      setOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch {
      toast.error("Error saving user");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/admin/user/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      toast.success("User deleted");
      fetchUsers();
    } catch {
      toast.error("Error deleting user");
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setOpen(true);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const updatedStatus = user.status === "active" ? "inactive" : "active";
      const res = await fetch(`/api/admin/user/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...user, status: updatedStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success(`User ${updatedStatus}`);
      fetchUsers();
    } catch {
      toast.error("Error updating status");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (status === "loading") return <p>Loading session...</p>;
  if (!session || session.user.role !== "ADMIN") {
    router.push("/unauthorized");
    return null;
  }

  const getStatusBadge = (status: string) =>
    status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-700";
      case "cashier":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <AdminLayout>
      <div className="bg-[#F3EEEA] p-8 h-full overflow-y-auto custom-scrollbar">
        <PageHeader
          title="User Management"
          description="Manage users, roles, and permissions for your coffee shop"
          actions={
            <Button onClick={() => { setEditingUser(null); setOpen(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> Add User
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className="gap-6 grid grid-cols-1 md:grid-cols-4 mb-8">
          <div className="bg-white shadow-sm p-6 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-[#776B5D]/70 text-sm">Total Users</p>
                <p className="font-bold text-[#776B5D] text-2xl">{users.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white shadow-sm p-6 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-[#776B5D]/70 text-sm">Active Users</p>
                <p className="font-bold text-[#776B5D] text-2xl">
                  {users.filter((u) => u.status === "active").length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white shadow-sm p-6 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-[#776B5D]/70 text-sm">Admins</p>
                <p className="font-bold text-[#776B5D] text-2xl">
                  {users.filter((u) => u.role === "admin").length}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white shadow-sm p-6 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-[#776B5D]/70 text-sm">Staff</p>
                <p className="font-bold text-[#776B5D] text-2xl">
                  {users.filter((u) => u.role !== "admin").length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <SearchAndFilters
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by name or email..."
          filters={
            <>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-[#B0A695] focus:ring-2 focus:ring-[#776B5D] rounded-lg"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="cashier">Cashier</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-[#B0A695] focus:ring-2 focus:ring-[#776B5D] rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </>
          }
        />

        {/* Users Table */}
        <Table>
          <TableHeader>
            <tr>
              <TableCell header>User</TableCell>
              <TableCell header>Role</TableCell>
              <TableCell header>Status</TableCell>
              <TableCell header>Contact</TableCell>
              <TableCell header>Hire Date</TableCell>
              <TableCell header>Actions</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center">
                    <div className="flex justify-center items-center bg-[#776B5D] rounded-full w-10 h-10 font-semibold text-white">
                      {user.name[0]}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-[#776B5D]">{user.name}</p>
                      <p className="text-[#776B5D]/70 text-sm">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}
                  >
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                      user.status
                    )}`}
                  >
                    {user.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {user.phone && (
                      <div className="flex items-center text-[#776B5D] text-sm">
                        <Phone className="mr-1 w-3 h-3" />
                        {user.phone}
                      </div>
                    )}
                    <div className="flex items-center text-[#776B5D] text-sm">
                      <Mail className="mr-1 w-3 h-3" />
                      {user.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-1 w-3 h-3" />
                    {user.hireDate ? format(new Date(user.hireDate), "MMM dd, yyyy") : "—"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="relative">
                    <button
                      onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                      className="hover:bg-[#F3EEEA] p-2 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-[#776B5D]" />
                    </button>

                    {selectedUser === user.id && (
                      <div className="absolute right-0 top-8 z-10 bg-white shadow-lg border border-[#B0A695]/20 rounded-lg min-w-32">
                        <button
                          onClick={() => {
                            handleEdit(user);
                            setSelectedUser(null);
                          }}
                          className="flex items-center hover:bg-[#F3EEEA] px-4 py-2 w-full text-[#776B5D] text-sm text-left"
                        >
                          <Edit className="mr-2 w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            handleToggleStatus(user);
                            setSelectedUser(null);
                          }}
                          className="flex items-center hover:bg-[#F3EEEA] px-4 py-2 w-full text-[#776B5D] text-sm text-left"
                        >
                          {user.status === "active" ? (
                            <>
                              <UserX className="mr-2 w-3 h-3" /> Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 w-3 h-3" /> Activate
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(user.id);
                            setSelectedUser(null);
                          }}
                          className="flex items-center hover:bg-red-50 px-4 py-2 w-full text-red-600 text-sm text-left"
                        >
                          <Trash2 className="mr-2 w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center">
            <Users className="mx-auto mb-4 w-12 h-12 text-[#776B5D]/30" />
            <p className="text-[#776B5D]/70">No users found matching your criteria</p>
          </div>
        )}

        {/* User Modal */}
        <UserModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onSave={handleSave}
          editingUser={editingUser}
        />
      </div>
    </AdminLayout>
  );
}
