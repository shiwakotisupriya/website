# Supriya Shiwakoti - portfolio

A dark-themed responsive static portfolio for GitHub Pages. No build step or API keys. Three.js 0.180.0 is bundled locally in vendor/three/ with its MIT license. Google Fonts is optional; system fonts provide an offline fallback.

## Preview

Open index.html directly, or run `python -m http.server 8000` in this folder and visit http://localhost:8000.

## Publish on GitHub Pages

1. Upload this folder's contents to your existing shiwakotisupriya/website repository, preserving images/ and resume/. The index.html file must sit at the repository root, not inside another website folder.
2. In the repository, open Settings > Pages. Select Deploy from a branch, main, and / (root), then Save. If this is already configured, uploading the new files triggers deployment.
3. Open the URL shown in GitHub Pages after deployment succeeds.

All assets use relative paths, so this works at a repository subpath or custom domain. Email links open the visitor's email app. There is no contact form or backend to configure.

## Update content

- index.html: biography, projects, skills, links, experience, and education.
- style.css: colours, typography, and responsive layout.
- script.js: mobile navigation and active section state.
- images/profile.jpg: portrait.
- resume/Supriya_Shiwakoti_Resume.pdf: replace when updating the CV.

Add direct project repository or live-demo links when available. Project illustrations are conceptual, not screenshots. Project overviews expand with native details controls.

## Content sources

The upgraded CV (A:/Personal/CV_SUPRIYA.pdf) is the source for experience, education, selected projects, skills, certifications, and ACS membership. It supersedes the earlier CV. The supplied LinkedIn URL is retained; the profile was not accessible for automated review. The downloadable CV is the original supplied PDF and retains its contents and contact details. The phone number is available in the CV rather than repeated on the public page.

## Accessibility and performance

Semantic landmarks, skip link, visible keyboard focus, native details elements, mobile menu with expanded state and Escape handling, reduced-motion support, and readable content without JavaScript. No animation framework or third-party JavaScript is required.

## Theme

Midnight navy (#0B1120), dark slate cards and navigation (#151E2E), soft white headings (#F8FAFC), light grey body text (#CBD5E1), teal accents (#2DD4BF), and slate borders (#2A3649). Inter typography. Teal buttons use navy text. 3D accents match the palette; the ACS logo retains its brand colours.

## Motion

One-time scroll reveals, short staggered entrances, project and button hover feedback, animated project overview content, and a brief mobile menu entrance. Uses native IntersectionObserver and Web Animations APIs without third-party scripts. Content is visible without animation support. Reduced-motion preferences disable motion and cancel running entrances; hover effects are limited to devices with a precise pointer.

Project cards enter on every viewport entry from alternating sides with a small rotation as they reach the viewport. Movement is smaller on mobile, and respects reduced-motion preferences.

Project rotation starts when half the card is visible (half the viewport for cards taller than the screen), and resets only after the card fully leaves the viewport.

## Three.js and 3D effects

Use Live Server or another HTTP server to load scene.js and its local ES modules; opening index.html directly may show only static artwork. Orbital rings frame the portrait and a rotating 3D network replaces the first project illustration when WebGL is available. Cards respond to a mouse with gentle perspective tilt. Render resolution is capped, off-screen scenes pause, background tabs pause, and reduced-motion mode renders static scenes. The original illustration remains if the library or WebGL cannot load. Include scene.js and vendor/ when publishing.

## Career positioning

The portfolio presents a move into data analytics and data science, with professional software development as the foundation. The academic machine learning project is featured first; employment titles remain unchanged. Data skills and career interests are distinguished from professional software experience. The downloadable CV remains the supplied upgraded original.

The rounded portrait sits inside revolving orbital rings. Its first entrance assembles hexagonal fragments of the photo, then removes the temporary fragments and displays the original image. Reduced motion, resize, tab changes, and the pause control restore the intact image.

## Professional membership

Dedicated ACS membership section. The original ACS logo was extracted from the supplied upgraded CV and retains its brand colours. Update images/acs-logo.png if replacing it with another approved logo.

The portrait orbit uses matching front and rear WebGL layers clipped at the photo plane, so revolving arcs pass both in front of and behind the stationary photo.

## Mobile layout

Keeps the desktop theme, 3D orbital portrait, photo assembly, project entrances, and ACS section. Phone layouts stack content for readability; tablets retain the two-column project composition. Navigation scrolls within short screens, controls have touch-sized targets, long skill labels sit above headings, and orbital layers are sized to stay within the page.
