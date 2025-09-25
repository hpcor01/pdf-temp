# Dynamic Imports Guide

This guide explains how to implement dynamic imports in the Kanban Image Editor application to reduce bundle size and improve performance through code splitting.

## What are Dynamic Imports?

Dynamic imports allow you to load modules on demand rather than including them in the initial bundle. This reduces the initial JavaScript payload and can significantly improve page load times.

## Implementation Examples

### 1. Component-Level Dynamic Imports

For components that are not immediately visible or are used conditionally:

```typescript
import dynamic from "next/dynamic";

// Basic dynamic import
const HeavyComponent = dynamic(() => import("@/components/heavy-component"));

// With SSR disabled (for components using browser APIs)
const ClientOnlyComponent = dynamic(
  () => import("@/components/client-only-component"),
  { ssr: false }
);

// With loading fallback
const ComponentWithLoading = dynamic(
  () => import("@/components/component-with-loading"),
  {
    loading: () => <p>Loading...</p>,
  }
);
```

### 2. Library-Level Dynamic Imports

For large third-party libraries used in specific parts of the application:

```typescript
// Import only when needed
const loadChartLibrary = () => import("chart.js");

// In your component or function
const handleClick = async () => {
  const { Chart } = await loadChartLibrary();
  // Use Chart here
};
```

## Best Practices

1. **Use loading placeholders**: Provide visual feedback while components are loading
2. **Disable SSR when necessary**: For components that use browser-only APIs
3. **Group related components**: Import multiple related components together when it makes sense
4. **Consider user experience**: Don't overuse dynamic imports for critical above-the-fold content

## Components That Benefit From Dynamic Imports

Based on the application structure, these components are good candidates for dynamic imports:

1. **ImageCard** - Only needed when images are displayed
2. **ColumnComponent** - Already implemented in Board component
3. **DragDropContext** - Heavy dependency from @hello-pangea/dnd
4. **PDF generation utilities** - Only needed when exporting
5. **Background removal utilities** - Only needed when that feature is used

## Example Implementation

Here's how we implemented dynamic imports for the ColumnComponent in the Board component:

```typescript
import dynamic from "next/dynamic";

// Dynamically import ColumnComponent for code splitting
const ColumnComponent = dynamic(() => import("./column"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col w-64 min-w-[16rem] rounded-lg shadow bg-card animate-pulse">
      <div className="p-3 border-b border-border">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
      <div className="p-2 space-y-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-gray-200 dark:bg-gray-700 rounded"
          ></div>
        ))}
      </div>
    </div>
  ),
});
```

This implementation:

- Splits the ColumnComponent into a separate bundle
- Disables SSR since it uses client-side hooks
- Provides a loading skeleton for better UX
- Maintains the same API as the static import

## When NOT to Use Dynamic Imports

1. **Above-the-fold critical content**: Content that users see immediately
2. **Small components**: Components that are small in size (less than a few KB)
3. **Frequently used components**: Components that appear on most pages
4. **Layout components**: Header, footer, and other layout elements

## Monitoring Impact

To measure the impact of dynamic imports:

1. Check bundle sizes before and after implementation
2. Monitor Core Web Vitals, especially Largest Contentful Paint (LCP)
3. Use browser DevTools to verify that bundles are loaded on demand
4. Test user experience on slower network connections
