'use client'
import {
  BoxIcon,
  ChartBar,
  File,
  Home,
  PersonStanding,
  Settings,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Leftbar() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const navGroups = [
    {
      title: "Sales and Analytics",
      items: [
        { name: "Order", icon: ShoppingCart, href: "/coming-soon" },
        { name: "Customer", icon: Home, href: "/coming-soon" },
        { name: "Products", icon: BoxIcon, href: "/coming-soon" },
        { name: "Reports", icon: ChartBar, href: "/coming-soon" },
      ],
    },
    {
      title: "Inventory",
      items: [
        { name: "Stock Management", icon: BoxIcon, href: "/coming-soon" },
        { name: "Suppliers", icon: Truck, href: "/coming-soon" },
        { name: "Purchase Orders", icon: File, href: "/coming-soon" },
      ],
    },
  ];

  const bottomItems = [
    { name: "Store Settings", icon: Settings, href: "/coming-soon" },
    { name: "Team", icon: PersonStanding, href: "/coming-soon" },
  ];

  return (
    <div 
      className={`p-4 bg-[#C4D9FF] h-[100vh] relative transition-all duration-300 hidden md:flex flex-col flex-shrink-0 ${isVisible ? 'w-64' : 'w-20'}`}
    >
      {/* logo */}
      <div 
        className="flex justify-between items-center cursor-pointer mb-8" 
        onClick={toggleVisibility}
      >
        <div className={`overflow-hidden whitespace-nowrap transition-all ${isVisible ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
          <h1 className="text-lg font-bold leading-tight text-gray-900">VeriScale</h1>
          <p className="text-xs text-gray-700">Growth + Trust Blends</p>
        </div>
        <div className="flex-shrink-0 text-gray-800">
          <Wallet width={"20"} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden text-gray-800">
        {/* dashboard */}
        <Link 
          href="/" 
          className={`flex gap-3 items-center p-2 rounded-lg transition-colors hover:bg-white/50 ${pathname === '/' ? 'bg-white/60 font-semibold' : ''}`}
        >
          <div className="flex-shrink-0"><Home width={"20"} /></div>
          {isVisible && <span>Dashboard</span>}
        </Link>

        {navGroups.map((group, idx) => (
          <div key={idx} className="mt-6">
            {isVisible && (
              <h2 className="font-bold text-[#ac9df8] text-xs uppercase tracking-wider mb-2 px-2">
                {group.title}
              </h2>
            )}
            <div className="flex flex-col gap-1">
              {group.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={i} 
                    href={item.href}
                    className="flex gap-3 items-center p-2 rounded-lg transition-colors hover:bg-white/50"
                  >
                    <div className="flex-shrink-0"><Icon width={"20"} /></div>
                    {isVisible && <span className="whitespace-nowrap">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="mt-4 pt-4 border-t border-white/40 text-gray-800">
        {isVisible && (
          <h2 className="font-bold text-[#ac9df8] text-xs uppercase tracking-wider mb-2 px-2">
            Settings
          </h2>
        )}
        <div className="flex flex-col gap-1">
          {bottomItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link 
                key={i} 
                href={item.href}
                className="flex gap-3 items-center p-2 rounded-lg transition-colors hover:bg-white/50"
              >
                <div className="flex-shrink-0"><Icon width={"20"} /></div>
                {isVisible && <span className="whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
