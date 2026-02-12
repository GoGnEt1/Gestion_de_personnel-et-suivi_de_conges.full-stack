import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

export const exportPdf = async (
  ficheRef: React.RefObject<HTMLDivElement>,
  filename: string,
) => {
  if (!ficheRef.current) return;

  const element = ficheRef.current;
  // convertir en canvas avec html2canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "ffffff",
  });
  const imgData = canvas.toDataURL("image/png");

  // créer un document pdf A4
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();

  // adapter l'image au format A4
  const marginX = 10;
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pageWidth - marginX * 2;
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(imgData, "PNG", marginX / 2, 5, pdfWidth, pdfHeight);

  pdf.save(`fiche_personnel_${filename || ""}.pdf`);
};
