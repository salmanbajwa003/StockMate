# PNPM Setup Guide

This project uses **pnpm** (performant npm) as the package manager instead of npm or yarn.

## Why pnpm?

- **Faster**: Up to 2x faster than npm
- **Disk efficient**: Uses a content-addressable store (saves disk space)
- **Strict**: Better dependency management and security
- **Monorepo friendly**: Great for scaling if needed
- **Compatible**: Works with all npm packages

## Installation

### Option 1: Using npm (recommended)

```bash
npm install -g pnpm
```

### Option 2: Using Corepack (comes with Node.js 16.13+)

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

### Option 3: Using Homebrew (macOS)

```bash
brew install pnpm
```

### Option 4: Using standalone script

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

## Verify Installation

```bash
pnpm --version
```

## Project Setup

### 1. Install Dependencies

```bash
pnpm install
```

This will:

- Read `package.json`
- Create/use `pnpm-lock.yaml` (similar to package-lock.json)
- Install packages to global store and link them

### 2. Run Development Server

```bash
pnpm start:dev
```

### 3. Build for Production

```bash
pnpm build
```

### 4. Run Tests

```bash
pnpm test
```

## Common Commands

| npm command            | pnpm equivalent      |
| ---------------------- | -------------------- |
| `npm install`          | `pnpm install`       |
| `npm install <pkg>`    | `pnpm add <pkg>`     |
| `npm install -D <pkg>` | `pnpm add -D <pkg>`  |
| `npm uninstall <pkg>`  | `pnpm remove <pkg>`  |
| `npm run <script>`     | `pnpm <script>`      |
| `npm run dev`          | `pnpm dev`           |
| `npm update`           | `pnpm update`        |
| `npx <command>`        | `pnpm dlx <command>` |

## Available Scripts

```bash
# Development
pnpm start:dev          # Start with hot reload
pnpm start:debug        # Start with debug mode

# Build
pnpm build              # Build for production

# Production
pnpm start:prod         # Run production build

# Testing
pnpm test               # Run unit tests
pnpm test:watch         # Run tests in watch mode
pnpm test:cov           # Run tests with coverage
pnpm test:e2e           # Run end-to-end tests

# Code Quality
pnpm lint               # Lint code
pnpm format             # Format code with Prettier

# Database
pnpm migration:generate # Generate migration
pnpm migration:run      # Run migrations
pnpm migration:revert   # Revert last migration
```

## Docker Usage

The Dockerfile has been configured to use pnpm:

### Build and Run with Docker

```bash
# Build image
docker build -t warehouse-management-system .

# Run container
docker run -p 3000:3000 warehouse-management-system

# Or use docker-compose
docker-compose up -d
```

The Dockerfile uses Corepack to enable pnpm, so no additional installation is needed.

## Adding New Dependencies

### Production Dependencies

```bash
pnpm add <package-name>

# Examples:
pnpm add axios
pnpm add @nestjs/mongoose
```

### Development Dependencies

```bash
pnpm add -D <package-name>

# Examples:
pnpm add -D @types/node
pnpm add -D eslint-plugin-import
```

### Global Dependencies

```bash
pnpm add -g <package-name>

# Examples:
pnpm add -g typescript
pnpm add -g @nestjs/cli
```

## Updating Dependencies

### Update all packages

```bash
pnpm update
```

### Update specific package

```bash
pnpm update <package-name>
```

### Update to latest versions (interactive)

```bash
pnpm update --interactive
```

### Check outdated packages

```bash
pnpm outdated
```

## Configuration Files

### .npmrc

Configures pnpm behavior:

```
shamefully-hoist=true        # Hoist dependencies to top level
strict-peer-dependencies=false  # Don't fail on peer dependency issues
auto-install-peers=true      # Auto install peer dependencies
```

### pnpm-workspace.yaml

Defines workspace structure (for monorepos):

```yaml
packages:
  - '.'
```

### package.json

Specifies the package manager version:

```json
{
  "packageManager": "pnpm@8.0.0"
}
```

## Troubleshooting

### Issue: Command not found

**Solution**: Make sure pnpm is installed globally:

```bash
npm install -g pnpm
# or
corepack enable
```

### Issue: pnpm-lock.yaml conflicts

**Solution**: Delete and regenerate:

```bash
rm pnpm-lock.yaml
pnpm install
```

### Issue: Module not found after install

**Solution**: Try reinstalling with clean state:

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue: Permission errors

**Solution**: Use pnpm setup to configure correctly:

```bash
pnpm setup
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm build
```

## Migration from npm

If you're migrating from npm:

1. **Remove npm files**:

```bash
rm package-lock.json
rm -rf node_modules
```

2. **Install with pnpm**:

```bash
pnpm install
```

3. **Commit the lock file**:

```bash
git add pnpm-lock.yaml .npmrc
git commit -m "Migrate to pnpm"
```

## Best Practices

1. **Always commit pnpm-lock.yaml**: This ensures consistent installs across environments
2. **Use `--frozen-lockfile` in CI**: Prevents lock file changes during CI builds
3. **Keep pnpm updated**: `pnpm add -g pnpm` to update pnpm itself
4. **Use workspace features**: If project grows to monorepo
5. **Check pnpm version**: Ensure team uses same version via `packageManager` field

## Performance Tips

### Faster installs

```bash
# Use offline mode if packages are cached
pnpm install --offline

# Skip optional dependencies
pnpm install --no-optional

# Production only
pnpm install --prod
```

### Clean up space

```bash
# Remove unused packages from store
pnpm store prune
```

### View disk usage

```bash
pnpm store status
```

## Additional Resources

- **Official Docs**: https://pnpm.io/
- **Migration Guide**: https://pnpm.io/migration
- **CLI Reference**: https://pnpm.io/cli/add
- **Benchmarks**: https://pnpm.io/benchmarks

## Quick Reference

```bash
# Install dependencies
pnpm install

# Add package
pnpm add <package>

# Remove package
pnpm remove <package>

# Update packages
pnpm update

# Run script
pnpm <script-name>

# Clean install (CI)
pnpm install --frozen-lockfile

# Run command from package
pnpm dlx <command>
```

---

**Note**: This project is configured to work with pnpm out of the box. Simply run `pnpm install` to get started!
