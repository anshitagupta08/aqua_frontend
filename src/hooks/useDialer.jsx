import { useContext } from "react";
import DialerContext from "../context/Dashboard/DialerContext";

const useDialer = () => {
  const context = useContext(DialerContext);

  if (!context) {
    throw new Error("useDialer must be used within a DialerProvider");
  }

  return context;
};

export default useDialer;
