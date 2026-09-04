<p align="center">
  <img src="public/logo-badge.svg" alt="Dossier" width="200" height="200" />
</p>

<h1 align="center">Dossier</h1>

<p align="center">A local-first career document workspace</p>

## About

Dossier is a place to keep your career documents. You set up a profile once and reuse it across tailored documents.

Everything is stored locally in your browser, so there is no account to create. When you want a PDF, the app sends your document to a rendering service and gives you the file back. The file is cached in your browser so you can view it again without waiting.

## Development

This app was built with React, Vite, and TypeScript.

To run it locally:

```bash
# Clone the repository
git clone https://github.com/AFOJ/dossier.git

# Change to the project directory
cd dossier

# Install dependencies
pnpm install

# Copy the example environment file
cp .env.example .env

# Run the development server
pnpm start
```

You should now be able to view the app in your browser.

PDF rendering is handled by a separate service, [dossier-server](https://github.com/AFOJ/dossier-server).

### Testing

Tests live alongside the source files and end in `.test.ts` or `.test.tsx`.

You can run them with:

```bash
pnpm test
```

You can check linting and the production build with:

```bash
pnpm lint
pnpm build
```

## Releases

This repo uses Conventional Commits.

`feat!` bumps the major version, `feat` bumps the minor version, and `fix` bumps the patch version. Anything else does not trigger a release and does not appear in the changelog.

When a release-worthy commit lands on main, release-please opens a release pull request that bumps the version and updates the changelog. Merging that pull request creates the GitHub release.

See [CHANGELOG.md](./CHANGELOG.md) for the full history.
