import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute, SigninForm, SignupForm } from "@/components/auth";
import UserProfilePage from "@/pages/UserProfilePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SigninForm />} />
        <Route path="/signup" element={<SignupForm />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<UserProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
