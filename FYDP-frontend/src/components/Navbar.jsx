import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/footer.png";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  let currentUser = null;
  try {
    const raw = localStorage.getItem("currentUser");
    currentUser = raw ? JSON.parse(raw) : null;
  } catch (err) {
    currentUser = null;
  }

  const isLoggedIn = Boolean(currentUser);

  const pathname = location?.pathname || "";
  const isLoginPage = pathname === "/login";
  const isSignupPage = pathname === "/signup";

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/login", { replace: true });
  };

  return (
    <nav className="w-full bg-white h-18 shadow-md flex items-center justify-between px-4">
      {/* Logo */}
      <img
        src={logo}
        alt="TrustMark Logo"
        className="w-40 h-27 object-contain cursor-pointer "
      />

      {/* Auth actions */}
      <div className="flex items-center gap-2">
        {!isLoggedIn ? (
          <>
            {!isLoginPage && (
              <Link
                to="/login"
                className="px-4 py-2 rounded border border-[#2c4d82] text-[#2c4d82] hover:bg-[#2f5fa7] hover:text-white hover:border-[#2f5fa7]"
              >
                Login
              </Link>
            )}
            {!isSignupPage && (
              <Link
                to="/signup"
                className="px-4 py-2 rounded bg-[#2c4d82] hover:bg-[#2f5fa7] text-white"
              >
                Sign Up
              </Link>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 rounded bg-blue-900 text-white"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
