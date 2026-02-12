import { useTranslation } from "react-i18next";
type LigneFicheProps = {
  label: string;
  value?: React.ReactNode;
  emptyLines?: number;
  _width?: string;
};
const LigneFiche = ({
  label,
  value,
  emptyLines = 1,
  _width = "w-40",
}: LigneFicheProps) => {
  const { i18n } = useTranslation();
  return (
    <div className="flex items-start text-sm md:text-base mb-3">
      {/* Label */}
      <div
        className={`${i18n.language === "ar" ? "w-35" : _width} shrink-0 font-semibold`}
      >
        {label}:
      </div>

      {/* Valeur ou pointillés */}
      <div className="flex-1">
        {value ? (
          <span>{value}</span>
        ) : (
          Array.from({ length: emptyLines }).map((_, i) => (
            <div
              key={i}
              className="border-b border-dotted border-black h-5 mb-1"
            />
          ))
        )}
      </div>
    </div>
  );
};

export default LigneFiche;
