// Add the "use client" directive at the top to mark the file as a client component
"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/Table";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { format } from "date-fns";
import AdminLayout from "../components/AdminLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import UserModal from "../components/modals/UserModal";

interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "cashier" | "barista";  // Ensure these match exactly with UserType
  status: "active" | "inactive"; // Ensure these match exactly with UserType
  phone: string;
  createdAt: string;
  hireDate: string; // Ensure hireDate is part of the User interface
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "barista" as "admin" | "cashier" | "barista",
    phone: "",
    hireDate: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const router = useRouter();

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
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const method = editingUser ? "PUT" : "POST";
      const url = editingUser ? `/api/admin/user/${editingUser.id}` : "/api/admin/user";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save user");
      toast.success(editingUser ? "User updated" : "User created");

      setOpen(false);
      setEditingUser(null);
      setForm({ name: "", email: "", password: "", role: "barista", phone: "", hireDate: "" });
      fetchUsers();
    } catch (err) {
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
    } catch (err) {
      toast.error("Error deleting user");
    }
  };

  const handleEdit = (user: User) => {
    // Ensure hireDate is set when editing a user
    setEditingUser({ ...user, hireDate: user.hireDate || new Date().toISOString() }); // Provide a default if missing
    setForm({
      name: user.name,
      email: user.email,
      password: "", // Don't show password if editing
      role: user.role,
      phone: user.phone,
      hireDate: user.hireDate, // Set hireDate here
    });
    setOpen(true);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (status === "loading") {
    return <p>Loading session...</p>;
  }

  if (!session || session.user.role !== "ADMIN") {
    router.push("/unauthorized");
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <Button className="mb-4" onClick={() => setOpen(true)}>
          + New User
        </Button>

        {/* Filters */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search Users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-[#B0A695] focus:ring-[#776B5D] rounded-lg focus:outline-none"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Role Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="barista">Barista</SelectItem>
              <SelectItem value="cashier">Cashier</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <Table>
          <TableHeader>
            <tr>
              <TableCell header>User</TableCell>
              <TableCell header>Role</TableCell>
              <TableCell header>Status</TableCell>
              <TableCell header>Contact</TableCell>
              <TableCell header>Created</TableCell>
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
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.status}</TableCell>
                <TableCell>
                  <div>{user.phone}</div>
                  <div>{user.email}</div>
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button onClick={() => handleEdit(user)}>Edit</Button>
                  <Button onClick={() => handleDelete(user.id)} variant="destructive">
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        editingUser={editingUser}
      />
    </AdminLayout>
  );
}
