export function slugify(text: string) {
  return (
    text
      .toString()
      // .toUpperCase()
      .normalize("NFD") // enlever les accents
      .replace(/[\u0300-\u036f]/g, "") // enlever les accents
      .replace(/[^a-zA-Z0-9-]/g, "") // enlever tout ce qui n'est pas un chiffre, une lettre ou un tiret
      // .replace(/[^\w\s-]/g, "") // enlever tout ce qui n'est pas un chiffre, une lettre ou un tiret
      .replace(/\s+/g, "-") // remplacer les espaces par des tirets
      .replace(/[^\w-]+/g, "") // enlever tout ce qui n'est pas un chiffre, une lettre ou un tiret
      .replace(/--+/g, "-") // remplacer les doubles tirets par un seul
      .replace(/^-+/, "") // enlever les tirets en debut
      .replace(/-+$/, "") // enlever les tirets en fin
      .trim()
  ); // enlever les espaces en debut et en fin
}
