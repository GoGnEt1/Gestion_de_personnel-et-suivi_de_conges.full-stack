import React, { useEffect } from "react";

const AlerteMessage: React.FC<{
  errorMessage: string;
  successMessage: string;
  clearMessage: () => void;
}> = ({ errorMessage, successMessage, clearMessage }) => {
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        clearMessage();
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage, clearMessage]);

  return (
    <div>
      {errorMessage ? (
        <div className="text-center border bg-red-100 text-red-700 border-red-400 px-3 py-1 rounded mb-4">
          {errorMessage}
        </div>
      ) : successMessage ? (
        <div className="border bg-green-100 text-green-700 border-green-400 px-3 py-1 rounded mb-4">
          {successMessage}
        </div>
      ) : null}
    </div>
  );
};

export default AlerteMessage;
