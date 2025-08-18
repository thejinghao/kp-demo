import Link from "next/link";

export default function Home() {
  const apps = [
    {
      id: "osm",
      name: "Klarna OSM Demo",
      description: "On-Site Messaging demonstration with various Klarna placements",
      icon: "💳",
      href: "/apps/osm",
      tags: ["Klarna", "Messaging", "Demo"]
    },
    // Add more apps here as you create them
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
            App Directory
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            A collection of interactive demos and tools, built with modern web technologies
          </p>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {apps.map((app) => (
            <Link
              key={app.id}
              href={app.href}
              className="group block"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">{app.icon}</span>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {app.name}
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                  {app.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {app.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-full"
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
            <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
              No apps yet
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Start building your first app to see it here
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-16 pt-8 border-t border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">
            Built with Next.js & Tailwind CSS
          </p>
        </footer>
      </div>
    </div>
  );
}
