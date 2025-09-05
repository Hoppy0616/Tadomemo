"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { loadNotes, saveNotes, createNote, type Note } from "@/lib/notes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Hash, Clock, Edit3, Filter, Search, X } from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { BottomTabs } from "@/components/bottom-tabs"
import { ItemCard } from "@/components/item-card"
import { StatsDisplay } from "@/components/stats-display"

// Note 型は lib/notes で定義

export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [inputValue, setInputValue] = useState("")
  const [activeTab, setActiveTab] = useState<"input" | "tags" | "timeline">("input")
  const [isAnimating, setIsAnimating] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Auto-focus input on mount and after saving
  useEffect(() => {
    if (activeTab === "input" && inputRef.current && !isSearchOpen) {
      inputRef.current.focus()
    }
  }, [activeTab, isAnimating, isSearchOpen])

  // Focus search input when search opens
  useEffect(() => {
    if (isSearchOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [isSearchOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsSearchOpen(true)
      }

      // Escape to close search
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false)
        setSearchQuery("")
      }

      // Tab navigation (1, 2, 3 keys)
      if (!isSearchOpen && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === "1") {
          e.preventDefault()
          setActiveTab("input")
        } else if (e.key === "2") {
          e.preventDefault()
          setActiveTab("tags")
        } else if (e.key === "3") {
          e.preventDefault()
          setActiveTab("timeline")
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isSearchOpen])

  // Load notes from storage on mount
  useEffect(() => {
    setIsLoading(true)
    setNotes(loadNotes())
    setIsLoading(false)
  }, [])

  // Persist notes on change
  useEffect(() => {
    if (!isLoading) {
      saveNotes(notes)
    }
  }, [notes, isLoading])

  const saveNote = () => {
    if (!inputValue.trim()) return

    // Auto-detect tags (words starting with #)
    const tagMatches = inputValue.match(/#\w+/g) || []
    const tags = tagMatches.map((tag) => tag.slice(1))

    // Determine category based on content
    const content = inputValue.toLowerCase()
    if (!tags.length) {
      if (content.includes("todo") || content.includes("task") || content.includes("do ")) {
        tags.push("ToDo")
      } else if (content.includes("idea") || content.includes("think") || content.includes("maybe")) {
        tags.push("Idea")
      } else {
        tags.push("Memo")
      }
    }

    const newNote: Note = createNote({ content: inputValue, tags })

    setNotes((prev) => [newNote, ...prev])
    setInputValue("")

    // Trigger save animation
    setIsAnimating(true)

    // Vibration feedback (if supported)
    if ("vibrate" in navigator) {
      navigator.vibrate(50)
    }

    setTimeout(() => setIsAnimating(false), 300)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveNote()
    }
  }

  const toggleNoteComplete = (id: string) => {
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, completed: !note.completed } : note)))
  }

  const getAllTags = () => {
    const tagCounts: Record<string, number> = {}
    notes.forEach((note) => {
      note.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    return tagCounts
  }

  const getFilteredNotes = () => {
    if (selectedTags.length === 0) return notes
    return notes.filter((note) => selectedTags.some((tag) => note.tags.includes(tag)))
  }

  const getSearchResults = () => {
    if (!searchQuery.trim()) return []

    const query = searchQuery.toLowerCase()
    return notes.filter(
      (note) =>
        note.content.toLowerCase().includes(query) || note.tags.some((tag) => tag.toLowerCase().includes(query)),
    )
  }

  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const clearTagFilters = () => {
    setSelectedTags([])
  }

  const getTodayNotesCount = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return notes.filter((note) => {
      const noteDate = new Date(note.timestamp)
      noteDate.setHours(0, 0, 0, 0)
      return noteDate.getTime() === today.getTime()
    }).length
  }

  const getRecentNotes = () => notes.slice(0, 3)

  const getTimelineGroups = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const thisWeekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000)

    const groups = {
      today: [] as Note[],
      yesterday: [] as Note[],
      thisWeek: [] as Note[],
      older: [] as Note[],
    }

    notes.forEach((note) => {
      const noteDate = new Date(note.timestamp.getFullYear(), note.timestamp.getMonth(), note.timestamp.getDate())

      if (noteDate.getTime() === today.getTime()) {
        groups.today.push(note)
      } else if (noteDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(note)
      } else if (noteDate.getTime() >= thisWeekStart.getTime()) {
        groups.thisWeek.push(note)
      } else {
        groups.older.push(note)
      }
    })

    return groups
  }

  const formatTimelineDate = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground font-mono">Loading tadomemo...</p>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes and tags..."
                className="flex-1 bg-card border-border focus:border-primary"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsSearchOpen(false)
                  setSearchQuery("")
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {searchQuery.trim() ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm text-muted-foreground uppercase tracking-wide">Search Results</h2>
                  <Badge variant="outline" className="text-xs">
                    {getSearchResults().length} found
                  </Badge>
                </div>

                {getSearchResults().length === 0 ? (
                  <Card className="p-6 bg-card border-border">
                    <div className="text-center">
                      <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No notes found matching "{searchQuery}"</p>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {getSearchResults().map((note) => (
                      <ItemCard key={note.id} note={note} onToggleComplete={toggleNoteComplete} showDate="dateTime" />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Start typing to search your notes...</p>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  Press Escape to close • Use Cmd/Ctrl+K to search
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header with counter and search */}
      <div className="flex justify-between items-center p-4 border-b border-border">
        <h1 className="text-xl font-bold text-primary">tadomemo</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSearchOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Search className="w-4 h-4" />
          </Button>
          <StatsDisplay notes={notes} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 pb-20">
        {activeTab === "input" && (
          <div className="space-y-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div className="flex gap-3 items-center">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="capture your thoughts..."
                  className="flex-1 text-lg py-6 bg-card border-border focus:border-primary transition-colors"
                  autoFocus
                />
                <Button
                  onClick={saveNote}
                  disabled={!inputValue.trim()}
                  size="lg"
                  className="px-6 py-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              {isAnimating && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                </div>
              )}
            </div>

            {/* Recent Notes */}
            <div className="space-y-3">
              <h2 className="text-sm text-muted-foreground uppercase tracking-wide">Recent Notes</h2>
              {getRecentNotes().length === 0 ? (
                <Card className="p-4 bg-card border-border">
                  <p className="text-muted-foreground text-center">No notes yet. Start capturing your thoughts!</p>
                </Card>
              ) : (
                getRecentNotes().map((note) => (
                  <ItemCard key={note.id} note={note} onToggleComplete={toggleNoteComplete} showDate="time" />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "tags" && (
          <div className="space-y-6">
            {/* Tag Statistics */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm text-muted-foreground uppercase tracking-wide">Tag Statistics</h2>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearTagFilters}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(getAllTags()).map(([tag, count]) => (
                  <Card
                    key={tag}
                    className={`p-3 cursor-pointer transition-colors border ${
                      selectedTags.includes(tag)
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:bg-card/80"
                    }`}
                    onClick={() => toggleTagFilter(tag)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{tag}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>

              {Object.keys(getAllTags()).length === 0 && (
                <Card className="p-6 bg-card border-border">
                  <div className="text-center">
                    <Hash className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No tags yet. Start adding notes to see tag statistics!</p>
                  </div>
                </Card>
              )}
            </div>

            {/* Active Filters */}
            {selectedTags.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs text-muted-foreground uppercase tracking-wide">Active Filters</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="default"
                      className="cursor-pointer bg-primary text-primary-foreground"
                      onClick={() => toggleTagFilter(tag)}
                    >
                      #{tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Filtered Notes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm text-muted-foreground uppercase tracking-wide">
                  {selectedTags.length > 0 ? "Filtered Notes" : "All Notes"}
                </h2>
                <Badge variant="outline" className="text-xs">
                  {getFilteredNotes().length} notes
                </Badge>
              </div>

              {getFilteredNotes().length === 0 ? (
                <Card className="p-6 bg-card border-border">
                  <div className="text-center">
                    <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      {selectedTags.length > 0
                        ? "No notes found with the selected tags."
                        : "No notes yet. Start capturing your thoughts!"}
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-3">
                  {getFilteredNotes().map((note) => (
                    <ItemCard
                      key={note.id}
                      note={note}
                      onToggleComplete={toggleNoteComplete}
                      selectedTags={selectedTags}
                      tagClickable
                      onClickTag={toggleTagFilter}
                      showDate="dateTime"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="space-y-6">
            {/* Timeline Groups */}
            {(() => {
              const timelineGroups = getTimelineGroups()
              const hasAnyNotes = notes.length > 0

              if (!hasAnyNotes) {
                return (
                  <Card className="p-6 bg-card border-border">
                    <div className="text-center">
                      <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No notes yet. Start capturing your thoughts!</p>
                    </div>
                  </Card>
                )
              }

              return (
                <>
                  {/* Today */}
                  {timelineGroups.today.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h2 className="text-sm text-muted-foreground uppercase tracking-wide font-mono">Today</h2>
                        <div className="flex-1 h-px bg-border"></div>
                        <Badge variant="outline" className="text-xs font-mono">
                          {timelineGroups.today.length}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {timelineGroups.today.map((note) => (
                          <ItemCard key={note.id} note={note} onToggleComplete={toggleNoteComplete} showDate="time" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Yesterday */}
                  {timelineGroups.yesterday.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h2 className="text-sm text-muted-foreground uppercase tracking-wide font-mono">Yesterday</h2>
                        <div className="flex-1 h-px bg-border"></div>
                        <Badge variant="outline" className="text-xs font-mono">
                          {timelineGroups.yesterday.length}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {timelineGroups.yesterday.map((note) => (
                          <ItemCard key={note.id} note={note} onToggleComplete={toggleNoteComplete} showDate="time" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* This Week */}
                  {timelineGroups.thisWeek.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h2 className="text-sm text-muted-foreground uppercase tracking-wide font-mono">This Week</h2>
                        <div className="flex-1 h-px bg-border"></div>
                        <Badge variant="outline" className="text-xs font-mono">
                          {timelineGroups.thisWeek.length}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {timelineGroups.thisWeek.map((note) => (
                          <ItemCard key={note.id} note={note} onToggleComplete={toggleNoteComplete} showDate="dateTime" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Older */}
                  {timelineGroups.older.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h2 className="text-sm text-muted-foreground uppercase tracking-wide font-mono">Older</h2>
                        <div className="flex-1 h-px bg-border"></div>
                        <Badge variant="outline" className="text-xs font-mono">
                          {timelineGroups.older.length}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {timelineGroups.older.map((note) => (
                          <ItemCard key={note.id} note={note} onToggleComplete={toggleNoteComplete} showDate="dateTime" />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {activeTab !== "input" && (
        <Button
          onClick={() => setActiveTab("input")}
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      <BottomTabs value={activeTab} onChange={setActiveTab} />
    </AppLayout>
  )
}
