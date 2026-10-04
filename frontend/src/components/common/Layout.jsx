import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children }) {
  const location = useLocation();
  
  // Logic to hide Navbar/Footer on dashboard pages
  const isDashboard = location.pathname.includes("dashboard");

  return (
    <div className="flex flex-col min-h-screen">
      {!isDashboard && <Navbar />}

      <main className="flex-grow">
        {children}
      </main>

      {!isDashboard && <Footer />}
    </div>
  );
}

// import Navbar from "./Navbar";
// import Footer from "./Footer";

// export default function Layout({ children }) {
//   return (
//     <div className="flex flex-col min-h-screen">
      
//       {/* Navbar */}
//       <Navbar />

//       {/* 🔥 THIS IS THE KEY */}
//       <main className="flex-grow">
//         {children}
//       </main>

//       {/* Footer */}
//       <Footer />
//     </div>
//   );
// }
