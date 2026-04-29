import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Katapixel — Telephone Drawing Game',
  description: 'Permainan pesan berantai digital dengan gambar. Mainkan bersama 4-10 teman!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
