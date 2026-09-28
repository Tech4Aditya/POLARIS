import "./globals.css";
export const metadata = {
  title: "POLARIS-Polar Science Intelligence",
  description: "Integrated polar science knowledge and outreach platform",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/favicon.svg" }
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
