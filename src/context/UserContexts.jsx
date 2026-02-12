import AuthProvider from "./Providers/User/AuthProvider";
import UserProvider from "./Providers/User/UserProvider";

const Contexts = ({ children }) => {
  return (
    <AuthProvider>
      <UserProvider>{children}</UserProvider>
    </AuthProvider>
  );
};

export default Contexts;
