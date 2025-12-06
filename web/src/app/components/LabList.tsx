"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "./Navbar";
import Toast, { type ToastState } from "./Toast";
import "./LabList.css";

export interface Lab {
  id: string;
  name: string;
  desc: string;
  details: string[];
  tags?: string[];
}

interface Props {
  labs: Lab[];
  userRole?: string | null;
}

export default function LabList({ labs, userRole }: Props) {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInputOpen, setTagInputOpen] = useState(false);
  const [tagQuery, setTagQuery] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    labs.forEach((lab) => lab.tags?.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [labs]);

  // Get suggested tags (most common tags, limited to 8)
  const suggestedTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    labs.forEach((lab) => {
      lab.tags?.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag)
      .sort((a, b) => a.localeCompare(b));
  }, [labs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return labs.filter((lab) => {
      const matchesQuery =
        !q ||
        lab.name.toLowerCase().includes(q) ||
        lab.desc.toLowerCase().includes(q);
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => lab.tags?.includes(tag));
      return matchesQuery && matchesTags;
    });
  }, [labs, query, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredTags = useMemo(() => {
    const tq = tagQuery.trim().toLowerCase();
    if (!tq) return suggestedTags; // Show suggested tags when no query
    const filtered = allTags.filter((tag) => tag.toLowerCase().includes(tq));
    // Limit to 10 suggestions
    return filtered.slice(0, 10);
  }, [allTags, tagQuery, suggestedTags]);

  // Auto-dismiss success toast
  useEffect(() => {
    if (toast?.tone === "success") {
      const timer = setTimeout(() => setIsDismissing(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Close tag panel when clicking outside
  useEffect(() => {
    if (!tagInputOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.tag-filter-search')) {
        setTagInputOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [tagInputOpen]);

  return (
    <>
      <Navbar isLoggedIn={true} role={userRole || undefined} />
      <main className="lab-page" data-cy="lab-page">
        <h1 className="title" data-cy="page-title">Lab Openings</h1>
        <div className="search-container" data-cy="search-container">
          <div className="lab-search" data-cy="lab-search">
            <input
              type="search"
              placeholder="Search by title or description"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-cy="search-input"
            />
          </div>
          <div className="tag-filter-search">
            <input
              type="text"
              placeholder="Filter by tags"
              value={tagQuery}
              onChange={(e) => {
                setTagQuery(e.target.value);
                setTagInputOpen(true);
              }}
              onFocus={() => setTagInputOpen(true)}
            />
            {tagInputOpen && (
              <div className="tag-entry">
                <div className="tag-picker-panel">
                  {filteredTags.length === 0 && tagQuery.trim() && (
                    <p className="empty-tags">No tags match.</p>
                  )}
                  {filteredTags.length > 0 && (
                    <div className="tag-suggestions-row">
                      {filteredTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className={`tag-chip ${
                            selectedTags.includes(tag) ? "active" : ""
                          }`}
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {selectedTags.length > 0 && (
          <div className="selected-tags">
            {selectedTags.map((tag) => (
              <span key={tag} className="selected-tag">
                {tag}
                <button
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="card-container" data-cy="lab-cards-container">
          {filtered.map((lab) => (
            <div key={lab.id} className="lab-card" data-cy="lab-card">
              <h2 className="lab-name" data-cy="lab-title">{lab.name}</h2>
              <p className="lab-desc" data-cy="lab-description">{lab.desc}</p>
              {lab.tags && lab.tags.length > 0 && (
                <div className="lab-tags" data-cy="lab-tags">
                  {lab.tags.map((tag) => (
                    <span key={tag} className="lab-tag" data-cy="lab-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <ul className="lab-details" data-cy="lab-details">
                {lab.details.map((line) => (
                  <li key={line} data-cy="lab-detail-item">{line}</li>
                ))}
              </ul>
              <Link 
                href={`/labs/${lab.id}`} 
                className="learn-more"
                data-cy="learn-more-link"
                prefetch={true}
                onClick={() => {
                  setToast({ id: Date.now(), tone: "loading", message: "Loading..." });
                  setIsDismissing(false);
                }}
              >
                Learn More
              </Link>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <p>No labs matched your search.</p>
            </div>
          )}
        </div>
      </main>
      <Toast
        toast={toast}
        isDismissing={isDismissing}
        onDismiss={() => setIsDismissing(true)}
        onAnimationEnd={() => {
          if (isDismissing) {
            setToast(null);
            setIsDismissing(false);
          }
        }}
      />
    </>
  );
}
