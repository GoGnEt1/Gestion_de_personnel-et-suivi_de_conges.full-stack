export const formatDateTime = (value: string) => {
  const date = new Date(value);

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(date)
    .replace(",", " à");
};

export const formatDate = (value: string) => {
  const date = new Date(value);

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

export const formatTime = (value: string) => {
  return value.slice(0, 5); // "08:24:00" → "08:24"
};
