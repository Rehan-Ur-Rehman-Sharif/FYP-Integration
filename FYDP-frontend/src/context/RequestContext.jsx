import React, { createContext, useContext, useState } from "react";

const RequestContext = createContext();

export const RequestProvider = ({ children }) => {
  const [requests, setRequests] = useState([]);

  const addRequest = (newRequest) => {
    setRequests(prev => {
      const updated = [...prev, newRequest];
      console.log("🌍 Global requests updated:", updated);
      return updated;
    });
  };

  return (
    <RequestContext.Provider value={{ requests, addRequest }}>
      {children}
    </RequestContext.Provider>
  );
};

export const useRequests = () => {
  return useContext(RequestContext);
};
