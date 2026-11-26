import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Shell() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const admin = user?.role === "ROLE_ADMIN";
  const logout = () => {
    signOut();
    navigate("/");
  };
  const closeMenu = () => setOpen(false);

  return (
    <>
      <header className="topbar">
        <Link className="brand" to="/" onClick={closeMenu}><span className="brand-mark">c</span> cabby<span className="brand-period">.</span></Link>
        <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>☰</button>
        <nav className={`main-nav ${open ? "nav-open" : ""}`}>
          <NavLink to="/#rides" onClick={closeMenu}>Our rides</NavLink>
          {user ? (
            <>
              <NavLink to={admin ? "/admin" : "/dashboard"} onClick={closeMenu}>{admin ? "Admin" : "Dashboard"}</NavLink>
              <NavLink to="/bookings" onClick={closeMenu}>My rides</NavLink>
              <NavLink to="/profile" onClick={closeMenu}>Profile</NavLink>
              <button className="nav-logout" onClick={logout}>Sign out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={closeMenu}>Log in</NavLink>
              <Link className="button primary nav-signup" to="/register" onClick={closeMenu}>Get started <span>↗</span></Link>
            </>
          )}
        </nav>
      </header>
      <Outlet />
      <footer className="footer">
        <Link className="brand" to="/"><span className="brand-mark">c</span> cabby<span className="brand-period">.</span></Link>
        <p>Every trip starts with a better ride.</p>
        <span>© {new Date().getFullYear()} Cabby. Ride easy.</span>
      </footer>
    </>
  );
}
