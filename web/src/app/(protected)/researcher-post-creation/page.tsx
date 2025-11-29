"use client";
import React, { useState } from "react";
import "./page.css";
import Navbar from "../../components/Navbar";

interface FormEntry {
  id: string;
  type: "text" | "checkbox" | "multiple-choice";
  title: string;
  description: string;
  options?: string[];
}

const PostCreationPage: React.FC = () => {
  const [showEntryMenu, setShowEntryMenu] = useState(false);
  const [entries, setEntries] = useState<FormEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);

  const addEntry = (type: "text" | "checkbox" | "multiple-choice") => {
    const newEntry: FormEntry = {
      id: `entry-${Date.now()}`,
      type,
      title: "",
      description: "",
      options: type === "multiple-choice" ? [""] : undefined,
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          questions: entries.map((e) => ({
            type: e.type,
            question: e.title,
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
      <Navbar isLoggedIn={true} />
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
            />
            <textarea
              className="post-description-input"
              placeholder="Post Description (Describe the role, requirements, etc.)"
              value={postDescription}
              onChange={(e) => setPostDescription(e.target.value)}
            />
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

                  {entry.type === "multiple-choice" && (
                    <div className="field-group">
                      <label className="field-label">Options</label>
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
