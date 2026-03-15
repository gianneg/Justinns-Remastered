"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "guest" | "user" | "admin";

export default function Footer() {
    const [role, setRole] = useState<Role>("guest");

    useEffect(() => {
        let mounted = true;

        const loadRole = async () => {
            const { data } = await supabase.auth.getUser();
            const user = data.user;

            if (!mounted) return;

            if (!user) {
                setRole("guest");
                return;
            }

            const { data: profile } = await supabase
                .from("user")
                .select("is_admin")
                .eq("auth_id", user.id)
                .single();

            setRole(profile?.is_admin ? "admin" : "user");
        };

        loadRole();

        const { data: sub } = supabase.auth.onAuthStateChange(() => {
            loadRole();
        });

        return () => {
            mounted = false;
            sub.subscription.unsubscribe();
        };
    }, []);

    return (
        <footer className="mt-16 border-t border-gray-200 pt-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {/* About */}
                <div>
                    <h3 className="font-semibold text-lg mb-3">
                        About JustInns
                    </h3>
                    <ul className="space-y-2 text-sm">
                        <li>
                            <Link className="hover:underline" href="/about-us">
                                About Us
                            </Link>
                        </li>
                        <li>
                            <Link className="hover:underline" href="/booking">
                                Reserve Your Stay
                            </Link>
                        </li>
                        <li>
                            <Link className="hover:underline" href="/discounts">
                                Gift Cards
                            </Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-semibold text-lg mb-3">Explore</h3>

                    {role === "admin" && (
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    className="hover:underline"
                                    href="/profile">
                                    View Profile
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="hover:underline"
                                    href="/dashboards/admin-dashboard">
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="hover:underline"
                                    href="/admin/manage-bookings">
                                    Manage Bookings
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="hover:underline"
                                    href="/admin/manage-lodgings">
                                    Manage Lodging
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="hover:underline"
                                    href="/admin/add-lodging">
                                    Add Lodging
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="hover:underline"
                                    href="/favorites">
                                    Favorites
                                </Link>
                            </li>
                        </ul>
                    )}

                    {role === "user" && (
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    className="hover:underline"
                                    href="/write-review">
                                    Write a Review
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="hover:underline"
                                    href="/profile">
                                    View Profile
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="hover:underline"
                                    href="/dashboards/user-dashboard">
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="hover:underline"
                                    href="/favorites">
                                    Favorites
                                </Link>
                            </li>
                        </ul>
                    )}

                    {role === "guest" && (
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    className="hover:underline"
                                    href="/write-review">
                                    Write a Review
                                </Link>
                            </li>
                            <li>
                                <Link className="hover:underline" href="/login">
                                    Join
                                </Link>
                            </li>
                        </ul>
                    )}
                </div>

                {/* Newsletter + Social */}
                <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm mb-3">
                            Sign up for news from Just Inns
                        </p>

                        <div className="flex gap-2">
                            <input
                                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                                placeholder="Email Address"
                            />
                            <button
                                type="button"
                                className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 text-sm">
                                <span>Submit</span>
                                <span aria-hidden>→</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4 text-xl">
                        <a
                            className="hover:opacity-70"
                            href="#"
                            aria-label="Instagram">
                            📷
                        </a>
                        <a
                            className="hover:opacity-70"
                            href="#"
                            aria-label="Facebook">
                            📘
                        </a>
                        <a
                            className="hover:opacity-70"
                            href="#"
                            aria-label="Twitter">
                            🐦
                        </a>
                        <a
                            className="hover:opacity-70"
                            href="#"
                            aria-label="LinkedIn">
                            💼
                        </a>
                        <a
                            className="hover:opacity-70"
                            href="#"
                            aria-label="YouTube">
                            ▶️
                        </a>
                    </div>
                </div>
            </div>

            {/* Bottom */}
            <div className="mt-10 pt-6 border-t border-gray-200 text-sm text-gray-700">
                <p>© 2026 JustInns LLC. All rights reserved. Please take note this is just a demo site meant to demonstrate the developer's skills.</p>

                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                    <a className="hover:underline" href="#">
                        Terms of Use
                    </a>
                    <a className="hover:underline" href="#">
                        Privacy and Cookies Statement
                    </a>
                    <a className="hover:underline" href="#">
                        Cookie consent
                    </a>
                    <a className="hover:underline" href="#">
                        Site Map
                    </a>
                    <a className="hover:underline" href="#">
                        Contact us
                    </a>
                </div>

                <p className="mt-4 text-gray-600">
                    This version of our website is designed for English-speaking
                    travelers in the Philippines. Explore our services tailored
                    to enhance your travel experience.
                </p>
            </div>
        </footer>
    );
}
