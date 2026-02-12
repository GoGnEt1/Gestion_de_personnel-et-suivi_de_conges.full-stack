const rendersBoxes = (text: string | number, length: number) => {
  const chars =
    typeof text === "string" ? text.split(" ").join("").split("") : "";

  return (
    <div className="flex space-x-1" dir="ltr">
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className="w-6.5 h-6.5 border border-black flex items-center justify-center text-sm font-medium"
        >
          {(chars ? chars[i] : text) || ""}
        </div>
      ))}
    </div>
  );
};

export default rendersBoxes;
