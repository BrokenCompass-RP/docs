import "./globals.css";

export const metadata = {
  title: "Broken Compass Knowledge",
  description: "Role-aware knowledge for the Broken Compass community."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
