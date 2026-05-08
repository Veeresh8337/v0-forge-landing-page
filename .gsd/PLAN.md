# Phase 2: Public Profiles, Embedded Media, & Optimized Fetching

## Overview
We need to create the public-facing profile pages (`/profile/[id]`) where clients can view a freelancer's complete profile, embedded work samples, and reviews. We also need to optimize our data fetching using React Suspense and parallel fetching.

## Tasks

<task type="auto">
  <name>Create Video Embed Component</name>
  <files>
    components/forge/video-embed.tsx
  </files>
  <action>
    Create a reusable React component that takes a raw YouTube or Vimeo URL and converts it into a responsive, embedded `iframe` so videos play directly inside the platform without redirecting the user.
  </action>
  <verify>Component parses standard video URLs and renders an iframe.</verify>
  <done>VideoEmbed component is created.</done>
</task>

<task type="auto">
  <name>Build Public Profile Page</name>
  <files>
    app/profile/[id]/page.tsx
  </files>
  <action>
    Create a server-rendered dynamic route that fetches the freelancer's profile, their reviews, and their completed projects simultaneously (parallel fetching for speed).
    The page will show:
    - Profile header (Avatar, Name, Role, Location, Bio)
    - Social/External Links
    - Embedded Video Samples (using the component from Task 1)
    - Ratings and Reviews
  </action>
  <verify>Page loads fast with parallel data fetching and renders without errors.</verify>
  <done>Public profile page is live.</done>
</task>

<task type="auto">
  <name>Connect Talent Feed to Profiles</name>
  <files>
    app/talent/page.tsx
    components/forge/talent-card.tsx
  </files>
  <action>
    Update the "View Details" buttons on the Talent Board to properly route to `/profile/[id]`. Optimize the talent feed fetching with React Suspense.
  </action>
  <verify>Clicking on a freelancer links to their new profile page.</verify>
  <done>Talent directory is connected to individual profiles.</done>
</task>
