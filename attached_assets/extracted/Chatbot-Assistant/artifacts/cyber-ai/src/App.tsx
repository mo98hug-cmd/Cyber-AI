import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { ThemeProvider } from "@/components/theme-provider";
import { WelcomeScreen } from "@/components/welcome-screen";
import { ChatInterface } from "@/components/chat-interface";
import { AnimatePresence } from "framer-motion";

const queryClient = new QueryClient();

function AppContent() {
  const [isInitialized, setIsInitialized] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {!isInitialized ? (
        <WelcomeScreen key="welcome" onInitialize={() => setIsInitialized(true)} />
      ) : (
        <ChatInterface key="chat" />
      )}
    </AnimatePresence>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AppContent} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="cyber-ai-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
