/**
 * PostCreationPage Component
 * 
 * This component handles the creation of new research posts by researchers.
 * It includes a dynamic form builder that allows researchers to:
 * - Set post title and description
 * - Add/remove tags
 * - Add/remove/edit custom questions (Text, Checkbox, Multiple Choice)
 * 
 * The state is managed locally and submitted to the /api/posts endpoint.
 */
"use client";
import React, { useState } from "react";
import "./page.css";
import Navbar from "../../components/Navbar";
import { useUser } from "@/hooks/useUser";

interface FormEntry {
  id: string;
  type: "text" | "checkbox" | "multiple-choice";
  title: string;
  description: string;
  options?: string[];
}

const PostCreationPage: React.FC = () => {
  const { user } = useUser();
  const [showEntryMenu, setShowEntryMenu] = useState(false);
  const [entries, setEntries] = useState<FormEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);

  const addEntry = (type: "text" | "checkbox" | "multiple-choice") => {
    const needsOptions = type === "multiple-choice" || type === "checkbox";
    const newEntry: FormEntry = {
      id: `entry-${Date.now()}`,
      type,
      title: "",
      description: "",
      options: needsOptions ? [""] : undefined,
    };
    setEntries([...entries, newEntry]);
    setEditingEntry(newEntry.id);
    setShowEntryMenu(false);
  };

  const updateEntry = (
    id: string,
    field: keyof FormEntry,
    value: string | string[]
  ) => {
    setEntries(
      entries.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter((entry) => entry.id !== id));
    if (editingEntry === id) {
      setEditingEntry(null);
    }
  };

  const addOption = (entryId: string) => {
    setEntries(
      entries.map((entry) =>
        entry.id === entryId && entry.options
          ? { ...entry, options: [...entry.options, ""] }
          : entry
      )
    );
  };

  const updateOption = (entryId: string, index: number, value: string) => {
    setEntries(
      entries.map((entry) =>
        entry.id === entryId && entry.options
          ? {
              ...entry,
              options: entry.options.map((opt, i) => (i === index ? value : opt)),
            }
          : entry
      )
    );
  };

  const removeOption = (entryId: string, index: number) => {
    setEntries(
      entries.map((entry) =>
        entry.id === entryId && entry.options
          ? {
              ...entry,
              options: entry.options.filter((_, i) => i !== index),
            }
          : entry
      )
    );
  };

  const [postTitle, setPostTitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    const MAX_TAG_LENGTH = 30;
    if (!trimmedTag) {
      return;
    }
    if (trimmedTag.length > MAX_TAG_LENGTH) {
      alert(`Tag must be ${MAX_TAG_LENGTH} characters or less`);
      return;
    }
    if(tags.length >= 10) {
      alert("You can only add up to 10 tags");
      return;
    }
    if (tags.includes(trimmedTag)) {
      alert("This tag has already been added");
      return;
    }
    setTags([...tags, trimmedTag]);
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  async function handleSavePost() {
    if (!postTitle) return alert("Please enter a post title");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: postTitle,
          description: postDescription,
          tags: tags,
          questions: entries.map((e) => ({
            type: e.type,
            question: e.title,
            description: e.description,
            options: e.options,
          })),
        }),
      });

      if (res.ok) {
        window.location.href = "/researcher-myposts";
      } else {
        const body = await res.json();
        alert(body.error || "Failed to save post");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Navbar user={user} />
      <div className="post-creation-page">
        <div className="post-creation-container">
          <h1 className="post-creation-title">Post Creation</h1>

          <div className="post-meta-section">
            <input
              type="text"
              className="post-title-input"
              placeholder="Post Title (e.g., Research Assistant needed for AI Lab)"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              maxLength={50}
            />
            <textarea
              className="post-description-input"
              placeholder="Post Description (Describe the role, requirements, etc.)"
              value={postDescription}
              onChange={(e) => setPostDescription(e.target.value)}
              maxLength={500}
            />

            <div className="tags-section">
              <label className="field-label">Tags</label>
              <div className="tags-input-container">
                <input
                  type="text"
                  className="tag-input"
                  placeholder="Add a tag (e.g. AI, Machine Learning, Biology)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                />
                <button 
                  className="add-tag-btn" 
                  onClick={addTag}
                  type="button"
                >
                  Add Tag
                </button>
              </div>
              {tags.length > 0 && (
                <div className="tags-display">
                  {tags.map((tag) => (
                    <span key={tag} className="tag-chip">
                      {tag}
                      <button
                        className="tag-remove-btn"
                        onClick={() => removeTag(tag)}
                        type="button"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            className="add-entry-button"
            onClick={() => setShowEntryMenu(true)}
          >
            Add Question
          </button>

          <div className="entries-list">
            {entries.map((entry, index) => (
              <div key={entry.id} className="entry-card">
                <div className="entry-header">
                  <span className="entry-number">Question {index + 1}</span>
                  <span className="entry-type-badge">{entry.type}</span>
                  <button
                    className="delete-entry-button"
                    onClick={() => deleteEntry(entry.id)}
                  >
                    ×
                  </button>
                </div>

                <div className="entry-fields">
                  <div className="field-group">
                    <label className="field-label">Question</label>
                    <input
                      type="text"
                      className="entry-input"
                      placeholder="Enter question"
                      value={entry.title}
                      onChange={(e) =>
                        updateEntry(entry.id, "title", e.target.value)
                      }
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label">Description (Optional)</label>
                    <textarea
                      className="entry-textarea"
                      placeholder="Add additional context or instructions"
                      value={entry.description}
                      onChange={(e) =>
                        updateEntry(entry.id, "description", e.target.value)
                      }
                    />
                  </div>

                  {(entry.type === "multiple-choice" || entry.type === "checkbox") && (
                    <div className="field-group">
                      <label className="field-label">
                        {entry.type === "checkbox" ? "Selectable Options" : "Options"}
                      </label>
                      <div className="options-list">
                        {entry.options?.map((option, optIndex) => (
                          <div key={optIndex} className="option-item">
                            <input
                              type="text"
                              className="option-input"
                              placeholder={`Option ${optIndex + 1}`}
                              value={option}
                              onChange={(e) =>
                                updateOption(entry.id, optIndex, e.target.value)
                              }
                            />
                            {entry.options && entry.options.length > 1 && (
                              <button
                                className="remove-option-button"
                                onClick={() => removeOption(entry.id, optIndex)}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          className="add-option-button"
                          onClick={() => addOption(entry.id)}
                        >
                          + Add Option
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button 
            className="save-post-button" 
            onClick={handleSavePost}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Post"}
          </button>
        </div>

        {showEntryMenu && (
          <>
            <div
              className="overlay"
              onClick={() => setShowEntryMenu(false)}
            ></div>
            <div className="entry-type-menu">
              <h2 className="menu-title">Select Entry Type</h2>
              <div className="menu-options">
                <button
                  className="menu-option"
                  onClick={() => addEntry("text")}
                >
                  <div className="option-icon">📝</div>
                  <div className="option-content">
                    <h3 className="option-name">Text Field</h3>
                    <p className="option-description">
                      Single or multi-line text response
                    </p>
                  </div>
                </button>

                <button
                  className="menu-option"
                  onClick={() => addEntry("checkbox")}
                >
                  <div className="option-icon">✓</div>
                  <div className="option-content">
                    <h3 className="option-name">Checkbox</h3>
                    <p className="option-description">
                      Yes/No or agree/disagree option
                    </p>
                  </div>
                </button>

                <button
                  className="menu-option"
                  onClick={() => addEntry("multiple-choice")}
                >
                  <div className="option-icon">◉</div>
                  <div className="option-content">
                    <h3 className="option-name">Multiple Choice</h3>
                    <p className="option-description">
                      Select from predefined options
                    </p>
                  </div>
                </button>
              </div>
              <button
                className="cancel-button"
                onClick={() => setShowEntryMenu(false)}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default PostCreationPage;
