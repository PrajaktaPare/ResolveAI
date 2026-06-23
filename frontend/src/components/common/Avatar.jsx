import { cn } from "@/utils/cn";
import { initials } from "@/utils/helpers";

export function Avatar({ name = "", src, size = "default", className }) {
  const dims = { sm: "size-8 text-xs", default: "size-10 text-sm", lg: "size-14 text-base" }[size];

  return (
    <span
      className={cn(
        "inline-grid place-items-center overflow-hidden rounded-full bg-primary/12 font-semibold text-primary",
        dims,
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{initials(name) || "?"}</span>
      )}
    </span>
  );
}
