"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItemProps = {
  href: string;
  icon: string;
  label: string;
};

export default function BottomNav() {
  const path = usePathname();

  const items: NavItemProps[] = [
    { href: "/create-trip", icon: "＋", label: "Trips" },
    { href: "/", icon: "≋", label: "Balance" },
    { href: "/stats", icon: "▦", label: "Stats" },
  ];

  return (
    <nav className="bottom-nav" aria-label="Головна навігація">
      {items.map((item) => {
        const active = path === item.href;

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={active ? "active" : ""}
            href={item.href}
            key={item.href}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
