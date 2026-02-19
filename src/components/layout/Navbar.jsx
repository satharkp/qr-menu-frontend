import LogoutButton from "../common/LogoutButton";

export default function Navbar({ title }) {
  return (
    <div className="w-full bg-white shadow-premium border-b border-greenleaf-accent px-8 py-5 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md bg-white/80">
      <h1 className="text-2xl font-serif text-greenleaf-primary font-bold tracking-tight">{title}</h1>
      <LogoutButton />
    </div>
  );
}