import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

type ConfirmationProps = {
  message: string;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const Confirmation: React.FC<ConfirmationProps> = ({
  message,
  isOpen,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative bg-white p-5 rounded-xl shadow-lg max-w-md w-full z-10"
      >
        <h3 className="text-sm lg:text-base font-semibold mb-4 text-center">
          {t(message)}
        </h3>

        <div className="flex justify-between gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-500 text-white py-1.5 rounded-md hover:bg-gray-600"
          >
            {t("regleForm.cancel")}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onConfirm}
            className="flex-1 bg-green-500 text-white py-1.5 rounded-md hover:bg-green-600"
          >
            {t("regleForm.confirm")}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default Confirmation;
