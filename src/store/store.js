import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import ordersSlice from './slices/ordersSlice';
import dashboardSlice from './slices/dashboardSlice';
import productsSlice from './slices/productsSlice';
import usersSlice from './slices/usersSlice';
import searchSlice from './slices/searchSlice';
import notificationSlice from './slices/notificationSlice';
import customerLedgerSlice from './slices/customerLedgerSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    orders: ordersSlice,
    dashboard: dashboardSlice,
    products: productsSlice,
    users: usersSlice,
    search: searchSlice,
    notifications: notificationSlice,
    customerLedger: customerLedgerSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// TypeScript types - فقط برای مرجع
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch; 