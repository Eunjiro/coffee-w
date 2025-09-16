"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import AdminLayout from "../components/AdminLayout";
import { useSession } from "next-auth/react";

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    createdAt: string;
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
        role: "BARISTA",
    });

    // fetch all users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/user");
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // create or Update User
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
            setForm({ name: "", email: "", password: "", role: "BARISTA" });
            fetchUsers();
        } catch (err) {
            console.error(err);
            toast.error("Error saving user");
        }
    };

    // delete User
    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
            const res = await fetch(`/api/admin/user/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete user");
            toast.success("User deleted");
            fetchUsers();
        } catch (err) {
            console.error(err);
            toast.error("Error deleting user");
        }
    };

    // edit User
    const handleEdit = (user: User) => {
        setEditingUser(user);
        setForm({
            name: user.name,
            email: user.email,
            password: "", // empty password (don’t show hash)
            role: user.role,
        });
        setOpen(true);
    };

    if (status === "loading") {
        return <p>Loading session...</p>;
    }

    if (!session) {
        if (typeof window !== "undefined") {
            window.location.href = "/";
        }
        return null;
    }

    if (session.user.role !== "ADMIN") {
        if (typeof window !== "undefined") {
            window.location.href = "/unauthorized";
        }
        return null;
    }

    return (
        <AdminLayout>
            <div className="p-6">
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle className="text-xl font-semibold text-theme">User Management</CardTitle>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => { setEditingUser(null); setForm({ name: "", email: "", password: "", role: "BARISTA" }); }}>
                                    + New User
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingUser ? "Edit User" : "Create User"}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3">
                                    <Input
                                        placeholder="Name"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Email"
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    />
                                    {!editingUser && (
                                        <Input
                                            placeholder="Password"
                                            type="password"
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        />
                                    )}
                                    <Select
                                        value={form.role}
                                        onValueChange={(val) => setForm({ ...form, role: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                            <SelectItem value="BARISTA">Barista</SelectItem>
                                            <SelectItem value="CASHIER">Cashier</SelectItem>
                                        </SelectContent>    
                                    </Select>
                                    <Button onClick={handleSave} className="w-full">
                                        {editingUser ? "Update" : "Create"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-center">Loading...</p>
                        ) : (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b">
                                        <th className="p-2 text-left">ID</th>
                                        <th className="p-2 text-left">Name</th>
                                        <th className="p-2 text-left">Email</th>
                                        <th className="p-2 text-left">Role</th>
                                        <th className="p-2 text-left">Created</th>
                                        <th className="p-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id} className="border-b hover:bg-muted/30">
                                            <td className="p-2">{u.id}</td>
                                            <td className="p-2">{u.name}</td>
                                            <td className="p-2">{u.email}</td>
                                            <td className="p-2">{u.role}</td>
                                            <td className="p-2">{new Date(u.createdAt).toLocaleDateString()}</td>
                                            <td className="p-2 text-right space-x-2">
                                                <Button size="sm" variant="outline" onClick={() => handleEdit(u)}>
                                                    Edit
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleDelete(u.id)}>
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
