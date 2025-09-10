import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const apps = [
    {
      id: "osm",
      name: "On-Site Messaging (OSM)",
      description: "Implement via SDK or API",
      icon: "✉️",
      href: "/apps/osm/vertical",
      tags: ["Pre-Purchase"]
    },
    {
      id: "kec",
      name: "Klarna Express Checkout",
      description: "KEC single or multi-step experience",
      icon: "⚡",
      href: "/apps/kec",
      tags: ["Purchase"]
    },
    {
      id: "kp",
      name: "Klarna Payment",
      description: "Klarna Payment in a standard checkout flow",
      icon: "🛒",
      href: "/apps/kp",
      tags: ["Purchase"]
    },
    {
      id: "hpp",
      name: "Hosted Payment Page (HPP)",
      description: "Create and distribute a HPP",
      icon: "🧾",
      href: "/apps/hpp",
      tags: ["Purchase"]
    },
    {
      id: "instore",
      name: "In-Store",
      description: "Create and distribute QR for in-store",
      icon: "🛍️",
      href: "/apps/instore",
      tags: ["Purchase", "In-Store"]
    },
    {
      id: "ct",
      name: "Tokenized Payment",
      description: "Manage customer tokens or create orders",
      icon: "🔑",
      href: "/apps/ct",
      tags: ["Purchase", "Post-Purchase"]
    },
    {
      id: "om",
      name: "Order Management",
      description: "Manage existing orders via OM API",
      icon: "📦",
      href: "/apps/om",
      tags: ["Post-Purchase"]
    },
    {
      id: "disputes",
      name: "Disputes",
      description: "List and investigate payment disputes",
      icon: "⚖️",
      href: "/apps/disputes",
      tags: ["Post-Purchase"]
    },
    {
      id: "stripe",
      name: "Stripe Checkout",
      description: "Stripe-hosted Checkout (all available methods)",
      icon: "💳",
      href: "/apps/stripe",
      tags: ["Purchase"]
    },

    // Add more apps here as you create them
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="mb-4">
            <Image
              src="/klarna-badge.png"
              alt="Klarna Playground"
              width={169}
              height={72}
              priority
              className="mx-auto h-auto w-[110px] md:w-[150px] lg:w-[170px]"
            />
          </div>
          <p className="text-xl text-[var(--color-primary-offwhite)] max-w-2xl mx-auto">
            A collection of demos and tools for integrating Klarna Payments. 
          </p>
          <p className="text-slate-200 mt-2 italic">Default MID: N055491</p>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {apps.map((app) => (
            <Link
              key={app.id}
              href={app.href}
              className="group block"
            >
              <div className="rounded-2xl p-6 border border-white/20 bg-white/10 backdrop-blur-xl shadow-xl hover:bg-white/15 hover:border-white/30 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">{app.icon}</span>
                  <h3 className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors">
                    {app.name}
                  </h3>
                </div>
                <p className="text-slate-300 mb-4 leading-relaxed">
                  {app.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {app.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-white/10 border border-white/20 text-slate-200 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {apps.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-2xl font-semibold text-slate-200 mb-2">
              No apps yet
            </h3>
            <p className="text-slate-400">
              Start building your first app to see it here
            </p>
          </div>
        )}

        
      </div>
    </div>
  );
}
