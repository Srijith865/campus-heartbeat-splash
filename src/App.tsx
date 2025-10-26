import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import { CreateAccount } from "./pages/CreateAccount";
import { Login } from "./pages/Login";
import Feed from "./pages/Feed";
import Account from "./pages/Account";
import Chats from "./pages/Chats";
import Chat from "./pages/Chat";
import Bookmarks from "./pages/Bookmarks";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import ChatbotButton from "./components/ChatbotButton";
import GeminiTest from "./components/GeminiTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/account" element={<Account />} />
            <Route path="/chats" element={<Chats />} />
            <Route path="/chat/:chatId" element={<Chat />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/test-gemini" element={<GeminiTest />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatbotButton />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
