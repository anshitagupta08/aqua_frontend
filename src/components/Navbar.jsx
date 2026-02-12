import React from "react";
import { NavLink } from "react-router-dom";
import { IoHomeOutline, IoSettingsOutline } from "react-icons/io5";
import { SlCallIn, SlCallOut } from "react-icons/sl";
import { GiHamburgerMenu } from "react-icons/gi";
import { LuContactRound } from "react-icons/lu";
import { RiHistoryLine } from "react-icons/ri";
import { ArrowPathIcon, PhoneArrowUpRightIcon } from "@heroicons/react/24/outline";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: <IoHomeOutline className="w-5 h-5" />,
  },
  {
    to: "/dashboard/contacts",
    label: "Contacts",
    icon: <LuContactRound className="w-5 h-5" />,
  },
  {
    to: "/dashboard/call-history",
    label: "Call History",
    icon: <RiHistoryLine className="w-5 h-5" />,
  },
  {
    to: "/dashboard/incoming-call",
    label: "Incoming Calls",
    icon: <SlCallIn className="w-5 h-5" />,
  },
  {
    to: "/dashboard/outgoing-call",
    label: "Outgoing Calls",
    icon: <SlCallOut className="w-5 h-5" />,
  },
  {
    to: "/dashboard/followup-page",
    label: "FollowUp Calls",
    icon: <ArrowPathIcon className="w-5 h-5" />,
  },
];

const Navbar = ({ collapsed, setCollapsed }) => {
  return (
    <nav
      className={`bg-[#Eb3241] flex flex-col shadow-2xl transition-all duration-300 ease-in-out relative border-r border-[#99CBEA]/30
                ${collapsed ? "w-16" : "w-64"}
                h-full
                lg:h-[calc(100vh-4rem)]
            `}
    >
      {/* Navigation Section Header with Collapse Button */}
      <div
        className={`px-4 pt-4 pb-2 transition-all duration-300 flex-shrink-0 ${
          collapsed ? "px-3" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <div
            className={`text-md font-semibold text-white uppercase tracking-wider transition-all duration-300 ${
              collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
            }`}
          >
            Menu
          </div>

          {/* Collapse/Expand Button */}
          <button
            className={`hidden lg:flex items-center justify-center p-1 rounded-xl text-white/95 hover:text-white hover:bg-white/20 transition-all duration-200 group ${
              collapsed ? "w-full" : "ml-2"
            }`}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <GiHamburgerMenu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 px-2 pb-4 overflow-y-auto scrollbar-hide min-h-0">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to} 
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center transition-all duration-200 rounded-xl mx-1 relative overflow-hidden ${
                  isActive
                    ? "bg-white/30 text-white shadow-sm shadow-[#99CBEA]/25"
                    : "text-white/80 hover:bg-[#99CBEA]/40 hover:text-white"
                } ${collapsed ? "px-3 py-2 justify-center" : "px-4 py-3"}`
              }
              end={item.to === "/dashboard"}
            >
              {/* Icon */}
              <div className="flex-shrink-0 flex items-center justify-center">
                {item.icon}
              </div>

              {/* Label */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  collapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100 ml-3"
                }`}
              >
                <span className="font-medium text-sm whitespace-nowrap">
                  {item.label}
                </span>
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
