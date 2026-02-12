# IVR and CRM for ABIS Traders
- application developed for abis traders to manage.


```
ABIS-Pro-Frontend
├─ eslint.config.js
├─ index.html
├─ package-lock.json
├─ package.json
├─ public
│  ├─ icon-512.png
│  └─ sounds
│     ├─ button-click.mp3
│     ├─ dial-tone.mp3
│     └─ phone-ring.mp3
├─ README.md
├─ src
│  ├─ App.jsx
│  ├─ assets
│  ├─ components
│  │  ├─ CallRemarks
│  │  │  ├─ CallRemarksForm.jsx
│  │  │  ├─ CallRemarksPage.jsx
│  │  │  ├─ CustomerCallHistory.jsx
│  │  │  ├─ CustomerInfoPanel.jsx
│  │  │  ├─ CustomerManualEntry.jsx
│  │  │  ├─ CustomerSearchBox.jsx
│  │  │  └─ OrderDetailPanel.jsx
│  │  ├─ Dialer
│  │  │  └─ DialerPanel.jsx
│  │  ├─ Header.jsx
│  │  └─ Navbar.jsx
│  ├─ constants
│  ├─ context
│  │  ├─ Dashboard
│  │  │  ├─ DialerContext.jsx
│  │  │  ├─ FormContext.jsx
│  │  │  └─ SocketContext.jsx
│  │  ├─ DashboardContext.jsx
│  │  ├─ Providers
│  │  │  ├─ Dashboard
│  │  │  │  ├─ DialerProvider.jsx
│  │  │  │  ├─ FormProvider.jsx
│  │  │  │  └─ SocketProvider.jsx
│  │  │  └─ User
│  │  │     ├─ AuthProvider.jsx
│  │  │     └─ UserProvider.jsx
│  │  ├─ User
│  │  │  ├─ AuthContext.jsx
│  │  │  └─ UserContext.jsx
│  │  └─ UserContexts.jsx
│  ├─ hooks
│  │  ├─ useDialer.jsx
│  │  ├─ useForm.jsx
│  │  └─ useSocket.jsx
│  ├─ index.css
│  ├─ layouts
│  │  └─ DashboardLayout.jsx
│  ├─ library
│  │  └─ axios.js
│  ├─ main.jsx
│  ├─ page
│  │  ├─ Dashboard
│  │  │  ├─ CallHistory
│  │  │  │  └─ CallHistoryPage.jsx
│  │  │  ├─ Contacts
│  │  │  │  └─ ContactsPage.jsx
│  │  │  ├─ Dashboard.jsx
│  │  │  ├─ DashboardPage
│  │  │  │  └─ DashboardPage.jsx
│  │  │  ├─ IncomingCall
│  │  │  │  └─ IncomingCallPage.jsx
│  │  │  ├─ OutgoingCall
│  │  │  │  └─ OutgoingCallPage.jsx
│  │  │  └─ Profile
│  │  │     └─ ProfilePage.jsx
│  │  ├─ Login.jsx
│  │  └─ NotFound.jsx
│  └─ utils
│     ├─ ProtectedRoute.jsx
│     └─ PublicRoute.jsx
└─ vite.config.js

```