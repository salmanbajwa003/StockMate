# Migration to pnpm - Summary

## Changes Made

This project has been successfully migrated from npm to **pnpm** (performant npm).

### ✅ Files Updated

#### 1. **Dockerfile**

- Updated to use Corepack to enable pnpm
- Changed from `npm ci` to `pnpm install --frozen-lockfile`
- Build stage uses `pnpm run build`
- Production stage installs only production dependencies with `pnpm install --frozen-lockfile --prod`

```dockerfile
# Before
RUN npm ci
RUN npm run build

# After
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile
RUN pnpm run build
```

#### 2. **package.json**

- Added `"packageManager": "pnpm@8.0.0"` to specify pnpm version
- This ensures consistent pnpm version across all environments

#### 3. **.npmrc** (New File)

Configuration for pnpm:

```
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true
```

#### 4. **pnpm-workspace.yaml** (New File)

Workspace configuration:

```yaml
packages:
  - '.'
```

#### 5. **.gitignore**

- Added `.pnpm-store/` to ignore pnpm's global store
- Added comment noting that `pnpm-lock.yaml` should be committed

#### 6. **.dockerignore**

- Added `pnpm-debug.log` to ignore list
- Kept documentation files out of Docker builds

#### 7. **README.md**

- Updated prerequisites to mention pnpm
- Changed all `npm` commands to `pnpm` commands
- Added pnpm installation instructions
- Updated development workflow

#### 8. **SYSTEM_OVERVIEW.md**

- Updated installation instructions to use pnpm
- Changed quick start commands

#### 9. **PNPM_SETUP.md** (New File)

- Comprehensive guide on using pnpm with this project
- Installation methods
- Common commands
- Troubleshooting
- Migration guide

## What is pnpm?

**pnpm** (performant npm) is a fast, disk space efficient package manager:

### Benefits

- ⚡ **2x faster** than npm
- 💾 **Saves disk space** - uses content-addressable storage
- 🔒 **More secure** - strict by default
- 🎯 **Compatible** - works with all npm packages
- 📦 **Better for monorepos**

### How It Works

Instead of copying packages for each project, pnpm:

1. Downloads packages once to a global store
2. Creates hard links from the store to node_modules
3. Saves significant disk space and installation time

## Getting Started

### Install pnpm

**Option 1: Using npm (easiest)**

```bash
npm install -g pnpm
```

**Option 2: Using Corepack (recommended for teams)**

```bash
corepack enable
```

**Option 3: Standalone script**

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Install Project Dependencies

```bash
pnpm install
```

### Run Development Server

```bash
pnpm start:dev
```

### Build for Production

```bash
pnpm build
```

## Command Comparison

| Task            | npm                  | pnpm               |
| --------------- | -------------------- | ------------------ |
| Install all     | `npm install`        | `pnpm install`     |
| Add package     | `npm install pkg`    | `pnpm add pkg`     |
| Add dev package | `npm install -D pkg` | `pnpm add -D pkg`  |
| Remove package  | `npm uninstall pkg`  | `pnpm remove pkg`  |
| Run script      | `npm run dev`        | `pnpm dev`         |
| Update packages | `npm update`         | `pnpm update`      |
| Execute package | `npx command`        | `pnpm dlx command` |

## Docker Usage

The Dockerfile is configured to work with pnpm automatically:

```bash
# Build image
docker build -t warehouse-management-system .

# Run with docker-compose
docker-compose up -d
```

The Docker build process:

1. Enables Corepack in the container
2. Installs pnpm
3. Uses `pnpm install --frozen-lockfile` for reproducible builds
4. Production stage only installs production dependencies

## CI/CD Integration

For GitHub Actions, use:

```yaml
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

## Important Files

### Lock File

- **pnpm-lock.yaml** - Similar to package-lock.json
- ✅ **Must be committed** to version control
- Ensures consistent installs across all environments

### Configuration

- **.npmrc** - pnpm configuration
- **pnpm-workspace.yaml** - Workspace definition
- **package.json** - Includes `packageManager` field

## What to Commit

✅ **DO commit:**

- `pnpm-lock.yaml`
- `.npmrc`
- `pnpm-workspace.yaml`
- `package.json` (with packageManager field)

❌ **DON'T commit:**

- `node_modules/`
- `.pnpm-store/`
- `pnpm-debug.log`

## Troubleshooting

### Issue: "pnpm: command not found"

**Solution:**

```bash
npm install -g pnpm
# or
corepack enable
```

### Issue: Lock file conflicts

**Solution:**

```bash
rm pnpm-lock.yaml
pnpm install
```

### Issue: Docker build fails

**Solution:**
Make sure pnpm-lock.yaml exists:

```bash
pnpm install  # Creates lock file
docker build .
```

## Performance Comparison

Based on official benchmarks:

| Action        | npm | pnpm | Improvement     |
| ------------- | --- | ---- | --------------- |
| Cold install  | 51s | 24s  | **2.1x faster** |
| Hot install   | 35s | 1.3s | **27x faster**  |
| With lockfile | 15s | 6.7s | **2.2x faster** |

## Team Migration Checklist

For teams migrating from npm:

- [ ] Install pnpm globally on all dev machines
- [ ] Remove `package-lock.json`
- [ ] Run `pnpm install` to generate `pnpm-lock.yaml`
- [ ] Commit `.npmrc`, `pnpm-workspace.yaml`, and `pnpm-lock.yaml`
- [ ] Update CI/CD pipelines
- [ ] Update documentation
- [ ] Train team members on pnpm commands
- [ ] Update Docker configurations

## Benefits for This Project

1. **Faster CI/CD** - Reduced build times in Docker and CI pipelines
2. **Disk savings** - Multiple projects share same package versions
3. **Better security** - Stricter dependency resolution
4. **Future-proof** - Ready for potential monorepo structure
5. **Modern tooling** - Aligns with latest Node.js best practices

## Rollback Plan

If you need to rollback to npm:

```bash
# Remove pnpm files
rm pnpm-lock.yaml .npmrc pnpm-workspace.yaml
rm -rf node_modules

# Reinstall with npm
npm install

# Update Dockerfile back to npm commands
# Remove packageManager field from package.json
```

## Additional Resources

- **Official Documentation:** https://pnpm.io/
- **Migration Guide:** https://pnpm.io/migration
- **Benchmarks:** https://pnpm.io/benchmarks
- **CLI Reference:** https://pnpm.io/cli/add

## Support

See `PNPM_SETUP.md` for detailed setup instructions and troubleshooting.

---

**Status:** ✅ Migration Complete

The project is now fully configured to use pnpm. Simply run `pnpm install` to get started!
