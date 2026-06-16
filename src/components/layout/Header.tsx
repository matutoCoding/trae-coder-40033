import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Clock,
} from "lucide-react";

const routeTitles: Record<string, string> = {
  "/dashboard": "总览仪表盘",
  "/raw-material": "生料配料",
  "/grinding": "生料粉磨",
  "/preheater": "预热分解",
  "/kiln": "回转窑煅烧",
  "/cooler": "熟料冷却",
  "/production": "台时产量",
  "/quality": "质量控制",
};

export default function Header() {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const title = routeTitles[location.pathname] || "系统页面";

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-300">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-mono">{formatDate(currentTime)}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-status-normal rounded-full animate-pulse" />
          <span className="text-sm text-slate-300">系统正常</span>
        </div>

        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-status-alarm rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 bg-industrial-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-slate-200">管理员</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
              <ul className="py-2">
                <li>
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                    <User className="w-4 h-4" />
                    个人信息
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                    <Settings className="w-4 h-4" />
                    系统设置
                  </button>
                </li>
                <li className="border-t border-slate-700 my-1" />
                <li>
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-status-alarm hover:bg-slate-700 transition-colors">
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
