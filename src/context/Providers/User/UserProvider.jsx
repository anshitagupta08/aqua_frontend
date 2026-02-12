import { useState, useEffect } from "react";
import UserContext from "../../User/UserContext";

const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    setUserData(JSON.parse(localStorage.getItem("userData")));
  }, []);

  const getUser = () => {
    const data = localStorage.getItem("userData");
    return data ? JSON.parse(data) : null;
  };

  const setUser = (data) => {
    localStorage.setItem("userData", JSON.stringify(data));
    setUserData(data);
  };

  const clearUser = () => {
    localStorage.removeItem("userData");
    setUserData(null);
  };

  return (
    <UserContext.Provider value={{ userData, getUser, setUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
