import { useState, useRef, useEffect } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  showHistory?: boolean;
  className?: string;
}

const SEARCH_HISTORY_KEY = "search_history";
const MAX_HISTORY_ITEMS = 10;

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = "Qidirish...",
  suggestions = [],
  showHistory = true,
  className,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load search history
  useEffect(() => {
    if (showHistory) {
      try {
        const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
        if (saved) {
          setHistory(JSON.parse(saved));
        }
      } catch {
        // Ignore errors
      }
    }
  }, [showHistory]);

  // Save to history
  const saveToHistory = (term: string) => {
    if (!term.trim() || !showHistory) return;
    
    const newHistory = [
      term,
      ...history.filter((h) => h.toLowerCase() !== term.toLowerCase()),
    ].slice(0, MAX_HISTORY_ITEMS);
    
    setHistory(newHistory);
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch {
      // Ignore errors
    }
  };

  // Clear history
  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch {
      // Ignore errors
    }
  };

  // Remove single history item
  const removeFromHistory = (term: string) => {
    const newHistory = history.filter((h) => h !== term);
    setHistory(newHistory);
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch {
      // Ignore errors
    }
  };

  // Handle search submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      saveToHistory(value.trim());
      onSearch?.(value.trim());
      inputRef.current?.blur();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    saveToHistory(suggestion);
    onSearch?.(suggestion);
    setIsFocused(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter suggestions and history based on input
  const filteredSuggestions = value.trim()
    ? suggestions.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5)
    : [];

  const filteredHistory = value.trim()
    ? history.filter((h) =>
        h.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 3)
    : history.slice(0, 5);

  const showDropdown = isFocused && (filteredSuggestions.length > 0 || filteredHistory.length > 0);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className="h-10 pl-9 pr-9 rounded-xl bg-muted border-0"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* History section */}
          {filteredHistory.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  So'nggi qidiruvlar
                </span>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Tozalash
                  </button>
                )}
              </div>
              {filteredHistory.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted cursor-pointer group"
                  onClick={() => handleSuggestionClick(item)}
                >
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1 text-sm">{item}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(item);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions section */}
          {filteredSuggestions.length > 0 && (
            <div className="p-2 border-t border-border">
              <div className="px-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Tavsiyalar
                </span>
              </div>
              {filteredSuggestions.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => handleSuggestionClick(item)}
                >
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
