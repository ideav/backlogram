# Vite + React + TypeScript Template

This is a template project with Vite, React, TypeScript, Tailwind CSS, and shadcn/ui components.

## Features

- ⚡️ Vite for fast development and building
- ⚛️ React 18 with TypeScript
- 🎨 Tailwind CSS for styling
- 🧩 shadcn/ui components
- 📁 Path aliases (@/ for src/)

## Project Structure

```
src/
├── components/
│   └── ui/          # shadcn/ui components
├── lib/
│   └── utils.ts     # Utility functions
├── App.tsx          # Main application component
├── main.tsx         # Entry point
└── index.css        # Global styles with Tailwind
```

## Running Locally in VS Code

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [VS Code](https://code.visualstudio.com/)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/ideav/backlogram
   cd backlogram
   ```

2. **Open in VS Code**

   Use the menu: `File → Open Folder → backlogram`

   Or from the terminal:
   ```bash
   code .
   ```

3. **Open the integrated terminal**

   Press `` Ctrl+` `` (backtick) to open the terminal inside VS Code.

4. **Install dependencies and start the dev server**

   For the main app (root):
   ```bash
   npm install
   npm run dev
   ```

   For the blog app (`blog/` subdirectory):
   ```bash
   cd blog
   npm install
   npm run dev
   ```

5. **Open in browser**

   The app will be available at: [http://localhost:5173](http://localhost:5173)

### Recommended VS Code Extensions

- **ESLint** — JavaScript/TypeScript linting
- **Tailwind CSS IntelliSense** — Autocomplete for Tailwind classes
- **TypeScript Vue Plugin** — Better TypeScript support

### Tech Stack

- [Vite](https://vitejs.dev/) — build tool and dev server
- [React 18](https://react.dev/) — UI framework
- [TypeScript](https://www.typescriptlang.org/) — type safety
- [Tailwind CSS](https://tailwindcss.com/) — utility-first styling
- [shadcn/ui](https://ui.shadcn.com/) — component library
