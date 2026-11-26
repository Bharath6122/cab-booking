import { Navigate, Route, Routes } from "react-router-dom";
import Shell from "./components/Shell";
import ProtectedRoute from "./components/ProtectedRoute";
import Admin from "./pages/Admin";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { BookRide, BookingConfirmation, BookingDetails, MyBookings, ProfilePage } from "./pages/BookingPages";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="book" element={<BookRide />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="booking/:id" element={<BookingConfirmation />} />
          <Route path="booking/:id/details" element={<BookingDetails />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route element={<ProtectedRoute admin />}>
          <Route path="admin" element={<Admin />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
