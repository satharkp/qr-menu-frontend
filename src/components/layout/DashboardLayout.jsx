import Navbar from "./Navbar";

export default function DashboardLayout({ title, children, hideNavbar = false }) {
  return (
    <div className="bg-greenleaf-bg min-h-screen selection:bg-greenleaf-secondary/20">
      {!hideNavbar && <Navbar title={title} />}
      <main className={`${hideNavbar ? "p-0" : "p-4 md:p-8 lg:p-12"} animate-in fade-in duration-700`}>
        {children}
      </main>
    </div>
  );
}