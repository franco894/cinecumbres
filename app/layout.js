import './globals.css';

export const metadata = {
  title: 'Reservas Cumbres — Cumbres de Santa María',
  description: 'Sistema de reservas de instalaciones para residentes de Cumbres de Santa María',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
