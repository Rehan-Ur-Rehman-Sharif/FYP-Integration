import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./routes";
import "./index.css";
import { RequestProvider } from "./context/RequestContext";

createRoot(document.getElementById("root")).render(
  <RequestProvider>
    <RouterProvider router={router} />
  </RequestProvider>
);
