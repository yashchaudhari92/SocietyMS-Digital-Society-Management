import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isHomePage = location.pathname === "/";

  return (
    <nav
      className={`fixed top-0 w-full z-[100] transition-all duration-500 px-6 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-md shadow-lg py-3"
          : "bg-transparent py-6"
      }`}
    >
      {/* Subtle top-down gradient for text readability on light images */}
      {!isScrolled && isHomePage && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent -z-10 h-24" />
      )}

      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
            <span className="text-white text-xl">🏢</span>
          </div>
          <span
            className={`text-2xl font-black tracking-tighter transition-colors duration-300 ${
              !isScrolled && isHomePage ? "text-white" : "text-slate-900"
            }`}
          >
            SOCIETY<span className="text-indigo-600">MS</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-8">
            {[
              { name: "HOME", path: "/" },
              { name: "ADMIN", path: "/admin/login", hideAuth: true },
              { name: "RESIDENT", path: "/user/login", hideAuth: true },
            ].map((link) => (
              (!user || !link.hideAuth) && (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-xs font-bold tracking-widest transition-all duration-300 hover:scale-105 ${
                    location.pathname === link.path
                      ? "text-indigo-600"
                      : !isScrolled && isHomePage
                      ? "text-white/90 hover:text-white"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {link.name}
                </Link>
              )
            ))}
          </div>

          {/* Action Section */}
          <div className={`flex items-center gap-6 pl-6 border-l transition-colors duration-300 ${
            !isScrolled && isHomePage ? "border-white/20" : "border-slate-200"
          }`}>
            {!user ? (
              <Link
                to="/user/login"
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 active:scale-95 shadow-lg ${
                  !isScrolled && isHomePage
                    ? "bg-white text-slate-900 hover:bg-indigo-50 shadow-white/10"
                    : "bg-slate-900 text-white hover:bg-indigo-600 shadow-slate-200"
                }`}
              >
                Get Started
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Logged In</p>
                  <p className={`text-sm font-bold ${
                    !isScrolled && isHomePage ? "text-white" : "text-slate-900"
                  }`}>
                    {user.name}
                  </p>
                </div>
                
                <button
                  onClick={handleLogout}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    !isScrolled && isHomePage 
                      ? "bg-white/10 text-white hover:bg-red-500/20 hover:text-red-200" 
                      : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                  }`}
                  title="Logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// import { Link, useNavigate } from "react-router-dom";
// import { useContext } from "react";
// import { AuthContext } from "../../context/AuthContext";

// export default function Navbar() {
//   const navigate = useNavigate();
//   const { user, logout } = useContext(AuthContext);

//   return (
//     <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      
//       {/* Logo */}
//       <h1 className="text-xl font-bold text-blue-600">
//         SocietyMS
//       </h1>

//       {/* Links */}
//       <div className="flex items-center gap-4">
        
//         <Link to="/" className="text-gray-600 hover:text-blue-600">
//           Home
//         </Link>

//         {!user ? (
//           <>
//             <Link to="/admin/login" className="text-gray-600 hover:text-blue-600">
//               Admin
//             </Link>

//             <Link to="/user/login" className="text-gray-600 hover:text-blue-600">
//               User
//             </Link>
//           </>
//         ) : (
//           <>
//             <span className="text-gray-700 font-medium">
//               {user.name}
//             </span>

//             <button
//               onClick={() => {
//                 logout();
//                 navigate("/");
//               }}
//               className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
//             >
//               Logout
//             </button>
//           </>
//         )}

//       </div>
//     </nav>
//   );
// }
