# Changelog

## [1.0.2](https://github.com/AFOJ/dossier/compare/dossier-v1.0.1...dossier-v1.0.2) (2026-09-04)


### Bug Fixes

* run wrangler directly to avoid Node 20 action deprecation ([252d818](https://github.com/AFOJ/dossier/commit/252d81883d03782c5fc769192fe3e6a759f2ebe6))
* use career documents wording in profile copy ([6847130](https://github.com/AFOJ/dossier/commit/6847130b9c27ac8e57b7891435cc59b55ec973ef))

## [1.0.1](https://github.com/AFOJ/dossier/compare/dossier-v1.0.0...dossier-v1.0.1) (2026-09-04)


### Bug Fixes

* deploy to Cloudflare from release workflow ([760dd14](https://github.com/AFOJ/dossier/commit/760dd14bdf6d8303153eca99c184787d9cc98a49))

## [1.0.0](https://github.com/AFOJ/dossier/compare/dossier-v0.2.0...dossier-v1.0.0) (2026-09-04)


### ⚠ BREAKING CHANGES

* dossier is now live; pushes to main no longer suffice for publishing, releases trigger production deploys.

### Features

* go live with Cloudflare Workers deploys on release ([5abb425](https://github.com/AFOJ/dossier/commit/5abb425c60e08c8c036ff632610e42c153a54360))


### Bug Fixes

* accept explicit null contact in resume payload schema ([67192aa](https://github.com/AFOJ/dossier/commit/67192aa756a71c4d7571298bff0bc5652a2916d0))
* allow section-less resumes to round-trip through export and upload ([6a96d17](https://github.com/AFOJ/dossier/commit/6a96d17c38cc765e0276cfaf75a34cc2c493474a))
* preserve unsynced contact on resume upload, import and duplicate ([6b0ed8a](https://github.com/AFOJ/dossier/commit/6b0ed8aa8441df54a078e07ccde736fbd02d61fd))
* require a role per company and default new roles to not present ([4017005](https://github.com/AFOJ/dossier/commit/4017005e589ad6a500f3a3675eec3551bfc0b10f))
* resume upload round-trip, role defaults and company guardrails ([8c74144](https://github.com/AFOJ/dossier/commit/8c741443fba034282439b9760f71a985d0209613))

## [0.2.0](https://github.com/AFOJ/dossier/compare/dossier-v0.1.0...dossier-v0.2.0) (2026-09-04)


### Features

* add JSON data export and update delete copy to recommend exporting ([c256549](https://github.com/AFOJ/dossier/commit/c25654953c0d707aa57978b7f0cdd907a41fbc97))
* add profile page with editing, export stub, and delete flow ([590260a](https://github.com/AFOJ/dossier/commit/590260a94cd8d647f2ff147fbe015c86b7fabcf7))
* add resume JSON upload functionality ([#12](https://github.com/AFOJ/dossier/issues/12)) ([26695eb](https://github.com/AFOJ/dossier/commit/26695eba14ee5f22752230ba47e1cbd59b3f606c))
* add resume previews ([#11](https://github.com/AFOJ/dossier/issues/11)) ([42e1669](https://github.com/AFOJ/dossier/commit/42e16693c36936490ade22627c8309365641358f))
* add toast system with stacked notifications ([590812d](https://github.com/AFOJ/dossier/commit/590812d35954292ef7e6b8f9412c253f9aa218f4))
* add toast system with stacked notifications ([746ea9b](https://github.com/AFOJ/dossier/commit/746ea9bb4359baf3771c7d0fbd04ad8a2043fcac))
* edit resume page with guardrails and builder polish ([#10](https://github.com/AFOJ/dossier/issues/10)) ([ffbffef](https://github.com/AFOJ/dossier/commit/ffbffef941878ea26fbaaa67bd64067d359ca2cb))
* profile management with editing, data export/import, and deletion ([cb31ff8](https://github.com/AFOJ/dossier/commit/cb31ff842cb985458f1c75782f74b6e28f7323df))
* resume creation page with section builders ([#8](https://github.com/AFOJ/dossier/issues/8)) ([f6da23e](https://github.com/AFOJ/dossier/commit/f6da23e8b002b5a3835385a37f89991374b44137))
* show toast feedback on resume duplication and deletion ([31429b5](https://github.com/AFOJ/dossier/commit/31429b5f914639b2f59273dd348c899358dd00e9))


### Bug Fixes

* address review feedback on delete dialog and import restore behavior ([2e5944a](https://github.com/AFOJ/dossier/commit/2e5944a76f9647b961dbb76429eeaa75710cd06c))
* render modal provider and toaster within router context ([3b1631b](https://github.com/AFOJ/dossier/commit/3b1631ba2fd56b2f0c2e20636a50e3cfefdd5ed9))
* render spinner during initial loader hydration ([b86c78a](https://github.com/AFOJ/dossier/commit/b86c78a97e2bc6588a42e96b1e504636b629ecb8))
* restore inline error message in delete dialog for persistent feedback ([caa82d6](https://github.com/AFOJ/dossier/commit/caa82d6002f1d258a8c48e6bcbcbe4062393226b))

## 0.1.0 (2026-08-21)


### Features

* add Button component ([7d950f4](https://github.com/AFOJ/dossier/commit/7d950f408c797042d5473a5bef7467a0ebf97747))
* add client-side routing ([38abd57](https://github.com/AFOJ/dossier/commit/38abd57beb5f11017be2772e95f90a76ebc0f427))
* add customizable dismissal options for modals ([842ed0f](https://github.com/AFOJ/dossier/commit/842ed0fd84ee52c260eeffb323554fda5b837659))
* add delete resume functionality with confirmation modal ([8bcc720](https://github.com/AFOJ/dossier/commit/8bcc720296d5d03207b1ec6c3f6249393332f9a4))
* add error handling for non-existent routes with ErrorBoundary ([ac88b68](https://github.com/AFOJ/dossier/commit/ac88b68a39e68a919e72464629a149a14105f00d))
* add Field and Input components ([b4668fe](https://github.com/AFOJ/dossier/commit/b4668fe9212b38fd75c8df135729858555f757dd))
* add Inter and Google Sans font families ([e34a589](https://github.com/AFOJ/dossier/commit/e34a58964fa4174193a12c5f1e99d7cdfbc648ae))
* add profile and resume data models with CRUD operations ([bab6809](https://github.com/AFOJ/dossier/commit/bab680959c9d332705a2d092191a5dd80b9465db))
* add responsive sidebar layout for protected routes ([be5c9dc](https://github.com/AFOJ/dossier/commit/be5c9dcd1632e16467ed1097f59838316af38a7a))
* add SearchInput component ([20627b3](https://github.com/AFOJ/dossier/commit/20627b37d469be4e2a7e813343237d158ba6172f))
* add Typography components for headings and subheading ([5508f1c](https://github.com/AFOJ/dossier/commit/5508f1cf6cfee916e7c11bf31c534726774a4660))
* add usePageTitle hook and integrate it into CreateProfilePage ([7a124b9](https://github.com/AFOJ/dossier/commit/7a124b9faaf463f7bd8a0d778324e0546565caf4))
* add utility functions for class name merging with clsx and tailwind-merge ([a9c90f0](https://github.com/AFOJ/dossier/commit/a9c90f0505e625fed7993edef0f2b2d0ad403233))
* enhance social link inputs with error handling ([5c2fe5b](https://github.com/AFOJ/dossier/commit/5c2fe5b22aa76458d91b711bce60fc076e78130c))
* implement ErrorBoundary component and integrate it into routing ([b542a50](https://github.com/AFOJ/dossier/commit/b542a5059a39757b8360255b33c790f2a9d3326a))
* implement imperative modal ([28307e9](https://github.com/AFOJ/dossier/commit/28307e9fc63f773dc11d45ade7081480ceb058c8))
* implement profile submission logic with error handling ([658416c](https://github.com/AFOJ/dossier/commit/658416cc162a8e928fdec71342c5e661d9429aef))
* implement protected route data hook and loaders for routing ([18d010c](https://github.com/AFOJ/dossier/commit/18d010cf34f989a80fb4f2dd69a40b277d0de9ac))
* implement resume pagination and listing functionality ([a6fad62](https://github.com/AFOJ/dossier/commit/a6fad62e2c2daaaef6f28fe0c76223100a9a47b4))
* integrate Zod for form validation in profile creation ([fa7445a](https://github.com/AFOJ/dossier/commit/fa7445abdaa2165e168f4e9299d4217165078bd4))
* replace Hugeicons with custom isometric icons for empty states ([d9c5a9d](https://github.com/AFOJ/dossier/commit/d9c5a9d9b6c22e3bc7f8894667fcea6a5dbb16f1))
* scaffold create, edit, upload, and view resume pages and profile page ([878e55c](https://github.com/AFOJ/dossier/commit/878e55c36f76b974bacd56d4cfd179314dace12a))
* **wip:** implement profile creation page with form handling and validation ([d0cc394](https://github.com/AFOJ/dossier/commit/d0cc394135051f0124e98a609b93606558937944))


### Bug Fixes

* configure release-please via config and manifest files ([84f55ea](https://github.com/AFOJ/dossier/commit/84f55eaf084f5fd93614c53c07eb65720ac80508))
* correct field registration for Job Title ([a5d0d2c](https://github.com/AFOJ/dossier/commit/a5d0d2c95e48893939ec9f65fccf57102fdc6801))
* set document title on the error boundary page ([dbf0650](https://github.com/AFOJ/dossier/commit/dbf065087564cc029b76a8de9be6a9e8e72f562d))
* update primary button background color for better visibility ([cc6f3f4](https://github.com/AFOJ/dossier/commit/cc6f3f4da56f2e019cc3a1a2dacef813c7f34265))
* **wip:** stabilise resume list search and loading states ([e998c16](https://github.com/AFOJ/dossier/commit/e998c16209af90fe269906f6cce48939fc18a190))
* wrap long search queries in no-results state to prevent overflow ([07ee1e8](https://github.com/AFOJ/dossier/commit/07ee1e838fa1b92b22a61b47d1f8f2203aeaa05f))
