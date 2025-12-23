export const GoogleSignInButton = () => {
  return (
    <button
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 16px",
        backgroundColor: "#fff",
        border: "1px solid #dadce0",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "500",
        color: "#3c4043",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: "10px" }}>
        <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.71-1.58 2.68-3.9 2.68-6.62z" />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.95v2.33C2.43 16.05 5.45 18 9 18z"
        />
        <path fill="#FBBC05" d="M3.96 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.95a8.99 8.99 0 0 0 0 8.08l3.01-2.33z" />
        <path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0 5.45 0 2.43 1.95.95 4.96l3.01 2.33C4.67 5.16 6.66 3.58 9 3.58z"
        />
      </svg>
      Sign in with Google
    </button>
  );
};
