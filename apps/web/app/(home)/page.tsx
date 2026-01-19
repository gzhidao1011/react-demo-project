import { navigate } from "@/core/hooks/use-app-router";

function HomePage() {
  return (
    <div>
      <div>
        <button onClick={() => navigate("/sign-up")}>Sign Up</button>
      </div>
      <div>
        <button onClick={() => navigate("/sign-in")}>Sign In</button>
      </div>
    </div>
  );
}

export default HomePage;
