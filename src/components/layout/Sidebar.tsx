import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FlaskConical,
  Hammer,
  Flame,
  Factory,
  Snowflake,
  Gauge,
  ShieldCheck,
  Factory as FactoryIcon,
} from "lucide-react";

const menuItems = [
  { path: "/dashboard", label: "总览仪表盘", icon: LayoutDashboard },
  { path: "/raw-material", label: "生料配料", icon: FlaskConical },
  { path: "/grinding", label: "生料粉磨", icon: Hammer },
  { path: "/preheater", label: "预热分解", icon: Flame },
  { path: "/kiln", label: "回转窑煅烧", icon: Factory },
  { path: "/cooler", label: "熟料冷却", icon: Snowflake },
  { path: "/production", label: "台时产量", icon: Gauge },
  { path: "/quality", label: "质量控制", icon: ShieldCheck },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-screen">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-700">
        <div className="w-10 h-10 bg-industrial-600 rounded-lg flex items-center justify-center">
          <FactoryIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">水泥厂</h1>
          <p className="text-xs text-slate-400">熟料生产管理系统</p>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "nav-item-active" : ""}`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-2 h-2 bg-status-normal rounded-full animate-pulse" />
          <span>系统运行正常</span>
        </div>
      </div>
    </aside>
  );
}
