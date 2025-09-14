import "./globals.css";
import { TooltipProvider } from "@radix-ui/react-tooltip";

import QueryProvider from "./providers/QueryProvider";
import { Toaster } from "./src/components/ui/toaster";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <TooltipProvider>
            <Toaster />
            {children}
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
