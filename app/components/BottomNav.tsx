"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

type NavItemProps = {
  href: string;
  icon: string;
  label: string;
};

export default function BottomNav() {
  const path = usePathname();

  const Item = ({ href, icon, label }: NavItemProps) => {
    const active = path === href;

    return (
      <Link href={href} style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: 12,
            color: active ? "#22c55e" : "#888",
          }}
        >
          <div style={{ fontSize: 22 }}>{icon}</div>
          {label}
        </div>
      </Link>
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 70,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid #eee",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 100,
      }}
    >
      <Item href="/" icon="🏠" label="Home" />
      <Item href="/create-trip" icon="🚗" label="Trips" />
      <Item href="/stats" icon="📊" label="Stats" />
    </div>
  );
}