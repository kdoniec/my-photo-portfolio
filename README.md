# My Photo Portfolio

A modern, professional photography portfolio web application that replaces social media profiles as the primary showcase for photographers. Built with Astro 5, React 19, and Supabase.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [API Testing](#api-testing)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

My Photo Portfolio is a web application designed to give photographers full control over their online presence. It solves common problems with social media platforms such as:

- Algorithm limitations affecting content reach
- Lack of thematic organization options
- Distracting advertisements and unrelated content
- Unprofessional appearance mixing portfolio with personal posts
- Dependency on external platform policies
- Hidden or hard-to-find contact information

The application consists of two main parts:

- **Public Gallery** - A beautiful, responsive portfolio for visitors and potential clients
- **Admin Panel** - A comprehensive management interface for the photographer

### Key Features

- Category-based photo organization with masonry gallery layout
- Lightbox viewer with keyboard and touch navigation
- Drag-and-drop batch photo upload with progress indicators
- Client-side image compression and optimization
- SEO and Open Graph meta tags for social sharing
- Mobile-first responsive design
- Secure authentication for admin access

## Tech Stack

### Frontend

| Technology         | Purpose                                                       |
| ------------------ | ------------------------------------------------------------- |
| **Astro 5**        | SSG/SSR framework with View Transitions and Partial Hydration |
| **React 19**       | Interactive components (admin panel, lightbox, forms)         |
| **TypeScript 5**   | Type-safe development                                         |
| **Tailwind CSS 4** | Utility-first styling                                         |
| **Shadcn/ui**      | Accessible UI components built on Radix UI                    |

### Backend

| Technology             | Purpose                                                |
| ---------------------- | ------------------------------------------------------ |
| **Supabase**           | PostgreSQL database, authentication, and image storage |
| **Row Level Security** | Database-level access control                          |

### Infrastructure

| Technology         | Purpose                  |
| ------------------ | ------------------------ |
| **Docker**         | Containerized deployment |
| **DigitalOcean**   | Cloud hosting            |
| **GitHub Actions** | CI/CD pipelines          |

### Image Processing

| Technology                    | Purpose                                    |
| ----------------------------- | ------------------------------------------ |
| **browser-image-compression** | Client-side image compression and resizing |

## Getting Started Locally

### Prerequisites

- Node.js v22.14.0 (see `.nvmrc`)
- npm or yarn
- Supabase account (for backend services)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd 10x-project
   ```

2. Install the correct Node.js version:

   ```bash
   nvm use
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Set up environment variables:

   Create a `.env` file in the root directory with the following variables:

   ```env
   PUBLIC_SUPABASE_URL=your_supabase_project_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`.

## Available Scripts

| Script                | Description                                       |
| --------------------- | ------------------------------------------------- |
| `npm run dev`         | Start development server on port 3000             |
| `npm run build`       | Build for production                              |
| `npm run preview`     | Preview production build                          |
| `npm run lint`        | Run ESLint                                        |
| `npm run lint:fix`    | Fix ESLint issues automatically                   |
| `npm run format`      | Format code with Prettier                         |
| `npm run clean`       | Remove node_modules, dist, and .astro directories |
| `npm run clean:build` | Remove dist and .astro directories                |

## API Testing

The project uses [Bruno](https://www.usebruno.com/) for API testing. Bruno is a fast, git-friendly API client.

### Setup

1. Install Bruno from [usebruno.com](https://www.usebruno.com/)
2. Open the `bruno/` directory as a collection in Bruno
3. Select the `local` environment

### Available Collections

| Collection | Description                                    |
| ---------- | ---------------------------------------------- |
| `auth`     | Authentication endpoints (login)               |
| `profile`  | User profile management                        |
| `settings` | Site settings management                       |
| `categories` | Category CRUD operations                     |
| `photos`   | Photo CRUD and batch upload                    |
| `public`   | Public endpoints (no auth required)            |
| `stats`    | Usage statistics                               |

## Project Scope

### MVP Features

- Public photo gallery with category organization
- Admin panel for managing photos and categories
- "About Me" page with bio and contact information
- Single photographer authentication system
- Automatic image processing (thumbnail and preview generation)
- Responsive design (mobile-first)
- Basic SEO and Open Graph support
- Custom 404 page

### Technical Limits

| Parameter          | Value           |
| ------------------ | --------------- |
| Maximum photos     | 200             |
| Maximum categories | 10              |
| Maximum file size  | 10 MB           |
| Supported format   | JPEG            |
| Thumbnail size     | 400px width     |
| Preview size       | 1200px width    |
| Supabase Storage   | 1GB (free tier) |

### Out of Scope (Future Phases)

- Multi-photographer support / registration system
- Private galleries with password/link access
- Client interactions (favorites, comments, ordering)
- Tag system
- Watermarks on photos
- Custom domain support
- Additional image format support

## Project Status

This project is currently in **early development** (MVP phase).

### URL Structure

| Route               | Description                           |
| ------------------- | ------------------------------------- |
| `/`                 | Homepage with category tiles          |
| `/kategoria/[slug]` | Photo gallery for a specific category |
| `/o-mnie`           | About page with bio and contact info  |
| `/admin`            | Admin panel (protected)               |

## License

MIT
