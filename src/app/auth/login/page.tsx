"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";

const LoginPage = () => {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const validateEmail = (email: string) => {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
    };

    const validatePassword = (password: string) => {
        return password.length >= 6;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!validateEmail(email)) {
            setError("Invalid email format");
            return;
        }

        if (!validatePassword(password)) {
            setError("Password must be at least 6 characters long");
            return;
        }

        setIsLoading(true);

        try {
            await login(email, password);
            setIsLoading(false);
            setSuccess("Login successful! Redirecting...");
            setTimeout(() => router.push("/dashboard"), 2000);
        } catch (err) {
            setError("Login failed, please try again");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded shadow-md w-full max-w-md"
            >
                <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

                <div className="mb-4">
                    <label className="block text-gray-700">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded mt-1"
                        disabled={isLoading}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded mt-1"
                        disabled={isLoading}
                        required
                    />
                </div>

                <div className="mb-4 flex items-center">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        className="mr-2"
                        disabled={isLoading}
                    />
                    <label className="text-gray-700">Remember me</label>
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white p-2 rounded mt-4 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 disabled:bg-blue-300"
                    disabled={isLoading}
                >
                    {isLoading ? "Logging in..." : "Log in"}
                </button>

                {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
                {success && (
                    <p className="mt-4 text-green-500 text-sm">{success}</p>
                )}

                <div className="flex justify-between mt-4">
                    <Link
                        href="/forgot-password"
                        className="text-blue-500 text-sm hover:underline"
                    >
                        Forgot password?
                    </Link>
                    <Link
                        href="/register"
                        className="text-blue-500 text-sm hover:underline"
                    >
                        Register
                    </Link>
                </div>

                <div className="mt-6 flex justify-center">
                    <button
                        type="button"
                        className="flex items-center bg-red-100 text-gray-700 rounded shadow p-2 hover:bg-red-200"
                        disabled={isLoading}
                    >
                        <FcGoogle className="mr-2" /> Sign in with Google
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LoginPage;
