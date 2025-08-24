# Judy's Cafe - Comprehensive Cafe Management System

A full-featured cafe management system built with Vue 3, TypeScript, and shadcn-ui components. This application provides complete management capabilities for multi-branch cafe operations including POS, inventory, employee management, CRM, analytics, and hardware integration simulation.

## 🚀 Features

### Core Management Systems

- **Point of Sale (POS)** - Complete transaction processing with multiple payment methods
- **Inventory Management** - Stock tracking, supplier management, auto-reorder system
- **Employee Management** - Staff scheduling, time tracking, payroll integration
- **Branch Management** - Multi-location support with role-based access control
- **End-of-Day Operations** - Stock reconciliation, cash counting, daily reports

### Advanced Features

- **Customer Relationship Management (CRM)** - Customer database, loyalty programs, feedback system
- **Analytics & Business Intelligence** - Sales forecasting, performance metrics, profitability analysis
- **Mobile Applications Simulation** - Staff app, customer app, manager dashboard, delivery tracking
- **Hardware Integration Simulation** - POS hardware, kitchen displays, digital menu boards, IoT monitoring

### Technology Stack

- **Frontend**: Vue 3 with Composition API
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3 + shadcn-ui components
- **State Management**: Pinia
- **Routing**: Vue Router
- **Build Tool**: Vite
- **Code Quality**: ESLint + Prettier
- **Testing**: Vitest

## 🏗️ Architecture

### Branch-Aware Design

The application is designed with complete branch isolation:

- All stores maintain separate data for each branch
- Role-based access control (Admin, Manager, Cashier)
- Branch selection system with secure data isolation

### Component System

Custom shadcn-ui components adapted for Vue:

- Composite components (Tabs, Select, Dialog) with context provision
- TypeScript support with proper type definitions
- Consistent design system across all modules

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

## 🛠️ Installation & Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd judys-cafe
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload

# Building
npm run build        # Type-check, compile and minify for production
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Lint code with ESLint (auto-fix enabled)
npm run format       # Format code with Prettier

# Testing
npm run test:unit    # Run unit tests with Vitest
npm run test:e2e     # Run end-to-end tests

# Type Checking
npm run type-check   # Run TypeScript type checking
```

## 👥 Demo Users

The application includes demo users for testing different access levels:

| Username | Password   | Role    | Access            |
| -------- | ---------- | ------- | ----------------- |
| admin    | admin123   | Admin   | All branches      |
| manager  | manager123 | Manager | Multiple branches |
| cashier  | cashier123 | Cashier | Single branch     |

## 🏢 Branch System

The application supports multiple cafe locations:

- **Downtown Branch** - Main location with full operations
- **Mall Branch** - High-traffic retail location
- **Airport Branch** - 24/7 operations with limited menu

## 📱 Module Overview

### 1. Dashboard

- Real-time sales metrics
- Daily performance indicators
- Quick access to all modules
- Branch-specific overview

### 2. Sales & POS

- Product catalog with categories
- Multiple payment methods (Cash, Card, Mobile)
- Receipt generation and printing simulation
- Transaction history and refunds

### 3. Inventory Management

- Real-time stock levels
- Low stock alerts and auto-reorder
- Supplier management
- Expiry tracking and waste management

### 4. Employee Management

- Staff scheduling and shift management
- Time clock with GPS location
- Performance metrics and payroll integration
- Role-based permissions

### 5. Customer Relations (CRM)

- Customer database with purchase history
- Loyalty program with tier system
- Promotional campaigns
- Feedback management

### 6. Analytics & Reports

- Sales forecasting and trend analysis
- Profitability analysis by product/branch
- Employee performance metrics
- Custom report generation

### 7. Hardware Integration

- POS hardware simulation (cash drawer, receipt printer, barcode scanner)
- Kitchen display system for order management
- Digital menu boards with real-time updates
- IoT monitoring (temperature, energy, security)

### 8. Mobile Applications

- Staff mobile interface for schedule and tasks
- Customer mobile app for ordering and loyalty
- Manager mobile dashboard for remote monitoring
- Delivery tracking system

## 🔒 Security Features

- Role-based access control
- Branch-specific data isolation
- Secure authentication system
- Permission-based UI rendering

## 🎨 UI/UX Features

- Responsive design for all screen sizes
- Dark/light theme support (planned)
- Intuitive navigation with breadcrumbs
- Real-time data updates
- Loading states and error handling

## 📈 Performance

- Code splitting for optimal loading
- Lazy loading of route components
- Optimized build with tree shaking
- TypeScript for better development experience

## 🧪 Testing

- Unit tests with Vitest
- Component testing for UI components
- E2E testing for critical user flows
- Type checking with vue-tsc

## 📝 Code Quality

- ESLint configuration with Vue and TypeScript rules
- Prettier for consistent code formatting
- Pre-commit hooks for code quality
- TypeScript strict mode enabled

## 🚀 Deployment

The application can be deployed to various platforms:

- Vercel, Netlify (for static hosting)
- Docker containers
- Traditional web servers

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔮 Future Enhancements

- Real backend integration
- Mobile app development (React Native/Flutter)
- Advanced analytics with machine learning
- Integration with accounting systems
- Multi-language support
- Advanced reporting with PDF generation
