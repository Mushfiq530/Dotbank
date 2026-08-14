import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./router/AppRoutes";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-surface-sunk dark:bg-surfaceDark-sunk transition-colors duration-300">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
