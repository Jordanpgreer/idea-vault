import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="shell" style={{ display: "grid", placeItems: "center", minHeight: "70vh" }}>
      <div className="glass" style={{ padding: "1rem" }}>
        <SignIn />
      </div>
    </div>
  );
}
