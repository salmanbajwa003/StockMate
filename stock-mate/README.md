# StockMate Frontend

A modern, responsive inventory management system built with React, TypeScript, and Material-UI. StockMate provides a comprehensive solution for managing products, customers, warehouses, invoices, and more.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Project Structure](#project-structure)
- [Key Components](#key-components)
- [API Integration](#api-integration)
- [Available Scripts](#available-scripts)
- [Build & Deployment](#build--deployment)

## ✨ Features

### Core Functionality

- **Product Management**: Create, update, and manage products with fabric, color, price, weight, and unit information
- **Customer Management**: Comprehensive customer database with contact information and multiple phone numbers
- **Warehouse Management**: Track multiple warehouses with addresses and sizes
- **Invoice Management**: Generate and manage invoices with PDF export functionality
- **Color & Fabric Management**: Maintain color and fabric catalogs with hex codes and descriptions

### Advanced Features

- **Advanced Search & Filtering**:
  - Column-based search filters for all tables
  - Date range pickers for date columns
  - Predefined date filters (Today, This Month, Previous Month)
  - Case-insensitive prefix matching
- **Searchable Dropdowns**: All dropdown fields support search functionality
- **Decimal Formatting**: Consistent decimal formatting (2 decimal places) for price and quantity fields
- **Responsive Design**: Fully responsive UI that works on desktop, tablet, and mobile devices
- **Authentication**: Secure login system with protected routes
- **PDF Generation**: Export invoices as PDF documents

## 🛠 Tech Stack

- **Framework**: React 19.1.1
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 7.1.7
- **UI Library**: Material-UI (MUI) 7.3.5
- **Date Handling**: Day.js 1.11.19
- **Date Pickers**: MUI X Date Pickers 8.17.0
- **HTTP Client**: Axios 1.6.7
- **Routing**: React Router DOM 7.9.4
- **PDF Generation**: jsPDF 3.0.4
- **Linting**: ESLint 9.36.0

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**: Package manager
- **Backend API**: StockMate API server running (see [stockmate-api README](../stockmate-api/README.md))

## 🚀 Installation

1. **Clone the repository** (if not already done):

   ```bash
   git clone <repository-url>
   cd StockMate/stock-mate
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the `stock-mate` directory:

   ```env
   VITE_BASE_URL=http://localhost:4000/
   ```

   > **Note**: Update the URL to match your backend API server address

4. **Start the development server**:

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open your browser**:
   Navigate to `http://localhost:5173` (or the port shown in the terminal)

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root of the `stock-mate` directory:

```env
# Backend API Base URL
VITE_BASE_URL=http://localhost:4000/
```

### Vite Configuration

The project uses Vite with the following configurations:

- **Proxy**: API requests are proxied to `http://localhost:3000` during development (see `vite.config.ts`)
- **Code Splitting**: Optimized chunk splitting for better performance:
  - MUI core libraries
  - Date pickers
  - React Router
  - Vendor libraries (Axios, Day.js)

## 💻 Development

### Project Structure

```
stock-mate/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── CustomForm.tsx   # Generic form component
│   │   ├── CustomTable.tsx  # Data table component
│   │   ├── CustomSearchFilter.tsx  # Search filter component
│   │   ├── ProtectedRoute.tsx     # Route protection
│   │   └── layout/
│   │       └── Navebar.tsx  # Navigation bar
│   ├── pages/               # Page components
│   │   ├── Login.tsx
│   │   ├── Products.tsx
│   │   ├── Customers.tsx
│   │   ├── Warehouse.tsx
│   │   ├── Invoices.tsx
│   │   ├── Colors.tsx
│   │   └── Fibers.tsx
│   ├── services/            # API service layer
│   │   ├── authService.ts
│   │   ├── customerService.ts
│   │   ├── productService.ts
│   │   ├── invoiceService.ts
│   │   └── warehouseService.ts
│   ├── context/             # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── useAuth.ts
│   ├── utils/               # Utility functions and types
│   │   ├── constants/
│   │   │   └── index.ts     # API endpoints
│   │   └── types/
│   │       └── index.ts     # TypeScript interfaces
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── public/                   # Static assets
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Key Components

#### CustomForm

A reusable form component that handles:

- Text, number, date, textarea, and select fields
- Validation
- Searchable dropdowns (Autocomplete)
- Decimal formatting for number fields
- Loading states

#### CustomTable

A data table component with:

- Column-based rendering
- Row click handlers
- Loading states
- Responsive design

#### CustomSearchFilter

Advanced search component supporting:

- Multiple search options
- Text input
- Single date picker
- Date range picker
- Dynamic option switching

### API Integration

The frontend communicates with the backend API through service files:

- **Base URL**: Configured via `VITE_BASE_URL` environment variable
- **Endpoints**: Defined in `src/utils/constants/index.ts`
- **Services**: Each entity has a dedicated service file in `src/services/`

Example API call:

```typescript
import { customerService } from '../services/customerService';

// Fetch all customers
const customers = await customerService.getAll();

// Create a customer
const newCustomer = await customerService.create(customerData);
```

### Date Formatting

All dates throughout the application use the **DD-MM-YYYY** format:

- Date pickers display dates in DD-MM-YYYY
- Table columns format dates as DD-MM-YYYY
- PDF exports use DD-MM-YYYY

### Decimal Formatting

Numeric fields (price, quantity, amounts) follow these rules:

- Display with 2 decimal places (e.g., `10.00`)
- Use dot (.) as decimal separator
- Automatically format on blur
- Support comma-to-dot conversion during input

## 📜 Available Scripts

### Development

```bash
npm run dev
# or
pnpm dev
```

Starts the development server with hot module replacement (HMR).

### Build

```bash
npm run build
# or
pnpm build
```

Creates an optimized production build in the `dist/` directory.

### Preview

```bash
npm run preview
# or
pnpm preview
```

Preview the production build locally before deploying.

### Lint

```bash
npm run lint
# or
pnpm lint
```

Run ESLint to check for code quality issues.

## 🏗 Build & Deployment

### Production Build

1. **Build the application**:

   ```bash
   npm run build
   ```

2. **Output**: The `dist/` directory contains the production-ready files

3. **Deploy**: Serve the `dist/` directory using any static file server:
   - **Nginx**: Configure to serve `dist/` directory
   - **Apache**: Point DocumentRoot to `dist/` directory
   - **Vercel/Netlify**: Connect your repository for automatic deployments
   - **Docker**: Use a web server image (nginx, apache) with `dist/` mounted

### Environment Variables for Production

Ensure your production environment has the correct `VITE_BASE_URL`:

```env
VITE_BASE_URL=https://api.yourdomain.com/
```

> **Note**: Environment variables prefixed with `VITE_` are embedded at build time. Rebuild the application after changing environment variables.

## 🔐 Authentication

The application uses JWT-based authentication:

1. **Login**: Users authenticate via `/login`
2. **Protected Routes**: All routes except `/login` require authentication
3. **Token Storage**: JWT tokens are stored in localStorage
4. **Auto-redirect**: Unauthenticated users are redirected to login

## 🎨 UI/UX Features

### Responsive Design

- Mobile-first approach
- Breakpoints: xs, sm, md, lg, xl
- Flexible layouts that adapt to screen size

### Search & Filter

- **Column-based search**: Search by any column in tables
- **Date filters**: Predefined filters (All, Today, This Month, Previous Month)
- **Date range picker**: Custom date range selection
- **Prefix matching**: Case-insensitive search from the first character

### Form Features

- **Searchable dropdowns**: All select fields support typing to search
- **Auto-formatting**: Decimal fields format automatically
- **Validation**: Real-time validation with error messages
- **Loading states**: Visual feedback during API calls

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Errors**:

   - Verify `VITE_BASE_URL` is correct
   - Ensure backend API is running
   - Check CORS settings on backend

2. **Build Errors**:

   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run build`

3. **Date Format Issues**:
   - Ensure Day.js is properly configured in `main.tsx`
   - Check `LocalizationProvider` settings

## 📝 Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Configured with React and TypeScript rules
- **Formatting**: Follow Material-UI design patterns
- **Components**: Functional components with hooks

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript for all new code
3. Add proper type definitions
4. Write reusable components
5. Follow Material-UI design guidelines

## 📄 License

[Add your license information here]

## 🔗 Related Documentation

- [Backend API Documentation](../stockmate-api/README.md)
- [Material-UI Documentation](https://mui.com/)
- [React Router Documentation](https://reactrouter.com/)
- [Vite Documentation](https://vite.dev/)

---

**Built with ❤️ using React, TypeScript, and Material-UI**
