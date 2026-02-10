import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="shell" style={{ display: "grid", placeItems: "center", minHeight: "70vh" }}>
      <div className="glass" style={{ padding: "1rem" }}>
        <SignUp />
      </div>
    </div>
  );
}
