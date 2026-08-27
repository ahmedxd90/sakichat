import { createRoot } from "react-dom/client";

import { SupabaseProvider } from "./contexts/SupabaseContext";
import "./index.css";
import App from "./App";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary";

(window as any).__sakiStartupMark?.("main.tsx loaded");

createRoot(document.getElementById("root")!).render(
  <GlobalErrorBoundary>
    <SupabaseProvider>
      <App />
    </SupabaseProvider>
  </GlobalErrorBoundary>,
);

(window as any).__sakiStartupMark?.("React root mounted");
