import Link from "next/link";
import Image from "next/image";

type AppItem = {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  tags: string[];
};

export default function Home() {
  const apps: AppItem[] = [
    {
      id: "osm",
      name: "On-Site Messaging (OSM)",
      description: "Inform users that Klarna is available. Can be implemented via SDK or API",
      icon: "✉️",
      href: "/apps/osm/vertical",
      tags: ["Pre-Purchase"],
    },
    {
      id: "kec",
      name: "Klarna Express Checkout (KEC)",
      description: "Add KEC to your PDP, Cart and Checkout page. Single and multi-step experiences supported.",
      icon: "⚡",
      href: "/apps/kec",
      tags: ["Purchase"],
    },
    {
      id: "kp",
      name: "Klarna Payment",
      description: "Klarna Payment in checkout page. Create a session, init the SDK, and render the widget.",
      icon: "🛒",
      href: "/apps/kp",
      tags: ["Purchase"],
    },
    {
      id: "hpp",
      name: "Hosted Payment Page (HPP)",
      description: "Create and distribute a HPP without SDK. Supports QR and email distribution.",
      icon: "🧾",
      href: "/apps/hpp",
      tags: ["Purchase"],
    },
    {
      id: "instore",
      name: "In-Store",
      description: "Create and distribute QR for in-store. Supports both dynamic and static QR codes.",
      icon: "🛍️",
      href: "/apps/instore",
      tags: ["Purchase", "In-Store"],
    },
    {
      id: "ct",
      name: "Tokenized Payment",
      description: "Create a customer token to save Klarna for future purchases.",
      icon: "🔑",
      href: "/apps/ct",
      tags: ["Post-Purchase"],
    },
    {
      id: "om",
      name: "Order Management",
      description: "Use the Order Management APIs to capture, cancel, and refund orders.",
      icon: "📦",
      href: "/apps/om",
      tags: ["Post-Purchase"],
    },
    {
      id: "disputes",
      name: "Disputes",
      description: "Use API and webhooks to manage payment disputes.",
      icon: "⚖️",
      href: "/apps/disputes",
      tags: ["Post-Purchase"],
    },
    {
      id: "stripe",
      name: "Stripe Checkout",
      description: "Demo of Klarna in a Stripe-hosted Checkout.",
      icon: "💳",
      href: "/apps/stripe",
      tags: ["Purchase"],
    },
  ];

  const byCategory = (category: string) =>
    apps.filter((a) => a.tags.includes(category));

  const categories: { id: string; label: string }[] = [
    { id: "Pre-Purchase", label: "Pre-Purchase" },
    { id: "Purchase", label: "Purchase" },
    { id: "Post-Purchase", label: "Post-Purchase" },
  ];

  const tagStyle = (tag: string) => {
    const base = "px-2 py-0.5 body-xs rounded-full border";
    switch (tag) {
      case "Pre-Purchase":
        return `${base}`;
      case "Purchase":
        return `${base}`;
      case "Post-Purchase":
        return `${base}`;
      default:
        return `${base}`;
    }
  };

  const tagBg = (tag: string) => {
    // App badges: neutral grey regardless of tag
    return { backgroundColor: "var(--grey-10)", borderColor: "var(--grey-20)", color: "var(--grey-90)" } as const;
  };

  // Category badges: colored lozenges per category
  const categoryBg = (category: string) => {
    switch (category) {
      case "Pre-Purchase":
        return { backgroundColor: "var(--pink-10)", borderColor: "var(--pink-30)", color: "var(--grey-90)" } as const;
      case "Purchase":
        return { backgroundColor: "var(--green-10)", borderColor: "var(--green-30)", color: "var(--grey-90)" } as const;
      case "Post-Purchase":
        return { backgroundColor: "var(--purple-10)", borderColor: "var(--purple-30)", color: "var(--grey-90)" } as const;
      default:
        return { backgroundColor: "var(--grey-10)", borderColor: "var(--grey-20)", color: "var(--grey-90)" } as const;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Full-width header */}
      <header
        className="bg-[var(--bg-page)]"
        style={{ borderBottom: "1px solid rgba(229,231,235,0.5)" }}
      >
        <div className="mx-auto max-w-7xl px-4 py-5 flex items-stretch justify-between gap-6">
          <div className="flex items-stretch gap-4">
            <div className="self-stretch flex items-center">
              <Image
                src="/klarna-badge.png"
                alt="Klarna"
                width={169}
                height={72}
                className="h-full w-auto"
                style={{ maxHeight: 56 }}
                priority
              />
            </div>
            <div className="self-center">
              <p className="body-m text-[var(--text-muted)]">
                Integration demos and tools for Klarna Payments
              </p>
              <h1 className="heading-m text-[var(--text-default)]">
                Klarna Playground
              </h1>
            </div>
          </div>
          <div className="shrink-0 self-center">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                color: "var(--text-default)",
              }}
            >
              <span className="opacity-80">MID:</span>
              <span className="font-semibold">N055491</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-12">

        

        {categories.map((cat) => {
          const list = byCategory(cat.id);
          if (list.length === 0) return null;
          return (
            <section key={cat.id} className="mb-10">
              <div className="mb-4 flex items-center gap-3">
                <span className={tagStyle(cat.label)} style={categoryBg(cat.label)}>{cat.label}</span>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {list.map((app) => (
                  <Link key={app.id} href={app.href} className="group block">
                    <div
                      className="rounded-2xl p-6 shadow-sm transition-all duration-300 group-hover:-translate-y-[2px] hover:shadow-md"
                      style={{
                        backgroundColor: "var(--bg-container)",
                        border: "1px solid var(--border-default)",
                      }}
                    >
                      <div className="grid gap-3" style={{ gridTemplateColumns: "max-content 1fr" }}>
                        <div className="text-3xl leading-none">{app.icon}</div>
                        <div className="space-y-2">
                          <h3 className="heading-s text-[var(--text-default)]">{app.name}</h3>
                          <p className="body-s text-[var(--text-muted)]">{app.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {app.tags.map((tag) => (
                              <span
                                key={tag}
                                className={tagStyle(tag)}
                                style={tagBg(tag)}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {/* Empty state */}
        {apps.length === 0 && (
          <div className="py-16 text-center">
            <div className="mb-4 text-6xl">🚀</div>
            <h3 className="mb-2 text-2xl font-semibold text-[var(--color-primary-white)]">
              No apps yet
            </h3>
            <p className="text-[var(--text-muted)]">
              Start building your first app to see it here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
