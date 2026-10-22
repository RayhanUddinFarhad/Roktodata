import { WhatsAppIcon } from "@/components/BrandIcons";
import { whatsappLink } from "@/lib/data";

// Opens a WhatsApp chat with the number and a ready-to-send message, so people can leave a message
// when a donor doesn't pick up. Styled to sit next to the green call button.
export default function WhatsAppButton({
  phone,
  message,
  label = "WhatsApp",
  size = "sm",
  onClick,
}: {
  phone: string;
  message: string;
  label?: string;
  size?: "sm" | "md";
  onClick?: () => void;
}) {
  return (
    <a
      href={whatsappLink(phone, message)}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      title="এই নাম্বারে WhatsApp থাকলে মেসেজ পাঠান"
      aria-label={`${phone} নাম্বারে WhatsApp মেসেজ পাঠান`}
      className={`flex items-center gap-1 rounded-md border border-[#25D366] bg-white font-semibold text-[#0a6b60] hover:bg-[#25D366] hover:text-white ${
        size === "md" ? "rounded-lg px-4 py-2 text-xs" : "px-3 py-1.5 text-xs"
      }`}
    >
      <WhatsAppIcon className={size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"} />
      {label}
    </a>
  );
}
