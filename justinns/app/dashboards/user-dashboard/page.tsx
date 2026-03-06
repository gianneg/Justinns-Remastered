"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function UserDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const loadUser = async () => {
            const { data } = await supabase.auth.getUser();
            const authUser = data.user;

            if (!mounted) return;

            if (!authUser) {
                router.push("/login");
                return;
            }

            setUser(authUser);

            // Fetch user profile from database
            const { data: profile } = await supabase
                .from("user")
                .select("*")
                .eq("auth_id", authUser.id)
                .single();

            if (profile) {
                setUserProfile(profile);
            }

            setLoading(false);
        };

        loadUser();

        return () => {
            mounted = false;
        };
    }, [router]);

    if (loading) {
        return (
            <>
                <Header />
                <main className="mx-auto max-w-4xl p-6">
                    <p>Loading...</p>
                </main>
                <Footer />
            </>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <>
            <Header />
            <main className="mx-auto max-w-4xl p-6">
                <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>

                {userProfile && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                        <h2 className="text-2xl font-semibold mb-4">
                            Profile Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-600 text-sm">
                                    First Name
                                </p>
                                <p className="text-lg font-medium">
                                    {userProfile.firstname}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600 text-sm">
                                    Last Name
                                </p>
                                <p className="text-lg font-medium">
                                    {userProfile.lastname}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600 text-sm">Email</p>
                                <p className="text-lg font-medium">
                                    {user.email}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600 text-sm">
                                    Phone Number
                                </p>
                                <p className="text-lg font-medium">
                                    {userProfile.phone_number}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4">Quick Links</h2>
                    <ul className="space-y-2">
                        <li>
                            <a
                                href="/booking"
                                className="text-blue-600 hover:underline">
                                Make a Booking
                            </a>
                        </li>
                        <li>
                            <a
                                href="/write-review"
                                className="text-blue-600 hover:underline">
                                Write a Review
                            </a>
                        </li>
                        <li>
                            <a
                                href="/favorites"
                                className="text-blue-600 hover:underline">
                                View Favorites
                            </a>
                        </li>
                    </ul>
                </div>
            </main>
            <Footer />
        </>
    );
}
