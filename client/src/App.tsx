import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { Head } from "@/components/Head";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminClicks from "./pages/AdminClicks";
import CommunityDetail from "./pages/CommunityDetail";
import Home from "./pages/Home";
import FraudResponse from "./pages/FraudResponse";
import Methodology from "./pages/Methodology";
import ResourcesHub from "./pages/ResourcesHub";
import ResourceArticle from "./pages/ResourceArticle";
import SkoolNews from "./pages/SkoolNews";
import NewsArticle from "./pages/NewsArticle";
import FaqHub from "./pages/FaqHub";
import FaqArticle from "./pages/FaqArticle";
import CategoryPage from "./pages/CategoryPage";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/community/:slug"} component={CommunityDetail} />
      <Route path={"/methodology"} component={Methodology} />
      <Route path={"/policy/fraud-response"} component={FraudResponse} />
      <Route path={"/resources"} component={ResourcesHub} />
      <Route path={"/resources/:slug"} component={ResourceArticle} />
      <Route path={"/news"} component={SkoolNews} />
      <Route path={"/news/:slug"} component={NewsArticle} />
      <Route path={"/faq"} component={FaqHub} />
      <Route path={"/faq/:slug"} component={FaqArticle} />
      <Route path={"/categories/:slug"} component={CategoryPage} />
      <Route path={"/admin/clicks"} component={AdminClicks} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Head />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
