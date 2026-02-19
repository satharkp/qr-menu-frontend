export default function LogoutButton() {
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <button
      onClick={logout}
      className="bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600"
    >
      Logout
    </button>
  );
}