import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import axios from "axios";
import router from "./routes";
import "./index.css";
import { RequestProvider } from "./context/RequestContext";

// Login/SignUp use plain axios; ngrok free tier returns HTML without this header.
axios.defaults.headers.common["ngrok-skip-browser-warning"] = "true";

createRoot(document.getElementById("root")).render(
  <RequestProvider>
    <RouterProvider router={router} />
  </RequestProvider>
);
