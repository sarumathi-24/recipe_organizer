import { useLocation, useNavigate } from "react-router-dom";

const HIDDEN_PATHS = new Set(["/"]);

export default function PageBackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  if (HIDDEN_PATHS.has(location.pathname)) {
    return null;
  }

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/recipes");
  }

  return (
    <button className="page-back-button" type="button" onClick={handleBack} aria-label="Go back" title="Go back">
      <span aria-hidden="true">&larr;</span>
    </button>
  );
}
