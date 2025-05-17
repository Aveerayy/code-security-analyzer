import { ReactNode } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ui/theme-provider";

interface SecurityAnalyzerLayoutProps {
  children: ReactNode;
}

export default function SecurityAnalyzerLayout({
  children,
}: SecurityAnalyzerLayoutProps) {
  // Since we're not using a theme provider, we'll implement a simple theme toggle
  // that uses localStorage to persist the theme preference
  const useThemeToggle = () => {
    const isDark = document.documentElement.classList.contains("dark");

    const setTheme = (theme: "dark" | "light") => {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    };

    const toggleTheme = () => {
      const newTheme = isDark ? "light" : "dark";
      setTheme(newTheme);
    };

    return { isDark, toggleTheme };
  };

  const { isDark, toggleTheme } = useThemeToggle();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <div className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
            <span className="text-lg font-bold">
              Cognitive Security
            </span>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              {isDark ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Cognitive Security &copy; {new Date().getFullYear()} -
            STRIDE-based security analysis tool
          </p>
        </div>
      </footer>
    </div>
  );
}
