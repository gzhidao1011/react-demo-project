import { useNavigate } from "react-router";

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div>
      <div>dddd</div>
      <div>
        <button onClick={() => navigate("/sign-in")}>Sign In</button>
      </div>
      <div>
        <button onClick={() => navigate("/sign-up")}>Sign Up</button>
      </div>
    </div>
  );
}
