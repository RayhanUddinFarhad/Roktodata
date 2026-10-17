import { Droplet } from "lucide-react";

export default function LogoMark({
  className = "h-8 w-8",
  gradient = "bg-linear-to-br from-red-600 to-indigo-900",
}: {
  className?: string;
  gradient?: string;
}) {
  return (
    <span className={`flex items-center justify-center rounded-full text-white ${gradient} ${className}`}>
      <Droplet className="h-1/2 w-1/2" fill="currentColor" />
    </span>
  );
}
