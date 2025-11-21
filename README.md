# RailPay - Railway Payment System

A modern, full-featured railway payment and ticketing system built with Next.js 14, TypeScript, Tailwind CSS, and Web3 wallet integration.

## Features

### User Features
- 🔐 Authentication (Login/Register)
- 🎫 Ticket booking and management
- 🎟️ Travel passes purchase
- 📱 QR code ticket generation and scanning
- 💳 Multiple payment methods (Card, Crypto Wallet, Mobile)
- 📊 Dashboard with travel overview
- 👤 User profile management

### Admin Features
- 📈 Revenue analytics and reporting
- 🚂 Route management
- 💰 Fare configuration
- 👥 Staff management
- 🔌 Device management
- 📊 Real-time statistics

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** ShadCN UI
- **State Management:** Zustand
- **API Client:** Axios
- **Wallet Integration:** RainbowKit + Wagmi
- **QR Code:** qrcode.react, html5-qrcode
- **Blockchain:** Sepolia Testnet

## Project Structure

```
railpay/
├── app/                      # Next.js App Router pages
│   ├── auth/                 # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/            # User dashboard pages
│   │   ├── tickets/
│   │   ├── passes/
│   │   └── profile/
│   ├── admin/                # Admin pages
│   │   ├── routes/
│   │   ├── fares/
│   │   ├── revenue/
│   │   ├── staff/
│   │   └── devices/
│   ├── pay/                  # Payment page
│   ├── qr/                   # QR code pages
│   │   ├── generate/
│   │   └── scan/
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Landing page
│   ├── providers.tsx         # Providers (RainbowKit, etc.)
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── ui/                   # ShadCN UI components
│   ├── Sidebar.tsx
│   ├── NavBar.tsx
│   ├── TicketCard.tsx
│   ├── RouteSelector.tsx
│   ├── PaymentModal.tsx
│   ├── QRDisplay.tsx
│   └── QRScanner.tsx
├── lib/                      # Utility libraries
│   ├── api.ts                # API client setup
│   ├── wallet.ts             # Wallet utilities
│   ├── store.ts              # Zustand stores
│   └── utils.ts              # Utility functions
└── public/                   # Static assets
    ├── logos/
    └── icons/
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- WalletConnect Project ID (for RainbowKit - optional)

### Installation

1. **Clone the repository** (or navigate to the project directory)

```bash
cd "C:\Users\DELL\Desktop\NEW VERSION RAILPAY"
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

**Note:** For WalletConnect (RainbowKit) to work properly, you'll need to:
- Sign up at [WalletConnect Cloud](https://cloud.walletconnect.com/)
- Create a project and get your Project ID
- Add it to `.env.local` as shown above

Alternatively, you can use the placeholder `YOUR_PROJECT_ID` in the code for development.

4. **Run the development server**

```bash
npm run dev
# or
yarn dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### User Flow

1. **Register/Login:** Create an account or sign in
2. **Book Ticket:** Go to `/pay` to search and book tickets
3. **View Tickets:** Check your tickets in `/dashboard/tickets`
4. **Generate QR:** Create QR codes for your active tickets
5. **Scan QR:** Use the scanner to verify tickets (admin feature)

### Admin Flow

1. **Login as Admin:** Use an email containing "admin" to access admin features
2. **Manage Routes:** Add, edit, or delete routes in `/admin/routes`
3. **Configure Fares:** Set pricing in `/admin/fares`
4. **View Revenue:** Check analytics in `/admin/revenue`
5. **Manage Staff:** Add/remove staff members in `/admin/staff`
6. **Monitor Devices:** Track connected devices in `/admin/devices`

### Mock Authentication

Currently, the app uses mock authentication:
- Any email and password will work for login/register
- Emails containing "admin" will be assigned admin role
- All other users get the user role

## Building for Production

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | No (defaults to localhost:3001) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Project ID for RainbowKit | No (optional) |

## Features Overview

### Authentication
- User registration and login
- Session management with Zustand
- Protected routes

### Ticketing System
- Route search and selection
- Ticket booking
- Ticket management (view, filter, search)
- QR code generation for tickets

### Payment System
- Multiple payment methods
- Crypto wallet integration (RainbowKit)
- Card payments
- Mobile payments

### Admin Panel
- Comprehensive dashboard with statistics
- Route CRUD operations
- Fare management
- Revenue analytics
- Staff management
- Device monitoring

## Customization

### Theme Colors

Edit `app/globals.css` to customize the color scheme:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  /* ... other colors */
}
```

### API Configuration

Update `lib/api.ts` to connect to your backend API:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
```

## Troubleshooting

### Wallet Connection Issues

- Ensure you have a valid WalletConnect Project ID
- Check that your wallet extension is installed and unlocked
- Verify you're on the Sepolia testnet

### QR Scanner Not Working

- Ensure camera permissions are granted
- Use HTTPS or localhost (HTTP doesn't support camera access)
- Check browser compatibility (Chrome, Firefox, Safari supported)

### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version (requires 18+)

## Next Steps

To connect this frontend to a backend:

1. Update `lib/api.ts` with your actual API endpoints
2. Implement real authentication tokens
3. Replace mock data with API calls
4. Set up WebSocket connections for real-time updates (optional)

## License

This project is open source and available for use.

## Support

For issues or questions, please check the documentation or create an issue in the repository.

---

Built with ❤️ using Next.js 14 and modern web technologies.

