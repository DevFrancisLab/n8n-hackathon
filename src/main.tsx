import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "@/App";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/layout/providers";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Providers>
        <AppShell>
          <App />
        </AppShell>
      </Providers>
    </BrowserRouter>
  </StrictMode>,
);
