import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router"; // react-router-dom에서 BrowserRouter 임포트 확인
import "./index.css";
import App from "./App.jsx";

// --- TanStack Query 관련 추가 ---
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/reactQueryConfig'; // 여기에서 queryClient를 임포트

// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // 개발 도구 (선택 사항)
// --- TanStack Query 관련 추가 끝 ---


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);