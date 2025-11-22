import React, { useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { MenuItem, MenuGroup } from "../types/authTypes";
import useOnclickOutside from "../utils/useOnclickOutside";

const Sidebar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  menuGroups: MenuGroup[];
  onNavLinkClick: (link: string) => void;
}> = ({ isOpen, onClose, menuGroups, onNavLinkClick }) => {
  const { t } = useTranslation();

  const ref = useRef<HTMLDivElement | null>(null);
  useOnclickOutside(ref, () => {
    if (isOpen) {
      onClose();
    }
  });

  return (
    <>
      <div
        onClick={() => onClose()}
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-200 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{
          duration: 0.3,
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="fixed top-0 left-0 bottom-0 z-50 w-64 p-4 border-r  md:block bg-white"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="text-lg font-bold">{t("dasboard.title")}</div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            X
          </button>
        </div>

        <nav className="flex flex-col gap-3">
          {menuGroups.map((group) => (
            <div key={group.id}>
              {group.title && (
                <div className="text-xs font-semibold text-gray-400 uppercase mb-2 px-1">
                  {group.title}
                </div>
              )}

              <div className="flex flex-col gap-1">
                {group.items.map((item: MenuItem) => (
                  <button
                    key={item.key}
                    onClick={() => item.link && onNavLinkClick(item.link)}
                    className="flex items-center gap-4 w-full px-3 py-1.5 hover:bg-gray-100"
                  >
                    <span className="text-slate-600 w-4 h-4">
                      {item.icons || ""}
                    </span>
                    <span className="text-sm mt-1.5">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </motion.aside>
    </>
  );
};

export default Sidebar;
