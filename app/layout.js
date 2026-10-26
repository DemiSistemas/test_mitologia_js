import "./globals.css";

export const metadata = {
  title: "Test de mitología | Demigods ARG",
  description: "Test de mitología de Demigods ARG",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
