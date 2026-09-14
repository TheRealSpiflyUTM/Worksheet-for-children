import { BrowserRouter, Routes, Route } from "react-router-dom";
import AvatarExample from "./Avatar";
import MenuExample from "./Menu";
import AuthExample from "./Auth";
import './All.css'

function All() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div className="main-page">
              <AvatarExample />
              <MenuExample />
            </div>
          }
        />

        <Route
          path="/auth"
          element={<AuthExample />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default All;