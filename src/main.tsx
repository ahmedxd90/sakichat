import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import "./index.css";
import App from "./App";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary";
import { convex } from "./lib/convexClient";

(window as any).__sakiStartupMark?.("main.tsx loaded");

createRoot(document.getElementById("root")!).render(
  <GlobalErrorBoundary>
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </GlobalErrorBoundary>,
);

(window as any).__sakiStartupMark?.("React root mounted");
