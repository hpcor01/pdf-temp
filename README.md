# Editor de Imagem - Archí

## Performance Optimizations

This project has been optimized for maximum performance based on Lighthouse audit findings:

### Key Optimizations Implemented:

- **Aggressive caching** for static assets with long-term cache headers
- **Preconnect** to external domains to reduce connection latency
- **Code splitting** through dynamic imports for heavy components

For detailed information about the optimizations, see [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md).

### Dynamic Imports

The application implements dynamic imports for code splitting. For implementation details and best practices, see [DYNAMIC_IMPORTS_GUIDE.md](DYNAMIC_IMPORTS_GUIDE.md).

### Build and Deployment

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```
