import DialerProvider from "./Providers/Dashboard/DialerProvider";
import FormProvider from "./Providers/Dashboard/FormProvider";
import SocketProvider from "./Providers/Dashboard/SocketProvider";

const DashboardContexts = ({ children }) => {
  return (
    <DialerProvider>
      <FormProvider>
        <SocketProvider>{children}</SocketProvider>
      </FormProvider>
    </DialerProvider>
  );
};

export default DashboardContexts;
