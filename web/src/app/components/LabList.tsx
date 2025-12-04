"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "./Navbar";

export interface Lab {
  id: string;
  name: string;
  desc: string;
  details: string[];
  tags?: string[];
}

interface User {
  id: number;
  email: string;
  name?: string | null;
  student?: any;
  researcher?: any;
}

interface Props {
  labs: Lab[];
  user?: User | null;
}

export default function LabList({ labs, user }: Props) {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInputOpen, setTagInputOpen] = useState(false);
  const [tagQuery, setTagQuery] = useState("");

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    labs.forEach((lab) => lab.tags?.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
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
    if (!tq) return allTags;
    return allTags.filter((tag) => tag.toLowerCase().includes(tq));
  }, [allTags, tagQuery]);

  return (
    <>
      <Navbar user={user} />
      <main className="lab-page">
        <h1 className="title">Lab Openings</h1>
        <div className="lab-search">
          <input
            type="search"
            placeholder="Search by title or description"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="tag-picker-button"
            onClick={() => setTagInputOpen((open) => !open)}
          >
            Enter tags
          </button>
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
        {tagInputOpen && (
          <div className="tag-entry">
            <input
              type="text"
              placeholder="Filter tags"
              value={tagQuery}
              onChange={(e) => setTagQuery(e.target.value)}
            />
            <div className="tag-picker-panel">
              {filteredTags.length === 0 && (
                <p className="empty-tags">No tags match.</p>
              )}
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
          </div>
        )}
        <div className="card-container">
          {filtered.map((lab) => (
            <div key={lab.id} className="lab-card">
              <h2 className="lab-name">{lab.name}</h2>
              <p className="lab-desc">{lab.desc}</p>
              {lab.tags && lab.tags.length > 0 && (
                <div className="lab-tags">
                  {lab.tags.map((tag) => (
                    <span key={tag} className="lab-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <ul className="lab-details">
                {lab.details.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <Link href={`/labs/${lab.id}`} className="learn-more">
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
    </>
  );
}
