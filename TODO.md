# TODO: Fix Biome Linting and Formatting Issues

## Formatting Issues (Biome Check)
- [x] Fix formatting in `.vscode/settings.json` (long lines, trailing commas)
- [x] Fix formatting in `biome.json` (indentation, spacing)
- [x] Fix formatting in `components.json` (indentation, spacing)
- [x] Fix formatting in `next.config.ts` (indentation, spacing, comments)
- [x] Fix formatting in `package.json` (indentation, spacing)
- [x] Fix formatting in `postcss.config.mjs` (indentation, spacing)
- [x] Fix formatting in `public/manifest.json` (indentation, spacing)
- [x] Fix formatting in `src/types/kanban.d.ts` (indentation, spacing)
- [x] Fix formatting in `src/types/language.d.ts` (indentation, spacing)
- [x] Fix formatting in `src/types/loading-overlay.d.ts` (indentation, spacing)
- [x] Fix formatting in `src/types/pdf-toggle.d.ts` (indentation, spacing)
- [x] Fix formatting in `src/types/pdf.d.ts` (indentation, spacing)

## Linting Issues (Biome Lint)

### src/components/background-toggle.tsx
- [x] Fix unnecessary ternary expression: `checked={isHydrated ? false : false}` → `checked={false}`
- [x] Remove unused parameters: `isProcessing` and `isRemoveBgChecked`

### src/components/previewer-image.tsx
- [x] Replace `<img>` with Next.js `<Image>` component for better performance
- [x] Add `role` attribute to interactive div element (cursor-crosshair with onMouseDown)
- [x] Associate label with slider control using `htmlFor` or wrap input
- [x] Change React import to `import type React` since it's only used as type
- [x] Remove unused imports: `motion`, `Upload`, `Download`, `RotateCcw`, `ImageIcon`
- [x] Remove or prefix unused variables: `closePreview`, `croppedImage`
- [x] Fix useEffect dependencies: Add `handleMouseMove` and `handleMouseUp` to dependency array
- [x] Fix useEffect dependencies: Add `handleRemoveBackground` to dependency array
- [x] Remove unnecessary `dragStart` from useEffect dependency array

## Verification
- [x] Run `npx biome check` to ensure all formatting issues are resolved
- [x] Run `npx biome lint` to ensure all linting issues are resolved
- [x] Test application functionality after fixes
