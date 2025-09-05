"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { loadNotes, saveNotes, createNote, type Note, serializeNotes, parseNotes, backupNotes, restoreBackup, getBackupMeta, markPending, markAllSynced } from "@/lib/notes"
import { RuleBasedTagger } from "@/lib/rule-based-tagger"
import { AIQueueManager } from "@/lib/ai-queue"
import { GeminiTaggingService } from "@/lib/gemini-tagging"
import { Toaster, showSuccess } from "@/components/toaster-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Hash, Clock, Edit3, Filter, Search, X } from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { BottomTabs } from "@/components/bottom-tabs"
import { ItemCard } from "@/components/item-card"
import { StatsDisplay } from "@/components/stats-display"
import { OfflineIndicator } from "@/components/offline-indicator"
import { InstallPrompt } from "@/components/install-prompt"
import { TimelineView } from "@/components/timeline-view"

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
  const importRef = useRef<HTMLInputElement>(null)
  const backupMeta = getBackupMeta()
  const tagger = new RuleBasedTagger()
  const aiQueue = new AIQueueManager()

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

      // Tab navigation (Cmd/Ctrl + 1/2/3)
      if (!isSearchOpen && (e.metaKey || e.ctrlKey)) {
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

  // When back online, mark pending as synced and toast
  useEffect(() => {
    const on = () => {
      setNotes((prev) => {
        const hadPending = prev.some((n) => n.pending)
        const next = markAllSynced(prev)
        saveNotes(next)
        if (hadPending) showSuccess("オンラインに復帰しました。同期が完了しました。")
        return next
      })
    }
    window.addEventListener("online", on)
    return () => window.removeEventListener("online", on)
  }, [])

  // B6: process AI queue when online and update UI
  useEffect(() => {
    let cancelled = false
    if (typeof navigator !== "undefined" && !navigator.onLine) return
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string | undefined
    if (!apiKey) return
    const svc = new GeminiTaggingService({ apiKey })
    const tick = async () => {
      if (cancelled) return
      const processed = await aiQueue.processOne(async (item) => {
        const res = await svc.tag(item.content)
        return { tags: res.tags, confidence: res.confidence }
      })
      if (processed && processed.status === "done") {
        const aiTags = processed.result?.tags ?? []
        const conf = processed.result?.confidence
        setNotes((prev) =>
          prev.map((n) =>
            n.id === processed.noteId
              ? {
                  ...n,
                  tags: Array.from(new Set([...(n.tags || []), ...aiTags])),
                  aiTags: aiTags,
                  aiTagged: true,
                  aiConfidence: typeof conf === "number" ? conf : n.aiConfidence,
                  processingStatus: "done",
                }
              : n
          )
        )
      } else if (processed && processed.status === "error") {
        setNotes((prev) => prev.map((n) => (n.id === processed.noteId ? { ...n, processingStatus: "error" } : n)))
      }
      setTimeout(tick, 0)
    }
    tick()
    return () => {
      cancelled = true
    }
  }, [])

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

    let newNote: Note = createNote({ content: inputValue, tags })
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      newNote = markPending(newNote)
    }

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (e.metaKey || e.ctrlKey) {
        saveNote()
        requestAnimationFrame(() => inputRef.current?.focus())
      } else {
        saveNote()
      }
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

  const getRecentNotes = () =>
    [...notes]
      .sort((a, b) => {
        const at = a.timestamp?.getTime?.() ?? 0
        const bt = b.timestamp?.getTime?.() ?? 0
        if (bt !== at) return bt - at
        return b.id.localeCompare(a.id)
      })
      .slice(0, 3)

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
      <Toaster position="top-center" richColors />
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
                      <ItemCard
                        key={note.id}
                        note={note}
                        onToggleComplete={toggleNoteComplete}
                        showDate="dateTime"
                        highlightQuery={searchQuery}
                      />
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
          <InstallPrompt />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSearchOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Search className="w-4 h-4" />
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                const text = await file.text()
                const imported = parseNotes(text)
                if (!imported.length) throw new Error("No valid notes")
                if (window.confirm("現在のデータをバックアップしてから置き換えます。よろしいですか？")) {
                  backupNotes()
                  setNotes(imported)
                  saveNotes(imported)
                }
              } catch (err) {
                console.error(err)
                alert("インポートに失敗しました。ファイル形式を確認してください。")
              } finally {
                e.target.value = ""
              }
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              try {
                const json = serializeNotes(notes)
                const blob = new Blob([json], { type: "application/json" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                const ts = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19)
                a.href = url
                a.download = `tadomemo-export-${ts}.json`
                document.body.appendChild(a)
                a.click()
                a.remove()
                URL.revokeObjectURL(url)
              } catch (err) {
                console.error(err)
                alert("エクスポートに失敗しました。")
              }
            }}
            className="text-xs"
          >
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => importRef.current?.click()}
            className="text-xs"
          >
            Import
          </Button>
          {backupMeta.exists && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const restored = restoreBackup()
                if (restored) setNotes(restored)
                else alert("バックアップの復元に失敗しました。")
              }}
              className="text-xs"
              title={backupMeta.at ? `Backup: ${backupMeta.at.toLocaleString()}` : undefined}
            >
              Restore
            </Button>
          )}
          <div className="flex items-center gap-2">
            <OfflineIndicator />
            <StatsDisplay notes={notes} />
          </div>
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
                  onKeyDown={handleKeyDown}
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
                    className={`p-3 cursor-pointer transition-colors border ${selectedTags.includes(tag)
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

        {activeTab === "timeline" && <TimelineView notes={notes} onToggleComplete={toggleNoteComplete} />}
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
