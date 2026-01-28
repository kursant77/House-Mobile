import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface BioDisplayProps {
  bio: string;
  maxLines?: number;
  className?: string;
}

export function BioDisplay({ bio, maxLines = 3, className }: BioDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowExpand, setShouldShowExpand] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  // Bio matnini linklarga o'zgartirish
  const renderBioWithLinks = (text: string) => {
    if (!text) return null;

    // URL pattern (https://, http://, www.)
    const urlPattern = /(https?:\/\/[^\s]+|www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)/gi;
    // Email pattern
    const emailPattern = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;

    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let keyCounter = 0;

    // Barcha match'larni topish va index bo'yicha tartiblash
    const matches: Array<{ index: number; length: number; text: string; type: 'email' | 'url' }> = [];

    // Email'larni topish
    const emailMatches = Array.from(text.matchAll(emailPattern));
    emailMatches.forEach((match) => {
      if (match.index !== undefined) {
        matches.push({
          index: match.index,
          length: match[0].length,
          text: match[0],
          type: 'email'
        });
      }
    });

    // URL'larni topish (email bo'lmaganlar)
    const urlMatches = Array.from(text.matchAll(urlPattern));
    urlMatches.forEach((match) => {
      if (match.index !== undefined) {
        // Email ekanligini tekshirish
        const isEmail = emailPattern.test(match[0]);
        if (!isEmail) {
          matches.push({
            index: match.index,
            length: match[0].length,
            text: match[0],
            type: 'url'
          });
        }
      }
    });

    // Index bo'yicha tartiblash
    matches.sort((a, b) => a.index - b.index);

    // Overlap'larni olib tashlash
    const filteredMatches: typeof matches = [];
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const overlaps = filteredMatches.some(m => 
        current.index < m.index + m.length && current.index + current.length > m.index
      );
      if (!overlaps) {
        filteredMatches.push(current);
      }
    }

    // Matnni qismlarga bo'lish
    filteredMatches.forEach((match) => {
      // Match'dan oldingi matn
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        parts.push(beforeText);
      }

      // Link yaratish
      if (match.type === 'email') {
        parts.push(
          <a
            key={`link-${keyCounter++}`}
            href={`mailto:${match.text}`}
            className="text-primary hover:underline font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            {match.text}
          </a>
        );
      } else {
        let url = match.text;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        parts.push(
          <a
            key={`link-${keyCounter++}`}
            href={url}
            className="text-primary hover:underline font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            {match.text}
          </a>
        );
      }

      lastIndex = match.index + match.length;
    });

    // Qolgan matn
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Bio uzunligini tekshirish
  useEffect(() => {
    if (textRef.current) {
      const lineHeight = parseFloat(getComputedStyle(textRef.current).lineHeight);
      const maxHeight = lineHeight * maxLines;
      const actualHeight = textRef.current.scrollHeight;
      setShouldShowExpand(actualHeight > maxHeight);
    }
  }, [bio, maxLines]);

  if (!bio || !bio.trim()) {
    return (
      <p className={cn("text-sm text-muted-foreground italic", className)}>
        Bio ma'lumotlari hozircha kiritilmagan
      </p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        ref={textRef}
        className={cn(
          "text-sm leading-relaxed whitespace-pre-wrap break-words",
          !isExpanded && shouldShowExpand && `line-clamp-${maxLines}`
        )}
        style={!isExpanded && shouldShowExpand ? {
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        } : {}}
      >
        {renderBioWithLinks(bio)}
      </div>
      {shouldShowExpand && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-medium text-primary hover:underline transition-colors"
        >
          {isExpanded ? "Kamroq ko'rsatish" : "Yana..."}
        </button>
      )}
    </div>
  );
}
