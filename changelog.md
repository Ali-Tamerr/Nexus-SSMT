# Changelog

All notable changes to this project will be documented in this file.

---

## [v2.1] - 2026-03-22 — 2026-03-29

### Feature: Real-Time Collaboration & Security
- **Instant Sync:** Actions like deleting nodes, editing text, or moving items now update instantly for everyone looking at the same graph.
- **Access Control:** Implemented the ability to revoke collaborator access in real-time.
- **Collaboration Requests:** Added a notification system for when someone asks to join or edit your project.
- **Activity Tracking:** Added a "Recent Activity" dashboard so you can see who has visited or edited your study maps.

### Feature: Global Arabic Support & Canvas Polish
- **Arabic Language Support:** Integrated high-quality Arabic fonts and fixed text alignment to support Right-to-Left (RTL) writing perfectly.
- **Mobile Text Stability:** Fixed a common issue where text would overflow or look "stretched" on certain mobile browsers.
- **Smarter Editing:** Added the ability to double-click any text element to edit it instantly.
- **Tap-to-Place:** You can now simply tap anywhere on the screen to place a new node while using the toolbar.

### Bug Fixes
- **Gesture Conflict:** Fixed a bug on mobile where trying to move the screen (panning) would accidentally move a node.
- **Connection Descriptions:** Fixed an issue where the text describing the link between two nodes wasn't saving correctly.

---

## [v2.0] - 2026-02-25 — 2026-03-08

### Feature: Google Classroom & Sharing Power
- **Automatic Connection Recovery:** Fixed the "401 error"—the app now silently refreshes your Google connection so you never have to log in twice.
- **Bulk Import:** You can now select multiple assignments or materials from a Google Classroom course and add them to your graph all at once.
- **Dynamic Previews:** When you share a link to your graph on social media or Discord, it now shows a beautiful preview card with the project details.
- **Project Pinning:** Added the ability to "pin" your most important projects to the top of your collections.

### Bug Fixes
- **Selection Logic:** Fixed an issue where you couldn't click on a small shape if it was placed inside a larger one.
- **Ownership Loop:** Fixed a bug that occasionally sent the project owner to the "Guest" view instead of the "Editor" view.

---

## [v1.9] - 2026-02-20

### Modifications
- **The "Collections" Shift:** Formally rebranded **"Groups"** to **"Collections"** across the entire platform to better suit the academic theme.
- **Navigation Cleanup:** Relocated the **"Back to Dashboard"** button from the navbar to a more contextual position above the collection name.

### Bug Fixes
- **Smart Routing:** Updated the system to check ownership. **Project Owners** are now redirected directly to the **Project Editor** instead of the read-only guest preview.

---

## [v1.8] - 2026-02-13 — 2026-02-18

### Feature: Collection Management
- **Collection Previews:** Added a dedicated page to visualize **Project Collections** and their associated graphs.

### Modifications
- **Auth Sync:** Implemented client-side authentication synchronization. 
- **Multi-Account Support:** Enabled the ability to maintain two separate accounts (Standard vs. Google) using the same email address.
- **Core API Client:** Built a robust API client for knowledge management entities and authentication types.

### Bug Fixes
- **Persistence Fix:** Resolved a critical bug where users were logged out upon **page refresh** after Google OAuth sign-in.
- **Access Control:** Fixed owner redirection when navigating from the collections page to individual projects.
- **Mobile UI:** Fixed visibility issues for the **Groups** and **Selection Pane** on mobile devices.

---

## [v1.7] - 2026-02-13 — 2026-02-18

### Feature: Collection Management

- **Collection Previews:** Added a dedicated page to visualize **Project Collections** and their associated graphs.

### Modifications

- **Auth Sync:** Implemented **client-side authentication synchronization** 
- **Multi-Account Support:** Enabled the ability to maintain two separate accounts (Standard vs. Google) using the same email address.
- **Core API Client:** Built a robust API client for knowledge management entities and authentication types.

### Bug Fixes

- **Persistence Fix:** Resolved a critical bug where users were logged out upon **page refresh** after Google OAuth sign-in.
- **Access Control:** Fixed owner redirection when navigating from the collections page to individual projects.
- **Mobile UI:** Fixed visibility issues for the **Groups** and **Selection Pane** on mobile devices.

---

## [v1.6] - 2026-02-02 — 2026-02-03

### Feature: Google Classroom Integration

- **Full Integration:** Completed the three-phase implementation of the **Google Classroom API**.
- **Resource Referencing:** Students can now pull **Classroom materials** and set them as direct references for graph nodes.
- **Flexible Fetching:** Enabled data fetching from Google Classroom even for accounts not initially linked via Google OAuth.

### Bug Fixes

- **Material Locking:** Fixed issue where Classroom material rows remained "locked" after navigation.

---

## [v1.5] - 2026-01-31

### Feature: Advanced Navigation & Precision

- **Arrow Key Movement:** Added ability to move elements with arrow keys; supports `Shift` keyboard key for proportional/large jumps.

### Bug Fixes

- **Precision Panning:** Fixed middle-mouse key panning for smoother canvas navigation.
- **Auto-Save Logic:** Fixed issue where attachments and connections were added successfully without requiring a manual 'save changes' click.

---

## [v1.4] - 2026-01-30

### Bug Fixes

- **Preview Enhancement:** Fixed node/shape filtering in the preview pane and resolved scroll issues in popups.
- **Mobile Rendering:** Fixed sudden node/drawing enlargement issues triggered by swiping in pan mode.
- **Resize Logic:** Resolved flickering and shape disappearance bugs during resize actions.

---

## [v1.3] - 2026-01-27 — 2026-01-29

### Modifications

- **Mobile-First UI:** Applied comprehensive responsive design updates across all project pages.

### Bug Fixes

- **Build Optimization:** Resolved production build errors and data-fetching issues.
- **Data Integrity:** Fixed logic errors in separating account data and project ownership.

---

## [v1.2] - 2026-01-18 — 2026-01-26

### Feature: Dynamic Content & Exporting

- **Canvas Exporting:** Implemented PNG and JPG export functionality with intelligent cropping to fit graph bounds.
- **Collaboration Elements:** Modified share popup to include **QR Code** generation for quick mobile sharing.
- **Navigation Aids:** Added "Go back to content" button for quick re-centering on the active workspace.
- **Tabbed Groups:** Added 'Groups' (tabs) feature to categorize different sections of a knowledge graph.
- **Customization:** Integrated custom color pickers for nodes and shape components.

### Feature: Group & Node Logic

- **Drawing Tools:** Fixed rotation issues for circles/rhombuses and added a selection field/area tool.
- **Canvas Polish:** Blocked browser back/forward gestures during heavy swiping to prevent accidental navigation.

---

## [v1.1] - 2026-01-15 — 2026-01-17

### Feature: Tool Suite

- **Tool Suite:** Finalized the first stable versions of the Pen, Text, Eraser, and Node Connection tools.
- **History Management:** Implemented stable Undo/Redo functionality for all editor actions.

## [v1.0] - 2026-01-08 — 2026-01-14

### Feature: Core Graph Engine

- **Next.js 16 Foundation:** Initial architecture setup using the Next.js 16 App Router and **D3-force**.
- **State Management:** Implemented centralized store for node positions, connections, and individual coloring.
- **Persistence:** Shifted drawing data from local storage to a permanent database.
