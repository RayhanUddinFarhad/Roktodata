import { THANAS_BY_DISTRICT } from "@/lib/locations";

// Thana/upazila dropdown for the chosen district. Disabled until a district is picked.
// `emptyLabel` is the first option: e.g. "সকল থানা" for filters, or a prompt for required fields.
export default function ThanaSelect({
  district,
  value,
  onChange,
  required,
  emptyLabel = "থানা / উপজেলা নির্বাচন করুন",
  className,
}: {
  district: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  emptyLabel?: string;
  className?: string;
}) {
  const entry = district ? THANAS_BY_DISTRICT[district] : undefined;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={!entry}
      className={`${className ?? ""} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {entry ? (
        <option value="" disabled={required}>
          {emptyLabel}
        </option>
      ) : (
        <option value="">আগে জেলা নির্বাচন করুন</option>
      )}
      {entry &&
        (entry.cityThanas ? (
          <>
            <optgroup label="সিটি / মেট্রো থানা">
              {entry.cityThanas.map((name) => (
                <option key={`city-${name}`} value={name}>
                  {name}
                </option>
              ))}
            </optgroup>
            <optgroup label="উপজেলা">
              {entry.upazilas.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </optgroup>
          </>
        ) : (
          entry.upazilas.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))
        ))}
    </select>
  );
}
