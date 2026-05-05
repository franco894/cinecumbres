import './globals.css';

export const metadata = {
  title: 'CineCumbres — Reserva tu Sala de Cine',
  description: 'Sistema de reservas de la sala de cine comunitaria de Cumbres de Santa María',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
