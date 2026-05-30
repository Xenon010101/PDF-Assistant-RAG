"use client";

import { Brain, Github, Users, Shield, BookOpen } from "lucide-react";

interface FooterProps {
  onOpenHallOfFame?: () => void;
}

const footerLinks = {
  documentation: [
    { label: "API Reference", href: "/docs" },
    { label: "FAQ", href: "https://github.com/param20h/PDF-Assistant-RAG/blob/main/docs/FAQ.md" },
    { label: "Changelog", href: "https://github.com/param20h/PDF-Assistant-RAG/blob/main/CHANGELOG.MD" },
  ],
  legal: [
    { label: "License", href: "https://github.com/param20h/PDF-Assistant-RAG/blob/main/license" },
    { label: "Code of Conduct", href: "https://github.com/param20h/PDF-Assistant-RAG/blob/main/CODE_OF_CONDUCT.md" },
    { label: "Security", href: "https://github.com/param20h/PDF-Assistant-RAG/blob/main/SECURITY.md" },
  ],
};

export default function Footer({ onOpenHallOfFame }: FooterProps) {
  return (
    <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">PDF Assistant RAG</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enterprise-grade document analysis powered by advanced AI retrieval.
              Upload, search, and chat with your documents securely.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/param20h/PDF-Assistant-RAG"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub repository"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="w-4 h-4 text-primary" />
              Documentation
            </h3>
            <ul className="space-y-2">
              {footerLinks.documentation.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="w-4 h-4 text-primary" />
              Legal
            </h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Users className="w-4 h-4 text-primary" />
              Community
            </h3>
            <ul className="space-y-2">
              <li>
                {onOpenHallOfFame ? (
                  <button
                    onClick={onOpenHallOfFame}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Hall of Fame
                  </button>
                ) : (
                  <a
                    href="https://github.com/param20h/PDF-Assistant-RAG/graphs/contributors"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Hall of Fame
                  </a>
                )}
              </li>
              <li>
                <a
                  href="https://github.com/param20h/PDF-Assistant-RAG/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Contributing
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/param20h/PDF-Assistant-RAG/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Report Issue
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Built with FastAPI &bull; LangChain &bull; ChromaDB &bull; HuggingFace &bull; Next.js
          </p>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} PDF Assistant RAG. Open source under the MIT License.
          </p>
        </div>
      </div>
    </footer>
  );
}
