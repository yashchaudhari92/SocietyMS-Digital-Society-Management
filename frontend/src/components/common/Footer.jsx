import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-white text-sm">🏢</span>
              </div>
              <span className="text-xl font-black tracking-tighter text-white">
                SOCIETY<span className="text-indigo-500">MS</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              The next generation of residential management. 
              Streamlining maintenance, transparency, and 
              community living.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-6 tracking-widest uppercase">Platform</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/" className="hover:text-indigo-400 transition-colors">Home</Link></li>
              <li><Link to="/admin/login" className="hover:text-indigo-400 transition-colors">Admin Portal</Link></li>
              <li><Link to="/user/login" className="hover:text-indigo-400 transition-colors">Resident Portal</Link></li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h4 className="text-white font-bold text-sm mb-6 tracking-widest uppercase">Support</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact/Social placeholder */}
          <div>
            <h4 className="text-white font-bold text-sm mb-6 tracking-widest uppercase">Connect</h4>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-all cursor-pointer">
                <span className="text-xs">FB</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-all cursor-pointer">
                <span className="text-xs">TW</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-indigo-600 transition-all cursor-pointer">
                <span className="text-xs">IG</span>
              </div>
            </div>
            <p className="mt-6 text-xs text-slate-500 italic">
              Built for modern communities.
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500 font-medium">
            © {new Date().getFullYear()} Society Management System. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Designed By @EZIO InfoTech Pvt Ltd.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}