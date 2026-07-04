# Project: Universal Link Video Streaming Web App

You are a senior full-stack engineer, software architect, and UI/UX designer.

Your task is to build a production-quality web application using **Next.js (App Router)** and **HeroUI** as the primary UI library.

## Goal

Create a modern web application where users can paste a direct video/movie URL and instantly stream it inside a custom player.

The application should prioritize smooth playback, efficient bandwidth usage, resumable watching, and an elegant user experience.

---

# Core Requirements

## 1. Homepage

The homepage should include:

* Large modern hero section
* URL input
* "Play" button
* Recently watched history
* Theme switch
* Responsive layout
* Beautiful HeroUI components

After the user pastes a valid link, redirect to

```
/watch
```

with the URL encoded as a query parameter.

---

# 2. Video Streaming Architecture

This is the most important part.

The application should **NOT attempt to download the entire file at once.**

Instead:

* Use HTTP Range Requests whenever the server supports them.
* Stream the video progressively.
* Download small chunks of the video.
* Buffer intelligently.

Desired strategy:

Current playback

↓

Current chunk

↓

Preload next 4 chunks

↓

Maintain cache

↓

Delete old chunks automatically

Example:

If chunk size = 5 minutes

Playing:

10–15

Keep:

15–20

20–25

25–30

30–35

Once playback reaches:

20

Delete:

10–15

Continue downloading

35–40

40–45

etc.

The cache should never grow unnecessarily.

---

# 3. Long Video Optimization

If video duration exceeds 40 minutes:

Persist approximately the last 10 minutes behind the current playback position.

Example:

Current time:

72 minutes

Keep:

62–72

72–77

77–82

82–87

87–92

Everything before 62 minutes can be safely removed unless the user seeks backward.

If the user jumps backward:

Re-request only the required chunks.

---

# 4. Chunk Manager

Create an independent module responsible for:

* requesting chunks
* storing chunks
* deleting old chunks
* predicting future chunks
* handling seek events
* avoiding duplicate downloads
* retrying failed downloads

The architecture should be modular and reusable.

---

# 5. Smart Buffering

Implement adaptive buffering.

Depending on:

* network speed
* playback speed
* buffer health

Increase or decrease the number of preloaded chunks.

Example:

Fast network

↓

Load 6 chunks

Slow network

↓

Load 2 chunks

---

# 6. Local Cache

Use:

* IndexedDB for video chunks
* LocalStorage for preferences
* Session memory for active playback state

Never store huge videos permanently.

Implement automatic cleanup.

---

# 7. Video Player

Build a fully custom player.

Features:

* Play
* Pause
* Stop
* Seek bar
* Skip forward
* Skip backward
* Current time
* Duration
* Buffer indicator
* Playback speed
* Picture in Picture
* Fullscreen
* Keyboard shortcuts
* Mouse controls
* Volume slider
* Mute
* Captions
* Subtitle toggle
* Subtitle upload (.vtt)
* Audio track selector (when available)
* Quality selector (when multiple streams exist)
* Thumbnail preview on timeline (optional)
* Double click fullscreen
* Space to play/pause
* Arrow keys seek
* Media Session API support

---

# 8. Resume Watching

Store:

* URL
* playback position
* duration
* timestamp

inside LocalStorage.

When reopening:

Ask:

Continue watching?

Resume from:

01:17:35

Yes / No

---

# 9. History

Create history cards.

Each card should include:

* video title (if obtainable)
* thumbnail (if available)
* watched percentage
* last watched date
* resume button
* remove button

Persist locally.

---

# 10. Theme System

Implement:

* Light
* Dark
* System

Store preference.

Use HeroUI themes.

---

# 11. Settings

Settings page should include:

* theme
* autoplay
* default volume
* playback speed
* subtitles enabled
* cache size
* clear history
* clear cache

---

# 12. Error Handling

Gracefully handle:

* invalid URL
* unsupported server
* no range support
* network timeout
* CORS errors
* expired links
* unsupported codecs

Display user-friendly messages.

---

# 13. Performance

Optimize aggressively.

Requirements:

* React Server Components where appropriate
* Dynamic imports
* Lazy loading
* Memoization
* Virtualized history list
* Code splitting
* Image optimization
* Suspense
* Streaming
* Web Workers where beneficial
* Avoid unnecessary re-renders

---

# 14. Accessibility

Implement:

* keyboard navigation
* ARIA labels
* focus management
* color contrast
* screen reader support

---

# 15. Mobile Experience

Support:

* touch gestures
* responsive controls
* landscape mode
* safe-area insets
* fullscreen playback
* mobile browsers

---

# 16. UI Style

Use HeroUI components consistently.

Design language:

* modern
* glassmorphism (optional)
* rounded corners
* subtle shadows
* smooth animations
* responsive layout
* clean typography

Include tasteful loading states and skeletons.

---

# 17. Folder Structure

Organize the project cleanly with folders for:

* app
* components
* hooks
* services
* lib
* workers
* utils
* stores
* types
* styles

Use TypeScript throughout.

---

# 18. State Management

Use lightweight state management suitable for the application.

Keep player state isolated from UI state.

Persist only necessary values.

---

# 19. Testing

Prepare the project for:

* unit tests
* component tests
* integration tests

Include linting and formatting.

---

# 20. Code Quality

Requirements:

* TypeScript
* strict typing
* reusable components
* reusable hooks
* modular architecture
* clean code
* descriptive naming
* comments only where necessary
* no duplicated logic

---

# Deliverables

Generate:

* complete project architecture
* folder structure
* reusable components
* chunk manager
* streaming logic
* custom video player
* responsive UI
* settings page
* history page
* reusable hooks
* utilities
* caching system
* local persistence
* production-ready code

Write clean, maintainable, scalable code following modern React and Next.js best practices.

When implementing browser APIs such as HTTP Range Requests, IndexedDB, Media Source Extensions (MSE), and the Media Session API, detect browser capabilities and provide graceful fallbacks where features are unavailable.

Finally, explain the purpose of each major module and how the streaming pipeline works.
