# ChemScan Technical UI Specification

This document outlines the desired structure, windows, and interactive elements of the ChemScan platform.

## Technical Stack
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS
- **Components**: Radix UI / Shadcn UI primitives
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Design Pattern**: Glassmorphism, Bento Grid layouts, Layered Depth

---

## 1. Authentication & Onboarding Window
- **Hero Section**: Large typography with a feature list.
- **Login Card**: Centralized glassmorphism card.
- **Buttons**:
    - `Continue with Google` (Primary Auth Action)
    - `Demo Access` (Secondary Action)

## 2. Main Application Shell
- **Vertical Sidebar (Navigation)**:
    - `Generator` (Scan & Create)
    - `Library` (Saved Question Banks)
    - `Classroom` (Collaborative Sessions)
    - `Knowledge Map` (Visual Topic Graph)
- **Top Header**:
    - `Credits Badge`: Displays "X Credits remaining".
    - `Buy Credits Button`: Triggers payment modal.
    - `Profile Image`: Dropdown for "Account", "Settings", "Logout".

## 3. Generator Window (Command Center)
- **Mode Toggle**: Horizontal switch between `Upload Notes (Images/PDF/Docx)` and `Input Topics (Text)`.
- **Parameter Grid**:
    - `Subject Selection`: Dropdown (Physics, Chemistry, Maths, Biology).
    - `Exam Selection`: Multi-select badges (JEE, NEET, CBSE, ICSE).
    - `Target Class`: Dropdown/Slider (Class 10, 11, 12).
- **Upload Zone**: Drag-and-drop area with file list feedback.
- **Topic Input**: Multi-tag input field for up to 5 topics.
- **Action Button**: Large `Generate scan` button with loading state.
- **Strategic Window (Result View)**:
    - `Topic Summary`: Bento card with AI-generated abstract.
    - `Keywords`: Interactive pill badges.
    - `Question Carousel`: Horizontal swipeable cards containing:
        - Question text
        - 4 Option buttons (A, B, C, D)
        - Solution toggle
        - Source/Year metadata

## 4. Library Window
- **Search & Filter Bar**: Filter by subject, date, or exam type.
- **Question Bank Cards**: Grid layout. Each card has:
    - Metadata (Title, Date, Question Count)
    - Action Buttons:
        - `View`: Open detail modal
        - `Download PDF`: Export utility
        - `Export Docx`: Word format export
        - `Publish`: Share to community

## 5. Classroom Window
- **Dual Tab System**: `Host Session` vs `Join Session`.
- **Host View**: List of owned question banks with a `Create Room` button.
- **Join View**: Large 6-digit PIN input field and `Enter` button.
- **Active Session**: Real-time leaderboard and current question display.

## 6. Knowledge Map (Graph) Window
- **Canvas View**: Interactive 2D/3D map using `react-force-graph` or similar.
- **Nodes**: Represent topics.
- **Edges**: Represent semantic relationships.
- **Interaction**: Clicking a node reveals a `Quick Summary` sidebar.

## 7. Global Modals
- **Payment Modal**: Options for Credit Packs (Bronze, Silver, Gold).
- **Confirmation Modals**: For deleting or publishing content.
