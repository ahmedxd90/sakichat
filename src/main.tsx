import { createRoot } from "react-dom/client";
import { ConvexProvider } from "convex/react";
import { convex } from "./lib/convexClient";
import { SupabaseProvider } from "./contexts/SupabaseContext";
import "./index.css";
import App from "./App";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary";

(window as any).__sakiStartupMark?.("main.tsx loaded");

createRoot(document.getElementById("root")!).render(
  <GlobalErrorBoundary>
    <ConvexProvider client={convex}>
      <SupabaseProvider>
        <App />
      </SupabaseProvider>
    </ConvexProvider>
  </GlobalErrorBoundary>,
);

(window as any).__sakiStartupMark?.("React root mounted");
