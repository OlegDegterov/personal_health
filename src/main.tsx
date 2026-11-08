import { createRoot } from "react-dom/client";
import App from "./App";
import { ConfigProvider } from "./config";
import "./styles.css";

// No StrictMode: double-mounted effects would replay the CRT animations and recreate canvas widgets.
createRoot(document.getElementById("root")!).render(
  <ConfigProvider>
    <App />
  </ConfigProvider>,
);
