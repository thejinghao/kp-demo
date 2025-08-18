# App Directory

A collection of interactive demos and tools, built with modern web technologies.

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app directory.

## 📱 Available Apps

### 1. Klarna OSM Demo (`/apps/osm`)
- **Description**: On-Site Messaging demonstration with various Klarna placements
- **Features**: 
  - Interactive price selection ($20, $100, $1,500)
  - Multiple Klarna placement types
  - Real-time messaging updates
  - Dark/light theme support
- **Tags**: Klarna, Messaging, Demo

### 2. Klarna Express Checkout (`/apps/kec`)
- **Description**: Express checkout demo with authorize and finalize flows
- **Features**: 
  - Auto-finalize configuration options
  - Multiple payload scenarios for testing
  - Custom amount input support
  - Real-time authorization results
  - Copy-to-clipboard functionality
- **Tags**: Klarna, Checkout, Payment

### 3. Klarna Payment Demo (`/apps/kp`)
- **Description**: Payment demo with client token initialization and order placement
- **Features**: 
  - Client token input and validation
  - SDK initialization workflow
  - Klarna widget loading
  - Order placement simulation
  - Response data display with copy functionality
- **Tags**: Klarna, Payment, SDK

## 🛠️ Adding New Apps

To add a new app to the directory:

1. **Create the app directory**:
   ```bash
   mkdir -p app/apps/your-app-name
   ```

2. **Create the app page**:
   ```bash
   touch app/apps/your-app-name/page.tsx
   ```

3. **Add the app to the directory** in `app/page.tsx`:
   ```typescript
   const apps = [
     // ... existing apps
     {
       id: "your-app-name",
       name: "Your App Name",
       description: "Description of your app",
       icon: "🚀",
       href: "/apps/your-app-name",
       tags: ["Tag1", "Tag2"]
     }
   ];
   ```

4. **Build your app** using React components and Tailwind CSS

## 🎨 Design System

This app uses a modern, minimalist design with:
- **Colors**: Slate color palette with dark mode support
- **Typography**: Geist font family
- **Layout**: Responsive grid system with Tailwind CSS
- **Components**: Card-based design with hover effects and smooth transitions

## 🏗️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
vercel-app/
├── app/
│   ├── apps/           # Individual app pages
│   │   └── osm/        # Klarna OSM Demo
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # App directory homepage
├── public/             # Static assets
└── package.json        # Dependencies
```

## 🌟 Features

- **Responsive Design**: Works on all device sizes
- **Dark Mode**: Automatic theme switching
- **Modern UI**: Clean, professional interface
- **Easy Navigation**: Simple app discovery and navigation
- **Scalable**: Easy to add new apps and features

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
